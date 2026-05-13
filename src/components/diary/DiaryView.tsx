import React, { useState } from 'react';
import { Download, Upload, Edit2, Trash2, Plus, Beaker, Link as LinkIcon, CheckCircle, Clock, Lightbulb, HelpCircle } from 'lucide-react';
import { useDiaryStore, DiaryEntry } from '../../store/diaryStore';
import { useFrameworkOptions } from '../../hooks/useFrameworkOptions';
import { MultiSelectChips } from './MultiSelectChips';
import { useAppStore } from '../../store/useAppStore';

const BU_COLORS: { [key: string]: string } = {
    'B2C': 'bg-blue-500/20 text-blue-100 border-blue-500/50',
    'B2B2C': 'bg-emerald-500/20 text-emerald-100 border-emerald-500/50',
    'Plurix': 'bg-purple-500/20 text-purple-100 border-purple-500/50',
    'Seguros': 'bg-orange-500/20 text-orange-100 border-orange-500/50',
};

const BU_BADGE: { [key: string]: string } = {
    'B2C': 'bg-blue-600 text-blue-50',
    'B2B2C': 'bg-emerald-600 text-emerald-50',
    'Plurix': 'bg-purple-600 text-purple-50',
    'Seguros': 'bg-orange-600 text-orange-50',
};

const STATUS_CONFIG = {
    'hipotese': { label: 'Hipótese', icon: HelpCircle, color: 'text-amber-600 bg-amber-50' },
    'rodando': { label: 'Rodando', icon: Clock, color: 'text-blue-600 bg-blue-50' },
    'concluido': { label: 'Concluído', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    'aprendizado': { label: 'Aprendizado', icon: Lightbulb, color: 'text-purple-600 bg-purple-50' },
};

const INITIAL_FORM: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'> = {
    date: new Date().toISOString().split('T')[0],
    bu: 'B2C',
    title: '',
    description: '',
    segmentos: [],
    parceiros: [],
    canais: [],
    campanhasRelacionadas: [],
    isTesteAB: false,
    statusExperimento: 'hipotese',
    hipotese: '',
    conclusao: ''
};


