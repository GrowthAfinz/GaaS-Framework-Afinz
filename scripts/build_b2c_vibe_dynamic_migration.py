from __future__ import annotations

import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_FILE = ROOT / "src/modules/dynamic-email/fixtures/b2cClassicVibeDynamicTemplate.ts"
TEMPLATE_ID = "b2c-classic-vibe-dynamic-v1"
LOGO = "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png"
ASSET = "https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1"
CTA_ROOT = "https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria"
LEGAL = (
    "*Após realizar a primeira compra com o seu cartão com anuidade ativa, independentemente do valor, "
    "você receberá em até 5 dias úteis R$ 100 em créditos no App Vibe, com validade de até 6 meses. "
    "Para visualizar o seu saldo, baixe o App Vibe. A primeira compra deverá ser realizada em até 30 dias. / "
    "A cada fatura paga, com anuidade ativa, você receberá mais créditos no App Vibe, conforme condições da "
    "loja parceira, também com validade de até 6 meses. Os benefícios acumulados no app da Vibe podem ser trocados "
    "por descontos e vantagens das marcas parceiras. Eles são dinâmicos e podem ser alterados ou apresentados "
    "conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da "
    "Vibe. Promoção válida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso "
    "prévio. / Sujeito a disponibilidade."
)
FOOTER = (
    "Ouvidoria: 0800 772 0602<br>Enviado por Banco Afinz S.A. - Banco Múltiplo - CNPJ: "
    "04.814.563/0001-74 | Afinz Instituição de Pagamento S.A. - CNPJ: 60.114.865/0001-00<br>"
    "Rua XV de Novembro, 45 - Sorocaba, SP"
)
TRIO = (
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="4"><tr>'
    f'<td width="33%"><img src="{ASSET}/7b74ae58-653d-4037-b494-1a04d89c4fc7.png" width="150" style="display:block;width:100%;height:auto;border:0" alt="Benefício Vibe"></td>'
    f'<td width="33%"><img src="{ASSET}/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png" width="150" style="display:block;width:100%;height:auto;border:0" alt="Benefício Vibe"></td>'
    f'<td width="33%"><img src="{ASSET}/fe5a60a4-6a4c-454b-8681-3d5722951429.png" width="150" style="display:block;width:100%;height:auto;border:0" alt="Benefício Vibe"></td>'
    '</tr></table>'
)


def email(number: int, subject: str, preheader: str, header: str, title1: str, copy1: str,
          title2: str = "", copy2: str = "", banner1: str = "", banner2: str = "", banner3: str = "") -> dict[str, str]:
    week = (number + 1) // 2
    day = 1 if number % 2 else 2
    link = f"{CTA_ROOT}&af_sub2=s{week}&af_sub3=b2c_email_vibe_bsp_S{week}D0{day}"
    return {
        "DT_INICIO": "09/01/2026 00:00:00", "DT_FIM": "12/31/2028 23:59:59",
        "UTM_CAMPANHA": f"B2C_CLASSIC_VIBE_S{week}_D{day}", "TP_CAMPANHA": "Aquisicao",
        "SEQUENCIA": f"E-mail {number}", "ASSUNTO": subject, "PRE_CABECALHO": preheader,
        "HEADER": f"{ASSET}/{header}", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL",
        "TITULO_COPY_1_AZUL": title1, "COR_COPY_1": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_1": "22",
        "TITULO_CTA_1": "Quero meu cartão", "LINK_CTA_1": link, "COPY_1_PRETO": copy1,
        "COR_COPY_PRETO_1": "#111111", "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1": "19",
        "TITULO_COPY_2": title2, "COR_TITULO_COPY_2": "#00C6CC", "TAMANHO_DA_FONTE_TITULO_COPY_2": "20",
        "COPY_2_PRETO": copy2, "COR_COPY_2": "#111111", "TAMANHO_DA_FONTE_COPY_2": "18",
        "TITULO_CTA_2": "Pedir meu cartão", "LINK_CTA_2": link,
        "BANNER_1_CORPO": f"{ASSET}/{banner1}" if banner1 else "", "LINK_BANNER_1_CORPO": "",
        "BANNER_2_CORPO": f"{ASSET}/{banner2}" if banner2 else "", "LINK_BANNER_2_CORPO": "",
        "BANNER_3_CORPO": f"{ASSET}/{banner3}" if banner3 else "", "LINK_BANNER_3_CORPO": "",
        "NOTA_LEGAL": LEGAL, "COR_NOTA_LEGAL": "#777777", "TAMANHO_DA_FONTE_NOTA_LEGAL": "9", "RODAPE": FOOTER,
    }


