import React, { useState } from 'react';
import { Mail, LayoutList, BarChart3, LayoutGrid, type LucideIcon } from 'lucide-react';
import { CadastroCobertura } from './CadastroCobertura';
import { TemplatePerformanceGrid } from './TemplatePerformanceGrid';
import { TemplateCatalogView } from './TemplateCatalogView';

type CommunicationsSubTab = 'cadastro_templates' | 'performance';
type CadastroMode = 'templates' | 'cobertura';

const SUB_TABS: { id: CommunicationsSubTab; label: string; description: string; icon: LucideIcon }[] = [
  {
    id: 'cadastro_templates',
    label: 'Cadastro e Templates',
    description: 'Governanca de assets, cobertura e vinculo com activity_names',
    icon: LayoutGrid,
  },
  {
    id: 'performance',
    label: 'Performance do Conteudo',
    description: 'Analise do resultado por template, peca e execucao CRM',
    icon: BarChart3,
  },
];

export const CommunicationsView: React.FC = () => {
  const [subTab, setSubTab] = useState<CommunicationsSubTab>('cadastro_templates');
  const [cadastroMode, setCadastroMode] = useState<CadastroMode>('templates');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight text-slate-800">Comunicações</h2>
            <p className="text-sm text-slate-500">Templates, previews, cobertura e performance de réguas CRM</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={[
                  'group flex min-w-[220px] items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors',
                  isActive
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50',
                ].join(' ')}
              >
                <Icon size={17} className={isActive ? 'text-white' : 'text-cyan-600'} />
                <span>
                  <span className="block font-semibold">{tab.label}</span>
                  <span className={['block text-xs font-normal', isActive ? 'text-cyan-50' : 'text-slate-400'].join(' ')}>
                    {tab.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {subTab === 'cadastro_templates' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Operação de cadastro</p>
                <p className="text-xs text-slate-400">Alterne entre backlog de templates e auditoria de cobertura por disparo.</p>
              </div>
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setCadastroMode('templates')}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold',
                    cadastroMode === 'templates' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700',
                  ].join(' ')}
                >
                  <LayoutGrid size={14} /> Templates
                </button>
                <button
                  type="button"
                  onClick={() => setCadastroMode('cobertura')}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold',
                    cadastroMode === 'cobertura' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-700',
                  ].join(' ')}
                >
                  <LayoutList size={14} /> Cobertura
                </button>
              </div>
            </div>
            {cadastroMode === 'templates' ? <TemplateCatalogView /> : <CadastroCobertura />}
          </div>
        )}

        {subTab === 'performance' && <TemplatePerformanceGrid />}
      </div>
    </div>
  );
};
