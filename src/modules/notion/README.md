# Módulo Notion (Testes e Tarefas)

Base: [notion-clone](https://github.com/samirsawarkar/notion-clone), licença MIT (ver `LICENSE.notion-clone`; commit de origem em `UPSTREAM_COMMIT`).

O que foi mantido do clone: editor de blocos com menu "/", visões de base (tabela, quadro, lista, galeria, calendário), células de propriedade, painel de abertura, árvore lateral, busca, lixeira e modelos.

O que mudou para o GaaS:
- `gaas/notionData.ts`: o espaço vem do Supabase (tabelas `nt_*`) e só o que mudou é gravado, pela função `nt_sync`.
- `gaas/tasksAdapter.ts`: a base Tarefas mostra e edita `growth_development_tasks` (Fila, agentes e skills continuam lendo essa tabela).
- `components/database/viewEngine.tsx`: filtros, ordenação, agrupamento e propriedades visíveis salvos por visão.
- `gaas/templates.ts`: modelos do GaaS (Spec SDD, Experimento A/B, Investigação, Aposta, Decisão, Daily).
- `gaas/AiPages.tsx` e `gaas/aiPagesData.ts`: Páginas IA, base só leitura com as saídas dos agentes (`crm_insights`, `paid_media_insights`, `growth_investigation_analyses`, `growth_curated_proposals`). Validade por tipo (insight 30 dias, investigação 45, proposta sem validade); "Virar card" cria a Tarefa com `details.ai_page` apontando de volta para a página.
- `gaas/GaasPanels.tsx`: briefing para os agentes e ajustes (membros vêm dos acessos aprovados).
- Interface em PT-BR, tema e atalhos presos à raiz do módulo.
