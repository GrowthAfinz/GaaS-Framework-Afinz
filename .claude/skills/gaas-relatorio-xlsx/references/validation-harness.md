# Headless validation harness

The app path (click button → browser download) can't run in a shell. But every workbook builder is a **pure function of its input rows**, and `supabaseClient.ts` has hardcoded credentials (no `import.meta.env`), so the whole module graph imports cleanly in Node. Bundle a throwaway harness with the already-installed `esbuild`, run it in Node, and assert the headline totals. This catches ExcelJS runtime errors (bad cell refs, overlapping `mergeCells`) and reconciliation failures that `tsc` can't.

## Steps

1. Write a temp harness at the repo root `calendar-estrategico/_report_validate.ts` (root so `./src/...` imports resolve). It must **not** call the `export*Xlsx` wrapper (that uses `Blob`/`document` — browser only). Instead call the pure pieces: fetch rows, `build*Analysis`, the `write*Sheet` functions on a fresh `new ExcelJS.Workbook()`, `writeFile`, then reopen and assert.
2. Bundle + run:
   ```bash
   cd calendar-estrategico
   node_modules/.bin/esbuild _report_validate.ts --bundle --platform=node --format=cjs \
     --outfile="$SCRATCH/validate.cjs" --log-level=error
   OUT_PATH="$SCRATCH/out.xlsx" node "$SCRATCH/validate.cjs"
   ```
   (`$SCRATCH` = the session scratchpad dir; keep build artifacts out of the repo.)
3. Confirm: no reconciliation throw, headline total matches the known Supabase number, all expected sheets present, edge case (a month with no M-1 → all Δ "—", no throw).
4. **Delete the harness** (`rm _report_validate.ts`) before committing. Then `npm run build` and check `tsc` is clean on the touched files.

## Template

```ts
import ExcelJS from 'exceljs';
import { supabase } from './src/services/supabaseClient';
import { buildMidiaPagaAnalysis, writeMidiaPagaSheet, FRENTE_ORDER } from './src/utils/midiaPagaMonthlyReportExport';
import { writeMidiaPagaDiarizadoSheet } from './src/utils/midiaPagaDiarizadoSheet';
import { writeAquisicaoCrmMonthlySheet, monthStart, previousMonthStart, monthEnd } from './src/utils/crmAquisicaoMonthlyReportExport';
import { fetchSupabaseRows } from './src/utils/aquisicaoCrmExcelExport';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
async function fetchPaid(start: Date, end: Date) {
  const rows: any[] = [];
  for (let o = 0; ; o += 1000) {
    const { data, error } = await supabase.from('paid_media_metrics')
      .select('date, channel, campaign, spend, impressions, clicks, conversions, reach, frequency, ad_name, adset_name')
      .gte('date', iso(start)).lte('date', iso(end)).order('date').range(o, o + 999);
    if (error) throw error; rows.push(...(data ?? [])); if (!data || data.length < 1000) break;
  }
  return rows;
}
async function main() {
  const cur = monthStart(new Date(2026, 5, 15)); // pick a month you know the totals for
  const prev = previousMonthStart(cur), end = monthEnd(cur);
  const paid = await fetchPaid(prev, end);
  const activities = await fetchSupabaseRows(prev, end);
  const analysis = buildMidiaPagaAnalysis(
    paid.filter(r => String(r.date).startsWith('2026-06')),
    paid.filter(r => String(r.date).startsWith('2026-05')), cur, end); // throws if not reconciled

  const wb = new ExcelJS.Workbook();
  writeMidiaPagaSheet(wb, analysis);
  writeAquisicaoCrmMonthlySheet(wb, activities, cur, end);
  writeMidiaPagaDiarizadoSheet(wb, analysis.currentRows, cur, analysis.maxDataDay);

  const out = process.env.OUT_PATH || './out.xlsx';
  await wb.xlsx.writeFile(out);
  console.log('sheets:', wb.worksheets.map(w => w.name).join(' | '));
  console.log('total spend:', analysis.currentTotal.spend.toFixed(2)); // assert vs known number
  const sumFrente = FRENTE_ORDER.reduce((s, f) => s + (analysis.byFrenteCurrent.get(f)?.spend ?? 0), 0);
  console.log('reconciles:', Math.abs(sumFrente - analysis.currentTotal.spend) <= 0.01);

  const re = new ExcelJS.Workbook(); await re.xlsx.readFile(out); // proves the file reopens
  console.log('OK');
}
main().catch(e => { console.error('FALHOU:', e); process.exit(1); });
```

## Confirming Supabase numbers directly

To get the expected total for the assertion, query Supabase (via the MCP tool or REST):

```sql
SELECT channel, date_trunc('month', date)::date AS mes, round(sum(spend)::numeric, 2) AS spend, sum(clicks) AS clicks
FROM paid_media_metrics WHERE date >= '2026-05-01' GROUP BY 1, 2 ORDER BY 2, 1;
```

Cross-check the harness's printed total against `Σ spend` for the month. If a data-quality question comes up (e.g. do rows with and without `ad_name` double-count?), verify with a targeted `GROUP BY date, campaign` query before trusting the sum.
