import React, { useMemo, useState } from 'react';
import { aggregatePool, type PoolDispatchRow } from './poolVisaModel';
import { filterLpEvents, normalizeGroup, type LpEventRow, type LpFilters } from './poolVisaLpModel';
import { CRM_ORIGINS, LP_CHANNELS, costRatio, sumCost } from './poolVisaCostModel';
import { DATA as VITRINE, LATEST, toPositions } from './vitrine/model';

const nf = (n: number) => n.toLocaleString('pt-BR');
const pct = (n: number) => `${(n * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const money = (n: number | null) => (n === null ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const PIECE_TO_GROUP: Record<string, string> = { Moda: 'MODA', 'Saúde e Beleza': 'SAUDE_BELEZA', 'Família e Presentes': 'FAMILIA_PRESENTES', Genérico: 'GENERICO' };

/** Onde cada marca apareceu nas extrações da vitrine (seleção registrada, não exibição). */
function vitrineByBrand(): Map<string, { rounds: Set<string>; best: number; groups: Set<string> }> {
  const out = new Map<string, { rounds: Set<string>; best: number; groups: Set<string> }>();
  for (const snap of VITRINE.positions) {
    for (const p of toPositions(snap)) {
      const brand = LATEST.get(p.ofertaId)?.MARCA;
      if (!brand) continue;
      const v = out.get(brand) ?? { rounds: new Set<string>(), best: 99, groups: new Set<string>() };
      v.rounds.add(p.versao);
      v.best = Math.min(v.best, p.posicao);
      v.groups.add(p.grupo);
      out.set(brand, v);
    }
  }
  return out;
}

const Th: React.FC<{ children: React.ReactNode; left?: boolean }> = ({ children, left }) => <th className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 ${left ? 'text-left' : 'text-right'}`}>{children}</th>;
const Td: React.FC<{ children: React.ReactNode; left?: boolean; strong?: boolean; muted?: boolean }> = ({ children, left, strong, muted }) => <td className={`px-3 py-2 ${left ? 'text-left' : 'text-right tabular-nums'} ${strong ? 'font-bold text-slate-900' : ''} ${muted ? 'text-slate-400' : ''}`}>{children}</td>;

