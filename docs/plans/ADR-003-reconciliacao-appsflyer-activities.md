# ADR-003 — Reconciliação AppsFlyer × Activities via motor de taxonomia

- Status: proposto (aguardando revisão do Codex antes de implementar)
- Data: 2026-08-06
- Escopo: aba Comunicações (Cadastro e Templates + Performance do Conteúdo), pipeline `collect-appsflyer`
- Depende de: ADR-002 (identidade de comunicações, assets e AppsFlyer) — este ADR estende, não substitui

## Contexto

O ADR-002 definiu o contrato `template_id` = `af_sub3` do link AppsFlyer e criou `communication_templates`/`communication_slots`/`activities.template_id`. Isso funciona, mas hoje cobre uma fatia pequena da operação: só disparos que passam por link OneLink governado (na prática, hoje, apenas parte do CRM) carregam `af_sub3`. Medido em produção (2026-08-06, dados reais):

- `appsflyer_acquisition_daily`: cobertura de `sub_param_3` (af_sub3) é **2,6%** dos installs no período testado.
- `activities.template_id`: **~5.100 de ~5.200 disparos** (dataset completo, todas as BUs) estão sem `template_id` vinculado. Por BU/canal: Plurix WhatsApp (maior volume da operação, 1.984 disparos no período de referência) tem **0** `template_id` preenchido.
- Mesmo nas linhas que TÊM `af_sub3` populado, a reconciliação contra o catálogo falha 100% das vezes hoje — não por falta de dado, mas por um bug de normalização (ver "Bug confirmado" abaixo).

Ou seja: o gargalo não é só "falta instrumentar mais réguas com link governado" (verdade, mas lento e fora do controle do time de dados) — é também "o pouco que já chega certo não está sendo aproveitado" (rápido, dentro do nosso controle).

Separadamente, o time já construiu — para um problema adjacente (ligar `activities` a `communication_templates` quando falta `template_id`) — um motor de parsing e matching por confiança (`src/utils/taxonomy.ts` + `src/hooks/useReconciliation.ts`, aba Comunicações → Cadastro e Templates → Fila de Reconciliação). Esse motor já resolve exatamente a classe de problema deste ADR (decodificar um identificador solto em dimensões — público/canal/campanha/segmento/momento — e casar contra candidatos com confiança graduada, nunca 1:1 forçado). Ele só nunca foi apontado para dados da AppsFlyer.

## Bug confirmado (bloqueante, precede qualquer trabalho novo)

`src/utils/templateId.ts` documenta explicitamente: *"o `template_id` é EXATAMENTE o `af_sub3` do link AppsFlyer (caixa mista, ex.: `b2c_email_copa_bsp_S1D01`). Preservar a caixa é obrigatório para a atribuição casar — por isso NÃO fazemos uppercase."*

Confirmado por query: **61 de 61** `template_id` em `communication_templates` contêm letra maiúscula (o token de momento, ex. `S1D01`).

`supabase/functions/collect-appsflyer/index.ts`, função `extractDimensionKey()`, grava `sub_param_3: normOrEmpty(record.af_sub3)` — e `normOrEmpty` chama `norm()`, que faz `.trim().toLowerCase()`. Isso é correto e necessário para as outras dimensões (media_source, campaign, geo — que são chaves de agrupamento, não identidade de catálogo), mas **destrói a identidade do `template_id`** antes de gravar em `appsflyer_acquisition_daily.sub_param_3` e em `appsflyer_template_daily.template_id`.

Resultado prático: mesmo um link governado que manda `af_sub3=b2c_email_copa_bsp_S1D01` corretamente vira `b2c_email_copa_bsp_s1d01` no banco, e o join exato em `src/hooks/useAppsFlyerAnalytics.ts` (`communication_templates.template_id === appsflyer_template_daily.template_id`) nunca bate. É a causa raiz do "Não reconciliado no catálogo" que aparece hoje na Performance por Template mesmo em linhas com `af_sub3` presente.

