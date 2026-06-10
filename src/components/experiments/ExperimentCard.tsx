import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ConversionSparkline } from './ConversionSparkline';
import { SampleProgressBar } from './SampleProgressBar';
import { StatusBadge } from './StatusBadge';
import type { Experiment, ExperimentStats } from '../../types/experiments';

const CANAL_BORDER: Record<string, string> = {
  'E-mail':    'border-l-blue-500',
  'SMS':       'border-l-amber-500',
  'WhatsApp':  'border-l-emerald-500',
  'Push':      'border-l-purple-500',
};

const CANAL_TEXT: Record<string, string> = {
  'E-mail':   'text-blue-600 font-semibold',
  'SMS':      'text-amber-600 font-semibold',
  'WhatsApp': 'text-emerald-600 font-semibold',
  'Push':     'text-purple-600 font-semibold',
};

interface Props {
  experiment: Experiment;
  stats?: ExperimentStats;
  index: number;
  onClick: () => void;
}

export function ExperimentCard({ experiment, stats, index, onClick }: Props) {
  const canal = experiment.definicao.canal;
  const borderColor = CANAL_BORDER[canal] ?? 'border-l-slate-400';
  const isRunning = experiment.status === 'rodando';
  const isDone = experiment.status === 'concluido';
  const iceScore = (
    (experiment.definicao.variante_regra ? 1 : 1) * // dummy just in case
    (experiment.view_count >= 0 ? 1 : 1) * // dummy
    5 * 5 * 5 // Default score multiplier fallback if not present, let's look for them:
  );
  
  // Try to calculate actual ICE score if properties exist on experiment
  const iceImpact = (experiment as any).ice_impact ?? 5;
  const iceConfidence = (experiment as any).ice_confidence ?? 5;
  const iceEase = (experiment as any).ice_ease ?? 5;
  const calculatedIce = iceImpact * iceConfidence * iceEase;

  const iniciadoEmDate = experiment.iniciado_em ? new Date(experiment.iniciado_em) : null;
  const daysRunning = iniciadoEmDate 
    ? Math.floor((Date.now() - iniciadoEmDate.getTime()) / 86400000) 
    : 0;

  return (
    <Draggable draggableId={experiment.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={[
            'rounded-lg border-l-4 border border-slate-200 bg-white shadow-sm',
            'p-3 mb-2.5 cursor-pointer space-y-2.5',
            'hover:border-slate-400 hover:shadow-md transition-all',
            snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500/25 rotate-1 z-50 bg-slate-50' : '',
            borderColor,
          ].join(' ')}
        >
          {/* Header: canal tag + ICE badge */}
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10px] uppercase tracking-wider ${CANAL_TEXT[canal] ?? 'text-slate-500'}`}>
              {canal}
            </span>
            <span className="text-[10px] font-mono font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/55">
              ICE {calculatedIce}
            </span>
          </div>

          {/* Title */}
          <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
            {experiment.titulo}
          </p>

          {/* Three numbers — always together (Control / Variant / Lift) */}
          {stats && (isDone || isRunning) && (
            <div className="flex items-baseline gap-2 text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
              <span className="text-slate-500 text-[11px]">
                C: <span className="text-slate-800 font-mono font-medium">{(stats.conv_rate_controle * 100).toFixed(2)}%</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                V: <span className="text-slate-800 font-mono font-medium">{(stats.conv_rate_variante * 100).toFixed(2)}%</span>
              </span>
              <span className={[
                'ml-auto font-bold font-mono text-[11px]',
                !stats.significativo ? 'text-slate-400' :
                stats.delta_rel > 0 ? 'text-emerald-600' : 'text-red-600'
              ].join(' ')}>
                {stats.delta_rel > 0 ? '+' : ''}{(stats.delta_rel * 100).toFixed(1)}%
              </span>
            </div>
          )}

          {/* Sparkline (Running only with data) */}
          {isRunning && stats && (experiment as any).sparklineData && (
            <div className="pt-0.5">
              <ConversionSparkline
                data={(experiment as any).sparklineData || []}
                color={stats.significativo ? '#10b981' : '#64748b'}
                height={20}
              />
            </div>
          )}

          {/* Sample progress bar */}
          {isRunning && stats && (
            <div className="pt-0.5">
              <SampleProgressBar
                nAtual={Math.min(stats.n_variante, stats.n_controle)}
                nNecessario={stats.n_min_per_group}
                compact
              />
            </div>
          )}

          {/* Footer: status badge + owner + days */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <StatusBadge status={experiment.status} decisao={experiment.decisao} />
            <span className="text-[9px] text-slate-400 font-medium font-mono">
              {isRunning && experiment.iniciado_em ? `${daysRunning}d rodando` : 'backlog'}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
