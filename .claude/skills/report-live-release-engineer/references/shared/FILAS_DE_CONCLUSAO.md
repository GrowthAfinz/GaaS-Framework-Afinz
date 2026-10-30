# As três filas de conclusão (e a integração em avaliação)

**Status da decisão:** em avaliação pelo Pablo. Até decidir, a skill opera no **modo atual** (abaixo). Não implemente a integração por conta própria.

## O que existe hoje (medido em 28/09/2026)

| | `crm_insights` | `report_action_candidates` | `growth_curated_proposals` |
|---|---|---|---|
| Quem escreve | IA, via skill `gaas-insight-engine` | regras determinísticas do build (`deterministic_rule_v1`) | curadoria histórica do vault |
| Conteúdo | análise rica: tipo, severidade, BU/canal/segmento/safra, sinal→impacto→causa→evidência→ação, prioridade | sinal curto + ação + métrica/valor esperado + janela + view de verificação | proposta sem métrica verificável |
| Volume | 7, todos de 11/06 (parado) | 48, só 3 sinais: `TEMPLATE_COVERAGE_LT_80`, `MEDIA_ZERO_CONVERSION_WITH_CLICKS`, `PARTNER_NA_CLASSIFICATION` | poucas |
| Entra no feed? | **não** | sim | sim |
| Pode virar aposta → resultado → memória? | **não** (sem janela nem view de verificação) | **sim** | só depois de ganhar métrica |
| Onde aparece | Insight Deck (Jornada & Disparos) | feed, C8 do Report Live | feed |

**Consequência:** a análise rica fica fora do loop, e o loop só recebe sinais de qualidade de dado. Por isso o ciclo quase não gira (1 aposta, 0 resultados avaliados, memórias só do vault).

## Proposta em avaliação (não implementada)

1. `crm_insights` continua sendo a camada de **análise** (alimenta o Insight Deck).
2. Todo insight com ação **mensurável** gera também uma candidata no feed (`generated_by = insight_engine`), com métrica, valor esperado, direção, janela e view de verificação, apontando para o `insight_key`.
3. Insight sem métrica verificável vira proposta curada, não aposta.

**Depende de:** uma RPC governada no Supabase para a skill criar candidata (hoje só o build cria). É trabalho do Codex/migrations — a skill não faz insert direto.

## Modo atual da skill (até a decisão)

- Roda o insight engine e publica em `crm_insights` normalmente.
- No resumo final, marca quais insights **seriam** elegíveis a virar candidata (têm métrica + critério de sucesso + janela plausível), para o Pablo enxergar o ganho da integração com dado real.
- Não cria candidata, aposta nem proposta curada.
