import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  differenceInCalendarDays,
  format,
  isAfter,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Presentation,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface RunRow {
  id: string;
  status: string;
  active_run?: boolean | null;
  publication_valid?: boolean | null;
  publication_status?: string | null;
  sheet_url: string | null;
  slides_url: string | null;
  error_detail: string | null;
  rows_inserted: number | null;
  period_start: string | null;
  period_end: string | null;
}

type SourceStatus = 'ready' | 'stale' | 'blocked';
type GateStatus = 'ready' | 'limited' | 'blocked';

interface SourceCheck {
  key: 'crm' | 'media' | 'b2c';
  label: string;
  description: string;
  latestDate: string | null;
  status: SourceStatus;
  detail: string;
}

interface PreflightResult {
  gate: GateStatus;
  expectedDate: string;
  checkedAt: Date;
  sources: SourceCheck[];
}

interface RuntimeSetting {
  maintenance: boolean;
  message: string | null;
}

type ReportLiveRole = 'viewer' | 'analyst' | 'publisher' | 'admin';

interface ReportAccess {
  role: ReportLiveRole | null;
  active: boolean;
  capabilities: {
    download: boolean;
    generate: boolean;
    publish: boolean;
    manage_members: boolean;
  };
}

interface ReportMember {
  user_id: string;
  email: string;
  role: ReportLiveRole;
  active: boolean;
}

const ROLE_LABELS: Record<ReportLiveRole, string> = {
  viewer: 'Leitor',
  analyst: 'Analista',
  publisher: 'Publicador',
  admin: 'Administrador',
};

const STAGES: Array<{ key: RunRow['status']; label: string }> = [
  { key: 'queued', label: 'Na fila' },
  { key: 'building', label: 'Calculando e preservando as fontes' },
  { key: 'certifying', label: 'Validando o relatório' },
  { key: 'writing_sheets', label: 'Sincronizando dados na planilha' },
  { key: 'generating_narrative', label: 'Preparando narrativa do rascunho' },
  { key: 'refreshing_slides', label: 'Atualizando deck e gráficos vinculados' },
  { key: 'publishing', label: 'Verificando a publicação' },
];

const ACTIVE_STATUSES = new Set(STAGES.map(stage => stage.key));
const FAILED_STATUSES = new Set(['error', 'rejected', 'stale', 'publication_failed', 'rollback_failed']);
const RUN_FIELDS = 'id,status,active_run,publication_valid,publication_status,sheet_url,slides_url,error_detail,rows_inserted,period_start,period_end';
const isRunActive = (value: RunRow | null): boolean => Boolean(value &&
  !FAILED_STATUSES.has(value.status) && !['done', 'superseded'].includes(value.status) &&
  (value.active_run === true || ACTIVE_STATUSES.has(value.status) || value.publication_status === 'publishing'));

const stageIndex = (status: RunRow['status']): number =>
  Math.max(0, STAGES.findIndex(stage => stage.key === (['built', 'certified'].includes(status) ? 'certifying' : status)));

const formatSourceDate = (date: string | null): string => {
  if (!date) return 'Sem dado no período';
  return format(parseISO(date.slice(0, 10)), 'dd/MM/yyyy');
};

const buildSourceCheck = (
  key: SourceCheck['key'],
  label: string,
  description: string,
  latestDate: string | null,
  expectedDate: string,
  error?: string,
): SourceCheck => {
  if (error) {
    return {
      key,
      label,
      description,
      latestDate: null,
      status: 'blocked',
      detail: 'Não foi possível consultar esta fonte.',
    };
  }

  if (!latestDate) {
    return {
      key,
      label,
      description,
      latestDate: null,
      status: 'blocked',
      detail: 'Nenhum registro encontrado no período selecionado.',
    };
  }

  const normalizedDate = latestDate.slice(0, 10);
  const delay = differenceInCalendarDays(parseISO(expectedDate), parseISO(normalizedDate));

  if (delay <= 0) {
    return {
      key,
      label,
      description,
      latestDate: normalizedDate,
      status: 'ready',
      detail: 'Atualizada até o último dia fechado.',
    };
  }

  if (delay > 2) {
    return {
      key,
      label,
      description,
      latestDate: normalizedDate,
      status: 'blocked',
      detail: `${delay} dias de defasagem; excede o limite de 2 dias do Report Live.`,
    };
  }

  return {
    key,
    label,
    description,
    latestDate: normalizedDate,
    status: 'stale',
    detail: `${delay} ${delay === 1 ? 'dia' : 'dias'} de defasagem.`,
  };
};

