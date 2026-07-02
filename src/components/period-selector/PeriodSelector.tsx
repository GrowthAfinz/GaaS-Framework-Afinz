import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { usePeriod } from '../../contexts/PeriodContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangePicker } from './DateRangePicker';

interface PeriodSelectorProps {
    compact?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ compact = false, onOpenChange }) => {
    const { startDate, endDate, setPeriod, compareMode, toggleCompare } = usePeriod();
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

    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    const handleApply = (start: Date, end: Date, mode: 'previousPeriod' | 'samePeriodLastMonth' | null) => {
        setPeriod(start, end);
        toggleCompare(mode);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-all select-none ${isOpen
                    ? 'bg-white border-afinz-teal text-cyan-700 shadow-md ring-1 ring-cyan-500/10'
                    : 'bg-white border-cyan-100 text-slate-700 hover:border-cyan-200'
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
                            initialCompareMode={compareMode}
                            onApply={handleApply}
                            onCancel={() => setIsOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
