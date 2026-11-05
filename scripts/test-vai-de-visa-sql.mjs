import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;create table public.dynamic_email_template_slots(id text primary key,name text,source text,is_principal boolean,status text,version integer);`,
);
const sql = readFileSync(
  "supabase/migrations/20261105211607_dynamic_email_vai_de_visa.sql",
  "utf8",
);
await db.exec(sql);
await db.exec(sql);
await db.exec(
  `set role authenticated;set test.uid='11111111-1111-1111-1111-111111111111';`,
);
const item = {
  id: "TEST_OFFER",
  tipo: "OFERTA",
  ativa: true,
  marca: "Marca teste",
  valor: "10%",
  link: "https://example.com",
  resgate: "LINK",
  source: "gaas",
  expected_version: 0,
};
// Os campos vazios precisam acompanhar o payload, como no serviço do app.
const cols = JSON.parse(
  readFileSync(
    "src/modules/dynamic-email/fixtures/vdvBF26V1.csv.ts",
    "utf8",
  ).match(/VDV_BRIEFING_CSV = (.*);/)[1],
)
  .split(/\r?\n/)[0]
  .split(",");
for (const c of cols)
  if (!(c.toLowerCase() in item)) item[c.toLowerCase()] = "";
let row = (
  await db.query("select * from save_vdv_briefing($1::jsonb)", [
    JSON.stringify([item]),
  ])
).rows[0];
assert.equal(row.version, 1);
assert.equal(row.created_by, "11111111-1111-1111-1111-111111111111");
row = (
  await db.query("select * from save_vdv_briefing($1::jsonb)", [
    JSON.stringify([{ ...item, expected_version: 1, valor: "20%" }]),
  ])
).rows[0];
assert.equal(row.version, 2);
await assert.rejects(
  db.query("select * from save_vdv_briefing($1::jsonb)", [
    JSON.stringify([{ ...item, expected_version: 1 }]),
  ]),
  /Conflito/,
);
await assert.rejects(
  db.query("select * from save_vdv_briefing($1::jsonb)", [
    JSON.stringify([
      { ...item, expected_version: 2, valor: "30%" },
      { ...item, id: "BAD", expected_version: 7 },
    ]),
  ]),
  /Conflito/,
);
assert.equal(
  (await db.query("select valor from dynamic_email_vdv_briefing")).rows[0]
    .valor,
  "20%",
);
const mov = {
  versao: "BF26_V1",
  grupo: "MODA",
  celula: "TODAS",
  posicao: 1,
  oferta_id: "TEST_OFFER",
  ativa: true,
  source: "import",
  expected_version: 0,
};
assert.equal(
  (
    await db.query("select * from save_vdv_movimento($1::jsonb)", [
      JSON.stringify([mov]),
    ])
  ).rows[0].version,
  1,
);
await db.exec("reset role;set role anon;");
await assert.rejects(
  db.query("select * from dynamic_email_vdv_briefing"),
  /permission denied/,
);
await assert.rejects(
  db.query("select * from save_vdv_briefing($1::jsonb)", [
    JSON.stringify([item]),
  ]),
  /permission denied/,
);
await db.exec("reset role;set role authenticated;set test.uid='';");
assert.equal(
  (await db.query("select * from dynamic_email_vdv_briefing")).rows.length,
  0,
);
await assert.rejects(
  db.query("select * from save_vdv_briefing($1::jsonb)", [
    JSON.stringify([item]),
  ]),
  /Sessão/,
);
await db.close();
console.log(
  "Migration idempotente, RLS, auditoria, lotes atômicos e conflitos de versão: OK",
);
