import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from './DateRangePicker';

interface PeriodSelectorProps {
    compact?: boolean;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ compact = false }) => {
    const { startDate, endDate, setPeriod, compareEnabled, toggleCompare } = usePeriod();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleApply = (start: Date, end: Date, compare: boolean) => {
        setPeriod(start, end);
        toggleCompare(compare);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all ${isOpen
                    ? 'bg-white border-slate-400 text-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-slate-300'
                    }`}
            >
                <CalendarIcon size={16} className={isOpen ? 'text-slate-600' : 'text-slate-400'} />
                {compact && <span className="text-sm font-medium text-slate-600">Periodo</span>}
                <span className="text-sm font-medium">
                    {format(startDate, "dd MMM, yyyy", { locale: ptBR })} - {format(endDate, "dd MMM, yyyy", { locale: ptBR })}
                </span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50">
                    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden w-[800px] max-w-[92vw]">
                        <DateRangePicker
                            initialStartDate={startDate}
                            initialEndDate={endDate}
                            initialCompareEnabled={compareEnabled}
                            onApply={handleApply}
                            onCancel={() => setIsOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
