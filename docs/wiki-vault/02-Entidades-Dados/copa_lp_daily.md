---
tags: [supabase, tabela, copa, lp-visa, proposta]
tipo: entidade
camada: dados
atualizado: 2026-06-11
status: confirmado
fonte: looker-ga4
---

# Tabela: copa_lp_daily

> 📊 Criada e populada em 2026-06-11 — 559 linhas, 58 dias (15/04–11/06), via export CSV do Looker lido pelo agente Chrome. Linha `origem='__total__'` = totais diários + funil; `origem='(todas_origens)'×midia` = cobertura completa por mídia; `origem=<utm>` = top origens do gráfico (limite de séries do Looker). `optins_sucesso` ainda zerado no diário (path fora do top do gráfico). **Semântica confirmada: `etapa_optin` = "Optins LP" do acompanhamento manual v4** (15/04: 2.565 tráfego / 1.031 opt-ins ✓).

**Definição:** métricas diárias da **LP Visa Copa** (GA4 via Looker Studio "AFINZ COPA - 2026") — o universo de dados que hoje não tem ponte com o Supabase e é preenchido manualmente no XLSX de rentabilização.

## Por que existe
O export "Rentabilização Copa" do GaaS tem as colunas fixas `Trafego LP` e `Optins LP` **vazias** — preenchidas à mão a partir do Looker. Esta tabela cria a ponte, no mesmo padrão de [[b2c_daily_metrics]] (grão diário + dimensão de tipo).

## Schema proposto
| Campo | Tipo | Notas |
|---|---|---|
| `data` | date | dia fechado |
| `origem` | text | utm_source normalizado: `google`, `facebook`, `sfmc`, `(direct)`, UTMs SFMC (`afz_car_vis_rnt_*`), etc. |
| `midia` | text | utm_medium: `cpc`, `email`, `sms`, `whatsapp`, `(none)` |
| `grupo_origem` | text | derivado: `midia_paga` / `crm` / `organico` / `outros` (contrato do [[Dossie-Mestre-Operacao-CRM-Midia]]) |
| `usuarios` | int | usuários únicos na LP |
| `acessos_lp` | int | views `/site/afinz/afinz-copa-26/` |
| `etapa_optin` | int | views `/cadastro/optins` |
| `optins_sucesso` | int | views `/cadastro/sucesso` — proxy forte de conclusão ([[Copa-2026]]) |
| `raw_payload` | jsonb | export bruto do Looker p/ auditoria |

PK composta sugerida: `(data, origem, midia)`. Linha agregada `origem='__total__'` sem filtro para controle (regra do Dossiê).

## Ingestão
**Decisão aberta** — caminhos avaliados em 2026-06-11:
1. **Agente Chrome (Claude lê o Looker)** — acesso confirmado ao dash; leitura assistida e gravação via MCP Supabase. Sem credencial GCP.
2. **Export CSV do Looker + skill** (padrão [[b2c_daily_metrics|b2c-originacao-updater]]).
3. **API GA4/BigQuery** — automação total, exige projeto GCP.

## Dimensões disponíveis no Looker (inventário 2026-06-11)
Dia, Origem, Mídia, Cidade, Página (paths do funil), Hora, Dispositivo, SO, Navegador. KPIs do dash: Total usuários 26.068, únicos 26.035, visualizações 103.257, Cadastre-se Home 14.531, `/cadastro/sucesso` 2.856 (15/abr–11/jun). **v1 ingere só Dia × Origem × Mídia × funil de páginas** — cidade/hora/dispositivo ficam fora do grão (cauda longa, baixo valor para o XLSX).

## Papel da fonte (decisão 2026-06-11)
O Looker/GA4 é **proxy de funil e tráfego**, não a fonte oficial de opt-in — a oficial é o BI da Visa ([[copa_visa_daily]], Clientes 7.254 no período vs 2.856 `/cadastro/sucesso` no GA4, captura ~39%). O valor único desta tabela é a quebra **diária por origem/mídia (UTM)** — só o GA4 liga CRM e mídia paga ao tráfego da LP.

### Pendência residual
O total do v4 manual (4.596 opt-ins) não reconcilia exatamente com nenhuma das duas fontes; tratar o v4 como legado e validar a data de corte se precisar de histórico.

## Relacionado
- [[Copa-2026]] · [[Export-XLSX-Renta-Copa]] · [[b2c_daily_metrics]] · [[Dossie-Mestre-Operacao-CRM-Midia]] · [[rentabilizacao_activities]] · [[paid_media_metrics]]
