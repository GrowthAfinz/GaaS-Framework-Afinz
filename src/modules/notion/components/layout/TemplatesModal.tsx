import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Briefcase,
  CheckSquare,
  Calendar,
  Layers,
  GraduationCap,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { Block, NotionDatabase, NotionPage } from '../../types/notion';
import { generateId } from '../../utils/id';
import { GAAS_TEMPLATES, GAAS_TEMPLATE_CATEGORIES } from '../../gaas/templates';

export interface TemplateDefinition {
  id: string;
  name: string;
  category: 'SDD' | 'Testes' | 'Operação';
  icon: string;
  cover: string;
  description: string;
  tags: string[];
  createData: () => {
    pageTitle: string;
    icon: string;
    cover: string;
    blocks: Block[];
    database?: NotionDatabase;
  };
}

// Catálogo trocado pelos modelos do GaaS (os exemplos originais do notion-clone ficaram fora).
export const TEMPLATES_CATALOG: TemplateDefinition[] = GAAS_TEMPLATES;

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: TemplateDefinition) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(TEMPLATES_CATALOG[0]);

  if (!isOpen) return null;

  const categories = GAAS_TEMPLATE_CATEGORIES;

  const filtered = TEMPLATES_CATALOG.filter(
    (t) => selectedCategory === 'Todos' || t.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-100 p-4">
      <div className="flex flex-col h-[600px] w-full max-w-4xl rounded-2xl border border-[var(--notion-border)] bg-[var(--notion-card)] shadow-2xl overflow-hidden text-[var(--notion-text)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--notion-border)]">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-blue-500" />
            <h3 className="text-base font-bold tracking-tight">Galeria de modelos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--notion-text-muted)] hover:bg-[var(--notion-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-6 py-2.5 border-b border-[var(--notion-border)] bg-[var(--notion-hover)]/30 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-[var(--notion-text-muted)] hover:text-[var(--notion-text)] hover:bg-[var(--notion-hover)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Body: Left side template cards, Right side preview */}
        <div className="flex flex-1 min-h-0 divide-x divide-[var(--notion-border)]">
          {/* Left: Template Cards */}
          <div className="w-80 overflow-y-auto p-3 space-y-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t)}
                className={`flex items-start gap-3 w-full p-3 rounded-xl text-left border transition-all ${
                  selectedTemplate.id === t.id
                    ? 'border-blue-500 bg-blue-500/5 shadow-xs'
                    : 'border-[var(--notion-border)] hover:bg-[var(--notion-hover)]'
                }`}
              >
                <span className="text-2xl shrink-0 p-1 bg-[var(--notion-hover)] rounded-lg">
                  {t.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--notion-text)] truncate">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-[var(--notion-text-muted)] line-clamp-2 mt-0.5">
                    {t.description}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Template Preview & Action */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[var(--notion-bg)] p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--notion-border)]">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTemplate.icon}</span>
                <div>
                  <h4 className="text-lg font-bold text-[var(--notion-text)]">
                    {selectedTemplate.name}
                  </h4>
                  <div className="flex gap-1.5 mt-1">
                    {selectedTemplate.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--notion-hover)] text-[var(--notion-text-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyTemplate(selectedTemplate);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
              >
                <span>Usar este modelo</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Template Preview Card */}
            <div className="rounded-xl border border-[var(--notion-border)] overflow-hidden shadow-xs flex-1 flex flex-col bg-[var(--notion-card)]">
              <div className="h-36 overflow-hidden relative">
                <img
                  src={selectedTemplate.cover}
                  alt={selectedTemplate.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-[var(--notion-text-muted)] leading-relaxed">
                  {selectedTemplate.description}
                </p>
                <div className="p-3 rounded-lg bg-[var(--notion-hover)]/50 border border-[var(--notion-border)] text-xs text-[var(--notion-text)] space-y-1">
                  <div className="font-semibold text-blue-500">O que vem neste modelo:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[var(--notion-text-muted)]">
                    {selectedTemplate.createData().blocks.filter((b) => b.type.startsWith('heading')).map((b) => (
                      <li key={b.id}>{b.content}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
