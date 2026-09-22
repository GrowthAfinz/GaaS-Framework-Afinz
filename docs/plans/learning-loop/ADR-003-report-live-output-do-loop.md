# ADR-003 — Report Live como output do Loop de aprendizado Growth

**Status:** aceita
**Data:** 2026-09-22

## Contexto

O card atual combina consumo do relatório com operação de release. Isso faz o output parecer o produto central e mistura tarefas de leitores e operadores.

## Decisão

- O nome Report Live é preservado para a visualização editorial.
- A aba Relatórios oferece somente consumo/download.
- Geração, certificação, publicação, recovery e histórico ficam em `Aprendizado Growth > Report Live`.
- O pipeline imutável permanece fonte de verdade; Slides/PDF/PPTX são destinos.

## Consequências

- `ReportLiveCard` deve ser dividido;
- hooks e serviços precisam ser compartilhados;
- eventos materiais do pipeline entram no feed;
- futuras projeções podem incluir apostas, outcomes e aprendizados sem alterar seus objetos.

## Alternativas descartadas

- duplicar o card nos dois lugares: duplica estado e confunde operação;
- renomear Report Live: contraria a decisão de manter a marca editorial;
- mover downloads para Aprendizado Growth: prejudica consumidores que só precisam do output.
