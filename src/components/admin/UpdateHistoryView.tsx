/**
 * Histórico de atualizações (Configurações › Gestão de dados).
 * Em cima, o estado de cada base (frescor e cargas dos últimos 30 dias). Embaixo, a lista de
 * execuções paginada no servidor e o registro da execução escolhida com linha do tempo.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Download, Loader2, RefreshCw, Search } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
    intelligentUpdateService,
    type UpdateRunCandidateRow,
    type UpdateRunHistoryDetail,
    type UpdateRunHistoryItem,
} from '../../services/intelligentUpdateService';
import {
    buildBaseFreshness,
    buildDailyActivity,
    buildFieldChanges,
    durationLabel,
    runStatusMeta,
    type BaseFreshness,
} from './updateHistoryModel';

const PAGE_SIZE = 20;
const DOMAIN_LABEL: Record<string, string> = { total_crm: 'Total CRM', aquisicao: 'Aquisição', rentabilizacao: 'Rentabilização' };
const fmtInt = (value: number) => value.toLocaleString('pt-BR');
const fmtDateTime = (iso: string) => {
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return 'sem dado';
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

type DetailTab = 'campos' | 'gravados' | 'fora';

const toneClass = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warn: 'border-amber-200 bg-amber-50 text-amber-700',
    bad: 'border-red-200 bg-red-50 text-red-700',
    neutral: 'border-slate-200 bg-slate-100 text-slate-600',
} as const;
const dotClass = { ok: 'bg-emerald-600', warn: 'bg-amber-600', bad: 'bg-red-600', neutral: 'bg-slate-400' } as const;

const csvCell = (value: unknown) => {
    const text = String(value ?? '');
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadRunCsv = (detail: UpdateRunHistoryDetail) => {
    const header = ['situacao', 'operacao', 'dominio', 'tabela', 'data', 'canal', 'jornada', 'activity', 'motivo'];
    const rows = [...detail.applied, ...detail.blocked].map((row) => [
        row.status === 'applied' ? 'gravado' : 'fora',
        row.operationType, row.domain, row.targetTable, row.date, row.channel, row.journey, row.activityName, row.conflictReason ?? '',
    ]);
    const csv = [header, ...rows].map((line) => line.map(csvCell).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `atualizacao-${detail.run.createdAt.slice(0, 10)}-${detail.run.id.slice(0, 8)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
};

const BaseRow = ({ base }: { base: BaseFreshness }) => (
    <div className="grid grid-cols-[220px_minmax(0,1fr)_170px] items-center gap-4 border-b border-[#eef2f6] px-4 py-3 last:border-b-0">
        <div className="min-w-0">
            <div className="text-[13px] font-bold text-slate-900">{base.label}</div>
            <div className="truncate text-xs text-slate-500">{base.table}</div>
        </div>
        <div className="flex h-[26px] items-end gap-[3px]" role="img" aria-label={`${base.loads} cargas em 30 dias`}>
            {base.days.map((day) => (
                <span
                    key={day.date}
                    title={`${day.date.split('-').reverse().slice(0, 2).join('/')} · ${day.label}`}
                    className={`flex-1 rounded-[2px] ${day.kind === 'none' ? 'h-2 bg-slate-200' : day.kind === 'ok' ? 'h-[26px] bg-emerald-500' : day.kind === 'warn' ? 'h-[26px] bg-amber-500' : 'h-[26px] bg-red-600'}`}
                />
            ))}
        </div>
        <span className={`justify-self-end rounded-sm border px-2.5 py-1 text-xs font-semibold ${toneClass[base.tone]}`}>{base.freshLabel}</span>
    </div>
);

export const UpdateHistoryView: React.FC<{ onStartUpdate: () => void }> = ({ onStartUpdate }) => {
    const { user } = useAuth();
    const [page, setPage] = useState(0);
    const [domain, setDomain] = useState('');
    const [status, setStatus] = useState('');
    const [runs, setRuns] = useState<UpdateRunHistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activity, setActivity] = useState<Array<{ id: string; createdAt: string; domain: string; status: string }>>([]);
    const [latestApplied, setLatestApplied] = useState<Array<{ createdAt: string; domain: string }>>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<UpdateRunHistoryDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [tab, setTab] = useState<DetailTab>('campos');
    const [search, setSearch] = useState('');
    const [people, setPeople] = useState<Map<string, string>>(new Map());

    const since = useMemo(() => new Date(Date.now() - 30 * 86400000).toISOString(), []);

    const loadPage = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await intelligentUpdateService.fetchUpdateRunPage({ page, pageSize: PAGE_SIZE, domain: domain || undefined, status: status || undefined });
            setRuns(result.items);
            setTotal(result.total);
            setSelectedId((current) => current && result.items.some((run) => run.id === current) ? current : result.items[0]?.id ?? null);
        } catch (loadError: any) {
            setError(loadError?.message || 'Não foi possível carregar o histórico.');
        } finally {
            setLoading(false);
        }
    }, [page, domain, status]);

    useEffect(() => { void loadPage(); }, [loadPage]);

    useEffect(() => {
        intelligentUpdateService.fetchUpdateRunActivity(since).then(setActivity).catch(() => setActivity([]));
        intelligentUpdateService.fetchLatestAppliedRuns().then(setLatestApplied).catch(() => setLatestApplied([]));
        supabase.from('profiles').select('id,full_name,email').then(({ data }) => {
            setPeople(new Map((data ?? []).map((row: any) => [row.id, row.full_name || String(row.email ?? '').split('@')[0] || 'sem nome'])));
        });
    }, [since]);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            return;
        }
        let cancelled = false;
        setDetailLoading(true);
        intelligentUpdateService.fetchUpdateRunDetail(selectedId)
            .then((next) => { if (!cancelled) setDetail(next); })
            .catch(() => { if (!cancelled) setDetail(null); })
            .finally(() => { if (!cancelled) setDetailLoading(false); });
        return () => { cancelled = true; };
    }, [selectedId]);

    const bases = useMemo(() => buildBaseFreshness(latestApplied, buildDailyActivity(activity, 30)), [latestApplied, activity]);
    const anyStale = bases.some((base) => base.tone !== 'ok');
    const who = (run: UpdateRunHistoryItem) => !run.createdBy ? 'sem autor' : run.createdBy === user?.id ? 'Você' : people.get(run.createdBy) ?? 'outra pessoa';

    const fieldChanges = useMemo(() => (detail ? buildFieldChanges(detail.applied) : []), [detail]);
    const term = search.trim().toLowerCase();
    const matches = (row: { activityName: string; journey: string }) => !term
        || row.activityName.toLowerCase().includes(term) || row.journey.toLowerCase().includes(term);
    const visibleChanges = fieldChanges.filter(matches);
    const visibleApplied = (detail?.applied ?? []).filter(matches);
    const visibleBlocked = (detail?.blocked ?? []).filter(matches);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
        <div className="flex min-h-[calc(var(--screen-h)-56px)] flex-col">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-3.5">
                <div>
                    <div className="text-xs text-slate-500">Configurações · Gestão de dados</div>
                    <h1 className="text-xl font-bold text-slate-900">Histórico de atualizações</h1>
                </div>
                <span className="flex-1" />
                <button type="button" onClick={() => void loadPage()} className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-2.5 text-[12.5px] text-slate-800 hover:border-slate-400">
                    <RefreshCw size={14} /> Recarregar
                </button>
                <button type="button" onClick={onStartUpdate} className="inline-flex h-8 items-center rounded-sm border border-cyan-700 bg-cyan-700 px-3.5 text-[13px] font-bold text-white hover:bg-cyan-800">
                    Atualizar agora
                </button>
            </div>

            <section aria-label="Estado das bases" className="px-6 pt-4">
                <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                    <div className="flex flex-wrap items-center gap-2 border-b border-[#eef2f6] px-4 py-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${anyStale ? 'bg-amber-600' : 'bg-emerald-600'}`} />
                        <b className="text-[13px] text-slate-900">{anyStale ? 'Tem base passando de 2 dias sem carga' : 'Bases em dia'}</b>
                        <span className="flex-1" />
                        <span className="flex flex-wrap gap-3.5 text-[11.5px] text-slate-600">
                            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-2 rounded-[2px] bg-emerald-500" />gravou</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-2 rounded-[2px] bg-amber-500" />em revisão</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-2 rounded-[2px] bg-red-600" />falhou</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-2 rounded-[2px] bg-slate-200" />sem carga</span>
                        </span>
                    </div>
                    {bases.map((base) => <BaseRow key={base.key} base={base} />)}
                </div>
            </section>

            <div className="flex min-h-0 flex-1 gap-4 p-6">
                <section aria-label="Execuções" className="flex w-[400px] shrink-0 flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                    <div className="flex flex-wrap gap-1.5 border-b border-[#eef2f6] px-3 py-2.5">
                        <label className="sr-only" htmlFor="history-domain">Frente</label>
                        <select id="history-domain" value={domain} onChange={(event) => { setDomain(event.target.value); setPage(0); }} className="h-7 rounded-md border border-slate-300 bg-white px-2 text-[11.5px] text-slate-700">
                            <option value="">Frente: todas</option>
                            <option value="total_crm">Total CRM</option>
                            <option value="aquisicao">Aquisição</option>
                            <option value="rentabilizacao">Rentabilização</option>
                        </select>
                        <label className="sr-only" htmlFor="history-status">Situação</label>
                        <select id="history-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0); }} className="h-7 rounded-md border border-slate-300 bg-white px-2 text-[11.5px] text-slate-700">
                            <option value="">Situação: todas</option>
                            <option value="applied">Concluídas</option>
                            <option value="reviewing">Em revisão</option>
                            <option value="failed">Falharam</option>
                        </select>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {loading && runs.length === 0 && (
                            <div className="flex items-center gap-2 px-4 py-6 text-[13px] text-slate-500"><Loader2 size={16} className="animate-spin" /> Carregando execuções</div>
                        )}
                        {error && (
                            <div className="m-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
                                {error} <button type="button" onClick={() => void loadPage()} className="font-semibold underline">Tentar de novo</button>
                            </div>
                        )}
                        {!loading && !error && runs.length === 0 && (
                            <div className="px-4 py-8 text-center text-[13px] text-slate-500">
                                Nenhuma atualização com esses filtros.
                            </div>
                        )}
                        {runs.map((run) => {
                            const meta = runStatusMeta(run.status);
                            const active = run.id === selectedId;
                            return (
                                <button
                                    key={run.id}
                                    type="button"
                                    onClick={() => { setSelectedId(run.id); setTab('campos'); setSearch(''); }}
                                    className={`flex w-full gap-2.5 border-b border-[#eef2f6] px-3.5 py-2.5 text-left ${active ? 'bg-cyan-50 shadow-[inset_3px_0_0_#0e7490]' : 'bg-white hover:bg-slate-50'}`}
                                >
                                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotClass[meta.tone]}`} />
                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="flex items-baseline gap-1.5">
                                            <b className="text-[13px] text-slate-900">{fmtDateTime(run.createdAt)}</b>
                                            <span className="truncate text-xs text-slate-600">{who(run)}</span>
                                            <span className="ml-auto text-[11.5px] text-slate-500">{DOMAIN_LABEL[run.domain] ?? run.domain}</span>
                                        </span>
                                        <span className="truncate text-[12.5px] text-slate-700">{run.sourceLabel}</span>
                                        <span className="flex gap-2.5 text-xs tabular-nums text-slate-600">
                                            <span><b className="text-slate-900">{fmtInt(run.applied)}</b> gravados</span>
                                            <span>{fmtInt(run.blocked)} fora</span>
                                            <span className={`font-semibold ${meta.tone === 'ok' ? 'text-emerald-700' : meta.tone === 'bad' ? 'text-red-700' : 'text-amber-700'}`}>{meta.label}</span>
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600">
                        <span>{total === 0 ? '0 execuções' : `${fmtInt(page * PAGE_SIZE + 1)} a ${fmtInt(Math.min(total, (page + 1) * PAGE_SIZE))} de ${fmtInt(total)}`}</span>
                        <span className="flex gap-1">
                            <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="h-[26px] rounded-sm border border-slate-300 bg-white px-2 disabled:border-slate-200 disabled:text-slate-400">Anterior</button>
                            <button type="button" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)} className="h-[26px] rounded-sm border border-slate-300 bg-white px-2 disabled:border-slate-200 disabled:text-slate-400">Próxima</button>
                        </span>
                    </div>
                </section>

                <section aria-label="Registro da execução" className="flex min-w-0 flex-1 flex-col gap-4">
                    {!detail && (
                        <div className="flex flex-1 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-[13px] text-slate-500">
                            {detailLoading ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Abrindo execução</span> : 'Escolha uma execução na lista.'}
                        </div>
                    )}
                    {detail && (() => {
                        const meta = runStatusMeta(detail.run.status);
                        const inserts = detail.applied.filter((row) => row.operationType === 'insert' || row.operationType === 'upsert').length;
                        const updates = detail.applied.filter((row) => row.operationType === 'update_metrics').length;
                        const timeline = [
                            { title: 'Arquivo lido', meta: `${fmtInt(detail.run.pastedRowCount)} linhas · ${detail.run.sourceLabel}`, time: fmtDateTime(detail.run.createdAt), tone: 'neutral' as const },
                            { title: detail.run.status === 'failed' ? 'Gravação falhou' : detail.run.status === 'reviewing' ? 'Revisão não concluída' : 'Gravação concluída', meta: `${fmtInt(detail.appliedTotal)} gravados · ${fmtInt(detail.blockedTotal)} ficaram de fora`, time: fmtDateTime(detail.run.updatedAt), tone: meta.tone },
                        ];
                        return (
                            <>
                                <div className="rounded-[14px] border border-slate-200 bg-white px-5 py-4">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h2 className="text-[17px] font-bold text-slate-900">Atualização de {fmtDateTime(detail.run.createdAt)}</h2>
                                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${toneClass[meta.tone]}`}>{meta.label}</span>
                                        <span className="flex-1" />
                                        <button type="button" onClick={() => downloadRunCsv(detail)} className="inline-flex h-[30px] items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-2.5 text-[12.5px] text-slate-800 hover:border-slate-400">
                                            <Download size={15} /> Baixar resultado (.csv)
                                        </button>
                                    </div>
                                    <div className="mt-1 text-[12.5px] text-slate-600">
                                        {who(detail.run)} · {DOMAIN_LABEL[detail.run.domain] ?? detail.run.domain} · {detail.run.sourceLabel}
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-[#eef2f6] md:grid-cols-4">
                                        {[
                                            ['Gravados', fmtInt(detail.appliedTotal)],
                                            ['Novos · atualizados', `${fmtInt(inserts)} · ${fmtInt(updates)}`],
                                            ['Ficaram de fora', fmtInt(detail.blockedTotal)],
                                            ['Duração', durationLabel(detail.run.createdAt, detail.run.updatedAt)],
                                        ].map(([label, value]) => (
                                            <div key={label} className="border-r border-[#eef2f6] px-3.5 py-2.5 last:border-r-0">
                                                <div className="text-xs text-slate-600">{label}</div>
                                                <div className="text-[22px] font-bold tabular-nums text-slate-900">{value}</div>
                                            </div>
                                        ))}
                                    </div>
                                    {(detail.appliedCapped || detail.blockedCapped) && (
                                        <p className="mt-2 text-xs text-slate-500">A lista abaixo mostra até 500 gravados e 200 fora; os totais acima são completos.</p>
                                    )}
                                </div>

                                <div className="flex min-h-0 flex-1 gap-4">
                                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                                        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-3">
                                            <div role="tablist" aria-label="Detalhe" className="flex gap-1">
                                                {([
                                                    ['campos', 'Mudanças por campo', fieldChanges.length],
                                                    ['gravados', 'Gravados', detail.appliedTotal],
                                                    ['fora', 'Ficaram de fora', detail.blockedTotal],
                                                ] as const).map(([id, label, count]) => (
                                                    <button
                                                        key={id}
                                                        type="button"
                                                        role="tab"
                                                        aria-selected={tab === id}
                                                        onClick={() => setTab(id)}
                                                        className={`px-2 py-3 text-[12.5px] ${tab === id ? 'font-semibold text-cyan-700 shadow-[inset_0_-2px_0_#0e7490]' : 'text-slate-600'}`}
                                                    >
                                                        {label} <span className="tabular-nums text-slate-500">{fmtInt(count)}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <span className="flex-1" />
                                            <label className="my-2 flex h-[30px] items-center gap-1.5 rounded-sm border border-slate-300 px-2 text-slate-500">
                                                <Search size={14} aria-hidden="true" />
                                                <span className="sr-only">Buscar activity ou jornada</span>
                                                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Activity ou jornada" className="w-44 bg-transparent text-[12.5px] text-slate-800 outline-none" />
                                            </label>
                                        </div>
                                        <div className="min-h-0 flex-1 overflow-auto">
                                            {tab === 'campos' && <ChangesTable rows={visibleChanges} />}
                                            {tab !== 'campos' && <CandidateTable rows={tab === 'gravados' ? visibleApplied : visibleBlocked} blocked={tab === 'fora'} />}
                                        </div>
                                    </div>
                                    <aside aria-label="Linha do tempo" className="w-[280px] shrink-0 rounded-[14px] border border-slate-200 bg-white px-4 py-3.5">
                                        <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">Linha do tempo</div>
                                        <ol className="flex flex-col">
                                            {timeline.map((event) => (
                                                <li key={event.title} className="flex gap-2.5">
                                                    <span className="flex shrink-0 flex-col items-center">
                                                        <span className={`mt-1 h-2.5 w-2.5 rounded-full ${dotClass[event.tone]}`} />
                                                        <span className="min-h-[26px] w-0.5 flex-1 bg-slate-200" />
                                                    </span>
                                                    <span className="flex flex-col pb-3">
                                                        <span className="text-[12.5px] font-semibold text-slate-900">{event.title}</span>
                                                        <span className="text-xs text-slate-600">{event.meta}</span>
                                                        <span className="inline-flex items-center gap-1 text-[11.5px] tabular-nums text-slate-500"><Clock size={11} /> {event.time}</span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ol>
                                        {detail.run.status === 'reviewing' && (
                                            <p className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800">
                                                <AlertCircle size={12} className="mr-1 inline" />Essa execução parou antes de gravar. Solte o arquivo de novo em Atualizar bases.
                                            </p>
                                        )}
                                        {detail.run.status === 'applied' && (
                                            <p className="mt-1 text-xs text-emerald-700"><CheckCircle size={12} className="mr-1 inline" />Gravada na base.</p>
                                        )}
                                    </aside>
                                </div>
                            </>
                        );
                    })()}
                </section>
            </div>
        </div>
    );
};

const ChangesTable = ({ rows }: { rows: ReturnType<typeof buildFieldChanges> }) => {
    if (rows.length === 0) return <p className="px-4 py-8 text-center text-[13px] text-slate-500">Nenhuma mudança de campo nesta lista.</p>;
    return (
        <table className="w-full border-collapse text-[12.5px]">
            <thead>
                <tr className="sticky top-0 bg-slate-50 text-left text-[11.5px] text-slate-600">
                    <th className="border-b border-slate-200 px-3 py-2 font-semibold">Activity</th>
                    <th className="w-36 border-b border-slate-200 px-1.5 py-2 font-semibold">Campo</th>
                    <th className="w-28 border-b border-slate-200 px-1.5 py-2 text-right font-semibold">Antes</th>
                    <th className="w-28 border-b border-slate-200 px-3 py-2 text-right font-semibold">Depois</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.key}>
                        <td className="max-w-0 truncate border-b border-[#eef2f6] px-3 py-2"><span className="font-semibold text-slate-900">{row.activityName}</span> <span className="text-slate-500">{row.date}</span></td>
                        <td className="border-b border-[#eef2f6] px-1.5 text-slate-700">{row.field}</td>
                        <td className="border-b border-[#eef2f6] px-1.5 text-right tabular-nums text-slate-500">{row.before}</td>
                        <td className={`border-b border-[#eef2f6] px-3 text-right font-bold tabular-nums ${row.isNew ? 'text-emerald-700' : 'text-cyan-700'}`}>{row.after}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const OPERATION_LABEL: Record<string, string> = { insert: 'Novo', upsert: 'Novo', update_metrics: 'Métricas', blocked: 'Fora', pending: 'Pendente' };

const CandidateTable = ({ rows, blocked }: { rows: UpdateRunCandidateRow[]; blocked: boolean }) => {
    if (rows.length === 0) return <p className="px-4 py-8 text-center text-[13px] text-slate-500">{blocked ? 'Nada ficou de fora.' : 'Nada foi gravado.'}</p>;
    return (
        <table className="w-full border-collapse text-[12.5px]">
            <thead>
                <tr className="sticky top-0 bg-slate-50 text-left text-[11.5px] text-slate-600">
                    <th className="w-16 border-b border-slate-200 px-3 py-2 font-semibold">Data</th>
                    <th className="w-20 border-b border-slate-200 px-1.5 py-2 font-semibold">Canal</th>
                    <th className="border-b border-slate-200 px-1.5 py-2 font-semibold">Activity · jornada</th>
                    <th className="w-24 border-b border-slate-200 px-1.5 py-2 font-semibold">{blocked ? 'Situação' : 'Operação'}</th>
                    {blocked && <th className="w-56 border-b border-slate-200 px-3 py-2 font-semibold">Motivo</th>}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.id}>
                        <td className="border-b border-[#eef2f6] px-3 py-1.5 tabular-nums text-slate-600">{row.date ? row.date.split('-').reverse().slice(0, 2).join('/') : 'sem dado'}</td>
                        <td className="border-b border-[#eef2f6] px-1.5 text-slate-700">{row.channel || 'sem dado'}</td>
                        <td className="max-w-0 border-b border-[#eef2f6] px-1.5 py-1.5">
                            <div className="truncate font-semibold text-slate-900">{row.activityName || 'sem activity'}</div>
                            <div className="truncate text-[11.5px] text-slate-500">{row.journey}</div>
                        </td>
                        <td className="border-b border-[#eef2f6] px-1.5 text-slate-700">{blocked ? (row.status === 'blocked' ? 'Fora' : row.status) : OPERATION_LABEL[row.operationType] ?? row.operationType}</td>
                        {blocked && <td className="max-w-0 truncate border-b border-[#eef2f6] px-3 text-slate-600">{row.conflictReason || row.fieldToReview || 'sem motivo registrado'}</td>}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};
