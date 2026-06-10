import React, { useState } from 'react';
import { SectionCard } from '../dispatch/blocks/shared';
import { LiftPlot } from './LiftPlot';
import { ConversionSparkline } from './ConversionSparkline';
import { SampleProgressBar } from './SampleProgressBar';
import { SRMAlert } from './SRMAlert';
import type { Experiment, ExperimentStats } from '../../types/experiments';

interface Props {
  experiment: Experiment;
  stats?: ExperimentStats;
  onClose: () => void;
  onDecision: (decisao: 'validado' | 'refutado' | 'inconclusivo', aprendizado: string) => void;
}

function GuardrailsPanel({ stats }: { stats?: ExperimentStats }) {
  if (!stats) return <p className="text-xs text-slate-500 italic">Métricas não disponíveis.</p>;

  const alerts = [];

  if (stats.srm_detectado) {
    alerts.push({
      type: 'error',
      text: 'Sample Ratio Mismatch (SRM) detectado! A integridade do teste está comprometida. Não tome decisões com base nesses dados.'
    });
  }

  if (stats.n_controle < 300 || stats.n_variante < 300) {
    alerts.push({
      type: 'warning',
      text: `Volume de amostra baixo (${Math.min(stats.n_controle, stats.n_variante).toLocaleString('pt-BR')} < 300). Risco elevado de ruído estatístico e falso positivo.`
    });
  }

  if (stats.delta_rel < -0.10 && stats.significativo) {
    alerts.push({
      type: 'error',
      text: `Perda severa: A variante está apresentando uma queda estatisticamente significativa de ${(Math.abs(stats.delta_rel) * 100).toFixed(1)}% na conversão.`
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 flex items-center gap-2">
        <span className="text-emerald-600 text-xs font-bold">✓</span>
        <span className="text-[11px] text-emerald-800 font-medium">Sem violações de guardrails. A qualidade estatística do teste está saudável.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((al, idx) => (
        <div 
          key={idx} 
          className={`p-2.5 rounded-lg border text-[11px] font-medium flex items-start gap-2 ${
            al.type === 'error' 
              ? 'bg-red-50 border-red-100 text-red-800' 
              : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}
        >
          <span className="font-bold text-xs leading-none">{al.type === 'error' ? '✗' : '⚠'}</span>
          <span className="leading-tight">{al.text}</span>
        </div>
      ))}
    </div>
  );
}

export function ExperimentDetailModal({ experiment, stats, onClose, onDecision }: Props) {
  const [aprendizado, setAprendizado] = useState(experiment.aprendizado || '');
  const [errorMsg, setErrorMsg] = useState('');
  
  const canDecide = stats && stats.sample_progress >= 1.0;

  const handleDecisionClick = (decisao: 'validado' | 'refutado' | 'inconclusivo') => {
    if (!aprendizado.trim()) {
      setErrorMsg('O campo aprendizado é obrigatório para concluir o experimento e registrar no repositório de conhecimento.');
      return;
    }
    setErrorMsg('');
    onDecision(decisao, aprendizado);
  };

  const isRunning = experiment.status === 'rodando';
  const isDone = experiment.status === 'concluido';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                experiment.definicao.bu === 'B2C' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                experiment.definicao.bu === 'B2B2C' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                'bg-purple-50 text-purple-700 border border-purple-100'
              }`}>
                {experiment.definicao.bu}
              </span>
              <h2 className="text-sm font-bold text-slate-800">{experiment.titulo}</h2>
            </div>
            {experiment.hipotese && (
              <p className="text-xs text-slate-500 mt-1.5 italic font-medium">"{experiment.hipotese}"</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* SRM Alert */}
          {stats && <SRMAlert nVariante={stats.n_variante} nControle={stats.n_controle} />}

          {/* Section 1: Definition */}
          <SectionCard title="Definição do Experimento" icon={null}>
            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider">Segmento</span>
                <p className="text-slate-800 font-semibold mt-0.5">{experiment.definicao.segmento}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider">Canal</span>
                <p className="text-slate-800 font-semibold mt-0.5">{experiment.definicao.canal}</p>
              </div>
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider">Safra</span>
                <p className="text-slate-800 font-mono mt-0.5">{experiment.definicao.safra_inicio}</p>
              </div>
              <div className="col-span-3 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                <span className="text-slate-400 font-semibold block uppercase text-[9px] tracking-wider mb-1">Regra de Par Composto (Oferta / Promo)</span>
                <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500 font-medium">Controle:</span>
                    <span className="text-slate-900 font-semibold ml-1">
                      {experiment.definicao.variante_regra.controle_valor}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Variante:</span>
                    <span className="text-slate-900 font-semibold ml-1">
                      {experiment.definicao.variante_regra.variante_valor}
                    </span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  Mapeado no campo `{experiment.definicao.variante_regra.campo}` da tabela de atividades.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Metrics */}
          {stats && (isDone || isRunning) && (
            <SectionCard title="Resultados & Significado Estatístico" icon={null}>
              {/* Three numbers always together */}
              <div className="grid grid-cols-3 gap-3 text-center mb-4 pt-1">
                {[
                  { label: 'Controle', value: `${(stats.conv_rate_controle * 100).toFixed(2)}%`, sub: `${stats.conv_controle} / ${stats.n_controle.toLocaleString('pt-BR')}`, cls: 'text-slate-700' },
                  { label: 'Variante', value: `${(stats.conv_rate_variante * 100).toFixed(2)}%`, sub: `${stats.conv_variante} / ${stats.n_variante.toLocaleString('pt-BR')}`, cls: stats.significativo ? (stats.delta_rel > 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold') : 'text-slate-700' },
                  { label: 'Lift Relativo', value: `${stats.delta_rel > 0 ? '+' : ''}${(stats.delta_rel * 100).toFixed(1)}%`, sub: stats.significativo ? 'Significativo ✓' : 'Sem sig. (ruído)', cls: !stats.significativo ? 'text-slate-400' : stats.delta_rel > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">{m.label}</p>
                    <p className={`text-base font-mono ${m.cls}`}>{m.value}</p>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* CI Plot */}
              <div className="mb-6 px-1 pt-1">
                <LiftPlot
                  liftPct={stats.delta_rel * 100}
                  ciLow={stats.ci_low * 100}
                  ciHigh={stats.ci_high * 100}
                  significant={stats.significativo}
                />
              </div>

              {/* Tech details */}
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] mt-2 pt-2 border-t border-slate-100">
                {[
                  { label: 'p-value', value: stats.p_value < 0.001 ? '<0.001' : stats.p_value.toFixed(4) },
                  { label: 'z-score', value: stats.z_score.toFixed(2) },
                  { label: 'SRM p-value', value: stats.srm_p_value < 0.001 ? '<0.001' : stats.srm_p_value.toFixed(4) },
                  { label: 'Amostra Mín.', value: stats.n_min_per_group.toLocaleString('pt-BR') },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50/50 rounded p-1.5 border border-slate-100/50">
                    <p className="text-slate-400 text-[8px] uppercase font-bold">{s.label}</p>
                    <p className="text-slate-700 font-mono font-medium mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Section 3: Sample Progress */}
          {stats && isRunning && (
            <SectionCard title="Progresso da Coleta" icon={null}>
              <SampleProgressBar
                nAtual={Math.min(stats.n_variante, stats.n_controle)}
                nNecessario={stats.n_min_per_group}
              />
              
              {/* Daily trend line chart */}
              {(experiment as any).sparklineData && (experiment as any).sparklineData.length > 0 && (
                <div className="mt-4">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Linha de Tendência de Conversão (Tracejado = Controle)</p>
                  <div className="bg-slate-50 p-2 rounded border border-slate-100">
                    <ConversionSparkline data={(experiment as any).sparklineData} height={60} showTooltip />
                  </div>
                </div>
              )}
            </SectionCard>
          )}

          {/* Section 4: Guardrails */}
          {stats && (
            <SectionCard title="Guardrails Operacionais" icon={null}>
              <GuardrailsPanel stats={stats} />
            </SectionCard>
          )}

          {/* Section 5: Learnings and Decision */}
          {isRunning && (
            <SectionCard title="Conclusão do Teste" icon={null}>
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Aprendizado de Negócio <span className="text-blue-500">*</span>
                  </label>
                  <textarea
                    value={aprendizado}
                    onChange={(e) => setAprendizado(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-cyan-400/30 focus:border-cyan-400 focus:outline-none resize-none"
                    rows={3}
                    placeholder="O que aprendemos com este experimento? Explique o impacto e as próximas ações. Resultados negativos são valiosos para evitar erros repetidos."
                  />
                  {errorMsg && <p className="text-[10px] font-medium text-red-600 mt-1">{errorMsg}</p>}
                </div>

                {/* Decision Buttons (Locked if sample size is not met) */}
                <div className="flex gap-2">
                  {(['validado', 'refutado', 'inconclusivo'] as const).map(d => (
                    <button
                      key={d}
                      disabled={!canDecide}
                      onClick={() => handleDecisionClick(d)}
                      title={!canDecide ? 'Coleta em andamento. Aguarde atingir a amostra mínima para evitar conclusões precipitadas.' : ''}
                      className={[
                        'flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all border shadow-sm',
                        canDecide
                          ? d === 'validado' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-700 text-white hover:shadow'
                            : d === 'refutado' ? 'bg-red-600 hover:bg-red-500 border-red-700 text-white hover:shadow'
                            : 'bg-slate-600 hover:bg-slate-500 border-slate-700 text-white hover:shadow'
                          : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed shadow-none',
                      ].join(' ')}
                    >
                      {d === 'validado' ? '✓ Validado' : d === 'refutado' ? '✗ Refutado' : '⚠ Inconclusivo'}
                    </button>
                  ))}
                </div>
                
                {!canDecide && (
                  <p className="text-[9px] text-amber-600 font-medium text-center">
                    ⚠ Os botões de encerramento estão travados porque a amostra mínima ainda não foi coletada (falsa significância provisória).
                  </p>
                )}
              </div>
            </SectionCard>
          )}

          {/* Readonly Aprendizado for concluded tests */}
          {isDone && (
            <SectionCard title="Conclusão Registrada" icon={null}>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 pt-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold uppercase ${
                    experiment.decisao === 'validado' ? 'text-emerald-600' :
                    experiment.decisao === 'refutado' ? 'text-red-600' :
                    'text-amber-600'
                  }`}>
                    {experiment.decisao === 'validado' ? '✓ Hipótese Validada' :
                     experiment.decisao === 'refutado' ? '✗ Hipótese Refutada' :
                     '⚠ Inconclusivo'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    Encerrado em: {experiment.encerrado_em}
                  </span>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {experiment.aprendizado || 'Nenhum aprendizado documentado.'}
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
