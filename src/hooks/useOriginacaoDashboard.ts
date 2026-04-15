import { useMemo } from 'react';
import {
    eachDayOfInterval,
    endOfMonth,
    format,
    isSameMonth,
    isWeekend,
    startOfMonth
} from 'date-fns';
import { useAppStore } from '../store/useAppStore';
import { usePeriod } from '../contexts/PeriodContext';
import { useBU } from '../contexts/BUContext';
import { useAdvancedFilters } from './useAdvancedFilters';
import { Activity, CalendarData, Goal } from '../types/framework';
import { B2CDataRow } from '../types/b2c';
import { formatDateKey } from '../utils/formatters';

export interface OriginacaoDashboardRow {
    date: string;
    label: string;
    totalProposals: number;
    totalCards: number;
    totalConversion: number;
    serasaProposals: number;
    serasaCards: number;
    serasaSharePct: number;
    serasaConversionPct: number;
    crmProposals: number;
    crmCards: number;
    crmSharePct: number;
    observation?: string;
    cumulativeTotalCards: number;
    cumulativeSerasaCards: number;
    cumulativeCrmCards: number;
    cumulativeTargetCards: number;
}

export interface OriginacaoDashboardSummary {
    monthKey: string;
    monthLabel: string;
    metaCards: number;
    realizedCards: number;
    attainmentPct: number;
    projectionBusinessDays: number;
    projectionCalendarDays: number;
    gapToMeta: number;
    expectedCardsToDate: number;
    paceDeltaCards: number;
    paceStatus: 'ahead' | 'on_track' | 'risk';
    businessDaysElapsed: number;
    businessDaysInMonth: number;
    remainingBusinessDays: number;
    calendarDaysElapsed: number;
    calendarDaysInMonth: number;
    serasaCards: number;
    serasaProposals: number;
    serasaSharePct: number;
    serasaConversionPct: number;
    crmCards: number;
    crmSharePct: number;
    otherCards: number;
}

type AggregatedB2C = {
    proposals: number;
    cards: number;
    conversion: number;
    share: number;
    channelConversion: number;
    observation?: string;
};

const emptyAggregate = (): AggregatedB2C => ({
    proposals: 0,
    cards: 0,
    conversion: 0,
    share: 0,
    channelConversion: 0
});

const groupActivitiesByDate = (activities: Activity[]): CalendarData => {
    const grouped: CalendarData = {};
    activities.forEach((activity) => {
        const dateKey = formatDateKey(activity.dataDisparo);
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(activity);
    });
    return grouped;
};

const toDateAtNoon = (dateKey: string) => new Date(`${dateKey}T12:00:00`);

const countBusinessDaysInclusive = (start: Date, end: Date) => {
    if (end < start) return 0;
    return eachDayOfInterval({ start, end }).filter((date) => !isWeekend(date)).length;
};

const getGoalTarget = (goal: Goal | undefined) => Number(goal?.b2c_meta) || 0;

