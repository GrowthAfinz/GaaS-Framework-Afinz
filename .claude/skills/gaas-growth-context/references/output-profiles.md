# Output Profiles

Todo output deve nascer de um `report_profile`. O perfil define janela, comparacao, audiencia, profundidade e blocos. A ordem tecnica das views continua estavel; a narrativa muda conforme o perfil.

## Campos

| Campo | Uso |
| --- | --- |
| `output_type` | Tipo de report: mensal, semanal, pulse, deep dive, snapshot. |
| `audience` | Operacao, lideranca, executivo, midia, CRM, revenue. |
| `analysis_window` | Periodo analisado. |
| `comparison_window` | Periodo comparativo principal. |
| `context_window` | Janela auxiliar, como MTD ate corte. |
| `data_cutoff_rule` | Regra para ultimo dia fechado ou corte manual. |
| `depth` | `snapshot`, `standard` ou `deep_dive`. |
| `primary_focus` | Frente, parceiro, segmento, objetivo ou campanha prioritaria. |
| `include_blocks` | Blocos que entram no output. |

## Presets

| Perfil | Quando usar | Janela analisada | Comparacao principal | Contexto auxiliar | Profundidade |
| --- | --- | --- | --- | --- | --- |
| `monthly_report` | Fechamento mensal | Mes fechado | Mes anterior completo | Meta mensal e historico por parceiro | Alta |
| `weekly_impact_cutoff` | Sexta com dados ate quarta ou ultimo fechado | Semana atual ate ultimo dia fechado | Mesmos dias da semana anterior | MTD ate o mesmo corte | Media |
| `weekly_retro` | Semana ja fechada | Semana anterior fechada | Semana anterior equivalente | MTD | Alta |
| `midweek_pulse` | Check rapido de terca/quarta | Semana atual ate ultimo fechado | Mesmos dias da semana anterior | Ultimos 7 dias | Baixa |
| `partner_deep_dive` | Apresentar parceiro especifico | Periodo selecionado | Historico do proprio parceiro | Ranking geral de parceiros | Alta |
| `segment_deep_dive` | Entender segmento | Periodo selecionado | Mesmo segmento no periodo anterior | Parceiros onde o segmento aparece | Alta |
| `campaign_diagnostics` | Diagnosticar campanha/disparo | Periodo da campanha | Historico de campanhas semelhantes | Jornada, canal e segmento | Media |
| `media_objective_review` | Olhar midia por objetivo | Periodo selecionado | Periodo anterior equivalente | Budget, pacing e tracking | Media |
| `executive_snapshot` | Poucos slides | Periodo selecionado | Periodo anterior equivalente | Mes/meta | Baixa |
| `insurance_summary` | Seguros como complemento | Periodo selecionado | Periodo anterior equivalente | CRM + midia conectados | Baixa |

## Regra de semana parcial

Para `weekly_impact_cutoff`:

- usar somente dias fechados;
- comparar segunda-quarta contra segunda-quarta, nao contra semana cheia;
- usar MTD apenas como contexto auxiliar;
- nao transformar todo delta em julgamento de melhora/piora;
- incluir limites de leitura se fontes estiverem parciais.

