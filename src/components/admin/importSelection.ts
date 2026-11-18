export interface ImportSelectionRow { key: string; date: string; eligible: boolean }
export interface ImportSelectionPeriod { from: string; to: string }

export function previousWeekStart(today: string): string {
    const day = new Date(today + 'T00:00:00Z');
    const weekday = (day.getUTCDay() + 6) % 7;
    day.setUTCDate(day.getUTCDate() - weekday - 7);
    return day.toISOString().slice(0, 10);
}

export function inImportPeriod(date: string, period: ImportSelectionPeriod): boolean {
    return (!period.from || date >= period.from) && (!period.to || date <= period.to);
}

export function replaceImportScopeSelection(
    selected: ReadonlySet<string>,
    scope: ImportSelectionRow[],
    period: ImportSelectionPeriod,
    checked: boolean,
): Set<string> {
    const next = new Set(selected);
    for (const row of scope) {
        next.delete(row.key);
        if (checked && row.eligible && inImportPeriod(row.date, period)) next.add(row.key);
    }
    return next;
}
