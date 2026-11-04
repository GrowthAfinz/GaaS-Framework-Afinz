// Catalog is canonical; SQL is a reviewed, versioned deployment projection.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const catalogPath = '.claude/skills/gaas-portfolio-data-ingest/references/data-catalog.json';
const migrationPath = 'supabase/migrations/20261104171150_portfolio_knowledge_contracts.sql';
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const known = new Set(catalog.datasets.map(d => d.dataset_id));
const contracts = catalog.report_contracts;
const keys = new Set();
for (const contract of contracts) {
  const key = `${contract.query_contract}/${contract.version}`;
  if (keys.has(key)) throw new Error(`Duplicate contract: ${key}`);
  keys.add(key);
  for (const id of contract.upstream_dataset_ids) if (!known.has(id)) throw new Error(`Unknown dataset: ${id}`);
  for (const dependency of contract.note_dependencies) {
    if (dependency.relative_path.includes('..') || !dependency.relative_path.endsWith('.md')) throw new Error('Unsafe note dependency');
    if (contract.status !== 'ready' && dependency.relationship === 'consumes') throw new Error('Unimplemented contract cannot activate data blocks');
  }
}
for (const dataset of catalog.datasets) {
  if (!dataset.report_contracts.length || dataset.report_contracts.some(key => !contracts.some(c => c.query_contract === key && c.upstream_dataset_ids.includes(dataset.dataset_id)))) throw new Error(`Unmapped dataset: ${dataset.dataset_id}`);
}
const quote = value => "'" + value.replaceAll("'", "''") + "'";
const hash = createHash('sha256').update(JSON.stringify(contracts)).digest('hex');
const body = `-- catalog ${catalog.version}; contracts sha256 ${hash}\n` + contracts.map(c => `insert into growth_data.report_contracts(query_contract,version,domain,status,definition) values(${quote(c.query_contract)},${quote(c.version)},${quote(c.domain)},${quote(c.status)},${quote(JSON.stringify(c))}::jsonb);`).join('\n');
const current = readFileSync(migrationPath, 'utf8').replaceAll('\r\n', '\n');
const next = current.replace(/-- BEGIN GENERATED REPORT CONTRACTS[\s\S]*?-- END GENERATED REPORT CONTRACTS/, `-- BEGIN GENERATED REPORT CONTRACTS\n${body}\n-- END GENERATED REPORT CONTRACTS`);
if (process.argv.includes('--check')) {
  if (next !== current) throw new Error('Report contract projection drift. Run node scripts/build-portfolio-report-contracts.mjs');
} else writeFileSync(migrationPath, next);
console.log(`${contracts.length} report contracts; ${known.size} datasets; projection ${process.argv.includes('--check') ? 'verified' : 'written'}`);
