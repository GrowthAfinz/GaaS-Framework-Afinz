import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, GitBranch, Link2, Loader2, Search, X } from 'lucide-react';
import type { CatalogEntry, OrphanRow, ReconciledRow } from '../../hooks/useReconciliation';
import { describeError, linkActivityToTemplate } from '../../services/communicationService';
import { formatSeq, optLabel, type DimId, type ParsedActivity, type TemplateDims } from '../../utils/taxonomy';

type TargetRow = OrphanRow | ReconciledRow;

interface Props {
  row: TargetRow;
  catalog: CatalogEntry[];
  currentTemplateId?: string | null;
  onClose: () => void;
  onChanged: () => void;
}

interface RankedTemplate {
  tpl: CatalogEntry;
  score: number;
  momentPriority: number;
  positives: string[];
  warnings: string[];
}

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k` : String(Math.round(n));

const DIM_WEIGHT: Record<keyof TemplateDims, number> = {
  publico: 16,
  canal: 28,
  campanha: 12,
  segmento: 22,
  seq: 26,
};

const DIM_LABEL: Record<keyof TemplateDims, string> = {
  publico: 'Público',
  canal: 'Canal',
  campanha: 'Campanha',
  segmento: 'Segmento',
  seq: 'Disparo',
};

const dimValue = (parsed: ParsedActivity, dim: keyof TemplateDims) => dim === 'seq' ? parsed.seq : parsed[dim as DimId];

function displayDim(dim: keyof TemplateDims, value: string | null) {
  if (!value) return 'n/i';
  return dim === 'seq' ? formatSeq(value) : optLabel(dim as DimId, value);
}

function rankTemplate(parsed: ParsedActivity, tpl: CatalogEntry, currentTemplateId?: string | null): RankedTemplate {
  let score = 0;
  const positives: string[] = [];
  const warnings: string[] = [];
  const expectedSeq = parsed.seq;
  const templateSeq = tpl.dims.seq;
  const momentPriority = !expectedSeq
    ? 0
    : templateSeq === expectedSeq
      ? 0
      : !templateSeq
        ? 1
        : 2;

  (['publico', 'canal', 'campanha', 'segmento', 'seq'] as (keyof TemplateDims)[]).forEach((dim) => {
    const pv = dimValue(parsed, dim);
    const tv = tpl.dims[dim];
    if (pv && tv && pv === tv) {
      score += DIM_WEIGHT[dim];
      positives.push(`${DIM_LABEL[dim]}: ${displayDim(dim, tv)}`);
    } else if (pv && tv) {
      const penalty = dim === 'canal' ? 35 : dim === 'seq' ? 14 : 8;
      score -= penalty;
      warnings.push(`${DIM_LABEL[dim]} diferente: ${displayDim(dim, tv)}`);
    } else if (tv) {
      warnings.push(`${DIM_LABEL[dim]} do template: ${displayDim(dim, tv)}`);
    }
  });

  if (tpl.id === currentTemplateId) {
    score += 6;
    positives.push('Vínculo atual');
  }
  if (tpl.hasAsset) {
    score += 4;
    positives.push('Template com peça');
  } else {
    warnings.push('Template sem peça');
  }

  if (expectedSeq && templateSeq === expectedSeq) {
    score += 30;
    positives.push(`Momento curado: ${formatSeq(expectedSeq)}`);
  } else if (expectedSeq && templateSeq) {
    score -= 45;
    warnings.unshift(`Momento diferente: ${formatSeq(templateSeq)}`);
  } else if (expectedSeq) {
    warnings.unshift(`Momento curado: ${formatSeq(expectedSeq)}`);
  }

  return { tpl, score: Math.max(0, Math.min(100, score)), momentPriority, positives, warnings };
}

const scoreClass = (score: number, isCurrent: boolean) => {
  if (isCurrent) return 'border-cyan-200 bg-cyan-50 text-cyan-700';
  if (score >= 80) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 55) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-500';
};

export const TemplateSuggestionModal: React.FC<Props> = ({ row, catalog, currentTemplateId, onClose, onChanged }) => {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog
      .map((tpl) => rankTemplate(row.parsed, tpl, currentTemplateId))
      .filter((item) => !q || item.tpl.id.toLowerCase().includes(q) || item.tpl.raw.title?.toLowerCase().includes(q))
      .sort((a, b) => a.momentPriority - b.momentPriority || b.score - a.score || a.tpl.id.localeCompare(b.tpl.id))
      .slice(0, 40);
  }, [catalog, currentTemplateId, query, row.parsed]);

  const choose = async (templateId: string) => {
    setBusy(templateId);
    setError(null);
    try {
      await linkActivityToTemplate(row.name, templateId);
      onChanged();
      onClose();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-6">
      <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-600">Sugestões de template</p>
            <h3 className="mt-1 truncate font-mono text-lg font-bold text-slate-900">{row.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">{row.canalLabel}</span>
              <span className="inline-flex items-center gap-1"><GitBranch size={12} /> {row.jornada}</span>
              <span>{fmtK(row.base)} base</span>
              <span>{row.exec} exec.</span>
              {currentTemplateId && <span>Atual: <code className="font-bold text-cyan-700">{currentTemplateId}</code></span>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por template_id ou nome do template..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 md:grid-cols-5">
            {(['publico', 'canal', 'campanha', 'segmento', 'seq'] as (keyof TemplateDims)[]).map((dim) => (
              <div key={dim} className="rounded-lg border border-slate-100 bg-white px-2 py-1.5">
                <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">{DIM_LABEL[dim]}</span>
                <span className="font-semibold text-slate-700">{displayDim(dim, dimValue(row.parsed, dim))}</span>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex-1 overflow-y-auto p-6">
          {ranked.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
              Nenhum template encontrado para este filtro.
            </div>
          ) : (
            <div className="space-y-2">
              {ranked.map((item) => {
                const isCurrent = item.tpl.id === currentTemplateId;
                return (
                  <div key={item.tpl.id} className={`rounded-xl border p-3 transition-colors ${isCurrent ? 'border-cyan-300 bg-cyan-50/40' : 'border-slate-200 bg-white hover:border-cyan-200'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-14 shrink-0 rounded-lg border px-2 py-1.5 text-center text-xs font-bold ${scoreClass(item.score, isCurrent)}`}>
                        {item.score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="font-mono text-sm font-bold text-slate-900">{item.tpl.id}</code>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{item.tpl.channel}</span>
                          {isCurrent && <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold text-cyan-700">vínculo atual</span>}
                          {!item.tpl.hasAsset && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">sem peça</span>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{item.tpl.raw.title || item.tpl.id}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.positives.slice(0, 5).map((reason) => (
                            <span key={reason} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <Check size={10} /> {reason}
                            </span>
                          ))}
                          {item.warnings.slice(0, 4).map((warning) => (
                            <span key={warning} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                              <AlertTriangle size={10} /> {warning}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => choose(item.tpl.id)}
                        disabled={!!busy || isCurrent}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy === item.tpl.id ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
                        {isCurrent ? 'Atual' : 'Usar template'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
