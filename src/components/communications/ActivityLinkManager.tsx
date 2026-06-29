import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clipboard, Info, Loader2, Plus, Sparkles, X } from 'lucide-react';
import type { CommunicationTemplate } from '../../types/communication';
import { decorateTemplate } from '../../hooks/useTemplateCatalog';
import { type ActivitySuggestion, type ActivitySuggestionCategory, useActivitySuggestions } from '../../hooks/useActivitySuggestions';
import { supabase } from '../../services/supabaseClient';
import { linkActivityToTemplate, unlinkActivity, describeError } from '../../services/communicationService';

interface Props {
  template: CommunicationTemplate;
  /** Texto extraido do asset em edicao (assunto, preheader e HTML limpo). */
  contentText?: string;
  /** Chamado apos vincular/desvincular, para o pai atualizar contadores. */
  onChanged?: () => void;
}

const CATEGORY_LABEL: Record<ActivitySuggestionCategory, string> = {
  alta_confianca: 'Alta confiança',
  revisar: 'Revisar',
  conflito: 'Conflitos',
  ja_vinculado: 'Já vinculados',
};

const CATEGORY_HELP: Record<ActivitySuggestionCategory, string> = {
  alta_confianca: 'Bate sinais fortes do template e parece pronto para confirmar.',
  revisar: 'Tem evidência útil, mas exige validação humana antes de vincular.',
  conflito: 'Há risco de vínculo errado ou activity já usada por outro template.',
  ja_vinculado: 'Activity já está vinculada a este template.',
};

