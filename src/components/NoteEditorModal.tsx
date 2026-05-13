import React, { useState, useEffect } from 'react';
import { X, Trash2, Beaker } from 'lucide-react';
import { MultiSelectChips } from './diary/MultiSelectChips';

interface NoteEditorModalProps {
  date: Date | null;
  initialText: string;
  initialBU?: 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';
  initialSegmentos?: string[];
  initialParceiros?: string[];
  initialIsTesteAB?: boolean;
  availableBUs: string[];
  availableSegmentos: string[];
  availableParceiros: string[];
  onSave: (text: string, bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros', segmentos: string[], parceiros: string[], isTesteAB: boolean) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  date,
  initialText,
  initialBU = 'B2C',
  initialSegmentos = [],
  initialParceiros = [],
  initialIsTesteAB = false,
  availableBUs,
  availableSegmentos,
  availableParceiros,
  onSave,
  onDelete,
  onClose,
}) => {
  const [text, setText] = useState(initialText);
  const [bu, setBU] = useState<'B2C' | 'B2B2C' | 'Plurix' | 'Seguros'>(initialBU);
  const [segmentos, setSegmentos] = useState<string[]>(initialSegmentos);
  const [parceiros, setParceiros] = useState<string[]>(initialParceiros);
  const [isTesteAB, setIsTesteAB] = useState(initialIsTesteAB);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setText(initialText);
    setBU(initialBU);
    setSegmentos(initialSegmentos);
    setParceiros(initialParceiros);
    setIsTesteAB(initialIsTesteAB);
    setShowDeleteConfirm(false);
  }, [date, initialText, initialBU, initialSegmentos, initialParceiros, initialIsTesteAB]);

  const handleSave = () => {
    onSave(text, bu, segmentos, parceiros, isTesteAB);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  if (!date) return null;

  const dateStr = date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-800 rounded-lg p-6 w-[480px] max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100">{dateStr}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* BU Selection & A/B Toggle */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-300 mb-2">BU</label>
            <select
              value={bu}
              onChange={(e) => setBU(e.target.value as 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros')}
              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableBUs.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-700 px-3 py-1.5 rounded border border-slate-600 hover:bg-slate-600 transition h-[34px]">
              <input
                type="checkbox"
                checked={isTesteAB}
                onChange={(e) => setIsTesteAB(e.target.checked)}
                className="rounded border-slate-500 text-blue-500 focus:ring-blue-500 bg-slate-800"
              />
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                <Beaker size={14} className={isTesteAB ? 'text-blue-400' : 'text-slate-400'} />
                É Teste A/B?
              </span>
            </label>
          </div>
        </div>

        {/* Textarea */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-2">Anotação Rápida</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua anotação rápida aqui..."
            className="w-full h-32 p-3 bg-slate-700 border border-slate-600 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </div>

        {/* Segmentos & Parceiros */}
        <div className="space-y-4 mb-6">
          <MultiSelectChips
            label="Segmentos"
            options={availableSegmentos}
            selected={segmentos}
            onChange={setSegmentos}
          />
          <MultiSelectChips
            label="Parceiros"
            options={availableParceiros}
            selected={parceiros}
            onChange={setParceiros}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2 justify-end border-t border-slate-700 pt-4">
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-500 hover:bg-red-900/20 rounded transition mr-auto"
              title="Deletar anotação"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition"
          >
            Salvar
          </button>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded animate-in fade-in slide-in-from-top-2">
            <p className="text-sm text-red-300 mb-3">Confirmar exclusão dessa anotação?</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded transition"
              >
                Deletar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
