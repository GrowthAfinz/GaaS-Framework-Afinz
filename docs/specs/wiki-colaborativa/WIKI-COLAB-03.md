# WIKI-COLAB-03 · Lápis em toda a nota e editor contextual

Versão: 1.0 · 06/11/2026 · Planejada para implementação na main

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

Hoje o corpo é leitura Markdown com Correção para IA; dois leitores próprios podem apresentar experiências diferentes.

## Comportamento esperado

Criar WikiDocumentSurface compartilhado entre Leitura e Notas e aberto por Conexões. Permitir editar título, propriedades editoriais, resumo, parágrafos, seções, tabelas, referências, Mermaid e SQL. Lápis discreto por unidade, sempre disponível por teclado/toque. Texto edita no lugar; código e diagrama têm fonte e prévia; atividades abrem o registro vinculado. Preservar Markdown original fora do trecho editado.

## Dependências

WIKI-COLAB-01, WIKI-COLAB-02

## Plano técnico

Introduzir WikiBlockFrame, WikiSectionEditor, WikiPropertiesEditor e painel lateral único para atividade/histórico. Começar com adaptação de Markdown estruturado e patches validados pela revisão-base. BlockNote pode ser incorporado se a prova WIKI-COLAB-05 passar; não é dependência obrigatória desta fase.

## Verificação e recuperação

Fixtures reais da nota Visa e outras notas pequenas; edição de tabela/código, cancelamento, rede caída, duas contas, foco e scroll. Lazy loading do editor e Mermaid. Animação de 120–180 ms apenas onde ajuda; respeitar reduced-motion.

## Fora desta entrega

Não inclui comentários, sugestões, blocos sincronizados ou coedição simultânea. Correção para IA permanece ação distinta, sem iniciar LLM automaticamente.

## Critérios de aceite

- [ ] Todos os tipos da nota Visa possuem ação de edição real e persistente; não há lápis decorativo ou que só abre correção para IA.
- [ ] Título, H1 e propriedade title seguem um contrato único; renomear preserva IDs e links antigos.
- [ ] Wikilinks com alias/fragmento, embeds, frontmatter, SQL e Mermaid preservam conteúdo não editado; parser ignora cercas ao identificar seções.
- [ ] Salvar/Cancelar, Ctrl+S e navegação pendente preservam rascunho por usuário/nota/base; limpar no logout e não vazar entre contas.
- [ ] Dados certificados e estado validado abrem edição de contexto/configuração ou ação de validação, sem permitir reescrever a fonte numérica como texto.
- [ ] Abrir/recolher é preferência individual; busca e links abrem ancestrais recolhidos; IDs não dependem da linha ou do título atual.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
