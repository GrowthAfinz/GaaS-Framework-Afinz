# Architecture & shared-helper API

## File map

| File | Role |
|---|---|
| `src/utils/crmAquisicaoMonthlyReportExport.ts` | Canonical MoM report (aba "CRM Aquisição") **and the home of all shared helpers**. Exports `buildAquisicaoCrmMonthlyReportWorkbook(ExcelJS, rawRows, start, end)` and `writeAquisicaoCrmMonthlySheet(workbook, rawRows, start, end)`. |
| `src/utils/midiaPagaMonthlyReportExport.ts` | Most complete example: Mídia Paga MoM report. `buildMidiaPagaAnalysis`, `writeMidiaPagaSheet`, `exportMidiaPagaMonthlyXlsx`, `classifyFrente`, metric helpers. Builds a 3-sheet workbook (Mídia Paga + CRM Aquisição + Diarizado). |
| `src/utils/midiaPagaDiarizadoSheet.ts` | `writeMidiaPagaDiarizadoSheet(workbook, currentRows, currentStart, maxDataDay)` — appends the Diarizado sheet (pacing cockpit + daily table). Example of a single-sheet writer. |
| `src/utils/aquisicaoCrmExcelExport.ts` | Diarized CRM export (3 sheets). Owns `fetchSupabaseRows(start, end)` (paginated `activities`) and the module-private `downloadBuffer`. Also `exportAquisicaoCrmXlsx` and `exportAquisicaoCrmMonthlyXlsx`. |
| `src/utils/rentabilizacaoCrmExcelExport.ts` | Rentabilização diarized export (cross-sell, seguros, ativação). Another multi-sheet example. |
| `src/components/RelatorioView.tsx` | The Relatório tab UI. Export buttons + `useCallback` handlers live around the "Performance campanhas" section. `periodStart`/`periodEnd` are the selected range. |
| `src/services/supabaseClient.ts` | Exports `supabase`, `supabaseUrl`, `supabaseKey`. Credentials are **hardcoded** (no `import.meta.env`) — this is why the Node validation harness can import it directly. |

## Data sources (Supabase)

- `activities` — CRM dispatches. Fetch with `fetchSupabaseRows(start, end)` (exported from `aquisicaoCrmExcelExport.ts`). Column names are human-readable with spaces/accents (`'Data de Disparo'`, `'BU'`, `'Segmento'`, `'Cartões Gerados'`, `'Custo Total Campanha'`, `'status'`, `'Etapa de aquisição'`). Access via a key-fallback getter because names vary.
- `paid_media_metrics` — paid media. Columns: `date, channel, campaign, objective, spend, impressions, clicks, conversions, reach, frequency, ad_id, ad_name, adset_id, adset_name`. `channel` is lowercase `'meta'` | `'google'`. Google rows are aggregated (no ad_name, `reach = 0`). Meta rows are per-ad.
- `b2c_daily_metrics` — B2C realized daily metrics (`data`, `tipo` in `total`/`serasa_api`). Fetched by `aquisicaoCrmExcelExport.ts`'s `fetchB2cDailyMetrics`.
- `goals` — monthly goals. Not yet a source for paid-media budgets (those are hardcoded constants in the Diarizado sheet until a `goals` source exists).

Pagination pattern (Supabase caps at 1000 rows/request): loop `.range(offset, offset+999)` until a page returns `< 1000`.

## Shared helper API (all exported from `crmAquisicaoMonthlyReportExport.ts`)

Colors — `REPORT_COLORS` (ARGB hex strings, no `#`):
`navy 1F2937 · slate 334155 · card F1F5F9 · grid CBD5E1 · lightGrid E2E8F0 · note FEF3C7 · noteText D97706 · green 059669 · red DC2626 · gray 64748B · blue 2563EB · total E2E8F0 · white FFFFFF`

Dates:
- `monthStart(date)` → first day of that month.
- `monthEnd(date)` → last day of that month.
- `previousMonthStart(date)` → first day of previous month.
- `MONTHS_PT` → `['Janeiro', ... 'Dezembro']`, index by `date.getMonth()`. Use for titles and filenames.

MoM:
- `reportDelta(current, previous): number | null` → `current/previous − 1`, or `null` if `previous` is `0`/`null` (→ renders "—", never throws).
- `reportPctText(value): string` → `"+26%"` / `"-61%"` / `"—"`.
- `styleReportDelta(cell, value, invert=false)` → colors a delta cell. `invert=false`: up=green (volumes). `invert=true`: down=green (costs/efficiency: CPC, CPM, CPL, CAC). Gray when `null`/0.

Weekly windows (proportional MoM):
- `weekWindows(date, maxDay): WeekWindow[]` → 7-day windows of the current month up to `maxDay` (`{ label, startDay, endDay, days }`).
- `previousWeekWindows(prevStart, currentWindows): WeekWindow[]` → the same windows mapped onto the previous month, clamped to its day count, so week 1 vs week 1 etc. compares like-for-like even when month lengths differ.
- `dayOfMonthReport(dateString)` → day number from a `YYYY-MM-DD` string.

Cell writing:
- `setCellValue(cell, value, { bold?, fontColor?, fill?, align?, numFmt? })` → sets value + Arial 10 + thin light borders + alignment. Every data cell goes through this.
- `writeReportHeader(ws, row, headers[])` → slate header row, white bold, wrapped, height 30.
- `writeSectionTitle(ws, row, title, columns)` → merged 14pt navy section title.

Sheet/workbook builders:
- `writeAquisicaoCrmMonthlySheet(workbook, rawRows, start, end)` → appends the "CRM Aquisição" sheet. Use to include the CRM sheet inside another report's workbook.
- `buildAquisicaoCrmMonthlyReportWorkbook(ExcelJS, rawRows, start, end)` → standalone single-sheet workbook (calls the above).

## Number formats

- Integers / counts: `'#,##0'`
- Currency (R$): `'"R$" #,##0.00'`
- Rates / percentages: `'0.00%'` — store the **raw fraction** in the cell (e.g. `clicks/impressions`), let the format multiply by 100. Do not pre-multiply.

## Visual conventions

- Worksheet view: `{ state: 'frozen', xSplit: 2, ySplit: 2, topLeftCell: 'C3', activeCell: 'C3', showGridLines: false }` (or `xSplit: 0` when there's a single label column).
- Title row 1 merged; subtitle row 2 (gray 9pt); warning box in `note`/`noteText`; sections stacked with `writeSectionTitle` + `writeReportHeader`; TOTAL row filled `total`.
- Column widths: first label column wide (24–28), metric columns ~13, delta columns ~11.
- `workbook.creator = 'GaaS AFINZ'`.

## Known limitation

ExcelJS in the browser has **no chart support**. Ported spreadsheets that relied on native line/bar charts become value/table-only. Compute the series into helper columns or a table and note the omission to the user, rather than faking a chart.
