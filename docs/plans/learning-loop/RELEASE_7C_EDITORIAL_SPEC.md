# Release 7C — projeção editorial do Loop no Report Live

**Status:** contrato de implementação
**Data:** 2026-09-24
**Escopo:** C7 e C8 existentes; nenhum novo slide ou renderer

## 1. Objetivo

Fazer o Report Live prestar contas do ciclo operacional sem transformar recomendação, aposta ou memória curada em causalidade comprovada.

O corte usa os slides já existentes:

- `C7 — Resultado das ações anteriores`: outcomes materiais e aprendizados com origem explícita;
- `C8 — Fila consolidada de decisão`: apostas abertas e candidatas determinísticas, preservadas como objetos diferentes.

## 2. Invariantes

1. O pipeline imutável de build, certificação e publicação não muda.
2. As fontes do loop entram em `report_frozen_inputs`, nos snapshots de fonte e nos hashes do artefato.
3. Um item sem `outcome_id` nunca aparece como outcome.
4. `vault_curated` aparece como `memoria_curada` e declara que não é validação causal pelo loop.
5. `source_kind = outcome` aparece como `aprendizado_do_loop` somente depois da resolução governada já exigida pela Release 5.
6. Uma aposta aberta aparece como compromisso humano, nunca como resultado.
7. Uma candidata do engine continua aguardando decisão humana.
8. Missing permanece missing; o corte não recalcula métricas, outcomes ou confiança.
9. O renderer, a geometria e a cardinalidade dos perfis 12/31 permanecem iguais.
10. Build e certificação não alteram o deck vivo.

## 3. Fontes congeladas

| Chave do snapshot | Origem | Recorte capturado |
|---|---|---|
| `growthBets` | `growth_bets_operational_v` | `approved`, `in_progress`, `waiting_window`, `ready_for_review` |
| `growthOutcomes` | `growth_outcomes_due_v` | somente linhas com `outcome_id` |
| `growthLearnings` | `growth_memory_active_v` | memória `active` ou `contested`, conforme a view |

Campos técnicos de autoria (`created_by`, `reviewed_by`) não entram no snapshot editorial.

## 4. Seleção material

### 4.1 Apostas

Máximo: 6.

Elegibilidade:

- estado aberto governado;
- período da evidência ou janela de outcome intersecta o período do relatório.

Ordenação:

1. `ready_for_review`;
2. `waiting_window`;
3. `in_progress`;
4. `approved`;
5. prazo de execução vencido;
6. execução bloqueada/falha;
7. menor prazo e atualização mais recente.

### 4.2 Outcomes

Máximo: 6.

Elegibilidade:

- `outcome_id` obrigatório;
- janela ou avaliação/revisão intersecta o período.

Ordenação: contestado, pronto para revisão, bloqueado por dados, não verificável, revisado; depois avaliação/revisão mais recente.

### 4.3 Aprendizados

Máximo: 3.

Elegibilidade:

- `active` ou `contested`;
- vigência intersecta o período.

Ordenação: origem `outcome`, contestação, revisão vencida, reuso e atualização.

O limite reduz o slide a 9 registros editoriais no máximo: 6 outcomes + 3 aprendizados. As views auxiliares preservam as seleções separadas.

## 5. Views do artefato

- `VIEW_GROWTH_BETS_MATERIAL`;
- `VIEW_GROWTH_OUTCOMES_MATERIAL`;
- `VIEW_GROWTH_MEMORY_MATERIAL`;
- `VIEW_GROWTH_LEARNING_RETROSPECTIVE`;
- `VIEW_ACTION_QUEUE`, ampliada com `editorial_origin`, `bet_id`, `contract_status` e `outcome_window_end`.

`VIEW_ACTION_OUTCOMES` permanece compatível com o motor legado. C7 passa a apontar para `VIEW_GROWTH_LEARNING_RETROSPECTIVE`; C8 continua em `VIEW_ACTION_QUEUE`.

## 6. Narrativa

C7 conta separadamente:

- outcomes materiais;
- aprendizados validados pelo loop;
- memórias curadas.

Quando não houver outcome, a narrativa diz explicitamente que não existe efeito realizado a inferir.

C8 conta separadamente apostas assumidas e candidatas do engine. A narrativa declara que aposta é compromisso humano e candidata ainda aguarda decisão.

## 7. Versionamento

- source: `1.5`;
- semantic: `1.5.0`;
- spec: `3.1`;
- renderer: inalterado.

## 8. Aceite

1. Os três conjuntos entram no artefato e alteram seu hash quando mudam.
2. Uma aposta aberta aparece em C8 como `growth_bet`.
3. Uma candidata aparece em C8 como `report_action_candidate`.
4. Uma agenda sem `outcome_id` não aparece em C7.
5. Outcome, aprendizado do loop e memória curada têm rótulos distintos.
6. Memória curada contém o limite de causalidade.
7. C7 e C8 ficam `pronto_dado` sem alterar renderer.
8. Os perfis continuam com 12 e 31 slides.
9. Testes Report Live, SQL PostgreSQL 17, Deno, TypeScript e build ficam verdes.
10. Publicação Google só ocorre após certificação e autorização separada.
