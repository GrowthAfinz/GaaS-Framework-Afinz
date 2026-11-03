---
title: "Inventário de operações e campanhas de Growth"
tags: ["growth", "resultados", "inventario"]
tipo: "guia-operacional"
status: "confirmado"
fonte: "auditoria-supabase-vault-2026-10-03"
atualizado: "2026-10-03"
growth_catalog: {}
---

# Inventário de operações e campanhas de Growth


Levantamento em 03/10/2026. O universo vai além dos cinco exemplos iniciais. Foram relidos os 221 arquivos Markdown atuais do vault e consultadas as dimensões de todas as linhas das fontes abaixo. As consultas são independentes, sem snapshot transacional. Fontes externas como SFMC, contas de anúncio, briefings privados fora do repositório e eventos ainda não ingeridos não foram auditadas.

## O que foi encontrado

| Fonte / unidade | Quantidade | Como interpretar |
|---|---|---|
| CRM Aquisição: linhas físicas | 7895 | Registro bruto, sem deduplicação automática |
| Escopos CRM: BU × segmento × parceiro | 33 | Unidades de descoberta; não operações de negócio confirmadas |
| Combinações CRM incluindo etapa e subgrupo | 60 | Variantes preservadas |
| Agrupamentos de campanha CRM | 669 | BU/segmento/parceiro/subgrupo/etapa/jornada/safra |
| Jornadas CRM distintas | 419 | Nome literal, sem fusão de variantes |
| Taxonomias CRM distintas | 2154 | Nome não é identidade única da execução |
| Rentabilização: linhas físicas | 8664 | Pode conter teste e seedlist; não prova produção comercial |
| Agrupamentos de campanha de rentabilização | 92 | Inclui seguros, Copa, welcome, uso e comunicações informativas |
| Famílias candidatas de rentabilização por BU | 43 | Classificação declarada por campos e nomes, sujeita a revisão |
| Mídia: linhas físicas | 8498 | Grão preservado; não somar campanha e anúncio |
| Nomes de campanha observados por plataforma | 29 | Identidade literal; nomes parecidos não fundidos |
| Identidades de mídia no cadastro canônico | 34 | Cadastro e execução são universos diferentes |
| Populações B2C | 3 | total, serasa_api e crm; populações sobrepostas |
| Recortes de onboarding e funis | 6 | App, Serasa BI, Neurotech e Marketplace |
| Grupos de campanha e origem AppsFlyer | 45 | App/OS/origem/campanha/qualidade; não campanhas causais de cartões |
| Réguas editoriais cadastradas | 3 | Plurix, Bem Barato e Dia; status editorial não prova disparo |
| Grupos editoriais de briefings | 78 | Grupo/parceiro/segmento/subgrupo/semana/status |

Os números acima **não devem ser somados** como um total de operações. Eles medem níveis diferentes e fontes sobrepostas. O registro contém 164 entradas tipadas para navegar entre escopos, famílias candidatas, campanhas, cadastros, populações e momentos documentados.

## Todas as entradas de CRM Aquisição

