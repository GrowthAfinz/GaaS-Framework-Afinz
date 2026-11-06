import fs from "node:fs";
import path from "node:path";
const vault = process.argv[2];
const source = "04-Operacao/Plano-de-Comunicacao-Pool-Vai-de-Visa.md";
const note = fs.readFileSync(path.join(vault, source), "utf8");
const table = (heading) =>
  note
    .split(heading)[1]
    .split("\n## ")[0]
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .slice(2)
    .map((l) =>
      l
        .split("|")
        .slice(1, -1)
        .map((x) => x.trim()),
    );
const fields = [
  "role_in_ruler",
  "email_objective",
  "objection_addressed",
  "key_message",
  "value_proposition",
  "primary_benefit",
  "secondary_benefits",
  "proof",
  "expected_action",
  "cta_strategy",
  "visual_hierarchy_strategy",
];
const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const clean = (s) => s.replace(/\*\*/g, "").replace(/`/g, "");
const rows = table("## Plano por e-mail da campanha Black Friday (proposta)");
const rulerId = "adaac662-94c7-4d9a-90fe-fd3c3db52c01",
  contextId = "adaac662-94c7-4d9a-90fe-fd3c3db52c02";
const provenance = `Proposta derivada de ${source}, 05/11/2026. [P] a validar; [C] confirmado nas fontes da nota. Cadastro em rascunho.`;
const plans = [
  "0b4171aa-a7cf-417e-abfb-8485033ff125",
  "09bf8951-fe4a-4a9e-b639-16b071fa1067",
].map((id, i) => {
  const result = {
    id: i
      ? "adaac662-94c7-4d9a-90fe-fd3c3db52c04"
      : "adaac662-94c7-4d9a-90fe-fd3c3db52c03",
    ruler_strategy_id: rulerId,
    campaign_group_id: id,
    partner: "Afinz Visa",
    segment: "Pool de Ofertas Visa",
    week_key: "Black Friday",
    sequence: i ? "E-mail 2 · cartão" : "E-mail 1 · persona",
    functional_name: i ? "E-mail 2 · cartão" : "E-mail 1 · persona",
    subject: "Ofertas Black Afinz 2026 do seu {CARTAO}! 💳💙",
    preheader: "Confira as ofertas exclusivas que selecionamos para você!",
    technical_status: "draft",
    editorial_status: "draft",
    visual_status: "draft",
    certification_status: "not_tested",
    field_provenance: { source: provenance },
    updated_by_type: "system",
    update_source: "system",
    change_reason: provenance,
  };
  fields.forEach((key, k) => {
    let value = rows[k][i + 1];
    if (value === "igual ao V1") value = rows[k][1];
    value = clean(value);
    result.field_provenance[camel(key)] =
      `${value.startsWith("[C]") ? "[C]" : "[P]"} ${source}`;
    result[key] = key === "secondary_benefits" ? [value] : value;
  });
  return result;
});
const ruler = {
  id: rulerId,
  name: "Pool de Ofertas Visa",
  description: provenance,
  partner: "Afinz Visa",
  product: "Pool de Ofertas Vai de Visa",
  segment: "Pool de Ofertas Visa",
  business_front: "monetization",
  ruler_family: "Rentabilização",
  journey_family: "Rentabilização",
  journey_type: "Pool de Ofertas Visa",
  template_slot_id: "builtin-vdv-pool",
  editorial_status: "draft",
  objective:
    "aumentar o uso do cartão Afinz Visa em compras de parceiros da bandeira, não vender cartão novo",
  audience:
    "clientes Afinz Visa B2C e B2B2C ativos (compra nos últimos 30 dias), conta NORMAL, limite disponível a partir de R$ 200 e e-mail liberado; fase 1 com 130.175 CPFs (snapshot de 03/11/2026)",
  journey_stage: "cliente ativo, pós-aquisição",
  narrative_transformation:
    '[P] de "tenho o cartão" para "uso o cartão Afinz Visa quando tem vantagem nas marcas que eu já compro"',
  objections: [
    "[P] essas ofertas não são para mim",
    "[P] não sei como usar o cupom",
    "[P] já tenho outro cartão para essas compras",
  ],
  commercial_intensity:
    "[P] média: vitrine de ofertas com prazo (Black Friday até 30/11), sem pressão de crédito",
  success_criteria:
    "conversão em compra na oferta ou na categoria até 30 dias, comparada ao controle; ganho da personalização = SEG-A menos SEG-B por grupo. Abertura e clique são diagnóstico",
};
const context = {
  id: contextId,
  product: "Pool de Ofertas Vai de Visa",
  partner: "Afinz Visa",
  value_proposition:
    "[P] ofertas de marcas parceiras da Visa (desconto, cupom ou condição pagando com Visa), escolhidas pela categoria em que o cliente costuma comprar e filtradas pelo limite disponível, para usar com o cartão Afinz Visa.",
  differentiators: [
    "[P] vitrine personalizada por afinidade de compra",
    "[P] campanha perene, com tema novo a cada safra (Black Friday, Natal, Copa)",
    "[P] ofertas do catálogo oficial Vai de Visa",
  ],
  eligible_audience:
    "[P] Clientes Afinz Visa B2C e B2B2C ativos, compra nos últimos 30 dias, conta NORMAL, limite disponível a partir de R$ 200 e e-mail liberado. Fase 1 com 130.175 CPFs (03/11/2026). Fase 2 prevê Plurix / Cartonistas.",
  tone_of_voice:
    '[P] o da marca Afinz (próximo, "100% a fim de te ver bem"), com foco em vantagem prática e prazo, sem urgência agressiva.',
  brand_context:
    '[P] o catálogo é da bandeira Visa (programa Vai de Visa), não da Afinz; a Afinz seleciona e entrega as ofertas para os seus clientes. Black Friday aparece como "Black Afinz" no tema da BF26.',
  status: "draft",
  provenance,
  source: "gaas",
};
const guardTypes = {
  Alegação: "claim",
  Legal: "legal",
  Elegibilidade: "eligibility",
  Tom: "tone",
  Visual: "visual",
};
const guardrails = table(
  "## Regras do que pode ser dito (proposta para `dynamic_email_product_guardrails`)",
).map((r, i) => ({
  id: `adaac662-94c7-4d9a-90fe-fd3c3db52c${String(i + 10).padStart(2, "0")}`,
  product_context_id: contextId,
  guardrail_type: guardTypes[r[0]],
  title: "[P] " + clean(r[1]),
  rule_text: "[P] " + clean(r[1]),
  severity:
    r[2] === "bloqueia"
      ? "hard_block"
      : r[2] === "requer revisão"
        ? "requires_review"
        : "advisory",
  allowed_status: "conditional",
  evidence: clean(r[3]) + " · " + provenance,
  status: "draft",
  source: "gaas",
}));
const seed = { ruler, plans, context, guardrails };
fs.writeFileSync(
  "src/modules/dynamic-email/fixtures/visaPlanProposal.json",
  JSON.stringify(seed, null, 2) + "\n",
);
const literal = (v) =>
  "'" + JSON.stringify(v).replaceAll("'", "''") + "'::jsonb";
const insert = (table, items, conflict) => {
  const keys = Object.keys(items[0]);
  return `insert into public.${table} (${keys.join(",")})\nselect ${keys.map((k) => "r." + k).join(",")} from jsonb_populate_recordset(null::public.${table}, ${literal(items)}) r\non conflict ${conflict} do nothing;\n`;
};
const migration = fs
  .readdirSync("supabase/migrations")
  .find((n) => n.endsWith("_visa_communication_plan.sql"));
if (!migration)
  throw new Error(
    "Crie a migration com supabase migration new visa_communication_plan.",
  );
fs.writeFileSync(
  "supabase/migrations/" + migration,
  `-- Proposta editorial Pool Visa. Aplicação em produção depende de aprovação explícita.\n-- Inclusão somente: nunca sobrescreve planos ou fichas revisados. Sem alteração de contratos SFMC.\nbegin;\n\ndo $$ begin\n if (select count(*) from public.dynamic_email_briefings where campaign_group_id in ('0b4171aa-a7cf-417e-abfb-8485033ff125','09bf8951-fe4a-4a9e-b639-16b071fa1067') and briefing_data->'__editor'->>'kind'='vdv' and briefing_data->'__editor'->>'contentVersion'='BF26_V1' and partner='Afinz Visa' and week_key='Black Friday') <> 2 then\n raise exception 'Os dois documentos Visa BF26 não correspondem à fonte revisada. Conferir antes de cadastrar.';\n end if;\nend $$;\n\n` +
    insert("dynamic_email_ruler_strategies", [ruler], "(id)") +
    "\n" +
    insert("dynamic_email_email_strategies", plans, "(campaign_group_id)") +
    "\n" +
    insert("dynamic_email_product_contexts", [context], "(id)") +
    "\n" +
    insert("dynamic_email_product_guardrails", guardrails, "(id)") +
    "\ncommit;\n",
);
console.log(migration);
