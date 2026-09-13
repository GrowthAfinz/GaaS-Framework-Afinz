# Report Live — implementação assumida pelo Codex

Atualização: 12/09/2026. Trabalho em andamento; não é certificado de publicação.

## Escopo e base

Implementar a spec `SPEC_REPORT_LIVE_AGOSTO_2026_CLAUDE_CODE.md`, começando por dados e publicação correta de agosto. Viewer, histórico e PDF/PPTX por frente continuam no escopo. Memória V2 permanece futura.

Branch: `codex/report-live-august-durable`, criada de `feat/report-live-v1` em `08bf434`. Alterações e arquivos alheios foram preservados. O endpoint canônico `report-sync` e o renderer vivo ainda não foram promovidos por esta implementação.

## Alterações implementadas e verificadas localmente

- Comandos desconhecidos e datas inválidas são rejeitados; limpeza não cai em publicação completa.
- Custo ou denominador incompleto não gera CAC artificial; ausência diária permanece explícita.
- Leitura integrada respeita cutoff; leitura executiva nativa mantém o período da frente.
- Contratos inativos são excluídos; status `complete` de coleta é reconhecido.
- Seleção de resultados de mídia usa evento certificado, granularidade de anúncio e janela única. Eventos/janelas concorrentes e cobertura parcial não produzem CPA.
- Alcance de várias observações não é somado como alcance único.
- Identidade de conteúdo exclui somente identificadores explícitos da tentativa; timestamps de negócio permanecem.
- Certificação recalcula hashes de tabelas, narrativas, blueprints e fontes hidratadas. Alterações posteriores reprovam.
- Build dividido em refresh, captura, cálculo, persistência e certificação. Checkpoint e lease ficam no banco.
- Upload imutável aceita repetição apenas quando o conteúdo existente é idêntico.

Testes: `node --test scripts/test-report-live-correctness.mjs` (14 casos, todos passaram em 11/09). Typecheck Deno do runtime, renderer e candidate passou antes do último ajuste local de B1. Usar `--node-modules-dir=auto --no-lock` no ambiente atual; a primeira execução encontrou dependência de tipos ausente e depois quatro erros de tipagem, corrigidos.

## Alterações efetivas no Supabase

Migration `20260910171740_report_live_durable_build_steps.sql` aplicada. O timestamp local foi alinhado ao histórico retornado pelo Supabase MCP.

- `report_build_jobs` e `report_frozen_inputs` com RLS e sem acesso anon/authenticated.
- RPCs de claim, checkpoint, captura e autenticação exclusivas do serviço.
- Segredo aleatório próprio do worker criado no Vault; valor não retornado nem registrado.
- Removido acesso público ao refresh da materializada.
- Dispatcher antigo deixava uma chave `anon` do coletor autorizar o acionamento. Agora exige o segredo próprio. O endpoint canônico ainda precisa ser promovido com a autenticação nova antes de voltar a usar esse dispatcher.
- Scheduler de retomada ainda não ativado. Validação inicial usa acionamento explícito pelo banco.

Candidate `report-sync-build-candidate` v1 publicado com autenticação própria. Só aceita `build` e `worker`, rejeita publicação e não alcança rotas de escrita Google. Testes HTTP: build e worker sem autenticação retornaram 401; full retornou 400. Grants efetivos confirmaram anon sem snapshots/refresh e authenticated sem escrita nos jobs.

## Primeira execução isolada de agosto

Run: `fe7dc078-821b-42b9-b2da-3464f6ba0a03`.

- Solicitação aceita com HTTP 202 (pg_net 379).
- Refresh concluído (380).
- Captura concluída em uma consulta de fontes (381).
- Cálculo concluído e checkpoint persistido (382); ultrapassou a etapa que morria na versão anterior.
- Persistência e certificação concluídas (383/384), com fontes reidratadas do Storage. Run certificado tecnicamente, inativo, publicação pendente.

Snapshot inclui julho/agosto: 1.798 linhas CRM, 1.110 de mídia e 13.974 fatos de eventos no nível de anúncio. Agosto: CRM 809 linhas, 2.849 cartões e custo 45.391,037184; mídia 555 linhas e gasto 13.157,740061. Totais reconciliados com as fontes, sem homologar automaticamente cada métrica. B2C ausente; rentabilização até 23/08.

## Segunda revisão isolada — 11/09

Candidate v2 implantado; run `cf3e78c5-51ed-44f3-b0e8-f11ef4819659` aceito (pg_net 390). Refresh, captura, cálculo, persistência e certificação concluíram com HTTP 200 (391–395). Job `done`, sem erro, run `certified`, inativo e publicação `pending`. Nenhuma escrita Google executada.

Inspeção posterior encontrou falso missing de `crm_cards` em B1, cuja coluna se chama `emissions` na linha CRM. Corrigido e testado localmente; B2C parcialmente preenchido também deixa de produzir soma/conversão aparentemente completa. Esses dois ajustes posteriores não estão no candidate v2 nem em seu artefato certificado.