| ID | Assunto candidato | Linhas | Etapas físicas | Subgrupos |
|---|---|---|---|---|
| CRM-3bd920ad5c | Carrinho abandonado — Bem Barato — B2B2C | 100 | Reativacao | Diario |
| CRM-c063e536a7 | Carrinho abandonado — Dia — B2B2C | 1 | Reativacao | Diario |
| CRM-b9d196a55b | Finalização de proposta e Upgrade candidato — Bem Barato — B2B2C | 12 | Meio_de_Funil, Reativacao | Diario, N/A |
| CRM-e3372078aa | Topo de funil CRM candidato — Alvorada — B2B2C | 14 | Aquisicao, Meio_de_Funil | N/A |
| CRM-86b77dd1bc | Topo de funil CRM candidato — Bem Barato — B2B2C | 193 | Aquisicao | N/A |
| CRM-073dcbe686 | Topo de funil CRM candidato — Dia — B2B2C | 215 | Aquisicao, Reativacao | Diario, N/A, Novos |
| CRM-91f6d115db | Topo de funil CRM candidato — N/A — B2B2C | 1 | Meio_de_Funil | N/A |
| CRM-cc03a5f98d | Recuperação após instabilidade — Bem Barato — B2B2C | 1 | Reativacao | N/A |
| CRM-e3353b859a | Repescagem candidata — Bem Barato — B2B2C | 13 | Meio_de_Funil | N/A |
| CRM-24693c62ef | Repescagem candidata — Dia — B2B2C | 2 | Meio_de_Funil | N/A |
| CRM-f5ee848cf4 | Acionamento por compra recente — Bem Barato — B2B2C | 1 | Aquisicao | Compradores D-7 |
| CRM-2cc364c6bd | Carrinho abandonado — Proprietaria — B2C | 1206 | Reativacao | Abandonados D-21 A D>7, Abandonados D-7, Diario, N/A |
| CRM-f9b25b84df | Carrinho abandonado — Serasa — B2C | 1158 | Reativacao | Abandonados D-21 A D>7, Abandonados D-7, Diario |
| CRM-a695575900 | Finalização de proposta e Upgrade candidato — Proprietaria — B2C | 116 | Meio_de_Funil, Reativacao | Diario, N/A |
| CRM-85fefd8ebc | Finalização de proposta e Upgrade candidato — Serasa — B2C | 6 | Meio_de_Funil | N/A |
| CRM-6714bb10d7 | Acionamento da base proprietária — Proprietaria — B2C | 1187 | Aquisicao, Meio_de_Funil | N/A |
| CRM-e2dbd0d4bf | Acionamento da base proprietária — Serasa — B2C | 1 | Meio_de_Funil | N/A |
| CRM-798bf8f3a7 | Recuperação após instabilidade — Proprietaria — B2C | 2 | Meio_de_Funil, Reativacao | N/A |
| CRM-6e7d329c84 | Recuperação após instabilidade — Serasa — B2C | 4 | Meio_de_Funil | N/A |
| CRM-b34ee27854 | Originação por leads de parceiros — Acordo Certo — B2C | 7 | Meio_de_Funil | N/A |
| CRM-beb36081a4 | Originação por leads de parceiros — Bom_Pra_Credito — B2C | 40 | Meio_de_Funil | N/A |
| CRM-5eaebf1046 | Originação por leads de parceiros — Proprietaria — B2C | 28 | Meio_de_Funil | N/A |
| CRM-e63826e827 | Originação por leads de parceiros — Serasa — B2C | 82 | Meio_de_Funil | N/A |
| CRM-89856bcf7b | Repescagem candidata — Proprietaria — B2C | 252 | Meio_de_Funil | N/A |
| CRM-bdc57e480d | Carrinho abandonado — Plurix — Plurix | 2072 | Reativacao | Abandonados D-7, Diario, N/A |
| CRM-015928e5ba | Finalização de proposta e Upgrade candidato — Plurix — Plurix | 53 | Meio_de_Funil, Reativacao | Diario, N/A |
| CRM-9475544ed5 | Topo de funil CRM candidato — N/A — Plurix | 1 | Aquisicao | Leais |
| CRM-6d4dfb4e59 | Topo de funil CRM candidato — Plurix — Plurix | 1018 | Aquisicao | Ativacao, Churn, Frequentes, Leais, Leal, N/A, Novos, Ocasional, Pre_Churn, Sem Segmento |
| CRM-bcaf001164 | Acionamento de cartonistas e migração candidata — N/A — Plurix | 16 | Aquisicao | Ativo, N/A |
| CRM-0104a32e90 | Acionamento de cartonistas e migração candidata — Plurix — Plurix | 14 | Aquisicao | Ativo, N/A |
| CRM-ac74764beb | Recuperação após instabilidade — N/A — Plurix | 1 | Reativacao | N/A |
| CRM-92fbd40403 | Repescagem candidata — Plurix — Plurix | 49 | Meio_de_Funil | N/A |
| CRM-4b4cf35f73 | Acionamento por compra recente — Plurix — Plurix | 29 | Aquisicao | Compradores D-7 |

As 60 combinações e os 669 agrupamentos estão nos CSVs, preservando todos os vínculos, nomes e períodos. A classificação usa segmento e parceiro para localizar candidatos. Não comprova gatilhos, reanálise de crédito, intenção de cada peça ou estado individual de clientes.

## Famílias observadas em rentabilização e seguros

