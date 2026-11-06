# WIKI-COLAB-06 · Comentários, menções e sugestões por trecho

Versão: 1.0 · 06/11/2026 · Aberta para evolução futura

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

O time precisa discutir mudanças no contexto e sugerir texto sem necessariamente substituir o conteúdo imediatamente.

## Comportamento esperado

Discussões ancoradas em IDs estáveis e contexto textual; responder/resolver; sugestões com aceitar/rejeitar. Comentários usam painel lateral único e menções respeitam o acesso.

## Dependências

WIKI-COLAB-02, WIKI-COLAB-03

## Plano técnico

Avaliar CommentsExtension/threads do BlockNote ou interface própria com persistência autorizada; não confundir plugin de UI com backend pronto.

## Verificação e recuperação

Testar mudança de âncora, permissões, resolução, edição concorrente e leitura mobile.

## Fora desta entrega

Futuro aberto; não bloqueia edição direta de conteúdo comum.

## Critérios de aceite

- [ ] Mover/editar bloco preserva conversa; trecho excluído mantém discussão sem âncora identificada.
- [ ] Aceitar sugestão gera revisão com autoria de proposta e aplicação; rejeitar preserva histórico.
- [ ] Notificações não expõem conteúdo para pessoas sem permissão; nenhuma LLM é acionada automaticamente.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
