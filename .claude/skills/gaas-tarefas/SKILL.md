---
name: gaas-tarefas
description: Criar, ler e atualizar Tarefas e Sub Tarefas do GaaS (Tarefas e atividades, Kanban da Visão Daily e seção de Tarefas da Wiki) pelo caminho único do banco, com modelos, sem duplicar trabalho. Usar quando o pedido for criar Tarefa a partir de modelo, montar o checklist de uma entrega, vincular registro da Daily a uma Tarefa, marcar Sub Tarefa, concluir Tarefa, mover Tarefa de projeto ou frente, ou ler o andamento de uma iniciativa. Não usar para disparos CRM (tabela activities).
metadata:
  version: 1.1.0
  origin: claude-code
  agents: [claude-code, codex]
  process: [Operação, Produto, Engenharia]
  owner: Time GaaS Afinz
  last_validated: '2026-11-18'
  packaged_at: '2026-11-18'
  license: Uso no projeto Afinz/GaaS; os dados (Tarefas, pessoas, registros) ficam no Supabase e não integram o pacote.
---

# Tarefas e Sub Tarefas do GaaS

Quase nada é criado à mão: esta skill é o jeito certo de uma IA criar e mexer em trabalho no GaaS. Ela roda igual no Claude Code e no Codex.

## Modelo (o que é cada coisa)

| Palavra | Onde mora | Regra |
|---|---|---|
| **Tarefa** | `growth_development_tasks` com `parent_task_id` nulo | Entrega acompanhável. Vira card no Kanban. |
| **Sub Tarefa** | `growth_development_tasks` com `parent_task_id` | Item de checklist dentro da Tarefa. Um nível só. Não vira card. |
| **Grupo** | `subtask_group` (texto) na Sub Tarefa | Rótulo dentro do bloco Sub Tarefas ("Preparação", "Validação"). |
| **Iniciativa** | `growth_work_initiatives` | O porquê. Sub Tarefa herda a do pai. |
| **Frente** | `front_key` (chave de `daily_frentes` ou `gaas`) | Sem valor, vem do primeiro projeto, da iniciativa ou da coluna antiga `workspace`. |
| **Projetos** | `project_ids` (lista de `daily_projects.id`) | Uma Tarefa pode estar em mais de um projeto. Nunca adivinhar. |
| **BU/parceiro** | `partner_keys` (chaves de `daily_partners`) | Opcional. |
| **Responsável** | `owner_label` (texto) | Pode ser alguém sem conta no GaaS (lista `work_people`). |
| **Registro da Daily** | `daily_entries.work_ids` | Vincular = citar a Tarefa ou Sub Tarefa. Não cria trabalho. |
| **Modelo** | `growth_task_templates` | Estrutura reaproveitável. Nunca carrega conclusão. |

Regra das três caixas: **rotina** (ex.: "Carrinho Sábado") fica só como registro na Daily; **entrega** vira Tarefa com Sub Tarefas; **pergunta** fica na tabela "Perguntas em aberto" da nota até alguém ir atrás.

## Caminho único de escrita

Sempre pelos RPCs. Nunca `update`/`insert` direto nas tabelas: os RPCs validam revisão, dependências, conclusão e gravam histórico (`growth_development_task_events`).

| O que fazer | RPC |
|---|---|
| Criar Tarefa com Sub Tarefas de uma vez (de modelo ou de JSON) | `growth_save_task_tree(p_body)` |
| Acrescentar Sub Tarefas a uma Tarefa | `growth_save_task_tree({parent_id, subtasks:[...]})` |
| Mudar campos, marcar, bloquear, concluir | `growth_save_development_task(p_id, p_revision, p_body)` |
| Criar ou editar modelo | `growth_save_task_template(p_id, p_revision, p_body)` |
| Vincular registro da Daily | `gaas_daily_save_entry(p_id, p_revision, {work_ids:[...]})` |
| Pessoa só com nome | `gaas_work_save_person(null, null, {name})` |

`p_body` é parcial: só os campos enviados mudam. Em `details`, as chaves são mescladas e valor `null` remove a chave.

### Criar a partir de modelo

```sql
select public.growth_save_task_tree('{
  "template_key": "piloto-com-liberacao",
  "task": {"title": "Piloto Mulher · Mensal", "task_key": "SEG-PILOTO-MUL-MEN",
           "initiative_id": "<id da iniciativa>", "project_ids": ["<id do projeto>"]}
}'::jsonb);
```

As Sub Tarefas recebem a chave `<chave do pai>-01`, `-02`... e herdam iniciativa, frente e projetos. Modelos atuais: `nova-regua-crm`, `piloto-com-liberacao`, `parceiro-novo`, `incidente`, `spec-sdd` (listar com `select key,title,description from growth_task_templates where not archived`).

### Marcar, bloquear e concluir

- Marcar Sub Tarefa: `{"status":"concluida"}` com a revisão atual. Não pede evidência.
- Bloquear: `{"status":"bloqueada","blocked_reason":"..."}` (o motivo é obrigatório).
- Concluir Tarefa com Sub Tarefas: todas fechadas (concluídas ou canceladas) e `resolution` com a entrega. Sem Sub Tarefas: critérios todos marcados e `resolution`.
- Dependências (`dependencies`, por `task_key`) impedem iniciar ou concluir antes da dependência.
- Tarefa concluída ou cancelada não recebe Sub Tarefa aberta (nova, reaberta ou movida para baixo dela): o banco devolve `task_parent_closed`. Reabra a Tarefa primeiro.
- Árvore pedida já concluída (`task.status: concluida`) só passa com todas as Sub Tarefas fechadas; a conclusão é aplicada depois das filhas.
- A chave da Sub Tarefa nova (`PAI-NN`) sai do maior sufixo já usado; não mande `task_key` só para "acertar a numeração".
- `project_ids` mantém a ordem enviada (o primeiro projeto decide campanha e frente); projeto juntado na Daily vira o projeto destino.
- Transformar Sub Tarefa em Tarefa: `{"parent_task_id": null}`. Mantém id, chave, histórico e vínculos.

### Rodar SQL em nome de alguém (scripts)

De dentro de `calendar-estrategico/`, com `GAAS_ON_BEHALF_USER_ID` do `.env.agent`:

```sql
begin;
select set_config('request.jwt.claims','{"sub":"<uuid>","role":"authenticated"}',true);
select set_config('request.jwt.claim.sub','<uuid>',true);
-- chamadas de RPC aqui
commit;
```

`supabase db query --linked -f arquivo.sql --yes`. Escrita em produção só com pedido explícito do Pablo.

## Não fazer

- Não criar Tarefa para cada registro da Daily nem para rotina.
- Não juntar ou separar Tarefas existentes sem simulação na mão do Pablo (lista do que muda e script de volta).
- Não renomear uma Tarefa para virar outra coisa: crie uma nova e cancele a antiga com motivo.
- Não inferir liberação, ativação ou disparo pelo status de uma Tarefa documental.
- Não gravar nomes de pessoas ou dados de negócio em arquivo versionado (o repositório é público).

## Onde está na tela

- **Tarefas e atividades** (módulo do clone do Notion): páginas por frente com Quadro, Tabela e Calendário. Card mostra "Sub Tarefas x/y".
- **Visão Daily**: menu do registro "Vincular a Tarefa…"; kanban por iniciativa.
- **Wiki**: seção de Tarefas da estratégia, achada pela iniciativa dos projetos da Daily que apontam para a nota (`daily_projects.wiki_note`).
