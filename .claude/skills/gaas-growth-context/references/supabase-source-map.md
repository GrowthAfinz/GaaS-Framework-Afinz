# Supabase Source Map

Usar Supabase como fonte viva para numeros atuais. O vault e contexto/ontologia, nao substitui dado vivo.

Quando a tarefa exigir consulta live, usar a skill/ferramenta Supabase disponivel no ambiente. Nao embutir chave, URL secreta ou service role em scripts desta skill.

## Fontes principais

| Fonte | Uso |
| --- | --- |
| `activities` | CRM aquisicao: base, envios, entregas, abertura, clique, propostas, aprovados, cartoes, custo e CAC quando disponivel. |
| `rentabilizacao_activities` | Rentabilizacao e seguros CRM ate execucao/entrega/abertura/clique. |
| `paid_media_metrics` | Midia paga por plataforma, campanha, objetivo, adset/anuncio/criativo quando disponivel. |
| `b2c_daily_metrics` | Contexto de originacao/producao B2C. |
| `copa_lp_daily` | Contexto LP Copa/Visa quando aplicavel. |
| `copa_visa_daily` | Contexto Copa Visa quando aplicavel. |
| `paid_media_campaign_mappings` | Mapeamento campanha -> objetivo/frente. |
| `paid_media_objectives` | Taxonomia de objetivos de midia. |
| `campaign_context` | Semantica de campanhas, funil e metricas norte. |
| `crm_insights` | Memoria analitica CRM. |
| `paid_media_insights` | Memoria analitica midia. |
| `report_memory` | Memoria de negocio do report. |
| `report_runs` | Observabilidade do Report Live/publicacao. |

## Checks minimos antes de analisar

- max date por fonte.
- dias esperados vs presentes.
- volume de linhas por dia.
- nulos em dimensoes canonicas.
- campanhas sem mapping.
- denominadores ausentes.
- conversao zero vs conversao ausente.
- taxas acima de 100%.
- spend sem resultado.

## Report Live

- `report_runs`: validar status, erros, counters, briefing version e conclusao da publicacao.
- `report_memory`: buscar memoria de negocio quando a narrativa depender de contexto historico.
- Edge `report-sync`: publicar textos prontos quando `skip_llm:true`.
- `pg_net`: usar como mecanismo de disparo quando o runbook determinar execucao via SQL.

## Seguranca

Nao expor service role key. Nao alterar RLS, policies ou schema sem pedido explicito e validacao.
