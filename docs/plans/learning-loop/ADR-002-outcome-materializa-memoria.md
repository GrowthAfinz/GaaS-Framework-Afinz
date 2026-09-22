# ADR-002 — Outcome resolvido materializa memória automaticamente

**Status:** aceita
**Data:** 2026-09-22

## Contexto

A direção conceitual anterior tratava textos de IA como candidatos sujeitos a promoção humana. A decisão de produto atual distingue narrativa livre de outcome resolvido: uma vez calculado e confirmado/contestado, o resultado deve ser preservado mesmo quando falhou ou ficou inconclusivo.

## Decisão

Todo outcome resolvido materializa exatamente uma memória. Não existe botão separado de promoção no MVP.

Correções posteriores via LLM/Supabase criam revisões, sem apagar o original. Toda memória recebe escopo, classificação, confiança e data de revisão.

## Consequências

- inconclusivo e premissa inválida também são conhecimento;
- materializador deve ser idempotente;
- memória precisa de revisões;
- busca padrão só usa memórias vigentes;
- contestação preserva o veredito sistêmico.

## Alternativas descartadas

- guardar apenas sucessos: gera viés de sobrevivência;
- promoção manual obrigatória: recria a fila vazia que o produto pretende eliminar;
- update destrutivo: apaga o registro de crença e impede auditoria.
