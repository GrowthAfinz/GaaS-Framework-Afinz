import React, { useMemo, useState } from 'react';
import { CalendarClock, GitBranch, Loader2, Save, X } from 'lucide-react';
import type { OrphanRow } from '../../hooks/useReconciliation';
import type { ActivityMomentKind, ActivityMomentSuggestion } from '../../types/communication';
import { describeError, saveActivityMomentSuggestion } from '../../services/communicationService';

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k` : String(Math.round(n));

const KIND_LABEL: Record<ActivityMomentKind, string> = {
  semana_disparo: 'Semana + Disparo',
  disparo: 'Disparo',
  pontual: 'Pontual',
};

function clampNumber(value: number, fallback = 1) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(99, Math.round(value)));
}

function buildLabel(kind: ActivityMomentKind, enabled: boolean, week: number, dispatch: number) {
  if (kind === 'pontual') return enabled ? `Pontual · ${dispatch}` : 'Pontual';
  if (kind === 'semana_disparo') return `Semana ${week} · Disparo ${dispatch}`;
  return `Disparo ${dispatch}`;
}

interface Props {
  row: OrphanRow;
  onClose: () => void;
  onChanged: () => void;
}

export const ActivityMomentModal: React.FC<Props> = ({ row, onClose, onChanged }) => {
  const seed = row.momentSuggestion;
  const [kind, setKind] = useState<ActivityMomentKind>(seed.kind);
  const [enabled, setEnabled] = useState(seed.kind === 'pontual' ? seed.enabled : true);
  const [week, setWeek] = useState(clampNumber(seed.week ?? 1));
  const [dispatch, setDispatch] = useState(clampNumber(seed.dispatch ?? 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericEnabled = kind === 'pontual' ? enabled : true;
  const label = useMemo(
    () => buildLabel(kind, numericEnabled, week, dispatch),
    [dispatch, kind, numericEnabled, week]
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    const suggestion: ActivityMomentSuggestion = {
      kind,
      enabled: numericEnabled,
      week: kind === 'semana_disparo' ? week : null,
      dispatch: numericEnabled ? dispatch : null,
      label,
      confidence: 'manual',
      source: 'manual',
    };
    try {
      await saveActivityMomentSuggestion({
        journeyName: row.jornada,
        activityName: row.name,
        channel: row.canalLabel,
        latestDate: row.latestDate,
        suggestion,
      });
      onChanged();
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">
              <CalendarClock size={14} /> Curadoria de momento
            </p>
            <h3 className="mt-1 truncate font-mono text-lg font-bold text-slate-900">{row.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">{row.canalLabel}</span>
              <span className="inline-flex min-w-0 items-center gap-1"><GitBranch size={12} /> <span className="truncate">{row.jornada}</span></span>
              <span>{fmtK(row.base)} base</span>
              <span>{row.exec} exec.</span>
              {row.latestDate && <span>{row.latestDate.slice(0, 10)}</span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Tipo da sugestão</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(KIND_LABEL) as ActivityMomentKind[]).map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setKind(id);
                    if (id !== 'pontual') setEnabled(true);
                  }}
                  className={`rounded-xl border px-3 py-3 text-left text-sm font-bold transition-colors ${
                    kind === id
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-cyan-200'
                  }`}
                >
                  {KIND_LABEL[id]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {kind === 'semana_disparo' && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Semana</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={week}
                  onChange={(e) => setWeek(clampNumber(Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-cyan-400"
                />
              </label>
            )}
            {numericEnabled && (
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Disparo</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={dispatch}
                  onChange={(e) => setDispatch(clampNumber(Number(e.target.value)))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-cyan-400"
                />
              </label>
            )}
          </div>

          {kind === 'pontual' && (
            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <span>
                <span className="block text-sm font-bold text-slate-800">Numerar pontual</span>
                <span className="block text-xs text-slate-500">Quando habilitado, começa em 1 e pode ser ajustado.</span>
              </span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 accent-cyan-600"
              />
            </label>
          )}

          <div className="rounded-xl border border-cyan-100 bg-cyan-50 px-4 py-3">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-cyan-700">Preview na fila</span>
            <span className="mt-1 inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold text-cyan-800 shadow-sm">{label}</span>
          </div>

          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Salvar sugestão
          </button>
        </div>
      </div>
    </div>
  );
};
