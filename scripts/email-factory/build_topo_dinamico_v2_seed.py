# -*- coding: utf-8 -*-
"""Migration da régua V2 TOPO DE FUNIL DINÂMICO: mesmos 3 e-mails da V1, com o conteúdo
reorganizado em blocos visuais (skill sfmc-acquisition-email-designer, content_blocks.py).

Uso: python scripts/email-factory/build_topo_dinamico_v2_seed.py <rows_visual.json> <saida.sql>
A régua V1 continua intacta. As duas usam TP_CAMPANHA "Topo de Funil": a separação é só no
GaaS, e a exportação bloqueia as duas no mesmo CSV.
"""
import json
import sys

COLUMNS = [
    'DT_INICIO', 'DT_FIM', 'UTM_CAMPANHA', 'TP_CAMPANHA', 'SEQUENCIA', 'ASSUNTO', 'PRE_CABECALHO', 'HEADER',
    'CARTAO_NM_COMERCIAL', 'NM_PRODUTO_INTERNO', 'TITULO_COPY_1_AZUL', 'COR_COPY_1',
    'TAMANHO_DA_FONTE_TITULO_COPY_1', 'TITULO_CTA_1', 'LINK_CTA_1', 'COPY_1_PRETO', 'COR_COPY_PRETO_1',
    'TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1', 'TITULO_COPY_2', 'COR_TITULO_COPY_2',
    'TAMANHO_DA_FONTE_TITULO_COPY_2', 'COPY_2_PRETO', 'COR_COPY_2', 'TAMANHO_DA_FONTE_COPY_2',
    'TITULO_CTA_2', 'LINK_CTA_2', 'BANNER_1_CORPO', 'LINK_BANNER_1_CORPO', 'BANNER_2_CORPO',
    'LINK_BANNER_2_CORPO', 'BANNER_3_CORPO', 'LINK_BANNER_3_CORPO', 'NOTA_LEGAL', 'COR_NOTA_LEGAL',
    'TAMANHO_DA_FONTE_NOTA_LEGAL', 'RODAPE', 'MENSAGEM_LIMITE',
    'HEADER_TITULO', 'HEADER_SUBTITULO', 'HEADER_IMAGEM_CARTAO', 'HEADER_LOGO',
]
SEGMENT = 'V2 TOPO DE FUNIL DINÂMICO'
RULER_ID = 'd2d20000-0000-4000-8000-000000000001'
GROUP = {f'E-mail {n}': f'd2d20000-0000-4000-8000-0000000000e{n}' for n in (1, 2, 3)}
ORDER = ['AMIGAO', 'AVENIDA', 'BOA', 'COMPRE MAIS', 'PARANA', 'SUPERPAO']
TEMPLATE = 'builtin-plurix-v13'


def tag(text):
    assert '$gaas$' not in text
    return f'$gaas${text}$gaas$'


def jsonb(value):
    return f"{tag(json.dumps(value, ensure_ascii=False))}::jsonb"