| ID | Família candidata | BU | Linhas | Agrupamentos |
|---|---|---|---|---|
| RENT-09a331cabd | Ativação | B2B2C | 1 | 1 |
| RENT-1565b28c8f | Black Friday inativos | B2B2C | 3 | 1 |
| RENT-7f04768511 | Copa Ativação | B2B2C | 1246 | 6 |
| RENT-68eae484cf | Copa Cartonistas | B2B2C | 12 | 1 |
| RENT-de7adb7cce | Copa Novos | B2B2C | 299 | 1 |
| RENT-fcb2005be4 | Copa Reativação | B2B2C | 342 | 2 |
| RENT-deaef88d25 | Copa cadastro incompleto | B2B2C | 1 | 1 |
| RENT-e26f566672 | Copa eventos e lembretes | B2B2C | 9 | 7 |
| RENT-77f8f33e8f | Copa incentivo ao cadastro | B2B2C | 15 | 1 |
| RENT-3d51d00ed6 | Copa público cadastrado | B2B2C | 83 | 1 |
| RENT-093062a4b8 | Incentivo ao uso Sorridentes e GIO | B2B2C | 2 | 1 |
| RENT-55b43e6e2a | Incentivo ao uso demais parceiros | B2B2C | 2 | 1 |
| RENT-839315987f | Oferta de investimento CDB | B2B2C | 4 | 2 |
| RENT-339eff5a34 | Aniversário com parceiro | B2C | 1 | 1 |
| RENT-7cfb8b35bf | Cadastro pontual | B2C | 16 | 1 |
| RENT-0500aab9d6 | Copa Ativação | B2C | 2 | 1 |
| RENT-aede134f3d | Desbloqueio | B2C | 366 | 1 |
| RENT-1752944e1c | Incentivo ao uso | B2C | 1308 | 1 |
| RENT-7b62e804a9 | Pagamento de contas | B2C | 2 | 1 |
| RENT-96f7a0892e | Pool de ofertas | B2C | 13 | 2 |
| RENT-6ca0baf5f3 | Recarga de celular | B2C | 1 | 1 |
| RENT-a9cebf447f | Recuperação de inativos no aniversário Afinz | B2C | 10 | 5 |
| RENT-63c4e611b8 | Welcome | B2C | 235 | 2 |
| RENT-392d973d79 | Ativação | Plurix | 10 | 2 |
| RENT-328952fe4d | Aumento de limite de cartonistas | Plurix | 1 | 1 |
| RENT-cafe598fb3 | Ação Avenida | Plurix | 1 | 1 |
| RENT-bda382d827 | Copa Ativação | Plurix | 95 | 3 |
| RENT-8cc1b6d474 | Copa Cartonistas | Plurix | 1 | 1 |
| RENT-bfa7c5c65b | Copa Novos | Plurix | 343 | 1 |
| RENT-e833be777d | Copa eventos e lembretes | Plurix | 3 | 3 |
| RENT-9bbaebd866 | Desbloqueio | Plurix | 917 | 1 |
| RENT-f73bceeb96 | Desbloqueio pós-tombamento | Plurix | 34 | 2 |
| RENT-2f0e84a868 | Incentivo ao uso | Plurix | 993 | 1 |
| RENT-16761c8a3a | Informativo de encerramento de pontos | Plurix | 1 | 1 |
| RENT-2cbba934fa | Natal Avenida | Plurix | 4 | 1 |
| RENT-0a46d97819 | Oferta de seguro em Plurix | Plurix | 79 | 1 |
| RENT-6afea2d2e0 | Seedlist nomeada | Plurix | 556 | 1 |
| RENT-5051e37f02 | Teste nomeado | Plurix | 1 | 1 |
| RENT-cd4c748d2b | Welcome | Plurix | 1017 | 1 |
| RENT-613bd68a2c | Carrinho de Seguro Mulher | Seguros | 372 | 3 |
| RENT-bc1d462c4c | Oferta Seguro Mulher | Seguros | 165 | 14 |
| RENT-7ab8558f4b | Seguro Residência 24h | Seguros | 95 | 9 |
| RENT-929cf587a1 | Teste nomeado | Seguros | 3 | 2 |

Parceiro aparece como N/A nessa fonte e foi preservado. Redes citadas em nomes são pistas, não identidades canônicas confirmadas. Aumento de limite de cartonistas em rentabilização permanece separado do conceito Upgrade de propostas em aquisição. Seguros e uso não herdam CAC/cartões como resultado apenas por possuírem campos semelhantes.

