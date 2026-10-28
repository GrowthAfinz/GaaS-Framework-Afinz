# Release 8 — diagnóstico da fatia 0

Somente leitura em 27/10/2026. Fatia 1 autorizada posteriormente por Pablo no chat.

## Premissas confirmadas e corrigidas

- [observado] `git ls-remote origin refs/heads/main`: main = `73ccd4bdbca48d45b717742c61c021aad838b8e8`. Checkout original em branch archive; não é base adequada para mudança.
- [observado] PR #33 aberto, não mergeado, head `26dd12d2420d4f4ab8327a6af398dd58c9e34db2`; 113 commits atrás e um exclusivo na auditoria. Edge `report-sync` versão 52 também não contém monthly_full.
- [observado] Outros worktrees com commits exclusivos: activity-communication-previews (12 atrás/2 exclusivos), importer-aqs-routing (107/1), plurix-v11-envelope (87/1), vault-wikilink-navigation (81/1), partner-briefing-slots (199/1). Nenhuma alteração adicional no pipeline auditado; navegação Wiki é contexto separado.
- [observado] Run `c543aaa3-0bd9-440a-ba3d-6404cc112d97`: agosto/2026, build 15/09, monthly_report, renderer 2.2-editorial-profiles-outcomes. [não verificável] SHA e branch de origem não constam do manifesto; associação ao histórico editorial de setembro é inferida.
- [observado] Publicação `d763d844-98ff-4b24-a762-f151561b21a7`: publishing/staging, job pausado em narrative, duas tentativas; erro Google 400 em refreshSheetsChart, gráfico não encontrado. Recibos de backup, sheets, verify_sheets e slides; 73 abas, 12 slides staged, 8 gráficos. [não verificável] Não foi feita inspeção direta da existência atual desses objetos no Google.
- [observado] Ponteiro live: run `9bb55892-4b17-4f76-825a-0ac97c92b525`, publicação `54649269-7cce-460a-a87d-b4cc5f310a62`, versão 8. Sem lock da tentativa parada. Encerramento futuro deve revalidar ponteiro/worker e alterar somente os registros da tentativa, mantendo histórico; limpeza Google exige inspeção separada. Nada executado.
- [observado] Main `report-live-versioning.ts:460–475` e Edge implantada ainda usam 12/31. A decisão de 25/09 está no commit não integrado e supera a composição editorial fixa, sem invalidar o histórico do run.
- [observado] `report_render_jobs`/`report_artifacts` ausentes, assim como as novas tabelas da Release 8. Já existem package adapter, schema, fixtures, renderer local e jobs/checkpoints Google: a premissa “nada assíncrono implementado” é excessiva.
- [observado] `report-live-engine.ts:152–161` deriva frente por regex, com aquisição antes de Copa/rentabilização; não há função SQL de frente entre as pesquisadas. Não usar essa heurística como confirmação comercial.
- [observado] Inventário original: `outputs/inventario-operacoes-growth-2026-10-03/registro.json` na raiz ACALENDARIO APP, SHA256 `e2583c4ed331bee49cc68e4520bb98f54a0be007e1568ce9511325e0d9a70a87`, com 164 entidades/33 CRM. Pasta wiki-resultados-historico não é a origem primária. Gerador `scripts/build-wiki-subjects.py:8–18,30,68` usa caminho derivado do ID e sobrescrita determinística, mas não valida duplicata/colisão de slug.
- [observado] Banco: 48 candidatas em três códigos, uma aposta, zero decisões/outcomes/retrospectivas. activities até 26/10. Snapshot local de agosto conferiu hashes de conteúdo/tabelas/narrativas/blueprints. Serasa: 988 certificado, 941 na consulta atual, sem atribuição de causa.

Evidência de banco: SELECTs em information_schema, report_runs, report_publications, report_publication_jobs, report_publication_locks, report_live_pointer e agregados activities. Nenhuma chamada de escrita ou autenticação Google foi executada.
