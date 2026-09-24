# Release 7B — apostas relacionadas e retorno à origem

**Estado:** contrato de implementação.

## Objetivo

Fechar a navegação bidirecional entre a leitura analítica e a aposta sem duplicar contexto:

1. a leitura mostra apostas ligadas à mesma origem;
2. a aposta retorna à leitura que a originou;
3. o retorno restaura período, filtros, BU e recorte da superfície;
4. estado, janela e próxima verificação ficam explícitos fora da área do gráfico.

## Decisões

### Fonte da relação

`growth_bets.belief_snapshot.source_context`, congelado pela Release 7A, é a única fonte da relação. A 7B não cria tabela de links nem grava uma segunda representação mutável.

Uma view read-only `growth_bet_source_links_v`, com `security_invoker=true`, projeta apenas apostas contextuais e os campos necessários à navegação.

### Critério de relação

- **Mesma leitura:** frente, `source_route`, `entity_key`, período e filtros iguais.
- **Mesma origem:** frente, `source_route` e `entity_key` iguais, mas período ou filtros diferentes.
- Não há associação por similaridade textual, métrica ou título.

Quando `entity_key` existe na leitura, ele é obrigatório no vínculo. A consulta é limitada e ordenada com apostas ativas antes das encerradas.

### Retorno

O comando `Voltar à origem` lê o snapshot imutável e restaura:

- período como seleção customizada;
- filtros globais conhecidos;
- BUs válidas, respeitando eventual bloqueio já aplicado pelo contexto de usuário;
- modo `Overview`, `Diário` ou `Mensal` em Relatórios;
- funil específico em Funis de onboarding.

Se o snapshot não satisfizer o contrato da Release 7A, o botão não é exibido. A navegação não tenta inferir uma origem.

### Próxima verificação

A interface deriva a chamada operacional somente de `status`, `outcome_window_start` e `outcome_window_end`:

- antes da janela: data de início;
- durante a janela: data limite;
- após a janela: revisão vencida;
- `ready_for_review`: revisar agora;
- encerrada, cancelada ou não verificável: ciclo encerrado.

## Superfícies

- Relatórios: Overview, Diário e Mensal de Aquisição.
- Funis de onboarding: recorte selecionado.
- Drawer da aposta: ação de retorno à origem.

O componente de apostas relacionadas ocupa uma faixa própria no fluxo da página. Não cobre nem altera os gráficos.

## Fora de escopo

- projeção editorial no Report Live (Release 7C);
- relação automática para apostas antigas originadas na Fila;
- escrita ou edição do snapshot de origem;
- recomendação semântica por similaridade;
- alteração do contrato de outcome ou memória.

## Gates

1. SQL prova que a view contém apenas apostas contextuais, preserva o snapshot e respeita RLS por `security_invoker`.
2. Testes TypeScript cobrem parsing do snapshot, classificação da relação e próxima verificação.
3. Retorno restaura cada rota suportada sem persistir rascunho ou editar a aposta.
4. Vitest, gate TypeScript, Edge Functions e build passam novamente.
5. Migration passa no Postgres 17 do CI antes de ser aplicada no projeto remoto.
6. Após merge, GitHub Pages publica o bundle e a superfície pública contém os novos contratos de navegação.
