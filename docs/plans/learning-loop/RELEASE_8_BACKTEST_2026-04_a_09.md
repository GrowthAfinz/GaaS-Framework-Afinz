# Release 8 — Backtest abr–set/2026

Status: observação, sem escrita em produção. **Não pronto para ativação**: faltas históricas bloqueiam quatro dos nove gatilhos reportados em setembro. Limiares não foram ajustados.

## Procedência e contrato

```json
{
  "engine_version": "8.1.0",
  "evaluation_as_of": "2026-10-27",
  "data_read_at": "2026-10-28T02:21:10.453701+00:00",
  "timezone": "America/Sao_Paulo",
  "transaction_snapshot": "1015494:1015494:",
  "operation_registry_hash": "14d50a1dd8e2af25759a42892b4ea464129ad70e2375b9ffe4cdc582b2ff8fa6",
  "rules_hash": "61c42fc27309c823f044010ad4d811f38c228034108ab5c6ab77eb8cd765d9d3",
  "aggregate_hash": "dd06774c1de8b878aedd16cde71e12a166bd1116f62ae3cf2e79f3d3bca4daae",
  "query_sha256": "ff6f02aec300660fe524bbf2845fcb8bee52da845e99ad07e9638bd875054c5a",
  "engine_sha256": "bd5880635fe85571d54fb9554e1122c80dcc1146fa1857426aae71fbef9ba481",
  "mode": "observacao",
  "input_grain": "BU x segment x canonical partner x calendar month"
}
```

Consulta única de agregados em `release8/read-aggregates.sql`; snapshot consistente da instrução SQL. Entradas em `observed-aggregates.json`, sem linha individual ou CPF. O backtest usa a base atual revisada, não o conhecimento disponível em cada mês histórico. `Realizado` e `Enviado` provam execução; resultado ausente permanece desconhecido. Custo = soma de `Custo Total Campanha`; CAC = soma de custo / soma de cartões. Nenhuma média de CAC de linha. Datas de disparo são convertidas para America/Sao_Paulo antes do mês.

O registro mantém os 33 escopos CRM do inventário de 03/10. Vigência inicial = primeiro mês observado no inventário, sem afirmar início comercial. N/A fica inventariado e não avaliável. Serasa tem corte em fevereiro/2026. T1/T2 usam somente os seis meses calendários anteriores e mínimo de quatro elegíveis. Cobertura histórica incompleta bloqueia veredito; sem atividade não é zero; zero explicitamente observado é elegível em T1.

A cobertura avaliada é dos campos nas linhas disponíveis. Não comprova ingestão completa de toda a população esperada: o inventário e o calendário de chegada ainda não fornecem esse certificado. O resultado permanece em observação.

## Comparação mensal

Cada célula usa a ordem **T1 / T2 / operações / operações favoráveis / parceiros**.

| Mês | Spec §5.1 | Motor com cobertura | Diagnóstico ignorando faltas (não aceito) |
|---|---|---|---|
| 2026-04 | 4 / 1 / 4 / 3 / 2 | 4 / 1 / 4 / 3 / 2 | 4 / 1 / 4 / 3 / 2 |
| 2026-05 | 3 / 2 / 5 / 1 / 2 | 2 / 2 / 4 / 0 / 2 | 3 / 2 / 5 / 1 / 2 |
| 2026-06 | 4 / 3 / 6 / 4 / 3 | 2 / 1 / 3 / 2 / 1 | 4 / 3 / 6 / 4 / 3 |
| 2026-07 | 5 / 4 / 8 / 4 / 4 | 5 / 2 / 6 / 4 / 3 | 5 / 4 / 8 / 4 / 4 |
| 2026-08 | 5 / 2 / 6 / 3 / 4 | 4 / 1 / 4 / 2 / 3 | 5 / 2 / 6 / 3 / 4 |
| 2026-09 | 7 / 2 / 8 / 4 / 4 | 5 / 0 / 5 / 1 / 3 | 7 / 2 / 8 / 4 / 4 |

O diagnóstico mantém os valores dos subtotais, mas ignora os contadores de cartões ausentes. Não é um resultado válido: serve para distinguir mudança de limiar de mudança de completude. O JSON registra toda avaliação, meses elegíveis, exclusões, valores, faixas, materialidade e frações exatas. A spec fornece apenas totais para abr–ago; não há lista nominal original desses meses para atestar correspondência histórica individual.

## Setembro — comparação linha a linha

