import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { DatabaseRow, NotionDatabase } from '../../types/notion';

interface CalendarViewProps {
  database: NotionDatabase;
  filteredRows: DatabaseRow[];
  onAddRow: (initialProps?: Record<string, any>) => void;
  onOpenRowPage: (pageId: string) => void;
  /** Propriedade de data que posiciona os itens (adição GaaS: antes era fixa em prop_due). */
  datePropId?: string;
  /** Arrastar um item para outro dia muda a data. */
  onUpdateRow?: (rowId: string, propertyId: string, value: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  database,
  filteredRows,
  onAddRow,
  onOpenRowPage,
  datePropId,
  onUpdateRow,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dragRow, setDragRow] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const dateKey = datePropId || database.properties.find((p) => p.type === 'date')?.id || 'prop_due';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Build grid days
  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="w-full border border-[var(--notion-border)] rounded-lg bg-[var(--notion-card)] overflow-hidden shadow-xs">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--notion-border)] bg-[var(--notion-hover)]/30">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[var(--notion-text)]">
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={goToToday}
            className="px-2 py-0.5 text-xs rounded border border-[var(--notion-border)] hover:bg-[var(--notion-hover)] text-[var(--notion-text)] font-medium"
          >
            Hoje
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded hover:bg-[var(--notion-hover)] text-[var(--notion-text-muted)] hover:text-[var(--notion-text)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 border-b border-[var(--notion-border)] bg-[var(--notion-hover)]/50 text-center text-xs font-semibold text-[var(--notion-text-muted)] py-1.5">
        {weekDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[var(--notion-border)]">
        {days.map((d, idx) => {
          const dateStr = format(d, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(d, monthStart);
          const isToday = isSameDay(d, new Date());

          const matchingRows = filteredRows.filter(
            (r) => String(r.properties[dateKey] || '').slice(0, 10) === dateStr
          );

          return (
            <div
              key={idx}
              onDragOver={(e) => { if (!dragRow) return; e.preventDefault(); if (overDay !== dateStr) setOverDay(dateStr); }}
              onDragLeave={() => setOverDay(null)}
              onDrop={(e) => { e.preventDefault(); if (dragRow && onUpdateRow) onUpdateRow(dragRow, dateKey, dateStr); setDragRow(null); setOverDay(null); }}
              className={`min-h-[100px] p-1.5 flex flex-col justify-between group/day transition-colors ${
                isCurrentMonth ? 'bg-transparent' : 'bg-[var(--notion-hover)]/20 opacity-50'
              } ${overDay === dateStr ? 'bg-blue-500/10 ring-2 ring-inset ring-blue-400' : ''} hover:bg-[var(--notion-hover)]/30`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-blue-500 text-white font-bold'
                      : 'text-[var(--notion-text-muted)]'
                  }`}
                >
                  {format(d, 'd')}
                </span>

                <button
                  onClick={() => onAddRow({ [dateKey]: dateStr })}
                  className="opacity-0 group-hover/day:opacity-100 p-0.5 text-[var(--notion-text-muted)] hover:text-blue-500 rounded"
                  title="Novo neste dia"
                >
                  <Plus size={12} />
                </button>
              </div>

              {/* Items for this day */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-20">
                {matchingRows.map((r) => (
                  <div
                    key={r.id}
                    draggable={Boolean(onUpdateRow)}
                    onDragStart={(e) => { setDragRow(r.id); e.dataTransfer.setData('text/plain', r.id); e.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDragRow(null); setOverDay(null); }}
                    onClick={() => onOpenRowPage(r.pageId)}
                    className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200 truncate cursor-pointer hover:opacity-80"
                  >
                    {r.properties.prop_title || 'Sem título'}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
