# WIKI-COLAB-08 · Criar atividade a partir do texto e modelos de estratégia

Versão: 1.0 · 06/11/2026 · Aberta para evolução futura

Spec criada; funcionalidade ainda não implementada por este pacote.

## Problema

Pendências descritas em texto exigem recadastro; a estrutura Visa ainda é específica de uma única nota.

## Comportamento esperado

Selecionar trecho e criar atividade no serviço existente, preservando link ao bloco. Oferecer modelo de estratégia reutilizável com seções e grupo de atividades configuráveis.

## Dependências

WIKI-COLAB-01, WIKI-COLAB-03

## Plano técnico

Reutilizar growth_save_development_task, vínculo note_id/block_id e configuração do modelo, não arrays fixos de chaves Visa.

## Verificação e recuperação

Testar retry, links depois de renomear/mover trecho e criação sem acesso à iniciativa.

## Fora desta entrega

Futuro aberto; não cria tarefas ao selecionar texto sem ação explícita.

## Critérios de aceite

- [ ] Criar uma vez gera uma única tarefa compartilhada; retry não duplica.
- [ ] Permissões e critérios de conclusão do serviço original continuam valendo.
- [ ] Modelo cria nova estrutura com IDs próprios e sem copiar conclusões, evidências ou datas de outro piloto.

## Rastreabilidade

[Plano e ordem de implementação](README.md). O registro em Correções e Melhorias aponta para esta spec e para seu trabalho SDD. Estado do planejamento não significa implementação concluída.
