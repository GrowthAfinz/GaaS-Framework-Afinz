# Release 6 — reutilização determinística da memória

**Data:** 2026-09-23  
**Estado:** contrato executável para implementação

## 1. Decisão

A primeira reutilização de memória do Loop de aprendizado Growth será determinística. Não haverá embeddings, busca vetorial, recomendação generativa nem similaridade por texto livre neste corte.

O sistema apresenta memória somente quando:

1. a frente do sinal e da memória é a mesma;
2. pelo menos uma dimensão específica coincide exatamente;
3. nenhuma dimensão declarada dos dois lados entra em conflito.

Coincidência apenas de frente ou domínio não produz sugestão.

## 2. Dimensões e ranking

O matcher compara valores normalizados de `metric`, `signal_code`, `partner`, `regime`, `entity`, `entity_key`, `source_view`, `channel`, `platform`, `system`, `artifact`, `rule` e `campaign_family`.

| Dimensão coincidente | Pontos |
|---|---:|
| `metric` | 40 |
| `signal_code` | 30 |
| `partner` | 25 |
| `regime` | 25 |
| `entity`, `entity_key` ou `source_view` | 20 |
| `channel` | 15 |
| demais dimensões explícitas | 10 |
| origem validada por outcome | 10 |
| classificação confirmada | 5 |
| confiança confirmada | 5 |

Uma revisão vencida reduz o score em 10 pontos e exige atenção explícita. O resultado retorna no máximo cinco memórias, ordenadas por score e atualidade.

## 3. Elegibilidade

| Estado observado | Tratamento |
|---|---|
| ativa, vigente e revisão futura | `reusable` |
| ativa, vigente e `review_at` alcançado | `needs_review`; pode ser reutilizada com decisão explícita |
| `valid_until` ultrapassado ou ciclo `expired` | `expired`; aviso, sem opção de reutilizar |
| ciclo `contested` ou classificação `contradictory` | `contested`; aviso, sem opção de reutilizar |
| ciclo `superseded` | `superseded`; aviso, sem opção de reutilizar |
| classificação `invalidated` ou confiança `blocked` | `blocked`; aviso, sem opção de reutilizar |

## 4. Snapshot e decisão

Ao assumir uma nova aposta, cada sugestão elegível exige uma decisão:

- `reused`: a memória orientou a aposta;
- `discarded`: a memória foi consultada, mas não deve orientar este caso; o motivo é obrigatório.

O registro é append-only e criado na mesma transação da aposta. Ele congela:

- ID e revisão corrente da memória;
- decisão e justificativa;
- score e razões do match;
- estado de elegibilidade;
- contexto do sinal usado na comparação;
- ator e instante.

Esse registro separado completa o snapshot de crença sem alterar retroativamente `belief_snapshot`, que permanece imutável pelo contrato da Release 3.

## 5. UX

Na decisão **Assumir aposta**, a seção `Memória aplicável` mostra:

- afirmação;
- procedência (`outcome` ou `vault_curated`);
- dimensões que produziram o match;
- confiança, revisão e vigência;
- limitações;
- controles `Reutilizar` e `Descartar` quando elegível;
- aviso não selecionável quando bloqueada.

A aposta não pode ser aprovada enquanto alguma sugestão elegível estiver sem decisão. O drawer da aposta mostra depois o snapshot consultado e a decisão registrada.

## 6. Contratos técnicos

- `growth_find_applicable_learnings(action_candidate_id)` calcula candidatos no servidor.
- `growth_accept_signal_as_bet_with_memory(...)` valida novamente o match, cria a aposta e persiste decisões de forma atômica.
- `growth_learning_applications` preserva o snapshot imutável de uso/descarte.
- `growth_learning_applications_v` é a projeção de leitura por aposta.
- `growth_memory_active_v` expõe contagens de reuso/descarte e taxa de reuso.

O cliente nunca envia score, revisão ou razões como fonte de verdade; envia apenas `learning_id`, decisão e motivo. O servidor recalcula e congela o restante.

## 7. Aceite

1. mesma frente sem dimensão específica não sugere memória;
2. correspondência exata sugere e explica as dimensões;
3. conflito explícito exclui o match;
4. memória expirada, contestada, substituída ou bloqueada não pode ser reutilizada;
5. toda sugestão elegível recebe `reused` ou `discarded` antes da criação da aposta;
6. descarte exige motivo;
7. revisão, contexto e razões ficam congelados;
8. reutilização cria link `applies_to` para a aposta;
9. mutação ou exclusão direta do snapshot é bloqueada;
10. o app mostra a decisão na aposta e a memória expõe sua taxa de reuso.

## 8. Fora do corte

- sugerir memória ao mesclar sinal em aposta existente;
- aprender pesos automaticamente;
- similaridade semântica;
- recomendação escrita por LLM;
- aplicação automática sem decisão humana;
- mudanças no Report Live.
