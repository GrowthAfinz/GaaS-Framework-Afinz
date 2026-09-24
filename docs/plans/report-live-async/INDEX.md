# Report Live assíncrono — pacote de implementação

**Status:** especificação inicial para revisão  
**Data:** 2026-09-24  
**Decisão de produto:** o nome exibido continua sendo **Report Live**, com atualização programada três vezes por semana. Google Sheets e Google Slides deixam de ser dependências do caminho de publicação.

## Ordem de leitura

1. [`CLAUDE_COWORK_HANDOFF.md`](CLAUDE_COWORK_HANDOFF.md) — ponto de entrada autossuficiente e passo 0 de cobertura dos 57 slides.
2. [`CLAUDE_COWORK_RENDERER_SPEC.md`](CLAUDE_COWORK_RENDERER_SPEC.md) — contrato completo para o Claude implementar o renderer PPTX/PDF.
3. [`SUPABASE_ASYNC_PUBLISHING_PLAN.md`](SUPABASE_ASYNC_PUBLISHING_PLAN.md) — fila, artefatos, certificação, Storage e integração com o GaaS.

## Fontes preexistentes consolidadas

Este pacote não substitui os contratos analíticos existentes. Ele os transforma em uma fronteira executável entre engine, renderer e produto.

- `MASTER_DECK_SPEC.md`: inventário semântico C0–A7 e contratos CT-1–CT-10.
- `Afinz-CRM-Midia-Vault/05-Estrategia/Report-Live-Arquitetura-Editorial.md`: 10 famílias editoriais, régua e hipótese ainda não homologada de compactação 57→31/12.
- `.claude/skills/afinz-pptx/`: marca, template institucional e QA visual.
- `report-live-design.ts`: canvas, geometria-base, arquétipos e versões.
- `report-live-engine.ts`: implementação candidata dos perfis de 12 e 31 slides, ainda sem equivalência visual/funcional homologada.
- `report-live-versioning.ts`: blueprints, hashes, certificação e cardinalidade.
- Release 7C: apostas, outcomes e memórias projetados em C7/C8.

## Divisão de responsabilidade

| Frente | Responsável | Resultado |
|---|---|---|
| Renderer visual | Claude Cowork | scripts versionados, PPTX, PDF, thumbnails e QA visual |
| Modelo editorial determinístico | Report Live engine | slides selecionados, números, comparações, vereditos e limites; cardinalidade só muda após equivalência de cobertura |
| Pacote normalizado de renderização | Codex/GaaS | `report-render-package.json` sem dependência de Google |
| Orquestração | Codex/Supabase | agenda, jobs, leases, checkpoints, retries e idempotência |
| Artefatos e publicação | Codex/Supabase | Storage imutável, certificação, ponteiro vigente e rollback |
| Consumo | Codex/GaaS | visualizador PDF, downloads, freshness, histórico e estado do job |

## Regra de corte

O renderer não consulta fontes, recalcula métricas, escolhe slides ou decide publicação. Ele transforma um pacote certificado em artefatos visuais completos. A publicação vigente só muda depois que o Supabase valida e ativa o novo run.

Os 57 slides da publicação de agosto são a baseline de cobertura funcional. Os perfis de 12/31 existem no código, mas nunca foram homologados como substitutos equivalentes. Nenhuma compactação entra no novo renderer antes de cada slide da baseline receber destino explícito: preservar, fundir com evidência de equivalência, omitir por ausência de dado ou aposentar por encerramento de escopo.
