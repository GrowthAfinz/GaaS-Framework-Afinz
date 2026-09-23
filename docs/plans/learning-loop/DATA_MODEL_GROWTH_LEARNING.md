# Modelo de dados planejado — Loop de aprendizado Growth

**Status:** desenho; não é migration
**Princípio:** estender a fundação existente sem renomear ou duplicar imediatamente contratos do Report Live.

## 1. Estruturas existentes relevantes

| Estrutura | Uso atual | Papel no novo produto |
|---|---|---|
| `report_action_candidates` | recomendações candidatas | fonte inicial de sinais/recomendações |
| `report_action_outcomes` | verificação determinística | base de outcome, ampliada para aposta/revisão |
| `report_run_memory` | narrativa/recomendações por run | evidência histórica do report, não biblioteca canônica |
| `report_memory` | projeção legada do ciclo atual | compatibilidade; não recebe nova responsabilidade central |
| `report_runs` | identidade de execução | procedência de sinais e outputs |
| `report_frozen_inputs` | snapshot atômico | referência de evidência |
| artefato imutável | tabelas/manifestos/blueprints | fonte para reprodução e auditoria |

## 2. Decisão de transição

Não renomear tabelas `report_*` no MVP. O domínio de produto usa nomes `Signal`, `Bet`, `Outcome` e `Learning`; adapters/views traduzem as estruturas existentes.

Isso evita:

- quebrar o engine e artefatos legados;
- misturar rebranding com migração destrutiva;
- criar dois produtores de outcome;
- exigir reprocessamento histórico antes de entregar valor.

## 3. Novas tabelas propostas

### 3.1 `growth_bets`

```sql
id uuid primary key
source_action_candidate_id uuid null
evidence_snapshot_id uuid not null
front text not null
team_scope text not null
owner text null
hypothesis text not null
action_text text not null
metric_name text not null
baseline_value numeric not null
expected_value numeric not null
expected_direction text not null
expected_unit text null
success_criterion text not null
execution_due_at timestamptz null
outcome_window_start date not null
outcome_window_end date not null
verification_view text not null
stop_condition text null
known_alternatives jsonb not null
status text not null
belief_snapshot jsonb not null
contract_version text not null
created_by uuid not null
created_at timestamptz not null
updated_at timestamptz not null
```

No estado `approved`, baseline, expectativa e contrato de verificação são obrigatórios. A Release 3A não converte sinal incompleto em aposta parcial: o comando exige o preenchimento do contrato antes da escrita.

### 3.2 `growth_bet_updates`

Timeline humana e sistêmica:

```sql
id uuid primary key
bet_id uuid not null
update_type text not null
body text null
execution_status text null
metadata jsonb not null
created_by uuid not null
created_at timestamptz not null
```

### 3.3 `growth_bet_checklist_items`

```sql
id uuid primary key
bet_id uuid not null
label text not null
status text not null
position integer not null
completed_at timestamptz null
created_at timestamptz not null
updated_at timestamptz not null
```

### 3.4 `growth_evidence_snapshots`

```sql
id uuid primary key
source_run_id uuid null
artifact_path text null
source_hash text not null
period_start date not null
period_end date not null
filters jsonb not null
metrics jsonb not null
quality_state jsonb not null
regime jsonb not null
created_at timestamptz not null
```

`growth_bets` referencia um snapshot. Quando o sinal nasce de run certificado, o snapshot pode apontar para o artefato existente em vez de duplicar seus bytes.

O snapshot e o `belief_snapshot` são imutáveis. Alterações posteriores na aposta poderão atualizar seu estado operacional, mas não reescrevem a crença aprovada nem a evidência usada na decisão.

### 3.5 `growth_feed_events`

```sql
id uuid primary key
event_type text not null
subject_type text not null
subject_id uuid not null
front text not null
occurred_at timestamptz not null
priority_score numeric not null default 0
relevance_dimensions jsonb not null
summary_snapshot jsonb not null
route text not null
dedupe_key text not null unique
```

Append-only. Correção de objeto não reescreve posts antigos; mudança material gera novo evento.

### 3.6 `growth_learnings`

```sql
id uuid primary key
source_kind text not null -- outcome | vault_curated
source_outcome_id uuid null
source_key text not null unique
source_title text not null
source_ref text not null
front text not null
classification text not null
lifecycle_status text not null
statement text not null
scope jsonb not null
applicability jsonb not null
limitations jsonb not null
confidence_status text not null
regime text null
valid_from date not null
review_at date not null
valid_until date null
supersedes_learning_id uuid null
current_revision integer not null default 1
created_by text not null
created_at timestamptz not null
updated_at timestamptz not null
```