/** Custo do CRM contra leitura e clique, por grupo da peça (WhatsApp) e por marca (LP). */
export const EfficiencyCard: React.FC<{ rows: PoolDispatchRow[]; events: LpEventRow[]; lpFilters: LpFilters; lpBlocked: boolean; lpReady: boolean }> = ({ rows, events, lpFilters, lpBlocked, lpReady }) => {
  const [mode, setMode] = useState<'peca' | 'marca'>('peca');
  const disparos = useMemo(() => rows.filter((r) => r.kind === 'disparo'), [rows]);
  const lpCost = useMemo(() => sumCost(disparos.filter((r) => (LP_CHANNELS as readonly string[]).includes(r.channel))), [disparos]);
  const lpEvents = useMemo(() => filterLpEvents(events, { ...lpFilters, origins: lpFilters.origins ?? CRM_ORIGINS }).filter((e) => e.event === 'clique_oferta'), [events, lpFilters]);

  const pieces = useMemo(() => {
    const wpp = disparos.filter((r) => r.channel === 'WhatsApp' && r.pieceGroup);
    const clicksByGroup = new Map<string, number>();
    for (const e of lpEvents) {
      const g = normalizeGroup(e.groupRaw);
      if (g) clicksByGroup.set(g, (clicksByGroup.get(g) ?? 0) + e.count);
    }
    return aggregatePool(wpp, ['pieceGroup']).map((a) => {
      const piece = a.dims.pieceGroup;
      const cost = sumCost(wpp.filter((r) => r.pieceGroup === piece));
      const clicks = clicksByGroup.get(PIECE_TO_GROUP[piece] ?? '') ?? null;
      return {
        piece, pieces: a.dispatches, delivered: a.delivered.value, reads: a.opens.value, readRate: a.openRate, cost: cost.value,
        perThousand: costRatio(cost, a.delivered.value === null ? null : a.delivered.value / 1000),
        perRead: costRatio(cost, a.opens.value), clicks, perClick: clicks ? costRatio(cost, clicks) : null,
      };
    }).sort((x, y) => (y.delivered ?? 0) - (x.delivered ?? 0));
  }, [disparos, lpEvents]);
  const anyGroupClick = pieces.some((p) => p.clicks);

  const brands = useMemo(() => {
    const vit = vitrineByBrand();
    const by = new Map<string, number>();
    for (const e of lpEvents) if (e.brand) by.set(e.brand, (by.get(e.brand) ?? 0) + e.count);
    const total = [...by.values()].reduce((s, n) => s + n, 0);
    return {
      total,
      rows: [...by.entries()].map(([brand, clicks]) => {
        const v = vit.get(brand);
        return { brand, clicks, share: total ? clicks / total : 0, per1000: lpCost.value && lpCost.known === lpCost.total ? (clicks / lpCost.value) * 1000 : null, rounds: v?.rounds.size ?? 0, best: v && v.best < 99 ? v.best : null, groups: v ? [...v.groups].length : 0 };
      }).sort((a, b) => b.clicks - a.clicks),
    };
  }, [lpEvents, lpCost]);

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-label="Eficiência por grupo da peça e por marca">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Custo × resposta</p>
          <h3 className="text-base font-bold text-slate-900">Eficiência por grupo da peça e por marca</h3>
          <p className="mt-0.5 text-xs text-slate-500">{mode === 'peca' ? 'Quanto custou cada leitura e cada clique, por vitrine enviada no WhatsApp.' : 'Cliques em oferta na LP por marca, contra o custo dos canais que levam à LP.'}</p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label="Recorte">
          {([['peca', 'Grupo da peça'], ['marca', 'Marca']] as const).map(([k, l]) => (
            <button key={k} type="button" aria-pressed={mode === k} onClick={() => setMode(k)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${mode === k ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{l}</button>
          ))}
        </div>
      </div>
      {mode === 'peca' && (
        pieces.length ? <>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-xs">
            <thead className="bg-slate-50"><tr><Th left>Grupo da peça</Th><Th>Peças</Th><Th>Entregues</Th><Th>Custo</Th><Th>Custo por mil</Th><Th>Leituras</Th><Th>% leitura</Th><Th>Custo por leitura</Th><Th>Cliques em oferta</Th><Th>Custo por clique</Th></tr></thead>
            <tbody>{pieces.map((p) => (
              <tr key={p.piece} className="border-t border-slate-100">
                <Td left strong>{p.piece}</Td><Td>{p.pieces}</Td><Td>{p.delivered === null ? '—' : nf(p.delivered)}</Td><Td>{money(p.cost)}</Td><Td>{money(p.perThousand)}</Td>
                <Td>{p.reads === null ? '—' : nf(p.reads)}</Td><Td>{p.readRate === null ? '—' : pct(p.readRate)}</Td><Td strong>{money(p.perRead)}</Td>
                <Td muted={!p.clicks}>{p.clicks ? nf(p.clicks) : 'aguardando links'}</Td><Td strong={Boolean(p.perClick)}>{money(p.perClick)}</Td>
              </tr>
            ))}</tbody>
          </table></div>
          <p className="px-5 py-3 text-[11px] text-slate-500">Só o WhatsApp tem grupo da peça (lido do nome). {anyGroupClick ? 'Cliques por grupo vêm do parâmetro grupo do clique_oferta.' : 'O clique por grupo aparece quando os links levarem o grupo até a LP; hoje o WhatsApp chega sem UTM e sem grupo.'} Grupo da peça não é célula do teste.</p>
        </> : <p className="px-5 pb-4 text-xs text-slate-500">Sem peças de WhatsApp no recorte.</p>
      )}
      {mode === 'marca' && (
        lpBlocked ? <p className="mx-5 mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">O GA4 não identifica BU. Volte para Afinz + Plurix para ver as marcas.</p>
          : !lpReady ? <p className="px-5 pb-4 text-xs text-slate-500">Dados da LP indisponíveis.</p>
            : <>
              <div className="max-h-[420px] overflow-auto"><table className="w-full min-w-[820px] text-xs">
                <thead className="sticky top-0 bg-slate-50"><tr><Th left>Marca</Th><Th>Cliques em oferta</Th><Th>% dos cliques</Th><Th>Cliques por R$ 1.000</Th><Th>Rodadas na vitrine</Th><Th>Melhor posição</Th><Th>Grupos</Th></tr></thead>
                <tbody>{brands.rows.map((b) => (
                  <tr key={b.brand} className="border-t border-slate-100">
                    <Td left strong>{b.brand}</Td><Td>{nf(b.clicks)}</Td><Td>{pct(b.share)}</Td>
                    <Td strong>{b.per1000 === null ? '—' : b.per1000.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</Td>
                    <Td muted={!b.rounds}>{b.rounds || 'fora das extrações'}</Td><Td>{b.best ? `${b.best}º` : '—'}</Td><Td>{b.groups || '—'}</Td>
                  </tr>
                ))}</tbody>
              </table></div>
              <p className="px-5 py-3 text-[11px] text-slate-500">Cliques por R$ 1.000 é um índice para comparar marcas no mesmo recorte (custo de SMS e WhatsApp {money(lpCost.value)}). Não é custo da marca: o disparo mostra 3 marcas e o rateio por vitrine depende do vínculo disparo × rodada. Rodadas e posição vêm das extrações da vitrine: seleção registrada, não exibição comprovada.</p>
            </>
      )}
    </section>
  );
};
