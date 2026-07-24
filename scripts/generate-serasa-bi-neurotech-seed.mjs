import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const [sourcePath, targetPath, csvTargetPath, lastClosedDate = '2026-07-23', batchDirectory] = process.argv.slice(2);

if (!sourcePath || !targetPath) {
  throw new Error('Uso: node scripts/generate-serasa-bi-neurotech-seed.mjs <source.tsv> <migration.sql> [legacy.csv] [lastClosedDate]');
}

const sourceText = await readFile(sourcePath, 'utf8');
const lines = sourceText.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
const header = lines[0].split('\t').map(value => value.trim());
const expectedHeader = [
  'Data',
  'Consultas Neurotech',
  'Aprovados Neurotech',
  'Pedidos Confirmados',
  'Env. da Foto Biometria',
  'Env. Documento',
  'Assinatura do Cartão',
  'Total Emitidos',
];

if (header.length !== expectedHeader.length || header.some((value, index) => value !== expectedHeader[index])) {
  throw new Error(`Cabeçalho inesperado: ${header.join(' | ')}`);
}

const parseInteger = value => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replaceAll('.', ''));
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`Volume inválido: ${value}`);
  return parsed;
};
const isoDate = value => {
  const [day, month, year] = value.split('/').map(Number);
  if (!day || !month || !year) throw new Error(`Data inválida: ${value}`);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
const rows = lines.slice(1).map((line, index) => {
  const values = line.split('\t');
  if (values.length !== expectedHeader.length) {
    throw new Error(`Linha ${index + 2} possui ${values.length} colunas; esperado ${expectedHeader.length}.`);
  }
  return {
    sourceDate: values[0],
    data: isoDate(values[0]),
    consultasNeurotech: parseInteger(values[1]),
    aprovadosNeurotech: parseInteger(values[2]),
    pedidosConfirmados: parseInteger(values[3]),
    envFotoBiometria: parseInteger(values[4]),
    envDocumento: parseInteger(values[5]),
    assinaturaCartao: parseInteger(values[6]),
    totalEmitidos: parseInteger(values[7]),
  };
});

const dates = new Set(rows.map(row => row.data));
if (dates.size !== rows.length) throw new Error('A fonte possui datas duplicadas.');
for (let index = 1; index < rows.length; index += 1) {
  const previous = new Date(`${rows[index - 1].data}T12:00:00`);
  previous.setDate(previous.getDate() + 1);
  if (rows[index].data !== previous.toISOString().slice(0, 10)) {
    throw new Error(`Lacuna entre ${rows[index - 1].data} e ${rows[index].data}.`);
  }
}

const sourceHash = createHash('sha256').update(sourceText).digest('hex');
const sqlString = value => `'${String(value).replaceAll("'", "''")}'`;
const sqlNumber = value => value == null ? 'null' : String(value);
const sqlArray = values => values.length
  ? `array[${values.map(sqlString).join(', ')}]::text[]`
  : `'{}'::text[]`;
const values = rows.map(row => {
  const notes = [];
  if (row.envFotoBiometria == null) notes.push('missing_env_foto_biometria');
  if (row.envDocumento == null) notes.push('missing_env_documento');
  if (row.assinaturaCartao == null) notes.push('missing_assinatura_cartao');
  if (row.data > lastClosedDate) notes.push('current_day_open');
  if ((row.consultasNeurotech === 0 || row.aprovadosNeurotech === 0) && row.pedidosConfirmados > 0) {
    notes.push('upstream_zero_with_downstream_volume');
  }
  const qualityStatus = notes.length ? 'partial' : 'complete';
  return `  (
    ${sqlString(row.data)},
    ${sqlNumber(row.consultasNeurotech)},
    ${sqlNumber(row.aprovadosNeurotech)},
    ${sqlNumber(row.pedidosConfirmados)},
    ${sqlNumber(row.envFotoBiometria)},
    ${sqlNumber(row.envDocumento)},
    ${sqlNumber(row.assinaturaCartao)},
    ${sqlNumber(row.totalEmitidos)},
    ${sqlString(qualityStatus)},
    ${sqlArray(notes)},
    'pasted-text.txt',
    ${sqlString(sourceHash)}
  )`;
});

const buildSql = batchValues => `insert into public.serasa_bi_neurotech_daily_funnel (
  data,
  consultas_neurotech,
  aprovados_neurotech,
  pedidos_confirmados,
  env_foto_biometria,
  env_documento,
  assinatura_cartao,
  total_emitidos,
  quality_status,
  quality_notes,
  source_file,
  source_hash
)
values
${batchValues.join(',\n')}
on conflict (data) do update set
  consultas_neurotech = excluded.consultas_neurotech,
  aprovados_neurotech = excluded.aprovados_neurotech,
  pedidos_confirmados = excluded.pedidos_confirmados,
  env_foto_biometria = excluded.env_foto_biometria,
  env_documento = excluded.env_documento,
  assinatura_cartao = excluded.assinatura_cartao,
  total_emitidos = excluded.total_emitidos,
  quality_status = excluded.quality_status,
  quality_notes = excluded.quality_notes,
  source_file = excluded.source_file,
  source_hash = excluded.source_hash,
  imported_at = now();
`;
const sql = buildSql(values);
await writeFile(targetPath, sql, 'utf8');

if (batchDirectory) {
  const { mkdir } = await import('node:fs/promises');
  await mkdir(batchDirectory, { recursive: true });
  for (let index = 0; index < values.length; index += 40) {
    const batchNumber = String(index / 40 + 1).padStart(2, '0');
    await writeFile(
      `${batchDirectory}/serasa-bi-neurotech-${batchNumber}.sql`,
      buildSql(values.slice(index, index + 40)),
      'utf8',
    );
  }
}

if (csvTargetPath) {
  const formatSourceInteger = value => value == null ? '' : value.toLocaleString('pt-BR');
  const totals = rows.reduce((acc, row) => ({
    consultasNeurotech: acc.consultasNeurotech + row.consultasNeurotech,
    aprovadosNeurotech: acc.aprovadosNeurotech + row.aprovadosNeurotech,
    pedidosConfirmados: acc.pedidosConfirmados + row.pedidosConfirmados,
    envFotoBiometria: acc.envFotoBiometria + (row.envFotoBiometria ?? 0),
    envDocumento: acc.envDocumento + (row.envDocumento ?? 0),
    assinaturaCartao: acc.assinaturaCartao + (row.assinaturaCartao ?? 0),
    totalEmitidos: acc.totalEmitidos + row.totalEmitidos,
  }), {
    consultasNeurotech: 0,
    aprovadosNeurotech: 0,
    pedidosConfirmados: 0,
    envFotoBiometria: 0,
    envDocumento: 0,
    assinaturaCartao: 0,
    totalEmitidos: 0,
  });
  const csvRows = [
    expectedHeader.join(';'),
    ...rows.map(row => [
      row.sourceDate,
      formatSourceInteger(row.consultasNeurotech),
      formatSourceInteger(row.aprovadosNeurotech),
      formatSourceInteger(row.pedidosConfirmados),
      formatSourceInteger(row.envFotoBiometria),
      formatSourceInteger(row.envDocumento),
      formatSourceInteger(row.assinaturaCartao),
      formatSourceInteger(row.totalEmitidos),
    ].join(';')),
    ['Total', ...Object.values(totals).map(formatSourceInteger)].join(';'),
  ];
  await writeFile(csvTargetPath, `${csvRows.join('\n')}\n`, 'utf8');
}

console.log(JSON.stringify({
  rows: rows.length,
  firstDate: rows.at(0)?.data,
  lastDate: rows.at(-1)?.data,
  partialRows: rows.filter(row =>
    row.data > lastClosedDate
    || row.envFotoBiometria == null
    || row.envDocumento == null
    || row.assinaturaCartao == null).length,
  sourceHash,
  batches: batchDirectory ? Math.ceil(values.length / 40) : 0,
}));
