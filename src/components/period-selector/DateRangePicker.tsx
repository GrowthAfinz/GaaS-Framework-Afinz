import React, { useState } from 'react';
import {
    format,
    subDays,
    startOfMonth,
    endOfMonth,
    subMonths,
    addMonths,
    isSameDay,
    isWithinInterval,
    isAfter,
    isBefore,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    differenceInDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRangePickerProps {
    initialStartDate: Date;
    initialEndDate: Date;
    initialCompareEnabled?: boolean;
    onApply: (start: Date, end: Date, compareEnabled: boolean) => void;
    onCancel: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    initialStartDate,
    initialEndDate,
    initialCompareEnabled = false,
    onApply,
    onCancel
}) => {
    const [startDate, setStartDate] = useState<Date>(initialStartDate);
    const [endDate, setEndDate] = useState<Date>(initialEndDate);
    const [hoverDate, setHoverDate] = useState<Date | null>(null);
    const [compareEnabled, setCompareEnabled] = useState(initialCompareEnabled);

    const [viewDate, setViewDate] = useState<Date>(endOfMonth(new Date()));

    const presets = [
        { label: 'Esta semana', getValue: () => [subDays(new Date(), new Date().getDay()), new Date()] as [Date, Date] },
        { label: 'Ultimos 14 dias', getValue: () => [subDays(new Date(), 13), new Date()] as [Date, Date] },
        { label: 'Ultimos 28 dias', getValue: () => [subDays(new Date(), 27), new Date()] as [Date, Date] },
        { label: 'Ultimos 90 dias', getValue: () => [subDays(new Date(), 89), new Date()] as [Date, Date] },
        { label: 'Este ano', getValue: () => [new Date(new Date().getFullYear(), 0, 1), new Date()] as [Date, Date] },
        { label: 'Este mes', getValue: () => [startOfMonth(new Date()), new Date()] as [Date, Date] },
    ];

    const handleDateClick = (date: Date) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null as any);
        } else {
            if (isBefore(date, startDate)) {
                setEndDate(startDate);
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const handlePresetClick = (getRange: () => [Date, Date]) => {
        const [start, end] = getRange();
        setStartDate(start);
        setEndDate(end);
        setViewDate(end);
    };

    const prevStart = compareEnabled && startDate && endDate
        ? subDays(startDate, differenceInDays(endDate, startDate) + 1)
        : null;
    const prevEnd = compareEnabled && startDate && endDate
        ? subDays(endDate, differenceInDays(endDate, startDate) + 1)
        : null;

    const renderCalendar = (monthDate: Date, position: 'left' | 'right') => {
        const start = startOfWeek(startOfMonth(monthDate));
        const end = endOfWeek(endOfMonth(monthDate));
        const days = eachDayOfInterval({ start, end });

        const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

        return (
            <div className="w-[320px] p-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                    {position === 'left' ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setViewDate(subMonths(viewDate, 1));
                            }}
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    ) : (
                        <div className="w-8" />
                    )}
                    <span className="font-semibold text-slate-700 capitalize">
                        {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    {position === 'right' ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setViewDate(addMonths(viewDate, 1));
                            }}
                            className="p-1 hover:bg-slate-100 rounded-full text-slate-500"
                        >
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <div className="w-8" />
                    )}
                </div>

                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map((d, i) => (
                        <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">
                    {days.map((day, i) => {
                        const isCurrentMonth = day.getMonth() === monthDate.getMonth();
                        const isSelectedStart = startDate && isSameDay(day, startDate);
                        const isSelectedEnd = endDate && isSameDay(day, endDate);
                        const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate });
                        const isHovered = !endDate && startDate && hoverDate && isWithinInterval(day, {
                            start: isBefore(day, startDate) ? day : startDate,
                            end: isAfter(day, startDate) ? day : startDate
                        });

                        const isPrevRange = prevStart && prevEnd && isWithinInterval(day, { start: prevStart, end: prevEnd });

                        return (
                            <button
                                key={i}
                                onClick={() => handleDateClick(day)}
                                onMouseEnter={() => setHoverDate(day)}
                                onMouseLeave={() => setHoverDate(null)}
                                className={`
                                    h-9 w-full flex items-center justify-center text-sm relative
                                    ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                                    ${isSelectedStart ? 'bg-cyan-600 text-white rounded-l-full z-10' : ''}
                                    ${isSelectedEnd ? 'bg-cyan-600 text-white rounded-r-full z-10' : ''}
                                    ${(isInRange || isHovered) && !isSelectedStart && !isSelectedEnd ? 'bg-cyan-100' : ''}
                                    ${isPrevRange && !isInRange && !isSelectedStart && !isSelectedEnd ? 'bg-orange-100 text-orange-700' : ''}
                                    ${isSelectedStart && isSelectedEnd ? 'rounded-full' : ''}
                                    hover:bg-cyan-200 hover:text-slate-900 transition-colors
                                `}
                            >
                                {format(day, 'd')}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-[450px] bg-white">
            <div className="w-48 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-2">
                {presets.map((preset, i) => (
                    <button
                        key={i}
                        onClick={() => handlePresetClick(preset.getValue)}
                        className="text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-white hover:text-slate-800 transition-colors border border-transparent hover:border-slate-200"
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex divide-x divide-slate-200">
                    <div className="relative">
                        {renderCalendar(subMonths(viewDate, 1), 'left')}
                    </div>

                    <div className="relative">
                        {renderCalendar(viewDate, 'right')}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={compareEnabled}
                                onChange={(e) => setCompareEnabled(e.target.checked)}
                                className="rounded border-slate-300 bg-white text-cyan-600 focus:ring-cyan-500/20"
                            />
                            Comparar com periodo anterior
                        </label>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onApply(startDate, endDate || startDate, compareEnabled)}
                            className="px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-500"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
