# Copy-ready patterns

All snippets assume helpers imported from `crmAquisicaoMonthlyReportExport`.

## 1. Frente classification (Mídia Paga) — precedence is exact

Classify **only** by the campaign-name tag, never by `objective` (dirty field). Order matters — first match wins.

```ts
export type MidiaFrente = 'Aquisição B2C' | 'Aquisição Plurix' | 'Marca B2C (Copa)' | 'Seguros';

export function classifyFrente(campaign: unknown): MidiaFrente {
  const c = String(campaign ?? '');
  if (/COPA|RENTABILIZA|LP_Visa|DISPLAY_B2C_VISA|\[Demand\]|\[Youtube\]/i.test(c)) return 'Marca B2C (Copa)';
  if (/\[SEGUROS\]/i.test(c)) return 'Seguros';
  if (/\[PLURIX\]|mais_amigo/i.test(c)) return 'Aquisição Plurix';
  return 'Aquisição B2C'; // [B2C], App_Install, Download App, [PMAX], resto
}
```

KPI-herói per frente (do not mix): B2C→CPC, Plurix→CPC, Marca→CPM, Seguros→CPL.

## 2. Derived metrics (divide-by-zero → null → "—")

```ts
const cpc = (m) => (m.clicks ? m.spend / m.clicks : null);
const cpm = (m) => (m.impressions ? (m.spend / m.impressions) * 1000 : null);
const ctr = (m) => (m.impressions ? m.clicks / m.impressions : null); // raw fraction, format 0.00%
const cpl = (m) => (m.conversions ? m.spend / m.conversions : null);  // only where a lead is the KPI
const frequency = (m) => (m.reach ? m.impressions / m.reach : null);  // Google reach=0 → null
```

## 3. Paginated fetch (paid_media_metrics; activities via fetchSupabaseRows)

```ts
async function fetchPaidMediaRows(start: Date, end: Date) {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from('paid_media_metrics')
      .select('date, channel, campaign, spend, impressions, clicks, conversions, reach, frequency, ad_name, adset_name')
      .gte('date', isoDate(start)).lte('date', isoDate(end))
      .order('date', { ascending: true })
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}
// isoDate: build manually `${y}-${mm}-${dd}` (avoid toISOString timezone off-by-one).
```

## 4. Analysis + reconciliation gate

Initialize fixed categories (e.g. the 4 frentes) so structure is stable even when a category has no rows. Aggregate M and M-1. Then **throw if totals don't reconcile** — this is what guarantees the file is never wrong:

```ts
const EPS = 0.01;
const near = (a: number, b: number) => Math.abs(a - b) <= EPS;
const spendByFrente   = FRENTE_ORDER.reduce((s, f) => s + (byFrenteCur.get(f)?.spend ?? 0), 0);
const spendByPlatform = [...byPlatformCur.values()].reduce((s, m) => s + m.spend, 0);
const spendWeekly     = FRENTE_ORDER.reduce((s, f) => s + weeklyCur.get(f)!.reduce((i, m) => i + m.spend, 0), 0);
const clicksWeekly    = FRENTE_ORDER.reduce((s, f) => s + weeklyCur.get(f)!.reduce((i, m) => i + m.clicks, 0), 0);
if (!near(spendByFrente, total.spend) || !near(spendByPlatform, total.spend)
  || !near(spendWeekly, total.spend) || !near(clicksWeekly, total.clicks)) {
  throw new Error('Validação falhou: totais de mídia paga não reconciliam.');
}
```

## 5. Weekly pacing with proportional MoM

```ts
const currentWindows = weekWindows(currentStart, Math.min(maxDataDay, monthEnd(currentStart).getDate()));
const prevWindows    = previousWeekWindows(previousMonthStart(currentStart), currentWindows);
// bucket each row: findIndex(w => row.day >= w.startDay && row.day <= w.endDay)
// header: ['Frente', ...windows.flatMap(w => [w.label, `MoM ${w.label}`]), 'Total', 'Variação total MoM']
```

## 6. A section writer (value + Δ per metric, TOTAL row)