EMAILS = [
    email(1, "Peça seu cartão Afinz e concorra a R$100 mil todo mês!", "Aproveite os descontos incríveis nas melhores marcas.",
          "1cff3901-45e3-4245-a0e5-59c8bf28c638.png", "Olá, %%=v(@FirstName)=%%",
          "Peça seu <b>cartão Afinz Visa</b> e ganhe créditos para aproveitar super ofertas e descontos no App Vibe.<br><br><b>E mais:</b> usando seus Créditos Vibe, você concorre a <b>R$100 mil todo mês!</b>",
          "Não perca os benefícios e descontos", "Nas melhores marcas, direto no App Vibe!", "814bdf22-1f7d-4680-a707-682e9d61b9e8.png"),
    email(2, "GANHE Créditos Vibe com o cartão Afinz Visa! 💳", "Peça seu cartão e tenha descontos em cinema, delivery e muito mais!",
          "0e8a7666-182b-41ef-a7c6-440f6855a478.png", "Olá, %%=v(@FirstName)=%%",
          "Garanta seu <b>cartão Afinz Visa</b> e aproveite descontos incríveis nas melhores marcas, no <b>App Vibe</b>.",
          "Peça o seu agora mesmo", "Comece a utilizar o cartão Afinz virtual e ganhe R$100 em Créditos Vibe fazendo a primeira compra.", "3736d8c4-a8ce-47fb-944c-911039706324.png"),
    email(3, "Concorra a R$100 MIL todo mês com o cartão Afinz!", "Peça seu cartão e ganhe R$100 em créditos Vibe na 1ª compra.",
          "1cff3901-45e3-4245-a0e5-59c8bf28c638.png", "Olá, %%=v(@FirstName)=%%",
          "Com o cartão Afinz Visa, você tem <b>crédito na hora</b> e já pode usar seu <b>cartão virtual</b> para compras online.",
          "Créditos para aproveitar no App Vibe", "Ganhe até <b>R$100</b> na primeira compra, receba Créditos Vibe ao pagar a fatura em dia e concorra a <b>R$100 mil todo mês</b>.", "4db4ae3d-6fd9-4256-b87e-7b875b932ecc.png"),
    email(4, "Cartão Afinz com limite para usar na hora. Peça já!", "Ganhe até R$100 em Créditos Vibe para suas compras. Aproveite!",
          "413ba064-4762-41b5-80fe-eae9b0475fdb.png", "Olá, %%=v(@FirstName)=%%",
          "Com o <b>cartão Afinz Visa</b> você tem <b>limite liberado na hora</b> e benefícios que ajudam a economizar.",
          "Aproveite os melhores descontos", "R$100 em Créditos Vibe na primeira compra, créditos mensais ao pagar a fatura em dia e até 70% de desconto em medicamentos, consultas e exames.", "e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif"),
    email(5, "Economize todo mês com seus Créditos Vibe!", "Peça seu cartão Afinz e concorra a R$100 MIL todo mês.",
          "1e08e54a-716a-4a59-96a0-3b652119ed13.png", "Olá, %%=v(@FirstName)=%%",
          "Com o <b>cartão Afinz</b> você ganha Créditos Vibe e <b>economiza todo mês</b>.",
          "Benefícios para aproveitar sempre", TRIO),
    email(6, "Quer concorrer a R$100 MIL todo mês? Peça seu Cartão Afinz!", "Ganhe R$100 em Créditos Vibe na 1ª compra e aproveite nas melhores marcas.",
          "ecc98b44-e31d-47cd-9ec8-a2bf6285ff7c.png", "Olá, %%=v(@FirstName)=%%",
          "Peça já o seu cartão Afinz Visa e <b>ganhe R$100 em Créditos Vibe</b> fazendo a primeira compra!",
          "Aproveite o App Vibe", "Descontos incríveis nas melhores marcas e a chance de concorrer a R$100 mil todo mês.", "e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif"),
    email(7, "Não perca seu cartão Afinz com Créditos Vibe exclusivos!", "Ganhe R$100 em Créditos Vibe para economizar nas melhores marcas.",
          "2e28aab8-b586-4223-a19a-bd7a90138594.png", "Olá, %%=v(@FirstName)=%%",
          "Não perca esta chance de pedir seu <b>cartão Afinz Visa</b> e ganhar <b>R$100 em Créditos Vibe</b> para economizar nas melhores marcas.",
          "E mais: créditos todos os meses", TRIO),
    email(8, "ÚLTIMA CHANCE: ganhe até R$100 Créditos Vibe!", "Concorra R$100 MIL todo mês e economize em +250 marcas. Aproveite!",
          "bcba23af-49bb-4435-a8e7-e66b8358c037.png", "Olá, %%=v(@FirstName)=%%",
          "Com o <b>cartão Afinz</b> você ganha <b>Créditos Vibe</b> e economiza todo mês nas melhores marcas.",
          "Seus Créditos Vibe valem mais", f"{TRIO}<br>Aproveite mercado, cinema, moda, presentes e lazer. No Vibe Shop, use seus créditos para comprar com desconto no marketplace do App Vibe.", banner3="dfcce93f-cd10-4245-aea6-2bd11ffc66e3.png"),
]

