import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { usePeriod } from '../contexts/PeriodContext';
import { format } from 'date-fns';
import {
    Search, Download, Save, AlertCircle, X, History, Archive,
    ChevronRight, ChevronDown, FolderOpen, Folder,
    ArrowUp, ArrowDown, ArrowUpDown, FileText, Database, ExternalLink
} from 'lucide-react';
import Papa from 'papaparse';
import { FrameworkRow, Activity } from '../types/framework';
import { useVersionManager } from '../hooks/useVersionManager';
import { SaveVersionModal } from './SaveVersionModal';
import { VersionHistoryDrawer } from './VersionHistoryDrawer';
import { BU_CONFIG, CANAL_EMOJI, METRIC_SECTIONS, KNOWN_KEYS, DetailPanel } from './framework/FrameworkDetailPanel';

const DISPLAY_COLS: { key: string; label: string; cls: string }[] = [
    { key: 'Jornada', label: 'Jornada', cls: 'min-w-[200px]' },
    { key: 'Activity name / Taxonomia', label: 'Taxonomia', cls: 'min-w-[260px] max-w-sm' },
    { key: 'Canal', label: 'Canal', cls: 'min-w-[80px]' },
    { key: 'Data de Disparo', label: 'Data Disparo', cls: 'min-w-[110px]' },
    { key: 'Segmento', label: 'Segmento', cls: 'min-w-[130px]' },
    { key: 'Base Total', label: 'Base Total', cls: 'min-w-[90px] text-right' },
    { key: 'Base Acionável', label: 'Base Acion.', cls: 'min-w-[100px] text-right' },
    { key: '% Otimização de base', label: '% Otim.', cls: 'min-w-[75px] text-right' },
    { key: 'Etapa de aquisição', label: 'Etapa Aquis.', cls: 'min-w-[120px]' },
    { key: 'Ordem de disparo', label: 'Ordem', cls: 'min-w-[65px] text-right' },
    { key: 'Perfil de Crédito', label: 'Perfil Cred.', cls: 'min-w-[110px]' },
    { key: 'Produto', label: 'Produto', cls: 'min-w-[90px]' },
    { key: 'Oferta', label: 'Oferta', cls: 'min-w-[90px]' },
    { key: 'Promocional', label: 'Promo', cls: 'min-w-[80px]' },
    { key: 'SIGLA', label: 'SIGLA', cls: 'min-w-[70px]' },
    { key: 'Oferta 2', label: 'Oferta 2', cls: 'min-w-[90px]' },
    { key: 'Promocional 2', label: 'Promo 2', cls: 'min-w-[80px]' },
    { key: 'Custo Unitário Oferta', label: 'CU Oferta', cls: 'min-w-[85px] text-right' },
    { key: 'Custo Total da Oferta', label: 'CT Oferta', cls: 'min-w-[85px] text-right' },
    { key: 'Custo unitário do canal', label: 'CU Canal', cls: 'min-w-[80px] text-right' },
    { key: 'Custo total canal', label: 'CT Canal', cls: 'min-w-[80px] text-right' },
    { key: 'Taxa de Entrega', label: 'Tx Entrega', cls: 'min-w-[80px] text-right' },
    { key: 'Taxa de Abertura', label: 'Tx Abertura', cls: 'min-w-[85px] text-right' },
    { key: 'Taxa de Clique', label: 'Tx Clique', cls: 'min-w-[80px] text-right' },
    { key: 'Taxa de Proposta', label: 'Tx Proposta', cls: 'min-w-[85px] text-right' },
    { key: 'Taxa de Aprovação', label: 'Tx Aprovação', cls: 'min-w-[90px] text-right' },
    { key: 'Taxa de Finalização', label: 'Tx Final.', cls: 'min-w-[75px] text-right' },
    { key: 'Taxa de Conversão', label: 'Tx Conv.', cls: 'min-w-[75px] text-right' },
    { key: 'Custo Total Campanha', label: 'CT Campanha', cls: 'min-w-[95px] text-right' },
    { key: 'CAC', label: 'CAC', cls: 'min-w-[70px] text-right' },
    { key: 'Cartões Gerados', label: 'Cartões', cls: 'min-w-[75px] text-right' },
    { key: 'Aprovados', label: 'Aprovados', cls: 'min-w-[80px] text-right' },
    { key: 'Propostas', label: 'Propostas', cls: 'min-w-[80px] text-right' },
];

