import React from 'react';
import { X, Trash2, Beaker, Link as LinkIcon, HelpCircle, Clock, CheckCircle, Lightbulb } from 'lucide-react';
import { DiaryEntry } from '../store/diaryStore';

interface AnotacoesViewerProps {
  anotacoes: DiaryEntry[];
  date: Date;
  onClose: () => void;
  onDeleteAnotacao: (id: string) => void;
  onEditAnotacao?: (id: string) => void;
}

const BU_COLORS: { [key: string]: string } = {
  B2C: 'bg-blue-600',
  B2B2C: 'bg-emerald-600',
  Plurix: 'bg-purple-600',
};

const BU_BG_LIGHT: { [key: string]: string } = {
  B2C: 'bg-blue-50 border-blue-200',
  B2B2C: 'bg-emerald-50 border-emerald-200',
  Plurix: 'bg-purple-50 border-purple-200',
};

const STATUS_CONFIG = {
  'hipotese': { label: 'Hipótese', icon: HelpCircle, color: 'text-amber-600 bg-amber-100' },
  'rodando': { label: 'Rodando', icon: Clock, color: 'text-blue-600 bg-blue-100' },
  'concluido': { label: 'Concluído', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
  'aprendizado': { label: 'Aprendizado', icon: Lightbulb, color: 'text-purple-600 bg-purple-100' },
};

export const AnotacoesViewer: React.FC<AnotacoesViewerProps> = ({
  anotacoes,
  date,
  onClose,
  onDeleteAnotacao,
  onEditAnotacao,
}) => {
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
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Anotações do Dia</h3>
            <p className="text-sm text-slate-400">{dateStr}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded transition"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-700 mb-4" />

        {/* Anotações List */}
        {anotacoes.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>Nenhuma anotação para este dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anotacoes.map((anotacao) => (
              <div
                key={anotacao.id}
                className={`p-4 rounded-lg border-2 ${BU_BG_LIGHT[anotacao.bu] || 'bg-slate-700 border-slate-600'}`}
              >
                {/* BU Badge + Delete Button */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-white text-sm font-semibold ${BU_COLORS[anotacao.bu] || 'bg-slate-600'}`}>
                      {anotacao.bu}
                    </span>
                    {anotacao.isTesteAB && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                        <Beaker size={12} />
                        Teste A/B
                      </span>
                    )}
                    {anotacao.isTesteAB && anotacao.statusExperimento && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${STATUS_CONFIG[anotacao.statusExperimento].color}`}>
                        {React.createElement(STATUS_CONFIG[anotacao.statusExperimento].icon, { size: 12 })}
                        {STATUS_CONFIG[anotacao.statusExperimento].label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {onEditAnotacao && (
                      <button
                        onClick={() => onEditAnotacao(anotacao.id)}
                        className="p-1 hover:bg-slate-600 rounded transition text-blue-600 hover:text-blue-500"
                        title="Editar"
                      >
                        <Edit2Icon />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm('Deseja deletar esta anotação?')) {
                          onDeleteAnotacao(anotacao.id);
                        }
                      }}
                      className="p-1 hover:bg-slate-600 rounded transition text-red-600 hover:text-red-500"
                      title="Deletar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Anotação Text */}
                <p className="text-slate-900 text-sm mb-3 whitespace-pre-wrap font-medium">
                  {anotacao.title}
                </p>
                {anotacao.description && (
                  <p className="text-slate-700 text-xs mb-3 whitespace-pre-wrap border-l-2 border-slate-400 pl-2">
                    {anotacao.description}
                  </p>
                )}

                {/* Experimento Details */}
                {anotacao.isTesteAB && (
                  <div className="grid grid-cols-2 gap-4 mt-3 mb-3 bg-white/50 p-3 rounded border border-slate-200">
                    {anotacao.hipotese && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Hipótese</span>
                        <p className="text-xs text-slate-800">{anotacao.hipotese}</p>
                      </div>
                    )}
                    {anotacao.conclusao && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Conclusão</span>
                        <p className="text-xs text-slate-800">{anotacao.conclusao}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-300/50">
                  {anotacao.campanhasRelacionadas && anotacao.campanhasRelacionadas.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-600 mr-2">
                      <LinkIcon size={12} />
                      {anotacao.campanhasRelacionadas.join(', ')}
                    </div>
                  )}
                  {anotacao.segmentos && anotacao.segmentos.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-600">Seg:</span>
                      {anotacao.segmentos.map((seg, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded">
                          {seg}
                        </span>
                      ))}
                    </div>
                  )}
                  {anotacao.parceiros && anotacao.parceiros.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-600">Parc:</span>
                      {anotacao.parceiros.map((parc, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[10px] rounded">
                          {parc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-700 mt-4 mb-4" />

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  );
};

const Edit2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
