import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';
import { useFilters } from '../context/FilterContext';
import { OBJECTIVE_COLORS, getObjectiveColorClasses } from '../types';
import type { PaidMediaObjectiveEntry } from '../types';

// ── Color Picker ──────────────────────────────────────────────────────────────
const ColorPicker: React.FC<{ value: string; onChange: (color: string) => void }> = ({ value, onChange }) => (
    <div className="flex flex-wrap gap-1.5">
        {OBJECTIVE_COLORS.map(c => (
            <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => onChange(c.key)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${c.dot}
                    ${value === c.key
                        ? 'border-slate-700 scale-110 shadow-sm'
                        : 'border-transparent hover:border-slate-300 hover:scale-105'
                    }`}
            />
        ))}
    </div>
);

// ── Inline edit / create row ──────────────────────────────────────────────────
interface EditRowProps {
    initial: PaidMediaObjectiveEntry;
    isNew?: boolean;
    onSave: (entry: PaidMediaObjectiveEntry) => void;
    onCancel: () => void;
    existingKeys: string[];
}

const EditRow: React.FC<EditRowProps> = ({ initial, isNew = false, onSave, onCancel, existingKeys }) => {
    const [key, setKey] = useState(initial.key);
    const [label, setLabel] = useState(initial.label);
    const [color, setColor] = useState(initial.color || 'teal');

    const keySlug = key.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const isDuplicateKey = isNew && existingKeys.includes(keySlug);
    const isValid = keySlug.length > 0 && label.trim().length > 0 && !isDuplicateKey;

    return (
        <tr className="bg-[#00C6CC]/5 border-b border-[#00C6CC]/20">
            {/* Color dot preview */}
            <td className="px-4 py-3 w-10">
                <div className={`w-4 h-4 rounded-full ${getObjectiveColorClasses(color).dot}`} />
            </td>

            {/* Key — only editable when creating */}
            <td className="px-4 py-3 w-36">
                {isNew ? (
                    <div>
                        <input
                            value={key}
                            onChange={e => setKey(e.target.value)}
                            placeholder="ex: conversao"
                            className={`w-full text-xs font-mono border rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#00C6CC] transition-all
                                ${isDuplicateKey ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
                        />
                        {isDuplicateKey && (
                            <p className="text-[10px] text-red-500 mt-0.5">Chave já existe</p>
                        )}
                    </div>
                ) : (
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded select-all">
                        {initial.key}
                    </span>
                )}
            </td>

            {/* Label */}
            <td className="px-4 py-3">
                <input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="Nome do objetivo"
                    className="w-full text-sm border border-slate-200 rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-[#00C6CC] bg-white transition-all"
                    autoFocus={isNew}
                />
            </td>

            {/* Color picker */}
            <td className="px-4 py-3">
                <ColorPicker value={color} onChange={setColor} />
            </td>

            {/* Actions */}
            <td className="px-4 py-3 w-24">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => isValid && onSave({ key: keySlug || initial.key, label: label.trim(), color })}
                        disabled={!isValid}
                        className={`p-1.5 rounded-md transition-colors
                            ${isValid
                                ? 'bg-[#00C6CC] text-white hover:bg-[#00B0B6] shadow-sm'
                                : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        title="Salvar"
                    >
                        <Check size={14} />
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Cancelar"
                    >
                        <X size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

// ── Main ObjectivesManager ────────────────────────────────────────────────────
export const ObjectivesManager: React.FC = () => {
    const { objectives, addObjective, updateObjective, removeObjective } = useFilters();
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const handleDelete = (key: string) => {
        if (deleteConfirm === key) {
            removeObjective(key);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(key);
            setTimeout(() => setDeleteConfirm(prev => prev === key ? null : prev), 3000);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Info */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                    Os objetivos aqui cadastrados aparecem nos filtros do dashboard e no mapeamento de campanhas.
                    A <strong>chave</strong> deve corresponder exatamente ao valor salvo no banco de dados
                    (campo <code className="font-mono bg-amber-100 px-1 rounded">objective</code> da tabela de mapeamentos).
                </p>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3 w-10" />
                            <th className="px-4 py-3 w-36">Chave (slug)</th>
                            <th className="px-4 py-3">Nome / Label</th>
                            <th className="px-4 py-3 w-64">Cor</th>
                            <th className="px-4 py-3 w-28">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">

                        {objectives.map(obj => {
                            /* editing this row */
                            if (editingKey === obj.key) {
                                return (
                                    <EditRow
                                        key={obj.key}
                                        initial={obj}
                                        existingKeys={objectives.map(o => o.key).filter(k => k !== obj.key)}
                                        onSave={updated => {
                                            updateObjective(obj.key, { label: updated.label, color: updated.color });
                                            setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                    />
                                );
                            }

                            const c = getObjectiveColorClasses(obj.color);
                            const isConfirming = deleteConfirm === obj.key;

                            return (
                                <tr key={obj.key} className="hover:bg-slate-50/50 transition-colors group">
                                    {/* Color dot */}
                                    <td className="px-4 py-3">
                                        <div className={`w-3 h-3 rounded-full ${c.dot}`} />
                                    </td>
                                    {/* Key slug */}
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            {obj.key}
                                        </span>
                                    </td>
                                    {/* Label */}
                                    <td className="px-4 py-3 font-medium text-slate-700">{obj.label}</td>
                                    {/* Color preview chip */}
                                    <td className="px-4 py-3">
                                        <span className={`inline-block px-2.5 py-1 rounded-md border text-xs font-medium ${c.chipActive}`}>
                                            {OBJECTIVE_COLORS.find(x => x.key === obj.color)?.label ?? obj.color}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingKey(obj.key); setIsAddingNew(false); setDeleteConfirm(null); }}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={13} />
                                            </button>
                                            <div className="relative">
                                                <button
                                                    onClick={() => handleDelete(obj.key)}
                                                    className={`p-1.5 rounded-md transition-colors
                                                        ${isConfirming
                                                            ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-1 ring-red-200'
                                                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                    title={isConfirming ? 'Clique novamente para confirmar exclusão' : 'Excluir'}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                                {isConfirming && (
                                                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-red-500 font-medium">
                                                        confirmar?
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* New row */}
                        {isAddingNew && (
                            <EditRow
                                initial={{ key: '', label: '', color: 'teal' }}
                                isNew
                                existingKeys={objectives.map(o => o.key)}
                                onSave={entry => { addObjective(entry); setIsAddingNew(false); }}
                                onCancel={() => setIsAddingNew(false)}
                            />
                        )}

                        {objectives.length === 0 && !isAddingNew && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                                    Nenhum objetivo cadastrado. Clique em "Novo Objetivo" abaixo para começar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add button */}
            {!isAddingNew && (
                <button
                    onClick={() => { setIsAddingNew(true); setEditingKey(null); setDeleteConfirm(null); }}
                    className="self-start flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00C6CC] border border-[#00C6CC]/40 bg-[#00C6CC]/5 rounded-lg hover:bg-[#00C6CC]/10 hover:border-[#00C6CC]/60 transition-all"
                >
                    <Plus size={15} />
                    Novo Objetivo
                </button>
            )}
        </div>
    );
};
