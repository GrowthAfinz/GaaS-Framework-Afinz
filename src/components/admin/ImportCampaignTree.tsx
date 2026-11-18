import { useMemo, useState, useEffect, useRef } from 'react';

export interface ImportTreeRow {
    key: string;
    journey: string;
    date: string;
    eligible: boolean;
    operation: 'new_dispatch' | 'update_dispatch' | 'ignore';
}
export interface ImportTreeCampaign {
    key: string;
    title: string;
    front: string;
    rows: ImportTreeRow[];
}
interface Props {
    campaigns: ImportTreeCampaign[];
    selected: Set<string>;
    focusedCampaign: string;
    focusedJourney: string;
    onFocus: (front: string, campaign: string, journey: string) => void;
    onSelection: (keys: string[], action: 'add' | 'remove' | 'only') => void;
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

export function ImportCampaignTree({ campaigns, selected, focusedCampaign, focusedJourney, onFocus, onSelection }: Props) {
    const [search, setSearch] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const [open, setOpen] = useState<Set<string>>(new Set());
    const fronts = useMemo(() => {
        const groups = new Map<string, ImportTreeCampaign[]>();
        for (const campaign of campaigns) {
            const front = campaign.front || 'A classificar';
            const list = groups.get(front) ?? [];
            list.push(campaign);
            groups.set(front, list);
        }
        return [...groups].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
    }, [campaigns]);
    const toggle = (key: string) => setOpen(current => {
        const next = new Set(current);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
    });
    const count = (rows: ImportTreeRow[]) => rows.filter(row => selected.has(row.key)).length;
    const apply = (rows: ImportTreeRow[], checked: boolean) => onSelection(rows.filter(row => row.eligible).map(row => row.key), checked ? 'add' : 'remove');
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return <aside className="w-full shrink-0 border-b bg-slate-50 lg:w-80 lg:border-b-0 lg:border-r" aria-label="Frentes e jornadas">
        <div className="sticky top-0 z-10 space-y-3 border-b bg-slate-50 p-3">
            <div className="flex items-center justify-between"><strong className="text-sm">Campanhas e jornadas</strong>
                <button type="button" className="text-xs text-cyan-800 underline" onClick={() => onFocus('', '', '')}>Todas</button></div>
            <input className="w-full rounded-lg border px-3 py-2 text-xs" aria-label="Buscar na árvore de campanhas"
                placeholder="Buscar frente, campanha ou jornada" value={search} onChange={event => setSearch(event.target.value)} />
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={selectedOnly}
                onChange={event => setSelectedOnly(event.target.checked)} />Só frentes e jornadas com seleção</label>
            <div className="flex gap-3 text-xs text-cyan-800">
                <button type="button" onClick={() => { setOpen(new Set(fronts.flatMap(([front, list]) => ['front:' + front, ...list.map(campaign => 'campaign:' + campaign.key)]))); }}>Expandir até jornadas</button>
                <button type="button" onClick={() => { setOpen(new Set()); }}>Recolher tudo</button>
            </div>
        </div>
        <div className="max-h-[55vh] overflow-auto p-2 lg:max-h-[65vh]">
            {fronts.map(([front, allCampaigns]) => {
                const frontMatches = front.toLocaleLowerCase('pt-BR').includes(term);
                const visible = allCampaigns.filter(campaign =>
                    (!selectedOnly || count(campaign.rows) > 0)
                    && (!term || frontMatches || campaign.title.toLocaleLowerCase('pt-BR').includes(term)
                        || campaign.rows.some(row => row.journey.toLocaleLowerCase('pt-BR').includes(term))));
                if (!visible.length) return null;
                const rows = allCampaigns.flatMap(campaign => campaign.rows);
                const frontKey = 'front:' + front;
                const isOpen = Boolean(term) || open.has(frontKey);
                return <section key={front} className="mb-2 rounded-lg border bg-white">
                    <div className="flex items-center gap-2 p-2">
                        <SelectionBox rows={rows} selected={selected} label={'Selecionar aptos de ' + front} onChange={checked => apply(rows, checked)} />
                        <button type="button" aria-expanded={isOpen} className="min-w-0 flex-1 text-left text-xs font-bold" onClick={() => toggle(frontKey)}>
                            {isOpen ? '▾' : '▸'} {front}<span className="block font-normal text-slate-500">{count(rows)} selecionados · {rows.length} no arquivo</span>
                        </button>
                        <button type="button" className="text-xs text-cyan-800" aria-label={'Focar em ' + front} onClick={() => {
                            setOpen(new Set([frontKey])); setSearch(''); onFocus(allCampaigns[0].front, '', '');
                        }}>Focar</button>
                    </div>
                    {isOpen && <div className="border-t p-2 text-xs">
                        <div className="mb-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                            <span>{rows.filter(row => row.operation === 'new_dispatch').length} novos</span>
                            <span>{rows.filter(row => row.operation === 'update_dispatch').length} atualizações</span>
                            <span>{rows.filter(row => !row.eligible).length} para revisar ou ignorar</span>
                        </div>
                        <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-cyan-800">
                            <button type="button" onClick={() => apply(rows, true)}>Selecionar aptos</button>
                            <button type="button" onClick={() => onSelection(rows.map(row => row.key), 'remove')}>Desmarcar frente</button>
                            <button type="button" onClick={() => {
                                const keys = rows.filter(row => row.eligible).map(row => row.key);
                                const outside = selected.size - count(rows);
                                if (outside > 0 && !window.confirm('Selecionar apenas ' + front + ' desmarca ' + outside + ' itens das demais frentes. Continuar?')) return;
                                onSelection(keys, 'only');
                            }}>Selecionar apenas esta</button>
                        </div>
                        {visible.map(campaign => {
                            const campaignKey = 'campaign:' + campaign.key;
                            const campaignOpen = Boolean(term) || open.has(campaignKey);
                            const journeys = new Map<string, ImportTreeRow[]>();
                            for (const row of campaign.rows) {
                                const list = journeys.get(row.journey) ?? [];
                                list.push(row); journeys.set(row.journey, list);
                            }
                            return <div key={campaign.key} className="border-t py-2">
                                <div className="flex items-center gap-2">
                                    <SelectionBox rows={campaign.rows} selected={selected} label={'Selecionar aptos de ' + campaign.title} onChange={checked => apply(campaign.rows, checked)} />
                                    <button type="button" aria-expanded={campaignOpen} onClick={() => toggle(campaignKey)}>{campaignOpen ? '▾' : '▸'}</button>
                                    <button type="button" className={'min-w-0 flex-1 text-left ' + (focusedCampaign === campaign.key ? 'font-bold text-cyan-800' : '')}
                                        onClick={() => onFocus(campaign.front, campaign.key, '')}>{campaign.title}<span className="block text-[11px] text-slate-500">{count(campaign.rows)} selecionados · {campaign.rows.length} disponíveis</span></button>
                                </div>
                                {campaignOpen && [...journeys].sort(([a], [b]) => a.localeCompare(b)).map(([journey, list]) => {
                                    if (selectedOnly && !count(list)) return null;
                                    if (term && !frontMatches && !campaign.title.toLocaleLowerCase('pt-BR').includes(term) && !journey.toLocaleLowerCase('pt-BR').includes(term)) return null;
                                    const dates = list.filter(row => selected.has(row.key)).map(row => row.date).sort();
                                    return <div key={journey} className={'ml-3 mt-2 flex gap-2 rounded p-1 ' + (focusedJourney === journey ? 'bg-cyan-50' : '')}>
                                        <SelectionBox rows={list} selected={selected} label={'Selecionar aptos de ' + journey} onChange={checked => apply(list, checked)} />
                                        <button type="button" className="min-w-0 flex-1 break-all text-left text-[11px]" onClick={() => onFocus(campaign.front, campaign.key, journey)}>
                                            {journey || '(sem jornada)'}<span className="mt-1 block text-slate-500">{count(list)} selecionados · {list.length} disparos{dates.length ? ' · ' + dates[0] + ' a ' + dates[dates.length - 1] : ''}</span>
                                        </button>
                                    </div>;
                                })}
                            </div>;
                        })}
                    </div>}
                </section>;
            })}
        </div>
    </aside>;
}
