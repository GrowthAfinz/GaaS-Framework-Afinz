---
tags: [engenharia, export, xlsx, copa, rentabilizacao]
tipo: referencia
camada: engenharia
tipo_diataxis: explanation
atualizado: 2026-06-19
status: implementado
fonte: gaas-codigo
---

# Export XLSX Rentabilização Copa — arquitetura atual e evolução

> ✅ **v2 em produção desde 2026-06-11** — commit `6843143` na main (auto-deploy GH Pages via Actions), **testada e validada pelo operador no mesmo dia**. A seção "Evolução proposta" abaixo foi implementada; ver "Estado implementado".

## Estado implementado (v2)
- `fetchCopaFixedDaily(start, end)` busca os 3 universos em paralelo e indexa por data (`CopaFixedIndex`). Cada fonte tem try/catch próprio: indisponibilidade gera `console.warn` e colunas vazias — o export nunca quebra por falta de uma fonte.
- Bloco fixo da aba Copa: **25 colunas** — Data | Dia | LP GA4 (Trafego, Optins etapa) | BI Visa (Optins, Cartões/dia) | Mídia Total (Invt., Cliques, CPC, Impressões, CTR, CPM, **Custo/Opt-in**) | Google (6 cols) | Meta (6 cols). Grupos com cores próprias no cabeçalho (`COPA_FIXED_GROUPS`).
- Custo/Opt-in = spend total ÷ Optins **Visa** do dia (regra [[Copa-2026]]: nunca chamar de CAC). CPC/CTR/CPM calculados por canal; linha 1 = totais do período (SUM); linha final = totais com mesmas fórmulas.
- Blocos CRM (parceiro × bloco × canal) inalterados — começam na coluna 26.

**Definição:** mapa do export `exportRentabilizacaoCrmXlsx` (aba Relatório do GaaS) e o desenho da evolução para juntar os 3 universos — **CRM**, **Mídia Paga** e **LP Visa** — na aba "Rentabilização Copa".

## Arquitetura atual (`src/utils/rentabilizacaoCrmExcelExport.ts`, 1.120 linhas)

```
RelatorioView.tsx (botão export)
  └─ exportRentabilizacaoCrmXlsx(start, end)
       ├─ fetchRntRows() ──────────── Supabase: rentabilizacao_activities (paginação 1000)
       ├─ buildIndexes() ──────────── classifica jornadas (JOR_RENTABILIZACAO_*, JOR_ATIVACAO_*…)
       ├─ writeCopaSheet() ────────── aba "Rentabilização Copa" (jornadas com COPA)
       ├─ buildTabSheet() ×2 ──────── abas "Seguros" e "Rentabilização"
       └─ writeAuditSheet() ───────── aba "Auditoria" (mapa de jornadas + fora do padrão)
```

### Aba "Rentabilização Copa" — anatomia
- **Cols fixas A–G:** `Data | Dia | Trafego LP | Optins LP | Invt. Midia (R$) | Cliques Midia | CPC (R$)`
  - ⚠️ **C–G têm só cabeçalho — nunca são preenchidas.** Hoje o operador copia do Looker e do dash de mídia à mão (ref.: `Acompanhamento_Renta_Copa2026_v4.xlsx`).
- **Blocos CRM:** 3 parceiros (`B2C + B2B2C`, `Plurix`, `BB`) × 3 blocos (`Ativacao`, `Reativacao`, `Novos`) × 14 cols (wpp 3 + e-mail 7 c/ bounce e taxas + sms 2 + push 2).
- Classificação por regex na jornada (`classifyCopa`): COPA + CARTONISTAS→Ativacao, NOVOS→Novos, REATIVACAO→Reativacao, ATIVACAO/VISA→Ativacao; parceiro por PLURIX/_BB_.
- Janela Copa: início fixo `COPA_ACTION_START = 13/04/2026`.

### ⚠️ Divergência com o acompanhamento manual v4
| | v4 manual | Export GaaS |
|---|---|---|
| Blocos | Ativacao, Reativacao, **Pos Emissao** | Ativacao, Reativacao, **Novos** ×3 parceiros |
| Cols/bloco | 11 (sem bounce/taxas) | 14 (com bounce, tx abertura, tx clique) |
| Total cols | 40 | 7 + 9×14 = 133 |

Decidir qual estrutura é a canônica antes de evoluir (input do operador pendente).

