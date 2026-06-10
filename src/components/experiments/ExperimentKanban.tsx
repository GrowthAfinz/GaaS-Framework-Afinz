import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { ExperimentCard } from './ExperimentCard';
import type { Experiment, ExperimentStats } from '../../types/experiments';

const COLUMNS = [
  { id: 'backlog',   label: 'Backlog',   subtitle: 'ordenado por ICE' },
  { id: 'rodando',   label: 'Rodando',   subtitle: 'mais antigos primeiro' },
  { id: 'concluido', label: 'Concluído', subtitle: 'por data' },
] as const;

interface Props {
  byStatus: {
    backlog: Experiment[];
    rodando: Experiment[];
    concluido: Experiment[];
  };
  metricsMap: Record<string, ExperimentStats>;
  onCardClick: (id: string) => void;
  onDragTransition: (id: string, from: Experiment['status'], to: Experiment['status']) => void;
}

export function ExperimentKanban({ byStatus, metricsMap, onCardClick, onDragTransition }: Props) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.droppableId as Experiment['status'];
    const to = result.destination.droppableId as Experiment['status'];
    if (from === to) return;

    // Validate permitted transitions
    const allowed: Record<Experiment['status'], Experiment['status'][]> = {
      backlog: ['rodando'],
      rodando: ['concluido', 'backlog'],
      concluido: [], // cannot drag back once concluded (conclusions are committed to learning repository)
    };

    if (!allowed[from].includes(to)) {
      console.warn(`Drag transition from ${from} to ${to} is not allowed.`);
      return;
    }

    onDragTransition(result.draggableId, from, to);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 h-full min-h-[350px]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm h-full">
            {/* Column Header */}
            <div className="p-3 border-b border-slate-200 bg-slate-100/60 flex items-center justify-between border-t-2 border-t-slate-400">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{col.label}</span>
                <span className="ml-2 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {byStatus[col.id].length}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-medium italic">{col.subtitle}</span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={[
                    'flex-1 p-3 overflow-y-auto transition-colors min-h-[200px]',
                    snapshot.isDraggingOver ? 'bg-slate-200/20' : 'bg-transparent',
                  ].join(' ')}
                >
                  {byStatus[col.id].map((exp, index) => (
                    <ExperimentCard
                      key={exp.id}
                      experiment={exp}
                      stats={metricsMap[exp.id]}
                      index={index}
                      onClick={() => onCardClick(exp.id)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
