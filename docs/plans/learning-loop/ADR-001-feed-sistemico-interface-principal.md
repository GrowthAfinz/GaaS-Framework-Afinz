# ADR-001 — Feed sistêmico como interface principal

**Status:** aceita
**Data:** 2026-09-22

## Contexto

O loop produz sinais, apostas, execuções, outcomes, aprendizados e eventos editoriais. Uma navegação baseada apenas em tabelas especializadas exige que o operador descubra sozinho o que mudou.

## Decisão

A Fila é um feed sistêmico e a home de Aprendizado Growth. Apenas o sistema publica. Usuários executam ações de workflow; essas ações geram novos eventos sistêmicos.

Ordenações: prioridade, recentes e relevância. Sem interações sociais no primeiro lançamento.

## Consequências

- eventos precisam ser persistidos e deduplicados;
- cards exigem registry por tipo;
- áreas especializadas continuam necessárias para trabalho denso;
- o feed não pode virar stream de logs técnicos;
- alterações materiais geram evento; polling não gera posts.

## Alternativas descartadas

- dashboard de KPIs como home: descreve, mas não organiza decisão;
- kanban único: representa bem apostas, mas não sinais, outcomes e publicações;
- feed humano/social: introduz ruído e moderação antes de provar o loop.
