import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import ts from "typescript";

const coreCode = ts.transpileModule(
  readFileSync("src/components/insurance/insuranceCore.ts", "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  },
).outputText;
const core = await import(
  "data:text/javascript;base64," + Buffer.from(coreCode).toString("base64")
);
const admin = "11111111-1111-4111-8111-111111111111",
  viewer = "22222222-2222-4222-8222-222222222222";
function sample() {
  const summary = {};
  for (const [i, c] of ["D", "E", "F", "G", "H", "I", "J"].entries())
    summary[c + "5"] = { value: `2026-${String(i + 4).padStart(2, "0")}-01` };
  for (const offset of [0, 30])
    for (const row of Object.keys(core.METRICS))
      for (const c of ["D", "E", "F", "G", "H", "I", "J", "K"])
        summary[c + (Number(row) + offset)] = {
          value:
            Number(row) === 12 && c === "F"
              ? null
              : Number(row) === 14
                ? 0
                : 100,
        };
  return core.buildPacket([
    {
      name: "synthetic.xlsx",
      sha256: "a".repeat(64),
      storage_path: `sources/${admin}/${"a".repeat(64)}.xlsx`,
      sheets: { "Resumo Comitê": summary, "Base de disparos": {} },
    },
  ]);
}
export async function fixture() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${viewer}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.report_live_memberships(user_id uuid primary key,role text,active boolean);insert into public.report_live_memberships values('${admin}','admin',true),('${viewer}','viewer',true);
 create table public.rentabilizacao_activities(id uuid primary key);create table public.report_runs(id uuid primary key default gen_random_uuid(),report_type text,report_profile text,period_start date,period_end date,status text,run_mode text,build_status text,certification_status text,publication_status text,requested_by uuid,publication_valid boolean,run_manifest jsonb,certified_at timestamptz);create table public.report_frozen_inputs(run_id uuid primary key,inputs jsonb);create table public.report_run_sources(run_id uuid,source_key text,source_version text,row_count bigint,field_coverage jsonb,source_hash text,artifact_path text,unique(run_id,source_key));create table public.report_publications(id uuid primary key);
 create table public.gaas_vault_notes(id uuid primary key,relative_path text,content_hash text,deleted_at timestamptz);create table public.gaas_knowledge_contributions(id uuid primary key);
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;insert into storage.objects values('insurance-reports','sources/${admin}/${"a".repeat(64)}.xlsx');
 grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated;`);
  const file = readdirSync("supabase/migrations").find((f) =>
    f.endsWith("_insurance_data_foundation.sql"),
  );
  await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
  await db.exec(
    `select set_config('request.jwt.claim.sub','${admin}',false);set role authenticated;`,
  );
  const save = async (p) =>
    (
      await db.query("select public.insurance_save_snapshot($1) n", [
        JSON.stringify(p),
      ])
    ).rows[0].n;
  return { db, save };
}

test("canonical metrics preserve missing/zero and total session conversion uses common coverage", () => {
  const p = sample();
  core.validatePacket(p);
  assert.equal(
    p.metrics.find((m) => m.code === "contracts_digital").state,
    "zero_observed",
  );
  assert.equal(
    p.metrics.find((m) => m.code === "sessions" && m.period === "2026-06")
      .state,
    "missing",
  );
  assert.equal(
    p.metrics.find(
      (m) =>
        m.code === "registrations_per_session" && m.period === "window_total",
    ).value,
    1,
  );
  p.metrics[0].value = null;
  assert.throws(() => core.validatePacket(p), /INVALID_METRIC_STATE/);
});
test("database installs; repeated sources/snapshots are idempotent; raw tables are denied", async () => {
  const { db, save } = await fixture();
  try {
    const p = sample();
    const a = await save(p),
      b = await save(p);
    assert.equal(a.id, b.id);
    assert.equal(b.reused, true);
    const listed = (
      await db.query("select public.insurance_list_snapshots() n")
    ).rows[0].n;
    assert.equal(listed.length, 1);
    await assert.rejects(
      db.query("select * from growth_data.ingest_records"),
      /permission denied/,
    );
    await db.exec("reset role;");
    assert.equal(
      (await db.query("select count(*)::int n from growth_data.ingest_batches"))
        .rows[0].n,
      1,
    );
  } finally {
    await db.close();
  }
});
test("certification requires review, is audited and freezes data", async () => {
  const { db, save } = await fixture();
  try {
    const a = await save(sample());
    const s = (
      await db.query("select public.insurance_read_snapshot($1) n", [a.id])
    ).rows[0].n;
    await assert.rejects(
      db.query("select public.insurance_certify_snapshot($1,$2,$3)", [
        a.id,
        s.snapshot_hash,
        "{}",
      ]),
      /UNRESOLVED_SOURCE_ISSUE/,
    );
    const resolutions = {
      SOURCE_SCOPE_REVIEW:
        "Definições e sobreposição revisadas na fonte do teste.",
      CACHED_INPUTS_REVIEW:
        "Fórmulas e inputs conferidos no material sintético.",
    };
    await db.query("select public.insurance_certify_snapshot($1,$2,$3)", [
      a.id,
      s.snapshot_hash,
      JSON.stringify(resolutions),
    ]);
    await db.exec("reset role");
    assert.equal(
      (
        await db.query(
          "select count(*)::int n from growth_data.certification_reviews",
        )
      ).rows[0].n,
      1,
    );
    await assert.rejects(
      db.query("update growth_data.snapshots set manifest='{}' where id=$1", [
        a.id,
      ]),
      /SNAPSHOT_IMMUTABLE/,
    );
  } finally {
    await db.close();
  }
});
test("viewer cannot submit or certify; anonymous has no RPC access", async () => {
  const { db, save } = await fixture();
  try {
    await db.exec(
      `select set_config('request.jwt.claim.sub','${viewer}',false)`,
    );
    await assert.rejects(save(sample()), /ACCESS_DENIED/);
    assert.deepEqual(
      (await db.query("select public.insurance_list_snapshots() n")).rows[0].n,
      [],
    );
    await db.exec("reset role;set role anon;");
    await assert.rejects(
      db.query("select public.insurance_list_snapshots()"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
test("database rejects inconsistent states even when bypassing the UI validator", async () => {
  const { db, save } = await fixture();
  try {
    const p = sample();
    p.metrics[0].value = null;
    p.metrics[0].state = "observed";
    await assert.rejects(save(p), /INVALID_METRIC_STATE/);
  } finally {
    await db.close();
  }
});

test("version comparison distinguishes missing from observed zero", () => {
  const a = sample(),
    b = structuredClone(a);
  b.metrics[0].value = 0;
  b.metrics[0].state = "zero_observed";
  assert.equal(core.comparePackets(a, b).length, 1);
  b.metrics[0].value = null;
  b.metrics[0].state = "missing";
  assert.equal(core.comparePackets(a, b)[0].after.state, "missing");
});

test(
  "real workbook intake populates all five fact families and preserves source hashes",
  { skip: !process.env.INSURANCE_FIXTURE_DIR, timeout: 120000 },
  async () => {
    const { loadInsuranceRuntime } = await import("./insurance-export.mjs");
    const { parser } = await loadInsuranceRuntime();
    const { join } = await import("node:path");
    const names = [
      "Performance_Geral_Seguros (1).xlsx",
      "Radar_Portfolio_Afinz_Comite_Gestao_2026 1.xlsx",
    ];
    const packet = await parser.parseInsuranceFiles(
      names.map(
        (name) =>
          new File(
            [readFileSync(join(process.env.INSURANCE_FIXTURE_DIR, name))],
            name,
          ),
      ),
    );
    const { db, save } = await fixture();
    try {
      await db.exec("reset role");
      for (const source of packet.sources) {
        source.storage_path = `sources/${admin}/${source.sha256}.xlsx`;
        await db.query(
          "insert into storage.objects(bucket_id,name) values($1,$2)",
          ["insurance-reports", source.storage_path],
        );
      }
      await db.exec("set role authenticated");
      const result = await save(packet),
        same = await save(packet);
      assert.equal(result.id, same.id);
      await db.exec("reset role");
      const counts = {};
      for (const table of [
        "dispatch_facts",
        "outcome_facts",
        "traffic_facts",
        "investment_facts",
        "portfolio_observations",
      ])
        counts[table] = (
          await db.query(`select count(*)::int n from growth_data.${table}`)
        ).rows[0].n;
      assert.equal(counts.dispatch_facts, 718);
      assert.equal(counts.outcome_facts, 42);
      assert.equal(counts.traffic_facts, 14);
      assert.equal(counts.investment_facts, 28);
      assert.equal(counts.portfolio_observations, packet.portfolio.length);
      assert.ok(counts.portfolio_observations > 0);
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from public.report_run_sources",
          )
        ).rows[0].n,
        2,
      );
      assert.equal(
        (
          await db.query(
            "select count(*)::int n from public.report_frozen_inputs",
          )
        ).rows[0].n,
        1,
      );
      console.log("Real-source fact counts:", JSON.stringify(counts));
    } finally {
      await db.close();
    }
  },
);