// ─── parseRowDate ─────────────────────────────────────────────────────────────

function parseRowDate(raw: string): string {
    if (!raw) return '';
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }
    return '';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Highlight({ text, term }: { text: string; term: string }) {
    const str = String(text ?? '');
    if (!term || !str) return <>{str}</>;
    const idx = str.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return <>{str}</>;
    return (
        <>
            {str.slice(0, idx)}
            <mark className="bg-amber-300/50 text-amber-800 rounded-sm px-0.5">{str.slice(idx, idx + term.length)}</mark>
            {str.slice(idx + term.length)}
        </>
    );
}

function StatusBadge({ value }: { value: string }) {
    const v = String(value ?? '').toLowerCase().trim();
    if (v === 'sim' || v === 'enviado' || v === 'realizado')
        return <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-medium">Enviado</span>;
    if (v === 'não' || v === 'nao' || v === 'pendente' || v === 'scheduled')
        return <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-500 border border-slate-200">Pendente</span>;
    if (v === 'rascunho')
        return <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-600 border border-amber-500/30">Rascunho</span>;
    if (v === 'em andamento')
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-600 border border-blue-500/30">Em andamento</span>;
    return <span className="text-slate-500 text-xs">{value || '—'}</span>;
}

interface SelectedNode { bu?: string; segmento?: string; canal?: string }

// ─── Component ────────────────────────────────────────────────────────────────

