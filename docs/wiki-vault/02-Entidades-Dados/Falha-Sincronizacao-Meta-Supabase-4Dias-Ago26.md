---
tags: [dados,midia,meta,supabase,pipeline,qualidade-de-dados,pendencia]
tipo: entidade-dados
camada: dados
atualizado: 2026-08-21
status: pendente
fonte: meta-ads-api-vs-supabase-paid_media_metrics
---

# Falha de Sincronização Meta → Supabase — quatro dias do trimestre mai–jul/26

**Definição:** quatro datas em que `paid_media_metrics` não recebeu o gasto completo do Meta —
28/06, 24/07, 25/07 e 26/07/2026. O buraco atinge **todas as frentes ao mesmo tempo**, não uma
campanha isolada, o que indica falha da rotina de sincronização nesses dias específicos, não
problema de uma campanha.

## Como foi encontrado

Comparando o relatório trimestral de mídia paga (`Relatorio_Trimestral_Midia_Paga_Mai-Jul26_v3`)
com os valores direto da API do Meta Ads, campanha a campanha. O gatilho foi uma pergunta sobre
por que Plurix não tinha instalação em junho/julho — a investigação de causa levou a comparar
gasto, não só resultado, e aí apareceu a divergência de investimento.

Confirmado em `paid_media_metrics` via calendário completo: nessas quatro datas o número de
campanhas com registro cai de 5 para 2 ou 3, quando deveriam ser 5 (Aquisição, Rentabilização,
Seguros, Plurix, mais a variante de nome que estiver ativa no período).

## O que falta, por frente

| Frente | Reportado na v3 | Falta (Meta real) | Correto |
|---|---|---|---|
| Aquisição App B2C | R$ 16.679 | R$ 792 | R$ 17.471 |
| Rentabilização | R$ 17.913 | R$ 791 | R$ 18.704 |
| Seguros | R$ 8.220 | R$ 366 | R$ 8.586 |
| Plurix | R$ 7.616 | R$ 398 | R$ 8.014 |
| **Trimestre** | **R$ 50.428** | **R$ 2.347** | **R$ 52.775** |

O investimento real do trimestre é **4,7% maior** que o reportado. O padrão se repete em todas as
frentes, o que descarta causa específica de campanha e aponta para a rotina de ingestão em si.

## Detalhe por dia (fonte: Meta Ads API, nível campanha)

| Data | Aquisição | Rentabilização | Seguros | Plurix |
|---|---|---|---|---|
| 28/06 | R$ 219,03 | R$ 133,09 | R$ 158,67 | R$ 134,19 |
| 24/07 | R$ 182,87 | R$ 206,92 | R$ 63,78 | R$ 95,95 |
| 25/07 | R$ 181,76 | R$ 210,29 | R$ 64,15 | R$ 77,88 |
| 26/07 | R$ 208,19 | R$ 240,50 | R$ 79,03 | R$ 89,87 |

Verificado via `mcp__meta-ads` (`ads_get_ad_entities`, contas `863257421685104` Fábrica de Vendas
e `296123802962215` Afinz | Seguros — Seguros roda na primeira, a segunda não tem campanha
relacionada) e cruzado com `execute_sql` no Supabase, projeto `mipiwxadnpwtcgfcedym`, tabela
`paid_media_metrics`.

## Decisão tomada em 21/08/2026

O relatório trimestral (v3) **não foi corrigido** com esses valores — decisão do dono do projeto,
para não travar a apresentação numa correção de pipeline em cima da hora. Esta nota registra a
pendência para a próxima rodada de relatório ou para quem for investigar a rotina de sync.

## Consequência prática

1. Qualquer número de investimento do trimestre mai–jul/26 tirado direto de `paid_media_metrics`
   está entre 4% e 5% abaixo do real — vale para qualquer frente, não só Plurix.
2. Antes do próximo relatório fechar, reprocessar especificamente 28/06, 24/07, 25/07 e 26/07 na
   rotina de sincronização, ou pelo menos rodar a mesma comparação Meta × Supabase para confirmar
   se o buraco também existe em outros meses fora do trimestre analisado.
3. Se a causa for um limite de paginação ou timeout da rotina de ingestão nesses dias, vale checar
   se datas de alto volume (ex. Black Friday, se aplicável) têm o mesmo risco.

## Relacionado

- [Quebra-de-Medicao-Aquisicao-B2C-Jun26](#quebra-de-medição-aquisição-b2c-junho-de-2026) ·
  [Mídia-Paga](#mídia-paga)