def main(src, out):
    rows = json.load(open(src, encoding='utf-8'))['rows']
    briefings, ids = [], []
    for item in rows:
        index = ORDER.index(item['network']) + 1 + (int(item['sequence'][-1]) - 1) * 10
        bid = f'd2d20000-0000-4000-8000-0000000001{index:02d}'
        ids.append(bid)
        data = {'__id': bid, **{c: item['data'].get(c, '') for c in COLUMNS}}
        source = {'origem': 'régua TOPO DE FUNIL DINÂMICO (V1)', 'mudanca': 'conteúdo em blocos visuais (content_blocks.py)',
                  'importKey': f"{SEGMENT}|{item['sequence']}|{item['network']}"}
        briefings.append(f"({tag(bid)}::uuid, {jsonb(data)}, 'Plurix', {tag(SEGMENT)}, {tag(item['subgroup'])}, {tag(item['week'])}, "
                         f"array[]::text[], {tag(GROUP[item['sequence']])}::uuid, 'draft', 1, {tag(TEMPLATE)}, false, {jsonb(source)})")
    strategies = []
    for sequence, group in GROUP.items():
        amigao = next(r for r in rows if r['sequence'] == sequence and r['network'] == 'AMIGAO')['data']
        strategies.append(f"({tag(RULER_ID)}::uuid, {tag(group)}::uuid, 'Plurix', {tag(SEGMENT)}, "
                          f"{tag(next(r for r in rows if r['sequence'] == sequence)['week'])}, {tag(sequence)}, {tag(amigao['ASSUNTO'])}, "
                          f"{tag(amigao['PRE_CABECALHO'])}, 'draft', 'draft', 'needs_review', 'not_tested', "
                          f"{jsonb({'origem': 'V1 TOPO DE FUNIL DINÂMICO', 'visual': 'blocos de conteúdo'})}, 'llm', 'llm', "
                          f"'Conteúdo reorganizado em blocos visuais, aprovado pelo Pablo em 15/10/2026', 'claude-opus-5-5', "
                          f"{tag('V2 TOPO DINÂMICO · ' + sequence)})")
    sql = f"""-- V2 TOPO DE FUNIL DINÂMICO: nova linha de jornada no GaaS com os 3 e-mails da V1 e o conteúdo
-- reorganizado em blocos visuais (grade de benefícios no E-mail 1, números em destaque no E-mail 2,
-- botões em caixa alta). Gerado por scripts/email-factory/build_topo_dinamico_v2_seed.py.
-- A V1 continua intacta; as duas usam TP_CAMPANHA "Topo de Funil" (separação só no GaaS).

insert into public.dynamic_email_ruler_strategies (id, name, description, partner, product, segment, objective, audience, journey_stage, business_front, ruler_family, journey_family, journey_type, editorial_status, template_slot_id, source_ruler_id, version)
values ({tag(RULER_ID)}::uuid, {tag(SEGMENT)},
  {tag('Segunda versão da régua de topo dinâmico: mesmos e-mails da V1, com o segundo bloco montado em blocos visuais (grade de benefícios e números em destaque) e botões em caixa alta. Template PLURIX V13.')},
  'Plurix', '+amigo', {tag(SEGMENT)},
  'Levar membros do Clube +amigo das 6 redes a pedir o cartão pelo app.',
  'Somente membros do Clube +amigo das 6 redes Plurix. Faixa de limite só para LIMITE_CRD positivo.',
  'Topo de funil', 'acquisition', 'top_of_funnel', 'Aquisição', 'Topo de Funil', 'draft', {tag(TEMPLATE)},
  'd1d10000-0000-4000-8000-000000000001'::uuid, 1)
on conflict (id) do nothing;

insert into public.dynamic_email_email_strategies (ruler_strategy_id, campaign_group_id, partner, segment, week_key, sequence, subject, preheader, technical_status, editorial_status, visual_status, certification_status, field_provenance, updated_by_type, update_source, change_reason, llm_model, functional_name)
values
{','.join(chr(10) + s for s in strategies)}
on conflict (campaign_group_id) do nothing;

insert into public.dynamic_email_briefings (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, status, version, template_slot_id, journey_confirmed, import_source)
values
{','.join(chr(10) + b for b in briefings)}
on conflict (id) do nothing;

insert into public.dynamic_email_briefing_versions (briefing_id, version, snapshot, change_summary, warnings)
select b.id, 1, b.briefing_data, 'Criado a partir da V1 com o conteúdo em blocos visuais.', '[]'::jsonb
from public.dynamic_email_briefings b
where b.id in ({', '.join(f"{tag(i)}::uuid" for i in ids)})
on conflict (briefing_id, version) do nothing;
"""
    open(out, 'w', encoding='utf-8').write(sql)
    print(out, len(briefings), 'briefings')


if __name__ == '__main__':
    main(*sys.argv[1:3])
