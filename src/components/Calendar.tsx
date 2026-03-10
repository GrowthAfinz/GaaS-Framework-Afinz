import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Download, BookOpen, Beaker } from 'lucide-react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { DayCell } from './DayCell';
import { HoverCard } from './HoverCard';
import { StatsCard } from './StatsCardTips';
import { NoteEditorModal } from './NoteEditorModal';
import { AnotacoesViewer } from './AnotacoesViewer';
import { MinimalFunnel } from './MinimalFunnel';
import { Activity, CalendarData, FilterState } from '../types/framework';
import { formatDateKey, getMonthYear } from '../utils/formatters';
import { useMonthComparison } from '../hooks/useMonthComparison';
import { useDiaryStore, DiaryEntry } from '../store/diaryStore';
import { useFrameworkOptions } from '../hooks/useFrameworkOptions';
import { useConversionFunnel } from '../hooks/useConversionFunnel';
import { useExport } from '../hooks/useExport';

interface CalendarProps {
  data: CalendarData;
  activityCountByDay: { [dateKey: string]: number };
  getDominantBU: (dateKey: string) => string | null;
  showComparison?: boolean;
  filters?: FilterState;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export const Calendar: React.FC<CalendarProps> = ({
  data,
  activityCountByDay,
  getDominantBU,
  showComparison = true,
  filters = { bu: ['B2C', 'B2B2C', 'Plurix'], canais: [], jornadas: [], segmentos: [], parceiros: [], ofertas: [], disparado: 'Todos' }
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [diaryMode, setDiaryMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState<{
    date: Date;
    activities: Activity[];
    x: number;
    y: number;
  } | null>(null);
  const [editingNoteDate, setEditingNoteDate] = useState<Date | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingAnotacoesDate, setViewingAnotacoesDate] = useState<Date | null>(null);
  const [dragToast, setDragToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Auto-navigate to month with data when data loads
  React.useEffect(() => {
    const dates = Object.keys(data);
    if (dates.length === 0) return;

    // Check if current view has data
    const hasDataForCurrentView = dates.some(dateKey => {
      const d = new Date(dateKey);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });

    if (!hasDataForCurrentView) {
      // Find the most recent month with data
      const sortedDates = dates.sort(); // YYYY-MM-DD sorts correctly strings
      const lastDateKey = sortedDates[sortedDates.length - 1];
      if (lastDateKey) {
        // Add timezone offset correction to prevent day shift
        const [y, m] = lastDateKey.split('-').map(Number);
        setCurrentDate(new Date(y, m - 1, 1));
      }
    }
  }, [data]);

  // Use Diary Store
  const { entries, addEntry, updateEntry, deleteEntry } = useDiaryStore();

  // Use Framework Options for dropdowns
  const { bus, segmentos: segments, parceiros: partners } = useFrameworkOptions();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Hook para comparação mensal - passa o mês sendo visualizado
  const { aggregatedComparison } = useMonthComparison(
    data,
    showComparison,
    { year, month }
  );
  // Hooks de funil e exportação (mês visualizado)
  const funnelData = useConversionFunnel(data, { year, month });
  const { exportJourneyCSV, exportActivityCSV } = useExport();

  // Primeira data do mês
  const firstDay = new Date(year, month, 1);
  const startingDayOfWeek = firstDay.getDay();

  // Última data do mês
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Gerar grid (6 linhas x 7 colunas)
  const calendarGrid: (number | null)[][] = [];
  let dayCounter = 1;

  for (let week = 0; week < 6; week++) {
    const weekRow: (number | null)[] = [];
    for (let day = 0; day < 7; day++) {
      const index = week * 7 + day;

      if (index < startingDayOfWeek) {
        // Dias do mês anterior
        weekRow.push(null);
      } else if (dayCounter <= daysInMonth) {
        weekRow.push(dayCounter);
        dayCounter++;
      } else {
        // Dias do próximo mês
        weekRow.push(null);
      }
    }
    calendarGrid.push(weekRow);
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (e: React.MouseEvent, date: Date, activities: Activity[]) => {
    // Toggle: se já está aberto, fecha; se não, abre
    if (selectedCard && selectedCard.date.getTime() === date.getTime()) {
      setSelectedCard(null);
    } else {
      setSelectedCard({
        date,
        activities,
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleCloseCard = () => {
    setSelectedCard(null);
  };

  // Filtra dados do período exibido, priorizando Safra se disponível
  const periodData = useMemo(() => {
    const filtered: CalendarData = {};
    Object.entries(data).forEach(([dateKey, activities]) => {
      const acts = (activities as Activity[]).filter((a: Activity) => {
        if (a.safraKey) {
          const [y, m] = a.safraKey.split('-');
          return Number(y) === year && Number(m) === month + 1;
        }
        const d = new Date(dateKey);
        return d.getFullYear() === year && d.getMonth() === month;
      });
      if (acts.length > 0) {
        filtered[dateKey] = acts;
      }
    });
    return filtered;
  }, [data, year, month]);

  // Helper to filter entries by date and active filters
  const getEntriesForDate = (dateKey: string) => {
    const activeBUs: string[] = filters?.bu || [];
    const activeSegmentos: string[] = filters?.segmentos || [];
    const activeParceiros: string[] = filters?.parceiros || [];

    return entries.filter(e => {
      const matchDate = e.date === dateKey;
      const matchBU = activeBUs.length === 0 || activeBUs.includes(e.bu);

      let matchSegment = true;
      if (activeSegmentos.length > 0) {
        matchSegment = e.segmentos.some(seg => activeSegmentos.includes(seg));
      }

      let matchPartner = true;
      if (activeParceiros.length > 0) {
        matchPartner = e.parceiros.some(parc => activeParceiros.includes(parc));
      }

      return matchDate && matchBU && matchSegment && matchPartner;
    });
  };

  const handleEditNote = (date: Date, anotacaoId?: string) => {
    setEditingNoteDate(date);
    if (anotacaoId) {
      setEditingNoteId(anotacaoId);
    } else {
      setEditingNoteId(null);
    }
  };

  const handleSaveNote = (text: string, bu: 'B2C' | 'B2B2C' | 'Plurix', segmentos: string[], parceiros: string[], isTesteAB: boolean) => {
    if (!editingNoteDate) return;

    const dateKey = formatDateKey(editingNoteDate);

    if (editingNoteId) {
      updateEntry(editingNoteId, {
        title: text, // Mapping 'anotacao' to 'title' for now, or we can split if we want
        bu,
        segmentos,
        parceiros,
        isTesteAB,
      });
    } else {
      addEntry({
        date: dateKey,
        bu,
        title: text,
        description: '', // Optional description
        segmentos,
        parceiros,
        isTesteAB,
        canais: [],
        campanhasRelacionadas: [],
      });
    }

    setEditingNoteDate(null);
    setEditingNoteId(null);
  };

  const handleDeleteNote = (anotacaoId: string) => {
    deleteEntry(anotacaoId);
    setEditingNoteDate(null);
    setEditingNoteId(null);
  };

  // Handler para Drag & Drop com react-beautiful-dnd
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // Se não foi dropado em um destino válido, ignora
    if (!destination) return;

    // Se foi dropado no mesmo lugar, ignora
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Extrair a data do droppableId (formato: "day-YYYY-MM-DD")
    const targetDateKey = destination.droppableId.replace('day-', '');

    // Mover a anotação para a nova data
    updateEntry(draggableId, { date: targetDateKey });

    const [y, m, d] = targetDateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const formattedDate = date.toLocaleDateString('pt-BR');
    setDragToast({ message: `✅ Anotação movida para ${formattedDate}`, show: true });
    setTimeout(() => setDragToast({ message: '', show: false }), 3000);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full bg-white overflow-hidden">
        {/* Calendário (esquerda) */}
        <div className="flex flex-col w-2/5 bg-white border-r border-slate-200 p-4 overflow-hidden">
          {/* Header com navegação */}
          <div className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-100 rounded transition"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-500" />
                </button>
                <h2 className="text-lg font-bold text-slate-900 min-w-fit">
                  {getMonthYear(new Date(year, month, 1))}
                </h2>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-100 rounded transition"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendário Grid */}
          <div className="bg-slate-50 border border-slate-200 rounded p-3 flex-shrink-0">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-400 py-1">
                  {day.substring(0, 1)}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((week, weekIdx) =>
                week.map((day, dayIdx) => {
                  const isCurrentMonth = day !== null;
                  let date: Date | null = null;
                  let count = 0;
                  let dominantBU: string | null = null;
                  let activities: Activity[] = [];
                  let dayAnotacoes: DiaryEntry[] = [];

                  if (isCurrentMonth && day) {
                    date = new Date(year, month, day);
                    const dateKey = formatDateKey(date);
                    count = activityCountByDay[dateKey] || 0;
                    dominantBU = getDominantBU(dateKey);
                    activities = data[dateKey] || [];
                    dayAnotacoes = getEntriesForDate(dateKey);
                  }

                  return (
                    <DayCell
                      key={`${weekIdx}-${dayIdx}`}
                      day={day}
                      date={date}
                      count={count}
                      dominantBU={dominantBU}
                      activities={activities}
                      onClick={handleDayClick}
                      isCurrentMonth={isCurrentMonth}
                      anotacoes={dayAnotacoes}
                      onEditNote={diaryMode && date ? () => handleEditNote(date) : undefined}
                      onAddNote={diaryMode && date ? () => handleEditNote(date) : undefined}
                      onDeleteNote={diaryMode ? (anotacaoId: string) => handleDeleteNote(anotacaoId) : undefined}
                      onViewAnotacoes={diaryMode && date ? (d) => setViewingAnotacoesDate(d) : undefined}
                      isWeekend={dayIdx === 0 || dayIdx === 6}
                      kanbanMode={diaryMode}
                      filters={filters}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Botão Diário de Bordo */}
          <div className="mt-3 flex-shrink-0">
            <button
              onClick={() => setDiaryMode(!diaryMode)}
              className={`w-full py-2 px-3 rounded transition flex items-center justify-center gap-2 font-medium text-sm ${diaryMode
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
            >
              <BookOpen size={16} />
              Diário de Bordo
            </button>
          </div>

          {/* Diary entries listing */}
          {diaryMode && (
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 border border-slate-200 rounded p-4 mt-2">
              <h3 className="text-xs font-bold text-slate-700 mb-3">Entrada do Diário</h3>
              <div className="space-y-4">
                {(() => {
                  // Get filtered anotações for diary display - respect BU checkbox selections
                  const activeBUs: string[] = filters?.bu || [];
                  const activeSegmentos: string[] = filters?.segmentos || [];
                  const activeParceiros: string[] = filters?.parceiros || [];

                  const filteredAnotacoes = entries.filter(e => {
                    // BU Filter
                    if (activeBUs.length > 0 && !activeBUs.includes(e.bu)) {
                      return false;
                    }
                    // Segmentos Filter
                    if (activeSegmentos.length > 0) {
                      const hasSegment = e.segmentos.some(seg => activeSegmentos.includes(seg));
                      if (!hasSegment) return false;
                    }
                    // Parceiros Filter
                    if (activeParceiros.length > 0) {
                      const hasPartner = e.parceiros.some(parc => activeParceiros.includes(parc));
                      if (!hasPartner) return false;
                    }
                    return true;
                  });

                  // Group by date
                  const diaryEntries: { date: Date; dateKey: string; anotacoes: DiaryEntry[] }[] = [];
                  const dateMap = new Map<string, DiaryEntry[]>();

                  filteredAnotacoes.forEach(anotacao => {
                    if (!dateMap.has(anotacao.date)) {
                      dateMap.set(anotacao.date, []);
                    }
                    dateMap.get(anotacao.date)!.push(anotacao);
                  });

                  Array.from(dateMap.entries())
                    .sort(([a], [b]) => a.localeCompare(b)) // Mostrar do mais antigo pro mais novo
                    .forEach(([dateKey, anots]) => {
                      const [year, month, day] = dateKey.split('-').map(Number);
                      const date = new Date(year, month - 1, day);
                      diaryEntries.push({
                        date,
                        dateKey,
                        anotacoes: anots,
                      });
                    });

                  return diaryEntries.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhuma entrada no diário</p>
                  ) : (
                    diaryEntries.map((entry) => (
                      <div key={entry.dateKey} className="border-l-2 border-amber-500 pl-3 pb-3">
                        <div className="text-xs font-semibold text-slate-900 mb-2">
                          {entry.date.toLocaleDateString('pt-BR')}
                        </div>
                        <div className="space-y-2">
                          {entry.anotacoes.map((anotacao) => {
                            const BU_BG: { [key: string]: string } = {
                              B2C: 'bg-blue-50 text-blue-700 border-blue-200',
                              B2B2C: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                              Plurix: 'bg-purple-50 text-purple-700 border-purple-200',
                            };
                            return (
                              <div
                                key={anotacao.id}
                                className={`p-2.5 rounded text-xs border ${BU_BG[anotacao.bu] || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                              >
                                <div className="font-medium mb-1 flex justify-between items-start gap-2">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span>• {anotacao.bu}</span>
                                    {anotacao.isTesteAB && (
                                      <span className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-200">
                                        <Beaker size={8} /> AB
                                      </span>
                                    )}
                                    {anotacao.segmentos && anotacao.segmentos.length > 0 && (
                                      <span className="opacity-75">{anotacao.segmentos.join(', ')}</span>
                                    )}
                                    {anotacao.parceiros && anotacao.parceiros.length > 0 && (
                                      <span className="opacity-75">{anotacao.parceiros.join(', ')}</span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleEditNote(entry.date, anotacao.id)}
                                    className="text-xs opacity-70 hover:opacity-100 shrink-0"
                                  >
                                    ✏️
                                  </button>
                                </div>
                                {anotacao.title && (
                                  <div className="text-xs opacity-90 ml-4 italic border-l border-current/30 pl-2 py-0.5">
                                    {anotacao.title.length > 80
                                      ? anotacao.title.substring(0, 80) + '...'
                                      : anotacao.title}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Direita (KPIs + Funil) - flex column */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* KPIs (cima) */}
          {showComparison && aggregatedComparison && (
            <div className="flex-shrink-0 border-b border-slate-200 p-4 overflow-y-auto">
              <StatsCard data={periodData} comparisonData={aggregatedComparison} />
            </div>
          )}

          {/* Funil Minimalista (meio/baixo) */}
          <div className="flex-1 overflow-auto p-4">
            <MinimalFunnel
              baseEnviada={funnelData.baseEnviada}
              baseEntregue={funnelData.baseEntregue}
              propostas={funnelData.propostas}
              aprovados={funnelData.aprovados}
              emissoes={funnelData.emissoes}
            />
          </div>

          {/* Export actions (rodapé) */}
          <div className="flex-shrink-0 border-t border-slate-200 p-3 flex items-center justify-end gap-2">
            {(() => {
              const ym = `${year}-${String(month + 1).padStart(2, '0')}`;
              return (
                <>
                  <button
                    onClick={() => exportJourneyCSV(periodData, `journey_${ym}.csv`)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    title="Exportar CSV consolidado por Jornada (Segmento)"
                  >
                    <Download size={14} /> CSV Jornada
                  </button>
                  <button
                    onClick={() => exportActivityCSV(periodData, `disparos_${ym}.csv`)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 text-slate-700"
                    title="Exportar CSV por Disparo (Activity)"
                  >
                    <Download size={14} /> CSV Disparos
                  </button>
                </>
              );
            })()}
          </div>
        </div>

        {/* Toast para drag & drop */}
        {dragToast.show && (
          <div className="fixed bottom-4 right-4 px-4 py-2 bg-green-600 text-green-50 rounded text-xs font-medium animate-fade-in z-50">
            {dragToast.message}
          </div>
        )}
      </div>

      {/* Card Modal */}
      {selectedCard && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={handleCloseCard}
        />
      )}
      {selectedCard && (
        <HoverCard
          date={selectedCard.date}
          activities={selectedCard.activities}
          x={selectedCard.x}
          y={selectedCard.y}
          onClose={handleCloseCard}
        />
      )}

      {/* Note Editor Modal */}
      <NoteEditorModal
        date={editingNoteDate}
        initialText={editingNoteId ? entries.find(a => a.id === editingNoteId)?.title || '' : ''}
        initialBU={editingNoteId ? (entries.find(a => a.id === editingNoteId)?.bu || 'B2C') : 'B2C'}
        initialSegmentos={editingNoteId ? entries.find(a => a.id === editingNoteId)?.segmentos || [] : []}
        initialParceiros={editingNoteId ? entries.find(a => a.id === editingNoteId)?.parceiros || [] : []}
        initialIsTesteAB={editingNoteId ? entries.find(a => a.id === editingNoteId)?.isTesteAB || false : false}
        availableBUs={bus}
        availableSegmentos={segments}
        availableParceiros={partners}
        onSave={handleSaveNote}
        onDelete={editingNoteId ? () => handleDeleteNote(editingNoteId!) : undefined}
        onClose={() => {
          setEditingNoteDate(null);
          setEditingNoteId(null);
        }}
      />

      {/* Anotações Viewer Modal */}
      {viewingAnotacoesDate && (
        <AnotacoesViewer
          anotacoes={getEntriesForDate(formatDateKey(viewingAnotacoesDate))}
          date={viewingAnotacoesDate}
          onClose={() => setViewingAnotacoesDate(null)}
          onDeleteAnotacao={handleDeleteNote}
          onEditAnotacao={(id) => {
            setEditingNoteDate(viewingAnotacoesDate);
            setEditingNoteId(id);
            setViewingAnotacoesDate(null);
          }}
        />
      )}
    </DragDropContext>
  );
};
