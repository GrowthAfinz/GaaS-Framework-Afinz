import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { sha256 } from "./knowledgePack";

const owner = "11111111-1111-4111-8111-111111111111",
  member = "22222222-2222-4222-8222-222222222222";
const pack = "33333333-3333-4333-8333-333333333333",
  sync = "44444444-4444-4444-8444-444444444444";
const db = new PGlite();
let contribution: string;
let base: string;
let next: string;
async function asUser(id: string) {
  await db.exec(
    `reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`,
  );
}
beforeAll(async () => {
  base = await sha256("# Original");
  next = await sha256("# Proposta");
  await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);
  insert into auth.users values('${owner}'),('${member}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  grant usage on schema auth,public to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;
  create table public.report_live_memberships(user_id uuid,email text,active boolean,role text);
  insert into public.report_live_memberships values('${owner}','pablo.castro@afinz.com.br',true,'admin');
  create table public.gaas_vault_sync_runs(id uuid primary key,vault_key text,status text,started_at timestamptz,completed_at timestamptz);
  insert into public.gaas_vault_sync_runs values('${sync}','afinz-crm-midia','completed',now()-interval '1 day',now()-interval '1 day');
  create table public.gaas_vault_notes(id uuid default gen_random_uuid(),vault_key text,relative_path text,content_markdown text,content_hash text,deleted_at timestamptz,last_sync_run_id uuid,search_vector text);
  insert into public.gaas_vault_notes(vault_key,relative_path,content_markdown,content_hash,last_sync_run_id) values('afinz-crm-midia','01-Conceitos/Teste.md','# Original','${base}','${sync}');
  grant select on public.gaas_vault_notes,public.gaas_vault_sync_runs to authenticated;`);
  await db.exec(`create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
  grant usage on schema storage to authenticated,anon;grant select,insert,delete on storage.objects to authenticated;`);
  await db.exec(
    readFileSync(
      new URL(
        "../../../../supabase/migrations/20261022161253_knowledge_exchange.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await db.close();
});
describe.sequential("knowledge exchange authorization and lifecycle", () => {
  it("denies anonymous read and snapshot access", async () => {
    await db.exec("set role anon");
    await expect(
      db.query("select * from public.gaas_knowledge_packs"),
    ).rejects.toThrow("permission denied");
    await expect(
      db.query("select public.gaas_knowledge_snapshot()"),
    ).rejects.toThrow("permission denied");
  });
  it("allows a member to create an attributed package and submit an immutable proposal", async () => {
    await asUser(member);
    const manifest = {
      id: pack,
      schema: "gaas-knowledge-pack/1",
      notes: [{ path: "01-Conceitos/Teste.md", hash: base }],
    };
    await db.query(
      "insert into public.gaas_knowledge_packs(id,title,manifest,storage_path) values($1,$2,$3,$4)",
      [pack, "Contexto", manifest, `${member}/${pack}.zip`],
    );
    const changes = [
      {
        path: "01-Conceitos/Teste.md",
        base_hash: base,
        markdown: "# Proposta",
        expected_hash: next,
      },
    ];
    const result = await db.query<{ id: string }>(
      "select public.gaas_knowledge_submit($1,$2,$3,$4) as id",
      [pack, "Atualizar regra", "Evidência revisável", changes],
    );
    contribution = result.rows[0].id;
    await expect(
      db.query("select public.gaas_knowledge_submit($1,$2,$3,$4)", [
        pack,
        "Duplicada",
        "Motivo",
        changes,
      ]),
    ).rejects.toThrow("knowledge_duplicate_contribution");
    await expect(
      db.query(
        "update public.gaas_knowledge_contributions set changes='[]' where id=$1",
        [contribution],
      ),
    ).rejects.toThrow("permission denied");
    expect(
      (
        await db.query<{ status: string }>(
          "select status from public.gaas_knowledge_contributions",
        )
      ).rows[0].status,
    ).toBe("pending");
  });
  it("rejects reviewer impersonation and malformed contribution paths", async () => {
    await asUser(member);
    await expect(
      db.query("select public.gaas_knowledge_review($1,'approved','')", [
        contribution,
      ]),
    ).rejects.toThrow("knowledge_reviewer_required");
    await expect(
      db.query("insert into public.gaas_knowledge_reviewers values($1)", [
        member,
      ]),
    ).rejects.toThrow("permission denied");
    await expect(
      db.query("select public.gaas_knowledge_submit($1,$2,$3,$4)", [
        pack,
        "Inválida",
        "Motivo",
        [
          {
            path: "../a.md",
            base_hash: null,
            markdown: "# Proposta",
            expected_hash: next,
          },
        ],
      ]),
    ).rejects.toThrow("knowledge_invalid_path");
  });
  it("approval preserves original notes and cannot be confused with incorporation", async () => {
    await asUser(owner);
    await db.query(
      "select public.gaas_knowledge_review($1,'approved','Revisado')",
      [contribution],
    );
    expect(
      (
        await db.query<{ content_markdown: string }>(
          "select content_markdown from public.gaas_vault_notes",
        )
      ).rows[0].content_markdown,
    ).toBe("# Original");
    await expect(
      db.query("select public.gaas_knowledge_review($1,'incorporated','')", [
        contribution,
      ]),
    ).rejects.toThrow("knowledge_not_yet_incorporated");
  });
  it("requires a completed sync after approval and records an append-only audit trail", async () => {
    await db.exec("reset role");
    await db.exec(
      `update public.gaas_vault_notes set content_hash='${next}',content_markdown='# Proposta';`,
    );
    await asUser(owner);
    await expect(
      db.query("select public.gaas_knowledge_review($1,'incorporated','')", [
        contribution,
      ]),
    ).rejects.toThrow("knowledge_not_yet_incorporated");
    await db.exec(
      `reset role;insert into public.gaas_vault_sync_runs values('55555555-5555-4555-8555-555555555555','afinz-crm-midia','completed',now(),now());update public.gaas_vault_notes set last_sync_run_id='55555555-5555-4555-8555-555555555555';`,
    );
    await asUser(owner);
    await db.query(
      "select public.gaas_knowledge_review($1,'incorporated','Confirmado')",
      [contribution],
    );
    expect(
      (
        await db.query<{ status: string }>(
          "select status from public.gaas_knowledge_contributions",
        )
      ).rows[0].status,
    ).toBe("incorporated");
    expect(
      (
        await db.query(
          "select * from public.gaas_knowledge_contribution_events",
        )
      ).rows,
    ).toHaveLength(3);
    await expect(
      db.query("delete from public.gaas_knowledge_contribution_events"),
    ).rejects.toThrow("permission denied");
  });
  it("keeps registered archives immutable and prevents writing under another user", async () => {
    await asUser(member);
    await expect(
      db.query("insert into storage.objects(bucket_id,name) values($1,$2)", [
        "gaas-knowledge-packs",
        `${owner}/${pack}.zip`,
      ]),
    ).rejects.toThrow("row-level security");
    await db.query(
      "insert into storage.objects(bucket_id,name) values($1,$2)",
      ["gaas-knowledge-packs", `${member}/${pack}.zip`],
    );
    await db.query("delete from storage.objects where name=$1", [
      `${member}/${pack}.zip`,
    ]);
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(
      1,
    );
    await db.exec("reset role;set role anon");
    await expect(db.query("select * from storage.objects")).rejects.toThrow(
      "permission denied",
    );
  });
  it("returns the complete snapshot and detects unfinished sync revisions", async () => {
    await db.exec(`reset role;insert into public.gaas_vault_notes(vault_key,relative_path,content_markdown,content_hash,last_sync_run_id)
    select 'afinz-crm-midia','01-Conceitos/Nota-'||i||'.md','# Nota','hash','${sync}' from generate_series(1,404) i;`);
    await asUser(member);
    const result = await db.query<{
      snapshot: { notes: unknown[]; stable: boolean };
    }>("select public.gaas_knowledge_snapshot() as snapshot");
    expect(result.rows[0].snapshot.notes).toHaveLength(405);
    expect(result.rows[0].snapshot.stable).toBe(true);
    await db.exec(
      `reset role;insert into public.gaas_vault_sync_runs values('66666666-6666-4666-8666-666666666666','afinz-crm-midia','running',now(),null);`,
    );
    await asUser(member);
    expect(
      (
        await db.query<{ snapshot: { stable: boolean } }>(
          "select public.gaas_knowledge_snapshot() as snapshot",
        )
      ).rows[0].snapshot.stable,
    ).toBe(false);
  });
});
