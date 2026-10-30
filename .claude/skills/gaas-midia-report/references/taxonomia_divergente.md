# Taxonomia de objetivo de mídia — dashboard vs. XLSX (divergência real)

Duas classificações de "para que serve essa campanha" convivem no repo hoje,
lidas de fontes diferentes, sem reconciliação automática entre elas.

## A — Catálogo dinâmico do dashboard (fonte: banco)

Tabela `paid_media_objectives` (6 linhas, editável pela UI `ObjectivesManager`),
aplicado a campanhas via `paid_media_campaign_mappings.objective`
(campanha → objetivo, mantido manualmente em `CampaignMapperModal` /
`CampaignMappingsModal`).

| key | label |
|---|---|
| `marca` | Branding (Marca) |
| `b2c` | Performance (B2C) |
| `plurix` | Plurix |
| `seguros` | Seguros |
| `aquisicao` | Aquisição |
| `rentabilizacao` | Rentabilização |

## B — "Frentes" fixas do exportador XLSX (fonte: regex no nome da campanha)

`classifyFrente()` em `calendar-estrategico/src/utils/midiaPagaMonthlyReportExport.ts:75-81`.
Ordem de precedência importa (primeira regex que bater vence):

| Ordem | Regex | Frente |
|---|---|---|
| 1 | `COPA\|RENTABILIZA\|LP_Visa\|DISPLAY_B2C_VISA\|\[Demand\]\|\[Youtube\]` | Marca B2C (Copa) |
| 2 | `\[SEGUROS\]` | Seguros |
| 3 | `\[PLURIX\]\|mais_amigo` | Aquisição Plurix |
| 4 | (resto) | Aquisição B2C |

Budget mensal hardcoded nesse mesmo arquivo (`FRENTE_BUDGET`, linhas 35-40, e
duplicado em `midiaPagaDiarizadoSheet.ts` como `MONTHLY_BUDGETS`) — **não lê**
`paid_media_budgets`:

| Frente | Budget hardcoded |
|---|---|
| Aquisição B2C | R$ 7.000 |
| Aquisição Plurix | R$ 3.000 |
| Marca B2C (Copa) | R$ 5.000 |
| Seguros | R$ 3.000 |

## Correspondência aproximada (A → B)

Não é 1:1 — a coluna A é a fonte editável de negócio, a B é derivada só do nome.

| Objetivo A (dashboard) | Frente B (XLSX) mais próxima | Onde pode divergir |
|---|---|---|
| `aquisicao` | Aquisição B2C | se o nome da campanha carregar `[PLURIX]`/`COPA` mas o mapeamento manual disser `aquisicao`, B classifica diferente de A |
| `b2c` | Aquisição B2C | idem — `b2c` e `aquisicao` colapsam na mesma frente B, perdendo granularidade |
| `plurix` | Aquisição Plurix | só diverge se o nome não tiver a tag `[PLURIX]`/`mais_amigo` mas o mapeamento disser `plurix` |
| `marca` | Marca B2C (Copa) | B também captura `RENTABILIZA`/`LP_Visa` que em A pode estar mapeado como `rentabilizacao`, não `marca` — **colisão conhecida** |
| `rentabilizacao` | Marca B2C (Copa) | mesma colisão acima — A separa marca de rentabilização, B funde as duas em "Marca B2C (Copa)" |
| `seguros` | Seguros | tag `[SEGUROS]` costuma ser consistente com o mapeamento manual |
| *(sem mapeamento em A)* | resto → Aquisição B2C | B nunca produz "sem mapeamento" — toda campanha cai em alguma frente por default, o que **esconde** o gap que A expõe |

## Implicação prática para a skill

- A é a mais granular e é a que o usuário edita ativamente na UI — trate como
  fonte primária para "objetivo de negócio" em qualquer leitura nova.
- B nunca mostra "sem mapeamento" (tudo cai em Aquisição B2C por default) — não
  use B para auditar cobertura de mapeamento, só A revela isso.
- A conhecida colisão `marca`/`rentabilizacao` → mesma frente B é o ponto mais
  provável de um número "bater" no XLSX e não bater no dashboard (ou vice-versa)
  quando alguém comparar os dois relatórios lado a lado. Se o usuário perguntar
  "por que a Copa aparece diferente no Excel e no app", comece por aqui.