const categoryClass = (category: ActivitySuggestionCategory) => {
  if (category === 'alta_confianca') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (category === 'conflito') return 'border-red-200 bg-red-50 text-red-700';
  if (category === 'ja_vinculado') return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

const scoreClass = (suggestion: ActivitySuggestion) => {
  if (suggestion.category === 'conflito') return 'border-red-200 bg-red-50 text-red-700';
  if (suggestion.score >= 85) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (suggestion.score >= 65) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-500';
};

const formatDate = (date: string | null) => {
  if (!date) return null;
  const [yyyy, mm, dd] = date.slice(0, 10).split('-');
  return yyyy && mm && dd ? `${dd}/${mm}` : date;
};

/** Marcacao humana de activity_names para um template, com sugestoes explicaveis. */
export const ActivityLinkManager: React.FC<Props> = ({ template, contentText = '', onChanged }) => {
  const catalogTemplate = useMemo(() => decorateTemplate(template), [template]);
  const { suggestions, buckets, diagnostics, context, loading: loadingSug, error: sugError } = useActivitySuggestions(catalogTemplate, {
    contentText,
    topN: 18,
  });
  const [linked, setLinked] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ActivitySuggestionCategory>('alta_confianca');
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set());
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const fetchLinked = useCallback(async () => {
    const { data } = await supabase
      .from('activities')
      .select('"Activity name / Taxonomia"')
      .eq('template_id', template.template_id);
    const names = Array.from(new Set((data ?? [])
      .map((r: Record<string, unknown>) => r['Activity name / Taxonomia'] as string)
      .filter(Boolean)));
    setLinked(names);
  }, [template.template_id]);

  useEffect(() => { fetchLinked(); }, [fetchLinked]);

  useEffect(() => {
    if (buckets.altaConfianca.length > 0) setActiveCategory('alta_confianca');
    else if (buckets.revisar.length > 0) setActiveCategory('revisar');
    else if (buckets.conflitos.length > 0) setActiveCategory('conflito');
    else if (buckets.jaVinculados.length > 0) setActiveCategory('ja_vinculado');
  }, [buckets.altaConfianca.length, buckets.revisar.length, buckets.conflitos.length, buckets.jaVinculados.length]);

  const linkedSet = useMemo(() => new Set(linked), [linked]);
  const visibleSuggestions = useMemo(() => suggestions.filter((s) => !ignored.has(s.activityName)), [suggestions, ignored]);
  const currentSuggestions = useMemo(() => {
    const byCategory = visibleSuggestions.filter((s) => s.category === activeCategory);
    return activeCategory === 'ja_vinculado'
      ? byCategory
      : byCategory.filter((s) => !linkedSet.has(s.activityName));
  }, [activeCategory, linkedSet, visibleSuggestions]);

  const categoryCount = (category: ActivitySuggestionCategory) => visibleSuggestions.filter((s) => s.category === category).length;

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setBusy(key);
    setActionError(null);
    try {
      await fn();
      await fetchLinked();
      onChanged?.();
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setBusy(null);
    }
  };

  const copyActivityName = async (activityName: string) => {
    try {
      await navigator.clipboard?.writeText(activityName);
    } catch {
      // Sem fallback visual: copiar é ação auxiliar, não deve quebrar o fluxo.
    }
  };

  const contextChips = [
    context?.channel ? `Canal: ${context.channel}` : null,
    context?.partnerLabel ? `Parceiro: ${context.partnerLabel}` : null,
    context?.segment?.canonical ? `Segmento: ${context.segment.canonical}` : null,
    context?.campaignTokens.length ? `Campanha: ${context.campaignTokens.join(', ')}` : null,
    context?.week ? `Semana: ${context.week.toUpperCase()}` : null,
    context?.dispatch ? `Disparo: ${context.dispatch.toUpperCase()}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Disparos vinculados ({linked.length})
        </p>
        {linked.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum ainda — confirme manualmente pelas sugestões abaixo.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {linked.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2 py-1 font-mono text-[11px] text-cyan-700">
                {name}
                <button
                  onClick={() => run(`unlink:${name}`, () => unlinkActivity(name))}
                  disabled={!!busy}
                  className="rounded-full p-0.5 text-cyan-400 hover:bg-cyan-100 hover:text-cyan-700"
                  title="Desvincular"
                >
                  {busy === `unlink:${name}` ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            <Sparkles size={12} className="text-amber-500" /> Sugestões inteligentes
          </p>
          {!loadingSug && (
            <button
              onClick={() => setShowDiagnostics((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <Info size={12} /> Como chegou nisso?
            </button>
          )}
        </div>

        {contextChips.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {contextChips.map((chip) => (
              <span key={chip} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {chip}
              </span>
            ))}
          </div>
        )}

        {loadingSug ? (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-400"><Loader2 size={13} className="animate-spin" /> Buscando e classificando candidates...</div>
        ) : sugError ? (
          <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">{sugError}</p>
        ) : (
          <>
            <div className="mb-2 grid grid-cols-2 gap-1.5 md:grid-cols-4">
              {(['alta_confianca', 'revisar', 'conflito', 'ja_vinculado'] as ActivitySuggestionCategory[]).map((category) => {
                const count = categoryCount(category);
                return (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-lg border px-2 py-1.5 text-left text-[11px] transition-colors ${activeCategory === category ? categoryClass(category) : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className="block font-semibold">{CATEGORY_LABEL[category]}</span>
                    <span className="text-[10px] opacity-80">{count} item{count === 1 ? '' : 's'}</span>
                  </button>
                );
              })}
            </div>

            {showDiagnostics && (
              <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                <div className="mb-1 font-semibold text-slate-600">Funil da sugestão</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 md:grid-cols-4">
                  <span>{diagnostics.fetchedRows} linhas analisadas</span>
                  <span>{diagnostics.uniqueActivityNames} activity_names únicos</span>
                  <span>{diagnostics.rejected.hardIncompatible} removidas por conflito forte</span>
                  <span>{diagnostics.rejected.lowScore} abaixo do score mínimo</span>
                </div>
                {diagnostics.planned.total > 0 && (
                  <p className="mt-1">
                    Planejadas no template: {diagnostics.planned.found}/{diagnostics.planned.total} encontradas
                    {diagnostics.planned.missing.length > 0 ? ` · ausentes: ${diagnostics.planned.missing.slice(0, 2).join(', ')}` : ''}
                  </p>
                )}
                {diagnostics.rejected.hardIncompatible > 0 && (
                  <p className="mt-1">
                    Conflitos fortes: canal {diagnostics.hardRejectReasons.channel}, parceiro {diagnostics.hardRejectReasons.partner}, campanha {diagnostics.hardRejectReasons.campaign}.
                  </p>
                )}
              </div>
            )}

            {currentSuggestions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                <p className="font-medium text-slate-500">Nenhum item neste bucket.</p>
                <p>
                  {visibleSuggestions.length === 0
                    ? 'A engine não encontrou activity compatível. Veja o diagnóstico acima para saber se o corte foi por canal, parceiro, campanha ou score.'
                    : CATEGORY_HELP[activeCategory]}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {currentSuggestions.map((s) => (
                  <div key={s.activityName} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-12 shrink-0 rounded-md border px-1.5 py-1 text-center text-[10px] font-bold uppercase ${scoreClass(s)}`}>
                        {s.score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {s.category === 'alta_confianca' && <CheckCircle2 size={12} className="shrink-0 text-emerald-500" />}
                          {s.category === 'conflito' && <AlertTriangle size={12} className="shrink-0 text-red-500" />}
                          <p className="truncate font-mono text-[11px] text-slate-700" title={s.activityName}>{s.activityName}</p>
                        </div>
                        <p className="truncate text-[10px] text-slate-400" title={`${s.parceiro} · ${s.segmento} · ${s.jornada}`}>
                          {s.parceiro} · {s.segmento} · {formatDate(s.latestDate) ? `${formatDate(s.latestDate)} · ` : ''}{s.executions} exec
                          {s.linkedTemplateId ? ` · vinculado a ${s.linkedTemplateId}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => copyActivityName(s.activityName)}
                          className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-600"
                          title="Copiar activity_name"
                        >
                          <Clipboard size={12} />
                        </button>
                        <button
                          onClick={() => setIgnored((prev) => new Set(prev).add(s.activityName))}
                          className="rounded-md border border-slate-200 bg-white p-1 text-slate-400 hover:text-slate-600"
                          title="Ignorar nesta sessão"
                        >
                          <X size={12} />
                        </button>
                        <button
                          onClick={() => run(`link:${s.activityName}`, () => linkActivityToTemplate(s.activityName, template.template_id))}
                          disabled={!!busy || s.linkedToOther || s.alreadyLinked}
                          title={s.linkedToOther ? 'Activity já vinculada a outro template' : s.alreadyLinked ? 'Activity já vinculada a este template' : 'Vincular activity a este template'}
                          className="flex items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                        >
                          {busy === `link:${s.activityName}` ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Vincular
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.evidence.slice(0, 5).map((item) => (
                        <span key={`${s.activityName}:${item.label}:${item.detail ?? ''}`} className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-100">
                          {item.label}{item.weight ? ` +${item.weight}` : ''}
                        </span>
                      ))}
                      {s.conflicts.slice(0, 3).map((item) => (
                        <span key={`${s.activityName}:conflict:${item.label}:${item.detail ?? ''}`} className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100" title={item.detail}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {actionError && <p className="mt-1 text-xs text-red-500">{actionError}</p>}
      </div>
    </div>
  );
};