const createDailyRows = (
    start: Date,
    end: Date,
    filteredCrm: CalendarData,
    b2cRows: B2CDataRow[],
    monthTargetMeta: number,
    monthStart: Date,
    monthBusinessDays: number
): OriginacaoDashboardRow[] => {
    const totalByDate = new Map<string, AggregatedB2C>();
    const serasaByDate = new Map<string, AggregatedB2C>();
    const crmByDate = new Map<string, { proposals: number; cards: number }>();

    b2cRows.forEach((row) => {
        const dateKey = formatDateKey(row.data);
        const normalizedType = String(row.tipo || 'total').toLowerCase();
        const bucket = normalizedType === 'serasa_api' ? serasaByDate : totalByDate;
        const current = bucket.get(dateKey) || emptyAggregate();

        current.proposals += Number(row.propostas_b2c_total) || 0;
        current.cards += Number(row.emissoes_b2c_total) || 0;
        current.conversion = Number(row.percentual_conversao_b2c) || current.conversion;
        current.share = Number(row.percentual_share) || current.share;
        current.channelConversion = Number(row.pct_conv_canal) || current.channelConversion;
        current.observation = row.observacoes || current.observation;

        bucket.set(dateKey, current);
    });

    Object.entries(filteredCrm).forEach(([dateKey, activities]) => {
        const aggregate = activities.reduce(
            (acc, activity) => {
                acc.proposals += activity.kpis.propostas || 0;
                acc.cards += activity.kpis.cartoes || activity.kpis.emissoes || 0;
                return acc;
            },
            { proposals: 0, cards: 0 }
        );
        crmByDate.set(dateKey, aggregate);
    });

    const dates = eachDayOfInterval({ start, end });
    let cumulativeTotalCards = 0;
    let cumulativeSerasaCards = 0;
    let cumulativeCrmCards = 0;

    return dates.map((date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const total = totalByDate.get(dateKey) || emptyAggregate();
        const serasa = serasaByDate.get(dateKey) || emptyAggregate();
        const crm = crmByDate.get(dateKey) || { proposals: 0, cards: 0 };

        cumulativeTotalCards += total.cards;
        cumulativeSerasaCards += serasa.cards;
        cumulativeCrmCards += crm.cards;

        const crmSharePct = total.cards > 0 ? (crm.cards / total.cards) * 100 : 0;
        const serasaSharePct = total.cards > 0 ? (serasa.cards / total.cards) * 100 : serasa.share;
        const totalConversion = total.conversion || (total.proposals > 0 ? (total.cards / total.proposals) * 100 : 0);
        const serasaConversionPct = serasa.channelConversion || (serasa.proposals > 0 ? (serasa.cards / serasa.proposals) * 100 : 0);

        const targetCumulativeCards =
            isSameMonth(date, monthStart) && monthBusinessDays > 0
                ? (countBusinessDaysInclusive(monthStart, date) * monthTargetMeta) / monthBusinessDays
                : 0;

        return {
            date: dateKey,
            label: format(date, 'dd/MM'),
            totalProposals: total.proposals,
            totalCards: total.cards,
            totalConversion,
            serasaProposals: serasa.proposals,
            serasaCards: serasa.cards,
            serasaSharePct,
            serasaConversionPct,
            crmProposals: crm.proposals,
            crmCards: crm.cards,
            crmSharePct,
            observation: total.observation,
            cumulativeTotalCards,
            cumulativeSerasaCards,
            cumulativeCrmCards,
            cumulativeTargetCards: targetCumulativeCards
        };
    });
};

