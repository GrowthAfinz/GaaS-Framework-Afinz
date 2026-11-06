# WIKI-COLAB-07 · Blocos reutilizáveis e referências fixadas por versão

Versão: 1.0 · 06/11/2026 · Aberta para evolução futura

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

Regras repetidas entre estratégia, plano e runbook podem divergir; atualizar regra não pode reescrever a base de um teste passado.

## Comportamento esperado

Referenciar bloco com origem única; escolher acompanhar versão atual ou fixar revisão. Mostrar onde a edição repercute e respeitar acesso da origem.

## Dependências

WIKI-COLAB-02, WIKI-COLAB-03

## Plano técnico

Persistir source_block_id, política de versão e revisão fixada; detectar ciclos. Exportar representação documentada para Markdown sem duplicação ambígua.

## Verificação e recuperação

Testar dependências cíclicas, origem excluída, versões antigas e exportação do experimento.

## Fora desta entrega

Futuro aberto; não transformar regras atuais em blocos globais automaticamente.

## Critérios de aceite

- [ ] Editar origem atualiza referências vivas e não altera referências fixadas.
- [ ] Sem acesso à origem, conteúdo não aparece em busca/preview/export.
- [ ] Excluir ou restaurar origem preserva referências e histórico recuperável.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
