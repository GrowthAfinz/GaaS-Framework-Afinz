import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [sourcePath, targetPath, batchDirectory] = process.argv.slice(2);

if (!sourcePath || !targetPath) {
  throw new Error('Uso: node scripts/generate-serasa-bi-seed.mjs <normalized_daily.json> <migration.sql>');
}

const rawRows = JSON.parse(await readFile(sourcePath, 'utf8'));
const volumeKeys = [
  'consultasMotor',
  'cpfsUnicos',
  'aprovados',
  'ofertas',
  'pedidosCriados',
  'pedidosConfirmados',
  'cartoes',
];
const coreKeys = [
  'cpfsUnicos',
  'aprovados',
  'ofertas',
  'pedidosCriados',
  'pedidosConfirmados',
  'cartoes',
];
const rows = rawRows.filter(row => volumeKeys.some(key => row[key] != null));
const sourceHash = createHash('sha256').update(JSON.stringify(rows)).digest('hex');

const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;
const sqlNumber = value => value == null || !Number.isFinite(value) ? 'null' : String(Math.round(value * 1000000) / 1000000);
const sqlArray = values => values.length
  ? `array[${values.map(sqlString).join(', ')}]::text[]`
  : `'{}'::text[]`;

const values = rows.map(row => {
  const missing = coreKeys.filter(key => row[key] == null);
  const cardsOverConfirmed = row.cartoes != null
    && row.pedidosConfirmados != null
    && row.cartoes > row.pedidosConfirmados;
  const qualityStatus = cardsOverConfirmed ? 'suspect' : missing.length ? 'partial' : 'complete';
  const notes = [
    ...missing.map(key => `missing_${key}`),
    ...(cardsOverConfirmed ? ['cartoes_gt_pedidos_confirmados'] : []),
  ];

  return `  (
    ${sqlString(row.date)},
    ${sqlNumber(row.consultasMotor)},
    ${sqlNumber(row.cpfsUnicos)},
    ${sqlNumber(row.aprovados)},
    ${sqlNumber(row.ofertas)},
    ${sqlNumber(row.pedidosCriados)},
    ${sqlNumber(row.pedidosConfirmados)},
    ${sqlNumber(row.cartoes)},
    ${sqlNumber(row.feeCanal)},
    ${sqlNumber(row.cpa)},
    ${sqlNumber(row.custosCredito)},
    ${sqlNumber(row.custosPlastico)},
    ${sqlNumber(row.custosEnvio)},
    ${sqlNumber(row.cacCanal)},
    ${sqlString(qualityStatus)},
    ${sqlArray(notes)},
    'Integrado_diario_2026.xlsx',
    ${sqlString(row.sheet)},
    ${sqlString(sourceHash)}
  )`;
});

const buildSql = batchValues => `insert into public.serasa_bi_daily_funnel (
  data,
  consultas_motor,
  cpfs_unicos,
  aprovados_cpfs_unicos,
  ofertas_exibidas,
  pedidos_criados,
  pedidos_confirmados,
  cartoes,
  fee_canal,
  cpa,
  custos_credito,
  custos_plastico,
  custos_envio,
  cac_canal,
  quality_status,
  quality_notes,
  source_file,
  source_sheet,
  source_hash
)
values
${batchValues.join(',\n')}
on conflict (data) do update set
  consultas_motor = excluded.consultas_motor,
  cpfs_unicos = excluded.cpfs_unicos,
  aprovados_cpfs_unicos = excluded.aprovados_cpfs_unicos,
  ofertas_exibidas = excluded.ofertas_exibidas,
  pedidos_criados = excluded.pedidos_criados,
  pedidos_confirmados = excluded.pedidos_confirmados,
  cartoes = excluded.cartoes,
  fee_canal = excluded.fee_canal,
  cpa = excluded.cpa,
  custos_credito = excluded.custos_credito,
  custos_plastico = excluded.custos_plastico,
  custos_envio = excluded.custos_envio,
  cac_canal = excluded.cac_canal,
  quality_status = excluded.quality_status,
  quality_notes = excluded.quality_notes,
  source_file = excluded.source_file,
  source_sheet = excluded.source_sheet,
  source_hash = excluded.source_hash,
  imported_at = now();
`;

const sql = buildSql(values);
await writeFile(targetPath, sql, 'utf8');
if (batchDirectory) {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(batchDirectory, { recursive: true });
  for (let index = 0; index < values.length; index += 40) {
    const batch = values.slice(index, index + 40);
    const batchNumber = String(index / 40 + 1).padStart(2, '0');
    await writeFile(`${batchDirectory}/serasa-bi-${batchNumber}.sql`, buildSql(batch), 'utf8');
  }
}
console.log(JSON.stringify({ rows: rows.length, sourceHash, targetPath, batches: Math.ceil(values.length / 40) }));
