import React, { useEffect, useMemo, useState } from 'react';
import { X, Loader2, FileImage, Pencil, Check, Settings2, Trash2, AlertCircle, UploadCloud } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TemplatePerformance, TemplateTimelinePoint } from '../../hooks/useTemplatePerformance';
import type { ActivityRow } from '../../types/activity';
import { getSignedUrl, renameTemplate, deleteTemplateAsset, describeError } from '../../services/communicationService';
import { isEmailChannel } from '../../utils/inferChannel';
import { normalizeTemplateId, isValidTemplateId } from '../../utils/templateId';
import { decorateTemplate } from '../../hooks/useTemplateCatalog';
import { ActivityLinkManager } from './ActivityLinkManager';
import { AddAssetModal } from './AddAssetModal';
import { TemplateIdChips } from './TemplateIdChips';
import { DisparoDetailModal } from '../explorer/disparo/DisparoDetailModal';

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const int = (v: number) => v.toLocaleString('pt-BR');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const clampScore = (value: number | null | undefined) => Math.max(0, Math.min(100, Math.round(value ?? 0)));
const scoreTone = (score: number | null) => score == null ? 'bg-slate-300' : score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-rose-500';

const withEmailPreviewScale = (html: string) => {
  const style = '<style>html,body{margin:0!important;}body{zoom:1.12;}@supports not (zoom:1){body{transform:scale(1.12);transform-origin:top center;}}</style>';
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${style}`);
  return `${style}${html}`;
};

type TimelineMetric = 'baseEnviada' | 'aberturas' | 'cliques' | 'cartoes' | 'propostas' | 'taxaAbertura' | 'ctr' | 'taxaConversao' | 'custoEfetivo' | 'cacEfetivo';

const TIMELINE_METRICS: Array<{ key: TimelineMetric; label: string; kind: 'int' | 'pct' | 'brl' }> = [
  { key: 'baseEnviada', label: 'Base', kind: 'int' },
  { key: 'aberturas', label: 'Aberturas', kind: 'int' },
  { key: 'cliques', label: 'Cliques', kind: 'int' },
  { key: 'cartoes', label: 'Cartoes', kind: 'int' },
  { key: 'propostas', label: 'Propostas', kind: 'int' },
  { key: 'taxaAbertura', label: 'Tx. abertura', kind: 'pct' },
  { key: 'ctr', label: 'CTR', kind: 'pct' },
  { key: 'taxaConversao', label: 'Conv.', kind: 'pct' },
  { key: 'custoEfetivo', label: 'Gasto', kind: 'brl' },
  { key: 'cacEfetivo', label: 'CAC', kind: 'brl' },
];

const formatTimelineValue = (value: number, kind: 'int' | 'pct' | 'brl') => {
  if (kind === 'pct') return pct(value);
  if (kind === 'brl') return brl(value);
  return int(Math.round(value));
};

interface Props {
  item: TemplatePerformance;
  onClose: () => void;
  /** Chamado após mudanças (vínculo, rename) para o pai recarregar. */
  onChanged?: () => void;
}

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-base font-semibold text-slate-700 tabular-nums">{value}</p>
    {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const TimelineTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ value?: number; payload?: TemplateTimelinePoint }>;
  label?: string;
  metric: (typeof TIMELINE_METRICS)[number];
}> = ({ active, payload, label, metric }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="min-w-[170px] rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-slate-700">Dia {label}</p>
      <p className="text-base font-bold text-cyan-700">{formatTimelineValue(value, metric.kind)}</p>
      {point && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
          <span>Execucoes</span><span className="text-right font-semibold">{int(point.executions)}</span>
          <span>Base</span><span className="text-right font-semibold">{int(point.baseEnviada)}</span>
          <span>Aberturas</span><span className="text-right font-semibold">{int(point.aberturas)}</span>
          <span>Cliques</span><span className="text-right font-semibold">{int(point.cliques)}</span>
          <span>Cartoes</span><span className="text-right font-semibold">{int(point.cartoes)}</span>
        </div>
      )}
    </div>
  );
};

const TimelineDot = (props: any) => {
  const { cx, cy, payload, onPointClick } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#fff"
      stroke="#0891B2"
      strokeWidth={2}
      className="cursor-pointer"
      onClick={(event) => {
        event.stopPropagation();
        onPointClick?.(payload as TemplateTimelinePoint);
      }}
    />
  );
};

const ContentTimeline: React.FC<{ item: TemplatePerformance; onPointClick: (point: TemplateTimelinePoint) => void }> = ({ item, onPointClick }) => {
  const [metricKey, setMetricKey] = useState<TimelineMetric>('cartoes');
  const metric = TIMELINE_METRICS.find((m) => m.key === metricKey) ?? TIMELINE_METRICS[2];
  const data = useMemo(() => item.timeline.filter((point) => point.date !== 'sem-data'), [item.timeline]);

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Linha do tempo</p>
          <p className="text-xs text-slate-400">Evolucao diaria das activity_names vinculadas ao template.</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          {TIMELINE_METRICS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setMetricKey(option.key)}
              className={[
                'rounded-md px-2 py-1 text-[10px] font-semibold transition-colors',
                metricKey === option.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-white hover:text-slate-700',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
          Sem serie temporal para o periodo filtrado.
        </div>
      ) : (
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis
                width={54}
                tick={{ fill: '#94A3B8', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatTimelineValue(Number(v), metric.kind)}
              />
              <Tooltip content={(props) => <TimelineTooltip {...props} metric={metric} />} />
              <Line
                type="monotone"
                dataKey={metric.key}
                stroke="#0891B2"
                strokeWidth={2.5}
                dot={(props) => <TimelineDot {...props} onPointClick={onPointClick} />}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const ActivityDayPicker: React.FC<{
  point: TemplateTimelinePoint;
  onClose: () => void;
  onSelect: (activity: ActivityRow) => void;
}> = ({ point, onClose, onSelect }) => (
  <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
    <div
      className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h4 className="text-base font-bold text-slate-800">Disparos do dia {point.label}</h4>
          <p className="text-sm text-slate-400">{point.activities.length} activity_name{point.activities.length === 1 ? '' : 's'} vinculada{point.activities.length === 1 ? '' : 's'} ao template.</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-4">
        <div className="space-y-2">
          {point.activities.map((activity) => (
            <button
              key={activity.id ?? activity['Activity name / Taxonomia']}
              type="button"
              onClick={() => onSelect(activity)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-cyan-300 hover:bg-cyan-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-bold text-slate-700">{activity['Activity name / Taxonomia']}</p>
                  <p className="mt-1 truncate text-xs text-slate-400">{activity.jornada}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                  {activity.Canal ?? '-'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                <span><span className="text-slate-400">Base</span> <b className="text-slate-700">{int(Number(activity['Base Total'] ?? 0))}</b></span>
                <span><span className="text-slate-400">Abert.</span> <b className="text-slate-700">{int(Number(activity.Abertura ?? 0))}</b></span>
                <span><span className="text-slate-400">Cliques</span> <b className="text-slate-700">{int(Number(activity.Cliques ?? 0))}</b></span>
                <span><span className="text-slate-400">Cartões</span> <b className="text-slate-700">{int(Number(activity['Cartões Gerados'] ?? activity['CartÃµes Gerados'] ?? 0))}</b></span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ScoreBreakdown: React.FC<{ item: TemplatePerformance }> = ({ item }) => {
  const taxaAbertura = item.baseEnviada > 0 ? item.aberturas / item.baseEnviada : 0;
  const rows = [
    {
      label: 'Abertura',
      weight: 'peso 20%',
      raw: item.aberturas > 0 ? pct(taxaAbertura) : '—',
      score: item.aberturas > 0 ? clampScore(taxaAbertura / 0.35 * 100) : null,
    },
    {
      label: 'Clique (CTR)',
      weight: 'peso 22%',
      raw: item.cliques > 0 ? pct(item.ctr) : '—',
      score: item.cliques > 0 ? clampScore(item.ctr / 0.0015 * 100) : null,
    },
    {
      label: 'Conversão',
      weight: 'peso 33%',
      raw: item.cartoes > 0 ? pct(item.taxaConversao) : '—',
      score: item.cartoes > 0 ? clampScore(item.taxaConversao / 0.00012 * 100) : null,
    },
    {
      label: 'Eficiência de CAC',
      weight: 'peso 15%',
      raw: item.cacEfetivo > 0 ? brl(item.cacEfetivo) : '—',
      score: item.cacEfetivo > 0 ? clampScore(((60 - item.cacEfetivo) / (60 - 12)) * 100) : null,
    },
  ];

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Como o score foi calculado</p>
      <div className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[132px_1fr_58px_34px] items-center gap-2 text-xs">
            <div className="min-w-0">
              <span className="font-semibold text-slate-600">{row.label}</span>
              <span className="ml-1 text-[10px] text-slate-400">{row.weight}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${scoreTone(row.score)}`} style={{ width: `${row.score ?? 0}%` }} />
            </div>
            <span className="text-right font-semibold tabular-nums text-slate-500">{row.raw}</span>
            <span className="text-right font-bold tabular-nums text-slate-700">{row.score == null ? 'n/d' : row.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const FunnelBreakdown: React.FC<{ item: TemplatePerformance }> = ({ item }) => {
  const steps = [
    { label: 'Base', value: item.baseEnviada, aux: null },
    { label: 'Abertura', value: item.aberturas, aux: item.baseEnviada > 0 ? pct(item.aberturas / item.baseEnviada) : null },
    { label: 'Clique', value: item.cliques, aux: item.baseEnviada > 0 ? pct(item.ctr) : null },
    { label: 'Cartões', value: item.cartoes, aux: null },
  ];
  const max = Math.max(...steps.map((step) => step.value), 1);

  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-3">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Funil do disparo</p>
      <div className="space-y-2.5">
        {steps.map((step) => (
          <div key={step.label} className="grid grid-cols-[72px_1fr_112px] items-center gap-3 text-xs">
            <span className="font-semibold text-slate-500">{step.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(1.5, (step.value / max) * 100)}%` }} />
            </div>
            <span className="text-right font-bold tabular-nums text-slate-700">
              {int(step.value)}
              {step.aux && <small className="ml-1 font-semibold text-slate-400">{step.aux}</small>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CommunicationDetailModal: React.FC<Props> = ({ item, onClose, onChanged }) => {
  const { template } = item;
  const email = isEmailChannel(template.channel);
  const [html, setHtml] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Rename do template_id (PK, FK ON UPDATE CASCADE)
  const [renaming, setRenaming] = useState(false);
  const [newId, setNewId] = useState(template.template_id);
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [replacingAsset, setReplacingAsset] = useState(false);
  const [selectedDay, setSelectedDay] = useState<TemplateTimelinePoint | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityRow | null>(null);

  const handleTimelinePointClick = (point: TemplateTimelinePoint) => {
    if (point.activities.length === 1) {
      setSelectedActivity(point.activities[0]);
      return;
    }
    if (point.activities.length > 1) {
      setSelectedDay(point);
    }
  };

  const handleRename = async () => {
    const next = normalizeTemplateId(newId);
    if (next === template.template_id) { setRenaming(false); return; }
    if (!isValidTemplateId(next)) { setRenameError('Formato inválido (3-80 chars A-Za-z 0-9 _ -).'); return; }
    setRenameBusy(true);
    setRenameError(null);
    try {
      await renameTemplate(template.template_id, next);
      onChanged?.();
      onClose();
    } catch (err) {
      setRenameError(describeError(err));
    } finally {
      setRenameBusy(false);
    }
  };

  const handleDeleteAsset = async () => {
    const confirmed = window.confirm('Excluir a peça deste template? O template e os vínculos continuam, mas ele volta para "sem peça".');
    if (!confirmed) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteTemplateAsset(template);
      onChanged?.();
      onClose();
    } catch (err) {
      setDeleteError(describeError(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const subject = typeof template.metadata?.subject === 'string' ? template.metadata.subject : '';
  const preheader = typeof template.metadata?.preheader === 'string' ? template.metadata.preheader : '';
  const estimado = item.custoEstimado;

  useEffect(() => {
    let active = true;
    const path = template.original_path;
    if (!path) { setFailed(true); return; }
    getSignedUrl(path)
      .then(async (u) => {
        if (!active) return;
        if (email) {
          const text = await fetch(u).then((r) => r.text());
          if (active) setHtml(withEmailPreviewScale(text));
        } else {
          setImgUrl(u);
        }
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [template.original_path, email]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[95vh] w-[94vw] max-w-[1660px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {renaming ? (
                <div className="flex items-center gap-1">
                  <input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    autoFocus
                    className="w-72 rounded-lg border border-cyan-400 px-2 py-1 font-mono text-sm text-slate-700 focus:outline-none"
                  />
                  <button onClick={handleRename} disabled={renameBusy}
                    className="rounded-md bg-cyan-600 p-1.5 text-white hover:bg-cyan-500 disabled:opacity-50" title="Salvar id">
                    {renameBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => { setRenaming(false); setNewId(template.template_id); setRenameError(null); }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" title="Cancelar"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <h3 className="truncate font-mono text-lg font-bold text-slate-800">{template.template_id}</h3>
                  <button onClick={() => setRenaming(true)} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-cyan-600" title="Renomear template_id">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setEditing((v) => !v)} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-cyan-600" title="Editar template">
                    <Settings2 size={14} />
                  </button>
                </>
              )}
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{template.channel}</span>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">{template.status}</span>
            </div>
            {renameError && <p className="mt-1 text-xs text-red-500">{renameError}</p>}
            {editing && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <button
                  onClick={handleDeleteAsset}
                  disabled={deleteBusy || !template.original_path}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={template.original_path ? 'Excluir peça do template' : 'Este template já está sem peça'}
                >
                  {deleteBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Excluir peça
                </button>
                <button
                  onClick={() => setReplacingAsset(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50"
                  title="Substituir ou adicionar peça neste template"
                >
                  <UploadCloud size={13} />
                  Substituir peça
                </button>
                <span className="text-xs text-slate-400">Troque o HTML/imagem ou remova a peça mantendo template_id, vínculos e histórico.</span>
              </div>
            )}
            {deleteError && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="mt-1.5"><TemplateIdChips id={template.template_id} /></div>
            <p className="mt-1 text-sm text-slate-500">
              {template.title && template.title !== template.template_id ? `${template.title} · ` : ''}
              {item.activityNames.length} activity_name{item.activityNames.length === 1 ? '' : 's'} · {int(item.executions)} execuções
              {template.version_label ? ` · ${template.version_label}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden xl:grid-cols-12">
          {/* Preview (e-mail completo / imagem) */}
          <div className="flex flex-col border-b border-slate-200 xl:col-span-8 xl:border-b-0 xl:border-r">
            <div className="bg-slate-100 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Peça {email ? '(e-mail completo)' : ''}
            </div>
            <div className="min-h-[300px] flex-1 overflow-auto bg-slate-50">
              {failed ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-slate-300">
                  <FileImage size={32} /> <span className="text-sm">Preview indisponível</span>
                </div>
              ) : email ? (
                html === null ? (
                  <div className="flex h-full min-h-[300px] items-center justify-center text-slate-300">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : (
                  <iframe title={`Preview ${template.template_id}`} sandbox="" srcDoc={html} className="h-[76vh] w-full bg-white" />
                )
              ) : imgUrl ? (
                <div className="flex items-center justify-center p-4">
                  <img src={imgUrl} alt={template.template_id} className="max-w-full" />
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center text-slate-300">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Detalhes + métricas */}
          <div className="overflow-y-auto p-5 xl:col-span-4">
            {email && (
              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Assunto</p>
                  <p className="text-sm text-slate-700">{subject || <span className="text-slate-300">—</span>}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Pré-cabeçalho</p>
                  <p className="text-sm text-slate-700">{preheader || <span className="text-slate-300">—</span>}</p>
                </div>
              </div>
            )}

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Métricas somadas</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Base enviada" value={int(item.baseEnviada)} />
              <Stat label="Aberturas" value={int(item.aberturas)} />
              <Stat label="Cliques" value={int(item.cliques)} />
              <Stat label="CTR" value={pct(item.ctr)} />
              <Stat label="Conversão" value={pct(item.taxaConversao)} />
              <Stat label="Cartões" value={int(item.cartoes)} />
              <Stat label="Propostas" value={int(item.propostas)} />
              <Stat
                label={estimado ? 'Gasto estimado' : 'Gasto'}
                value={item.custoEfetivo > 0 ? `${estimado ? '~' : ''}${brl(item.custoEfetivo)}` : '—'}
                hint={estimado ? 'base × custo de canal' : 'Custo Total Campanha'}
              />
              <Stat
                label={estimado ? 'CAC estimado' : 'CAC'}
                value={item.cacEfetivo > 0 ? `${estimado ? '~' : ''}${brl(item.cacEfetivo)}` : '—'}
                hint="gasto / cartões"
              />
            </div>

            <ScoreBreakdown item={item} />
            <FunnelBreakdown item={item} />
            <ContentTimeline item={item} onPointClick={handleTimelinePointClick} />

            <div className="mt-5 border-t border-slate-100 pt-4">
              <ActivityLinkManager template={template} onChanged={onChanged} />
            </div>
          </div>
        </div>
      </div>
      {replacingAsset && (
        <AddAssetModal
          template={decorateTemplate(template)}
          onClose={() => setReplacingAsset(false)}
          onSaved={() => {
            setReplacingAsset(false);
            onChanged?.();
            onClose();
          }}
        />
      )}
      {selectedDay && (
        <ActivityDayPicker
          point={selectedDay}
          onClose={() => setSelectedDay(null)}
          onSelect={(activity) => {
            setSelectedDay(null);
            setSelectedActivity(activity);
          }}
        />
      )}
      {selectedActivity && (
        <DisparoDetailModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onSaved={(updated) => {
            setSelectedActivity(updated);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
};
