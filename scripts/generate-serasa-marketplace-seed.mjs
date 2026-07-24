import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [sourcePath, targetPath, lastClosedDate = '2026-07-23'] = process.argv.slice(2);

if (!sourcePath || !targetPath) {
  throw new Error('Uso: node scripts/generate-serasa-marketplace-seed.mjs <normalized.json> <migration.sql> [lastClosedDate]');
}

const rows = JSON.parse(await readFile(sourcePath, 'utf8'));
const sourceHash = createHash('sha256').update(JSON.stringify(rows)).digest('hex');
const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;
const sqlNumber = value => value == null || !Number.isFinite(value)
  ? 'null'
  : String(Math.round(value * 1_000_000_000_000) / 1_000_000_000_000);
const sqlArray = values => values.length
  ? `array[${values.map(sqlString).join(', ')}]::text[]`
  : `'{}'::text[]`;

const values = rows.map(row => {
  const partial = row.data > lastClosedDate;
  return `  (
    ${sqlString(row.data)},
    ${sqlNumber(row.ofertas)},
    ${sqlNumber(row.pedidos)},
    ${sqlNumber(row.pedidosRateSource)},
    ${sqlNumber(row.confirmados)},
    ${sqlNumber(row.confirmadosRateSource)},
    ${sqlNumber(row.aprovados)},
    ${sqlNumber(row.aprovadosRateSource)},
    ${sqlString(partial ? 'partial' : 'complete')},
    ${sqlArray(partial ? ['current_day_open'] : [])},
    'Sum_of_Qt_oferta,_Su_1784917639732.xlsx',
    ${sqlString(sourceHash)}
  )`;
});

const sql = `insert into public.serasa_marketplace_daily_funnel (
  data,
  ofertas,
  pedidos,
  pedidos_rate_source,
  confirmados,
  confirmados_rate_source,
  aprovados,
  aprovados_rate_source,
  quality_status,
  quality_notes,
  source_file,
  source_hash
)
values
${values.join(',\n')}
on conflict (data) do update set
  ofertas = excluded.ofertas,
  pedidos = excluded.pedidos,
  pedidos_rate_source = excluded.pedidos_rate_source,
  confirmados = excluded.confirmados,
  confirmados_rate_source = excluded.confirmados_rate_source,
  aprovados = excluded.aprovados,
  aprovados_rate_source = excluded.aprovados_rate_source,
  quality_status = excluded.quality_status,
  quality_notes = excluded.quality_notes,
  source_file = excluded.source_file,
  source_hash = excluded.source_hash,
  imported_at = now();
`;

await writeFile(targetPath, sql, 'utf8');
console.log(JSON.stringify({ rows: rows.length, sourceHash, lastClosedDate, targetPath }));