## Os 4 universos → colunas
| Universo | Fonte | Status da ponte | Colunas no Copa |
|---|---|---|---|
| CRM | [[rentabilizacao_activities]] | ✅ automática | blocos parceiro×bloco×canal |
| Mídia Paga | [[paid_media_metrics]] + [[paid_media_campaign_mappings]] (`objective='rentabilizacao'`, 6 campanhas Meta/Google) | ✅ dados prontos, falta plugar no export | `Invt. Midia`, `Cliques Midia`, `CPC` + novas: impressões, CTR, CPM **por canal Google/Meta** + consolidado |
| LP (Looker GA4) | [[copa_lp_daily]] (proposta) | 🟡 ingestão via Chrome + export CSV (~5-10 min/dia) | `Trafego LP` + funil (etapa/sucesso) + quebra por origem — proxy, não oficial |
| BI Visa (oficial) | [[copa_visa_daily]] (proposta) | 🟡 print/export de terceiros → upsert assistido | **`Optins (Visa)`** = clientes/dia, cartões/dia + custo por opt-in (`spend/optins`, nunca CAC), tx opt-in |

**Validação 2026-06-11:** spend/cliques/CPC diários do Supabase (rentabilizacao) = valores manuais do v4 (ex.: 18/04 → 110,33 / 255 / 0,43). Fonte confiável.

## Evolução proposta (v2 do export)
1. **`fetchCopaMediaDaily(start,end)`** — query agregada `paid_media_metrics × mappings` por `date × channel`; preenche E–G e novas colunas de mídia (impressões, CTR = cliques/impressões, CPM = spend/impressões×1000, por canal e consolidado). Ponderação `sum/sum` conforme [[Views-Performance]].
2. **`fetchCopaLpDaily(start,end)`** — lê [[copa_lp_daily]]; preenche C–D e derivadas (`tx opt-in = optins/trafego`, `custo por opt-in = spend/optins` — **nunca CAC**, regra [[Copa-2026]]).
3. **Quebra por origem** (mídia/CRM/orgânico/outros) — quando `grupo_origem` estiver populado; candidata a aba própria "LP Visa".
4. Auditoria ganha bloco "cobertura por fonte": dias esperados × presentes por universo (princípio do [[Dossie-Mestre-Operacao-CRM-Midia]]: ausência de dado ≠ ausência de produção).

## Decisões (2026-06-11)
- [x] **Blocos CRM canônicos = export GaaS** (parceiros × Ativacao/Reativacao/Novos, com bounce/taxas). O v4 manual vira legado.
- [x] **Novas métricas de mídia no bloco fixo expandido**: por canal (Google/Meta) spend, cliques, CPC, impressões, CTR, CPM + consolidado, na mesma linha de data.
- [x] **`Optins LP` oficial = Clientes do BI Visa** ([[copa_visa_daily]]); Looker rebaixado a proxy de funil/tráfego. Gap GA4 ~39% documentado.
- [x] **Ingestão LP via Chrome + export CSV nativo do Looker** (~5-10 min/atualização, dado exato); leitura visual de gráfico descartada (lenta e imprecisa). GA4 API fica como endgame.
- [x] **Ingestão BI Visa**: print/export recebido de terceiros → upsert assistido com `raw_payload` de evidência.

## Evolucao visual e analitica v3 (2026-06-19)

- O export usa somente dias fechados; fim de periodo futuro e limitado a ontem.
- A grade diaria preserva as 25 colunas fixas e os blocos CRM, com finais de semana diferenciados e Top 3 por metrica. Volume/taxa positiva usa verde; custos altos usam vermelho; terceiro destaque usa amarelo.
- Apos a grade existem quatro linhas: total do periodo, ultimos N dias (maximo 7), N dias anteriores equivalentes e variacao percentual.
- CPC, CTR, CPM, custo por opt-in e taxas CRM sao recalculados sobre os agregados. Percentuais e medias diarias nunca sao somados.
- Oito cards executivos mostram valor do periodo, leitura de 7 dias, variacao e cobertura: acessos LP, opt-ins Visa, taxa LP para opt-in, cartoes Visa, investimento, custo por opt-in, entregas CRM e taxa de abertura de e-mail.
- Seis graficos dinamicos sao gerados no export: funil LP, investimento Google/Meta, cliques pagos por canal, eficiencia, entregas CRM e aberturas CRM por parceiro/segmento.
- A aba tecnica `_Copa Dashboard Data` e criada como `veryHidden` para preservar os dados auditaveis dos graficos sem poluir a navegacao.
- Regra semantica preservada: BI Visa e a fonte oficial de opt-in/cartao; GA4 e proxy comportamental; custo por opt-in nunca deve ser chamado de CAC.

## Relacionado
- [[copa_lp_daily]] · [[Copa-2026]] · [[paid_media_metrics]] · [[paid_media_campaign_mappings]] · [[rentabilizacao_activities]] · [[Camada-de-Serviços]] · [[Componentes-por-Aba]]
