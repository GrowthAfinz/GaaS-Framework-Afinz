---
tags: [estrategia,objetivo]
tipo: estrategia
camada: estrategia
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Função Objetivo

**Definição:** o que o sistema busca maximizar. Dois níveis: tático e estratégico.

## Hierarquia
- **Tática (por caso de uso):** maximizar **Taxa de Conversão** dada uma restrição de CAC. É o objetivo dos [[Casos-de-Uso]] de Canal e Oferta (origem: [[Framework-v1-Diretor|diretor]]).
- **Estratégica (global):** atingir o **[[CAC-Ótimo]]** por safra — maximizar rentabilidade acumulada, não minimizar CAC (origem: rascunho Pablo).

## Restrições
1. Não ultrapassar `cac_max` ([[goals]]).
2. Respeitar pressão de contato por indivíduo (anti-overlap).
3. Evitar bounce/trava de SMS e WhatsApp (playbook item 5 do diretor).

## Como o orquestrador usa
Toda recomendação é pontuada por: proximidade do CAC ótimo + conversão esperada + confiança (volume) + gap para a meta do mês.

## Relacionado
- [[CAC-Ótimo]] · [[Casos-de-Uso]] · [[goals]] · [[Orquestrador]]