## Todas as campanhas de mídia observadas

| Plataforma | Campanha | Objetivo de negócio registrado | Período observado | Grão | Alias exato |
|---|---|---|---|---|---|
| google | [Afinz  /  Fábrica de Vendas] [RENTABILIZACAO][COPA]DISPLAY_B2C_VISA | rentabilizacao | 2026-08-13 a 2026-08-13 | ad | não |
| google | [Fábrica de Vendas - Cartões] [RENTABILIZACAO][COPA]DISPLAY_B2C_VISA | rentabilizacao | 2026-04-18 a 2026-08-17 | ad | sim |
| google | [Institucional] [009] [TMP] [B2C] [Demand] - Cartão de Crédito | marca | 2025-01-01 a 2026-01-08 | campaign | sim |
| google | [Institucional] [010] [TMP] [B2C] [Youtube] Cartão de Crédito | marca | 2025-01-01 a 2026-01-08 | campaign | sim |
| google | [Institucional] [011] [TMP] [B2C] [PMAX] Cartão de Crédito Download  /  QR CODE | b2c | 2025-01-01 a 2026-01-29 | campaign | sim |
| google | [Institucional] [012] [TMP] [MARCA] [Pesquisa] Institucional | marca | 2025-01-01 a 2025-10-08 | campaign | sim |
| google | [Institucional] [013] [TMP] [B2B] [Pesquisa] [Formulário] | marca | 2025-01-01 a 2025-04-08 | campaign | sim |
| google | [Institucional] [014] [TMP] [B2B] [Youtube] Cartão para Loja | marca | 2025-01-01 a 2025-04-08 | campaign | sim |
| google | [Institucional] [016] [TMP] [B2C] Display  /  QR CODE | marca | 2025-01-01 a 2025-09-10 | campaign | sim |
| google | [Institucional] [016] [TMP] [B2C] Display  /  QR CODE  /  VIBE | b2c | 2025-04-15 a 2025-05-29 | campaign | sim |
| google | [Institucional] [018] [TMP] [B2C] PMAX  /  Alvorada | b2c | 2025-03-25 a 2025-04-08 | campaign | sim |
| google | [Institucional] [14] [TMP] [S] Não Institucional  /  B2C | marca | 2025-01-01 a 2025-01-16 | campaign | sim |
| google | [Institucional] [15] [TMP] [GDN] B2C - Cartão de crédito | b2c | 2025-01-01 a 2025-01-16 | campaign | sim |
| google | [Institucional] [COPA][AQUISICAO]APP_INSTALL_B2C | aquisicao | 2026-04-16 a 2026-05-20 | ad, campaign | sim |
| meta | [007B] [TMP] Download App Matriz_BID2 | aquisicao | 2025-07-14 a 2025-08-11 | ad | sim |
| meta | [007] [TMP] Download App Matriz | aquisicao | 2025-01-01 a 2026-02-25 | ad | sim |
| meta | [02] [TMP]  Download App Advantage+ | aquisicao | 2025-01-01 a 2025-01-21 | ad | sim |
| meta | [Afinz  /  Fábrica de Vendas] [B2C]App_Install_Emissao_Afinz | pendente | 2026-08-20 a 2026-10-01 | ad | não |
| meta | [Afinz  /  Fábrica de Vendas] [B2C]App_Install_Onboarding_Afinz | aquisicao | 2026-08-28 a 2026-10-01 | ad | sim |
| meta | [Afinz  /  Fábrica de Vendas] [SEGUROS]Conversão_Leads | seguros | 2026-08-20 a 2026-10-01 | ad | sim |
| meta | [Afinz  /  Fábrica de Vendas] [SEGUROS]Conversão_Vendas | pendente | 2026-09-30 a 2026-10-01 | ad | não |
| meta | [B2C]App_Install_Afinz | aquisicao | 2025-01-01 a 2026-06-23 | ad | sim |
| meta | [B2C]App_Install_Emissao_Afinz | pendente | 2026-08-05 a 2026-08-18 | ad | não |
| meta | [B2C]App_Install_Onboarding_Afinz | aquisicao | 2026-06-22 a 2026-08-17 | ad | sim |
| meta | [Black Friday] Alcance | aquisicao | 2025-11-26 a 2025-12-17 | ad | sim |
| meta | [PLURIX]App_Install_Mais_Amigo | plurix | 2026-03-05 a 2026-08-11 | ad | sim |
| meta | [RENTABILIZACAO][COPA]Trafego_LP_Visa | rentabilizacao | 2026-05-11 a 2026-07-02 | ad | sim |
| meta | [RENTABILIZACAO][COPA]Trafego_LP_Visa_V2 | pendente | 2026-07-02 a 2026-08-19 | ad | não |
| meta | [SEGUROS]Conversão_Leads | seguros | 2026-04-06 a 2026-08-19 | ad | sim |

