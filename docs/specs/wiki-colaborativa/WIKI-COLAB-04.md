# WIKI-COLAB-04 · QA integrado e release incremental na main

Versão: 1.0 · 06/11/2026 · Planejada para implementação na main

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

Uma interface bonita não basta se perder conteúdo, permissões, links ou fidelidade entre leitores.

## Comportamento esperado

Validar ponta a ponta o piloto Visa, preparar release com feature flag por nota e publicar na main só com evidências. Primeiro disponibilizar piloto; expansão para outras notas após aceite de compatibilidade e estabilidade.

## Dependências

WIKI-COLAB-01, WIKI-COLAB-02, WIKI-COLAB-03

## Plano técnico

Publicar em PRs pequenos: UI, dados, edição e QA/release. Vincular commits, migrations e workflow ao trabalho. Não concluir a feature apenas porque as specs foram publicadas.

## Verificação e recuperação

Comparação visual de referência com implementação no mesmo viewport; validar console, carga sob demanda e atualização do índice. Interromper expansão se houver perda ou divergência sem recuperação.

## Fora desta entrega

Sem migração em massa de notas ou concessão ampla de acessos; sem ativação de campanhas.

## Critérios de aceite

- [ ] Checklist de aceite 01–03 executado com evidências, sem marcar critério não testado.
- [ ] Visual desktop/mobile sem sobreposição, corte de lápis, tabela ilegível ou salto de rolagem; teclado, toque e reduced-motion verificados.
- [ ] Testes de integração e SQL pertinentes, typecheck:release e build aprovados. Schema remoto e advisors conferidos se houver migration.
- [ ] Após deploy, editar/recarregar/comparar/restaurar e conferir conflito em sessões distintas autorizadas.
- [ ] Rollback mantém versão humana acessível e exportável; não depende de apagar tabelas ou apagar histórico.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
