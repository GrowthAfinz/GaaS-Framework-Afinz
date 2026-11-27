import {SfmcIngestionHistory} from './communications/SfmcIngestionHistory';
import React, { useState, useEffect, useRef } from 'react';
import { User, Moon, LogOut, Mail, Loader2, UploadCloud, FileText, Download, Trash2, RefreshCw, CheckCircle, Database, AlertCircle, ArrowRight, ShieldCheck, Users, Wand2, History, Target, Package, UserCircle, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserRole } from '../context/UserRoleContext';
import { storageService, StorageFile } from '../services/storageService';
import { useFrameworkData } from '../hooks/useFrameworkData';
import { useCSVParser } from '../hooks/useCSVParser';
import { useAppStore } from '../store/useAppStore';
import { parseXLSX } from '../modules/paid-media-afinz/utils/fileParser';
import { GoalsManager } from './admin/GoalsManager';
import { UserManagementPanel } from './admin/UserManagementPanel';
import { activityService, versionService } from '../services/activityService';
import { dataService } from '../services/dataService';
import { IntelligentFrameworkUpdate, type ImportStep } from './admin/IntelligentFrameworkUpdate';
import { UpdateHistoryView } from './admin/UpdateHistoryView';
import { readSettingsSection, settingsSectionHref, writeSettingsSection, type SettingsSection } from './admin/settingsSections';
import { onTabLinkClick } from '../services/tabNavigation';

const UPLOAD_FIX_VERSION = 'ENG_FIX_V3_2026-03-09';