5 nomes/plataformas observados não têm alias exato no cadastro consultado. O inventário preserva esses nomes e os cadastros sem correspondência. Objetivo de plataforma (conversion, app_installs etc.) não substitui objetivo de negócio. Certificação de cadastro é mantida conforme a fonte; não certifica métrica ou atribuição.

## B2C, onboarding e Copa

| Assunto | Fonte | Linhas | Primeira data | Última data |
|---|---|---|---|---|
| Originação B2C — crm | b2c_daily_metrics | 31 | 2026-05-01 | 2026-05-31 |
| Originação B2C — serasa_api | b2c_daily_metrics | 270 | 2026-01-01 | 2026-09-27 |
| Originação B2C — total | b2c_daily_metrics | 635 | 2025-01-01 | 2026-09-27 |
| app_afinz_funnel_daily_raw — SIM | app_afinz_funnel_daily_raw | 952 | 2026-05-23 | 2026-09-28 |
| app_afinz_funnel_daily_raw — 0 | app_afinz_funnel_daily_raw | 395 | 2026-01-01 | 2026-09-28 |
| app_afinz_funnel_daily_raw — NAO | app_afinz_funnel_daily_raw | 1051 | 2026-05-23 | 2026-09-28 |
| serasa_bi_daily_funnel — Serasa BI | serasa_bi_daily_funnel | 193 | 2026-01-01 | 2026-07-12 |
| serasa_bi_neurotech_daily_funnel — Neurotech | serasa_bi_neurotech_daily_funnel | 271 | 2026-01-01 | 2026-09-28 |
| serasa_marketplace_daily_funnel — Marketplace | serasa_marketplace_daily_funnel | 57 | 2026-06-01 | 2026-07-27 |
| LP — __total__ | copa_lp_daily | 123 | 2026-04-15 | 2026-08-15 |
| LP — (direct) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 19 | 2026-04-30 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 57 | 2026-04-16 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — (todas_origens) | copa_lp_daily | 58 | 2026-04-15 | 2026-06-11 |
| LP — afz_car_vis_rnt_sms_atv_disp2_pontual | copa_lp_daily | 57 | 2026-04-15 | 2026-06-10 |
| LP — facebook | copa_lp_daily | 32 | 2026-05-11 | 2026-06-11 |
| LP — google | copa_lp_daily | 57 | 2026-04-16 | 2026-06-11 |
| LP — sfmc | copa_lp_daily | 47 | 2026-04-24 | 2026-06-11 |
| Visa — daily | copa_visa_daily | 122 | 2026-04-15 | 2026-08-15 |

Total B2C inclui componentes. Serasa, funis e AppsFlyer são perspectivas relacionadas, não somas de uma mesma jornada causal. O App apresenta 0, NAO e SIM em MARC_PLURIX; a equivalência de 0 com NAO depende da regra de ingestão e de sua vigência. Os recortes __total__ da LP são preservados sem soma às origens.

## Réguas, peças e assuntos documentados

Há 115 slots e 211 templates cadastrados. O inventário de slots preserva jornada, canal, cobertura e estado. As três réguas editoriais cadastradas são Topo de Funil Bem Barato, Topo de Funil Dia e Topo de Funil +amigo/Plurix. Elas podem contextualizar campanhas existentes, mas o vínculo por versão, atividade e execução ainda precisa de confirmação.

O vault também documenta Vibe adesão, crédito recebido, primeiro resgate, segunda e terceira transação, sorteios e a lacuna de variante Bem Mais. Esses momentos foram registrados como conhecimento documentado com execução não reconciliada, e não como novas campanhas ativas. Condições comerciais históricas e cronogramas não foram assumidos vigentes.

