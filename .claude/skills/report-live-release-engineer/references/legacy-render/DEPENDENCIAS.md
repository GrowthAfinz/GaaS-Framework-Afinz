# O que falta para a parte report-live rodar de ponta a ponta

| # | Peça | Dono | Estado (28/09) |
|---|---|---|---|
| 1 | Renderer `report_live_renderer/` (PPTX, PDF, prévias, `qa-report.json`) | Claude Cowork | passo 0 (mapa dos 57) aceito em 25/09; implementação não iniciada |
| 2 | Modo do dispatcher que devolve o pacote do run certificado (ex.: liberar `export_artifact`/`render_package` em `report_live_dispatch`, resposta lida via `net._http_response`) | Codex | não existe; `report_live_dispatch` aceita só `build`, `worker`, `inspect_contract` |
| 3 | Fila `report_render_jobs` + RPC de lease + botão "Gerar PPT" e status "gerando…/disponível" no GaaS | Codex | só especificado em `SUPABASE_ASYNC_PUBLISHING_PLAN.md` |
| 4 | Upload governado (URL assinada de upload ou RPC de finalização com hashes) em paths imutáveis | Codex | não existe |
| 5 | Destravar/encerrar o run `c543aaa3…` preso em `publishing` desde 15/09 | Pablo decide, Codex executa | pendente |
| 6 | Cadência automática (3x/semana ou só sob demanda) | Pablo | em aberto |

## Fluxo "clicou no GaaS e espera" (quando 3 existir)

O Cowork não recebe aviso do banco. Para o botão funcionar sem você pedir no chat:
- crie uma tarefa agendada leve no Cowork, dias úteis, a cada 1 h das 9h às 18h:
  > Use a skill gaas-loop, parte report-live. Verifique a fila de render; se não houver pedido, encerre em silêncio.
- a tarefa só trabalha quando houver job `queued`. A validação continua sendo sua: ela para no passo 5 e te chama.

## Prompt pronto para o Codex (itens 2–4)

> Implementar no GaaS as peças 2, 3 e 4 de `.claude/skills/gaas-loop/report-live/DEPENDENCIAS.md`, seguindo `docs/plans/report-live-async/SUPABASE_ASYNC_PUBLISHING_PLAN.md`: (2) modo de exportação do pacote de render acessível via `report_live_dispatch` para service role; (3) `report_render_jobs` com estados queued→claimed→rendering→awaiting_approval→uploading→done/blocked/error, RPC de lease e botão "Gerar PPT" com status no card do Report Live; (4) finalização governada com upload em `runs/<run_id>/renders/<renderer_version>/` e hashes. Sem Google no caminho. Migrations aplicadas e verificadas no projeto mipiwxadnpwtcgfcedym.
