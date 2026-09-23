# Release 3A — contrato e persistência de apostas

**Data:** 2026-09-22  
**Branch:** `codex/growth-learning-release-3a`  
**Base:** `1584d17` — merge do PR #14, Release 2

**Estado:** publicada na `main` e no Supabase em 22/09/2026

## Objetivo

Criar a fundação transacional para transformar uma recomendação governada em aposta verificável. Este corte não adiciona botão, formulário, checklist ou workspace operacional; ele fecha o contrato de dados que a Release 3B consumirá.

## Persistência

A migration `20260922203000_growth_bets_release_3a.sql` adiciona:

- `growth_evidence_snapshots`, imutável;
- `growth_bets`, com baseline e expectativa obrigatórios para `approved`;
- `growth_bet_updates`, timeline append-only;
- `growth_bets_operational_v`, `security_invoker`;
- evento `bet_created` no feed existente;
- RPC autenticada `growth_accept_signal_as_bet`.

## Invariantes

1. Apenas recomendações `confirmed` ou `directional` podem ser aprovadas como aposta.
2. `suspect`, `blocked` e qualquer candidata de view `QUALITY` são rejeitadas.
3. Time, hipótese, ação, métrica, baseline, expectativa, direção, critério, janela e view de verificação são obrigatórios.
4. Owner individual permanece opcional.
5. Uma candidata possui no máximo uma aposta não cancelada.
6. A candidata é travada durante o comando para serializar aceitações concorrentes.
7. Snapshot, aposta, timeline, evento e mudança da candidata são uma única transação.
8. Falha em qualquer etapa não deixa snapshot, evento ou aposta órfã.
9. `belief_snapshot`, origem e evidência são imutáveis.
10. A escrita direta permanece fechada; usuários autenticados escrevem pelo comando e leem pela view.

## Conteúdo congelado

O snapshot preserva:

- run, período, hash e caminho do artefato;
- filtros de domínio, frente, parceiro, entidade, sinal e view;
- baseline, expectativa, direção, unidade e critério;
- confiança da candidata, limite de leitura, qualidade e cutoffs do run;
- comparabilidade, perfil e versão da spec;
- estado original da candidata antes de ela ser marcada como aceita;
- alternativas conhecidas, condição de interrupção e versão do contrato.

O fallback de hash é determinístico e só é usado quando o run não possui `source_hash` nem `content_hash`.

## Decisão sobre sinais incompletos

Na base viva existem 48 candidatas: 31 `confirmed` e 17 `suspect`. Apenas 3 das 31 confirmadas já possuem `expected_value`, `outcome_window_end` e `verification_view` no próprio sinal.

Por isso a 3A não cria aposta automaticamente a partir dos campos existentes. A 3B deverá pré-preencher tudo que existir e exigir a complementação do contrato antes de chamar a RPC. Essa escolha preserva o gate de 100% das apostas aprovadas verificáveis.

## Teste

`scripts/test-growth-bets-release-3b.mjs` sobe o schema mínimo sobre PostgreSQL 17 e preserva estes testes junto dos contratos operacionais adicionados na Release 3B:

- criação 1:1 de aposta, snapshot, timeline e evento;
- procedência do artefato e do estado de qualidade;
- crença original preservada antes da mudança de status da candidata;
- rejeição de duplicata, sinal `suspect` e sinal de qualidade;
- ausência de órfãos após comandos rejeitados;
- imutabilidade de evidência, crença e timeline;
- grants, RLS, ausência de escrita direta e view `security_invoker`;
- deep-link do evento para a própria aposta.

A migration e o cenário adversarial completo também foram executados dentro de uma transação no schema real e encerrados com `ROLLBACK`. O ensaio retornou 1 aposta, 1 snapshot, 1 update e 1 evento, com todas as verificações booleanas verdadeiras e nenhuma persistência.

## Promoção

- PR #15 mergeado na `main` como `3fde5bc`;
- workflow pós-merge `35794413827` verde, incluindo o contrato SQL em PostgreSQL 17;
- GitHub Pages publicado pelo mesmo workflow;
- migration registrada pelo Supabase como `20260922225227_growth_bets_release_3a`;
- reconciliação confirmou RLS, RPC autenticada, view `security_invoker`, triggers de imutabilidade e ausência de escrita direta;
- estado inicial: 0 apostas, 0 snapshots, 0 updates e 0 eventos `bet_created` — nenhum dado de demonstração foi criado em produção.

## Fora desta release

- botão `Assumir aposta`;
- draft de sinal `suspect`;
- rejeitar ou mesclar sinal;
- checklist e comentários de usuário;
- atualização de estado da aposta;
- registro de execução;
- outcome;
- memória;
- alteração do engine ou do Report Live.
