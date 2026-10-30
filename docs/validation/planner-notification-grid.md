# Notificações do Planejamento: revisão de layout e UX

## Problema e mudança

O bloco de notificações ficava dentro da coluna direita da grade de gráficos. A meta herdada era renderizada no cabeçalho, comprimindo título, contador e conteúdo e deixando a coluna esquerda vazia.

O bloco agora fica abaixo dos gráficos, na largura completa. Uma grade usa duas colunas a partir de 640 px de largura disponível do próprio painel e uma coluna abaixo disso. Os cards compartilham geometria, tipografia, estados e ações alinhadas no rodapé; a meta herdada ocupa a primeira posição, com os mesmos tamanhos. Não há altura fixa que corte conteúdo. Fechar a meta remove seu elemento sem deixar célula vazia, e o contador local inclui a meta apenas enquanto visível. O contador compartilhado da Fila continua usando apenas os itens do backend.

Os cards destacam frente, período e estado. Ver resumo é a ação principal; adiar fica acessível e acompanhar/escolher data/restaurar ficam em Mais opções. O botão de acompanhamento agora mostra Acompanhar antes da seleção. A meta preserva confirmar, ajustar, adiar e fechar, com as mesmas regras de persistência por usuário/metas.

## Referências consultadas

- Carbon, notificações: https://www.carbondesignsystem.com/building-blocks/core/components/notification/guidelines
- Carbon, padrões: https://www.carbondesignsystem.com/building-blocks/core/patterns/notifications
- PatternFly, notification drawer: https://v4-archive.patternfly.org/v4/components/notification-drawer/design-guidelines/

Princípios aproveitados: hierarquia entre contexto/mensagem/ação, severidade explícita em texto e cor, ações persistentes e preservação das preferências individuais. A grade é uma adaptação ao espaço e ao pedido desta tela; não uma prescrição dessas bibliotecas.

## Validação

- `npm ci --no-audit --no-fund` e `npm run build`: sucesso.
- `npm run typecheck:release`: nenhum erro novo; dívida preexistente registrada pelo gate.
- `node --test scripts/test-growth-loop-attention.mjs`: 7 testes passaram.
- `npx vitest run src/utils/inheritedGoalNoticePreference.test.ts`: 4 testes passaram.
- Fixture local em `scripts/fixtures/notification-center-qa.html`, com autenticação simulada e operações remotas bloqueadas. Não é incluída no build de produção.
- Chrome: painel de 1100 px, quatro cards de aproximadamente 543 x 260 px; painel de 640 px, quatro cards de aproximadamente 313 x 341 px; sem overflow. Viewport móvel de 390 px: uma coluna, sem overflow horizontal.
- Ver resumo/fechar resumo, fechamento da meta, atualização do contador, acompanhamento, adiamento, inclusão e restauração dos ocultos, erro e estado vazio conferidos na fixture. Erros de carregamento têm ação de tentar novamente.
- Avisos de createRoot durante HMR foram restritos à fixture após edição; não são parte do app de produção.

A alteração é de interface. Não muda reconciliação, regras de prioridade, consultas, confirmação de metas ou resolução dos trabalhos. Validação visual não equivale a uma auditoria completa com leitor de tela.
