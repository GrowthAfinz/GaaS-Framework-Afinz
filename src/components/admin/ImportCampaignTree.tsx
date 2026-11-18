import { useMemo, useState, useEffect, useRef } from 'react';
import { inImportPeriod, previousWeekStart, type ImportSelectionPeriod } from './importSelection';

export interface ImportTreeRow {
    key: string; journey: string; date: string; eligible: boolean;
    operation: 'new_dispatch' | 'update_dispatch' | 'ignore';
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
function DateRange({ rows }: { rows: ImportTreeRow[] }) {
    if (!rows.length) return <>—</>;
    const dates = rows.map(row => row.date).sort();
    const fmt = (date: string) => date.split('-').reverse().join('/');
    return <span className="whitespace-nowrap">{fmt(dates[0])} a {fmt(dates[dates.length - 1])}</span>;
}
function SelectionBox({ rows, selected, onChange, label }: {
    rows: ImportTreeRow[]; selected: Set<string>; onChange: (checked: boolean) => void; label: string;
}) {
    const ref = useRef<HTMLInputElement>(null);
    const eligible = rows.filter(row => row.eligible);
    const count = eligible.filter(row => selected.has(row.key)).length;
    useEffect(() => { if (ref.current) ref.current.indeterminate = count > 0 && count < eligible.length; }, [count, eligible.length]);
    return <input ref={ref} type="checkbox" aria-label={label} disabled={!eligible.length}
        checked={eligible.length > 0 && count === eligible.length} onChange={event => onChange(event.target.checked)} />;
}

export function ImportCampaignTree({ campaigns, selected, focusedCampaign, focusedJourney, onFocus, onSelection, onScopeSelection }: Props) {
    const [search, setSearch] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [open, setOpen] = useState<Set<string>>(new Set());
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
    const count = (rows: ImportTreeRow[]) => rows.filter(row => selected.has(row.key)).length;
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return <section className="w-full border-b bg-slate-50" aria-label="Seleção de campanhas por período">
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
            <strong className="text-sm">Selecionar por frente e período</strong>
            <input className="min-w-64 flex-1 rounded-lg border px-3 py-2 text-xs" aria-label="Buscar frentes, campanhas e jornadas"
                placeholder="Buscar frente, campanha ou nome da jornada" value={search} onChange={event => setSearch(event.target.value)} />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selectedOnly}
                onChange={event => setSelectedOnly(event.target.checked)} />Só com seleção</label>
            <button type="button" className="text-xs text-cyan-800 underline" onClick={() => setOpen(new Set())}>Recolher tudo</button>
        </div>
        <div className="max-h-[42vh] overflow-auto p-3">
            <p className="mb-2 text-xs text-slate-600">O período vale para a frente aberta. Aplicar período substitui a seleção dessa frente e preserva as demais.</p>
            {fronts.map(([front, allCampaigns]) => {
                const rows = allCampaigns.flatMap(campaign => campaign.rows);
                if (selectedOnly && !count(rows)) return null;
                const visible = allCampaigns.filter(campaign => !term || [front, campaign.title, ...campaign.rows.map(row => row.journey)]
                    .some(value => value.toLocaleLowerCase('pt-BR').includes(term)));
                if (!visible.length) return null;
                const key = 'front:' + front;
                const isOpen = Boolean(term) || open.has(key);
                const period = periods[front] ?? { from: front === 'Aquisição' ? previousWeekStart(today) : '', to: front === 'Aquisição' ? today : '' };
                const invalid = Boolean(period.from && period.to && period.from > period.to);
                const scoped = rows.filter(row => inImportPeriod(row.date, period));
                const outside = count(rows) - count(scoped);
                const apply = (nextPeriod: ImportSelectionPeriod) => {
                    setPeriods(current => ({ ...current, [front]: nextPeriod }));
                    onScopeSelection(rows, nextPeriod, true);
                    onFocus(allCampaigns[0].front, '', '', nextPeriod);
                };
                return <section key={front} className="mb-2 rounded-lg border bg-white">
                    <div className="flex flex-wrap items-center gap-3 p-3">
                        <SelectionBox rows={scoped} selected={selected} label={'Selecionar ' + front + ' no período'}
                            onChange={checked => onScopeSelection(rows, period, checked)} />
                        <button type="button" aria-expanded={isOpen} className="flex-1 text-left text-sm font-semibold" onClick={() => toggle(key)}>
                            {isOpen ? '▾' : '▸'} {front}
                        </button>
                        <span className="text-xs text-slate-600">{count(rows)} selecionados · {scoped.filter(row => row.eligible).length} aptos no período</span>
                        <span className="text-xs text-slate-600">{period.from || period.to ? (period.from || 'Início') + ' a ' + (period.to || 'Fim') : 'Todo o arquivo'}</span>
                        <button type="button" className="text-xs text-cyan-800 underline" onClick={() => { setOpen(new Set([key])); onFocus(allCampaigns[0].front, '', '', period); }}>Focar</button>
                    </div>
                    {isOpen && <div className="border-t">
                        <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-3 text-xs">
                            <label>De<input type="date" className="ml-2 rounded border p-2" value={period.from} onChange={event => setPeriods(current => ({ ...current, [front]: { ...period, from: event.target.value } }))} /></label>
                            <label>Até<input type="date" className="ml-2 rounded border p-2" value={period.to} onChange={event => setPeriods(current => ({ ...current, [front]: { ...period, to: event.target.value } }))} /></label>
                            <button type="button" className="rounded border bg-white p-2 text-cyan-800" onClick={() => apply({ from: previousWeekStart(today), to: today })}>Desde segunda passada</button>
                            <button type="button" className="rounded border bg-white p-2 text-cyan-800" onClick={() => apply({ from: '', to: '' })}>Todo o arquivo</button>
                            <button type="button" disabled={invalid} className="rounded bg-cyan-700 p-2 font-semibold text-white disabled:opacity-40" onClick={() => apply(period)}>Aplicar período à seleção</button>
                            <button type="button" className="p-2 text-slate-600 underline" onClick={() => onSelection(rows.map(row => row.key), 'remove')}>Desmarcar frente</button>
                            {invalid && <span role="alert" className="text-red-700">A data inicial deve vir antes da final.</span>}
                            {outside > 0 && <span role="status" className="text-amber-800">{outside} selecionados fora desse período. Aplicar período remove esses itens da seleção.</span>}
                        </div>
                        {visible.map(campaign => {
                            const list = campaign.rows.filter(row => inImportPeriod(row.date, period));
                            const selectedRows = list.filter(row => selected.has(row.key));
                            const campaignKey = 'campaign:' + campaign.key;
                            const campaignOpen = Boolean(term) || open.has(campaignKey);
                            const journeys = new Map<string, ImportTreeRow[]>();
                            for (const row of list) {
                                const entries = journeys.get(row.journey) ?? [];
                                entries.push(row); journeys.set(row.journey, entries);
                            }
                            return <div key={campaign.key} className="border-t">
                                <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
                                    <SelectionBox rows={list} selected={selected} label={'Selecionar ' + campaign.title + ' no período'}
                                        onChange={checked => onScopeSelection(campaign.rows, period, checked)} />
                                    <button type="button" aria-expanded={campaignOpen} className="flex-1 text-left font-semibold" onClick={() => toggle(campaignKey)}>{campaignOpen ? '▾' : '▸'} {campaign.title}</button>
                                    <span>{count(list)} selecionados · {list.length} disparos no período</span>
                                    <DateRange rows={selectedRows.length ? selectedRows : list} />
                                    <button type="button" className="text-cyan-800 underline" onClick={() => onFocus(campaign.front, campaign.key, '', period)}>Ver disparos</button>
                                </div>
                                {campaignOpen && <table className="w-full table-fixed text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600"><tr><th className="w-10 p-2">Sel.</th><th className="w-[46%] p-2">Jornada · nome completo</th><th className="p-2">Período dos disparos</th><th className="w-24 p-2">Selecionados</th><th className="w-24 p-2">No período</th></tr></thead>
                                    <tbody>{[...journeys].sort(([a], [b]) => a.localeCompare(b)).map(([journey, entries]) => {
                                        if (selectedOnly && !count(entries)) return null;
                                        return <tr key={journey} className={'border-t ' + (focusedJourney === journey && focusedCampaign === campaign.key ? 'bg-cyan-50' : '')}>
                                            <td className="p-2"><SelectionBox rows={entries} selected={selected} label={'Selecionar ' + journey + ' no período'}
                                                onChange={checked => onScopeSelection(campaign.rows.filter(row => row.journey === journey), period, checked)} /></td>
                                            <td className="break-all p-2"><button type="button" className="text-left text-cyan-800 underline" onClick={() => onFocus(campaign.front, campaign.key, journey, period)}>{journey || '(sem jornada)'}</button></td>
                                            <td className="p-2"><DateRange rows={entries} /></td><td className="p-2">{count(entries)}</td><td className="p-2">{entries.length}</td>
                                        </tr>;
                                    })}</tbody>
                                </table>}
                            </div>;
                        })}
                    </div>}
                </section>;
            })}
        </div>
    </section>;
}