| Operação | Família | Valor / mediana na spec | Motor: estado; valor / mediana | Explicação |
|---|---|---|---|---|
| B2C · Negados · Proprietaria | T1 | 934 / 589 | incomplete_coverage; — / — | Bloqueado por cobertura: 2026-06-01: 9 cartões ausentes, 0 custos ausentes; 2026-09-01: 5 cartões ausentes, 0 custos ausentes |
| B2C · Negados · Proprietaria | T2 | 15.79 / 24.51 | incomplete_coverage; — / — | Bloqueado por cobertura: 2026-06-01: 9 cartões ausentes, 0 custos ausentes; 2026-09-01: 5 cartões ausentes, 0 custos ausentes |
| B2C · Abandonados · Proprietaria | T1 | 210 / 41 | incomplete_coverage; — / — | Bloqueado por cobertura: 2026-05-01: 1 cartões ausentes, 0 custos ausentes; 2026-06-01: 9 cartões ausentes, 0 custos ausentes; 2026-09-01: 1 cartões ausentes, 0 custos ausentes |
| B2C · Aprovados_nao_convertidos · Proprietaria | T1 | 70 / 7 | triggered; 70 / 7 | Reproduzido. |
| B2C · Abandonados · Serasa | T2 | 3.25 / 5.77 | incomplete_coverage; 3,2542 / — | Bloqueado por cobertura: 2026-06-01: 11 cartões ausentes, 0 custos ausentes |
| Plurix · CRM · Plurix | T1 | 118 / 342 | triggered; 118 / 342 | Reproduzido. |
| Plurix · Negados · Plurix | T1 | 76 / 279 | triggered; 76 / 279 | Reproduzido. |
| Plurix · Abandonados · Plurix | T1 | 18 / 55 | triggered; 18 / 55 | Reproduzido. |
| B2B2C · CRM · Bem Barato | T1 | 45 / 116 | triggered; 45 / 115,5 | Mesmo sinal; mediana sem arredondamento de apresentação. |

Gatilhos adicionais fora dos nove: 0. Abaixo está a lista completa de sinais aceitos em observação:

| ID | Família | Valor | Faixa | Mediana | Caminho |
|---|---|---|---|---|---|
| CRM-6d4dfb4e59 | T1 | 118 | 213–574 | 342 | outside_range, median_with_materiality |
| CRM-86b77dd1bc | T1 | 45 | 67–224 | 115,5 | outside_range, median_with_materiality |
| CRM-92fbd40403 | T1 | 76 | 79–553 | 279 | outside_range, median_with_materiality |
| CRM-a695575900 | T1 | 70 | 1–18 | 7 | outside_range, median_with_materiality |
| CRM-bdc57e480d | T1 | 18 | 39–99 | 55 | outside_range |

## Casos que não devem disparar

- Dia · CRM · T1: **no_deviation_detected**; valor 3, faixa 0–93, mediana 25,5; elegíveis 2026-03-01, 2026-04-01, 2026-05-01, 2026-06-01, 2026-07-01, 2026-08-01. No configured path passed.
- Plurix · Aprovados_nao_convertidos · T2: **insufficient_sample**; valor 124,5238, faixa —–—, mediana —; elegíveis 2026-03-01, 2026-04-01. Not enough eligible months inside calendar window.

## T5 — frescor em 2026-10-27

| Fonte/partição | Última data | Dias | Tolerância provisória | Estado |
|---|---|---|---|---|
| activities | 2026-10-26 | 1 | 7 | no_deviation_detected |
| paid_media_metrics:meta | 2026-10-22 | 5 | 3 | triggered |
| paid_media_metrics:google | 2026-08-17 | 71 | 3 | triggered |
| b2c_daily_metrics | 2026-09-27 | 30 | 7 | triggered |
| app_afinz_funnel_daily_raw | 2026-09-28 | 29 | 7 | triggered |
| serasa_bi_daily_funnel | 2026-07-12 | 107 | 7 | triggered |

Não é um backtest de chegada histórica. Não há calendário governado de chegada nestas entradas; atraso observado não prova paralisação. Meta e Google são avaliados separadamente.

## T6 — snapshot certificado versus base atual

Golden validado por hashes de conteúdo, tabelas, narrativa e blueprints. Grão disponível nas abas congeladas: **parceiro**. O build referencia chunks CRM, mas não inclui linhas em `sources`; portanto não foi feita alocação por operação/BU. Operações individuais exigem hidratação e validação dos chunks em etapa posterior.

| Parceiro | Certificado | Atual | Δ cartões | Δ relativo absoluto | Estado |
|---|---|---|---|---|---|
| Dia | 93 | 93 | 0 | 0% | no_deviation_detected |
| Plurix | 698 | 698 | 0 | 0% | no_deviation_detected |
| Serasa | 988 | 941 | -47 | 4,7571% | triggered |
| Bem Barato | 158 | 158 | 0 | 0% | no_deviation_detected |
| Proprietaria | 912 | 914 | 2 | 0,2193% | no_deviation_detected |

O caso Serasa 988→941 é reproduzido no grão de parceiro; não é prova de revisão de uma operação individual.

## Entregas, limites e próximo gate

- Migration aditiva preparada; seed de metadados separado, não aplicado. Todas as operações são candidatas e todas as regras começam em observação.
- Manifesto dá destino às 164 entidades; alias sem correspondência comprovada permanece pendente; DOC e réguas editoriais não viram operação.
- Nenhuma alteração em resolvePartner, certificação, publicação, feed, candidatas ou apostas.
- CI usa somente fixtures sintéticas. Os arquivos observados deste diretório são evidência documental; não são entrada dos testes.
- O PR #33 é integração separada: há conflito textual em .gitignore; verificar regressões antes de integrar, sem merge/deploy nesta fatia.
- Pendências para ativação: revisar os quatro bloqueios de setembro, confirmar operações, homologar regras, provar T6 por operação quando exigido e autorizar aplicação separadamente. Explicação do desvio não equivale a aceite/ativação.