```ts
function writeFrenteTable(ws, startRow, a): number {
  const headers = ['Frente','Investimento','Δ','Impressões','Δ','Alcance','Δ','Cliques','Δ','CTR','Δ','CPC (R$)','Δ','CPM (R$)','Δ','KPI-herói'];
  writeSectionTitle(ws, startRow, 'POR FRENTE — todas as métricas com Δ MoM', headers.length);
  writeReportHeader(ws, startRow + 1, headers);
  [...FRENTE_ORDER, 'TOTAL'].forEach((key, i) => {
    const r = startRow + 2 + i;
    const cur = key === 'TOTAL' ? a.totalCur : a.byFrenteCur.get(key)!;
    const prev = key === 'TOTAL' ? a.totalPrev : a.byFrentePrev.get(key)!;
    // setCellValue for each value with the right numFmt; then for each Δ column:
    // styleReportDelta(ws.getCell(r, deltaCol), reportDelta(curMetric, prevMetric), isCostMetric);
    // TOTAL row: fill REPORT_COLORS.total; recompute CTR/CPC/CPM from the aggregate, not by averaging rows.
  });
  return startRow + FRENTE_ORDER.length + 1 + 3; // next free row (blank gap)
}
```

## 7. Wrapper (fetch M + M-1, build, download)

```ts
export async function exportMidiaPagaMonthlyXlsx(start: Date, end: Date) {
  const currentStart = monthStart(start);
  const prevStart = previousMonthStart(currentStart);
  const currentEnd = end >= currentStart ? end : monthEnd(currentStart);
  const paidRaw = await fetchPaidMediaRows(prevStart, currentEnd);
  const currentRaw  = paidRaw.filter(r => String(r.date).startsWith(mediaMonthKey(currentStart)));
  const previousRaw = paidRaw.filter(r => String(r.date).startsWith(mediaMonthKey(prevStart)));
  const analysis = buildMidiaPagaAnalysis(currentRaw, previousRaw, currentStart, currentEnd); // throws if not reconciled

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.default.Workbook();
  workbook.creator = 'GaaS AFINZ';
  writeMidiaPagaSheet(workbook, analysis);
  // optional extra sheets:
  // writeAquisicaoCrmMonthlySheet(workbook, activityRows, currentStart, currentEnd);
  // writeMidiaPagaDiarizadoSheet(workbook, analysis.currentRows, currentStart, analysis.maxDataDay);

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(buffer, `Report_${MONTHS_PT[currentStart.getMonth()]}_MidiaPaga.xlsx`);
  return { rows: currentRaw.length, filename: `Report_${MONTHS_PT[currentStart.getMonth()]}_MidiaPaga.xlsx` };
}
```

`downloadBuffer` is module-private in `aquisicaoCrmExcelExport.ts`; duplicate its ~8 lines locally rather than exporting it, to avoid touching that file:

```ts
function downloadBuffer(buffer: BlobPart, filename: string): void {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}
```

## 8. Button + handler in RelatorioView.tsx

Four edits, cloning the CRM-monthly pattern:

```tsx
// import
import { exportMidiaPagaMonthlyXlsx } from '../utils/midiaPagaMonthlyReportExport';

// state (near the other isExporting* flags)
const [isExportingMidiaPagaMonthly, setIsExportingMidiaPagaMonthly] = useState(false);

// handler (near exportAquisicaoCrmMonthly)
const exportMidiaPagaMonthly = useCallback(async () => {
  const start = new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate());
  const end = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), periodEnd.getDate());
  setIsExportingMidiaPagaMonthly(true);
  try { await exportMidiaPagaMonthlyXlsx(start, end); }
  catch (error) {
    console.error('Erro ao exportar XLSX mensal de Mídia Paga', error);
    window.alert('Não foi possível gerar o XLSX mensal de Mídia Paga. Verifique a conexão com a base de dados e tente novamente.');
  } finally { setIsExportingMidiaPagaMonthly(false); }
}, [periodEnd, periodStart]);

// button (next to the CRM monthly button; gate with {!rentab && ...}; distinct accent)
<button onClick={exportMidiaPagaMonthly} disabled={isExportingMidiaPagaMonthly}
  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm transition-colors hover:border-violet-300 hover:bg-violet-100 disabled:cursor-wait disabled:opacity-60"
  title="Exportar relatório mensal de Mídia Paga com MoM">
  <FileSpreadsheet size={14} />
  {isExportingMidiaPagaMonthly ? 'Gerando mídia paga...' : 'Exportar XLSX Mídia Paga - Mensal'}
</button>
```

