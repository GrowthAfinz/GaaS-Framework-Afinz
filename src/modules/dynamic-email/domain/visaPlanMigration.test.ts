import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import proposal from "../fixtures/visaPlanProposal.json";
const read = (name: string) =>
  readFileSync(`supabase/migrations/${name}`, "utf8");
it("inclui plano Visa como rascunho, preserva Aquisição e edições humanas ao reaplicar", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql as $$ select null::uuid $$; create role authenticated; create table dynamic_email_assets(id uuid primary key); create table dynamic_email_template_slots(id text primary key); create table dynamic_email_briefings(id uuid primary key,campaign_group_id uuid,partner text,week_key text,briefing_data jsonb);`,
    );
    const initial = read(
      "20260831190315_dynamic_email_semantic_management_v2.sql",
    );
    await db.exec(initial.slice(0, initial.indexOf("-- Backfill seguro")));
    await db.exec(
      read("20260901170233_dynamic_email_strategy_automatic_versioning.sql"),
    );
    await db.exec(
      read("20260901180000_dynamic_email_ruler_creator.sql").split(
        "create table if not exists public.dynamic_email_ruler_adaptations",
      )[0],
    );
    await db.exec(
      `alter table dynamic_email_ruler_strategies add column journey_family text, add column journey_type text;`,
    );
    await db.exec(read("20260904120000_dynamic_email_benefit_structure.sql"));
    await db.exec(
      `insert into dynamic_email_template_slots values ('builtin-vdv-pool'); insert into dynamic_email_email_strategies(campaign_group_id,partner,segment,role_in_ruler) values ('11111111-1111-4111-8111-111111111111','Dia','Topo','Plano preservado');`,
    );
    for (const plan of proposal.plans)
      await db.query(
        `insert into dynamic_email_briefings values ($1,$1,'Afinz Visa','Black Friday',$2)`,
        [
          plan.campaign_group_id,
          JSON.stringify({
            __editor: { kind: "vdv", contentVersion: "BF26_V1" },
          }),
        ],
      );
    const migration = read(
      readdirSync("supabase/migrations").find((n) =>
        n.endsWith("_visa_communication_plan.sql"),
      )!,
    );
    await db.exec(migration);
    expect(
      (
        await db.query<{ n: number }>(
          `select count(*)::int n from dynamic_email_email_strategies where partner='Afinz Visa'`,
        )
      ).rows[0].n,
    ).toBe(2);
    expect(
      (
        await db.query<{ n: number }>(
          `select count(*)::int n from dynamic_email_product_guardrails where status='draft'`,
        )
      ).rows[0].n,
    ).toBe(8);
    expect(
      (
        await db.query<{ n: number }>(
          `select count(*)::int n from dynamic_email_email_strategies where partner='Afinz Visa' and editorial_status='draft' and certification_status='not_tested' and updated_by_type='system' and field_provenance->>'roleInRuler' like '[P]%'`,
        )
      ).rows[0].n,
    ).toBe(2);
    await db.query(
      `update dynamic_email_email_strategies set role_in_ruler='Revisado pelo operador' where id=$1`,
      [proposal.plans[0].id],
    );
    await db.exec(migration);
    expect(
      (
        await db.query(
          `select role_in_ruler,version from dynamic_email_email_strategies where id=$1`,
          [proposal.plans[0].id],
        )
      ).rows[0],
    ).toEqual({ role_in_ruler: "Revisado pelo operador", version: 2 });
    expect(
      (
        await db.query<{ role_in_ruler: string }>(
          `select role_in_ruler from dynamic_email_email_strategies where partner='Dia'`,
        )
      ).rows[0].role_in_ruler,
    ).toBe("Plano preservado");
    expect(
      (
        await db.query<{ n: number }>(
          `select count(*)::int n from dynamic_email_product_contexts`,
        )
      ).rows[0].n,
    ).toBe(1);
  } finally {
    await db.close();
  }
}, 30000);
