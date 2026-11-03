---
tags: [estrategia,roadmap]
tipo: estrategia
camada: estrategia
atualizado: 2026-06-10
status: confirmado
fonte: gaas-supabase
---

# Roadmap do Framework

**Definição:** o caminho em fases da visibilidade à orquestração por rentabilidade.

## As fases
| Fase | Entrega | Capacidade | Dependência crítica |
|---|---|---|---|
| **0 — Ver campanhas** | view jornada-safra | enxergar [[Campanha|campanhas]], não linhas | nenhuma |
| **1 — Estruturar conhecimento** | bases de [[Canais|Canal]]+[[Ofertas|Oferta]] + [[Ontologia-v2]] | decisão por número ([[Casos-de-Uso]]) | padronização de domínios |
| **2 — Recomendar** | track record + oportunidades + score | recomendação priorizada | [[Governança-de-Dados]] (acesso) |
| **3 — Orquestrar e otimizar** | [[CAC-Ótimo]] + personalização | alocação por rentabilidade | renta + dado individual (SFMC) |

## Princípio
Camada de cima não depende da de baixo, mas a de baixo lê a de cima → construir de cima pra baixo (ontologia → conhecimento → decisão).

## Nova frente transversal (2026-06): atribuição AppsFlyer
A camada de [[AppsFlyer-Tracking-CRM|tracking unificado no AppsFlyer]] (`pid=crm`, eventos `account_created`/`account_approved`) corta as fases: dá à Fase 2 leitura de conversão por clique/canal/template sem esperar o dado individual do SFMC, e prepara a Fase 3 (atribuição por dispositivo ≈ proxy de indivíduo). O GaaS assume o papel de **analista de atribuição e QA** dos parâmetros.

## Relacionado
- [[Orquestrador]] · [[Ontologia-v2]] · [[Decisões-Abertas]]