interface ReportLiveCardProps {
  periodStart: Date;
  periodEnd: Date;
}

export const ReportLiveCard: React.FC<ReportLiveCardProps> = ({ periodStart, periodEnd }) => {
  const [run, setRun] = useState<RunRow | null>(null);
  const [checking, setChecking] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<RuntimeSetting>({ maintenance: false, message: null });
  const [access, setAccess] = useState<ReportAccess | null>(null);
  const [members, setMembers] = useState<ReportMember[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<ReportLiveRole>('analyst');
  const [savingMember, setSavingMember] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const loadAccess = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('report-sync', {
      body: { mode: 'access' },
    });
    if (error) {
      setAccess(null);
      return;
    }
    setAccess(data as ReportAccess);
  }, []);

  const loadMembers = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('report-sync', {
      body: { mode: 'members' },
    });
    if (!error) setMembers((data?.members ?? []) as ReportMember[]);
  }, []);

  useEffect(() => {
    setPreflight(null);
    setCheckError(null);
  }, [periodEnd, periodStart]);

  useEffect(() => {
    void loadAccess();
    supabase.from('report_live_runtime_settings').select('maintenance,message').eq('id', 'live')
      .maybeSingle().then(({ data }) => {
        if (data) setRuntime(data as RuntimeSetting);
      });
    supabase
      .from('report_runs')
      .select(RUN_FIELDS)
      .eq('report_type', 'midia_paga_crm_mensal')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data?.[0]) setRun(data[0] as RunRow);
      });
    return stopPolling;
  }, [loadAccess, stopPolling]);

  useEffect(() => {
    if (access?.capabilities.manage_members) void loadMembers();
  }, [access?.capabilities.manage_members, loadMembers]);

  useEffect(() => {
    const active = isRunActive(run);
    if (!active || !run) {
      stopPolling();
      return;
    }
    if (pollRef.current) return;

    pollRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('report_runs')
        .select(RUN_FIELDS)
        .eq('id', run.id)
        .single();
      if (data) setRun(data as RunRow);
    }, 2500);

    return stopPolling;
  }, [run, stopPolling]);

  const prepareReport = useCallback(async () => {
    setChecking(true);
    setCheckError(null);

    const yesterday = subDays(startOfDay(new Date()), 1);
    const reportEnd = startOfDay(periodEnd);
    const expectedDay = isAfter(reportEnd, yesterday) ? yesterday : reportEnd;
    const expectedDate = format(expectedDay, 'yyyy-MM-dd');
    const startDate = format(periodStart, 'yyyy-MM-dd');

    if (isAfter(startOfDay(periodStart), expectedDay)) {
      setPreflight(null);
      setCheckError('O período selecionado ainda não possui um dia fechado para validação.');
      setChecking(false);
      return;
    }

    try {
      const [crmResult, mediaResult, b2cResult] = await Promise.all([
        supabase
          .from('activities')
          .select('"Data de Disparo"')
          .gte('"Data de Disparo"', `${startDate}T00:00:00`)
          .lte('"Data de Disparo"', `${expectedDate}T23:59:59`)
          .order('"Data de Disparo"', { ascending: false })
          .limit(1),
        supabase
          .from('paid_media_metrics')
          .select('date')
          .gte('date', startDate)
          .lte('date', expectedDate)
          .order('date', { ascending: false })
          .limit(1),
        supabase
          .from('b2c_daily_metrics')
          .select('data')
          .gte('data', startDate)
          .lte('data', expectedDate)
          .order('data', { ascending: false })
          .limit(1),
      ]);

      const crmRow = crmResult.data?.[0] as Record<string, string> | undefined;
      const mediaRow = mediaResult.data?.[0] as Record<string, string> | undefined;
      const b2cRow = b2cResult.data?.[0] as Record<string, string> | undefined;

      const sources = [
        buildSourceCheck(
          'crm',
          'CRM Aquisição',
          'Disparos e funil do activities',
          crmRow?.['Data de Disparo'] ?? null,
          expectedDate,
          crmResult.error?.message,
        ),
        buildSourceCheck(
          'media',
          'Mídia paga',
          'Investimento e performance por campanha',
          mediaRow?.date ?? null,
          expectedDate,
          mediaResult.error?.message,
        ),
        buildSourceCheck(
          'b2c',
          'B2C consolidado',
          'Cartões e CAC do funil consolidado',
          b2cRow?.data ?? null,
          expectedDate,
          b2cResult.error?.message,
        ),
      ];

      const crmBlocked = sources.find(source => source.key === 'crm')?.status === 'blocked';
      const hasLimitedSource = sources.some(source => source.status !== 'ready');
      const gate: GateStatus = crmBlocked ? 'blocked' : hasLimitedSource ? 'limited' : 'ready';

      setPreflight({ gate, expectedDate, checkedAt: new Date(), sources });
    } catch (error) {
      console.error('Erro ao preparar Report Live', error);
      setPreflight(null);
      setCheckError(error instanceof Error ? error.message : 'Não foi possível validar as fontes do relatório.');
    } finally {
      setChecking(false);
    }
  }, [periodEnd, periodStart]);

  const generateReport = useCallback(async () => {
    if (!preflight || preflight.gate === 'blocked' || !access?.capabilities.generate) return;
    setGenerating(true);
    setCheckError(null);
    try {
      const period_start = format(periodStart, 'yyyy-MM-dd');
      const period_end = preflight.expectedDate;
      const { data, error } = await supabase.functions.invoke('report-sync', {
        body: {
          mode: access.capabilities.publish ? 'full' : 'build',
          period_start,
          period_end,
          report_profile: 'monthly_report',
          skip_llm: true,
        },
      });
      if (error) throw error;
      const runId = String(data?.run_id ?? '');
      if (!runId) throw new Error('A atualização foi aceita, mas não retornou o identificador da execução.');
      setRun({
        id: runId,
        status: 'queued',
        sheet_url: null,
        slides_url: null,
        error_detail: null,
        rows_inserted: null,
        period_start,
        period_end,
      });
    } catch (error) {
      console.error('Erro ao atualizar Report Live', error);
      setCheckError(error instanceof Error ? error.message : 'Não foi possível iniciar a atualização do Report Live.');
    } finally {
      setGenerating(false);
    }
  }, [access, periodEnd, periodStart, preflight]);

  const publishCandidate = useCallback(async () => {
    if (!run || run.status !== 'certified' || !access?.capabilities.publish) return;
    setPublishing(true);
    setCheckError(null);
    try {
      const { data, error } = await supabase.functions.invoke('report-sync', {
        body: { mode: 'publish', run_id: run.id },
      });
      if (error) throw error;
      if (!data?.publication_id) throw new Error('A publicação foi aceita sem retornar seu identificador.');
      setRun(current => current ? {
        ...current,
        status: 'publishing',
        active_run: true,
        publication_status: 'publishing',
      } : current);
    } catch (error) {
      console.error('Erro ao publicar candidata do Report Live', error);
      setCheckError(error instanceof Error ? error.message : 'Não foi possível publicar a versão candidata.');
    } finally {
      setPublishing(false);
    }
  }, [access?.capabilities.publish, run]);

  const saveMember = useCallback(async (
    email: string,
    role: ReportLiveRole,
    active: boolean,
  ) => {
    if (!access?.capabilities.manage_members) return;
    setSavingMember(true);
    setCheckError(null);
    try {
      const { error } = await supabase.functions.invoke('report-sync', {
        body: { mode: 'set_member', member_email: email, role, active },
      });
      if (error) throw error;
      setMemberEmail('');
      await loadMembers();
    } catch (error) {
      console.error('Erro ao atualizar equipe do Report Live', error);
      setCheckError(error instanceof Error ? error.message : 'Não foi possível atualizar o acesso da equipe.');
    } finally {
      setSavingMember(false);
    }
  }, [access?.capabilities.manage_members, loadMembers]);

  const downloadPdf = useCallback(async () => {
    if (!run || run.status !== 'done' || run.publication_valid !== true || runtime.maintenance || !access?.capabilities.download) return;
    setDownloadingPdf(true);
    setCheckError(null);
    try {
      const { data, error } = await supabase.functions.invoke('report-sync', {
        body: { mode: 'export_pdf', run_id: run.id },
      });
      if (error) throw error;
      const signedUrl = String(data?.signed_url ?? '');
      if (!signedUrl) throw new Error('O PDF publicado não retornou um link de download.');

      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error(`O arquivo publicado respondeu com status ${response.status}.`);
      const objectUrl = URL.createObjectURL(await response.blob());

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `report-live-${run.period_start ?? 'publicado'}-${run.period_end ?? ''}.pdf`;
      anchor.rel = 'noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Erro ao baixar PDF publicado', error);
      setCheckError(error instanceof Error ? error.message : 'Não foi possível baixar o PDF publicado.');
    } finally {
      setDownloadingPdf(false);
    }
  }, [access?.capabilities.download, run, runtime.maintenance]);

  const inProgress = isRunActive(run);
  const published = run?.status === 'done' && run.publication_valid === true;
  const currentStage = run ? stageIndex(run.status) : -1;
  const previousRunLabel = run?.period_start && run?.period_end
    ? `${format(parseISO(run.period_start), 'dd/MM/yyyy')} – ${format(parseISO(run.period_end), 'dd/MM/yyyy')}`
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50/60 to-white">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <ShieldCheck size={19} className="shrink-0 text-cyan-600" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-800">Report Google Live</p>
            {access?.role && (
              <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">
                {ROLE_LABELS[access.role]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {access?.capabilities.generate
              ? 'Primeiro valida as fontes. Depois libera a criação da candidata e, conforme o papel, a publicação.'
              : 'Consulte as saídas publicadas. A geração requer papel de analista ou superior.'}
          </p>
        </div>
        <button
          onClick={prepareReport}
          disabled={checking || inProgress || runtime.maintenance || !access?.capabilities.generate}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-cyan-700 disabled:cursor-wait disabled:opacity-60"
        >
          {checking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {checking
            ? 'Validando...'
            : !access?.capabilities.generate
              ? 'Somente leitura'
              : preflight ? 'Validar novamente' : 'Preparar relatório'}
        </button>
      </div>

      {runtime.maintenance && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border-2 border-red-500 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{runtime.message ?? 'Report Live em manutenção controlada. Novas atualizações e downloads estão temporariamente bloqueados.'}</span>
        </div>
      )}

      {checkError && (
        <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>{checkError}</span>
        </div>
      )}

      {preflight && (
        <div className="border-t border-cyan-100 bg-white/80 px-4 py-3">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700">Validação do último dia fechado</p>
              <p className="text-[11px] text-slate-400">
                Esperado: {formatSourceDate(preflight.expectedDate)} · verificado às {format(preflight.checkedAt, 'HH:mm')}
              </p>
            </div>
            <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              preflight.gate === 'ready'
                ? 'bg-emerald-100 text-emerald-700'
                : preflight.gate === 'limited'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
            }`}>
              {preflight.gate === 'ready' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {preflight.gate === 'ready' ? 'Pronto' : preflight.gate === 'limited' ? 'Com limites' : 'Publicação bloqueada'}
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            {preflight.sources.map(source => (
              <div key={source.key} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <div className="flex items-start gap-2">
                  {source.status === 'ready' ? (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : source.status === 'stale' ? (
                    <Clock3 size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  ) : (
                    <XCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">{source.label}</p>
                    <p className="text-[11px] text-slate-400">{source.description}</p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-600">
                      Último dado: {formatSourceDate(source.latestDate)}
                    </p>
                    <p className={`text-[11px] ${
                      source.status === 'ready' ? 'text-emerald-600' : source.status === 'stale' ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {source.detail}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            preflight.gate === 'ready'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : preflight.gate === 'limited'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-red-200 bg-red-50 text-red-700'
          }`}>
            {preflight.gate === 'ready' ? <Check size={14} className="mt-0.5 shrink-0" /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" />}
            <span>
              {preflight.gate === 'ready'
                ? 'Dados prontos. A próxima etapa segura é gerar o rascunho para revisão antes de publicar.'
                : preflight.gate === 'limited'
                  ? 'CRM e mídia estão atuais, mas o consolidado B2C está defasado. O rascunho pode ser analisado apenas com essa limitação explícita.'
                  : 'A fonte obrigatória de CRM não chegou ao último dia fechado. A atualização do relatório permanece bloqueada.'}
            </span>
          </div>

          {preflight.gate !== 'blocked' && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={generateReport}
                disabled={generating || inProgress || runtime.maintenance}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {generating || inProgress
                  ? <Loader2 size={13} className="animate-spin" />
                  : <Presentation size={13} />}
                {generating || inProgress
                  ? access?.capabilities.publish ? 'Atualizando deck vivo...' : 'Gerando candidata...'
                  : access?.capabilities.publish ? 'Atualizar planilha e deck vivos' : 'Gerar versão candidata'}
              </button>
            </div>
          )}
        </div>
      )}

      {inProgress && (
        <div className="space-y-1.5 border-t border-cyan-100 bg-white/70 px-4 py-3">
          <p className="mb-2 text-xs font-bold text-slate-700">Atualização anterior ainda em andamento</p>
          {STAGES.map((stage, index) => (
            <div key={stage.key} className="flex items-center gap-2 text-xs">
              {index < currentStage ? (
                <Check size={13} className="shrink-0 text-emerald-500" />
              ) : index === currentStage ? (
                <Loader2 size={13} className="shrink-0 animate-spin text-cyan-600" />
              ) : (
                <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-slate-300" />
              )}
              <span className={index <= currentStage ? 'font-semibold text-slate-700' : 'text-slate-400'}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {published && run && (
        <div className="border-t border-cyan-100 bg-slate-50/70 px-4 py-3">
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Última saída disponível{previousRunLabel ? ` · ${previousRunLabel}` : ''}
            {run.rows_inserted != null && run.rows_inserted > 0 ? ` · ${run.rows_inserted} linhas sincronizadas` : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {run.sheet_url && (
              <a
                href={run.sheet_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                <FileSpreadsheet size={13} /> Planilha <ExternalLink size={11} />
              </a>
            )}
            {run.slides_url && (
              <a
                href={run.slides_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50"
              >
                <Presentation size={13} /> Apresentação <ExternalLink size={11} />
              </a>
            )}
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloadingPdf || runtime.maintenance || !access?.capabilities.download}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-60"
            >
              {downloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />}
              {downloadingPdf ? 'Preparando PDF...' : 'Baixar PDF'}
            </button>
          </div>
        </div>
      )}

      {run && !inProgress && !published && !FAILED_STATUSES.has(run.status) && (
        <div className="border-t border-amber-100 bg-amber-50/60 px-4 py-3 text-xs text-amber-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {run.status === 'certified'
                ? 'Versão candidata certificada. A planilha e o deck vivos ainda não foram atualizados.'
                : run.status === 'superseded'
                  ? 'Esta execução foi substituída por outra versão.'
                  : `Execução encerrada com estado “${run.status}”. Publicação não confirmada.`}
            </span>
            {run.status === 'certified' && access?.capabilities.publish && (
              <button
                type="button"
                onClick={publishCandidate}
                disabled={publishing || runtime.maintenance}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 disabled:cursor-wait disabled:opacity-60"
              >
                {publishing ? <Loader2 size={13} className="animate-spin" /> : <Presentation size={13} />}
                {publishing ? 'Publicando...' : 'Publicar candidata'}
              </button>
            )}
          </div>
        </div>
      )}

      {run && FAILED_STATUSES.has(run.status) && (
        <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-600">
            <AlertTriangle size={14} /> A última atualização falhou
          </p>
          <p className="break-words text-xs text-red-500">{run.error_detail ?? 'Erro sem detalhe registrado.'}</p>
        </div>
      )}

      {access?.capabilities.manage_members && (
        <details className="border-t border-cyan-100 bg-white/80 px-4 py-3">
          <summary className="cursor-pointer text-xs font-bold text-slate-700">Equipe e permissões</summary>
          <p className="mt-1 text-[11px] text-slate-500">
            Analistas geram candidatas; publicadores atualizam os documentos vivos; administradores gerenciam acessos.
          </p>
          <form
            className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void saveMember(memberEmail, memberRole, true);
            }}
          >
            <input
              type="email"
              required
              value={memberEmail}
              onChange={event => setMemberEmail(event.target.value)}
              placeholder="pessoa@afinz.com.br"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-cyan-400"
            />
            <select
              value={memberRole}
              onChange={event => setMemberRole(event.target.value as ReportLiveRole)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-cyan-400"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={savingMember}
              className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
            >
              {savingMember ? 'Salvando...' : 'Adicionar acesso'}
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {members.map(member => (
              <div key={member.user_id} className="flex flex-col gap-2 rounded-lg border border-slate-200 px-3 py-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700">{member.email}</p>
                  <p className={`text-[10px] font-semibold ${member.active ? 'text-emerald-600' : 'text-red-500'}`}>
                    {member.active ? 'Acesso ativo' : 'Acesso desativado'}
                  </p>
                </div>
                <select
                  value={member.role}
                  disabled={savingMember}
                  onChange={event => void saveMember(member.email, event.target.value as ReportLiveRole, member.active)}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={savingMember}
                  onClick={() => void saveMember(member.email, member.role, !member.active)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${member.active
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                >
                  {member.active ? 'Desativar' : 'Reativar'}
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};
