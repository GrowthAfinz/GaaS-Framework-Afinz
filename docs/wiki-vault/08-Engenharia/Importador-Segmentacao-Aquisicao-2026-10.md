---
tags: [engenharia, crm, importador, segmentacao]
tipo: contrato
camada: operacao
atualizado: 2026-10-26
status: implementado
fonte: codigo-e-supabase
---

# Segmentação de aquisição no importador

## Confirmação do responsável — ANC e respostas WhatsApp, 26/10/2026

**ANC / Aprovados_nao_convertidos = Meio_de_Funil, sem subgrupo (`N/A`).**
A regra explícita vence subgrupos herdados por similaridade, como Diario ou
Abandonados D-21 A D>7. Eles não devem aparecer como sugestões de ANC.

O formato abreviado `JOR_AQS_BB_NA_ANC_*` corresponde a B2B2C / Bem Barato / ANC.
O sufixo `_resposta_optout_pontual`, em WhatsApp, identifica a mensagem de resposta
ao clique em **“Não tenho interesse agora”** nos templates. É reutilizado entre
jornadas; seu histórico compartilhado não é evidência do público da jornada atual.

Semântica, causa do erro e oportunidades de acompanhamento:
[[WhatsApp-Respostas-de-Opt-out]]. A correção do parser foi implementada no checkout
local em 26/10; publicação na aplicação deve ser verificada separadamente.

Aplicação restrita ao lote em revisão: 28 respostas dos grupos 1 e 2 foram
incluídas com Meio_de_Funil / N/A; em 20 ANC inseridos no lote anterior foi
corrigido apenas Subgrupos para N/A. Métricas e demais campos foram preservados,
com comparação integral antes/depois. Execução auditável em gaas_update_runs:
`6fd08e4a-f4ca-53a5-a9c9-0e82663feb2e`, com 48 registros em gaas_update_candidates.
O registro de comunicação principal do grupo 3 permaneceu separado dessa aplicação.

## Contrato anterior e histórico de alterações

Repescagem usa **Negados / Meio_de_Funil**; upgrade usa
**Aprovados_nao_convertidos / Meio_de_Funil**. Topo mantém **CRM** ou
**Base_Proprietaria**, conforme o público, na etapa **Aquisicao**.

Carrinho usa **Abandonados / Reativacao**, com subgrupos **Diario**,
**Abandonados D-7** e **Abandonados D-21 A D>7**. Janela do público,
cadência e posição do disparo são conceitos distintos: uma activity diária ou
com D7 pode pertencer ao público 21D. A confirmação do responsável para uma jornada exata tem prioridade. Fora dessas
confirmações, evidência explícita 21D vence o nome genérico sábado; conflitos sem
evidência suficiente ficam em revisão.

B2C e Plurix são BUs. Bem Barato pertence a B2B2C. O contrato atual mantém
Parceiro N/A para Plurix. A transição JOR_AQUISICAO → JOR_AQS conserva a identidade
da execução e não autoriza duplicar os resultados.

Em 15/10/2026 foram corrigidos 81 subgrupos e 41 etapas, preservando as métricas
dos registros existentes, e incorporados cinco disparos Plurix 21D ausentes.
O caso B2C inicialmente em revisão foi depois confirmado como 21D pelo responsável. Execução auditável:
`0ccaadca-5c9d-4047-9628-9b5960f726d5`.