- Manifesto deriva cutoffs e cobertura dos dados congelados; seguros exclui outras BUs e eventos consideram ad/fact.
- Frente obrigatória sem view permanece visível com confiança bloqueada; condicionais continuam obedecendo ao contrato.
- Confiança dos slides de parceiros usa o cutoff CRM; ausência de B2C não degrada a mesma evidência CRM.
- Identidade por anúncio permite ligação apenas quando há um único campaign_id; nomes parecidos não autorizam fusão.
- Meta consultado em modo somente leitura para 24, 25 e 26/08: nenhuma linha retornada em 25/08; dias adjacentes retornam eventos residuais com gasto observado zero. Não foi inserido zero para o dia ausente.
- A fonte governada de eventos cobre uma de oito campanhas de mídia Meta em agosto. Campanhas com prefixo Fábrica de Vendas possuem anúncios distintos: não tratar como simples renomeação.

## Pendências que impedem chamar a entrega de produção correta

### Evolução da implementação — 11/09, segunda rodada

- Candidate v3 implantado com semântica `1.2.2`, incluindo correção B1 e proteção comum de publicação: todas as chamadas de `publishStoredArtifact`, inclusive rollback, reidratam fontes e validam hashes/contratos antes de lock/escrita Google. Essa proteção de publicação ainda não está no endpoint canônico e não foi exercitada contra o Google.
- Migration `20260911230725_report_live_build_transition_guards.sql` aplicada. Etapas não podem saltar arbitrariamente; cálculo exige snapshot, persistência exige checkpoint correspondente ao run, certificação exige artefato, conclusão exige certificação ou duplicata identificada. Finalização libera `active_run`.
- Teste SQL `scripts/test-report-live-build-recovery.sql` passou no Supabase, com rollback integral das simulações. Verificou dono incorreto, lease vencido, retomada da mesma fase com novo token, exclusividade de claim, transição válida, salto proibido, checkpoint inválido e limite de tentativas. Não substitui teste de interrupção real durante escrita Google.
- Novo run `9bb55892-4b17-4f76-825a-0ac97c92b525`, requisição 396; refresh/captura/cálculo/persistência/certificação 397–401 concluídos com HTTP 200. Artefato B1 confirmou somente `b2c_proposals`/`b2c_emissions` ausentes, sem falso missing de CRM.
- HTTP sem autenticação: build/worker 401; publish/rollback 400 no candidato isolado.
- Card do GaaS corrigido localmente para respeitar `active_run` e estados terminais; build certificado e inativo encerra polling, enquanto certificação intermediária de execução ativa continua sendo acompanhada. Saída só aparece confirmada quando `publication_valid=true`. Frontend ainda não promovido.
- Os 14 testes Node, a checagem Deno e o build Vite passaram. Build final após ajuste de `active_run`: `index-5ravqTBZ.js`; avisos de tamanho de bundle/importação dinâmica continuam. Nenhuma homologação visual ou publicação do frontend foi feita. Run v3 confirmado `certified`, job `done`, sem erro, `active_run=false`, publicação pendente; anon sem permissão de finalizar etapa.

1. Concluir validação da terceira revisão e testar interrupção real durante persistência/publicação; retomada e limite de tentativas no banco já testados.
2. Inspecionar os contratos e o artefato da v2; certificação técnica isolada não equivale à versão final de agosto.
3. Reconciliar métricas do snapshot contra origens, tratar lacunas de mídia de 25/08/rentabilização e registrar diferenças sem alterar dados por hipótese.
4. Ajustar manifesto para as fontes realmente congeladas e manter narrativas úteis e limites explícitos.
5. Fazer publicação por etapas com recuperação independente, verificação célula a célula, QA visual e PDF da mesma geração.
6. Verificar permissões do operador real, configurar retomada operacional e testar as negações de acesso.
7. Viewer/histórico/exportações por frente, integração na main e verificação pública do GaaS.

O advisor aponta problemas preexistentes de RLS em tabelas de negócio, incluindo `b2c_daily_metrics`, `goals` e `paid_media_metrics`. Não confundir essas dívidas com as novas tabelas privadas; avaliar impacto nos consumidores antes de alterar políticas globais.

## Publicação recuperável — 12/09