## Discrepância a esclarecer (não bloqueante, mas registrar)

A tabela de contrato do ADR-002 diz `af_sub1` = espelho do `template_id` para BI/raw data. Os dados reais observados (2026-08-06) mostram `sub_param_1` carregando valores de **segmento** (`negados`, `abandonados`, `crm`), não `template_id` — e é `sub_param_3` que carrega o valor no formato `template_id`. Ou a implementação real do gerador de OneLink divergiu do contrato desenhado no ADR-002, ou o contrato mudou sem atualizar o documento. Este ADR assume `sub_param_3` como fonte de verdade (é o que bate com `communication_templates.template_id` depois do fix de case), mas quem mantém a planilha/fluxo gerador de OneLink deveria confirmar e, se for o caso, corrigir o ADR-002.

## Decisão

1. Corrigir a normalização no coletor para preservar a caixa de `af_sub3` (e só dele — as demais dimensões continuam normalizadas para agrupamento).
2. Trocar o join exato AppsFlyer↔catálogo por uma chamada ao mesmo motor de matching por confiança já usado em Activities↔Templates, adaptando a entrada (ver spec).
3. Estender esse motor para também tentar reconciliar linhas da AppsFlyer **sem** `af_sub3` (a maioria) contra `activities`, usando as dimensões que a AppsFlyer já entrega (`af_channel`, `sub_param_1`, `app_id`→BU) + o texto da activity, com a mesma disciplina de confiança graduada e nunca atribuição 1:1 forjada quando ambíguo.
4. Persistir o resultado da reconciliação (installs/clicks/sessões atribuídos a uma `activity_name`, com confiança e proveniência) em uma tabela nova, **não** em colunas soltas dentro de `activities` — para não misturar fonte Salesforce/Framework com fonte AppsFlyer na mesma linha/tabela, e preservar a possibilidade de reprocessar/reverter sem risco de contaminar o dado do Framework. Ver detalhamento e alternativa em `SDD_RECONCILIACAO_APPSFLYER.md`.

## Escopo desta fase

Só `media_source='crm'` em `appsflyer_acquisition_daily`/`appsflyer_campaign_daily` entra na reconciliação com `activities`. Linhas de mídia paga (`facebook ads`, `googleadwords_int`, etc.), cross-sell (`cross_sale`), blog, orgânico e afins **não têm relação com `activities`** (não são réguas CRM) — essas seguem para o bridge de spend-to-install com `paid_media_metrics` (assunto separado, já mapeado, fora deste ADR).

## Não objetivos desta fase

- Instrumentar Plurix/canais sem link governado (decisão de processo/negócio, não técnica — ver `SDD_RECONCILIACAO_APPSFLYER.md` §7).
- Backfill retroativo de todo o histórico pré-pipeline AppsFlyer.
- Atribuição automática sem revisão humana para confiança `fraca` ou `novo`.
- Unificar `activities` com a tabela nova de reconciliação numa view materializada — fica para depois de validar a qualidade do match em produção.

## Consequências

### Positivas
- Aproveita 100% de um motor já testado (`taxonomy.ts` tem golden-set de regressão) em vez de reescrever heurísticas do zero.
- Corrige um bug real com fix pequeno e isolado (1 linha no coletor), desbloqueando a fatia de CRM que já tem `af_sub3`.
- Mantém o princípio de proveniência do projeto (nunca fingir precisão) ao separar fisicamente dado Framework de dado AppsFlyer.

### Trade-offs
- A camada inferida (sem `af_sub3`) não é 100% automática por design — precisa de uma fila de revisão (reaproveitando o padrão UX da Fila de Reconciliação existente), o que é trabalho de operação, não só de engenharia.
- Cobertura real de instalação↔activity continua limitada pela cobertura de link governado, que é um problema de processo fora do controle deste pipeline.

