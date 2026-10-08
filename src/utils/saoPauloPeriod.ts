// Limites de período do calendário global no fuso America/Sao_Paulo.
// O período é inclusivo em dias de calendário: [início 00:00, (fim + 1) 00:00).
// Usar sempre `lt` no dia seguinte evita perder o último segundo/milissegundo do dia final.

const TZ = 'America/Sao_Paulo';

const pad = (n: number) => String(n).padStart(2, '0');

/** Soma dias a uma data de calendário 'yyyy-MM-dd' sem passar pelo fuso local do navegador. */
export function addCalendarDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Diferença em dias de calendário (fim - início). */
export function calendarDaysBetween(start: string, end: string): number {
  const [ys, ms, ds] = start.split('-').map(Number);
  const [ye, me, de] = end.split('-').map(Number);
  return Math.round((Date.UTC(ye, me - 1, de) - Date.UTC(ys, ms - 1, ds)) / 86_400_000);
}

/** Offset de São Paulo (ex.: '-03:00') vigente na meia-noite local do dia informado. */
export function saoPauloOffset(day: string): string {
  // Meio-dia UTC do dia evita ambiguidade de virada; o offset de SP é o mesmo o dia inteiro desde 2019.
  const probe = new Date(`${day}T12:00:00Z`);
  const part = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'longOffset' })
    .formatToParts(probe).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT-03:00';
  const match = part.match(/GMT([+-]\d{2}):?(\d{2})?/);
  return match ? `${match[1]}:${match[2] ?? '00'}` : '-03:00';
}

/** Instante ISO da meia-noite de São Paulo para o dia de calendário. */
export function saoPauloMidnight(day: string): string {
  return `${day}T00:00:00${saoPauloOffset(day)}`;
}

/** Limites para filtros PostgREST: `.gte(col, gte).lt(col, lt)`. */
export function saoPauloPeriodBounds(start: string, end: string): { gte: string; lt: string } {
  return { gte: saoPauloMidnight(start), lt: saoPauloMidnight(addCalendarDays(end, 1)) };
}

/** Dia de calendário de São Paulo de um timestamp. */
export function saoPauloDay(value: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(typeof value === 'string' ? new Date(value) : value);
}

export function inSaoPauloPeriod(value: string | null | undefined, start: string, end: string): boolean {
  if (!value) return false;
  const day = saoPauloDay(value);
  return day >= start && day <= end;
}

/** Janela anterior de mesma duração, terminando no dia anterior ao início. */
export function previousPeriod(start: string, end: string): { start: string; end: string } {
  const span = Math.max(calendarDaysBetween(start, end), 0);
  const prevEnd = addCalendarDays(start, -1);
  return { start: addCalendarDays(prevEnd, -span), end: prevEnd };
}
