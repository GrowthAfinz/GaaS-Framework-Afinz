---
tags: [evolucao,governanca,risco]
tipo: evolucao
camada: evolucao
atualizado: 2026-06-08
status: a-validar
fonte: gaas-supabase
---

# Governança de Dados

**Definição:** os pré-requisitos de confiabilidade para automação operar sem risco.

## Pontos críticos
- **RLS desabilitado em 11 tabelas** (incl. [[activities|activities via]] correlatas, [[campaign_context]], [[goals]], [[rentabilizacao_activities]]): com a anon key, qualquer um lê/escreve. Pré-requisito da [[Roadmap-Framework|Fase 2]] (quando o orquestrador escreve no banco). *Não bloqueia Fase 0/1 (leitura).*
- **Padronização de domínios** — ver [[Inconsistências-a-Corrigir]].
- **Unificação de modelos de campanha** — ver [[Decisões-Abertas]].
- **Linguagem única** via [[Ontologia-v2]].

## Princípio
Governança de dado é pré-requisito de automação confiável — não burocracia.

## Relacionado
- [[Ontologia-v2]] · [[Inconsistências-a-Corrigir]] · [[Decisões-Abertas]]
