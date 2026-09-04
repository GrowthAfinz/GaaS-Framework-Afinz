"""Gera a migration da régua Bem Barato CRM a partir do template e dos briefings.

    python scripts/build-bem-barato-crm-migration.py

Lê `artifacts/bem-barato-template-source.html` (dump byte-a-byte de
BEM_BARATO_CRM_DYNAMIC_TEMPLATE) e `artifacts/bem-barato-briefings.json`, e
escreve a migration em supabase/migrations/.

A migration é transacional, idempotente e falha explicitamente se o número de
briefings do Bem Barato afetados for diferente de 8. Nunca toca em briefings de
outro parceiro nem torna o slot principal global.
"""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(ROOT, 'artifacts', 'bem-barato-template-source.html')
BRIEFINGS_PATH = os.path.join(ROOT, 'artifacts', 'bem-barato-briefings.json')
OUT_PATH = os.path.join(ROOT, 'supabase', 'migrations', '20260904150000_bem_barato_crm_dynamic_ruler_v1.sql')

SLOT_ID = 'bem-barato-crm-dynamic-v1'
SLOT_NAME = 'Bem Barato CRM - Régua dinâmica v1'
PARTNER = 'Bem Barato'
SEGMENT = 'CRM'
PRODUCT = 'Bem Mais Afinz Visa'
RULER_NAME = 'Topo de Funil BEM BARATO · CRM'

# Plano de Comunicação — um registro por e-mail, sustentado pela régua original.
PLAN = {
    1: ('Abrir a régua com a proposta completa', 'Gerar consideração pelo cartão Bem Mais Afinz Visa',
        'Economia nas compras no Bem Barato somada a até R$100 em Créditos Vibe',
        'Apresentar os quatro benefícios do cartão e o ganho Vibe',
        'Não sei o que esse cartão me dá', 'Grade com os quatro benefícios e o bloco de Créditos Vibe',
        'Header, copy de abertura, grade 2x2 de benefícios, CTA, bloco Vibe, banner +250 marcas e CTA de fechamento',
        'CTA repetido três vezes ao longo da leitura'),
    2: ('Reforçar a utilidade imediata', 'Converter interesse em solicitação',
        'Créditos Vibe para fazer mais no fim de semana',
        'Compras no Bem Barato viram créditos', 'Não vejo utilidade no dia a dia',
        'Grade de vantagens e arte de como pedir o cartão',
        'Mesma grade 2x2, bloco Vibe reduzido a duas artes e dois banners de fechamento',
        'CTA após cada bloco de argumento'),
    3: ('Ampliar a percepção de valor', 'Mostrar a amplitude dos benefícios',
        'Compras viram vantagens com descontos exclusivos',
        'Benefícios para o dia a dia em um cartão só', 'Já tenho outro cartão',
        'Grade de benefícios e trio de artes Vibe com foco em desconto',
        'Header próprio, grade 2x2, bloco Vibe com artes de desconto e banner animado',
        'CTA em três posições, fechando após o banner'),
    4: ('Consolidar a proposta', 'Reduzir a postergação da solicitação',
        'Benefícios exclusivos e Créditos Vibe em +250 marcas',
        'Aproveitar os créditos em mais de 250 marcas', 'Vou deixar para depois',
        'Duas artes Vibe seguidas do banner de marcas parceiras',
        'Grade 2x2, bloco Vibe com duas artes e banner de fechamento antes do CTA',
        'Dois CTAs, o segundo após o banner'),
    5: ('Retomar com prova de variedade', 'Acelerar a conversão com benefícios concretos',
        'Descontos exclusivos e Créditos Vibe nas marcas favoritas',
        'Descontos exclusivos no App Vibe', 'Não sei como usar os créditos',
        'Faixa de marcas parceiras e passo a passo de solicitação',
        'Grade de três benefícios em linha, bloco Vibe, faixa de marcas e passo a passo',
        'CTA de abertura "PEÇA JÁ O SEU" e CTA de fechamento'),
    6: ('Criar senso de oportunidade', 'Recuperar quem ainda não solicitou',
        'Vantagens exclusivas para aproveitar as compras',
        'Trocar benefícios e fazer mais no dia a dia', 'Ainda não me convenci',
        'Grade reduzida a dois benefícios e trio de artes Vibe',
        'CTA logo após a abertura, grade de dois benefícios e faixa de marcas',
        'CTA no topo e no fechamento'),
    7: ('Intensificar a urgência', 'Recuperar com amplitude de benefício',
        'Ainda dá tempo de fazer mais nas compras',
        'Créditos exclusivos para comprar nas melhores marcas', 'Perdi o prazo',
        'Grade completa de benefícios reordenada e duas artes Vibe',
        'Grade 2x2 reordenada, bloco Vibe enxuto e sem banner',
        'Dois CTAs, sem banner intermediário'),
    8: ('Encerrar com urgência', 'Capturar a conversão final',
        'Última chance de garantir todos os benefícios',
        'Benefícios exclusivos no App Vibe e descontos em +250 marcas', 'Deixei passar',
        'Duas artes de benefício, duas artes Vibe e duas faixas de marcas',
        'CTA logo após a abertura, grade reduzida e dois banners de fechamento',
        'CTA de abertura e CTA final "Quero meu cartão"'),
}


