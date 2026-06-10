import React, { useState } from 'react';
import { Search, BookOpen, Eye, Award } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Experiment } from '../../types/experiments';

interface Props {
  learnings: Experiment[];
  onSelect: (id: string) => void;
}

export function LearningRepository({ learnings, onSelect }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('Todos');
  const [filterDecision, setFilterDecision] = useState('Todos');

  // Composed filter: search by title, hypothesis, and compound offer+promocional rules
  const filteredLearnings = learnings.filter(exp => {
    const rule = exp.definicao.variante_regra;
    const ruleString = `${rule?.controle_valor || ''} ${rule?.variante_valor || ''}`.toLowerCase();
    const searchMatch = 
      exp.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.hipotese || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.aprendizado || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ruleString.includes(searchTerm.toLowerCase());

    const channelMatch = filterChannel === 'Todos' || exp.definicao.canal === filterChannel;
    
    const decisionMatch = filterDecision === 'Todos' || exp.decisao === filterDecision;

    return searchMatch && channelMatch && decisionMatch;
  });

  // Extract channels for filter options
  const channels = Array.from(new Set(learnings.map(l => l.definicao.canal)));

  return (
    <div className="space-y-4 h-full flex flex-col min-h-0">
      {/* Search & Filter Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, aprendizado ou regra..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 focus:border-cyan-400"
          />
        </div>

        {/* Channel Filter */}
        <div>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 focus:border-cyan-400"
          >
            <option value="Todos">Canais: Todos</option>
            {channels.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Decision Filter */}
        <div>
          <select
            value={filterDecision}
            onChange={(e) => setFilterDecision(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-400/30 focus:border-cyan-400"
          >
            <option value="Todos">Decisão: Todas</option>
            <option value="validado">✓ Validado</option>
            <option value="refutado">✗ Refutado</option>
            <option value="inconclusivo">⚠ Inconclusivo</option>
          </select>
        </div>
      </div>

      {/* Learnings Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {filteredLearnings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
            <BookOpen size={32} className="text-slate-300 mb-3" />
            <p className="text-xs font-semibold">Nenhum aprendizado encontrado.</p>
            <p className="text-[10px] text-slate-400 mt-1">Experimente mudar os termos de busca ou filtros.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLearnings.map(exp => {
              const rule = exp.definicao.variante_regra;
              const hasRule = rule?.controle_valor && rule?.variante_valor;
              
              return (
                <div
                  key={exp.id}
                  onClick={() => onSelect(exp.id)}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer transition flex flex-col gap-3 group relative h-fit"
                >
                  {/* Top meta tags */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        exp.definicao.bu === 'B2C' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        exp.definicao.bu === 'B2B2C' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-purple-50 text-purple-700 border border-purple-100'
                      }`}>
                        {exp.definicao.bu}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                        {exp.definicao.canal}
                      </span>
                    </div>
                    <StatusBadge status="concluido" decisao={exp.decisao} />
                  </div>

                  {/* Title and hypothesis */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors">
                      {exp.titulo}
                    </h4>
                    {exp.hipotese && (
                      <p className="text-[10px] text-slate-400/90 italic font-medium mt-1 line-clamp-1">
                        "{exp.hipotese}"
                      </p>
                    )}
                  </div>

                  {/* Compound rule display */}
                  {hasRule && (
                    <div className="bg-slate-50 p-2 rounded border border-slate-100 text-[10px] font-mono text-slate-600 flex justify-between items-center leading-none">
                      <span>Regra: {rule.campo}</span>
                      <span className="font-bold text-slate-800 text-[9px] bg-slate-200/50 px-1 py-0.5 rounded border border-slate-200/50">
                        C: {rule.controle_valor} vs V: {rule.variante_valor}
                      </span>
                    </div>
                  )}

                  {/* Aprendizado - The core text */}
                  <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100/60 flex-1">
                    <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                      {exp.aprendizado}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[9px] text-slate-400 font-mono">
                    <span className="font-medium">Safra: {exp.definicao.safra_inicio}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={10} />
                        {exp.view_count || 0} views
                      </span>
                      <span>Encerrado: {exp.encerrado_em}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
