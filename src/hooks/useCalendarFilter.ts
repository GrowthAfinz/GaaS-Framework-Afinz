import { useMemo } from 'react';
import { CalendarData, FilterState } from '../types/framework';

export const useCalendarFilter = (data: CalendarData, filters: FilterState) => {
  const filteredData = useMemo(() => {
    // If no BU selected, show all data (don't filter out)
    // This prevents the calendar from appearing empty
    const busToFilter = filters.bu.length === 0 ? undefined : filters.bu;

    const filtered: CalendarData = {};

    Object.entries(data).forEach(([dateKey, activities]) => {
      const filtered_activities = busToFilter 
        ? activities.filter(activity => busToFilter.includes(activity.bu))
        : activities; // Show all if no BU filter selected
      
      if (filtered_activities.length > 0) {
        filtered[dateKey] = filtered_activities;
      }
    });

    return filtered;
  }, [data, filters.bu]);

  const activityCountByDay = useMemo(() => {
    const counts: { [dateKey: string]: number } = {};
    Object.entries(filteredData).forEach(([dateKey, activities]) => {
      counts[dateKey] = activities.length;
    });
    return counts;
  }, [filteredData]);

  const getDominantBU = (dateKey: string): string | null => {
    const activities = filteredData[dateKey] || [];
    if (activities.length === 0) return null;

    const buCounts: { [key: string]: number } = {};
    activities.forEach(activity => {
      buCounts[activity.bu] = (buCounts[activity.bu] || 0) + 1;
    });

    return Object.entries(buCounts).sort(([, a], [, b]) => b - a)[0][0];
  };

  const getTotalActivities = useMemo(() => {
    return Object.values(filteredData).reduce((sum, activities) => sum + activities.length, 0);
  }, [filteredData]);

  return {
    filteredData,
    activityCountByDay,
    getDominantBU,
    getTotalActivities,
    selectedBUs: filters.bu
  };
};
