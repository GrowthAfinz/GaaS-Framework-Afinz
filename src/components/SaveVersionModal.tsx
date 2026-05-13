import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface SaveVersionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
    pendingEditsCount: number;
}

export const SaveVersionModal: React.FC<SaveVersionModalProps> = ({
    isOpen,
    onClose,
    onSave,
    pendingEditsCount
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name, description);
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Save className="text-emerald-400" size={20} />
                        Salvar Nova Versão
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-slate-900/50 p-3 rounded border border-slate-700 text-sm text-slate-300">
                        Esta versão incluirá <strong>{pendingEditsCount} alterações</strong> pendentes.
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Nome da Versão</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Ajuste de Metas Nov"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-400 mb-1 uppercase font-bold">Descrição (Opcional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="O que mudou nesta versão?"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium transition"
                        >
                            Salvar Versão
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
