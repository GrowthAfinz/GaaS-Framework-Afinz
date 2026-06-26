import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, X, Sparkles } from 'lucide-react';
import type { CommunicationTemplate } from '../../types/communication';
import { decorateTemplate } from '../../hooks/useTemplateCatalog';
import { useActivitySuggestions } from '../../hooks/useActivitySuggestions';
import { supabase } from '../../services/supabaseClient';
import { linkActivityToTemplate, unlinkActivity, describeError } from '../../services/communicationService';

interface Props {
  template: CommunicationTemplate;
  /** Chamado apos vincular/desvincular, para o pai atualizar contadores. */
  onChanged?: () => void;
}

/**
 * Marcacao humana de activity_names para um template.
 * Busca os vinculos atuais, mostra sugestoes semanticamente compativeis e aplica
 * vinculo apenas apos clique humano.
 */
export const ActivityLinkManager: React.FC<Props> = ({ template, onChanged }) => {
  const catalogTemplate = useMemo(() => decorateTemplate(template), [template]);
  const { suggestions, loading: loadingSug, error: sugError } = useActivitySuggestions(catalogTemplate);
  const [linked, setLinked] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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

  const linkedSet = useMemo(() => new Set(linked), [linked]);
  const freshSuggestions = suggestions.filter((s) => !linkedSet.has(s.activityName));
  const strongCount = freshSuggestions.filter((s) => s.confidence === 'alta').length;

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

  const confidenceClass = (confidence: string) => {
    if (confidence === 'alta') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (confidence === 'media') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-100 text-slate-500';
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Disparos vinculados ({linked.length})
        </p>
        {linked.length === 0 ? (
          <p className="text-xs text-slate-400">Nenhum ainda - marque pelas sugestoes abaixo.</p>
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
        <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          <Sparkles size={12} className="text-amber-500" /> Sugestoes
          {freshSuggestions.length > 0 && (
            <span className="ml-1 normal-case tracking-normal text-slate-400">
              {strongCount > 0 ? `${strongCount} fortes` : 'revisar compatibilidade'}
            </span>
          )}
        </p>
        {loadingSug ? (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-400"><Loader2 size={13} className="animate-spin" /> Buscando...</div>
        ) : sugError ? (
          <p className="text-xs text-red-500">{sugError}</p>
        ) : freshSuggestions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
            Sem sugestoes compativeis para este template. Use a busca manual se a activity existir com parceiro/segmento preenchido de forma diferente.
          </p>
        ) : (
          <div className="space-y-1.5">
            {freshSuggestions.map((s) => (
              <div key={s.activityName} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                <span className={`mt-0.5 w-12 shrink-0 rounded-md border px-1.5 py-1 text-center text-[10px] font-bold uppercase ${confidenceClass(s.confidence)}`}>
                  {s.score}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[11px] text-slate-700" title={s.activityName}>{s.activityName}</p>
                  <p className="truncate text-[10px] text-slate-400" title={`${s.parceiro} · ${s.segmento} · ${s.jornada}`}>
                    {s.parceiro} · {s.segmento} · {s.latestDate ? `${s.latestDate} · ` : ''}{s.executions} exec
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.reasons.slice(0, 5).map((reason) => (
                      <span key={reason} className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 ring-1 ring-cyan-100">
                        {reason}
                      </span>
                    ))}
                    {s.warnings.slice(0, 2).map((warning) => (
                      <span key={warning} className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">
                        {warning}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => run(`link:${s.activityName}`, () => linkActivityToTemplate(s.activityName, template.template_id))}
                  disabled={!!busy || s.linkedToOther}
                  title={s.linkedToOther ? 'Activity ja vinculada a outro template' : 'Vincular activity a este template'}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-cyan-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {busy === `link:${s.activityName}` ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Vincular
                </button>
              </div>
            ))}
          </div>
        )}
        {actionError && <p className="mt-1 text-xs text-red-500">{actionError}</p>}
      </div>
    </div>
  );
};
