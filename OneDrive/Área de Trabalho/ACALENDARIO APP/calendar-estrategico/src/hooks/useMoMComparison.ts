import { useMemo } from 'react';
import {
  CalendarData,
  ComparisonData,
  PeriodComparison
} from '../types/framework';
import {
  aggregateActivitiesForRange,
  mergeWithMoMData,
  getPreviousMonthDateRange
} from '../utils/momCalculations';

interface UseMoMComparisonProps {
  data: CalendarData;
  periodComparison: PeriodComparison;
  filters?: {
    bu?: string;
    canais?: string[];
    segmentos?: string[];
    parceiros?: string[];
  };
}

/**
 * Hook that handles all MoM comparison logic
 * Returns aggregated data with MoM metrics when comparison is enabled
 */
export const useMoMComparison = ({
  data,
  periodComparison,
  filters
}: UseMoMComparisonProps): ComparisonData[] => {
  return useMemo(() => {
    const { current, isMoMEnabled } = periodComparison;

    // Always aggregate current period
    const currentData = aggregateActivitiesForRange(
      data,
      current.startDate,
      current.endDate,
      filters
    );

    // If MoM comparison is not enabled, return without previous data
    if (!isMoMEnabled) {
      return currentData.map(item => ({ ...item }));
    }

    // Calculate previous month date range
    const previousDateRange = getPreviousMonthDateRange(
      current.startDate,
      current.endDate
    );

    // Aggregate previous period data
    const previousData = aggregateActivitiesForRange(
      data,
      previousDateRange.startDate,
      previousDateRange.endDate,
      filters
    );

    // Merge and calculate MoM metrics
    return mergeWithMoMData(currentData, previousData);
  }, [data, periodComparison, filters]);
};