def q(value: str) -> str:
    """Literal SQL com aspas simples escapadas."""
    return "'" + (value or '').replace("'", "''") + "'"


def main() -> int:
    template = open(TEMPLATE_PATH, encoding='utf-8').read()
    briefings = json.load(open(BRIEFINGS_PATH, encoding='utf-8'))
    if len(briefings) != 8:
        raise SystemExit(f'Esperados 8 briefings, encontrados {len(briefings)}.')
    if '$bembarato$' in template:
        raise SystemExit('Delimitador $bembarato$ colide com o conteúdo do template.')
    for row in briefings:
        if len(row) != 36:
            raise SystemExit(f"{row['SEQUENCIA']}: {len(row)} campos (esperados 36).")

    parts: list[str] = []
    parts.append(f"""-- Régua Topo de Funil (CRM) do Bem Barato — cartão Bem Mais Afinz Visa.
-- Fonte de verdade: REGUA NOVA BEM BARATO.rtf (8 HTMLs originais).
-- Gerado por scripts/build-bem-barato-crm-migration.py — não editar à mão.
--
-- Transacional e idempotente. Falha se o número de briefings do Bem Barato
-- afetados for diferente de 8. Não altera briefings de outros parceiros e não
-- torna este slot principal global.

begin;

insert into public.dynamic_email_template_slots (id, name, source, is_principal, status, version)
values ({q(SLOT_ID)}, {q(SLOT_NAME)}, $bembarato${template}$bembarato$, false, 'active', 1)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = public.dynamic_email_template_slots.version + 1, updated_at = now();
""")

    # Briefings — id determinístico por sequência, para o upsert ser estável.
    values = []
    for row in briefings:
        seq = int(row['SEQUENCIA'].split()[-1])
        week = (seq + 1) // 2
        data = {k: v for k, v in row.items()}
        values.append(
            f"    ({seq}, {week}, {q(json.dumps(data, ensure_ascii=False))}::jsonb)")
    values_sql = ',\n'.join(values)
    parts.append(f"""
with variants(sequence_no, week_no, briefing_data) as (values
{values_sql}
), prepared as (
  select sequence_no, week_no, briefing_data,
    (substr(md5('bem-barato-crm-'||sequence_no),1,8)||'-'||substr(md5('bem-barato-crm-'||sequence_no),9,4)
     ||'-4'||substr(md5('bem-barato-crm-'||sequence_no),14,3)||'-8'||substr(md5('bem-barato-crm-'||sequence_no),18,3)
     ||'-'||substr(md5('bem-barato-crm-'||sequence_no),21,12))::uuid as briefing_id,
    (substr(md5('bem-barato-crm-group-'||sequence_no),1,8)||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),9,4)
     ||'-4'||substr(md5('bem-barato-crm-group-'||sequence_no),14,3)||'-8'||substr(md5('bem-barato-crm-group-'||sequence_no),18,3)
     ||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),21,12))::uuid as group_id
  from variants
), upserted as (
  insert into public.dynamic_email_briefings
    (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id,
     template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override)
  select briefing_id, briefing_data, {q(PARTNER)}, {q(SEGMENT)}, {q(PARTNER)}, 'Semana '||week_no, '{{}}',
    group_id, {q(SLOT_ID)}, 'needs_review', 1, false, true, false
  from prepared
  on conflict (id) do update set
    briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
    subgroup = excluded.subgroup, week_key = excluded.week_key, campaign_group_id = excluded.campaign_group_id,
    template_slot_id = excluded.template_slot_id, status = excluded.status,
    version = public.dynamic_email_briefings.version + 1, updated_at = now()
  returning 1
)
select count(*) as briefings_upserted from upserted;

do $$
declare n integer;
begin
  select count(*) into n from public.dynamic_email_briefings
   where partner = {q(PARTNER)} and template_slot_id = {q(SLOT_ID)};
  if n <> 8 then
    raise exception 'Esperados 8 briefings do Bem Barato apontando para o slot; encontrados %', n;
  end if;
end $$;
""")

    parts.append(f"""
insert into public.dynamic_email_segments
  (technical_name, display_name, business_front, source_table, source_value, partner, bu, origin, governance_status)
values ({q(SEGMENT)}, 'Topo de Funil (CRM)', 'acquisition', 'activities', {q(SEGMENT)}, {q(PARTNER)}, 'B2B2C', 'operational', 'existing')
on conflict (business_front, lower(technical_name), lower(coalesce(partner,''))) where governance_status <> 'archived'
do update set display_name = excluded.display_name, source_table = excluded.source_table,
  source_value = excluded.source_value, origin = 'operational', governance_status = 'existing', updated_at = now();

insert into public.dynamic_email_ruler_strategies
  (name, description, business_front, ruler_family, partner, product, segment, objective, audience,
   journey_stage, narrative_transformation, commercial_intensity, success_criteria, editorial_status, template_slot_id)
values ({q(RULER_NAME)},
  'Régua de quatro semanas e oito e-mails do cartão Bem Mais Afinz Visa para a base CRM do Bem Barato.',
  'acquisition', 'top_of_funnel', {q(PARTNER)}, {q(PRODUCT)}, {q(SEGMENT)},
  'Converter a base CRM do Bem Barato em solicitações do cartão Bem Mais Afinz Visa.',
  'Clientes Bem Barato elegíveis na base CRM.', 'Topo de funil',
  'Da apresentação dos benefícios do cartão à urgência de última chance.',
  'progressive', 'Solicitação do cartão', 'ready', {q(SLOT_ID)})
on conflict (partner, segment, coalesce(product,''), coalesce(name,''), version) do update set
  description = excluded.description, objective = excluded.objective, audience = excluded.audience,
  journey_stage = excluded.journey_stage, narrative_transformation = excluded.narrative_transformation,
  commercial_intensity = excluded.commercial_intensity, success_criteria = excluded.success_criteria,
  editorial_status = excluded.editorial_status, template_slot_id = excluded.template_slot_id, updated_at = now();

insert into public.dynamic_email_ruler_segments (ruler_strategy_id, segment_id, is_primary)
select r.id, s.id, true
from public.dynamic_email_ruler_strategies r
cross join public.dynamic_email_segments s
where r.partner = {q(PARTNER)} and r.segment = {q(SEGMENT)} and r.product = {q(PRODUCT)} and r.name = {q(RULER_NAME)}
  and s.business_front = 'acquisition' and lower(s.technical_name) = lower({q(SEGMENT)})
  and lower(coalesce(s.partner,'')) = lower({q(PARTNER)})
on conflict (ruler_strategy_id, segment_id) do update set is_primary = true;
""")

    strategy_rows = []
    for row in briefings:
        seq = int(row['SEQUENCIA'].split()[-1])
        week = (seq + 1) // 2
        role, objective, value_prop, benefit, objection, proof, hierarchy, cta_strategy = PLAN[seq]
        strategy_rows.append(
            f"    ({seq}, {week}, {q(row['ASSUNTO'])}, {q(row['PRE_CABECALHO'])}, {q(role)}, {q(objective)}, "
            f"{q(benefit)}, {q(value_prop)}, {q(objection)}, {q(proof)}, {q(hierarchy)}, {q(cta_strategy)}, "
            f"{q(row['TITULO_CTA_1'])})")
    strategy_sql = ',\n'.join(strategy_rows)
    parts.append(f"""
with ruler as (
  select id from public.dynamic_email_ruler_strategies
  where partner = {q(PARTNER)} and segment = {q(SEGMENT)} and product = {q(PRODUCT)} and name = {q(RULER_NAME)}
  order by version desc limit 1
), variants(sequence_no, week_no, subject, preheader, role_in_ruler, email_objective, key_message,
            value_proposition, objection_addressed, proof, visual_hierarchy_strategy, cta_strategy, cta_label) as (values
{strategy_sql}
), upserted as (
  insert into public.dynamic_email_email_strategies
    (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, functional_name, subject, preheader,
     role_in_ruler, email_objective, key_message, expected_action, value_proposition, primary_benefit,
     secondary_benefits, objection_addressed, proof, visual_hierarchy_strategy, cta_strategy,
     technical_status, editorial_status, visual_status, certification_status, field_provenance)
  select ruler.id,
    (substr(md5('bem-barato-crm-group-'||sequence_no),1,8)||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),9,4)
     ||'-4'||substr(md5('bem-barato-crm-group-'||sequence_no),14,3)||'-8'||substr(md5('bem-barato-crm-group-'||sequence_no),18,3)
     ||'-'||substr(md5('bem-barato-crm-group-'||sequence_no),21,12))::uuid,
    {q(PARTNER)}, {q(SEGMENT)}, 'Semana '||week_no, 'E-mail '||sequence_no,
    'E-mail '||sequence_no||' · Bem Barato CRM', subject, preheader,
    role_in_ruler, email_objective, key_message, cta_label, value_proposition, key_message,
    '["Preço baixo sempre no Bem Barato","Até 70% de desconto em saúde","Até 70% de desconto em cursos","Bandeira Visa aceita no Brasil e no exterior","Até R$100 em Créditos Vibe na primeira compra","Créditos Vibe a cada fatura paga","Concorre a R$100 mil todo mês","Descontos em mais de 250 marcas"]'::jsonb,
    objection_addressed, proof, visual_hierarchy_strategy, cta_strategy,
    'ready', 'ready', 'ready', 'not_tested',
    '{{"source":"REGUA NOVA BEM BARATO.rtf","adaptation":"shared_dynamic_template","template_slot":"{SLOT_ID}"}}'::jsonb
  from ruler cross join variants
  on conflict (campaign_group_id) do update set
    ruler_strategy_id = excluded.ruler_strategy_id, subject = excluded.subject, preheader = excluded.preheader,
    role_in_ruler = excluded.role_in_ruler, email_objective = excluded.email_objective,
    key_message = excluded.key_message, expected_action = excluded.expected_action,
    value_proposition = excluded.value_proposition, primary_benefit = excluded.primary_benefit,
    secondary_benefits = excluded.secondary_benefits, objection_addressed = excluded.objection_addressed,
    proof = excluded.proof, visual_hierarchy_strategy = excluded.visual_hierarchy_strategy,
    cta_strategy = excluded.cta_strategy, technical_status = 'ready', editorial_status = 'ready',
    visual_status = 'ready', certification_status = 'not_tested', field_provenance = excluded.field_provenance,
    version = public.dynamic_email_email_strategies.version + 1, updated_at = now()
  returning 1
)
select count(*) as strategies_upserted from upserted;

do $$
declare n integer;
begin
  select count(*) into n from public.dynamic_email_email_strategies
   where partner = {q(PARTNER)} and segment = {q(SEGMENT)};
  if n <> 8 then
    raise exception 'Esperadas 8 estrategias do Bem Barato; encontradas %', n;
  end if;
end $$;
""")

    # Assets — todas as artes referenciadas pela régua, sem duplicar governança.
    assets: list[tuple[str, str, str, list[str], int | None]] = []
    for row in briefings:
        seq = row['SEQUENCIA'].replace('E-mail ', 'email-')
        if row['HEADER']:
            assets.append((f"Bem Barato CRM {row['SEQUENCIA']} · Header", row['HEADER'], 'header', [seq], 600))
        for slot_index, key in ((1, 'BANNER_1_CORPO'), (2, 'BANNER_2_CORPO'), (3, 'BANNER_3_CORPO')):
            if row[key]:
                assets.append((f"Bem Barato CRM {row['SEQUENCIA']} · Banner {slot_index}",
                               row[key], f'banner_{slot_index}', [seq], None))
    fixed = [
        ('Bem Barato · Preço baixo sempre', 'dd5bd72f-fba0-4ed0-a6a4-e9fa78758810.png'),
        ('Bem Barato · Desconto em saúde', '3f2ff739-5b6d-4484-ba6a-d552390794ba.png'),
        ('Bem Barato · Desconto em cursos', '63c27266-d881-4e29-b256-fb6c3a2348ed.png'),
        ('Bem Barato · Bandeira Visa', '87c5c98f-c6dd-47e1-8522-7e4f67172d1b.png'),
        ('Vibe · R$100 na primeira compra', 'ba613caa-444d-4954-acd0-1b151dada6ec.png'),
        ('Vibe · Créditos por fatura paga', 'c392c8ff-b97f-4a86-8c56-df49ea5b2374.png'),
        ('Vibe · Concorra a R$100 mil', '82ec3fce-c040-4f7a-b450-e96b9f062489.png'),
        ('Vibe · Desconto exclusivo', 'b3063d8e-942f-497d-bd51-ad7754b5abe7.png'),
        ('Vibe · Vantagens no app', '2f1fef6e-62d6-491a-8df1-fbea4eac2046.png'),
    ]
    base = 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/'
    for name, file in fixed:
        assets.append((name, base + file, 'generic', ['regua-fixa'], None))

    seen: dict[str, tuple[str, str, list[str], int | None]] = {}
    for name, url, slot, tags, width in assets:
        if url in seen:
            seen[url][2].extend(tags)
        else:
            seen[url] = (name, slot, list(tags), width)
    asset_values = [
        f"    ({q(name)}, {q(url)}, {q(slot)}, array[{','.join(q(t) for t in sorted(set(tags)))}], "
        f"{width if width else 'null'})"
        for url, (name, slot, tags, width) in seen.items()
    ]
    asset_sql = ',\n'.join(asset_values)
    parts.append(f"""
with asset(name, url, slot, email_tags, width) as (values
{asset_sql}
)
insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, tags, status, version)
select name, url, null, slot, 'B2B2C', {q(PARTNER)}, {q(SEGMENT)}, {q(PARTNER)}, {q(PRODUCT)}, name, width,
  array['bem-barato','crm','topo-de-funil','referencia-rtf'] || email_tags, 'ready', 1
from asset
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  partner = {q(PARTNER)}, segment = {q(SEGMENT)}, updated_at = now();

-- Guarda final: nenhum briefing de outro parceiro pode ter sido apontado para este slot.
do $$
declare n integer;
begin
  select count(*) into n from public.dynamic_email_briefings
   where template_slot_id = {q(SLOT_ID)} and partner <> {q(PARTNER)};
  if n <> 0 then
    raise exception 'Impacto lateral: % briefings de outro parceiro apontam para o slot', n;
  end if;
end $$;

commit;
""")

    sql = ''.join(parts)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(sql)
    print(f'migration: {OUT_PATH}')
    print(f'  bytes={len(sql)}  briefings=8  assets={len(seen)}  template_bytes={len(template)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
