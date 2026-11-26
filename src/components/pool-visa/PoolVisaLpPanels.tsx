import React, { useMemo, useState } from 'react';
import { aggregatePool, type PoolDispatchRow } from './poolVisaModel';
import {
  LP_ORIGIN_LABELS, POOL_CELLS, POOL_GROUPS, POOL_GROUP_LABELS, cellExists, cellMatrix, isControlCell, offerRanking, sessionsByDayOrigin,
  type LpEventRow, type LpFilters, type LpOrigin, type LpTrafficRow, type PoolCellKey,
} from './poolVisaLpModel';

const CHANNEL_COLORS: Record<string, string> = { 'E-mail': '#0891b2', SMS: '#6366f1', WhatsApp: '#16a34a' };
const ORIGIN_COLORS: Record<LpOrigin, string> = { direto: '#94a3b8', sms: '#6366f1', whatsapp: '#16a34a', outros: '#cbd5e1' };
const nf = (n: number) => n.toLocaleString('pt-BR');
const pct = (n: number) => `${(n * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const dd = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const short = (n: number) => (n >= 1000 ? `${Math.round(n / 1000).toLocaleString('pt-BR')} mil` : nf(n));

const Card: React.FC<{ kicker: string; title: string; description?: React.ReactNode; badge?: React.ReactNode; children: React.ReactNode }> = ({ kicker, title, description, badge, children }) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{kicker}</p>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {badge}
    </div>
    {children}
  </section>
);

export const Pill: React.FC<{ tone: 'amber' | 'slate' | 'sky' | 'red' | 'green'; children: React.ReactNode }> = ({ tone, children }) => {
  const cls = { amber: 'bg-amber-50 text-amber-700', slate: 'bg-slate-100 text-slate-600', sky: 'bg-sky-50 text-sky-700', red: 'bg-red-50 text-red-700', green: 'bg-emerald-50 text-emerald-700' }[tone];
  return <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{children}</span>;
};

const NoBu: React.FC = () => (
  <p className="mx-5 mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">O GA4 não identifica BU. Volte para Afinz + Plurix para ver a LP.</p>
);

function days(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (d <= last && out.length < 400) { out.push(d.toISOString().slice(0, 10)); d.setDate(d.getDate() + 1); }
  return out;
}

/** Comunicação (SFMC) e visitas (GA4) na mesma régua de dias, escalas separadas. */
export const DualTimeline: React.FC<{ rows: PoolDispatchRow[]; traffic: LpTrafficRow[]; lpFilters: LpFilters; lpBlocked: boolean; start: string; end: string; attribution?: React.ReactNode }> = ({ rows, traffic, lpFilters, lpBlocked, start, end, attribution }) => {
  const axis = useMemo(() => days(start, end), [start, end]);
  const sfmc = useMemo(() => {
    const by = new Map<string, Record<string, number>>();
    for (const r of rows) {
      if (r.delivered === null) continue;
      const day = by.get(r.date) ?? {};
      day[r.channel] = (day[r.channel] ?? 0) + r.delivered;
      by.set(r.date, day);
    }
    return by;
  }, [rows]);
  const lp = useMemo(() => sessionsByDayOrigin(traffic, lpFilters), [traffic, lpFilters]);
  const sendDays = new Set(sfmc.keys());
  const max = (m: Map<string, Record<string, number>> | Map<string, Partial<Record<LpOrigin, number>>>) =>
    Math.max(1, ...[...m.values()].map((o) => Object.values(o).reduce<number>((a, b) => a + (b ?? 0), 0)));
  const sMax = max(sfmc);
  const lMax = max(lp);
  const lpOff = lpBlocked || lpFilters.group !== null || lpFilters.cell !== null;
  const grid = { gridTemplateColumns: `repeat(${axis.length}, minmax(0, 1fr))` };

  const lane = (data: Map<string, Record<string, number>> | Map<string, Partial<Record<LpOrigin, number>>>, top: number, colors: Record<string, string>, label: string) => (
    <div className="grid h-32 items-end gap-1 border-b border-slate-200" style={grid}>
      {axis.map((d) => {
        const o = (data.get(d) ?? {}) as Record<string, number>;
        const total = Object.values(o).reduce((a, b) => a + b, 0);
        return (
          <div key={d} className={`relative flex h-full flex-col-reverse ${sendDays.has(d) ? 'bg-cyan-50/70' : ''}`} title={total ? `${dd(d)} · ${label}: ${nf(total)}` : undefined}>
            {Object.entries(o).map(([k, v]) => <div key={k} style={{ height: `${(v / top) * 85}%`, background: colors[k] ?? '#cbd5e1' }} title={`${k}: ${nf(v)}`} />)}
            {total > 0 && <span className="mb-0.5 text-center text-[9px] text-slate-500">{short(total)}</span>}
          </div>
        );
      })}
    </div>
  );

  return (
    <Card kicker="Linha do tempo · mesma régua de dias" title="Disparos e visitas à LP, dia a dia" description="Em cima o que o SFMC entregou, embaixo as sessões na LP. Os dias com disparo ficam destacados nas duas faixas.">
      <div className="overflow-x-auto px-5">
        <div className="grid min-w-[720px] grid-cols-[110px_1fr] gap-x-3">
          <div className="flex flex-col justify-center text-xs font-bold text-slate-600">SFMC<span className="text-[10px] font-medium text-slate-400">entregues por canal</span></div>
          {lane(sfmc, sMax, CHANNEL_COLORS, 'entregues')}
          <div className="col-span-2 my-2 flex items-center gap-2 text-[10px] font-semibold text-slate-600">
            <span className="h-0.5 flex-1 bg-slate-400" /> Escalas independentes <span className="h-0.5 flex-1 bg-slate-400" />
          </div>
          <div className="flex flex-col justify-center text-xs font-bold text-slate-600">GA4<span className="text-[10px] font-medium text-slate-400">sessões por origem</span></div>
          {lpOff
            ? <div className="flex h-32 items-center justify-center border-b border-slate-200 text-xs text-slate-500">{lpBlocked ? 'O GA4 não identifica BU. A faixa da LP só aparece com Afinz + Plurix.' : 'Visita não tem grupo nem célula: com esses filtros a faixa de sessões fica vazia.'}</div>
            : lane(lp as Map<string, Record<string, number>>, lMax, ORIGIN_COLORS, 'sessões')}
          <div />
          <div className="grid gap-1 pt-1 text-center text-[10px] text-slate-400" style={grid}>{axis.map((d) => <span key={d}>{dd(d)}</span>)}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3 text-[11px] text-slate-600">
        {Object.entries(CHANNEL_COLORS).map(([k, c]) => <span key={k}><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: c }} />{k}</span>)}
        <span className="w-3" />
        {(Object.keys(ORIGIN_COLORS) as LpOrigin[]).map((k) => <span key={k}><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm align-[-1px]" style={{ background: ORIGIN_COLORS[k] }} />{LP_ORIGIN_LABELS[k]}</span>)}
      </div>
      {attribution && <div className="px-5 pb-3">{attribution}</div>}
      <p className="px-5 pb-4 text-[11px] text-slate-500">SFMC mede entregas da comunicação. GA4 mede sessões na LP. As duas faixas compartilham apenas a régua de datas.</p>
    </Card>
  );
};

interface BarItem { label: string; value: number; color?: string; onClick?: () => void; hint?: string }

const Bars: React.FC<{ items: BarItem[]; total: number; color: string }> = ({ items, total, color }) => {
  const top = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-1.5">
      {items.map((i) => (
        <div key={i.label} className="grid grid-cols-[170px_1fr_80px] items-center gap-3 text-xs">
          {i.onClick
            ? <button type="button" onClick={i.onClick} className="truncate text-left font-semibold text-cyan-700 underline decoration-dotted underline-offset-2 hover:text-cyan-900" title={i.hint ?? i.label}>{i.label}</button>
            : <span className="truncate text-slate-700" title={i.hint ?? i.label}>{i.label}</span>}
          <div className="h-3.5 overflow-hidden rounded bg-slate-100"><div className="h-full rounded" style={{ width: `${(i.value / top) * 100}%`, background: i.color ?? color }} /></div>
          <span className="text-right font-bold text-slate-800">{nf(i.value)} <span className="font-normal text-slate-400">{total ? pct(i.value / total) : ''}</span></span>
        </div>
      ))}
    </div>
  );
};

const prettyPartner = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export const BrandRankingCard: React.FC<{ events: LpEventRow[]; lpFilters: LpFilters; lpBlocked: boolean }> = ({ events, lpFilters, lpBlocked }) => {
  const r = useMemo(() => offerRanking(events, lpFilters, 'brand'), [events, lpFilters]);
  const [expanded, setExpanded] = useState(false);
  const TOP = 8;
  const rest = r.items.slice(TOP);
  const items: BarItem[] = expanded || rest.length <= 1 ? [...r.items] : r.items.slice(0, TOP);
  if (rest.length > 1 && !expanded) {
    items.push({ label: `Outras ${rest.length} marcas ▸`, value: rest.reduce((s, i) => s + i.value, 0), onClick: () => setExpanded(true), hint: `Ver todas: ${rest.map((i) => i.label).join(', ')}` });
  }
  if (r.undefinedCount) items.push({ label: 'Marca não definida', value: r.undefinedCount, color: '#cbd5e1' });
  return (
    <Card kicker="LP · GA4 · clique_oferta" title="Marcas mais clicadas na LP" description={lpBlocked ? undefined : `${nf(r.total)} cliques em ofertas no recorte · contagem de eventos`} badge={<Pill tone="sky">sem posição</Pill>}>
      {lpBlocked ? <NoBu /> : (
        <div className="px-5 pb-4">
          {r.total ? <Bars items={items} total={r.total} color="#0891b2" /> : <p className="text-xs text-slate-500">Sem cliques em ofertas no recorte.</p>}
          {expanded && rest.length > 1 && <button type="button" onClick={() => setExpanded(false)} className="mt-2 text-xs font-semibold text-cyan-700 underline decoration-dotted underline-offset-2 hover:text-cyan-900">◂ Agrupar as {rest.length} marcas menores</button>}
          <p className="mt-3 text-[11px] text-slate-500">A posição de cada marca na vitrine ainda não está no GaaS. Marca na posição 1 tende a receber mais clique, então o ranking ainda não mostra preferência.</p>
        </div>
      )}
    </Card>
  );
};

export const PartnerRankingCard: React.FC<{ events: LpEventRow[]; lpFilters: LpFilters; lpBlocked: boolean }> = ({ events, lpFilters, lpBlocked }) => {
  const r = useMemo(() => offerRanking(events, lpFilters, 'partner'), [events, lpFilters]);
  const withPartner = r.total - r.undefinedCount;
  // Clique sem parceiro = público Institucional (sem cartão de parceiro), mostrado como uma barra própria.
  const items: BarItem[] = [
    ...(r.undefinedCount ? [{ label: 'Institucional (sem parceiro)', value: r.undefinedCount, color: '#94a3b8', hint: 'Cliques sem o parâmetro parceiro: público Institucional' }] : []),
    ...r.items.map((i) => ({ label: prettyPartner(i.label), value: i.value })),
  ].sort((a, b) => b.value - a.value);
  return (
    <Card kicker="LP · GA4 · parâmetro parceiro" title="Parceiros x Clique" description={lpBlocked ? undefined : `${nf(r.total)} cliques em ofertas · ${nf(withPartner)} com parceiro${r.total ? ` (${pct(withPartner / r.total)})` : ''} e ${nf(r.undefinedCount)} do Institucional`} badge={<Pill tone="slate">não é BU</Pill>}>
      {lpBlocked ? <NoBu /> : (
        <div className="px-5 pb-4">
          {items.length ? <Bars items={items} total={r.total} color="#7c6fd6" /> : <p className="text-xs text-slate-500">Sem cliques em ofertas no recorte.</p>}
          <p className="mt-3 text-[11px] text-slate-500">Parceiro é o parceiro do cartão de quem clicou; sem parceiro, o clique é do público Institucional. Percentuais sobre todos os cliques em ofertas. Não identifica a BU do disparo.</p>
        </div>
      )}
    </Card>
  );
};

const PIECE_GROUPS = ['Genérico', 'Moda', 'Saúde e Beleza', 'Família e Presentes'] as const;

/** Peças de WhatsApp por público e grupo da peça (lidos do nome). Só SFMC. */
export const WhatsAppPiecesCard: React.FC<{ rows: PoolDispatchRow[] }> = ({ rows }) => {
  const wpp = useMemo(() => rows.filter((r) => r.channel === 'WhatsApp' && r.kind === 'disparo' && r.pieceGroup && r.audience), [rows]);
  const cells = useMemo(() => aggregatePool(wpp, ['date', 'audience', 'pieceGroup']), [wpp]);
  const dates = [...new Set(cells.map((c) => c.dims.date))].sort();
  if (!dates.length) return null;
  const find = (d: string, a: string, g: string) => cells.find((c) => c.dims.date === d && c.dims.audience === a && c.dims.pieceGroup === g);
  return (
    <Card kicker="SFMC · WhatsApp · lido do nome da peça" title="Peças de WhatsApp por público e grupo da peça" description="Entregues e % de leitura. O WhatsApp não informa clique." badge={<Pill tone="amber">derivado do nome</Pill>}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-xs">
          <thead>
            <tr className="bg-cyan-50/60 text-[10px] uppercase tracking-wide text-cyan-800"><th />{dates.map((d) => <th key={d} colSpan={4} className="px-3 py-1.5 text-center">{dd(d)}</th>)}</tr>
            <tr className="text-[10px] uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 text-left">Grupo da peça</th>
              {dates.map((d) => <React.Fragment key={d}><th className="px-3 py-2 text-right">Inst. entregues</th><th className="px-3 py-2 text-right">Inst. % leitura</th><th className="px-3 py-2 text-right">Parc. entregues</th><th className="px-3 py-2 text-right">Parc. % leitura</th></React.Fragment>)}
            </tr>
          </thead>
          <tbody>
            {PIECE_GROUPS.map((g) => (
              <tr key={g} className="border-t border-slate-100">
                <td className="px-3 py-2 font-semibold text-slate-700">{g}</td>
                {dates.map((d) => ['Institucional', 'Parceiro'].map((a) => {
                  const c = find(d, a, g);
                  return c
                    ? <React.Fragment key={`${d}${a}`}><td className="px-3 py-2 text-right">{c.delivered.value === null ? '—' : nf(c.delivered.value)}</td><td className="px-3 py-2 text-right">{c.openRate === null ? '—' : pct(c.openRate)}</td></React.Fragment>
                    : <React.Fragment key={`${d}${a}`}><td className="px-3 py-2 text-right text-slate-400">sem peça</td><td /></React.Fragment>;
                }))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 text-[11px] text-slate-500">Grupo da peça é a vitrine enviada, não a célula da pessoa: a peça Genérico junta SEG-B e GEN-A. Não serve para comparar personalização.</p>
    </Card>
  );
};

const CELL_SUB: Record<PoolCellKey, string> = { 'SEG-A': 'vitrine do grupo', 'SEG-B': 'vitrine genérica', 'SEG-C': 'controle', 'GEN-A': 'vitrine genérica', 'GEN-C': 'controle' };

/** Matriz grupo × célula de cliques em oferta. Ignora os filtros de grupo e célula. */
export const CellMatrixCard: React.FC<{ events: LpEventRow[]; lpFilters: LpFilters; lpBlocked: boolean }> = ({ events, lpFilters, lpBlocked }) => {
  const { matrix, quality } = useMemo(() => cellMatrix(events, lpFilters), [events, lpFilters]);
  const ready = quality.withParams > 0;
  const steps: [string, string, 'red' | 'sky' | 'green' | 'slate', string][] = [
    ['Links do Pool levando grupo e célula até a LP, com UTM no WhatsApp', 'CRM / SFMC', ready ? 'green' : 'red', ready ? 'chegando' : 'pendente'],
    ['GTM mandar grupo e célula também no page_view, para ter sessões por célula', 'Sugestão', 'sky', 'a decidir'],
    ['Carga diária do GA4 da LP no Supabase', 'GaaS', 'green', 'ativa'],
    ['População e envios reais por grupo × célula × rodada (sem CPF)', 'GaaS fase 3', 'slate', 'a contratar'],
    ['Compras por célula (IN / Visa)', 'GaaS fase 4', 'slate', 'sem fonte'],
  ];
  return (
    <Card
      kicker="Experimento · afinidade × genérico"
      title="Grupo × célula"
      description={lpBlocked ? 'O GA4 não identifica BU.' : ready
        ? `${nf(quality.withParams)} de ${nf(quality.offerClicks)} cliques em oferta chegaram com grupo e célula. Os números abaixo são cliques, não pessoas, e ainda sem denominador por célula.`
        : `Nenhum dos ${nf(quality.offerClicks)} cliques em oferta do recorte chegou com grupo e célula, então a matriz ainda não tem número.`}
      badge={ready ? <Pill tone="green">com dados</Pill> : <Pill tone="red">aguardando dados</Pill>}
    >
      {!lpBlocked && (
        <div className="overflow-x-auto px-5">
          <div className="grid min-w-[720px] grid-cols-[150px_repeat(5,minmax(0,1fr))] gap-1.5 text-xs">
            <div />
            {POOL_CELLS.map((c) => <div key={c} className="p-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500">{c}<br /><span className="font-medium normal-case tracking-normal text-slate-400">{CELL_SUB[c]}</span></div>)}
            {POOL_GROUPS.map((g) => (
              <React.Fragment key={g}>
                <div className="flex items-center font-bold text-slate-700">{POOL_GROUP_LABELS[g]}</div>
                {POOL_CELLS.map((c) => {
                  if (!cellExists(g, c)) return <div key={c} className="flex min-h-[52px] items-center justify-center text-[11px] text-slate-300">não existe</div>;
                  if (isControlCell(c)) return <div key={c} className="flex min-h-[52px] flex-col items-center justify-center rounded-lg bg-[repeating-linear-gradient(45deg,#f8fafc,#f8fafc_6px,#f1f5f9_6px,#f1f5f9_12px)] text-[11px] text-slate-500"><b className="text-sm text-slate-400">sem link</b>só compra mede</div>;
                  const v = matrix.get(`${g}|${c}`);
                  return v
                    ? <div key={c} className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 text-[11px] text-cyan-800"><b className="text-base">{nf(v)}</b>cliques</div>
                    : <div key={c} className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-500"><b className="text-sm text-slate-400">{ready ? '0' : '?'}</b>{ready ? 'cliques' : 'aguardando links'}</div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {quality.unexpected > 0 && <p className="mx-5 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{nf(quality.unexpected)} clique(s) com valor fora do desenho: {quality.unexpectedValues.join(', ')}. Conferir os links.</p>}
      <div className="grid gap-3 px-5 py-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600"><p className="mb-1 font-bold text-slate-800">SEG-A × SEG-B, no mesmo grupo</p>Personalizar a vitrine faz clicar e comprar mais? É a comparação principal. Precisa de entregues por célula para virar taxa e, depois, de compra.</div>
        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600"><p className="mb-1 font-bold text-slate-800">Tratamento × controle</p>SEG-A e SEG-B × SEG-C, GEN-A × GEN-C: a comunicação gera compra a mais? O controle não recebe link, então só a compra (IN) responde.</div>
        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600"><p className="mb-1 font-bold text-slate-800">O que não comparar</p>GEN-A × SEG-B (populações diferentes), clique da LP ÷ envio de outro canal e grupo da peça de WhatsApp como se fosse célula.</div>
      </div>
      <div className="px-5 pb-4 text-xs">
        {steps.map(([t, who, tone, st]) => (
          <div key={t} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2">
            <span className="text-slate-700">{t} <span className="text-slate-400">· {who}</span></span>
            <Pill tone={tone}>{st}</Pill>
          </div>
        ))}
      </div>
    </Card>
  );
};

/** Sinais de qualidade da LP calculados dos dados, sem texto fixo. */
export const LpQualityCard: React.FC<{ traffic: LpTrafficRow[]; events: LpEventRow[]; lpFilters: LpFilters; lastRun: { createdAt: string; status: string; dateEnd: string } | null }> = ({ traffic, events, lpFilters, lastRun }) => {
  const s = useMemo(() => {
    const f = { ...lpFilters, origins: null, group: null, cell: null };
    const byOrigin = sessionsByDayOrigin(traffic, f);
    let total = 0;
    let direct = 0;
    const topDirect: { day: string; v: number }[] = [];
    for (const [day, o] of byOrigin) {
      const t = Object.values(o).reduce<number>((a, b) => a + (b ?? 0), 0);
      total += t;
      direct += o.direto ?? 0;
      topDirect.push({ day, v: o.direto ?? 0 });
    }
    topDirect.sort((a, b) => b.v - a.v);
    const { quality } = cellMatrix(events, f);
    return { total, direct, topDirect: topDirect.slice(0, 2).filter((x) => x.v > 0), quality };
  }, [traffic, events, lpFilters]);
  const items: { tone: 'amber' | 'cyan'; title: string; text: string }[] = [];
  if (s.total) items.push({ tone: s.direct / s.total > 0.5 ? 'amber' : 'cyan', title: `${pct(s.direct / s.total)} das sessões na LP chegam como tráfego direto (sem UTM).`, text: s.topDirect.length ? `Os maiores dias de tráfego direto foram ${s.topDirect.map((x) => `${dd(x.day)} (${nf(x.v)})`).join(' e ')}. Se coincidirem com disparos de WhatsApp, é indício de link sem UTM, não prova.` : '' });
  if (s.quality.offerClicks) items.push({ tone: s.quality.withParams / s.quality.offerClicks < 0.8 ? 'amber' : 'cyan', title: `${pct(s.quality.withParams / s.quality.offerClicks)} dos cliques em oferta trazem grupo e célula.`, text: 'Abaixo de 80% a comparação por célula fica parcial. Os cliques sem parâmetro não são recuperados depois.' });
  return (
    <Card kicker="Qualidade da LP · calculado dos dados" title="Sinais antes de ler a LP" description={lastRun ? `Última carga do GA4 em ${new Date(lastRun.createdAt).toLocaleString('pt-BR')}, com dados até ${dd(lastRun.dateEnd)}${lastRun.status !== 'ok' ? ` · carga ${lastRun.status}` : ''}.` : 'Nenhuma carga do GA4 registrada.'}>
      <div className="grid gap-2 px-5 pb-4">
        {items.length ? items.map((i) => (
          <div key={i.title} className={`rounded-r-lg border-l-4 px-3 py-2 text-xs ${i.tone === 'amber' ? 'border-amber-400 bg-amber-50/60' : 'border-cyan-500 bg-cyan-50/50'}`}>
            <b className="text-slate-900">{i.title}</b> <span className="text-slate-600">{i.text}</span>
          </div>
        )) : <p className="text-xs text-slate-500">Sem dados da LP no recorte.</p>}
      </div>
    </Card>
  );
};
