---
tags: [gaas,aba,experimento]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Diário de Bordo

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** a aba de **tracking de experimentos e anotações** — onde a operação registra [[Hipótese|hipóteses]], experimentos A/B e aprendizados, fechando o loop `hipótese → disparo → resultado → aprendizado`.

## O que entrega
- Anotações com tags (`useNotes`, `useNotesWithTags`), persistidas no `diaryStore`.
- **ExperimentsView**: cadastro de [[Experimento|experimentos]] com variações, janela e métrica-alvo.
- **SignificanceCalculator**: teste de significância estatística entre variações (A/B).
- **MultiSelectChips**: marcação de dimensões do experimento.

## Por que importa
É a unidade de **aprendizado provado** da operação — sai-se do achismo para resultado comparável. Materializa a entidade [[Experimento]] da [[Ontologia-v2|v2]] e a regra "sem hipótese prévia não há aprendizado válido".

## Relacionado
- [[Experimento]] · [[Hipótese]] · [[Entidades-v2]] · [[GaaS-9-Áreas]]