`source_outcome_id` é obrigatório e único quando `source_kind = 'outcome'`; deve ser nulo em `vault_curated`. A origem nunca é inferida pela redação da afirmação.

### 3.7 `growth_learning_revisions`

```sql
id uuid primary key
learning_id uuid not null
revision integer not null
statement text not null
scope jsonb not null
applicability jsonb not null
limitations jsonb not null
classification text not null
confidence_status text not null
valid_from date not null
review_at date not null
valid_until date null
change_reason text not null
changed_by text not null
created_at timestamptz not null
unique (learning_id, revision)
```

### 3.8 `growth_learning_links`

Liga memória a apostas, evidências, outras memórias e relatórios.

```sql
id uuid primary key
learning_id uuid not null
target_type text not null
target_id text not null
relation_type text not null
created_at timestamptz not null
unique (learning_id, target_type, target_id, relation_type)
```

### 3.9 `growth_curated_proposals`

Registra propostas históricas que merecem aparecer na Fila, mas ainda não possuem contrato suficiente para se tornarem apostas.

```sql
id uuid primary key
source_key text not null unique
source_ref text not null
front text not null
bucket text not null
title text not null
problem text not null
evidence text not null
action_text text not null
metric_name text null
confidence_status text not null
reading_limit text not null
lifecycle_status text not null
created_at timestamptz not null
```

### 3.10 `growth_signal_decisions`

Materializada na Release 3B para impedir dupla decisão sobre uma recomendação e preservar rejeições/mesclagens que não criam uma nova aposta:

```sql
id uuid primary key
action_candidate_id uuid not null unique
decision_type text not null -- accepted | rejected | merged
bet_id uuid null
reason text null
decided_by uuid not null
decided_at timestamptz not null
```

O registro é imutável. `accepted` e `merged` exigem `bet_id`; `rejected` exige motivo e não aponta para aposta.

## 4. Extensões propostas em `report_action_outcomes`

Adicionar sem remover o contrato atual:

- `bet_id uuid null`;
- `execution_status text`;
- `system_verdict text`;
- `review_status text`;
- `reviewed_at timestamptz`;
- `contestation_reason text`;
- `resolved_verdict text`;
- `evidence_snapshot_id uuid`.

O campo atual `outcome_status` permanece compatível durante a transição.

## 5. Views de leitura

### `growth_learning_inbox_v`

Une candidatos, qualidade, apostas relacionadas e evento mais recente.

### `growth_bets_operational_v`

Expõe aposta, execução, janela, outcome e estado derivado.

### `growth_outcomes_due_v`

Classifica `due_today`, `overdue`, `waiting_data`, `ready_review`, `reviewed`.

### `growth_memory_active_v`

Somente memórias vigentes; explicita contradições e substituições.

### `growth_feed_v`

Aplica ordenação e filtros sem reconstruir conteúdo dos objetos.

### `growth_learning_summary_v`

Taxa de loops fechados, prazos, outcomes, reuso e bloqueios.

## 6. Produção de eventos

Eventos devem ser escritos no mesmo comando/transação que altera o objeto ou por outbox transacional simples. Não inferir todo o feed periodicamente por `UNION` de tabelas.

Produtores:

- engine determinística;
- comandos de aposta;
- avaliador de outcomes;
- materializador de memória;
- pipeline Report Live.

## 7. Relevância

O banco armazena dimensões; o score final pode ser calculado em view/serviço:

```text
priority_score
+ match_frente
+ match_bu
+ match_entidade
+ estado_aberto
+ memoria_aplicavel
- idade_normalizada
```

Não existe personalização social no MVP.

## 8. Vigência padrão

| Tipo | `review_at` sugerido |
|---|---:|
| sinal de campanha/execução | 30 dias |
| padrão operacional | 90 dias |
| regra contextual | 180 dias |
| regra canônica | revisão explícita, sem expiração automática |

O serviço pode sugerir; o valor fica persistido.

## 9. Histórico

O histórico possui duas rotas independentes e idempotentes:

- outcomes existentes e revisados são retropreenchidos como `source_kind = 'outcome'`;
- decisões vivas do vault podem ser curadas como `source_kind = 'vault_curated'`, sempre com `source_ref`, limitações, vigência e revisão.

Curadoria histórica não equivale a validação pelo loop. Propostas ainda sem métrica verificável entram como `growth_curated_proposals`, e não como apostas prontas.

## 10. Fora deste desenho

- embeddings;
- vector store;
- grafo dedicado;
- event bus externo;
- microserviços;
- nova camada de autenticação;
- automação de campanhas.