export const FrameworkView: React.FC = () => {
    const { frameworkData, setFrameworkData, activities } = useAppStore();

    // ── Data source — priority: Supabase (activities.raw), fallback: CSV ──────
    const displayData = useMemo<FrameworkRow[]>(() => {
        if (activities && activities.length > 0) {
            return (activities as Activity[])
                .map(a => a.raw)
                .filter((r): r is FrameworkRow => Boolean(r));
        }
        return frameworkData;
    }, [activities, frameworkData]);

    // ── Global period (PeriodContext) ─────────────────────────────────────────
    const { startDate, endDate } = usePeriod();
    const periodInicio = format(startDate, 'yyyy-MM-dd');
    const periodFim = format(endDate, 'yyyy-MM-dd');

    // ── State ──────────────────────────────────────────────────────────────────
    const [inputValue, setInputValue] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // debounced
    const [selected, setSelected] = useState<SelectedNode>({});
    const [expandedBUs, setExpandedBUs] = useState<Set<string>>(new Set());
    const [detailRow, setDetailRow] = useState<(FrameworkRow & { _origIdx: number }) | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
    const [edits, setEdits] = useState<{ [idx: number]: Partial<FrameworkRow> }>({});
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const { versions, currentVersion, saveNewVersion, restoreVersion, deleteVersion, exportVersion, storageUsage } = useVersionManager();

    // Debounce search input by 150ms
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearchInput = (value: string) => {
        setInputValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearchTerm(value);
        }, 150);
    };

    // ── Period-filtered data ──────────────────────────────────────────────────
    const periodData = useMemo(() => {
        if (!periodInicio || !periodFim) return displayData;
        return displayData.filter(row => {
            const d = parseRowDate(String(row['Data de Disparo'] ?? ''));
            return d >= periodInicio && d <= periodFim;
        });
    }, [displayData, periodInicio, periodFim]);

    // ── Build tree BU > Segmento > Canal ─────────────────────────────────────
    const tree = useMemo(() => {
        const buMap = new Map<string, Map<string, Map<string, FrameworkRow[]>>>();
        periodData.forEach(row => {
            const bu = row.BU || 'N/A';
            const segmento = row.Segmento || 'N/A';
            const canal = row.Canal || 'N/A';
            if (!buMap.has(bu)) buMap.set(bu, new Map());
            const segMap = buMap.get(bu)!;
            if (!segMap.has(segmento)) segMap.set(segmento, new Map());
            const canalMap = segMap.get(segmento)!;
            if (!canalMap.has(canal)) canalMap.set(canal, []);
            canalMap.get(canal)!.push(row);
        });
        return buMap;
    }, [periodData]);

    const allColumns = useMemo(() => displayData.length > 0 ? Object.keys(displayData[0]) : [], [displayData]);

    // ── Row matching ──────────────────────────────────────────────────────────
    const rowMatchesSearch = useCallback((row: FrameworkRow, term: string): boolean => {
        if (!term) return true;
        const lc = term.toLowerCase();
        return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(lc));
    }, []);

    // ── Search groups (search mode) ───────────────────────────────────────────
    // Note: search intentionally ignores tree selection — search is global
    const searchGroups = useMemo(() => {
        if (!searchTerm) return null;
        const groups: { bu: string; segmento: string; canal: string; rows: (FrameworkRow & { _origIdx: number })[] }[] = [];
        periodData.forEach((row, idx) => {
            if (!rowMatchesSearch(row, searchTerm)) return;
            const bu = row.BU || 'N/A';
            const segmento = row.Segmento || 'N/A';
            const canal = row.Canal || 'N/A';
            const g = groups.find(g => g.bu === bu && g.segmento === segmento && g.canal === canal);
            if (g) g.rows.push({ ...row, _origIdx: idx });
            else groups.push({ bu, segmento, canal, rows: [{ ...row, _origIdx: idx }] });
        });
        return groups;
    }, [searchTerm, periodData, rowMatchesSearch]);

    // Tree highlights for search
    const matchingBUs = useMemo(() => {
        if (!searchTerm) return new Set<string>();
        return new Set(periodData.filter(r => rowMatchesSearch(r, searchTerm)).map(r => r.BU || 'N/A'));
    }, [searchTerm, periodData, rowMatchesSearch]);

    const matchingSegmentos = useMemo(() => {
        if (!searchTerm) return new Map<string, Set<string>>();
        const m = new Map<string, Set<string>>();
        periodData.forEach(r => {
            if (!rowMatchesSearch(r, searchTerm)) return;
            const bu = r.BU || 'N/A', seg = r.Segmento || 'N/A';
            if (!m.has(bu)) m.set(bu, new Set());
            m.get(bu)!.add(seg);
        });
        return m;
    }, [searchTerm, periodData, rowMatchesSearch]);

    // ── Flat rows for table view ──────────────────────────────────────────────
    const flatRows = useMemo(() => {
        if (searchTerm) return [];
        let data = periodData.map((row, idx) => ({ ...row, _origIdx: idx }));
        if (selected.bu) data = data.filter(r => (r.BU || 'N/A') === selected.bu);
        if (selected.segmento) data = data.filter(r => (r.Segmento || 'N/A') === selected.segmento);
        if (selected.canal) data = data.filter(r => (r.Canal || 'N/A') === selected.canal);
        if (sortConfig.key) {
            data.sort((a, b) => {
                const k = sortConfig.key!;
                const va = String((edits[a._origIdx] as any)?.[k] ?? (a as any)[k] ?? '');
                const vb = String((edits[b._origIdx] as any)?.[k] ?? (b as any)[k] ?? '');
                const na = parseFloat(va.replace(',', '.'));
                const nb = parseFloat(vb.replace(',', '.'));
                if (!isNaN(na) && !isNaN(nb)) return sortConfig.direction === 'asc' ? na - nb : nb - na;
                return sortConfig.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        }
        return data;
    }, [searchTerm, periodData, selected, sortConfig, edits]);

    // ── Auto-expand tree on search ────────────────────────────────────────────
    useEffect(() => {
        if (searchTerm && matchingBUs.size > 0) {
            setExpandedBUs(new Set(matchingBUs));
        }
    }, [searchTerm, matchingBUs]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const toggleBU = (bu: string) => {
        setExpandedBUs(prev => {
            const next = new Set(prev);
            next.has(bu) ? next.delete(bu) : next.add(bu);
            return next;
        });
    };

    const selectNode = (bu?: string, segmento?: string, canal?: string) => {
        setSelected({ bu, segmento, canal });
        setDetailRow(null);
        if (bu && !expandedBUs.has(bu)) setExpandedBUs(prev => new Set([...prev, bu]));
    };

    const handleSort = (key: string) => {
        setSortConfig(c => {
            if (c.key === key) {
                if (c.direction === 'asc') return { key, direction: 'desc' };
                return { key: null, direction: 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const handleQuickSave = () => {
        const merged = frameworkData.map((row, idx) => edits[idx] ? { ...row, ...edits[idx] } : row);
        setFrameworkData(merged, activities);
        setEdits({});
    };

    const handleSaveVersion = (name: string, description: string) => {
        const merged = frameworkData.map((row, idx) => edits[idx] ? { ...row, ...edits[idx] } : row);
        try {
            saveNewVersion(name, merged, description, Object.keys(edits).length);
            setFrameworkData(merged, activities);
            setEdits({});
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleRestoreVersion = (id: string) => {
        if (Object.keys(edits).length > 0 && !confirm('Edições não salvas serão descartadas. Continuar?')) return;
        try {
            const data = restoreVersion(id);
            setFrameworkData(data, activities);
            setEdits({});
            setIsHistoryOpen(false);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleExport = () => {
        const data = frameworkData.map((row, idx) => edits[idx] ? { ...row, ...edits[idx] } : row);
        const csv = Papa.unparse(data, { delimiter: ';', quotes: true });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', 'campanhas_editado.csv');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    // ── Count helpers ─────────────────────────────────────────────────────────
    const segMatchCount = (bu: string, seg: string) => {
        const allCanais = tree.get(bu)?.get(seg);
        if (!allCanais) return 0;
        return [...allCanais.values()].reduce((s, rows) => s + rows.length, 0);
    };

    const canalMatchCount = (bu: string, seg: string, canal: string) =>
        tree.get(bu)?.get(seg)?.get(canal)?.length ?? 0;

    const buMatchCount = (bu: string) => {
        const segMap = tree.get(bu);
        if (!segMap) return 0;
        let total = 0;
        for (const canalMap of segMap.values())
            for (const rows of canalMap.values()) total += rows.length;
        return total;
    };

    const totalCount = searchTerm
        ? (searchGroups?.reduce((s, g) => s + g.rows.length, 0) ?? 0)
        : flatRows.length;

    // ─── Empty state ──────────────────────────────────────────────────────────
    if (frameworkData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                <AlertCircle size={40} className="opacity-30" />
                <p className="text-sm">Nenhum dado carregado. Faça upload do CSV na tela inicial.</p>
            </div>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <SaveVersionModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveVersion}
                pendingEditsCount={Object.keys(edits).length}
            />
            <VersionHistoryDrawer
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                versions={versions}
                currentVersionId={currentVersion?.id || null}
                onRestore={handleRestoreVersion}
                onDelete={deleteVersion}
                onExport={exportVersion}
                storageUsage={storageUsage}
            />

            <div className="flex flex-col h-full bg-white overflow-hidden rounded-xl border border-slate-200 shadow-sm">

                {/* ── Toolbar ─────────────────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-200 bg-white shadow-sm shrink-0">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-[#00c6cc] transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar em todas as campanhas..."
                            value={inputValue}
                            onChange={e => handleSearchInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00c6cc]/30 focus:border-[#00c6cc] outline-none transition-all"
                        />
                        {inputValue && (
                            <button
                                onClick={() => { handleSearchInput(''); setSearchTerm(''); }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 transition-colors"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Search hit count pill */}
                    {searchTerm && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium shrink-0">
                            {totalCount} resultado{totalCount !== 1 ? 's' : ''}
                        </span>
                    )}

                    <div className="flex items-center gap-1.5 ml-auto">
                        {currentVersion && (
                            <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                <Archive size={11} />
                                <span className="max-w-[130px] truncate">{currentVersion.name}</span>
                            </span>
                        )}

                        {/* History button */}
                        <button
                            onClick={() => setIsHistoryOpen(true)}
                            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                            title="Histórico de Versões"
                        >
                            <History size={16} />
                        </button>

                        {/* Pending edits */}
                        {Object.keys(edits).length > 0 && (
                            <>
                                <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg font-medium">
                                    {Object.keys(edits).length} edições
                                </span>
                                <button
                                    onClick={handleQuickSave}
                                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                                >
                                    Aplicar
                                </button>
                            </>
                        )}

                        {/* Save version — primary */}
                        <button
                            onClick={() => setIsSaveModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00c6cc] hover:bg-[#00b3b8] text-slate-900 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                            <Save size={13} /> Salvar Versão
                        </button>

                        {/* Export — secondary */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                            <Download size={13} /> Exportar
                        </button>
                    </div>
                </div>

                {/* ── Main area: 3 columns ──────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── Left: Explorer Tree ───────────────────────────── */}
                    <aside className="w-60 shrink-0 border-r border-slate-100 bg-white flex flex-col overflow-hidden">
                        <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Database size={11} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explorador</span>
                        </div>

                        <nav className="flex-1 overflow-y-auto py-1 select-none">
                            {/* Root node */}
                            <button
                                onClick={() => { selectNode(); handleSearchInput(''); setSearchTerm(''); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all rounded-none ${!selected.bu && !searchTerm
                                    ? 'bg-cyan-50 text-cyan-700 border-l-2 border-[#00c6cc] font-semibold'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent'
                                    }`}
                            >
                                <FolderOpen size={14} className="text-amber-500 shrink-0" />
                                <span className="flex-1 text-left truncate text-xs font-medium">Todos os Disparos</span>
                                <span className="text-[10px] font-semibold text-slate-400">{periodData.length}</span>
                            </button>

                            {/* BU nodes */}
                            {[...tree.keys()].map(bu => {
                                const buCfg = BU_CONFIG[bu] || BU_CONFIG['B2C'];
                                const isExpanded = expandedBUs.has(bu);
                                const hasMatch = !searchTerm || matchingBUs.has(bu);
                                const count = buMatchCount(bu);
                                if (searchTerm && !hasMatch) return null;
                                const isSelected = selected.bu === bu && !selected.segmento;

                                return (
                                    <div key={bu}>
                                        <button
                                            onClick={() => {
                                                toggleBU(bu);
                                                selectNode(bu, undefined, undefined);
                                                if (searchTerm) { handleSearchInput(''); setSearchTerm(''); }
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-all ${isSelected
                                                ? `${buCfg.bg} ${buCfg.text} ${buCfg.border} font-semibold`
                                                : `text-slate-600 hover:bg-slate-50 border-l-2 border-transparent`
                                                }`}
                                        >
                                            <span className="text-slate-400 shrink-0">
                                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            </span>
                                            {isExpanded
                                                ? <FolderOpen size={13} className={`${buCfg.folder} shrink-0`} />
                                                : <Folder size={13} className={`${buCfg.folder} shrink-0`} />
                                            }
                                            <span className={`flex-1 text-left truncate text-xs font-semibold ${buCfg.text}`}>{bu}</span>
                                            <span className={`text-[10px] ${searchTerm && hasMatch ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>{count}</span>
                                        </button>

                                        {/* Segmento children */}
                                        {isExpanded && [...(tree.get(bu)?.keys() ?? [])].map(seg => {
                                            const segHasMatch = !searchTerm || matchingSegmentos.get(bu)?.has(seg);
                                            const sCount = segMatchCount(bu, seg);
                                            if (searchTerm && !segHasMatch) return null;
                                            const isSegSelected = selected.bu === bu && selected.segmento === seg && !selected.canal;
                                            const isSegExpanded = selected.bu === bu && selected.segmento === seg;
                                            const segCanais = [...(tree.get(bu)?.get(seg)?.keys() ?? [])];
                                            const multiCanal = segCanais.length > 1;

                                            return (
                                                <div key={seg}>
                                                    <button
                                                        onClick={() => { selectNode(bu, seg, undefined); if (searchTerm) { handleSearchInput(''); setSearchTerm(''); } }}
                                                        className={`w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-xs transition-all ${isSegSelected
                                                            ? 'bg-cyan-50 text-cyan-700 border-l-2 border-[#00c6cc] font-semibold'
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-l-2 border-transparent'
                                                            }`}
                                                    >
                                                        {multiCanal
                                                            ? (isSegExpanded
                                                                ? <ChevronDown size={10} className="shrink-0 text-slate-400" />
                                                                : <ChevronRight size={10} className="shrink-0 text-slate-400" />)
                                                            : <span className="w-[10px] shrink-0" />
                                                        }
                                                        <FileText size={11} className="shrink-0 opacity-40" />
                                                        <span className="flex-1 text-left truncate">{seg}</span>
                                                        <span className={`text-[10px] ${searchTerm && segHasMatch ? 'text-amber-500 font-bold' : 'text-slate-400'}`}>{sCount}</span>
                                                    </button>

                                                    {isSegExpanded && multiCanal && segCanais.map(canal => {
                                                        const cCount = canalMatchCount(bu, seg, canal);
                                                        const isCanalSelected = selected.bu === bu && selected.segmento === seg && selected.canal === canal;
                                                        return (
                                                            <button
                                                                key={canal}
                                                                onClick={() => { selectNode(bu, seg, canal); if (searchTerm) { handleSearchInput(''); setSearchTerm(''); } }}
                                                                className={`w-full flex items-center gap-2 pl-11 pr-3 py-1.5 text-xs transition-all ${isCanalSelected
                                                                    ? 'bg-cyan-50 text-cyan-700 border-l-2 border-[#00c6cc] font-medium'
                                                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700 border-l-2 border-transparent'
                                                                    }`}
                                                            >
                                                                <span>{CANAL_EMOJI[canal] ?? '▸'}</span>
                                                                <span className="flex-1 text-left truncate">{canal}</span>
                                                                <span className="text-[10px] text-slate-400">{cCount}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* ── Center: Content ───────────────────────────────── */}
                    <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                        {/* Breadcrumb */}
                        <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-1 text-xs text-slate-500 shrink-0">
                            <span
                                className="hover:text-slate-700 cursor-pointer font-medium"
                                onClick={() => { selectNode(); handleSearchInput(''); setSearchTerm(''); }}
                            >
                                Explorador
                            </span>
                            {selected.bu && (
                                <>
                                    <ChevronRight size={11} />
                                    <span
                                        className={`${BU_CONFIG[selected.bu]?.text ?? 'text-slate-700'} font-semibold cursor-pointer hover:opacity-75`}
                                        onClick={() => selectNode(selected.bu, undefined, undefined)}
                                    >
                                        {selected.bu}
                                    </span>
                                </>
                            )}
                            {selected.segmento && (
                                <>
                                    <ChevronRight size={11} />
                                    <span
                                        className="text-slate-700 font-medium cursor-pointer hover:opacity-75"
                                        onClick={() => selectNode(selected.bu, selected.segmento, undefined)}
                                    >
                                        {selected.segmento}
                                    </span>
                                </>
                            )}
                            {selected.canal && (
                                <>
                                    <ChevronRight size={11} />
                                    <span className="text-slate-500">
                                        {CANAL_EMOJI[selected.canal] ?? ''} {selected.canal}
                                    </span>
                                </>
                            )}
                            {searchTerm && (
                                <>
                                    <ChevronRight size={11} />
                                    <span className="text-amber-600 font-medium">"{searchTerm}"</span>
                                </>
                            )}
                            <span className="ml-auto text-slate-400 font-medium">
                                {totalCount} {searchTerm ? 'resultado' : 'linha'}{totalCount !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* ── SEARCH RESULTS VIEW ───────────────────────────── */}
                        {searchTerm && searchGroups ? (
                            <div className="flex-1 overflow-y-auto">
                                {searchGroups.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                                        <Search size={28} className="opacity-30" />
                                        <p className="text-sm">Nenhum resultado para "{searchTerm}"</p>
                                    </div>
                                ) : (
                                    searchGroups.map(group => {
                                        const buCfg = BU_CONFIG[group.bu] || BU_CONFIG['B2C'];
                                        return (
                                            <div key={`${group.bu}-${group.segmento}-${group.canal}`} className="border-b border-slate-100">
                                                {/* Group header */}
                                                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 sticky top-0 z-10 border-b border-slate-100">
                                                    <span className={`w-2 h-2 rounded-full ${buCfg.dot} shrink-0`} />
                                                    <span className={`font-bold text-xs ${buCfg.text}`}>{group.bu}</span>
                                                    <ChevronRight size={10} className="text-slate-300" />
                                                    <span className="text-xs text-slate-600 font-medium">{group.segmento}</span>
                                                    {group.canal && group.canal !== 'N/A' && (
                                                        <>
                                                            <ChevronRight size={10} className="text-slate-300" />
                                                            <span className="text-xs text-slate-500">
                                                                {CANAL_EMOJI[group.canal] ?? ''} {group.canal}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                                                        {group.rows.length} result{group.rows.length !== 1 ? 's' : ''}
                                                    </span>
                                                </div>

                                                {/* Result rows */}
                                                {group.rows.map(row => (
                                                    <button
                                                        key={row._origIdx}
                                                        onClick={() => setDetailRow(row)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-cyan-50/40 transition-colors text-left border-b border-slate-50 group"
                                                    >
                                                        <FileText size={13} className="text-slate-300 shrink-0 group-hover:text-[#00c6cc] transition-colors mt-0.5" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs text-slate-700 font-mono truncate leading-relaxed">
                                                                <Highlight text={String(row['Activity name / Taxonomia'] ?? '')} term={searchTerm} />
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-0.5">
                                                                <span className="text-[11px] text-slate-400">
                                                                    <Highlight text={String(row['Segmento'] ?? '')} term={searchTerm} />
                                                                </span>
                                                                {row['Jornada'] && (
                                                                    <span className="text-[11px] text-slate-300">
                                                                        <Highlight text={String(row['Jornada'] ?? '')} term={searchTerm} />
                                                                    </span>
                                                                )}
                                                                <span className="text-[11px] text-slate-300">{row['Data de Disparo']}</span>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={12} className="text-slate-300 shrink-0 group-hover:text-[#00c6cc] transition-colors" />
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                        ) : (
                            /* ── TABLE VIEW ─────────────────────────────────── */
                            <div className="flex-1 overflow-auto">
                                <table className="w-full border-collapse text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 sticky top-0 z-20">
                                        <tr>
                                            <th className="px-3 py-2.5 border-b-2 border-slate-200 w-8 text-center text-slate-400 sticky left-0 bg-slate-50 border-r border-slate-200 font-semibold">#</th>
                                            {DISPLAY_COLS.map(col => (
                                                <th key={col.key}
                                                    onClick={() => handleSort(col.key)}
                                                    className={`px-3 py-2.5 border-b-2 border-slate-200 font-semibold text-slate-500 whitespace-nowrap cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition-colors select-none group ${col.cls}`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {col.label}
                                                        {sortConfig.key === col.key
                                                            ? (sortConfig.direction === 'asc'
                                                                ? <ArrowUp size={10} className="text-[#00c6cc]" />
                                                                : <ArrowDown size={10} className="text-[#00c6cc]" />)
                                                            : <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-30 transition-opacity" />
                                                        }
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="px-3 py-2.5 border-b-2 border-slate-200 w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {flatRows.map((row, i) => {
                                            const buCfg = BU_CONFIG[row.BU] || BU_CONFIG['B2C'];
                                            const isSelected = detailRow?._origIdx === row._origIdx;
                                            return (
                                                <tr
                                                    key={row._origIdx}
                                                    className={`group transition-colors cursor-pointer ${isSelected
                                                            ? 'bg-cyan-50 ring-1 ring-inset ring-[#00c6cc]/30'
                                                            : `hover:bg-cyan-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`
                                                        }`}
                                                    onClick={() => setDetailRow(isSelected ? null : row)}
                                                >
                                                    <td className={`px-2 py-1 text-slate-400 text-center border-r border-slate-100 sticky left-0 transition-colors text-[10px] ${isSelected ? 'bg-cyan-50' : (i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')
                                                        } group-hover:bg-cyan-50/40`}>
                                                        {i + 1}
                                                    </td>
                                                    {DISPLAY_COLS.map(col => {
                                                        const val = (edits[row._origIdx] as any)?.[col.key] ?? (row as any)[col.key] ?? '';
                                                        const edited = (edits[row._origIdx] as any)?.[col.key] !== undefined;
                                                        if (col.key === 'Activity name / Taxonomia') {
                                                            return (
                                                                <td key={col.key} className="px-2 py-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${buCfg.dot}`} />
                                                                        <span className={`font-mono text-slate-800 truncate max-w-[180px] text-[10px] ${edited ? 'text-amber-600' : ''}`}>{val}</span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        }
                                                        return (
                                                            <td key={col.key} className={`px-2 py-1 text-slate-500 text-[10px] ${edited ? 'text-amber-600 bg-amber-500/5' : ''}`}>
                                                                {String(val || '—')}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-1 py-1">
                                                        <ExternalLink size={11} className="text-slate-300 group-hover:text-[#00c6cc] transition-colors" />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {flatRows.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                                        <Folder size={28} className="opacity-30" />
                                        <p className="text-sm">Nenhuma linha nesta pasta</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Footer ──────────────────────────────────────────── */}
                        <div className="bg-slate-50 border-t border-slate-100 px-4 py-1.5 text-[10px] text-slate-400 flex justify-between items-center shrink-0">
                            <span>Total: <strong className="text-slate-600">{frameworkData.length}</strong></span>
                            <span>Exibindo: <strong className="text-slate-600">{totalCount}</strong></span>
                        </div>
                    </div>

                    {/* ── Right: Detail Panel ───────────────────────────── */}
                    <aside className="w-72 shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
                            <FileText size={11} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhes</span>
                            {detailRow && (
                                <span className="ml-auto text-[10px] text-slate-400">
                                    #{((detailRow as any)._origIdx ?? 0) + 1}
                                </span>
                            )}
                        </div>
                        <DetailPanel
                            row={detailRow}
                            allColumns={allColumns}
                            onClose={() => setDetailRow(null)}
                        />
                    </aside>
                </div>
            </div>
        </>
    );
};
