import React, { useEffect, useRef, useState } from 'react';
import { Rotation, plannedQueue } from './Rotation';
import { DATA, GROUPS, GROUP_LABEL, LATEST, MOTIVO_LABEL, benefit, br, daysUntil, filled, isTrue, isoDate, latestBriefing, toPositions, versionDate, versionsOf, type Position, type Row } from './model';
import type { PoolDispatchRow } from '../poolVisaModel';
import type { LpEventRow } from '../poolVisaLpModel';

const shortDate = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : '');

// ---------- peças visuais ----------
const Pill: React.FC<{ tone?: 'cyan' | 'amber' | 'slate' | 'red' | 'green' | 'violet'; title?: string; children: React.ReactNode }> = ({ tone = 'slate', title, children }) => {
  const cls = { cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200', amber: 'bg-amber-50 text-amber-800 border-amber-200', slate: 'bg-slate-50 text-slate-600 border-slate-200', red: 'bg-red-50 text-red-700 border-red-200', green: 'bg-emerald-50 text-emerald-700 border-emerald-200', violet: 'bg-violet-50 text-violet-700 border-violet-200' }[tone];
  return <span title={title} className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>{children}</span>;
};
const Card: React.FC<{ kicker?: string; title?: string; description?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ kicker, title, description, right, children, className = '' }) => (
  <section className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {(kicker || title || right) && (
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-4">
        <div>
          {kicker && <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{kicker}</p>}
          {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
          {description && <div className="mt-0.5 text-xs text-slate-500">{description}</div>}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);
const Seg: React.FC<{ value: string; options: { key: string; label: string }[]; onChange: (k: string) => void; label: string }> = ({ value, options, onChange, label }) => (
  <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" role="group" aria-label={label}>
    {options.map((o) => (
      <button key={o.key} type="button" aria-pressed={value === o.key} onClick={() => onChange(o.key)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${value === o.key ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{o.label}</button>
    ))}
  </div>
);
const Select: React.FC<{ label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
  <label className="text-xs font-semibold text-slate-600">{label}
    <select value={value} onChange={(e) => onChange(e.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
);

/** Imagem com fallback e estado de verificação; a URL nunca é trocada. */
const Img: React.FC<{ src: string; alt: string; className?: string; kind: string }> = ({ src, alt, className = '', kind }) => {
  const [state, setState] = useState<'loading' | 'ok' | 'error'>(src ? 'loading' : 'error');
  if (!filled(src)) return <div className={`flex items-center justify-center bg-slate-100 text-[10px] font-semibold text-slate-400 ${className}`}>sem {kind}</div>;
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {state !== 'error' && <img src={src} alt={alt} loading="lazy" onLoad={() => setState('ok')} onError={() => setState('error')} className="h-full w-full object-cover" />}
      {state === 'error' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-[10px] text-amber-700"><span className="font-bold">{kind} não abriu</span><span className="text-amber-600">URL mantida</span></div>}
    </div>
  );
};

const AssetDots: React.FC<{ r: Row | undefined }> = ({ r }) => (
  <div className="flex gap-1">
    {(['FOTO', 'LOGO', 'LINK'] as const).map((f) => (
      <span key={f} title={filled(r?.[f]) ? `${f} preenchido (não verificado)` : `${f} vazio na fonte`} className={`rounded px-1 text-[9px] font-bold ${filled(r?.[f]) ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'}`}>{f.toLowerCase()}{filled(r?.[f]) ? '' : ' ✕'}</span>
    ))}
  </div>
);




// ---------- card de oferta ----------
const OfferCard: React.FC<{ p?: Position; r: Row | undefined; id: string; compact?: boolean; hideVence?: boolean; onOpen: (id: string) => void }> = ({ p, r, id, compact, hideVence, onOpen }) => {
  const fim = isoDate(r?.FIM);
  const left = daysUntil(fim);
  return (
    <button type="button" onClick={() => onOpen(id)} className={`group flex w-full flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md ${compact ? 'border-dashed border-slate-300' : 'border-slate-200'}`}>
      <div className="relative">
        <Img src={r?.FOTO ?? ''} alt={r?.ALT || r?.MARCA || id} kind="foto" className={compact ? 'h-20' : 'h-32'} />
        {p && <span className="absolute left-2 top-2 rounded-md bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-black text-white">#{p.posicao}</span>}
        <div className="absolute -bottom-4 right-3 h-9 w-9 overflow-hidden rounded-lg border-2 border-white bg-white shadow"><Img src={r?.LOGO ?? ''} alt={`logo ${r?.MARCA ?? ''}`} kind="logo" className="h-full w-full [&_img]:object-contain" /></div>
      </div>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-2">
        <div className="pr-10 text-sm font-bold text-slate-900">{r?.MARCA || <span className="text-red-600">ID fora do briefing</span>}</div>
        {!compact && <div className="text-xs font-semibold text-cyan-800">{r ? benefit(r) || 'sem benefício' : ''}</div>}
        {!compact && r?.COMPLEMENTO && <div className="line-clamp-2 text-[11px] text-slate-500">{r.COMPLEMENTO}</div>}
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          {p && <Pill tone={p.motivo === 'GRUPO' ? 'cyan' : p.motivo === 'DESCOBERTA' ? 'violet' : 'slate'} title={`MOTIVO = ${p.motivo}`}>{MOTIVO_LABEL[p.motivo] ?? p.motivo}</Pill>}
          {r && !isTrue(r.ATIVA) && <Pill tone="red">inativa na fonte</Pill>}
          {!hideVence && left !== null && left <= 7 && <Pill tone={left < 0 ? 'red' : 'amber'} title={`FIM ${br(fim)}`}>{left < 0 ? 'vencida' : `vence ${shortDate(fim)}`}</Pill>}
        </div>
        <div className="pt-1"><AssetDots r={r} /><div className="mt-1 truncate font-mono text-[9px] text-slate-400" title={id}>{id}</div></div>
      </div>
    </button>
  );
};

// ---------- drawers ----------


export function PoolVisaVitrine({ events, lpReady, dispatches }: { dispatches: readonly PoolDispatchRow[]; events: readonly LpEventRow[]; lpReady: boolean }) {
  const [offer, setOffer] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState('');
  const clicks = new Map<string, number>();
  for (const event of events) {
    if (event.event === 'clique_oferta' && event.offerId) clicks.set(event.offerId, (clicks.get(event.offerId) ?? 0) + event.count);
  }
  const dates = events.map(event => event.date).sort();
  const coverage = lpReady && dates.length ? `GA4 de ${br(dates[0])} a ${br(dates[dates.length - 1])}` : 'GA4 sem dados disponíveis';
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [snapId, setSnapId] = useState(DATA.positions[DATA.positions.length - 1].id);
  const snap = DATA.positions.find((s) => s.id === snapId)!;
  const versions = versionsOf(snap);
  const [version, setVersion] = useState(versions[versions.length - 1]);
  const v = versions.includes(version) ? version : versions[versions.length - 1];
  const positions = toPositions(snap).filter((p) => p.versao === v);
  const meta = positions[0];
  const dispatchLabels = [...new Set(dispatches.filter(row => row.kind === 'disparo' && row.date === versionDate(v) && (row.sent ?? 0) > 0).map(row => row.bu + ' · ' + row.channel))];
  const fins = [...new Set(positions.map((p) => isoDate(LATEST.get(p.ofertaId)?.FIM)).filter(Boolean))];
  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-600">Seleções registradas no SFMC · conteúdo e assets do briefing preparado em 26/11/2026</p>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Select label="Fonte SFMC" value={snapId} onChange={setSnapId} options={DATA.positions.map((s) => ({ value: s.id, label: `${br(s.fileDate)} · ${s.rows.length} linhas` }))} />
        <Select label="Seleção de ofertas" value={v} onChange={setVersion} options={versions.map((x) => ({ value: x, label: `${br(versionDate(x))} (${toPositions(snap).filter((p) => p.versao === x).length} posições)` }))} />
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600">
          <Pill tone="cyan">seleção registrada</Pill>
          {dispatchLabels.length > 0 && <Pill tone="green">Envios no dia · {dispatchLabels.join(' / ')}</Pill>}
          {fins.length === 1 && <Pill tone="amber">Validade no briefing {br(fins[0])}</Pill>}
          <details className="rounded-lg px-2 py-1">
            <summary className="cursor-pointer font-semibold text-slate-700">Ver fonte</summary>
            <p>VDV_POOL_OFERTAS_GRUPO_POSICAO · extração {br(snap.fileDate)} · briefing {br(latestBriefing.fileDate)}</p>
            {meta && <p>Tema {meta.versaoTema} · célula {meta.celula}</p>}
          </details>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {GROUPS.map((g) => {
          const list = positions.filter((p) => p.grupo === g).sort((a, b) => a.posicao - b.posicao);
          const main = list.filter((p) => p.posicao <= 3);
          const reserve = list.filter((p) => p.posicao > 3);
          return (
            <Card key={g} className="border-t-4 border-t-cyan-600" kicker={`Seleção registrada · ${br(versionDate(v))}`} title={GROUP_LABEL[g]} right={<button type="button" className="rounded-lg bg-cyan-800 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-900" aria-expanded={expandedGroup === g} onClick={() => setExpandedGroup(expandedGroup === g ? null : g)}>{expandedGroup === g ? 'Fechar fila' : 'Abrir fila de ' + GROUP_LABEL[g]}</button>}>
              <div className="space-y-3 px-4 pb-4">
                {list.length === 0 && <p className="text-xs text-slate-500">Nenhuma posição para este grupo nesta extração.</p>}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-3">{main.map((p) => <OfferCard key={p.posicao} hideVence={fins.length === 1} p={p} id={p.ofertaId} r={LATEST.get(p.ofertaId)} onOpen={setOffer} />)}</div>
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                  <h4 className="mb-2 text-sm font-bold text-indigo-950">Próximas na fila planejada</h4>
                  <ol className="grid gap-2 sm:grid-cols-3">
                    {plannedQueue(g).filter(item => !main.some(p => p.ofertaId === item.id)).slice(0, 3).map(item => {
                      const sfmcEnd = isoDate(LATEST.get(item.id)?.FIM);
                      const differs = sfmcEnd && item.date && sfmcEnd !== isoDate(item.date);
                      return <li key={item.id} className="flex items-start gap-2 rounded-lg bg-white px-2.5 py-2">
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-900">{item.order}ª</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{item.brand}</p>
                          {differs && <p className="mt-0.5 text-xs font-medium text-amber-900">Validade diverge · fila {item.date.slice(0,5)} / briefing {br(sfmcEnd).slice(0,5)}</p>}
                        </div>
                      </li>;
                    })}
                  </ol>
                </div>
                {reserve.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reservas · não presume exibição</p>
                    <div className="grid grid-cols-3 gap-2">{reserve.map((p) => <OfferCard compact hideVence={fins.length === 1} key={p.posicao} p={p} id={p.ofertaId} r={LATEST.get(p.ofertaId)} onOpen={setOffer} />)}</div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {expandedGroup && <section key={`${expandedGroup}:${snap.id}:${v}`} className="space-y-4 rounded-xl border border-cyan-200 bg-white p-4" ref={node => node?.scrollIntoView({ block: 'start' })}>
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">{GROUP_LABEL[expandedGroup]}</h2><button className="text-sm font-bold text-cyan-800" onClick={() => setExpandedGroup(null)}>Fechar detalhes</button></div>
        <Rotation onOpen={setOffer} fixedGroup={expandedGroup} reference={v} source={snap} clicks={clicks} coverage={coverage} />
        <details className="rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer font-bold">Catálogo do segmento</summary>
          <label className="my-3 block text-sm font-semibold">Buscar oferta
            <input type="search" value={catalogQuery} onChange={event => setCatalogQuery(event.target.value)} className="ml-2 rounded-lg border border-slate-300 p-2" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {latestBriefing.rows.filter(row =>
              row.TIPO === 'OFERTA' &&
              (row.GRUPO === expandedGroup || plannedQueue(expandedGroup).some(item => item.id === row.ID)) &&
              (row.MARCA + ' ' + row.ID).toLocaleLowerCase('pt-BR').includes(catalogQuery.trim().toLocaleLowerCase('pt-BR'))
            ).map(row => <OfferCard key={row.ID} id={row.ID} r={row} onOpen={setOffer} />)}
          </div>
        </details>
      </section>}
      {offer && <OfferDetails key={offer} id={offer} clicks={clicks.get(offer)} coverage={coverage} onClose={() => setOffer(null)} />}
    </div>
  );
};


function OfferDetails({ id, clicks, coverage, onClose }: { id: string; clicks?: number; coverage: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const row = LATEST.get(id);
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="pool-offer-title" className="w-full max-w-lg rounded-2xl p-5 shadow-xl backdrop:bg-slate-900/40">
      <header className="mb-4 flex justify-between gap-3">
        <h2 id="pool-offer-title" className="text-lg font-bold">{row?.MARCA || id}</h2>
        <button type="button" onClick={onClose} autoFocus className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold">Fechar</button>
      </header>
      <div className="rounded-xl border border-slate-200 p-4">
        {row?.FOTO && <Img src={row.FOTO} alt={row.ALT || row.MARCA} kind="foto" className="mb-3 h-44 rounded-lg" />}
        {row?.LOGO && <img src={row.LOGO} alt="" className="mb-2 h-10 w-16 object-contain" />}
        {row && <p className="font-semibold">{benefit(row)} {row.COMPLEMENTO}</p>}
        {row?.FIM && <p className="text-sm text-slate-600">Validade no briefing {br(isoDate(row.FIM))}</p>}
        <p className="mt-2 font-mono text-xs text-slate-600">{id}</p>
      </div>
      <p className="mt-4 text-sm text-slate-700">Cliques na LP: {clicks ?? '—'} · {coverage}</p>
    </dialog>
  );
}