- `report-live-publication.ts`: protocolo de uma etapa por chamada, pré-requisitos verificados, conferência de posse antes/depois do efeito e comparação célula a célula. Normaliza somente células vazias; distingue zero, false, texto numérico e linhas residuais. Vinte testes Node passaram (14 de dados + 6 de publicação). Testes de interrupção do protocolo usam efeitos simulados, não Google.
- Migration `20260912031223_report_live_publication_steps.sql` aplicada: tabela privada de etapas/recibos, claim exclusivo com lease, limite de tentativas, pausa mantendo a reserva do deck e conclusão condicionada ao ponteiro real. Teste `test-report-live-publication-store.sql` passou com rollback integral das linhas simuladas.
- O protocolo e a persistência ainda precisam ser conectados ao executor Google e ao acionamento operacional. A existência da tabela não significa que o publisher legado já passou a executar por etapas.
- Candidate v4 adiciona `inspect_publication`, restrito ao serviço e somente leitura no Google; grava evidência privada no Storage. Publicação/rollback continuam inacessíveis no candidato.
- Inspeção real 402: 69 tabelas comparadas, nenhuma integralmente igual à candidata de agosto; `REPORT_AUDITORIA_V1` e `VIEW_SCORECARD_NATIVE` inexistentes. Resultado em `outputs/report-live-takeover-2026-09-10/publication-audit-2026-09-12.json`. Isso confirma que o Google não representa a candidata, não que cada célula existente esteja errada.
- Evidência anterior salva e relida: `runs/9bb55892-4b17-4f76-825a-0ac97c92b525/publications/audit-ed294dbf-5e05-4784-9801-27530cc6d0bb/before-write.json`, hash `1490db2ea09b3e19ad949a790be83d12d9f28058092805e21ec3538d2727ec4e`. Contém valores/fórmulas das abas afetadas, metadados Sheets e JSON Slides. Não é ainda um artefato de restauração automática certificado.
- Publisher local passa a salvar/reler evidência antes da primeira escrita e conferir todas as células antes de atualizar Slides. Endpoint canônico não promovido; essas escritas não foram executadas.
- Renderer local não considera mais suficiente contar páginas para reaproveitar uma geração: exige também os IDs de título, narrativa, rodapé e demais elementos previstos. Ainda requer QA visual e testes reais de interrupção/retomada do renderer.
- Google vivo permanece sem mutação nesta rodada. Publicação de agosto, restauração automática, QA PDF, main e deploy frontend permanecem pendentes.

## Release isolada, operador e recuperação — 12/09

- Trabalho ativo agora em `.codex-worktrees/report-live-production`, branch `codex/report-live-production`, a partir da main `2b4d4884bd4dd6627b2eae42658b82f57979b29a`. A branch anterior e suas alterações foram preservadas. Apenas Report Live e dependências diretas foram transportados; migrations ainda exigem reconciliação integral antes de promoção.
- Conta confirmada na interface autenticada: `pablo.castro@afinz.com.br`, ID `187810b7-9f30-4a0d-ba85-721aa000107b`. A chave `app_metadata.report_live_role=operator` foi aplicada e relida, preservando os outros metadados.
- Node 24.11.1, Deno 2.9.6, Supabase CLI 2.117.0. Configuração/lock Deno isolados em `supabase/functions/`; npm ci do frontend preservado. Workflow de Pages depende da validação reutilizável com testes, gate TypeScript, Deno e build.
- Main limpa e release apresentaram os mesmos 57 erros TypeScript. `typecheck` continua falhando; `typecheck:release` bloqueia novos diagnósticos usando a referência documentada em `docs/validation/`. Não se trata de TypeScript integralmente verde.
- 124 testes Vitest passaram após padronizar checkout SQL em LF; 24 testes Node Report Live passaram. Build passou (`index-0o9UrVxa.js`); três entradas Deno passaram. Workflows ainda não executados no GitHub.
- PDF local: exportação usa leitura/criação imutável, valida read-back e tolera perda de confirmação do upload sem gerar outro arquivo. Download histórico só retorna PDF de uma publicação preservada; não exporta o deck atual como se fosse um run antigo. Três novos testes cobrem repetição e falhas de Storage. Atualização de narrativa/gráficos passou a selecionar apenas a geração do run; teste impede atingir slides legados/outra geração.
- Candidate v5/v6 implantados com import map e autenticação própria, sem habilitar publicação. `inspect_recovery` é somente leitura do backup privado, restrito ao serviço. Inspeções pg_net 405/406 confirmaram hash original, 55 slides totais, 38 gerenciados, 250 formas e 16 gráficos vinculados nesses 38; 121 abas e 56 gráficos no Sheets. Os 17 restantes são modelos `v4sld_*` com placeholders não preenchidos, não slides autorais desconhecidos. A limpeza desses modelos precisa entrar na publicação recuperável; nenhum foi apagado.
- Backup novo passa a preservar `userEnteredValue` e demais dados de célula tipados, além de valores/fórmulas, para distinguir fórmula de texto literal iniciado em `=`. O backup antigo não contém `grid_sheets` e não deve ser promovido a manifesto de restauração completo.
- Migration aplicada `20260912194845_report_live_worker_lease_guards.sql`: leases de oito minutos, verificação de posse privada e watchdog respeitando jobs duráveis/reservas pausadas. Teste `test-report-live-worker-lease-guards.sql` passou com rollback, sem desabilitar triggers. Primeiro fixture de timestamp foi rejeitado pelo próprio teste porque um trigger renovava o heartbeat; corrigido usando run sintético inserido com data antiga.
- Ainda pendentes: adapter real de publicação por etapas, manifesto/execução de restauração independente, fechamento das rotas legadas, manutenção no GaaS, RLS das três tabelas de negócio, acionamento periódico, homologação Google/PDF e main/Pages. Canonical v38 e renderer v15 não foram promovidos. Não houve escrita nos documentos Google.