STRATEGIES = [
    ("Apresentar a proposta completa", "Gerar consideração pelo cartão", "Cartão Afinz combina crédito e vantagens Vibe", "Solicitar o cartão", "Crédito com economia recorrente", "R$100 em Créditos Vibe na primeira compra", ["Descontos no App Vibe", "Sorteio mensal de R$100 mil"], "Não perceber valor além do crédito", "Oferta, benefícios e condições explicitados", "Header de oferta, benefícios e reforço final", "CTA direto no primeiro bloco e reforço no fechamento"),
    ("Reforçar utilidade imediata", "Converter interesse em solicitação", "O cartão virtual permite começar a usar rapidamente", "Pedir o cartão", "Acesso rápido a crédito e descontos", "Uso do cartão virtual", ["R$100 em Créditos Vibe", "Descontos em diferentes categorias"], "Achar que o cartão demora para ficar disponível", "Cartão virtual e crédito da primeira compra", "Disponibilidade imediata antes do benefício promocional", "CTA após a promessa de uso imediato"),
    ("Detalhar o ecossistema de benefícios", "Aumentar desejo pela oferta", "O cartão gera créditos e vantagens recorrentes", "Solicitar o cartão", "Benefícios em diferentes momentos da relação", "Até R$100 em Créditos Vibe", ["Créditos mensais", "Sorteio de R$100 mil", "Descontos em marcas"], "Não entender como o Vibe agrega valor", "Lista factual de benefícios da comunicação original", "Progressão visual dos benefícios", "CTA principal antes do aprofundamento"),
    ("Provar economia e conveniência", "Reduzir objeção de utilidade", "Limite imediato e economia em saúde", "Pedir o cartão", "Crédito com benefícios de uso cotidiano", "Limite liberado na hora", ["Até 70% em saúde", "Créditos Vibe"], "Não enxergar uso prático", "Categorias e percentuais presentes no original", "Benefício imediato seguido de prova por categoria", "CTA antes do bloco de descontos"),
    ("Reforçar recorrência", "Mostrar valor mensal", "Créditos Vibe ajudam a economizar continuamente", "Solicitar o cartão", "Economia recorrente vinculada ao uso", "Economia todos os meses", ["Créditos Vibe", "Cartão virtual"], "Perceber o benefício como pontual", "Conjunto de categorias visuais da campanha", "Mensagem curta com mosaico de categorias", "CTA após promessa de recorrência"),
    ("Retomar incentivo de entrada", "Acelerar conversão com incentivo", "A primeira compra libera R$100 em Créditos Vibe", "Pedir o cartão", "Entrada simples no ecossistema Vibe", "R$100 na primeira compra", ["Cartão virtual", "Sorteio mensal"], "Adiar a solicitação", "Condição promocional e nota legal", "Incentivo dominante e reforço de variedade", "CTA imediatamente após o incentivo"),
    ("Criar urgência de decisão", "Recuperar quem ainda não converteu", "Ainda dá tempo de obter o cartão e seus benefícios", "Solicitar agora", "Economia e créditos disponíveis após adesão", "R$100 em Créditos Vibe", ["Créditos mensais", "Descontos em várias categorias"], "Continuar postergando", "Benefícios repetidos de forma consistente na régua", "Urgência no header e benefícios como sustentação", "CTA com linguagem de ação imediata"),
    ("Encerrar a régua com urgência", "Capturar a conversão final", "Última oportunidade para acessar o ecossistema Afinz e Vibe", "Pedir o cartão agora", "Cartão, créditos e marketplace em uma única proposta", "Créditos Vibe para economizar", ["Mais de 250 marcas", "Vibe Shop", "Sorteio mensal"], "Não ver amplitude de uso", "Categorias, marketplace e condições da oferta", "Header de última chance e amplitude de uso", "CTA final com máxima clareza e urgência"),
]


