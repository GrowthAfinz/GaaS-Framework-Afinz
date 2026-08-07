import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { usePeriod } from '../contexts/PeriodContext';
import { supabase } from '../services/supabaseClient';
import type {
  AppsFlyerAuditActivity,
  AppsFlyerAuditCase,
  AppsFlyerAuditDay,
  AppsFlyerAuditDecision,
  AuditDecisionStatus,
  AuditRuleCode,
  AuditStatus,
} from '../types/appsflyerAudit';

interface ActivityRow {
  'Activity name / Taxonomia': string | null;
  'Data de Disparo': string | null;
  'Segmento': string | null;
  'Canal': string | null;
  jornada: string | null;
  template_id: string | null;
}

interface TemplateDailyRow {
  business_date: string;
  template_id: string;
  af_installs: number | null;
}

const text = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;
const dateOnly = (value: string | null | undefined) => value?.slice(0, 10) || '';
const normalizedId = (value: string | null | undefined) => value?.trim().toLowerCase() || '';

function dispatchNumber(name: string): number | null {
  const match = name.match(/(?:disp(?:aro)?|[_-]d)0*(\d+)(?:s\d+|[_-]|$)/i);
  return match ? Number(match[1]) : null;
}

function caseKey(templateId: string, names: string[]) {
  return `${normalizedId(templateId)}::${names.map(name => name.toLowerCase()).sort().join('::')}`;
}

function baseClassification(names: string[], hasAppsFlyer: boolean): {
  status: AuditStatus;
  suggestedRule: AuditRuleCode;
  reasons: string[];
} {
  if (!hasAppsFlyer) return {
    status: 'no_appsflyer', suggestedRule: 'none',
    reasons: ['Activity e template ligados', 'Nenhum install AppsFlyer encontrado no recorte'],
  };
  if (names.length === 1) return {
    status: 'synchronized', suggestedRule: 'exact_unique',
    reasons: ['Mesmo template_id em Activities e AppsFlyer', 'Uma única Activity Name elegível'],
  };
  const dispatches = new Set(names.map(dispatchNumber).filter((value): value is number => value != null));
  const d2d4 = dispatches.has(2) && dispatches.has(4);
  const unexpected = [...dispatches].some(value => value !== 2 && value !== 4);
  if (d2d4 && !unexpected) return {
    status: 'rule_d2_d4', suggestedRule: 'd2_d4_cutover',
    reasons: ['Mesmo template_id nas Activities D2 e D4', 'Regra governada: D4 reutiliza o conteúdo de D2', 'Total observado será preservado'],
  };
  if (d2d4 && unexpected) return {
    status: 'conflict', suggestedRule: 'none',
    reasons: ['D2 e D4 encontrados', 'Existe outra Activity usando o mesmo template_id', 'Cadastro precisa ser corrigido antes da atribuição'],
  };
  return {
    status: 'shared', suggestedRule: 'none',
    reasons: ['Mais de uma Activity usa o mesmo template_id', 'Nenhuma regra governada explica o compartilhamento'],
  };
}

