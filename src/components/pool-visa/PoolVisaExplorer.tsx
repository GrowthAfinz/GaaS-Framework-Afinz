import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Download, X } from 'lucide-react';
import { ReportColumnEditor, sanitizeSelection } from '../relatorio/ReportColumnEditor';
import { ActivityCommunicationPreview } from '../communications/previews/ActivityCommunicationPreview';
import {
  aggregatePool, coverageLabel, dimensionValue,
  type PoolAggregate, type PoolDimensionKey, type PoolDispatchRow,
} from './poolVisaModel';
import {
  POOL_DEFAULT_COLUMNS, POOL_FIELDS, POOL_FIELD_BY_KEY, POOL_LAYER_LABELS, POOL_PROFILES,
  formatPoolMetric, type PoolDimensionField, type PoolMetricField,
} from './poolVisaFields';

const STORAGE_KEY = 'gaas:pool-visa:columns:v1';

/** Data e mês ficam em ISO no modelo (ordenação); na tela e no CSV, em pt-BR. */
export function displayDim(dim: PoolDimensionKey, value: string): string {
  if (dim === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.split('-').reverse().join('/');
  if (dim === 'month' && /^\d{4}-\d{2}$/.test(value)) return new Date(`${value}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  return value;
}

export function loadPoolColumns(): string[] {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (Array.isArray(saved)) {
      const clean = sanitizeSelection(saved.filter((k): k is string => typeof k === 'string'), POOL_FIELDS);
      if (clean.length) return clean;
    }
  } catch { /* preferências corrompidas: volta ao padrão */ }
  return POOL_DEFAULT_COLUMNS;
}

export const PartialBadge: React.FC<{ label: string | null }> = ({ label }) =>
  label ? <span title={label} className="ml-1 rounded bg-amber-50 px-1 py-0.5 align-middle text-[9px] font-bold uppercase text-amber-700">{label.startsWith('parcial') ? 'parcial' : 'n/i'}</span> : null;

export const MetricCell: React.FC<{ field: PoolMetricField; row: PoolAggregate }> = ({ field, row }) => {
  const value = field.value(row);
  const label = field.coverage ? coverageLabel(field.coverage(row)) : null;
  return (
    <span title={value === null ? 'Não informado pela fonte neste recorte' : undefined}>
      {formatPoolMetric(value, field.format)}
      <PartialBadge label={value === null ? null : label} />
    </span>
  );
};

type Sort = { key: string; desc: boolean } | null;

export const PoolVisaExplorer: React.FC<{
  rows: PoolDispatchRow[];
  filterSummary: string;
}> = ({ rows, filterSummary }) => {
  const [columns, setColumnsState] = useState<string[]>(loadPoolColumns);
  const [sort, setSort] = useState<Sort>(null);
  const [detail, setDetail] = useState<PoolAggregate | null>(null);
  const setColumns = (next: string[]) => {
    setColumnsState(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* sem storage: só sessão */ }
  };

  const fields = columns.map((k) => POOL_FIELD_BY_KEY.get(k)).filter(Boolean) as (PoolMetricField | PoolDimensionField)[];
  const dimFields = fields.filter((f): f is PoolDimensionField => f.kind === 'dimension' && Boolean(f.dimension));
  const metricFields = fields.filter((f): f is PoolMetricField => f.kind === 'metric');
  const dims = dimFields.map((f) => f.dimension as PoolDimensionKey);

  const aggregated = useMemo(() => {
    const list = aggregatePool(rows, dims);
    const s = sort;
    const cmp = (a: PoolAggregate, b: PoolAggregate): number => {
      if (!s) {
        for (const d of dims) { const c = a.dims[d].localeCompare(b.dims[d], 'pt-BR'); if (c) return c; }
        return 0;
      }
      const field = POOL_FIELD_BY_KEY.get(s.key);
      if (field?.kind === 'metric') {
        const va = (field as PoolMetricField).value(a), vb = (field as PoolMetricField).value(b);
        if (va === null && vb === null) return 0;
        if (va === null) return 1;
        if (vb === null) return -1;
        return s.desc ? vb - va : va - vb;
      }
      const d = (field as PoolDimensionField | undefined)?.dimension;
      const c = d ? a.dims[d].localeCompare(b.dims[d], 'pt-BR') : 0;
      return s.desc ? -c : c;
    };
    return list.sort(cmp);
  }, [rows, dims.join(), sort]);

  const toggleSort = (key: string) => setSort((cur) => (cur?.key === key ? (cur.desc ? null : { key, desc: true }) : { key, desc: false }));

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = [...dimFields.map((f) => f.label), ...metricFields.flatMap((f) => (f.coverage ? [f.label, `${f.label} · linhas informadas`] : [f.label]))];
    const body = aggregated.map((r) => [
      ...dimFields.map((f) => displayDim(f.dimension as PoolDimensionKey, r.dims[f.dimension as PoolDimensionKey])),
      ...metricFields.flatMap((f) => {
        const v = f.value(r);
        const cell = v === null ? '' : f.format === 'percent' ? (v * 100).toFixed(2).replace('.', ',') + '%' : String(v);
        return f.coverage ? [cell, `${f.coverage(r).known}/${f.coverage(r).total}`] : [cell];
      }),
    ]);
    const meta = [`Fonte: rentabilizacao_activities (Pool Visa) · ${filterSummary} · Gerado em ${new Date().toLocaleString('pt-BR')} · vazio = não informado pela fonte`];
    const text = '﻿' + [meta, header, ...body].map((line) => line.map(esc).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pool-visa-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const detailRows = detail ? rows.filter((r) => dims.every((d) => dimensionValue(r, d) === detail.dims[d])) : [];
  const SortIcon = ({ k }: { k: string }) => (sort?.key === k ? (sort.desc ? <ArrowDown size={11} /> : <ArrowUp size={11} />) : null);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm" data-report-component="results-table">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Explorar dados · comunicação SFMC</p>
          <h3 className="text-base font-bold text-slate-900">Detalhamento do Pool</h3>
          <p className="text-xs text-slate-500">As dimensões escolhidas definem o nível da tabela. Clique numa linha para ver os disparos que a compõem.</p>
        </div>
        <div className="flex items-center gap-2">
          <ReportColumnEditor fields={POOL_FIELDS} profiles={POOL_PROFILES} value={columns} defaults={POOL_DEFAULT_COLUMNS} onChange={setColumns} layerLabels={POOL_LAYER_LABELS} title="Personalizar colunas do Pool Visa" />
          <button type="button" onClick={exportCsv} disabled={!aggregated.length} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-slate-300 disabled:opacity-40">
            <Download size={13} /> Exportar CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-900 text-white">
              {fields.map((f) => (
                <th key={f.key} className={`whitespace-nowrap px-4 py-3 font-semibold ${f.kind === 'metric' ? 'text-right' : 'text-left'}`} title={f.definition}>
                  <button type="button" onClick={() => toggleSort(f.key)} className="inline-flex items-center gap-1">{f.label}<SortIcon k={f.key} /></button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aggregated.map((r, i) => (
              <tr key={r.key} onClick={() => setDetail(r)} className={`cursor-pointer border-t border-slate-100 hover:bg-cyan-50/60 ${i % 2 ? 'bg-slate-50' : 'bg-white'}`}>
                {fields.map((f) => (
                  f.kind === 'metric'
                    ? <td key={f.key} className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-[13px] font-semibold tabular-nums text-slate-800"><MetricCell field={f as PoolMetricField} row={r} /></td>
                    : <td key={f.key} className={`whitespace-nowrap px-4 py-2.5 text-left text-xs ${r.dims[(f as PoolDimensionField).dimension as PoolDimensionKey] === 'Não informado na fonte' ? 'italic text-slate-400' : 'font-semibold text-slate-800'}`}>{displayDim((f as PoolDimensionField).dimension as PoolDimensionKey, r.dims[(f as PoolDimensionField).dimension as PoolDimensionKey])}</td>
                ))}
              </tr>
            ))}
            {!aggregated.length && (
              <tr><td colSpan={Math.max(fields.length, 1)} className="p-8 text-center text-slate-500">Nenhum disparo do Pool para os filtros atuais.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
        — = não informado pela fonte (diferente de zero). <span className="font-bold text-amber-700">parcial</span> = soma só das linhas que informam o campo; as taxas usam apenas essas linhas no denominador.
      </p>
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30" role="dialog" aria-modal="true" aria-label="Disparos da linha" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Disparos da linha</p>
                <h3 className="text-sm font-bold text-slate-900">{Object.entries(detail.dims).map(([d, v]) => displayDim(d as PoolDimensionKey, v)).join(' · ') || 'Total do recorte'}</h3>
                <p className="text-xs text-slate-500">{detailRows.length} disparo(s)</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setDetail(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
            </div>
            <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
              {detailRows.map((r) => (
                <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <p className="break-all font-mono font-semibold text-slate-800">{r.activityName}</p>
                  <p className="mt-1 text-slate-500">{[displayDim('date', r.date), r.bu, r.channel, r.journey].join(' · ')}</p>
                  <dl className="mt-2 grid grid-cols-4 gap-2">
                    {([['Enviados', r.sent], ['Entregues', r.delivered], ['Aberturas', r.opens], ['Cliques', r.clicks]] as const).map(([k, v]) => (
                      <div key={k} className="rounded-lg bg-slate-50 px-2 py-1.5">
                        <dt className="text-[10px] uppercase text-slate-400">{k}</dt>
                        <dd className={`font-mono font-semibold ${v === null ? 'text-slate-400' : 'text-slate-800'}`}>{v === null ? 'n/i' : v.toLocaleString('pt-BR')}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {r.kind === 'optout' ? 'Resposta de opt-out (não é disparo do Pool). ' : ''}
                    {r.touch != null ? `Toque ${r.touch}. ` : ''}
                    {r.audience ? `Público ${r.audience}, peça ${r.pieceGroup} (lidos do nome). ` : ''}
                    BU gravada: {r.buRaw || 'vazia'}. Atualizado em {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('pt-BR') : 'data não informada'}.
                  </p>
                  <div className="mt-2">
                    <ActivityCommunicationPreview context={{ executionId: r.id, activityName: r.activityName, date: r.date, journey: r.journey, channel: r.channel, templateId: null }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};