## 8b. Pablo's style preferences (validated jul/2026 — apply to every report)

- **Clean, no AI prose.** No source subtitle, no long yellow warning boxes, no explanatory footer. Title + data only. Section titles are short with no explanatory suffix: `Resultados por Objetivo`, not `POR FRENTE — todas as métricas com Δ MoM`.
- **Full names, never abbreviations** in headers/labels/creative names (`Investimento`, `Frequência` — not `Investim.`, `Freq.`).
- **Comparatives show both months' absolute values, not just the Δ.** Each metric becomes three columns: `<Metric> <CurMonth> | <Metric> <PrevMonth> | Δ` (e.g. `Investimento Junho | Investimento Maio | Δ`). Reuse the `writeComparativeRow` + `comparativeHeaders` helpers and a `MetricSpec[]` per table (see `midiaPagaMonthlyReportExport.ts`). Weekly tables show `curWindow.label | prevWindow.label | Δ` per week. Robust in dimensions, but precise.
- **Colored table headers, organized by theme** (metas/pacing, main result, weekly, channels, creative — one color each). Use a local `writeColoredHeader(ws,row,headers,fill)` / `writeColoredTitle(ws,row,title,cols,color)` instead of the slate `writeReportHeader`.
- Approved section names: Realizado vs Meta · Resultados por Objetivo · SEMANAL — INVESTIMENTO · SEMANAL — CLIQUES · INVESTIMENTO / PLATAFORMA · GOOGLE ADS · PERFORMANCE POR CRIATIVO - GRUPO DE ANÚNCIO · EFICIÊNCIA SEMANAL · LEITURA DO MÊS.
- **Aquisição B2C funnel**: split conversions into **Instalações** (installs) and **Start Trial** (In-app trials started) — the Onboarding campaign (`/onboarding/i`) optimizes for trials, others for installs. Show a weekly B2C block: `Semana | Investimento | Impressões | CPM | Cliques | CPC | CTR | Instalações | CPI | Start Trial | Custo/Trial`, with rows `TOTAL <CurMonth>` / `TOTAL <PrevMonth>` / `Δ MoM` (see `writeB2CFunnelTable`). CPI = spend/installs, Custo/Trial = spend/trials (both over the frente's full spend, matching the Cowork layout).
- **XLSX export center**: the export buttons (Aquisição diarizado, Rentabilização diarizado, Aquisição mensal, Mídia Paga+CRM mensal) live in a dedicated `reportMode === 'xlsx'` tab ("XLSX Reports") in `RelatorioView.tsx`, organized into "Mensais (MoM)" and "Diarizados" card groups — not scattered in the Performance header.
- Creative section: grouped by **Grupo de Anúncio (adset) × Objetivo** with full creative names; Seguros splits into Mulher/Residência via adset. Needs ad-level ingestion in `paid_media_metrics` (adset_name/ad_name populated). **Heads-up:** an external ingestion pipeline owns this table and may overwrite manual inserts — check `created_at` and daily coverage before trusting a manual backfill.

## 9. Optional value-add sections (the "especialista" layer)

When the user wants the report to go beyond raw tables, add these as **extra sections at the end** without touching the required order/columns:
- **Leitura do mês** — a box of 3–5 deterministic bullets (biggest CPC drop/rise per frente, biggest budget mover MoM, Marca frequency > 3 saturation flag, Seguros CPL vs prev, ad-coverage < 95%). No LLM — pure computed strings, so it regenerates identically.
- **Eficiência semanal do KPI-herói** — hero KPI (CPC/CPM/CPL) per week × frente with inverted MoM, to spot creative/auction fatigue inside the month.
- **Cobertura nível anúncio** — `spendComAd / spendMeta`; flag amber if < 95%. A cheap data-integrity check that the ads are being ingested into Supabase.
