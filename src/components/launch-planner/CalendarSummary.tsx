import React, { useMemo } from 'react';
import { format, isSameDay, startOfWeek, isSameMonth, addMonths, subMonths, getDay, startOfMonth, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarData } from '../../types/framework';

interface CalendarSummaryProps {
    data: CalendarData;
    onDayClick?: (date: Date) => void;
    displayDate: Date;
    onMonthChange: (date: Date) => void;
}

export const CalendarSummary: React.FC<CalendarSummaryProps> = ({ data, onDayClick, displayDate, onMonthChange }) => {
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(displayDate);
        const start = startOfWeek(monthStart);
        return Array.from({ length: 42 }, (_, i) => addDays(start, i));
    }, [displayDate]);

    const handleMonthChange = (newDate: Date) => {
        onMonthChange(newDate);
    };

    const allActivities = useMemo(() => Object.values(data).flat(), [data]);

    const getDayMetrics = (day: Date) => {
        const activities = allActivities.filter(a => {
            if (!a.dataDisparo || isNaN(a.dataDisparo.getTime())) return false;
            return isSameDay(a.dataDisparo, day);
        });
        const count = activities.length;
        const hasDraft = activities.some(a => a.status === 'Rascunho');

        const byBU = activities.reduce((acc, curr) => {
            acc[curr.bu] = (acc[curr.bu] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const byBUCartoes = activities.reduce((acc, curr) => {
            acc[curr.bu] = (acc[curr.bu] || 0) + (curr.kpis.cartoes || 0);
            return acc;
        }, {} as Record<string, number>);

        return { count, byBU, byBUCartoes, hasDraft };
    };

    const getDominantBUColor = (byBUCartoes: Record<string, number>, byBU: Record<string, number>) => {
        let dominantBU: string | null = null;

        const totalCards = Object.values(byBUCartoes).reduce((a, b) => a + b, 0);

        if (totalCards > 0) {
            dominantBU = Object.entries(byBUCartoes).sort((a, b) => b[1] - a[1])[0][0];
        } else if (Object.keys(byBU).length > 0) {
            dominantBU = Object.entries(byBU).sort((a, b) => b[1] - a[1])[0][0];
        }

        if (!dominantBU) return 'bg-slate-50 border-slate-200 hover:bg-slate-100';

        switch (dominantBU?.toUpperCase()) {
            case 'B2C': return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
            case 'B2B2C': return 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100';
            case 'PLURIX': return 'bg-violet-50 border-violet-200 hover:bg-violet-100';
            case 'SEGUROS': return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
            default: return 'bg-slate-50 border-slate-200 hover:bg-slate-100';
        }
    };

    const getBUColor = (bu: string) => {
        switch (bu?.toUpperCase()) {
            case 'B2C': return 'bg-blue-600 hover:bg-blue-500';
            case 'B2B2C': return 'bg-emerald-600 hover:bg-emerald-500';
            case 'PLURIX': return 'bg-violet-600 hover:bg-violet-500';
            case 'SEGUROS': return 'bg-orange-600 hover:bg-orange-500';
            default: return 'bg-slate-500 hover:bg-slate-400';
        }
    };

    const isWeekend = (day: Date) => {
        const dayOfWeek = getDay(day);
        return dayOfWeek === 0 || dayOfWeek === 6;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleMonthChange(subMonths(displayDate, 1))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700"
                        title="Mes anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 uppercase min-w-[200px] text-center">
                        {format(displayDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <button
                        onClick={() => handleMonthChange(addMonths(displayDate, 1))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-slate-700"
                        title="Proximo mes"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div
                        key={i}
                        className={`text-center text-xs font-semibold py-2 ${i === 0 || i === 6 ? 'text-cyan-600' : 'text-slate-400'
                            }`}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="flex justify-center pt-1">
                <div className="grid grid-cols-7 gap-1 w-full max-w-[560px]">
                    {calendarDays.map((day) => {
                        const { count, byBU, byBUCartoes, hasDraft } = getDayMetrics(day);
                        const isCurrentMonth = isSameMonth(day, displayDate);
                        const isToday = isSameDay(day, new Date());
                        const weekend = isWeekend(day);

                        const buEntries = Object.entries(byBU).sort((a, b) => b[1] - a[1]);
                        const dominantBUColor = getDominantBUColor(byBUCartoes, byBU);

                        const dayStyle = hasDraft
                            ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                            : isCurrentMonth
                                ? weekend
                                    ? 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100'
                                    : dominantBUColor
                                : 'bg-slate-50 border-slate-100 opacity-50';

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => onDayClick?.(day)}
                                className={`
                                relative p-1 rounded-md border transition-all cursor-pointer aspect-square overflow-hidden group
                                ${dayStyle}
                                ${isToday ? 'ring-1 ring-cyan-500 ring-offset-1 ring-offset-white' : ''}
                            `}
                            >
                                <div className="absolute top-1 left-0 right-0 flex justify-center">
                                    <span className={`text-[10px] font-semibold ${isToday
                                        ? 'text-cyan-700'
                                        : weekend
                                            ? 'text-cyan-600'
                                            : 'text-slate-600'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {count > 0 && (
                                    <div className="absolute inset-x-0 bottom-1 top-4 flex flex-wrap content-center justify-center gap-0.5 px-0.5">
                                        {buEntries.map(([bu, buCount]) => (
                                            <div
                                                key={bu}
                                                className={`${getBUColor(bu)} rounded-full w-3.5 h-3.5 flex items-center justify-center text-white font-bold text-[7px] shadow-sm`}
                                                title={`${buCount} ${bu}`}
                                            >
                                                {buCount}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
