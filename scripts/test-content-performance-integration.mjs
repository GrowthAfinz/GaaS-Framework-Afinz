import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create schema gaas_sfmc_private;grant usage on schema auth,gaas_sfmc_private to authenticated;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('test.actor',true),'')::uuid$$;
create table public.activities(id uuid primary key,jornada text,"Activity name / Taxonomia" text,"Canal" text,"BU" text,template_id text,updated_at timestamptz default now());
create table communication_templates(template_id text primary key,status text);
create table communication_template_contents(id uuid primary key default gen_random_uuid(),template_id text);
create table sfmc_package_imports(id uuid primary key default gen_random_uuid(),source_scope text,file_name text,uploaded_at timestamptz default now(),status text,staged_via text,parser_version text,journeys_count integer,messages_count integer);
create table sfmc_package_messages(id uuid primary key default gen_random_uuid(),import_id uuid,payload jsonb,decision text default 'pending');
create table communications_reconciliation_proposals(message_id uuid,status text,proposed_template_id text,conflicts jsonb default '[]');
create table sfmc_journey_snapshots(id uuid,import_id uuid,journey_name text,journey_version integer);
create function gaas_sfmc_private.stage_core(jsonb,text,uuid,text) returns uuid language sql as $$select null::uuid$$;
grant select on activities,communication_templates,communication_template_contents,sfmc_package_imports,sfmc_package_messages,communications_reconciliation_proposals,sfmc_journey_snapshots to authenticated;
`);
const sql = readFileSync(
  "supabase/migrations/" +
    readdirSync("supabase/migrations").find((n) =>
      n.endsWith("_content_performance_integration.sql"),
    ),
  "utf8",
);
await db.exec(sql);
await db.exec(readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(n=>n.endsWith('_approved_proposal_auto_attribution.sql')),'utf8'));
const origin = (
  await db.query(
    "insert into sfmc_package_imports(source_scope,sfmc_bu) values('Afinz','Afinz') returning id",
  )
).rows[0].id;
await db.exec(
  "insert into communication_templates values('piece','active'),('new_piece','draft'),('other','active')",
);
const message = async (name, id) =>
  db.query(
    "insert into sfmc_package_messages(import_id,payload) values($1,$2)",
    [
      origin,
      JSON.stringify({
        journey_name: "JOR_AQS_TEST",
        activity_name: name,
        content: { channel: "E-mail" },
        utm: { af_sub3: id },
        is_optout: false,
      }),
    ],
  );
const activity = async (name, id = null, bu = "B2C") =>
  (
    await db.query(
      'insert into activities(id,jornada,"Activity name / Taxonomia","Canal","BU",template_id) values(gen_random_uuid(),$1,$2,$3,$4,$5) returning id',
      ["JOR_AQS_TEST", name, "E-mail", bu, id],
    )
  ).rows[0].id;
const linked = async (id) =>
  (await db.query("select template_id from activities where id=$1", [id]))
    .rows[0].template_id;
await message("known", "piece");
const a = await activity("known");
assert.equal(await linked(a), "piece");
assert.equal(
  (await db.query("select count(*)::int n from communication_auto_links"))
    .rows[0].n,
  1,
);
const scope = await activity("known", null, "Plurix");
assert.equal(await linked(scope), null);
const different = await activity("other_name");
assert.equal(await linked(different), null);
await message("new", "new_piece");
const pending = await activity("new");
assert.equal(await linked(pending), null);
await db.exec(
  "update communication_templates set status='active' where template_id='new_piece'",
);
assert.equal(await linked(pending), "new_piece");
// Approving a newly governed ID without af_sub3 resolves existing usages immediately.
const noId=(await db.query('insert into sfmc_package_messages(import_id,payload) values($1,$2) returning id',[origin,JSON.stringify({journey_name:'JOR_AQS_TEST',activity_name:'no_id',content:{channel:'E-mail'},utm:{},is_optout:false})])).rows[0].id;
await db.query("insert into communications_reconciliation_proposals(message_id,status,proposed_template_id) values($1,'ready','piece')",[noId]);
const beforeApproval=await activity('no_id');assert.equal(await linked(beforeApproval),null);
await db.query("update communications_reconciliation_proposals set status='applied' where message_id=$1",[noId]);assert.equal(await linked(beforeApproval),'piece');
// A new conflicting pack suspends future matching and preserves old links.
await message("known", "other");
const blocked = await activity("known");
assert.equal(await linked(blocked), null);
assert.equal(await linked(a), "piece");
const old = await activity("historic", "other");
await message("historic", "piece");
const conflict = await activity("historic");
assert.equal(await linked(conflict), null);
assert.equal(await linked(old), "other");
await db.exec(
  "select set_config('test.actor','00000000-0000-0000-0000-000000000001',false);set role authenticated",
);
const history = (await db.query("select read_sfmc_ingestion_history() v"))
  .rows[0].v;
assert.equal(history.alerts.length, 2);
assert.ok(history.imports[0].sfmc_bu === "Afinz");
await db.exec("reset role;set role anon");
await assert.rejects(
  () => db.query("select read_sfmc_ingestion_history()"),
  /permission denied/,
);
await assert.rejects(
  () => db.query("select reconcile_exact_activity_content()"),
  /permission denied/,
);
await db.close();
console.log(
  "Content performance SQL: exact match, approval, source BU, change notification, history preservation and access checks passed.",
);