export const useOriginacaoDashboard = () => {
    const { activities, b2cData, goals, viewSettings } = useAppStore();
    const { startDate, endDate } = usePeriod();
    const { selectedBUs } = useBU();

    const allActivities = useMemo(() => groupActivitiesByDate(activities), [activities]);

    const baseFilters = useMemo(() => ({
        ...viewSettings.filtrosGlobais,
        bu: selectedBUs
    }), [viewSettings.filtrosGlobais, selectedBUs]);

    const analysisFilters = useMemo(() => ({
        ...baseFilters,
        dataInicio: format(startDate, 'yyyy-MM-dd'),
        dataFim: format(endDate, 'yyyy-MM-dd')
    }), [baseFilters, startDate, endDate]);

    const goalMonthStart = useMemo(() => startOfMonth(endDate), [endDate]);
    const goalMonthEnd = useMemo(() => endOfMonth(endDate), [endDate]);
    const today = useMemo(() => new Date(), []);
    const paceCutoff = useMemo(() => {
        const candidates = [goalMonthEnd, endDate, today].sort((a, b) => a.getTime() - b.getTime());
        return candidates[0];
    }, [goalMonthEnd, endDate, today]);

    const goalFilters = useMemo(() => ({
        ...baseFilters,
        dataInicio: format(goalMonthStart, 'yyyy-MM-dd'),
        dataFim: format(paceCutoff, 'yyyy-MM-dd')
    }), [baseFilters, goalMonthStart, paceCutoff]);

    const { filteredData: filteredCrmAnalysis } = useAdvancedFilters(allActivities, analysisFilters);
    const { filteredData: filteredCrmGoalMonth } = useAdvancedFilters(allActivities, goalFilters);

    const monthKey = format(endDate, 'yyyy-MM');
    const currentGoal = goals.find((goal) => goal.mes === monthKey);
    const metaCards = getGoalTarget(currentGoal);

    const monthBusinessDays = countBusinessDaysInclusive(goalMonthStart, goalMonthEnd);
    const businessDaysElapsed = countBusinessDaysInclusive(goalMonthStart, paceCutoff);
    const calendarDaysElapsed = Math.max(1, eachDayOfInterval({ start: goalMonthStart, end: paceCutoff }).length);
    const calendarDaysInMonth = eachDayOfInterval({ start: goalMonthStart, end: goalMonthEnd }).length;

    const analysisRows = useMemo(
        () => createDailyRows(startDate, endDate, filteredCrmAnalysis, b2cData, metaCards, goalMonthStart, monthBusinessDays),
        [startDate, endDate, filteredCrmAnalysis, b2cData, metaCards, goalMonthStart, monthBusinessDays]
    );

    const goalMonthRows = useMemo(
        () => createDailyRows(goalMonthStart, paceCutoff, filteredCrmGoalMonth, b2cData, metaCards, goalMonthStart, monthBusinessDays),
        [goalMonthStart, paceCutoff, filteredCrmGoalMonth, b2cData, metaCards, monthBusinessDays]
    );

    const summary = useMemo<OriginacaoDashboardSummary>(() => {
        const realizedCards = goalMonthRows.reduce((sum, row) => sum + row.totalCards, 0);
        const serasaCards = goalMonthRows.reduce((sum, row) => sum + row.serasaCards, 0);
        const serasaProposals = goalMonthRows.reduce((sum, row) => sum + row.serasaProposals, 0);
        const crmCards = goalMonthRows.reduce((sum, row) => sum + row.crmCards, 0);
        const otherCards = Math.max(0, realizedCards - serasaCards - crmCards);

        const serasaSharePct = realizedCards > 0 ? (serasaCards / realizedCards) * 100 : 0;
        const crmSharePct = realizedCards > 0 ? (crmCards / realizedCards) * 100 : 0;
        const serasaConversionPct = serasaProposals > 0 ? (serasaCards / serasaProposals) * 100 : 0;
        const attainmentPct = metaCards > 0 ? (realizedCards / metaCards) * 100 : 0;
        const projectionBusinessDays = businessDaysElapsed > 0 ? (realizedCards / businessDaysElapsed) * monthBusinessDays : 0;
        const projectionCalendarDays = calendarDaysElapsed > 0 ? (realizedCards / calendarDaysElapsed) * calendarDaysInMonth : 0;
        const expectedCardsToDate = monthBusinessDays > 0 ? (metaCards / monthBusinessDays) * businessDaysElapsed : 0;
        const paceDeltaCards = realizedCards - expectedCardsToDate;
        const projectedDelta = projectionBusinessDays - metaCards;

        let paceStatus: OriginacaoDashboardSummary['paceStatus'] = 'on_track';
        if (projectedDelta < -Math.max(metaCards * 0.03, 15)) paceStatus = 'risk';
        if (projectedDelta > Math.max(metaCards * 0.03, 15)) paceStatus = 'ahead';

        return {
            monthKey,
            monthLabel: format(goalMonthStart, 'MMMM yyyy'),
            metaCards,
            realizedCards,
            attainmentPct,
            projectionBusinessDays,
            projectionCalendarDays,
            gapToMeta: metaCards - realizedCards,
            expectedCardsToDate,
            paceDeltaCards,
            paceStatus,
            businessDaysElapsed,
            businessDaysInMonth: monthBusinessDays,
            remainingBusinessDays: Math.max(0, monthBusinessDays - businessDaysElapsed),
            calendarDaysElapsed,
            calendarDaysInMonth,
            serasaCards,
            serasaProposals,
            serasaSharePct,
            serasaConversionPct,
            crmCards,
            crmSharePct,
            otherCards
        };
    }, [
        goalMonthRows,
        metaCards,
        businessDaysElapsed,
        monthBusinessDays,
        calendarDaysElapsed,
        calendarDaysInMonth,
        monthKey,
        goalMonthStart
    ]);

    const getActivitiesForDate = (dateKey: string) => filteredCrmAnalysis[dateKey] || [];

    return {
        analysisRows,
        summary,
        currentGoal,
        getActivitiesForDate
    };
};
