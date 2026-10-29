import { useEffect, useMemo, useRef, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useUserRole } from '../../../context/UserRoleContext';
import { fetchResultsSnapshot } from './resultsService';
import { duplicateIds, lastClosedDay, matchesScope, validMonth } from './results.logic';
import { buildAudiencePartnerMatrix, cellScope, matrixKey, MatrixMeasure } from './audienceMatrix.logic';
import { ResultsScope, ResultsSnapshot } from './results.types';
import { matchesWikiAnalytics, WikiAnalytics } from '../../vault/wikiAnalytics';

const fmt = (v: number | null) => v === null ? 'Indisponível' : v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const label = (value: string) => value ? value.replace(/_/g, ' ') : 'Não informado';
const input = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-cyan-600';
type ColorMode = 'ratio' | 'variation' | 'none';
interface Props {
  config: WikiAnalytics;
  variants: Partial<ResultsScope>[];
  month: string;
  onMonth: (month: string) => void;
  onOpen: (scope: Partial<ResultsScope>, month: string) => void;
}

function variationText(measure: MatrixMeasure) {
  if (measure.variation === null) return measure.variationNote;
  return `${measure.variation >= 0 ? '+' : ''}${fmt(measure.variation)}% vs mês anterior`;
}

export function AudiencePartnerMatrix({ config, variants, month: routeMonth, onMonth, onOpen }: Props) {
  const { user } = useAuth(); const { isPlurixAnalyst } = useUserRole();
  const [snapshot, setSnapshot] = useState<ResultsSnapshot | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [bu, setBu] = useState(''), [color, setColor] = useState<ColorMode>('ratio');
  const request = useRef(0);
  useEffect(() => {
    const id = ++request.current; setError(''); setLoading(true);
    if (!user) { setLoading(false); return; }
    fetchResultsSnapshot(config.domain, user.id).then(data => { if (id === request.current) setSnapshot(data); })
      .catch(e => { if (id === request.current) setError(e.message || 'Falha ao carregar a matriz.'); })
      .finally(() => { if (id === request.current) setLoading(false); });
    return () => { request.current++; };
  }, [config.domain, user?.id]);
  const closed = lastClosedDay();
  const fixedBu = config.scope.bu || (isPlurixAnalyst && config.domain === 'crm' ? 'Plurix' : '');
  const effectiveBu = fixedBu || bu;
  const duplicates = useMemo(() => duplicateIds(snapshot?.rows.filter(r => r.date <= closed) || []), [snapshot, closed]);
  const scoped = useMemo(() => snapshot?.rows.filter(r => r.date && r.date <= closed && matchesWikiAnalytics(r, config)) || [], [snapshot, closed, config]);
  const bus = useMemo(() => [...new Set(scoped.map(r => r.bu).filter(Boolean))].sort(), [scoped]);
  const rows = useMemo(() => effectiveBu ? scoped.filter(r => matchesScope(r, { ...config.scope, bu: effectiveBu })) : scoped, [scoped, effectiveBu, config.scope]);
  const months = useMemo(() => [...new Set(rows.map(r => r.date.slice(0, 7)))].sort().reverse(), [rows]);
  const month = validMonth(routeMonth) || months[0] || closed.slice(0, 7);
  const partnerOrder = useMemo(() => [...new Set(variants.map(v => v.partner || '').filter(Boolean))], [variants]);
  const matrix = useMemo(() => buildAudiencePartnerMatrix(rows, duplicates, month, closed, partnerOrder), [rows, duplicates, month, closed, partnerOrder]);
  const domainLabels = config.domain === 'renta' ? { primary: 'cliques', ratio: 'cliques / base acionável' } : { primary: 'cartões', ratio: 'cartões / propostas' };
  const maxRatio = Math.max(0, ...[...matrix.cells.values()].map(c => c.summary.rows ? c.summary.ratio ?? 0 : 0));
  const tone = (measure: MatrixMeasure | undefined) => {
    if (!measure || !measure.summary.rows || color === 'none') return undefined;
    if (color === 'ratio') return measure.summary.ratio === null || maxRatio <= 0 ? undefined : { backgroundColor: `rgba(8,145,178,${0.06 + 0.3 * measure.summary.ratio / maxRatio})` };
    if (measure.variation === null) return undefined;
    const alpha = 0.06 + 0.3 * Math.min(Math.abs(measure.variation), 100) / 100;
    return { backgroundColor: measure.variation >= 0 ? `rgba(22,163,74,${alpha})` : `rgba(220,38,38,${alpha})` };
  };
  const open = (scope: Partial<ResultsScope>) => onOpen({ ...(effectiveBu && !fixedBu ? { bu: effectiveBu } : {}), ...scope }, month);
  const cellRows = (segment: string, partner: string) => rows.filter(r => r.segment === segment && r.partner === partner && r.date.startsWith(month) && r.date <= matrix.window.end);
  const single = matrix.segments.length === 1 ? 'partner' : matrix.partners.length === 1 ? 'segment' : '';
  const heading = single === 'partner' ? 'Por parceiro' : single === 'segment' ? 'Por público' : 'Público × parceiro';
  const measureBody = (measure: MatrixMeasure) => <>
    <span className="block text-base font-semibold text-slate-900">{fmt(measure.summary.primary)}{measure.summary.primaryKnown < measure.summary.usable && measure.summary.primary !== null ? '*' : ''}</span>
    <span className="block text-[11px] text-slate-600">{measure.summary.usable} disparos · {measure.summary.ratio === null ? 'conversão indisponível' : fmt(measure.summary.ratio) + '%'}</span>
    <span className="block text-[11px] text-slate-500">{variationText(measure)}</span>
  </>;
  if (loading) return <div role="status" className="my-6 animate-pulse rounded-xl border bg-white p-6 text-sm text-slate-500">Montando a matriz de público e parceiro…</div>;
  if (error) return <div role="alert" className="my-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  return <section aria-label="Matriz público × parceiro" data-audience-matrix className="my-6 rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h4 className="flex items-center gap-2 font-semibold text-slate-900"><Grid3x3 size={17} className="text-cyan-700" />{heading} · {month}</h4>
        <p className="mt-1 text-sm text-slate-600">Cada célula mostra {domainLabels.primary} registrados, disparos e conversão ({domainLabels.ratio}). Clique na linha, na coluna ou na célula para abrir o resultado já filtrado.</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold text-slate-600">Mês<select aria-label="Mês da matriz" className={'mt-1 block ' + input} value={month} onChange={e => onMonth(e.target.value)}>{[...new Set([month, ...months])].sort().reverse().map(m => <option key={m}>{m}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">BU<select aria-label="BU da matriz" className={'mt-1 block ' + input} value={effectiveBu} disabled={Boolean(fixedBu)} onChange={e => setBu(e.target.value)}><option value="">Todas</option>{[...new Set([effectiveBu, ...bus].filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></label>
        <label className="text-xs font-semibold text-slate-600">Cor<select aria-label="Cor da matriz" className={'mt-1 block ' + input} value={color} onChange={e => setColor(e.target.value as ColorMode)}><option value="ratio">Por conversão</option><option value="variation">Por variação</option><option value="none">Sem cor</option></select></label>
      </div>
    </div>
    {!matrix.segments.length ? <p role="status" className="mt-4 text-sm text-slate-600">Sem registros em dias fechados neste mês e recorte. Escolha outro mês.</p> : <>
      <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{heading} em {month}: {domainLabels.primary}, disparos, conversão e variação contra o mesmo corte do mês anterior</caption>
        <thead><tr className="border-b text-xs text-slate-500"><th scope="col" className="p-2">Público \ Parceiro</th>
          {matrix.partners.map(partner => <th key={partner} scope="col" className="p-2"><button type="button" disabled={!partner} onClick={() => open({ partner })} className="font-semibold text-cyan-800 hover:underline disabled:text-slate-500">{label(partner)}</button></th>)}
          <th scope="col" className="p-2">Total</th></tr></thead>
        <tbody>{matrix.segments.map(segment => <tr key={segment} className="border-b align-top">
          <th scope="row" className="max-w-[220px] p-2"><button type="button" disabled={!segment} onClick={() => open({ segment })} className="text-left font-semibold text-cyan-800 hover:underline disabled:text-slate-500">{label(segment)}</button></th>
          {matrix.partners.map(partner => {
            const measure = matrix.cells.get(matrixKey(segment, partner));
            // Absent combination: empty cell, never a zero.
            if (!measure || !measure.summary.rows) return <td key={partner} className="p-2" title={measure ? `Sem registros neste mês · anterior: ${fmt(measure.previous.primary)} ${domainLabels.primary}` : undefined}><span className="sr-only">Sem registros neste mês</span></td>;
            return <td key={partner} className="p-1" style={tone(measure)}><button type="button" disabled={!segment || !partner} onClick={() => open(cellScope(segment, partner, cellRows(segment, partner), variants))} className="w-full rounded-md p-1.5 text-left hover:ring-2 hover:ring-cyan-400 disabled:cursor-default">{measureBody(measure)}</button></td>;
          })}
          <td className="bg-slate-50 p-2">{matrix.segmentTotals.get(segment)?.summary.rows ? measureBody(matrix.segmentTotals.get(segment)!) : <span className="sr-only">Sem registros neste mês</span>}</td>
        </tr>)}</tbody>
        {matrix.segments.length > 1 && <tfoot><tr className="bg-slate-50 align-top"><th scope="row" className="p-2 text-xs text-slate-600">Total</th>
          {matrix.partners.map(partner => <td key={partner} className="p-2">{matrix.partnerTotals.get(partner)?.summary.rows ? measureBody(matrix.partnerTotals.get(partner)!) : <span className="sr-only">Sem registros neste mês</span>}</td>)}
          <td className="p-2">{matrix.total.summary.rows ? measureBody(matrix.total) : null}</td></tr></tfoot>}
      </table></div>
      <p className="mt-3 text-xs text-slate-500">Mesmas regras do bloco de resultado: só dias fechados, chaves repetidas desconsideradas antes do recorte, comparação com {matrix.window.previous} até o dia {matrix.window.cut}{matrix.window.partial ? ' (mês parcial)' : ''}. Célula vazia é combinação sem registro, não produção zero. * indica medida com dados parciais. Disparos contam registros usados, não pessoas.</p>
    </>}
  </section>;
}