export const DiaryView: React.FC = () => {
    const { entries, addEntry, updateEntry, deleteEntry, clearEntries, importEntries } = useDiaryStore();
    const { segmentos: availableSegmentos, parceiros: availableParceiros } = useFrameworkOptions();
    const { viewSettings } = useAppStore();
    const filters = viewSettings.filtrosGlobais;

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            showToast('Anotação não pode estar vazia', 'error');
            return;
        }

        addEntry(formData);
        setFormData(INITIAL_FORM);
        showToast('Anotação adicionada com sucesso', 'success');
    };

    const handleStartEdit = (entry: DiaryEntry) => {
        setEditingId(entry.id);
        setFormData({
            date: entry.date,
            bu: entry.bu,
            title: entry.title,
            description: entry.description || '',
            segmentos: entry.segmentos,
            parceiros: entry.parceiros,
            canais: entry.canais || [],
            campanhasRelacionadas: entry.campanhasRelacionadas || [],
            isTesteAB: entry.isTesteAB,
            statusExperimento: entry.statusExperimento || 'hipotese',
            hipotese: entry.hipotese || '',
            conclusao: entry.conclusao || ''
        });
    };

    const handleSaveEdit = () => {
        if (!editingId) return;
        if (!formData.title.trim()) {
            showToast('Anotação não pode estar vazia', 'error');
            return;
        }

        updateEntry(editingId, formData);
        setEditingId(null);
        setFormData(INITIAL_FORM);
        showToast('Anotação atualizada com sucesso', 'success');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData(INITIAL_FORM);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza? Esta ação é irreversível')) {
            deleteEntry(id);
            showToast('Anotação removida', 'success');
        }
    };

    const handleDeleteAll = () => {
        if (window.confirm('Tem certeza que deseja apagar TODAS as anotações? Esta ação é irreversível')) {
            clearEntries();
            showToast('Todas as anotações foram removidas', 'success');
        }
    };

    const handleExportCSV = () => {
        const headers = ['Data', 'BU', 'Título', 'Descrição', 'Segmentos', 'Parceiros', 'Teste AB', 'Status', 'Hipótese', 'Conclusão'];
        const rows = entries.map(entry => [
            entry.date,
            entry.bu,
            `"${entry.title.replace(/"/g, '""')}"`,
            `"${(entry.description || '').replace(/"/g, '""')}"`,
            entry.segmentos.join('; '),
            entry.parceiros.join('; '),
            entry.isTesteAB ? 'Sim' : 'Não',
            entry.statusExperimento || '',
            `"${(entry.hipotese || '').replace(/"/g, '""')}"`,
            `"${(entry.conclusao || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const now = new Date();
        const timestamp = now.toISOString().split('T')[0];
        link.href = url;
        link.download = `diario_bordo_${timestamp}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Diário exportado como CSV com sucesso', 'success');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                if (file.name.endsWith('.csv')) {
                    showToast('Importação de CSV ainda não suportada completamente. Use JSON.', 'info');
                } else {
                    const parsed = JSON.parse(content);
                    // Simple validation/migration could go here
                    const newEntries = Array.isArray(parsed) ? parsed : (parsed.entries || parsed.anotacoes || []);

                    // Map old format to new if needed
                    const mappedEntries = newEntries.map((e: any) => ({
                        id: e.id || crypto.randomUUID(),
                        createdAt: e.createdAt || e.criadoEm || new Date().toISOString(),
                        updatedAt: e.updatedAt || e.atualizadoEm || new Date().toISOString(),
                        date: e.date || e.data,
                        bu: e.bu,
                        title: e.title || e.anotacao,
                        description: e.description || '',
                        segmentos: e.segmentos || [],
                        parceiros: e.parceiros || [],
                        canais: e.canais || [],
                        campanhasRelacionadas: e.campanhasRelacionadas || [],
                        isTesteAB: e.isTesteAB || e.testeAB || false,
                        statusExperimento: e.statusExperimento,
                        hipotese: e.hipotese,
                        conclusao: e.conclusao
                    })).filter((e: any) => e.date && e.title);

                    importEntries(mappedEntries);
                    showToast(`${mappedEntries.length} anotações importadas com sucesso`, 'success');
                }
            } catch (error) {
                showToast('Erro ao importar arquivo', 'error');
            }
        };
        reader.readAsText(file);
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Filter entries based on global filters
    const filteredEntries = entries.filter(entry => {
        // BU Filter
        if (filters.bu.length > 0 && !filters.bu.includes(entry.bu)) {
            return false;
        }

        // Segmentos Filter (Tags)
        if (filters.segmentos.length > 0) {
            const hasSegment = entry.segmentos.some(seg => filters.segmentos.includes(seg));
            if (!hasSegment) return false;
        }

        // Parceiros Filter (Tags)
        if (filters.parceiros.length > 0) {
            const hasPartner = entry.parceiros.some(parc => filters.parceiros.includes(parc));
            if (!hasPartner) return false;
        }

        return true;
    });

    // Sort entries by date desc
    const sortedEntries = [...filteredEntries].sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-white p-4 gap-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    📔 Diário de Bordo
                </h2>
                <div className="flex gap-2">
                    <label className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-600 text-emerald-50 rounded text-xs font-medium cursor-pointer transition">
                        <Upload size={14} />
                        Importar JSON
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600/80 hover:bg-orange-600 text-orange-50 rounded text-xs font-medium transition"
                        title="Exportar como CSV"
                    >
                        <Download size={14} />
                        Exportar
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-red-50 rounded text-xs font-medium transition"
                        title="Apagar todas as anotações"
                    >
                        <Trash2 size={14} />
                        Apagar Tudo
                    </button>
                </div>
            </div>

            {/* Form Nova/Edit Anotação */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 shrink-0 overflow-y-auto max-h-[400px]">
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Data</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">BU</label>
                            <select
                                value={formData.bu}
                                onChange={(e) => setFormData({ ...formData, bu: e.target.value as any })}
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            >
                                <option value="B2C">B2C</option>
                                <option value="B2B2C">B2B2C</option>
                                <option value="Plurix">Plurix</option>
                                <option value="Seguros">Seguros</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded border border-slate-300 w-full hover:bg-slate-50 transition">
                                <input
                                    type="checkbox"
                                    checked={formData.isTesteAB}
                                    onChange={(e) => setFormData({ ...formData, isTesteAB: e.target.checked })}
                                    className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 bg-white"
                                />
                                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                                    <Beaker size={14} className={formData.isTesteAB ? 'text-blue-600' : 'text-slate-500'} />
                                    É Teste A/B?
                                </span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Anotação Principal</label>
                        <textarea
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Descreva o evento ou observação..."
                            className="w-full px-2 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                            style={{ minHeight: '60px' }}
                        />
                    </div>

                    {formData.isTesteAB && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-blue-700 mb-1">Status do Experimento</label>
                                    <select
                                        value={formData.statusExperimento}
                                        onChange={(e) => setFormData({ ...formData, statusExperimento: e.target.value as any })}
                                        className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="hipotese">🧪 Hipótese</option>
                                        <option value="rodando">⏳ Rodando</option>
                                        <option value="concluido">✅ Concluído</option>
                                        <option value="aprendizado">💡 Aprendizado</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-blue-700 mb-1">Campanhas Relacionadas</label>
                                    <input
                                        type="text"
                                        value={formData.campanhasRelacionadas?.join(', ')}
                                        onChange={(e) => setFormData({ ...formData, campanhasRelacionadas: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                        placeholder="Ex: Campanha X, Campanha Y"
                                        className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-blue-700 mb-1">Hipótese</label>
                                    <textarea
                                        value={formData.hipotese}
                                        onChange={(e) => setFormData({ ...formData, hipotese: e.target.value })}
                                        placeholder="O que esperamos que aconteça?"
                                        className="w-full px-2 py-2 bg-white border border-blue-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-blue-700 mb-1">Conclusão / Resultados</label>
                                    <textarea
                                        value={formData.conclusao}
                                        onChange={(e) => setFormData({ ...formData, conclusao: e.target.value })}
                                        placeholder="O que aprendemos?"
                                        className="w-full px-2 py-2 bg-white border border-blue-200 rounded text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none h-20"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <MultiSelectChips
                            label="Segmentos"
                            options={availableSegmentos}
                            selected={formData.segmentos}
                            onChange={(selected) => setFormData({ ...formData, segmentos: selected })}
                        />
                        <MultiSelectChips
                            label="Parceiros"
                            options={availableParceiros}
                            selected={formData.parceiros}
                            onChange={(selected) => setFormData({ ...formData, parceiros: selected })}
                        />
                    </div>

                    <div className="flex justify-end pt-2 gap-2">
                        {editingId && (
                            <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-slate-50 rounded text-sm font-semibold transition"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={editingId ? handleSaveEdit : handleAdd}
                            className={`px-6 py-2 rounded text-sm font-semibold transition flex items-center justify-center gap-2 shadow-lg ${editingId
                                ? 'bg-green-600 hover:bg-green-700 text-green-50 shadow-green-900/20'
                                : 'bg-blue-600 hover:bg-blue-700 text-blue-50 shadow-blue-900/20'
                                }`}
                        >
                            {editingId ? <CheckCircle size={16} /> : <Plus size={16} />}
                            {editingId ? 'Salvar Alterações' : 'Adicionar Registro'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Anotações */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2">
                {sortedEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                        <p className="text-xs">📝 Nenhuma anotação ainda</p>
                        <p className="text-xs italic mt-1">Comece adicionando uma acima</p>
                    </div>
                ) : (
                    sortedEntries.map((entry) => (
                        <div key={entry.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden transition hover:shadow-md relative group">
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold text-slate-900">{formatDate(entry.date)}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${BU_BADGE[entry.bu]}`}>
                                            {entry.bu}
                                        </span>
                                        {entry.isTesteAB && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                <Beaker size={12} />
                                                Teste A/B
                                            </span>
                                        )}
                                        {entry.isTesteAB && entry.statusExperimento && (
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-slate-200 ${STATUS_CONFIG[entry.statusExperimento].color}`}>
                                                {React.createElement(STATUS_CONFIG[entry.statusExperimento].icon, { size: 12 })}
                                                {STATUS_CONFIG[entry.statusExperimento].label}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleStartEdit(entry)}
                                            className="p-1.5 hover:bg-slate-100 rounded transition text-slate-500 hover:text-slate-900"
                                            title="Editar"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-1.5 hover:bg-red-50 rounded transition text-slate-500 hover:text-red-600"
                                            title="Deletar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-900 mb-3">{entry.title}</p>
                                {entry.description && (
                                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-500 mb-3 border-l-2 border-slate-300 pl-2">{entry.description}</p>
                                )}

                                {entry.isTesteAB && (
                                    <div className="grid grid-cols-2 gap-4 mt-3 mb-3 bg-slate-50 p-3 rounded border border-slate-200">
                                        {entry.hipotese && (
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Hipótese</span>
                                                <p className="text-xs text-slate-700">{entry.hipotese}</p>
                                            </div>
                                        )}
                                        {entry.conclusao && (
                                            <div>
                                                <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Conclusão</span>
                                                <p className="text-xs text-slate-700">{entry.conclusao}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                                    {entry.campanhasRelacionadas && entry.campanhasRelacionadas.length > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-slate-500 mr-2">
                                            <LinkIcon size={12} />
                                            {entry.campanhasRelacionadas.join(', ')}
                                        </div>
                                    )}
                                    {entry.segmentos && entry.segmentos.length > 0 && (
                                        <span className="text-xs text-slate-500">🏷️ {entry.segmentos.join(', ')}</span>
                                    )}
                                    {entry.parceiros && entry.parceiros.length > 0 && (
                                        <span className="text-xs text-slate-500">🤝 {entry.parceiros.join(', ')}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-4 right-4 px-4 py-2 rounded text-xs font-medium transition-all shadow-lg z-50 ${toast.type === 'success'
                        ? 'bg-emerald-600 text-emerald-50'
                        : toast.type === 'error'
                            ? 'bg-red-600 text-red-50'
                            : 'bg-blue-600 text-blue-50'
                        }`}
                >
                    {toast.message}
                </div>
            )}
        </div>
    );
};