def q(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def source() -> str:
    raw = TEMPLATE_FILE.read_text(encoding="utf-8")
    match = re.search(r"B2C_CLASSIC_VIBE_DYNAMIC_TEMPLATE = `([\s\S]*)`;\s*$", raw)
    if not match:
        raise RuntimeError("Template source not found")
    return match.group(1)


def build() -> str:
    sql = [
        "insert into public.dynamic_email_template_slots (id,name,source,is_principal,status,version,created_by,updated_by)",
        f"values ({q(TEMPLATE_ID)}, 'B2C Classic + Vibe · Dinâmico', $b2c${source()}$b2c$, false, 'active', 1, null, null)",
        "on conflict (id) do update set name=excluded.name, source=excluded.source, status='active', version=public.dynamic_email_template_slots.version+1, updated_at=now();",
        "",
    ]
    for number, briefing in enumerate(EMAILS, 1):
        row_id = f"b2c00000-0000-4000-8000-{number:012d}"
        sql += [
            "update public.dynamic_email_briefings set",
            f"briefing_data={q(json.dumps(briefing, ensure_ascii=False, separators=(',', ':')))}::jsonb, template_slot_id={q(TEMPLATE_ID)}, status='ready', version=version+1, updated_at=now()",
            f"where id={q(row_id)}::uuid;",
            "",
        ]
        values = STRATEGIES[number - 1]
        fields = ["role_in_ruler","email_objective","key_message","expected_action","value_proposition","primary_benefit"]
        updates = [f"{field}={q(values[idx])}" for idx, field in enumerate(fields)]
        updates += [f"secondary_benefits={q(json.dumps(values[6], ensure_ascii=False))}::jsonb"]
        more = ["objection_addressed","proof","visual_hierarchy_strategy","cta_strategy"]
        updates += [f"{field}={q(values[idx + 7])}" for idx, field in enumerate(more)]
        updates += ["technical_status='ready'", "editorial_status='ready'", "visual_status='ready'", "certification_status='not_tested'", "field_provenance=coalesce(field_provenance,'{}'::jsonb)||'{\"semantic_fields\":\"human_reference_migration\"}'::jsonb", "version=version+1", "updated_at=now()"]
        sql += [
            "update public.dynamic_email_email_strategies set",
            ",\n".join(updates),
            f"where campaign_group_id={q(f'b2c10000-0000-4000-8000-{number:012d}')}::uuid;",
            "",
        ]
    sql += [
        "update public.dynamic_email_template_slots set status='archived', updated_at=now()",
        "where id like 'b2c-classic-vibe-email-%-control';",
    ]
    return "\n".join(sql) + "\n"


if __name__ == "__main__":
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "outputs/b2c-vibe-dynamic-migration.sql"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(build(), encoding="utf-8", newline="\n")
    print(target)
