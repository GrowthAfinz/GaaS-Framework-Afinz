# WIKI-COLAB-05 · Prova de compatibilidade BlockNote

Versão: 1.0 · 06/11/2026 · Aberta para evolução futura

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

BlockNote tem UI pronta, mas Markdown é explicitamente lossy. Compatibilidade com o vault ainda não foi executada.

## Comportamento esperado

Prova isolada, versões fixadas e licença por pacote. Importar cópia da nota Visa e fixtures do acervo; comparar exportação e significado. Mapear conteúdo nativo, custom inline wikiLink e blocos de fonte preservada; decidir adotar BlockNote ou manter editor por seção.

## Dependências

Nenhuma spec anterior.

## Plano técnico

Usar Motion como referência de adaptador, WorkLedger para inline content por ID e Drafto para estado de salvamento. Não copiar regex de Markdown como parser nem PATCH sem revisão. JSON e Markdown não podem ser duas fontes editáveis independentes.

## Verificação e recuperação

Executar sandbox sem reescrever vault ou produção. Guardar fixtures, diff e resultados reproduzíveis. Reprovação mantém editor por seção.

## Fora desta entrega

Futuro aberto; não instalar o editor no produto nem converter acervo só por publicar esta spec.

## Critérios de aceite

- [ ] Cobertura de alias, fragmento, embed, frontmatter, diretiva details, listas aninhadas, tabelas, SQL e Mermaid.
- [ ] Nenhum trecho não suportado é descartado silenciosamente; exportação e reimportação preservam o contrato.
- [ ] Comparar bundle inicial/lazy, memória, mobile/IME, foco e latência antes/depois; registrar limites sem inventar resultados.
- [ ] ADR com versão, licenças, exemplos revisados, formatos suportados e decisão fundamentada.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
