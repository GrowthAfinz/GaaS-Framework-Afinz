import { addMonths, isBefore, isAfter, isSameDay, format, parseISO } from 'date-fns';
import { CalendarData, Activity, AggregatedData, ComparisonData, MoMMetrics, MoMComparison } from '../types/framework';

/**
 * Calculate previous month's corresponding date range
 * For days that don't exist in the previous month (e.g., Jan 31 -> Dec 31 + 1 day),
 * we adjust to the last day of that month
 */
export const getPreviousMonthDateRange = (
  startDate: Date,
  endDate: Date
): { startDate: Date; endDate: Date } => {
  const daysDifference = endDate.getDate() - startDate.getDate();
  const previousMonthStart = addMonths(startDate, -1);
  const previousMonthEnd = addMonths(endDate, -1);

  return {
    startDate: previousMonthStart,
    endDate: previousMonthEnd
  };
};

/**
 * Check if a date string falls within a date range
 */
const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  try {
    const date = parseISO(dateStr);
    return !isBefore(date, startDate) && !isAfter(date, endDate);
  } catch {
    return false;
  }
};

/**
 * Aggregate activities for a date range with filtering
 */
export const aggregateActivitiesForRange = (
  data: CalendarData,
  startDate: Date,
  endDate: Date,
  filters?: {
    bu?: string;
    canais?: string[];
    segmentos?: string[];
    parceiros?: string[];
  }
): AggregatedData[] => {
  const aggregated: Record<string, AggregatedData> = {};
  const dates = Object.keys(data).sort();

  dates.forEach(dateKey => {
    if (!isDateInRange(dateKey, startDate, endDate)) return;

    let activities = data[dateKey];

    // Apply filters if provided
    if (filters) {
      activities = activities.filter(activity => {
        if (filters.bu && activity.bu !== filters.bu) return false;
        if (filters.canais?.length && !filters.canais.includes(activity.canal)) return false;
        if (filters.segmentos?.length && !filters.segmentos.includes(activity.segmento)) return false;
        if (filters.parceiros?.length && !filters.parceiros.includes(activity.parceiro)) return false;
        return true;
      });
    }

    if (activities.length === 0) return;

    const label = format(parseISO(dateKey), 'dd/MM');
    const timestamp = parseISO(dateKey).getTime();

    if (!aggregated[dateKey]) {
      aggregated[dateKey] = {
        date: dateKey,
        label,
        timestamp,
        baseEnviada: 0,
        baseEntregue: 0,
        propostas: 0,
        cartoes: 0,
        custo: 0,
        count: 0
      };
    }

    activities.forEach(activity => {
      aggregated[dateKey].baseEnviada += activity.kpis.baseEnviada || 0;
      aggregated[dateKey].baseEntregue += activity.kpis.baseEntregue || 0;
      aggregated[dateKey].propostas += activity.kpis.propostas || 0;
      aggregated[dateKey].cartoes += activity.kpis.cartoes || 0;
      aggregated[dateKey].custo += activity.kpis.custoTotal || 0;
      aggregated[dateKey].count += 1;
    });
  });

  return Object.values(aggregated).sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Calculate a single MoM comparison metric
 */
const calculateSingleMoMComparison = (
  currentValue: number,
  previousValue: number
): MoMComparison => {
  const absoluteDifference = currentValue - previousValue;
  const percentDifference = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  return {
    currentValue,
    previousValue,
    absoluteDifference,
    percentDifference
  };
};

/**
 * Calculate metric value from aggregated data
 */
const calculateMetricValue = (
  data: AggregatedData,
  metricType: 'conversao' | 'cac' | 'entrega' | 'abertura'
): number => {
  switch (metricType) {
    case 'conversao':
      return data.baseEnviada > 0 ? (data.cartoes / data.baseEnviada) * 100 : 0;
    case 'cac':
      return data.cartoes > 0 ? data.custo / data.cartoes : 0;
    case 'entrega':
      return data.baseEnviada > 0 ? (data.baseEntregue / data.baseEnviada) * 100 : 0;
    case 'abertura':
      return data.baseEntregue > 0 ? (data.propostas / data.baseEntregue) * 100 : 0;
    default:
      return 0;
  }
};

/**
 * Calculate all MoM metrics comparing current and previous period data
 */
export const calculateMoMMetrics = (
  currentData: AggregatedData,
  previousData: AggregatedData
): MoMMetrics => {
  return {
    conversao: calculateSingleMoMComparison(
      calculateMetricValue(currentData, 'conversao'),
      calculateMetricValue(previousData, 'conversao')
    ),
    cac: calculateSingleMoMComparison(
      calculateMetricValue(currentData, 'cac'),
      calculateMetricValue(previousData, 'cac')
    ),
    entrega: calculateSingleMoMComparison(
      calculateMetricValue(currentData, 'entrega'),
      calculateMetricValue(previousData, 'entrega')
    ),
    abertura: calculateSingleMoMComparison(
      calculateMetricValue(currentData, 'abertura'),
      calculateMetricValue(previousData, 'abertura')
    )
  };
};

/**
 * Match dates from previous month to current period
 * Example: Jan 15 matches Dec 15 (both are day 15 of their respective months)
 */
export const matchPreviousMonthData = (
  currentData: AggregatedData[],
  previousData: AggregatedData[]
): Record<string, AggregatedData> => {
  const matchMap: Record<string, AggregatedData> = {};

  currentData.forEach(current => {
    const currentDate = parseISO(current.date);
    const dayOfMonth = currentDate.getDate();

    const matched = previousData.find(prev => {
      const prevDate = parseISO(prev.date);
      return prevDate.getDate() === dayOfMonth;
    });

    if (matched) {
      matchMap[current.date] = matched;
    }
  });

  return matchMap;
};

/**
 * Merge current and previous month data with MoM calculations
 */
export const mergeWithMoMData = (
  currentData: AggregatedData[],
  previousData: AggregatedData[]
): ComparisonData[] => {
  const previousDataMap = matchPreviousMonthData(currentData, previousData);

  return currentData.map(current => {
    const previousItem = previousDataMap[current.date];

    const result: ComparisonData = {
      ...current,
      previousData: previousItem
    };

    if (previousItem) {
      result.momMetrics = calculateMoMMetrics(current, previousItem);
    }

    return result;
  });
};

/**
 * Format percentage change for display
 */
export const formatPercentChange = (percent: number): string => {
  const isPositive = percent > 0;
  const prefix = isPositive ? '+' : '';
  return `${prefix}${percent.toFixed(2)}%`;
};

/**
 * Format percentage change with color indicator
 */
export const getPercentChangeColor = (percent: number): 'text-green-600' | 'text-red-600' | 'text-slate-600' => {
  if (percent > 0) return 'text-green-600';
  if (percent < 0) return 'text-red-600';
  return 'text-slate-600';
};
