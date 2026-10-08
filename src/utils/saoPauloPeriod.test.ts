import { describe, expect, it } from 'vitest';
import { addCalendarDays, inSaoPauloPeriod, previousPeriod, saoPauloDay, saoPauloPeriodBounds } from './saoPauloPeriod';

describe('período global em America/Sao_Paulo', () => {
  it('inclui o último dia inteiro usando lt na meia-noite seguinte', () => {
    const b = saoPauloPeriodBounds('2026-09-01', '2026-09-30');
    expect(b.gte).toBe('2026-09-01T00:00:00-03:00');
    expect(b.lt).toBe('2026-10-01T00:00:00-03:00');
    const lastMinute = new Date('2026-09-30T23:59:59.999-03:00').getTime();
    expect(lastMinute).toBeGreaterThanOrEqual(new Date(b.gte).getTime());
    expect(lastMinute).toBeLessThan(new Date(b.lt).getTime());
    expect(new Date('2026-10-01T00:00:00-03:00').getTime()).not.toBeLessThan(new Date(b.lt).getTime());
  });
  it('classifica o dia pelo fuso de São Paulo, não pelo UTC', () => {
    // 23:30 de 30/09 em SP = 02:30Z de 01/10
    expect(saoPauloDay('2026-10-01T02:30:00Z')).toBe('2026-09-30');
    expect(inSaoPauloPeriod('2026-10-01T02:30:00Z', '2026-09-01', '2026-09-30')).toBe(true);
    expect(inSaoPauloPeriod('2026-10-01T03:00:00Z', '2026-09-01', '2026-09-30')).toBe(false);
    expect(inSaoPauloPeriod(null, '2026-09-01', '2026-09-30')).toBe(false);
  });
  it('vira mês e ano e calcula o período anterior de mesma duração', () => {
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(previousPeriod('2026-10-01', '2026-10-31')).toEqual({ start: '2026-08-31', end: '2026-09-30' });
    expect(previousPeriod('2026-10-08', '2026-10-08')).toEqual({ start: '2026-10-07', end: '2026-10-07' });
  });
  it('troca de período muda os limites sem reaproveitar o anterior', () => {
    expect(saoPauloPeriodBounds('2026-08-01', '2026-08-31')).not.toEqual(saoPauloPeriodBounds('2026-09-01', '2026-09-30'));
  });
});
