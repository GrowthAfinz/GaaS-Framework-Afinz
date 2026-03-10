import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Activity, FilterState } from '../types/framework';
import { DiaryEntry } from '../store/diaryStore';
import { Beaker } from 'lucide-react';

interface DayCellProps {
  day: number | null;
  date: Date | null;
  count: number;
  dominantBU: string | null;
  activities: Activity[];
  onClick?: (e: React.MouseEvent, date: Date, activities: Activity[]) => void;
  isCurrentMonth: boolean;
  anotacoes?: DiaryEntry[];
  onEditNote?: (date: Date) => void;
  onAddNote?: (date: Date) => void;
  onDeleteNote?: (anotacaoId: string) => void;
  onViewAnotacoes?: (date: Date) => void;
  isWeekend?: boolean;
  kanbanMode?: boolean;
  filters?: FilterState;
}

const BU_BG_COLORS: { [key: string]: string } = {
  B2C: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  B2B2C: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  Plurix: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
};

const BU_TEXT_COLORS: { [key: string]: string } = {
  B2C: 'text-blue-600',
  B2B2C: 'text-emerald-600',
  Plurix: 'text-purple-600'
};

export const DayCell: React.FC<DayCellProps> = ({
  day,
  date,
  count,
  dominantBU,
  activities,
  onClick,
  isCurrentMonth,
  anotacoes = [],
  onAddNote,
  onViewAnotacoes,
  isWeekend = false,
  kanbanMode = false,
  filters,
}) => {

  // Filtrar anotações baseado nos filtros de BU ativos
  const activeBUs = filters?.bu || [];

  const filteredAnotacoes = activeBUs.length > 0
    ? anotacoes.filter(a => activeBUs.includes(a.bu))
    : anotacoes;

  const handleClick = (e: React.MouseEvent) => {
    // Se estamos em modo kanban (diário) e há anotações, mostrar viewer
    if (kanbanMode && filteredAnotacoes.length > 0 && date && onViewAnotacoes && isCurrentMonth) {
      e.stopPropagation();
      onViewAnotacoes(date);
      return;
    }

    // Se onAddNote foi passada (modo diário ativo), cria nova anotação
    if (onAddNote && date && isCurrentMonth && kanbanMode) {
      e.stopPropagation();
      onAddNote(date);
      return;
    }

    // Senão, modo normal: mostra atividades se houver
    if (count > 0 && date && onClick && isCurrentMonth) {
      onClick(e, date, activities);
    }
  };

  if (!day) {
    return <div className={`aspect-square ${isWeekend ? 'bg-slate-100' : 'bg-white'}`} />;
  }

  // Determinar se é dia futuro (D+1 em diante)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cellDate = new Date(date!);
  cellDate.setHours(0, 0, 0, 0);
  const isFutureDay = cellDate > today;

  const baseClass = 'aspect-square border rounded-lg flex flex-col items-center justify-center relative transition cursor-pointer overflow-hidden';

  let colorClass = '';

  // Cores baseadas em atividades principais
  if (isFutureDay) {
    colorClass = isWeekend
      ? 'bg-slate-100 border-slate-200 hover:bg-slate-200'
      : 'bg-slate-50 border-slate-200 hover:bg-slate-100';
  } else if (count > 0 && dominantBU && isCurrentMonth) {
    colorClass = BU_BG_COLORS[dominantBU];
  } else {
    colorClass = isWeekend
      ? 'bg-slate-100 border-slate-200 hover:bg-slate-200'
      : 'bg-white border-slate-200 hover:bg-slate-100';
  }

  const textClass = count > 0 && dominantBU && isCurrentMonth ? BU_TEXT_COLORS[dominantBU] : 'text-slate-500';

  const droppableId = date ? `day-${date.toISOString().split('T')[0]}` : 'invalid-day';

  // Check if there are any notes for this day (even if not in kanban mode)
  const hasNotes = filteredAnotacoes.length > 0;

  return (
    <Droppable droppableId={droppableId} isDropDisabled={false}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${baseClass} ${colorClass} ${isCurrentMonth ? '' : 'opacity-30'} ${snapshot.isDraggingOver ? 'ring-2 ring-amber-400 shadow-lg' : ''
            }`}
          onClick={handleClick}
        >
          {/* Day number */}
          <span className={`text-xs font-bold ${isFutureDay ? 'text-slate-400' : 'text-slate-500'} absolute top-1 left-1`}>{day}</span>

          {/* Indicator for notes (visible in normal mode too) */}
          {!kanbanMode && hasNotes && isCurrentMonth && (
            <div className="absolute top-1 right-1 flex gap-0.5">
              {filteredAnotacoes.some(a => a.isTesteAB) && (
                <Beaker size={10} className="text-blue-400" />
              )}
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="Tem anotações" />
            </div>
          )}

          {/* Content: conditional based on kanbanMode */}
          <div className="flex flex-col items-center justify-center w-full h-full p-1 gap-1">
            {/* Bolinhas (anotações) - mostradas em modo diário (kanbanMode) */}
            {kanbanMode && filteredAnotacoes && filteredAnotacoes.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-center">
                {filteredAnotacoes.map(anotacao => (
                  <div
                    key={anotacao.id}
                    className={`w-2.5 h-2.5 rounded-full ring-1 ring-offset-1 ${anotacao.bu === 'B2C' ? 'bg-blue-500 ring-blue-400' :
                      anotacao.bu === 'B2B2C' ? 'bg-emerald-500 ring-emerald-400' :
                        anotacao.bu === 'Plurix' ? 'bg-purple-500 ring-purple-400' : 'bg-slate-500 ring-slate-400'
                      }`}
                    title={anotacao.bu}
                  />
                ))}
              </div>
            )}

            {/* Disparos - mostrados APENAS se NÃO está em modo kanban */}
            {!kanbanMode && count > 0 && isCurrentMonth && (
              <>
                <span className={`text-lg font-bold ${textClass}`}>[{count}]</span>
                <p className={`text-xs ${textClass} opacity-75`}>{dominantBU}</p>
              </>
            )}
          </div>

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