Detalhes de implementação e recuperação:
[contrato técnico](https://github.com/GrowthAfinz/GaaS-Framework-Afinz/blob/main/docs/reference/intelligent-import-acquisition-audiences.md).

## Janelas confirmadas pelo responsável

- `JOR_AQS_PLURIX_CARRINHO_SABADO_PAD_26`: **7 dias**, mesmo com `21dias` no nome da activity.
- `JOR_AQS_PLURIX_NA_ABD_CARRINHO21D_SET_26`: **acima de 7 até 21 dias**, sem alteração.
- `JOR_AQUISICAO_B2C_PROPRI_ABD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26`: **acima de 7 até 21 dias**.

Cinco registros da primeira jornada foram ajustados para 7D. A revisão B2C foi
encerrada mantendo 21D. Execução `caecd1b0-b2c6-462b-8b06-b1f797c3a1dc`, com
métricas e demais campos preservados, sem novas inserções em activities.

## Custos e CAC — correção em 15/10/2026

O RPC de atualização ignorava os campos financeiros enviados pelo cliente. Agora deriva
custo e CAC usando a linha existente e as métricas recebidas, inclusive em arquivos
parciais. Preserva tarifas positivas registradas e custos positivos de campanha quando
a base entregue não mudou. Quando a base muda, preserva o componente de incentivo
já observado; incentivo sem evidência permanece desconhecido. Não aplica custo de
oferta por toda a base usando uma taxa histórica por cartão.

Tarifas ausentes usam somente o contrato canônico conhecido de 2025/2026 em
frameworkFields.ts. Canal/data não cobertos não recebem preço inventado. O cliente
deixa a atualização financeira ao RPC. Inserts continuam calculando canal × entregues;
o trigger activities_derive_cac garante divisão numeric no banco para todos os escritores.
CAC é NULL quando custo ou denominador são desconhecidos, ou cartões <= 0.
Arredondamento fica na apresentação. IDs ausentes ou repetidos bloqueiam o lote inteiro.

Lote auditável activity_data_correction_audit.batch_key = finance-20261015-v1:
5.602 activities com alteração financeira; 464 custos de campanha, 4.725 totais de
canal, 463 tarifas ausentes e 1.909 CAC alterados. Os conjuntos se sobrepõem.
Foram mantidos os 8.150 registros e todos os campos não financeiros. Custos positivos
de campanha existentes e os 21 registros com incentivo positivo foram preservados.
Validação posterior: zero custos de campanha ausentes com entregues positivos;
zero divergências de CAC; zero custos totais de canal nulos.

Revisão humana separada: 49 Dia/CRM e 19 conflitos NGD/ANC; 377 grupos por
Activity Name + canal + dia de São Paulo (764 registros). Nenhuma classificação ou
exclusão automática. Há 786 divergências entre cartões e soma das emissões; exemplos
recentes de 13 e 14/10 também apresentam assistidas/independentes 0/0 no CSV fonte.
Isso não permite redistribuição artificial. Um custo unitário de oferta de -2 em
06/01/2026 continua sinalizado para apuração, sem sobrescrever o custo registrado.

Validação: testes do importador, suíte src completa, typecheck de release; no banco,
testes transacionais revertidos cobrem atualização parcial de cartões/entregues,
preservação de tarifa e incentivo, custo zero, CAC indefinido e atomicidade com ID ausente.


## Confirmações de classificação e origem — 15/10/2026

- Dia / CRM tem etapa Aquisicao; não é Reativacao. Corrigidos 49 registros.
- JOR_AQUISICAO_B2C_BP_ANC_AQUISICAO_VIBE_DOBRO_DEZ25 (nome DEZ2 informado de forma abreviada): parceiro Proprietaria, segmento Aprovados_nao_convertidos; 3 segmentos corrigidos. BP no slot do parceiro não transforma o público ANC em Base_Proprietaria.
- JOR_AQUISICAO_PLURIX_NA_NGD_MEIO_DE_FUNIL_PADRAO_NA_ABRI26: Negados / Meio_de_Funil (repescagem); 1 segmento corrigido, o outro já estava correto.
- Run auditável: 770c704f-031a-4ad4-9728-6e54b7b0f393, 53 activities, métricas/custos/demais campos preservados.
- Respostas padrão afz_car_vis_aqs_wpp_apr_resposta_optout_pontual e afz_car_bbt_aqs_wpp_apr_resposta_optout_pontual podem existir em jornadas diferentes. Isso não é duplicidade nem prova de renomeação. Preservar contexto da jornada; não propagar resultados entre essas jornadas. Repetição na mesma jornada/canal/data ainda precisa revisão.
- Serasa/ECRED é marketplace/API externo à jornada padrão: cartões podem chegar sem apontamento assistido/independente; preservar os campos recebidos (inclusive 0/0), sem redistribuição artificial. A triagem anterior tinha 703 casos com evidência no nome/parceiro que passam a exceção aceita; 83 sem essa evidência continuam para verificar origem, não como erros confirmados.
- 21 registros de oferta unitária R$76,50 em 2025 foram confirmados corretos pelo responsável; não alterar. Priorizar custos de 2026 em diante.

O importador passa a detectar mudança de segmento canônico mesmo quando a etapa já coincide e mantém a jornada explícita acima de um indício de público na activity. Campos canônicos continuam passando por confirmação no fluxo de importação. Há 15 classificações antigas restantes com sugestões por registro, ainda não aplicadas; divergência entre jornada e activity exige evidência do período.
