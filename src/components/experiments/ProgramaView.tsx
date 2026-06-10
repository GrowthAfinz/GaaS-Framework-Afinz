import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Calendar, RefreshCw, BarChart2 } from 'lucide-react';
import type { Experiment } from '../../types/experiments';

interface BattingAveragePoint {
  canal: string;
  total_experimentos: number;
  vencedores: number;
  win_rate_pct: number;
}

const CANAL_COLORS_HEX: Record<string, string> = {
  'E-mail':   '#3b82f6',  // blue-500
  'SMS':      '#f59e0b',  // amber-500
  'WhatsApp': '#10b981',  // emerald-500
  'Push':     '#a855f7',  // purple-500
};

interface Props {
  experiments: Experiment[];
}

export function ProgramaView({ experiments }: Props) {
  const [battingData, setBattingData] = useState<BattingAveragePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBattingAverage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_experiment_batting_average')
        .select('*');
      
      if (!error && data) {
        setBattingData(data as BattingAveragePoint[]);
      }
    } catch (err) {
      console.error('Error fetching batting average:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBattingAverage();
  }, [experiments]);

  // Aggregate program-level statistics
  const total = experiments.length;
  const running = experiments.filter(e => e.status === 'rodando').length;
  const concluded = experiments.filter(e => e.status === 'concluido').length;
  const winners = experiments.filter(e => e.status === 'concluido' && e.decisao === 'validado').length;
  
  const globalWinRate = concluded > 0 ? (winners / concluded) * 100 : 0;

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-1 pb-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Criados', value: total, sub: 'Backlog + Ativos', color: 'border-l-blue-500' },
          { label: 'Rodando Agora', value: running, sub: 'Coletando dados', color: 'border-l-amber-500' },
          { label: 'Testes Concluídos', value: concluded, sub: 'Encerrados no total', color: 'border-l-purple-500' },
          { label: 'Batting Average Global', value: `${globalWinRate.toFixed(1)}%`, sub: `${winners} validados de ${concluded}`, color: 'border-l-emerald-500' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white p-3.5 rounded-xl border border-slate-200 border-l-4 ${kpi.color} shadow-sm`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{kpi.label}</span>
            <p className="text-xl font-mono font-bold text-slate-800 mt-1">{kpi.value}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batting Average Chart */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[280px]">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 size={16} className="text-slate-500" />
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Win Rate por Canal (Batting Average)</h3>
            </div>
            <button 
              onClick={fetchBattingAverage} 
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              title="Atualizar dados"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {battingData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
                Nenhum dado concluído para o gráfico. Conclua testes com a decisão "Validado" para ver os resultados.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={battingData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 100]} 
                    tickFormatter={v => `${v}%`}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    type="category" 
                    dataKey="canal"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} 
                    width={70} 
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, 'Taxa de Vitória']}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0', 
                      color: '#334155', 
                      fontSize: 11,
                      borderRadius: '6px'
                    }}
                  />
                  <Bar dataKey="win_rate_pct" radius={[0, 4, 4, 0]} barSize={16}>
                    {battingData.map((entry, i) => (
                      <Cell key={i} fill={CANAL_COLORS_HEX[entry.canal] ?? '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Timeline of Experiments */}
        <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[280px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Calendar size={16} className="text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Histórico Cronológico do Programa</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {experiments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
                Nenhum experimento cadastrado.
              </div>
            ) : (
              <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
                {experiments.map(exp => {
                  const isDone = exp.status === 'concluido';
                  const isRunning = exp.status === 'rodando';
                  
                  return (
                    <div key={exp.id} className="relative group">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[21px] top-1.5 flex h-2.5 w-2.5 rounded-full border-2 border-white shadow ${
                        isDone 
                          ? exp.decisao === 'validado' ? 'bg-emerald-500' 
                            : exp.decisao === 'refutado' ? 'bg-red-500' 
                            : 'bg-amber-500'
                          : isRunning ? 'bg-blue-500' : 'bg-slate-400'
                      }`} />
                      
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 font-mono font-medium">
                          {exp.iniciado_em || exp.created_at?.slice(0, 10) || 'Sem data'}
                        </span>
                        <h4 className="font-bold text-slate-700 mt-0.5 leading-snug group-hover:text-blue-600 transition-colors">
                          {exp.titulo}
                        </h4>
                        <div className="flex gap-2 mt-1 text-[9px] text-slate-400 font-medium">
                          <span>BU: {exp.definicao.bu}</span>
                          <span>•</span>
                          <span>Canal: {exp.definicao.canal}</span>
                          <span>•</span>
                          <span className={`font-semibold capitalize ${
                            isDone 
                              ? exp.decisao === 'validado' ? 'text-emerald-600'
                                : exp.decisao === 'refutado' ? 'text-red-600'
                                : 'text-amber-600'
                              : isRunning ? 'text-blue-600' : 'text-slate-500'
                          }`}>
                            {isDone ? `Concluído (${exp.decisao})` : isRunning ? 'Em andamento' : 'Backlog'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
