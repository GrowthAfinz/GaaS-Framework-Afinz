import React from 'react';
import { X, Clock, Download, RotateCcw, Trash2, CheckCircle } from 'lucide-react';
import { FrameworkVersion } from '../types/framework';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VersionHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    versions: FrameworkVersion[];
    currentVersionId: string | null;
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    onExport: (id: string) => void;
    storageUsage: number;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
    isOpen,
    onClose,
    versions,
    currentVersionId,
    onRestore,
    onDelete,
    onExport,
    storageUsage
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
            <div className="w-96 bg-slate-900 border-l border-slate-700 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
                <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Clock className="text-blue-400" size={20} />
                        Histórico de Versões
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 bg-slate-800/50 border-b border-slate-700">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Armazenamento Local</span>
                        <span>{storageUsage.toFixed(2)} MB / ~5 MB</span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full ${storageUsage > 4 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min((storageUsage / 5) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {versions.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            <p>Nenhuma versão salva.</p>
                        </div>
                    ) : (
                        versions.map(version => {
                            const isCurrent = version.id === currentVersionId;
                            return (
                                <div
                                    key={version.id}
                                    className={`border rounded-lg p-4 transition ${isCurrent
                                            ? 'bg-blue-900/20 border-blue-500/50'
                                            : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className={`font-bold ${isCurrent ? 'text-blue-400' : 'text-slate-200'}`}>
                                                {version.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Clock size={12} />
                                                {format(parseISO(version.createdAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                        {isCurrent && (
                                            <span className="bg-blue-900/50 text-blue-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle size={12} /> Atual
                                            </span>
                                        )}
                                    </div>

                                    {version.description && (
                                        <p className="text-sm text-slate-400 mb-3 italic border-l-2 border-slate-700 pl-2">
                                            "{version.description}"
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                                        <span>{version.rowCount} linhas</span>
                                        <span>{version.editCount} edições</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                                        <button
                                            onClick={() => onExport(version.id)}
                                            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 text-xs transition"
                                            title="Baixar CSV"
                                        >
                                            <Download size={14} /> CSV
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {!isCurrent && (
                                                <>
                                                    <button
                                                        onClick={() => onRestore(version.id)}
                                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs transition font-medium"
                                                    >
                                                        <RotateCcw size={14} /> Restaurar
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(version.id)}
                                                        className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs transition"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};
