import { subDays } from 'date-fns';

const today = new Date('2026-03-11T12:00:00Z');
console.log('last28', subDays(today, 27).toISOString());
console.log('last30', subDays(today, 29).toISOString());
console.log('lastMonth start', new Date(2026, 1, 1).toISOString());
