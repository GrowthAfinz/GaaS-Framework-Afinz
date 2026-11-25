import { useMemo, useState, useEffect, useRef } from 'react';
import { inImportPeriod, previousWeekStart, type ImportSelectionPeriod } from './importSelection';

export interface ImportTreeRow {
    key: string; journey: string; date: string; eligible: boolean;
    operation: 'new_dispatch' | 'update_dispatch' | 'ignore';
    /** Situação do motor; explica por que uma linha não dá para gravar. */
    status?: string;
    accepted?: boolean;
}
export interface ImportTreeCampaign { key: string; title: string; front: string; rows: ImportTreeRow[] }
interface Props {
    campaigns: ImportTreeCampaign[];
    selected: Set<string>;
    focusedCampaign: string;
    focusedJourney: string;
    onFocus: (front: string, campaign: string, journey: string, period?: ImportSelectionPeriod) => void;
    onSelection: (keys: string[], action: 'add' | 'remove' | 'only') => void;
    onScopeSelection: (rows: ImportTreeRow[], period: ImportSelectionPeriod, checked: boolean) => void;
}
export function importToday() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

const fmt = (date: string) => date.split('-').reverse().slice(0, 2).join('/');
const fmtFull = (date: string) => date.split('-').reverse().join('/');
const nf = (value: number) => value.toLocaleString('pt-BR');

/** Colunas fixas para frente, campanha e jornada ficarem alinhadas. */
const GRID = 'grid grid-cols-[minmax(0,1fr)_88px_96px_96px_88px_128px_84px] items-center gap-x-3';

interface Tally { total: number; eligible: number; selected: number; duplicate: number; conflict: number; other: number }
function tally(rows: ImportTreeRow[], selected: Set<string>): Tally {
    const result: Tally = { total: rows.length, eligible: 0, selected: 0, duplicate: 0, conflict: 0, other: 0 };
    for (const row of rows) {
        if (row.eligible) result.eligible += 1;
        else if (row.status === 'duplicate') result.duplicate += 1;
        else if (row.status === 'conflict') result.conflict += 1;
        else result.other += 1;
        if (selected.has(row.key)) result.selected += 1;
    }
    return result;
}
function blockedReason(t: Tally) {
    if (t.total === 0) return 'Nenhum disparo no período.';
    const parts = [
        t.duplicate && `${nf(t.duplicate)} já iguais na base`,
        t.conflict && `${nf(t.conflict)} em conflito de jornada`,
        t.other && `${nf(t.other)} sem volume ou com erro`,
    ].filter(Boolean);
    return `Nada para gravar: ${parts.join(', ')}.`;
}
function dateSpan(rows: ImportTreeRow[]) {
    if (!rows.length) return '';
    let min = rows[0].date; let max = rows[0].date;
    for (const row of rows) { if (row.date < min) min = row.date; if (row.date > max) max = row.date; }
    return min === max ? fmt(min) : `${fmt(min)} a ${fmt(max)}`;
}

