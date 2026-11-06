# WIKI-COLAB-09 · Coedição simultânea e presença

Versão: 1.0 · 06/11/2026 · Aberta para evolução futura

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

Concorrência por revisão protege salvamento, mas duas pessoas não editam o mesmo bloco em tempo real.

## Comportamento esperado

Avaliar Yjs e provider autenticado, presença e reconexão. Provar edição simultânea, persistência durável e checkpoints sem confundir CRDT com auditoria ou sync do vault.

## Dependências

WIKI-COLAB-02, WIKI-COLAB-03, WIKI-COLAB-05

## Plano técnico

GitHub Pages permanece frontend. Selecionar serviço de colaboração separado e registrar custos, retenção e limites antes de contratar/ativar.

## Verificação e recuperação

Testes multiusuário, offline/reconexão, revogação e recuperação do provider.

## Fora desta entrega

Futuro aberto; não ativar serviço pago nem infraestrutura por esta spec.

## Critérios de aceite

- [ ] Duas sessões editam simultaneamente e convergem após reconexão sem perda.
- [ ] Revogação de acesso bloqueia entrada e atualização; presença respeita escopo.
- [ ] Histórico legível, restauração, custo e operação do provider documentados; exportação vault mantém base comum.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