## Ambiguidades que mudam o entendimento

- DIA: existem 49 linhas de CRM em Reativacao cuja jornada contém CRM_AQUISICAO. Não converter silenciosamente esse conjunto em carrinho ou topo.
- Plurix: Cartonistas reúne sinais de tombamento/migração e vendas, com etapa física Aquisicao. A intenção precisa ser desdobrada antes da nota final.
- Upgrade: nova análise e comparação de limites não são colunas de activities. Aprovados_nao_convertidos é um público candidato, não prova de Upgrade.
- Repescagem: Negados descreve o passado; confirmar a nova elegibilidade antes de dar esse nome a todas as campanhas.
- Plurix tem linhas com Oferta Vibe. A ficha +amigo não permite transportar esse benefício por analogia; investigar período, produto e classificação.
- Rentabilização inclui welcome, desbloqueio pós-tombamento, seguros, CDB, funcionalidades e informativos. Cada mecanismo precisa de evento próprio de sucesso.
- Nomes de teste, seedlist e SDK foram mantidos e sinalizados. Não são automaticamente operações comerciais nem registros que podem ser apagados.

## Como transformar o inventário em Wiki

1. Escolher o mecanismo e a pergunta de negócio de cada candidato, preservando sua origem e suas ambiguidades.
2. Dar identidade estável à operação e relacionar campanhas/variantes. Fundir apenas com evidência de equivalência; separar quando gatilho, propósito ou evento de sucesso diferirem.
3. Criar entradas por operação, parceiro, público e etapa que apontem aos mesmos registros. CRM, Varejo, Serasa, migração, ativação, uso, seguros, mídia e originação precisam de trilhas próprias conectadas.
4. Todo assunto com resultados apresenta evolução mensal, cobertura e retrospectiva do mesmo recorte. Campanhas sazonais mantêm o histórico do ciclo e a ligação com a operação recorrente quando aplicável.
5. O Word reúne os assuntos selecionados para o período e preserva IDs, definições, evidências e decisões. O catálogo completo permanece consultável; o relatório não precisa despejar todos os registros.

## Cobertura e reprodução

A cobertura de CRM reconcilia 669 agrupamentos e 60 combinações aos 7.895 registros. Rentabilização reconcilia 92 agrupamentos aos 8.664 registros. Mídia reconcilia 32 grupos de nome/objetivo/grão aos 8.498 registros. B2C reconcilia suas três populações aos 936 registros. Essa conciliação certifica a cobertura do inventário, não a ausência de duplicidade ou a validade de resultados.

Regra de campanhas deste inventário inclui jornada para preservar fluxos distintos. Ela é uma chave de descoberta, não afirmação de que todo agrupamento corresponde a uma campanha aprovada. Classificação de rentabilização está declarada no script e nos campos classification_rule do CSV. Nenhuma taxonomia ou dado vivo foi alterado.


## Navegar por parceiro

[[07-Evolucao/Parceiro-Acordo-Certo|Acordo Certo]] · [[07-Evolucao/Parceiro-Alvorada|Alvorada]] · [[07-Evolucao/Parceiro-Bem-Barato|Bem Barato]] · [[07-Evolucao/Parceiro-Bom-Pra-Credito|Bom_Pra_Credito]] · [[07-Evolucao/Parceiro-Dia|Dia]] · [[07-Evolucao/Parceiro-Plurix|Plurix]] · [[07-Evolucao/Parceiro-Proprietaria|Proprietaria]] · [[07-Evolucao/Parceiro-Serasa|Serasa]]

## Navegar por segmento

[[07-Evolucao/Segmento-Abandonados|Abandonados]] · [[07-Evolucao/Segmento-Aprovados-nao-convertidos|Aprovados_nao_convertidos]] · [[07-Evolucao/Segmento-Base-Proprietaria|Base_Proprietaria]] · [[07-Evolucao/Segmento-CRM|CRM]] · [[07-Evolucao/Segmento-Cartonistas|Cartonistas]] · [[07-Evolucao/Segmento-Instabilidade|Instabilidade]] · [[07-Evolucao/Segmento-Leads-Parceiros|Leads_Parceiros]] · [[07-Evolucao/Segmento-Negados|Negados]] · [[07-Evolucao/Segmento-Recencia-de-Compra|Recencia_de_Compra]]