function SelectionBox({ rows, selected, onChange, label, t }: {
    rows: ImportTreeRow[]; selected: Set<string>; onChange: (checked: boolean) => void; label: string; t: Tally;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const count = rows.filter(row => row.eligible && selected.has(row.key)).length;
    useEffect(() => { if (ref.current) ref.current.indeterminate = count > 0 && count < t.eligible; }, [count, t.eligible]);
    // O motivo fica no invólucro: navegador não mostra dica em campo desabilitado.
    return <span className="inline-flex shrink-0" title={t.eligible ? undefined : blockedReason(t)}>
        <input ref={ref} type="checkbox" aria-label={label} disabled={!t.eligible}
            aria-description={t.eligible ? undefined : blockedReason(t)}
            className="h-3.5 w-3.5 accent-cyan-700 disabled:cursor-not-allowed"
            checked={t.eligible > 0 && count === t.eligible} onChange={event => onChange(event.target.checked)} />
    </span>;
}

/** Números da linha: selecionados, dá para gravar, já na base, conflito. Zero fica apagado. */
function Counts({ t }: { t: Tally }) {
    const cell = (value: number, tone = 'text-slate-900') =>
        <span className={`text-right tabular-nums ${value ? tone : 'text-slate-300'}`}>{nf(value)}</span>;
    return <>
        {cell(t.selected, 'font-semibold text-cyan-800')}
        {cell(t.eligible)}
        {cell(t.duplicate, 'text-slate-500')}
        {cell(t.conflict, 'text-orange-700')}
    </>;
}

export function ImportCampaignTree({ campaigns, selected, focusedCampaign, focusedJourney, onFocus, onSelection, onScopeSelection }: Props) {
    const [search, setSearch] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [open, setOpen] = useState<Set<string>>(new Set());
    const [showEmpty, setShowEmpty] = useState(false);
    const [periods, setPeriods] = useState<Record<string, ImportSelectionPeriod>>({});
    const today = importToday();
    const fronts = useMemo(() => {
        const groups = new Map<string, ImportTreeCampaign[]>();
        for (const campaign of campaigns) {
            const front = campaign.front || 'A classificar';
            const list = groups.get(front) ?? [];
            list.push(campaign); groups.set(front, list);
        }
        return [...groups].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
    }, [campaigns]);
    const toggle = (key: string) => setOpen(current => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const housePeriod = (front: string): ImportSelectionPeriod =>
        ({ from: front === 'Aquisição' ? previousWeekStart(today) : '', to: front === 'Aquisição' ? today : '' });
    const periodOf = (front: string): ImportSelectionPeriod => periods[front] ?? housePeriod(front);

    // Período geral: vale para todas as frentes de uma vez, sem precisar abrir nenhuma.
    const [allPeriod, setAllPeriod] = useState<ImportSelectionPeriod>({ from: '', to: '' });
    const allInvalid = Boolean(allPeriod.from && allPeriod.to && allPeriod.from > allPeriod.to);
    const applyToAll = (nextPeriod: ImportSelectionPeriod) => {
        setAllPeriod(nextPeriod);
        setPeriods(Object.fromEntries(fronts.map(([front]) => [front, nextPeriod])));
        onScopeSelection(campaigns.flatMap(campaign => campaign.rows), nextPeriod, true);
    };
    const applyHouseDefault = () => {
        setAllPeriod({ from: '', to: '' });
        setPeriods({});
        for (const [front, allCampaigns] of fronts) onScopeSelection(allCampaigns.flatMap(campaign => campaign.rows), housePeriod(front), true);
    };
    const frontPeriods = fronts.map(([front]) => periodOf(front));
    const samePeriod = frontPeriods.every(period => period.from === frontPeriods[0]?.from && period.to === frontPeriods[0]?.to);
    const periodText = (period: ImportSelectionPeriod) => period.from || period.to
        ? `${period.from ? fmt(period.from) : 'início'} a ${period.to ? fmt(period.to) : 'fim'}`
        : 'todo o arquivo';

    const prepared = fronts.map(([front, allCampaigns]) => {
        const period = periodOf(front);
        const rows = allCampaigns.flatMap(campaign => campaign.rows);
        const scoped = rows.filter(row => inImportPeriod(row.date, period));
        return { front, allCampaigns, period, rows, scoped, t: tally(scoped, selected) };
    });
    const withWork = prepared.filter(item => item.t.eligible > 0);
    const empty = prepared.filter(item => item.t.eligible === 0);

    const renderFront = ({ front, allCampaigns, period, rows, scoped, t }: typeof prepared[number]) => {
        if (selectedOnly && !t.selected) return null;
        const visible = allCampaigns.filter(campaign => !term || [front, campaign.title, ...campaign.rows.map(row => row.journey)]
            .some(value => value.toLocaleLowerCase('pt-BR').includes(term)));
        if (!visible.length) return null;
        const key = 'front:' + front;
        const isOpen = Boolean(term) || open.has(key);
        const invalid = Boolean(period.from && period.to && period.from > period.to);
        const outside = rows.filter(row => selected.has(row.key)).length - t.selected;
        const apply = (nextPeriod: ImportSelectionPeriod) => {
            setPeriods(current => ({ ...current, [front]: nextPeriod }));
            onScopeSelection(rows, nextPeriod, true);
        };
        const periodLabel = period.from || period.to
            ? `${period.from ? fmt(period.from) : 'início'} a ${period.to ? fmt(period.to) : 'fim'}`
            : 'Todo o arquivo';
        return <section key={front} className="border-b border-slate-200 last:border-b-0">
            <div className={`${GRID} px-4 py-2.5 ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                <div className="flex min-w-0 items-center gap-2.5">
                    <SelectionBox rows={scoped} selected={selected} t={t} label={'Selecionar ' + front + ' no período'}
                        onChange={checked => onScopeSelection(rows, period, checked)} />
                    <button type="button" aria-expanded={isOpen} className="flex min-w-0 items-center gap-1.5 text-left text-[13.5px] font-bold text-slate-900" onClick={() => toggle(key)}>
                        <span className="w-3 text-[10px] text-slate-500" aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
                        <span className="truncate">{front}</span>
                        <span className="shrink-0 text-xs font-normal text-slate-500">{allCampaigns.length} {allCampaigns.length === 1 ? 'campanha' : 'campanhas'}</span>
                    </button>
                </div>
                <Counts t={t} />
                <span className="truncate text-right text-xs text-slate-600" title={period.from || period.to ? 'Período aplicado nesta frente' : 'Sem recorte de data'}>{periodLabel}</span>
                <button type="button" className="justify-self-end text-xs font-semibold text-cyan-700 hover:underline" onClick={() => onFocus(allCampaigns[0].front, '', '', period)}>Revisar</button>
            </div>
            {isOpen && <div className="border-t border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f6] bg-slate-50 px-4 py-2 pl-10 text-xs">
                    <span className="text-slate-600">Período</span>
                    <input type="date" aria-label={'Início do período de ' + front} className="h-7 rounded-sm border border-slate-300 bg-white px-2" value={period.from} onChange={event => setPeriods(current => ({ ...current, [front]: { ...period, from: event.target.value } }))} />
                    <span className="text-slate-500">a</span>
                    <input type="date" aria-label={'Fim do período de ' + front} className="h-7 rounded-sm border border-slate-300 bg-white px-2" value={period.to} onChange={event => setPeriods(current => ({ ...current, [front]: { ...period, to: event.target.value } }))} />
                    <button type="button" disabled={invalid} className="h-7 rounded-sm bg-cyan-700 px-3 font-semibold text-white hover:bg-cyan-800 disabled:opacity-40"
                        title="Marca tudo que dá para gravar nesse período e tira o que estiver fora dele" onClick={() => apply(period)}>Aplicar</button>
                    <span className="mx-1 h-4 w-px bg-slate-300" aria-hidden="true" />
                    <button type="button" className="h-7 rounded-sm border border-slate-300 bg-white px-2.5 text-slate-700 hover:border-slate-400" onClick={() => apply({ from: previousWeekStart(today), to: today })}>Desde segunda passada</button>
                    <button type="button" className="h-7 rounded-sm border border-slate-300 bg-white px-2.5 text-slate-700 hover:border-slate-400" onClick={() => apply({ from: '', to: '' })}>Todo o arquivo</button>
                    <button type="button" className="h-7 px-2 text-slate-600 hover:underline" onClick={() => onSelection(rows.map(row => row.key), 'remove')}>Desmarcar frente</button>
                    {invalid && <span role="alert" className="text-red-700">O início vem depois do fim.</span>}
                    {outside > 0 && <span role="status" className="text-amber-800">{nf(outside)} marcados fora do período; Aplicar tira esses.</span>}
                </div>
                {visible.map(campaign => {
                    const list = campaign.rows.filter(row => inImportPeriod(row.date, period));
                    const ct = tally(list, selected);
                    const campaignKey = 'campaign:' + campaign.key;
                    const campaignOpen = Boolean(term) || open.has(campaignKey);
                    const journeys = new Map<string, ImportTreeRow[]>();
                    for (const row of list) {
                        const entries = journeys.get(row.journey) ?? [];
                        entries.push(row); journeys.set(row.journey, entries);
                    }
                    if (selectedOnly && !ct.selected) return null;
                    return <div key={campaign.key} className="border-t border-[#eef2f6] first:border-t-0">
                        <div className={`${GRID} py-2 pl-10 pr-4 text-[12.5px] ${focusedCampaign === campaign.key && !focusedJourney ? 'bg-cyan-50' : ''}`}>
                            <div className="flex min-w-0 items-center gap-2.5">
                                <SelectionBox rows={list} selected={selected} t={ct} label={'Selecionar ' + campaign.title + ' no período'}
                                    onChange={checked => onScopeSelection(campaign.rows, period, checked)} />
                                <button type="button" aria-expanded={campaignOpen} disabled={!list.length} className="flex min-w-0 items-center gap-1.5 text-left font-semibold text-slate-800 disabled:text-slate-400" onClick={() => toggle(campaignKey)}>
                                    <span className="w-3 text-[9px] text-slate-500" aria-hidden="true">{list.length ? (campaignOpen ? '▼' : '▶') : ''}</span>
                                    <span className="truncate">{campaign.title}</span>
                                    <span className="shrink-0 font-normal text-slate-500">{journeys.size} {journeys.size === 1 ? 'jornada' : 'jornadas'}</span>
                                </button>
                            </div>
                            <Counts t={ct} />
                            <span className="text-right text-xs text-slate-600">{dateSpan(list) || 'sem disparo'}</span>
                            <button type="button" disabled={!list.length} className="justify-self-end text-xs text-cyan-700 hover:underline disabled:text-slate-300 disabled:no-underline" onClick={() => onFocus(campaign.front, campaign.key, '', period)}>Ver</button>
                        </div>
                        {campaignOpen && [...journeys].sort(([a], [b]) => a.localeCompare(b)).map(([journey, entries]) => {
                            const jt = tally(entries, selected);
                            if (selectedOnly && !jt.selected) return null;
                            return <div key={journey} className={`${GRID} border-t border-[#f3f5f8] py-1.5 pl-[68px] pr-4 text-xs ${focusedJourney === journey && focusedCampaign === campaign.key ? 'bg-cyan-50' : ''}`}>
                                <div className="flex min-w-0 items-center gap-2.5">
                                    <SelectionBox rows={entries} selected={selected} t={jt} label={'Selecionar ' + journey + ' no período'}
                                        onChange={checked => onScopeSelection(campaign.rows.filter(row => row.journey === journey), period, checked)} />
                                    <span className="truncate font-mono text-[11.5px] text-slate-700" title={journey}>{journey || '(sem jornada)'}</span>
                                </div>
                                <Counts t={jt} />
                                <span className="text-right text-slate-600" title={entries.length ? `${fmtFull(entries[0].date)}` : ''}>{dateSpan(entries)}</span>
                                <button type="button" className="justify-self-end text-cyan-700 hover:underline" onClick={() => onFocus(campaign.front, campaign.key, journey, period)}>Ver</button>
                            </div>;
                        })}
                    </div>;
                })}
            </div>}
        </section>;
    };

    const emptyRendered = (showEmpty || term) ? empty.map(renderFront) : [];
    const emptyTotals = empty.reduce((sum, item) => ({ duplicate: sum.duplicate + item.t.duplicate, conflict: sum.conflict + item.t.conflict }), { duplicate: 0, conflict: 0 });
    return <section className="flex flex-col" aria-label="Seleção de campanhas por período">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-2.5">
            <strong className="text-sm">Frentes e período</strong>
            <input className="h-8 min-w-64 flex-1 rounded-sm border border-slate-300 px-3 text-xs" aria-label="Buscar frentes, campanhas e jornadas"
                placeholder="Buscar frente, campanha ou jornada" value={search} onChange={event => setSearch(event.target.value)} />
            <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" className="accent-cyan-700" checked={selectedOnly}
                onChange={event => setSelectedOnly(event.target.checked)} />Só com seleção</label>
            <button type="button" className="text-xs text-cyan-700 hover:underline" onClick={() => setOpen(new Set())}>Recolher tudo</button>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs" role="group" aria-label="Período de todas as frentes">
            <span className="font-semibold text-slate-700">Período de todas as frentes</span>
            <input type="date" aria-label="Início do período de todas as frentes" className="h-7 rounded-sm border border-slate-300 bg-white px-2" value={allPeriod.from} onChange={event => setAllPeriod(current => ({ ...current, from: event.target.value }))} />
            <span className="text-slate-500">a</span>
            <input type="date" aria-label="Fim do período de todas as frentes" className="h-7 rounded-sm border border-slate-300 bg-white px-2" value={allPeriod.to} onChange={event => setAllPeriod(current => ({ ...current, to: event.target.value }))} />
            <button type="button" disabled={allInvalid || (!allPeriod.from && !allPeriod.to)} className="h-7 rounded-sm bg-cyan-700 px-3 font-semibold text-white hover:bg-cyan-800 disabled:opacity-40"
                title="Marca tudo que dá para gravar nesse período, em todas as frentes, e tira o que estiver fora" onClick={() => applyToAll(allPeriod)}>Aplicar a todas</button>
            <span className="mx-1 h-4 w-px bg-slate-300" aria-hidden="true" />
            <button type="button" className="h-7 rounded-sm border border-slate-300 bg-white px-2.5 text-slate-700 hover:border-slate-400" onClick={() => applyToAll({ from: previousWeekStart(today), to: today })}>Desde segunda passada</button>
            <button type="button" className="h-7 rounded-sm border border-slate-300 bg-white px-2.5 text-slate-700 hover:border-slate-400" onClick={() => applyToAll({ from: '', to: '' })}>Todo o arquivo</button>
            <button type="button" className="h-7 px-2 text-slate-600 hover:underline" title="Aquisição da segunda passada para cá e as outras frentes inteiras" onClick={applyHouseDefault}>Padrão da casa</button>
            {allInvalid && <span role="alert" className="text-red-700">O início vem depois do fim.</span>}
            <span className="ml-auto text-slate-500" role="status">
                {samePeriod ? `Todas: ${periodText(frontPeriods[0] ?? { from: '', to: '' })}` : 'Cada frente com seu período (veja a coluna Período)'}
            </span>
        </div>
        <div className={`${GRID} border-b border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold text-slate-500`}>
            <span className="pl-6">Frente · campanha · jornada</span>
            <span className="text-right">Marcados</span>
            <span className="text-right" title="Novo ou com número novo">Dá p/ gravar</span>
            <span className="text-right" title="Já gravado com os mesmos números">Já na base</span>
            <span className="text-right" title="Mesma activity, canal e data com outra jornada">Conflito</span>
            <span className="text-right">Período</span>
            <span />
        </div>
        <div>
            {withWork.map(renderFront)}
            {!withWork.length && !term && <p className="px-4 py-6 text-center text-sm text-slate-600">Nada novo para gravar neste arquivo. Tudo já está na base ou em conflito.</p>}
            {empty.length > 0 && !term && (
                <button type="button" aria-expanded={showEmpty} onClick={() => setShowEmpty(value => !value)}
                    className="flex w-full items-center gap-2 border-y border-slate-200 bg-slate-50 px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-100">
                    <span className="w-3 text-[10px]" aria-hidden="true">{showEmpty ? '▼' : '▶'}</span>
                    <b className="text-slate-700">{empty.length} {empty.length === 1 ? 'frente' : 'frentes'} sem nada para gravar</b>
                    <span>· {nf(emptyTotals.duplicate)} já na base · {nf(emptyTotals.conflict)} em conflito</span>
                </button>
            )}
            {emptyRendered}
        </div>
    </section>;
}
