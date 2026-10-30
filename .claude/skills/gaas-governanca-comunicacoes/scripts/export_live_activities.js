#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const repo = path.resolve(arg('repo', process.cwd()));
const outDir = path.resolve(arg('out', path.join(repo, '..', 'outputs', 'gaas-communication-skill')));
const limit = Number(arg('limit', '5000'));
const startDate = arg('start-date', null);
const outputName = arg('output', 'live_activities_recent.json');

const clientPath = path.join(repo, 'src', 'services', 'supabaseClient.ts');
const src = fs.readFileSync(clientPath, 'utf8');
const url = src.match(/supabaseUrl = '([^']+)'/)?.[1];
const key = src.match(/supabaseKey = '([^']+)'/)?.[1];
if (!url || !key) throw new Error(`Could not extract Supabase URL/key from ${clientPath}`);

const { createClient } = require(path.join(repo, 'node_modules', '@supabase', 'supabase-js'));
const supabase = createClient(url, key);

(async () => {
  const rows = [];
  for (let from = 0; from < limit; from += 1000) {
    const to = Math.min(from + 999, limit - 1);
    let query = supabase
      .from('activities')
      .select('"Activity name / Taxonomia",jornada,"Canal","BU","Parceiro","Segmento","Data de Disparo",template_id')
      .not('"Activity name / Taxonomia"', 'is', null)
      .order('"Data de Disparo"', { ascending: false });
    if (startDate) {
      query = query.gte('"Data de Disparo"', startDate);
    }
    const { data, error } = await query.range(from, to);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, outputName);
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), 'utf8');
  console.log(JSON.stringify({
    outPath,
    rows: rows.length,
    uniqueActivityNames: new Set(rows.map((r) => r['Activity name / Taxonomia']).filter(Boolean)).size,
    startDate,
    latest: rows[0]?.['Data de Disparo'] || null,
    oldest: rows[rows.length - 1]?.['Data de Disparo'] || null
  }, null, 2));
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
