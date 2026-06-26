import React, { useMemo, useState } from 'react';
import { Search, Inbox, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { useCommunicationSlots } from '../../hooks/useCommunicationSlots';
import { useCommunicationTemplates } from '../../hooks/useCommunicationTemplates';
import { useActivitySearch, type ActivitySearchFilters } from '../../hooks/useActivitySearch';
import { COMMUNICATION_CHANNELS, inferChannelFromActivityName, toCanonicalChannel } from '../../utils/inferChannel';
import { CommunicationUploadModal, type DispatchSelection } from './CommunicationUploadModal';

const ChannelBadge: React.FC<{ channel: string }> = ({ channel }) => (
  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
    {channel}
  </span>
);

export const CadastroCobertura: React.FC = () => {
  const { slots, loading: slotsLoading, error: slotsError, refetch: refetchSlots } = useCommunicationSlots();
  const { templates, refetch: refetchTemplates } = useCommunicationTemplates();

  const [filters, setFilters] = useState<ActivitySearchFilters>({});
  const { candidates, loading: searchLoading, error: searchError, truncated, refetch: refetchSearch } = useActivitySearch(filters);

  const [selection, setSelection] = useState<DispatchSelection | null>(null);

  const setFilter = (key: keyof ActivitySearchFilters, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));

  const hasSearch = useMemo(
    () => !!(filters.jornada || filters.segmento || filters.canal || filters.activityName || filters.data),
    [filters]
  );

  const handleSaved = () => {
    setSelection(null);
    refetchSlots();
    refetchTemplates();
    refetchSearch();
  };

  return (
    <div className="space-y-6">
      {/* ── Fila de pendências (slots) ── */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <Inbox size={17} className="text-cyan-600" />
            <h3 className="font-semibold text-slate-800">Fila de cobertura</h3>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              {slots.length} pendentes
            </span>
          </div>
          <span className="text-xs text-slate-400">disparos de réguas ativas sem template</span>
        </header>

        <div className="max-h-[320px] overflow-y-auto">
          {slotsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Carregando fila…
            </div>
          ) : slotsError ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm text-red-600">
              <AlertCircle size={16} /> {slotsError}
            </div>
          ) : slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <CheckCircle2 size={28} className="text-emerald-400" />
              <span className="text-sm">Nenhuma pendência — toda a fila está coberta.</span>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {slots.map((slot) => (
                <li key={slot.id}>
                  <button
                    onClick={() => setSelection({
                      activityName: slot.activity_name,
                      jornada: slot.journey_name,
                      channel: toCanonicalChannel(slot.channel) ?? inferChannelFromActivityName(slot.activity_name) ?? 'E-mail',
                      slotId: slot.id,
                      date: slot.last_seen_on ?? null,
                    })}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                  >
                    <ChannelBadge channel={slot.channel} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-slate-700">{slot.activity_name}</p>
                      <p className="truncate text-xs text-slate-400">{slot.journey_name}</p>
                    </div>
                    {slot.last_seen_on && <span className="text-xs text-slate-400">{slot.last_seen_on}</span>}
                    <ChevronRight size={15} className="text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Busca multidimensional (activities) ── */}
      <section className="rounded-xl border border-slate-200 bg-white">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <Search size={17} className="text-cyan-600" />
          <h3 className="font-semibold text-slate-800">Buscar disparo</h3>
          <span className="text-xs text-slate-400">por jornada, segmento, canal, activity_name ou data</span>
        </header>

        <div className="grid grid-cols-1 gap-2 px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            value={filters.jornada ?? ''}
            onChange={(e) => setFilter('jornada', e.target.value)}
            placeholder="Jornada"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          />
          <input
            value={filters.segmento ?? ''}
            onChange={(e) => setFilter('segmento', e.target.value)}
            placeholder="Segmento"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
          />
          <select
            value={filters.canal ?? ''}
            onChange={(e) => setFilter('canal', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Canal (todos)</option>
            {COMMUNICATION_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={filters.activityName ?? ''}
            onChange={(e) => setFilter('activityName', e.target.value)}
            placeholder="activity_name"
            className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="date"
            value={filters.data ?? ''}
            onChange={(e) => setFilter('data', e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <div className="max-h-[420px] overflow-y-auto border-t border-slate-100">
          {!hasSearch ? (
            <div className="py-10 text-center text-sm text-slate-400">Use os filtros acima para encontrar disparos.</div>
          ) : searchLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
              <Loader2 size={16} className="animate-spin" /> Buscando…
            </div>
          ) : searchError ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm text-red-600">
              <AlertCircle size={16} /> {searchError}
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">Nenhum disparo encontrado.</div>
          ) : (
            <>
              {truncated && (
                <div className="bg-amber-50 px-5 py-2 text-xs text-amber-700">
                  Resultado limitado às 500 execuções mais recentes — refine os filtros para ver tudo.
                </div>
              )}
              <ul className="divide-y divide-slate-50">
                {candidates.map((c) => (
                  <li key={c.activityName}>
                    <button
                      onClick={() => setSelection({
                        activityName: c.activityName,
                        jornada: c.jornada,
                        channel: toCanonicalChannel(c.canal) ?? c.canalInferido ?? 'E-mail',
                        slotId: null,
                        date: c.latestDate,
                      })}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                    >
                      <ChannelBadge channel={c.canal} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs text-slate-700">{c.activityName}</p>
                        <p className="truncate text-xs text-slate-400">
                          {c.jornada} · {c.segmento} · {c.executions} execuç{c.executions === 1 ? 'ão' : 'ões'}
                        </p>
                      </div>
                      {c.hasTemplate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2 size={12} /> {c.templateId}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">sem template</span>
                      )}
                      <ChevronRight size={15} className="text-slate-300" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {selection && (
        <CommunicationUploadModal
          selection={selection}
          templates={templates}
          onClose={() => setSelection(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};
