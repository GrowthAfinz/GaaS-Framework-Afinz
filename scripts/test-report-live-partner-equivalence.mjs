import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { resolvePartner } from "../supabase/functions/report-sync/report-live-engine.ts";

const cases = [
  { partner: "Serasa", bu: "B2C", activity: "qualquer", journey: "qualquer" },
  { partner: "Avenida", bu: "Plurix", activity: "plu_abc", journey: "qualquer" },
  { partner: "N/A", bu: "B2C", activity: "comum", journey: "qualquer" },
  { partner: "n/a", bu: "B2C", activity: "comum", journey: "qualquer" },
  { partner: "  N/A  ", bu: "B2C", activity: "comum", journey: "qualquer" },
  { partner: "", bu: "B2C", activity: "comum", journey: "qualquer" },
  { partner: null, bu: "B2C", activity: "comum", journey: "qualquer" },
  { partner: null, bu: "Plurix", activity: "plu_abc", journey: null },
  { partner: null, bu: "Plurix", activity: "afz_x_grl_y", journey: "PLURIX_CARRINHO" },
  { partner: null, bu: "Plurix", activity: "afz_x_grl_y", journey: "NAO_TEM" },
  { partner: null, bu: "Plurix", activity: "xplu_abc", journey: null },
  { partner: null, bu: "B2C", activity: "abc_institucional_xyz", journey: null },
  { partner: null, bu: "B2C", activity: "abc_inst_xyz", journey: null },
  { partner: null, bu: "B2C", activity: "abc_instalacao_xyz", journey: null },
  { partner: null, bu: "", activity: "comum", journey: null },
  { partner: null, bu: "Seguros", activity: "comum", journey: null },
];

const sqlLiteral = (value) => value === null
  ? "null"
  : `'${String(value).replaceAll("'", "''")}'`;

function psql(args, input) {
  const dockerContainer = process.env.PARTNER_EQUIVALENCE_DOCKER_CONTAINER;
  const command = dockerContainer ? "docker" : "psql";
  const commandArgs = dockerContainer
    ? ["exec", "-i", dockerContainer, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres", ...args]
    : ["-X", "-v", "ON_ERROR_STOP=1", ...args];
  const result = spawnSync(command, commandArgs, {
    cwd: resolve(import.meta.dirname, ".."),
    env: process.env,
    input,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `${command} failed:\n${result.stderr || result.stdout}`);
  return result.stdout.trim();
}

test("Postgres generated columns remain equivalent to resolvePartner for every decision boundary", () => {
  const migrationDirectory = resolve(import.meta.dirname, "../supabase/migrations");
  const migrationNames = readdirSync(migrationDirectory)
    .filter((name) => /^\d+_activities_parceiro_canonico\.sql$/.test(name))
    .sort();
  assert.ok(migrationNames.length, "canonical partner migration not found");
  const migrationPath = resolve(migrationDirectory, migrationNames.at(-1));
  const migrationSql = readFileSync(migrationPath, "utf8");

  psql([], `
    drop schema public cascade;
    create schema public;
    create table public.activities (
      case_id integer primary key,
      "Parceiro" text,
      "BU" text,
      "Activity name / Taxonomia" text,
      jornada text,
      "Data de Disparo" date,
      "Base Acionável" numeric,
      "Propostas" numeric,
      "Aprovados" numeric,
      "Cartões Gerados" numeric,
      "Custo Total Campanha" numeric
    );
  `);
  // Feed the tracked migration itself through stdin. This keeps the migration
  // as the only SQL source and also works in the local Docker fallback, where
  // the host path is not mounted inside the container.
  psql([], migrationSql);

  const values = cases.map((row, index) => `(
    ${index + 1}, ${sqlLiteral(row.partner)}, ${sqlLiteral(row.bu)},
    ${sqlLiteral(row.activity)}, ${sqlLiteral(row.journey)}, date '2026-08-01',
    1, 1, 1, 1, 1
  )`).join(",\n");
  psql([], `
    insert into public.activities (
      case_id, "Parceiro", "BU", "Activity name / Taxonomia", jornada,
      "Data de Disparo", "Base Acionável", "Propostas", "Aprovados",
      "Cartões Gerados", "Custo Total Campanha"
    ) values ${values};
  `);

  const resultSql = `
    select json_agg(row_to_json(result) order by case_id)
    from (
      select
        case_id,
        parceiro_canonico as canonical_partner,
        parceiro_canonico_motivo as reason,
        parceiro_canonico_confianca as confidence
      from public.activities
      order by case_id
    ) result;
  `;
  const generated = JSON.parse(psql(["-q", "-t", "-A"], resultSql));
  assert.equal(generated.length, cases.length);

  for (const [index, row] of cases.entries()) {
    const expected = resolvePartner({
      Parceiro: row.partner,
      BU: row.bu,
      "Activity name / Taxonomia": row.activity,
      jornada: row.journey,
    });
    assert.deepEqual(
      {
        canonical_partner: generated[index].canonical_partner,
        reason: generated[index].reason,
        confidence: generated[index].confidence,
      },
      expected,
      `partner resolution mismatch in synthetic case ${index + 1}`,
    );
  }
});
