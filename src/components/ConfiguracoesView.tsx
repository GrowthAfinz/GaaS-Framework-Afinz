import React, { useState, useEffect } from 'react';
import { User, Moon, LogOut, Mail, Loader2, UploadCloud, FileText, Download, Trash2, RefreshCw, CheckCircle, Database, AlertCircle, ArrowRight, ShieldCheck, Users } from 'lucide-react';
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
            const data = await processCSV(file);
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
                // Continue anyway — DB sync is the priority
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
                // PERSISTENCE FIX: Save to Supabase
                await dataService.upsertB2CMetrics(data);
                // Update Store
                setB2CData(data);
            } else if (slot === 'media') {
                const data = await parseXLSX(file);
                // PERSISTENCE FIX: Save to Supabase
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

export const ConfiguracoesView: React.FC = () => {
    const { user, signInWithEmail, signOut, loading } = useAuth();
    const { isAdmin } = useUserRole();
    const [emailInput, setEmailInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'goals' | 'database' | 'users'>('goals');

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
    return (
        <div className="min-h-full bg-slate-50 text-slate-800 p-8 space-y-8 animate-fade-in pb-24">
            <div className="max-w-5xl mx-auto space-y-8">

                <div className="flex justify-between items-end border-b border-slate-200 pb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Configurações</h2>
                        <p className="text-slate-500 text-lg">Central de controle e sincronização.</p>
                    </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile & Settings */}
                    <div className="space-y-6">
                        {/* Profile Section */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                    <User size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 truncate" title={user.email}>{user.email?.split('@')[0]}</h3>
                                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center group">
                                    <span className="text-xs font-bold text-slate-500 uppercase">ID</span>
                                    <code className="text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded group-hover:text-slate-900 transition-colors">
                                        {user.id.substring(0, 8)}...
                                    </code>
                                </div>
                            </div>

                            <button
                                onClick={signOut}
                                className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-white hover:bg-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl transition-all text-sm font-bold"
                            >
                                <LogOut size={16} />
                                Desconectar
                            </button>
                        </div>

                        {/* Visual Settings */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl opacity-60 pointer-events-none">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Aparência</h3>
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                                        <Moon size={18} />
                                    </div>
                                    <span className="text-slate-700 font-medium text-sm">Modo Escuro</span>
                                </div>
                                <div className="w-10 h-5 bg-blue-600 rounded-full relative">
                                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content Area (Spans 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tabs Navigation */}
                        <div className="flex items-center gap-2 border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('goals')}
                                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'goals'
                                    ? 'border-blue-500 text-blue-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Gestão de Metas
                            </button>
                            <button
                                onClick={() => setActiveTab('database')}
                                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'database'
                                    ? 'border-blue-500 text-blue-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                Gestão de Banco de Dados
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'users'
                                        ? 'border-blue-500 text-blue-500'
                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    <Users size={16} />
                                    Gerenciar Usuários
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="animate-fade-in">
                            {activeTab === 'goals' && (
                                <GoalsManager />
                            )}

                            {activeTab === 'users' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
                                    <UserManagementPanel />
                                </div>
                            )}

                            {activeTab === 'database' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative overflow-hidden">
                                    {/* Background subtle effect */}
                                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500 shadow-inner">
                                                <Database size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900">Banco de Dados & Arquivos</h3>
                                                <p className="text-sm text-slate-500">Importação e sincronização das tabelas do sistema.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 relative z-10">
                                        <VersionManager />
                                        <FileManager
                                            title="Histórico B2C"
                                            slot="b2c"
                                            accept=".csv"
                                        />
                                        <FileManager
                                            title="Mídia Paga (Ads)"
                                            slot="media"
                                            accept=".xlsx, .xls"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

