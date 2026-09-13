function numericChartValue(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "string" || value.trim() === "") return false;
  const normalized = value.trim().replace(/\s/g, "").replace(/%$/, "")
    .replace(/^R\$/, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  return normalized !== "" && Number.isFinite(Number(normalized));
}

/** Google Sheets creates a chart shell even when every series cell is blank. */
export function usableNumericSeries(
  values: unknown[][],
  seriesIndexes: number[],
): number[] {
  return seriesIndexes.filter((columnIndex) =>
    values.slice(1).some((row) => numericChartValue(row[columnIndex]))
  );
}
