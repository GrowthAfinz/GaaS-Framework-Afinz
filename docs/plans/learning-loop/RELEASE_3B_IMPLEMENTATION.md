# Release 3B — decisão e operação de apostas

**Data:** 2026-09-22  
**Branch:** `codex/growth-learning-release-3b`  
**Base:** `9ba2d23` — documentação da Release 3A integrada à `main`

**Estado:** publicada na `main`, no Supabase e no GitHub Pages em 22/09/2026

## Objetivo

Fechar a interação entre uma recomendação governada e uma aposta operacional, sem antecipar outcome ou memória. A Fila passa a permitir assumir, rejeitar ou mesclar um sinal; a área Apostas passa a operar o compromisso criado pela Release 3A.

## Interface

- `Assumir aposta` substitui a ação genérica das recomendações ainda não decididas;
- formulário pré-preenche somente os campos presentes no snapshot do sinal;
- time e baseline permanecem vazios e obrigatórios quando não existem na evidência;
- expectativa, unidade, direção, fim da janela e view são reutilizados quando fornecidos pelo produtor;
- aceitar exige contrato completo antes da RPC;
- mesclar lista somente apostas ativas da mesma frente;
- rejeitar exige motivo;
- decisões já tomadas são resolvidas pela projeção `growth_signal_decisions_v` e não oferecem uma segunda decisão;
- deep-links de aposta usam `section=bets&item=<uuid>`;
- a visão Apostas oferece filtros, busca, tabela compacta e drawer operacional;
- o drawer reúne contrato, evidência congelada, checklist, comentários, execução, mudança de estado e timeline.

## Persistência e comandos

A migration `20260923000610_growth_bets_release_3b.sql` adiciona:

- `growth_signal_decisions`, uma decisão imutável por candidata;
- `growth_bet_checklist_items`, com posição e estado explícitos;
- captura automática da decisão `accepted` quando a RPC da 3A cria uma aposta;
- `growth_reject_signal`;
- `growth_merge_signal_into_bet`;
- `growth_add_bet_checklist_item`;
- `growth_set_bet_checklist_item`;
- `growth_append_bet_update`;
- eventos `signal_rejected` e `bet_updated`;
- agregados operacionais de checklist, execução, timeline e sinais mesclados na `growth_bets_operational_v`.

Todas as escritas da aplicação passam por RPC autenticada. As tabelas operacionais continuam sem `INSERT`, `UPDATE` ou `DELETE` direto para `authenticated`.

## Semântica do feed

- aceitar emite `bet_created` pela transação já existente da 3A;
- rejeitar emite `signal_rejected` com motivo congelado;
- mesclar, concluir/reabrir checklist, registrar execução e mudar estado emitem `bet_updated`;
- comentário interno não cria post no feed;
- todos os eventos de aposta apontam para o drawer da aposta;
- eventos repetidos são agrupados por `bet:<uuid>`.

Essa divisão mantém a Fila sistêmica: mudança material aparece; conversa cotidiana permanece dentro da aposta.

## Invariantes

1. Uma candidata recebe exatamente uma decisão: aceita, rejeitada ou mesclada.
2. Sinal mesclado e aposta de destino precisam pertencer à mesma frente.
3. Aposta fechada, cancelada ou não verificável não recebe sinal mesclado.
4. Rejeição sem motivo é inválida.
5. Checklist só aceita `pending` ou `completed`; conclusão exige timestamp.
6. Timeline continua append-only.
7. Comentário não altera estado nem polui o feed.
8. Atualização de execução exige estado de execução.
9. Mudança de estado exige um estado válido da aposta.
10. Crença e evidência congeladas na 3A não são reescritas.

## Validação já executada

- 139 testes frontend verdes, incluindo defaults, campos deliberadamente vazios, janela invertida e estados ativos do feed;
- build Vite verde;
- gate TypeScript sem diagnóstico novo; dívida histórica permanece em 57;
- migration aplicada integralmente em transação no Postgres real e encerrada com `ROLLBACK`;
- cenário transacional real com aceitar, rejeitar, mesclar, checklist, comentário, execução e mudança de estado passou e foi revertido;
- o cenário confirmou três decisões únicas, checklist 1/1, seis itens na timeline e quatro eventos materiais de atualização;
- `db push --dry-run` não é utilizável neste checkout porque o histórico remoto contém migrations legadas ausentes localmente; nenhuma reparação de histórico foi feita.

## Fora desta release

- cálculo ou revisão de outcome;
- agenda automática de vencimentos;
- memória e reutilização de aprendizado;
- anexos binários;
- editor de contrato aprovado;
- automação de campanhas;
- mudança no engine do Report Live.

## Promoção

- PR #17 mergeado na `main` como `e9db756`;
- migration registrada no Supabase como `growth_bets_release_3b` antes do deploy da interface;
- reconciliação confirmou tabelas e views presentes, `security_invoker`, RPCs fechadas para `anon`, ausência de escrita direta para `authenticated` e contagens iniciais zeradas;
- workflow de `main` `35803398333` verde, incluindo o contrato SQL em PostgreSQL 17;
- GitHub Pages publicado pelo mesmo workflow;
- página e bundle público `index-DglFengp.js` responderam HTTP 200;
- o bundle contém `Release 3B`, `Assumir aposta`, `Apostas contratadas` e `Mesclar à existente`;
- nenhum dado sintético foi persistido durante ensaio ou promoção.

### Correção pós-promoção

O pipeline documental posterior encontrou um caso não determinístico no teste SQL: vários updates gravados na mesma transação compartilham `created_at`, e o desempate anterior por UUID podia projetar `not_started` como execução mais recente. A migration `growth_bet_timeline_sequence` adiciona uma sequência monotônica à timeline e passa a usá-la na projeção operacional. O gate manteve a expectativa `partial`; não foi relaxado.