const VersionManager: React.FC = () => {
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [activating, setActivating] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { processCSV } = useFrameworkData();

    useEffect(() => {
        loadVersions();
    }, []);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const list = await versionService.listVersions();
            setVersions(list);
        } catch (e: any) {
            console.error(e);
            setMsg({ type: 'error', text: 'Erro ao listar versões: ' + e.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMsg(null);
        try {
            // 1. Parse locally to validate and get row count
            const data = await processCSV(file, { updateStore: false });
            const rowCount = data.length;

            // 2. Upload Version
            await versionService.uploadVersion(file, rowCount);

            await loadVersions();
            setMsg({ type: 'success', text: 'Versão enviada com sucesso! Clique em ativar para aplicar.' });
        } catch (e: any) {
            console.error(e);
            setMsg({ type: 'error', text: 'Falha no upload: ' + e.message });
        } finally {
            setUploading(false);
        }
    };

    const handleActivate = async (version: any) => {
        if (!confirm(`Deseja ATIVAR a versão "${version.filename}"?\n\nISSO SUBSTITUIRÁ TODOS OS DADOS ATUAIS DO FRAMEWORK NO BANCO DE DADOS.`)) return;

        setActivating(version.id);
        setMsg(null);
        try {
            // 1. Download Content
            const signedUrl = await storageService.getDownloadUrl(version.storage_path);
            const resp = await fetch(signedUrl);
            const blob = await resp.blob();
            const file = new File([blob], version.filename, { type: blob.type });

            // 2. Parse
            const data = await processCSV(file);

            // 3. Activate
            await versionService.activateVersion(version.id, data);

            await loadVersions();
            setMsg({ type: 'success', text: `Versão "${version.filename}" ativada com sucesso!` });
        } catch (e: any) {
            console.error(e);
            setMsg({ type: 'error', text: 'Erro na ativação: ' + e.message });
        } finally {
            setActivating(null);
        }
    };

    const handleDelete = async (version: any) => {
        if (!confirm('Excluir esta versão permanentemente?')) return;
        setLoading(true);
        try {
            await versionService.deleteVersion(version.id, version.storage_path);
            await loadVersions();
        } catch (e: any) {
            setMsg({ type: 'error', text: e.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="border border-slate-200 bg-white rounded-lg overflow-hidden transition-all hover:border-blue-500/30">
            <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                        <Database size={18} />
                    </div>
                    <div>
                        <span className="font-semibold text-slate-700 text-sm block">Versões do Framework</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">CSV</span>
                    </div>
                </div>
                <div className="relative group">
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                    />
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105">
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        {uploading ? 'Enviando...' : 'Nova Versão'}
                    </button>
                </div>
            </div>

            <div className="p-2 max-h-64 overflow-y-auto min-h-[120px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {loading && !versions.length ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                        <Loader2 className="animate-spin" />
                        <span className="text-xs">Carregando versões...</span>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2 dashed-border">
                        <UploadCloud size={24} className="opacity-20" />
                        <p className="text-xs italic">Nenhuma versão encontrada.</p>
                        {msg?.type === 'error' && (
                            <p className="text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded max-w-[200px] text-center">{msg.text}</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {versions.map((v: any) => (
                            <div key={v.id} className={`flex items-center justify-between p-3 rounded-lg group transition-colors border ${v.is_active ? 'bg-emerald-500/10 border-emerald-500/30' : 'hover:bg-slate-50 border-transparent hover:border-slate-200'}`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={16} className={`${v.is_active ? 'text-emerald-500' : 'text-slate-400'} flex-shrink-0`} />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium truncate max-w-[220px] ${v.is_active ? 'text-emerald-600' : 'text-slate-700'}`} title={v.filename}>
                                                {v.filename}
                                            </p>
                                            {v.is_active && <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase">Ativo</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span>{new Date(v.created_at).toLocaleString('pt-BR')}</span>
                                            <span>•</span>
                                            <span>{v.row_count} linhas</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 group-hover:opacity-100 transition-all">
                                    {!v.is_active && (
                                        <button
                                            onClick={() => handleActivate(v)}
                                            disabled={activating === v.id}
                                            className="px-2 py-1 text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded border border-blue-500/20 transition-colors uppercase font-bold tracking-wider"
                                        >
                                            {activating === v.id ? 'Ativando...' : 'Ativar'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(v)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {msg && (
                <div className={`${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'} text-xs px-4 py-2 flex items-center gap-2 border-t`}>
                    {msg.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {msg.text}
                </div>
            )}
        </div>
    );
};

const FileManager: React.FC<{ title: string; slot: string; accept: string }> = ({ title, slot, accept }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Hooks for restoration
    const { parseB2CCSV } = useCSVParser();
    const { setB2CData, setPaidMediaData } = useAppStore();

    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const list = await storageService.listFiles(slot);
            setFiles(list || []);
        } catch (e: any) {
            console.error(e);
            let errorText = e.message;
            if (e.message?.includes?.('Bucket not found')) {
                errorText = 'Bucket "app-data" não encontrado.';
            }
            setMsg({ type: 'error', text: errorText });
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setMsg(null);
        try {
            // 1. Try to upload to Backup Bucket (optional - Storage RLS may block anonymous users)
            try {
                await storageService.uploadFile(slot, file);
            } catch (storageErr: any) {
                console.warn('⚠️ Storage upload skipped (RLS ou bucket não acessível):', storageErr.message);
                // Continue anyway — database sync is the priority
            }

            // 2. Parse and Upsert to Database (always required)
            if (slot === 'b2c') {
                const { data } = await parseB2CCSV(file);
                await dataService.upsertB2CMetrics(data);
                setB2CData(data);
            } else if (slot === 'media') {
                const data = await parseXLSX(file);
                await dataService.upsertPaidMedia(data as any);
                setPaidMediaData(data as any);
            }

            await loadFiles();
            setMsg({ type: 'success', text: `Dados sincronizados com o banco com sucesso! (${UPLOAD_FIX_VERSION})` });
        } catch (e: any) {
            console.error('❌ Erro durante upload:', e);
            setMsg({ type: 'error', text: 'Falha: ' + e.message });
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (path: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;
        setLoading(true);
        try {
            await storageService.deleteFile(slot + '/' + path);
            await loadFiles();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (path: string) => {
        setRestoring(true);
        setMsg(null);
        try {
            const fullPath = slot + '/' + path;
            const signedUrl = await storageService.getDownloadUrl(fullPath);

            // 1. Fetch Blob
            const resp = await fetch(signedUrl);
            const blob = await resp.blob();
            const file = new File([blob], path, { type: blob.type });

            // 2. Parse based on slot
            if (slot === 'b2c') {
                const { data } = await parseB2CCSV(file);
                // PERSISTENCE FIX: Save to database
                await dataService.upsertB2CMetrics(data);
                // Update Store
                setB2CData(data);
            } else if (slot === 'media') {
                const data = await parseXLSX(file);
                // PERSISTENCE FIX: Save to database
                await dataService.upsertPaidMedia(data as any);
                // Update Store
                setPaidMediaData(data as any);
            }

            setMsg({ type: 'success', text: 'Dados restaurados e salvos no banco com sucesso!' });
        } catch (e: any) {
            console.error('❌ Erro ao restaurar:', e);
            setMsg({ type: 'error', text: 'Erro ao restaurar: ' + e.message });
        } finally {
            setRestoring(false);
        }
    };

    return (
        <div className="border border-slate-200 bg-white rounded-lg overflow-hidden transition-all hover:border-blue-500/30">
            <div className="bg-slate-50 p-4 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                        <Database size={18} />
                    </div>
                    <div>
                        <span className="font-semibold text-slate-700 text-sm block">{title}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{accept.replace(/\./g, '').toUpperCase()}</span>
                    </div>
                </div>
                <div className="relative group">
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={uploading}
                    />
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed group-hover:scale-105">
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                        {uploading ? 'Enviando...' : `Upload (Eng Fix ${UPLOAD_FIX_VERSION})`}
                    </button>
                </div>
            </div>

            <div className="p-2 max-h-56 overflow-y-auto min-h-[120px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {loading && !files.length ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2">
                        <Loader2 className="animate-spin" />
                        <span className="text-xs">Carregando lista...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-2 dashed-border">
                        <UploadCloud size={24} className="opacity-20" />
                        <p className="text-xs italic">Nenhum arquivo na nuvem.</p>
                        {msg?.type === 'error' && (
                            <p className="text-[10px] text-red-500 bg-red-500/10 px-2 py-1 rounded max-w-[200px] text-center">
                                {msg.text}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {files.map((f: any) => (
                            <div key={f.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors border border-transparent hover:border-slate-200">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-700 truncate max-w-[220px] group-hover:text-slate-900 transition-colors" title={f.name}>
                                            {f.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span>{f.created_at && !isNaN(new Date(f.created_at).getTime()) ? new Date(f.created_at).toLocaleString('pt-BR') : '-'}</span>
                                            <span>•</span>
                                            <span>{(f.metadata?.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                    <button
                                        onClick={() => handleRestore(f.name)}
                                        disabled={restoring}
                                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors tooltip-trigger"
                                        title="Restaurar e Aplicar"
                                    >
                                        <RefreshCw size={16} className={restoring ? 'animate-spin' : ''} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(f.name)}
                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Excluir Definitivamente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {msg && msg.type === 'success' && (
                <div className="bg-emerald-500/10 text-emerald-600 text-xs px-4 py-2 flex items-center gap-2 border-t border-emerald-500/20">
                    <CheckCircle size={12} />
                    {msg.text}
                </div>
            )}
            {msg && msg.type === 'error' && files.length > 0 && (
                <div className="bg-red-500/10 text-red-500 text-xs px-4 py-2 flex items-center gap-2 border-t border-red-500/20">
                    <AlertCircle size={12} />
                    {msg.text}
                </div>
            )}
        </div>
    );
};

const SettingsPageHeader: React.FC<{ title: string }> = ({ title }) => (
    <div>
        <div className="text-xs text-slate-500">Configurações</div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
    </div>
);

export const ConfiguracoesView: React.FC = () => {
    const { user, signInWithEmail, signOut, loading } = useAuth();
    const { isAdmin } = useUserRole();
    const [emailInput, setEmailInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [section, setSectionState] = useState<SettingsSection>(() => readSettingsSection());
    const [navCollapsed, setNavCollapsed] = useState(false);
    const [navQuery, setNavQuery] = useState('');
    // O importador fica montado mesmo fora da seção, para não perder uma revisão em andamento.
    const [importerVisited, setImporterVisited] = useState(section === 'atualizar');
    const importerStepRef = useRef<ImportStep>('arquivo');
    const setSection = (next: SettingsSection) => {
        setSectionState(next);
        writeSettingsSection(next);
        if (next === 'atualizar') setImporterVisited(true);
        // Nas etapas do importador o menu recolhe; fora dele volta aberto.
        setNavCollapsed(next === 'atualizar' && importerStepRef.current !== 'arquivo');
    };
    useEffect(() => {
        const onPop = () => {
            const next = readSettingsSection();
            setSectionState(next);
            if (next === 'atualizar') setImporterVisited(true);
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        setError(null);
        try {
            await signInWithEmail(emailInput);
            setSent(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar email');
        } finally {
            setIsSending(false);
        }
    };

    if (loading) {
        return <div className="h-full w-full flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;
    }

    // --- LOGGED OUT STATE ---
    // Should depend on App guard, but as fallback:
    if (!user) {
        return (
            <div className="min-h-full bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-2xl">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Acesso Restrito</h2>
                        <p className="text-slate-500 text-sm">Sua sessão expirou ou você não está autenticado.</p>
                    </div>

                    <div className="mt-8 text-center text-sm text-slate-500">
                        Por favor, recarregue a página ou faça login novamente para acessar as configurações.
                    </div>
                </div>
            </div>
        );
    }

    // --- LOGGED IN STATE ---
    // Configurações no formato Setup: menu lateral por grupo e área de trabalho com a
    // largura toda. A seção vem da URL (?cfg=), então voltar e F5 caem no mesmo lugar.
    const navGroups: Array<{ title: string; items: Array<{ id: SettingsSection; label: string; icon: React.ReactNode; hidden?: boolean }> }> = [
        {
            title: 'Gestão de dados',
            items: [
                { id: 'atualizar', label: 'Atualizar bases', icon: <Wand2 size={16} /> },
                { id: 'historico', label: 'Histórico de atualizações', icon: <History size={16} /> },
                { id: 'arquivos', label: 'Arquivos e versões', icon: <Database size={16} /> },
            ],
        },
        {
            title: 'Operação',
            items: [
                { id: 'metas', label: 'Gestão de metas', icon: <Target size={16} /> },
                { id: 'sfmc', label: 'Packs SFMC', icon: <Package size={16} /> },
            ],
        },
        {
            title: 'Acesso',
            items: [
                { id: 'usuarios', label: 'Usuários', icon: <Users size={16} />, hidden: !isAdmin },
                { id: 'conta', label: 'Minha conta e aparência', icon: <UserCircle size={16} /> },
            ],
        },
    ];
    const query = navQuery.trim().toLowerCase();
    const visibleGroups = navGroups
        .map((group) => ({ ...group, items: group.items.filter((item) => !item.hidden && (!query || item.label.toLowerCase().includes(query))) }))
        .filter((group) => group.items.length > 0);
    const activeSection: SettingsSection = section === 'usuarios' && !isAdmin ? 'atualizar' : section;
    const pageTitles: Partial<Record<SettingsSection, string>> = {
        arquivos: 'Arquivos e versões',
        metas: 'Gestão de metas',
        sfmc: 'Packs SFMC',
        usuarios: 'Usuários',
        conta: 'Minha conta e aparência',
    };

    return (
        <div className="flex min-h-full bg-slate-50 text-slate-800">
            <nav
                aria-label="Configurações"
                className={`sticky top-0 flex max-h-[var(--screen-h)] shrink-0 flex-col self-start border-r border-slate-200 bg-white py-3 transition-[width] ${navCollapsed ? 'w-14 items-center px-2' : 'w-60 px-2.5'}`}
            >
                <div className={`mb-2 flex items-center gap-2 ${navCollapsed ? 'flex-col' : 'px-1'}`}>
                    {!navCollapsed && (
                        <label className="flex h-[30px] min-w-0 flex-1 items-center gap-1.5 rounded-sm border border-slate-300 px-2 text-slate-500">
                            <Search size={14} aria-hidden="true" />
                            <span className="sr-only">Busca rápida nas configurações</span>
                            <input
                                type="search"
                                value={navQuery}
                                onChange={(event) => setNavQuery(event.target.value)}
                                placeholder="Busca rápida"
                                className="min-w-0 flex-1 bg-transparent text-[12.5px] text-slate-800 outline-none"
                            />
                        </label>
                    )}
                    <button
                        type="button"
                        onClick={() => setNavCollapsed((value) => !value)}
                        aria-label={navCollapsed ? 'Abrir menu de configurações' : 'Recolher menu de configurações'}
                        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                    >
                        {navCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                </div>
                <div className="flex flex-col gap-0.5 overflow-y-auto">
                    {visibleGroups.map((group) => (
                        <div key={group.title} className="flex flex-col gap-0.5">
                            {!navCollapsed && (
                                <div className="px-2.5 pb-1 pt-3 text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">{group.title}</div>
                            )}
                            {group.items.map((item) => {
                                const active = activeSection === item.id;
                                return (
                                    // Link de verdade: clique do meio ou Ctrl+clique abre a seção numa aba nova.
                                    <a
                                        key={item.id}
                                        href={settingsSectionHref(item.id)}
                                        onClick={onTabLinkClick(() => setSection(item.id))}
                                        aria-current={active ? 'page' : undefined}
                                        title={navCollapsed ? item.label : undefined}
                                        aria-label={navCollapsed ? item.label : undefined}
                                        className={`flex items-center gap-2 rounded-md text-left text-[13px] transition ${navCollapsed ? 'h-9 w-9 justify-center' : 'px-2.5 py-1.5'} ${active
                                            ? 'bg-cyan-50 font-semibold text-cyan-700'
                                            : 'text-slate-700 hover:bg-slate-100'}`}
                                    >
                                        <span className={active ? 'text-cyan-700' : 'text-slate-500'}>{item.icon}</span>
                                        {!navCollapsed && <span className="truncate">{item.label}</span>}
                                    </a>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </nav>

            <main className="min-w-0 flex-1">
                {(importerVisited || activeSection === 'atualizar') && (
                    <div hidden={activeSection !== 'atualizar'}>
                        <IntelligentFrameworkUpdate
                            onOpenHistory={() => setSection('historico')}
                            onStepChange={(step) => {
                                importerStepRef.current = step;
                                if (activeSection === 'atualizar') setNavCollapsed(step !== 'arquivo');
                            }}
                        />
                    </div>
                )}
                {activeSection === 'historico' && <UpdateHistoryView onStartUpdate={() => setSection('atualizar')} />}
                {activeSection !== 'atualizar' && activeSection !== 'historico' && (
                    <div className="mx-auto max-w-6xl space-y-6 p-6">
                        <SettingsPageHeader title={pageTitles[activeSection] ?? 'Configurações'} />
                        {activeSection === 'sfmc' && <SfmcIngestionHistory />}
                        {activeSection === 'metas' && <GoalsManager />}
                        {activeSection === 'usuarios' && (
                            <div className="rounded-[14px] border border-slate-200 bg-white p-6">
                                <UserManagementPanel />
                            </div>
                        )}
                        {activeSection === 'arquivos' && (
                            <div className="space-y-4">
                                <VersionManager />
                                <FileManager title="Histórico B2C" slot="b2c" accept=".csv" />
                                <FileManager title="Mídia Paga (Ads)" slot="media" accept=".xlsx, .xls" />
                            </div>
                        )}
                        {activeSection === 'conta' && (
                            <div className="grid max-w-3xl gap-4 md:grid-cols-2">
                                <div className="rounded-[14px] border border-slate-200 bg-white p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-700 text-white">
                                            <User size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-[15px] font-bold text-slate-900" title={user.email}>{user.email?.split('@')[0]}</div>
                                            <div className="truncate text-xs text-slate-500">{user.email}</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                                        <span className="font-semibold text-slate-500">ID</span>
                                        <code className="font-mono text-slate-700">{user.id.substring(0, 8)}...</code>
                                    </div>
                                    <button
                                        onClick={signOut}
                                        className="mt-4 flex h-[34px] w-full items-center justify-center gap-2 rounded-sm border border-red-200 bg-white text-[13px] font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        <LogOut size={15} />
                                        Desconectar
                                    </button>
                                </div>
                                <div className="rounded-[14px] border border-slate-200 bg-white p-5">
                                    <div className="text-[10.5px] font-bold uppercase tracking-[0.4px] text-slate-500">Aparência</div>
                                    <div className="mt-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2 opacity-60">
                                        <span className="flex items-center gap-2 text-[13px] text-slate-700"><Moon size={16} /> Modo escuro</span>
                                        <span className="text-xs text-slate-500">em breve</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