export function useAppsFlyerAudit() {
  const { startDate, endDate } = usePeriod();
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [templateDays, setTemplateDays] = useState<TemplateDailyRow[]>([]);
  const [decisions, setDecisions] = useState<AppsFlyerAuditDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const from = format(startDate, 'yyyy-MM-dd');
  const to = format(endDate, 'yyyy-MM-dd');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (import.meta.env.DEV && window.location.hash === '#appsflyer-audit-preview') {
      setActivities([
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_email_bsp_disp2s2copaopen_pontual', 'Data de Disparo': '2026-08-01T12:00:00Z', Segmento: 'Base Proprietária', Canal: 'E-mail', jornada: 'JOR_AQUISICAO_B2C_COPA', template_id: 'b2c_email_copa_bsp_S2D02' },
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_email_bsp_disp4s2copanotopen_pontual', 'Data de Disparo': '2026-08-03T12:00:00Z', Segmento: 'Base Proprietária', Canal: 'E-mail', jornada: 'JOR_AQUISICAO_B2C_COPA', template_id: 'b2c_email_copa_bsp_S2D02' },
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_email_bsp_disp2s1copaopen_pontual', 'Data de Disparo': '2026-08-01T14:00:00Z', Segmento: 'Negados', Canal: 'E-mail', jornada: 'JOR_AQUISICAO_B2C_COPA', template_id: 'b2c_email_copa_bsp_S1D02' },
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_email_bsp_disp3s1copanotopen_pontual', 'Data de Disparo': '2026-08-02T14:00:00Z', Segmento: 'Negados', Canal: 'E-mail', jornada: 'JOR_AQUISICAO_B2C_COPA', template_id: 'b2c_email_copa_bsp_S1D02' },
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_email_bsp_disp4s1copa_pontual', 'Data de Disparo': '2026-08-03T14:00:00Z', Segmento: 'Negados', Canal: 'E-mail', jornada: 'JOR_AQUISICAO_B2C_COPA', template_id: 'b2c_email_copa_bsp_S1D02' },
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_wpp_ngd_d1_pontual', 'Data de Disparo': '2026-08-04T10:00:00Z', Segmento: 'Negados', Canal: 'WhatsApp', jornada: 'JOR_REPESCAGEM_COPA', template_id: 'b2c_wpp_copa_ngd_d1' },
        { 'Activity name / Taxonomia': 'afz_car_vis_aqs_push_car_d3_diario', 'Data de Disparo': '2026-08-05T10:00:00Z', Segmento: 'Abandonados', Canal: 'Push', jornada: 'JOR_CARRINHO_COPA', template_id: null },
      ]);
      setTemplateDays([
        { business_date: '2026-08-01', template_id: 'b2c_email_copa_bsp_S2D02', af_installs: 24 },
        { business_date: '2026-08-02', template_id: 'b2c_email_copa_bsp_S2D02', af_installs: 15 },
        { business_date: '2026-08-03', template_id: 'b2c_email_copa_bsp_S2D02', af_installs: 19 },
        { business_date: '2026-08-04', template_id: 'b2c_email_copa_bsp_S2D02', af_installs: 11 },
        { business_date: '2026-08-01', template_id: 'b2c_email_copa_bsp_S1D02', af_installs: 18 },
        { business_date: '2026-08-02', template_id: 'b2c_email_copa_bsp_S1D02', af_installs: 12 },
        { business_date: '2026-08-03', template_id: 'b2c_email_copa_bsp_S1D02', af_installs: 9 },
        { business_date: '2026-08-04', template_id: 'b2c_wpp_copa_ngd_d1', af_installs: 213 },
      ]);
      setDecisions([]);
      setLoading(false);
      return;
    }
    const [activityResult, templateResult, decisionResult] = await Promise.all([
      supabase
        .from('activities')
        .select('"Activity name / Taxonomia", "Data de Disparo", "Segmento", "Canal", jornada, template_id')
        .gte('"Data de Disparo"', from)
        .lte('"Data de Disparo"', `${to} 23:59:59`)
        .order('"Data de Disparo"'),
      supabase
        .from('appsflyer_template_daily')
        .select('business_date, template_id, af_installs')
        .gte('business_date', from)
        .lte('business_date', to)
        .order('business_date'),
      supabase
        .from('appsflyer_audit_decisions')
        .select('*'),
    ]);
    const requiredError = activityResult.error || templateResult.error;
    if (requiredError) setError(requiredError.message);
    setActivities(activityResult.error ? [] : (activityResult.data ?? []) as ActivityRow[]);
    setTemplateDays(templateResult.error ? [] : (templateResult.data ?? []) as TemplateDailyRow[]);
    // A migration pode ainda não estar aplicada durante desenvolvimento; a auditoria continua read-only.
    setDecisions(decisionResult.error ? [] : (decisionResult.data ?? []) as AppsFlyerAuditDecision[]);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);

  const model = useMemo(() => {
    const installsByTemplate = new Map<string, { total: number; dates: string[] }>();
    for (const row of templateDays) {
      const id = normalizedId(row.template_id);
      if (!id) continue;
      const current = installsByTemplate.get(id) ?? { total: 0, dates: [] };
      current.total += Number(row.af_installs ?? 0);
      current.dates.push(row.business_date);
      installsByTemplate.set(id, current);
    }

    const rowsByTemplate = new Map<string, ActivityRow[]>();
    const withoutTemplate: AppsFlyerAuditActivity[] = [];
    for (const row of activities) {
      const activityName = text(row['Activity name / Taxonomia'], 'Activity sem nome');
      const dispatchDate = dateOnly(row['Data de Disparo']);
      const templateId = row.template_id?.trim() || null;
      if (!templateId) {
        withoutTemplate.push({
          key: `${activityName}::${dispatchDate}`, activityName, dispatchDate, templateId: null,
          segment: text(row.Segmento, 'Não classificado'), channel: text(row.Canal, 'N/A'),
          journey: text(row.jornada, 'Sem jornada'), status: 'no_template', caseKey: null,
        });
        continue;
      }
      const id = normalizedId(templateId);
      rowsByTemplate.set(id, [...(rowsByTemplate.get(id) ?? []), row]);
    }

    const decisionsByCase = new Map(decisions.map(decision => [decision.case_key, decision]));
    const cases: AppsFlyerAuditCase[] = [];
    const linkedActivities: AppsFlyerAuditActivity[] = [];

    for (const rows of rowsByTemplate.values()) {
      const templateId = rows[0].template_id!.trim();
      const names = [...new Set(rows.map(row => text(row['Activity name / Taxonomia'], 'Activity sem nome')))].sort();
      const key = caseKey(templateId, names);
      const appsFlyer = installsByTemplate.get(normalizedId(templateId));
      const classification = baseClassification(names, !!appsFlyer);
      const decision = decisionsByCase.get(key) ?? null;
      const status: AuditStatus = decision?.decision_status === 'approved'
        ? 'approved'
        : decision?.decision_status === 'shared'
          ? 'shared'
          : decision?.decision_status === 'conflict'
            ? 'conflict'
            : classification.status;
      const caseActivities = rows.map(row => ({
        key: `${text(row['Activity name / Taxonomia'], 'Activity sem nome')}::${dateOnly(row['Data de Disparo'])}`,
        activityName: text(row['Activity name / Taxonomia'], 'Activity sem nome'),
        dispatchDate: dateOnly(row['Data de Disparo']), templateId,
        segment: text(row.Segmento, 'Não classificado'), channel: text(row.Canal, 'N/A'),
        journey: text(row.jornada, 'Sem jornada'), status, caseKey: key,
      }));
      linkedActivities.push(...caseActivities);
      cases.push({
        caseKey: key, templateId, activityNames: names, activities: caseActivities, status,
        suggestedRule: classification.suggestedRule, installs: appsFlyer?.total ?? 0,
        appsFlyerDates: [...new Set(appsFlyer?.dates ?? [])], reasons: classification.reasons, decision,
      });
    }

    const allActivities = [...linkedActivities, ...withoutTemplate];
    const dayMap = new Map<string, AppsFlyerAuditDay>();
    for (const activity of allActivities) {
      if (!activity.dispatchDate) continue;
      const day = dayMap.get(activity.dispatchDate) ?? { date: activity.dispatchDate, installs: 0, dispatches: 0, segments: {} };
      day.dispatches += 1;
      day.segments[activity.segment] = (day.segments[activity.segment] ?? 0) + 1;
      dayMap.set(activity.dispatchDate, day);
    }
    for (const row of templateDays) {
      const day = dayMap.get(row.business_date) ?? { date: row.business_date, installs: 0, dispatches: 0, segments: {} };
      day.installs += Number(row.af_installs ?? 0);
      dayMap.set(row.business_date, day);
    }

    return {
      cases: cases.sort((a, b) => {
        const priority: Record<AuditStatus, number> = { conflict: 0, shared: 1, rule_d2_d4: 2, no_appsflyer: 3, approved: 4, synchronized: 5, no_template: 6 };
        return priority[a.status] - priority[b.status] || b.installs - a.installs;
      }),
      activities: allActivities.sort((a, b) => a.dispatchDate.localeCompare(b.dispatchDate)),
      days: [...dayMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [activities, decisions, templateDays]);

  const decide = useCallback(async (
    auditCase: AppsFlyerAuditCase,
    decisionStatus: AuditDecisionStatus,
    ruleCode: AuditRuleCode,
    notes?: string,
  ) => {
    setSaving(auditCase.caseKey);
    setError(null);
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      setError('Faça login para registrar uma decisão auditável. A visualização permanece disponível.');
      setSaving(null);
      return false;
    }
    const payload: AppsFlyerAuditDecision = {
      case_key: auditCase.caseKey,
      template_id: auditCase.templateId,
      activity_names: auditCase.activityNames,
      decision_status: decisionStatus,
      rule_code: ruleCode,
      allocation_config: ruleCode === 'd2_d4_cutover' ? { version: 1, method: 'latest_eligible_dispatch' } : {},
      notes: notes?.trim() || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    };
    const { error: saveError } = await supabase.from('appsflyer_audit_decisions').upsert(payload, { onConflict: 'case_key' });
    if (saveError) {
      setError(saveError.message);
      setSaving(null);
      return false;
    }
    await load();
    setSaving(null);
    return true;
  }, [load]);

  return { ...model, loading, saving, error, refetch: load, decide, range: { from, to } };
}
