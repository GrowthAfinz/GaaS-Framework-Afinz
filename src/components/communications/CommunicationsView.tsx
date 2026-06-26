import React from 'react';
import { Mail, LayoutGrid, BarChart3 } from 'lucide-react';
import { CadastroCobertura } from './CadastroCobertura';
import { TemplatePerformanceGrid } from './TemplatePerformanceGrid';
import { TemplateCatalogView } from './TemplateCatalogView';

interface CommunicationsViewProps {
  mode: 'cadastro' | 'performance';
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({ mode }) => {
  const isPerformance = mode === 'performance';

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            {isPerformance ? <BarChart3 size={20} /> : <Mail size={20} />}
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-tight text-slate-800">
              {isPerformance ? 'Performance do Conteúdo' : 'Cadastro e Templates'}
            </h2>
            <p className="text-sm text-slate-500">
              {isPerformance
                ? 'Análise do resultado por template, peça e activity_name vinculada.'
                : 'Governança de assets, templates e cobertura de réguas CRM.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isPerformance ? (
          <TemplatePerformanceGrid />
        ) : (
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <LayoutGrid size={16} className="text-cyan-600" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Templates e assets</h3>
              </div>
              <TemplateCatalogView />
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2">
                <Mail size={16} className="text-cyan-600" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Cobertura por disparo</h3>
              </div>
              <CadastroCobertura />
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
