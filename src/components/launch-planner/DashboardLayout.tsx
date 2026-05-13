import React, { useMemo, useEffect } from 'react';
import { CalendarData } from '../../types/framework';
import { CalendarSummary } from './CalendarSummary';
import { KPIOverview } from './KPIOverview';
import { LaunchPlannerKPIs } from './LaunchPlannerKPIs';
import { useAppStore } from '../../store/useAppStore';
import { usePeriod } from '../../contexts/PeriodContext';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { differenceInDays, subDays, isWithinInterval } from 'date-fns';
import { Send } from 'lucide-react';

interface DashboardLayoutProps {
    data: CalendarData;
    onActivityUpdate?: (activityId: string, newDate: Date) => void;
    onDayClick?: (date: Date) => void;
    onProgramDispatch?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ data, onDayClick, onProgramDispatch }) => {
    const [displayDate, setDisplayDate] = React.useState(new Date());
    const { goals, b2cData } = useAppStore();
    const { startDate, endDate, compareEnabled, setPeriod } = usePeriod();

    useEffect(() => {
        if (endDate && format(endDate, 'yyyy-MM') !== format(displayDate, 'yyyy-MM')) {
            setDisplayDate(endDate);
        }
    }, [endDate]);

    const handleMonthChange = (newDate: Date) => {
        setDisplayDate(newDate);
        setPeriod(startOfMonth(newDate), endOfMonth(newDate), 'custom');
    };

    const allActivities = useMemo(() => Object.values(data).flat(), [data]);

    const currentPeriodActivities = useMemo(() => {
        return allActivities.filter(a => {
            if (!a.dataDisparo || isNaN(a.dataDisparo.getTime())) return false;
            return isWithinInterval(a.dataDisparo, { start: startDate, end: endDate });
        });
    }, [allActivities, startDate, endDate]);

    const currentB2CData = useMemo(() => {
        return b2cData.filter(d => {
            const date = typeof d.data === 'string' ? new Date(d.data + 'T12:00:00') : new Date(d.data);
            if (isNaN(date.getTime())) return false;
            return isWithinInterval(date, { start: startDate, end: endDate });
        });
    }, [b2cData, startDate, endDate]);

    const previousPeriodActivities = useMemo(() => {
        if (!compareEnabled) return [];

        const duration = differenceInDays(endDate, startDate) + 1;
        const prevStart = subDays(startDate, duration);
        const prevEnd = subDays(endDate, duration);

        return allActivities.filter(a => {
            if (!a.dataDisparo || isNaN(a.dataDisparo.getTime())) return false;
            return isWithinInterval(a.dataDisparo, { start: prevStart, end: prevEnd });
        });
    }, [allActivities, startDate, endDate, compareEnabled]);

    return (
        <div className="flex h-[calc(100vh-80px)] gap-3 p-3 bg-slate-50 overflow-hidden">
            <div className="w-1/3 min-w-[320px] flex flex-col gap-2 self-start">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <CalendarSummary
                        data={data}
                        onDayClick={onDayClick}
                        displayDate={displayDate}
                        onMonthChange={handleMonthChange}
                    />
                </div>

                <button
                    onClick={onProgramDispatch}
                    className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 border border-cyan-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
                >
                    <Send size={16} />
                    Programar disparo
                </button>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto pr-1 gap-3">
                <div className="flex items-center justify-between mb-1" />

                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex justify-between items-center">
                        <span>KPIs</span>
                        {compareEnabled && (
                            <span className="text-[10px] text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full">
                                Comparando com periodo anterior
                            </span>
                        )}
                    </h3>
                    <KPIOverview
                        activities={currentPeriodActivities}
                        previousActivities={previousPeriodActivities}
                        b2cData={currentB2CData}
                    />
                </div>

                <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-2">
                        Metas & Resultados
                    </h3>
                    <LaunchPlannerKPIs
                        activities={currentPeriodActivities}
                        goals={goals}
                        currentMonth={format(startDate, 'yyyy-MM')}
                    />
                </div >
            </div >
        </div >
    );
};
