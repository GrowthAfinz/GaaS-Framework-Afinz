# Mapping Reference

This file records the current AFINZ Copa 2026 CRM acquisition mapping.

## Inputs

Supabase project: `mipiwxadnpwtcgfcedym`

Table: `activities`

Relevant physical columns:
- `"Data de Disparo"` -> report date
- `"BU"`
- `"Parceiro"`
- `"Segmento"`
- `"Etapa de aquisição"`
- `"Canal"`
- `"Base Acionável"` -> Entregues
- `"Cartões Gerados"` -> Emitidos
- `"Aprovados"`
- `"Propostas"` -> Proposta
- `jornada`
- `"Activity name / Taxonomia"`

Normalize channels:
- contains `MAIL` -> `E-MAIL`
- contains `WHATSAPP` or equals `WPP` -> `WPP`
- contains `SMS` -> `SMS`

## B2C

Order matters.

| Rule | Destination |
|---|---|
| `Segmento = Leads_Parceiros` | `B2C / LEADS PARCEIROS B2C` |
| `BU = B2C`, `Parceiro = Serasa`, `Segmento = Base_Proprietaria`, `Etapa = Meio_de_Funil` | `B2C / LEADS PARCEIROS B2C` |
| `BU = B2C`, `Parceiro = Proprietaria`, `Segmento = Base_Proprietaria`, `Etapa = Aquisicao` | `B2C / TOPO DE FUNIL B2C` |
| `BU = B2C`, `Parceiro = Proprietaria`, `Segmento = Negados`, `Etapa = Meio_de_Funil` | `B2C / REPESCAGEM B2C` |
| `BU = B2C`, `Parceiro = Proprietaria`, `Segmento = Aprovados_nao_convertidos`, `Etapa = Meio_de_Funil` | `B2C / UPGRADE B2C` |
| `BU = B2C`, `Parceiro in (N/A, Serasa)`, `Segmento = Abandonados` | `B2C / CARRINHO ABANDONADO B2C` |

## Plurix

| Rule | Destination |
|---|---|
| `BU = Plurix`, `Parceiro = N/A`, `Segmento = CRM`, `Etapa = Aquisicao` | `PLURIX / TOPO DE FUNIL PLURIX` |
| `BU = Plurix`, `Parceiro = N/A`, `Segmento = Negados`, `Etapa = Meio_de_Funil` | `PLURIX / REPESCAGEM PLURIX` |
| `BU = Plurix`, `Parceiro = N/A`, `Segmento = Aprovados_nao_convertidos` | `PLURIX / UPGRADE PLURIX` |
| `BU = Plurix`, `Parceiro = N/A`, `Segmento = Recencia de Compra` | `PLURIX / RECENCIA PLURIX` |
| `BU = Plurix`, `Parceiro = N/A`, `Segmento = Abandonados` | `PLURIX / CARRINHO ABANDONADO PLURIX` |

## Dia

| Rule | Destination |
|---|---|
| `BU = B2B2C`, `Parceiro = Dia`, `Etapa = Aquisicao` | `DIA / TOPO DE FUNIL DIA` |
| `BU = B2B2C`, `Parceiro = Dia`, `Etapa = Meio_de_Funil` | `DIA / REPESCAGEM DIA` |

## Bem Barato

| Rule | Destination |
|---|---|
| `BU = B2B2C`, `Parceiro = Bem Barato`, `Segmento in (CRM, Recencia de Compra)`, `Etapa = Aquisicao` | `BEM BARATO / TOPO DE FUNIL BB` |
| `BU = B2B2C`, `Parceiro = Bem Barato`, `Segmento in (Negados, Aprovados_nao_convertidos)`, `Etapa = Meio_de_Funil` | `BEM BARATO / REPESCAGEM BB` |

## Expected Unmapped

For the current acquisition report, `Seguros / Rentabilizacao / Cross-sell` is intentionally outside scope and should remain visible in `Auditoria`.
