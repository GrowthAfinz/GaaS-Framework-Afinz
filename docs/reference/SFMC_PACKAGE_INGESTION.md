# Pacotes SFMC: ingestão e prévias

Release de 07/10/2026. Escopo solicitado: ingestão dos dados e renderização na aba Comunicações; Wiki, reformulação da Fila/Auditoria e ranking de performance ficam fora desta release.

## Como operar

1. Em Comunicações → Cadastro e templates, clique em **Importar pacote SFMC**.
2. Informe a BU/conta de origem e selecione o ZIP do Package Manager.
3. A leitura ocorre em Worker no navegador. O ZIP não é enviado nem armazenado: apenas mensagens, estrutura necessária e hash são gravados na área de revisão.
4. Revise as mensagens. Opt-out fica excluído. Um ID exato é sugerido preservando caixa; título único considera o canal. Títulos ambíguos e mensagens sem chave exigem escolha explícita de ID.
5. Selecione as mensagens que deseja aplicar. Marque **Escolher este texto como versão atual** somente na ocorrência cuja variante deve alimentar a prévia.
6. Opcionalmente confirme período e evidência e selecione os registros da mesma jornada/canal. Outros contextos não podem ser vinculados por este importador.
7. Clique em **Simular seleção**, confira as contagens e depois **Aprovar e aplicar seleção**.
8. Na subaba **Templates**, consulte **Conteúdos importados do SFMC**, alterne versões e escolha a atual. Na Performance, o texto atual aparece se não houver peça disponível.

É possível importar somente conteúdo, sem alterar disparos históricos. Importações já gravadas podem ser retomadas no seletor (últimas 50). Seleções ainda não aplicadas não ficam persistidas: fechar e retomar conserva as mensagens e decisões já aplicadas/rejeitadas, mas exige nova seleção e simulação.

## Contrato de dados e segurança

- Identidade: template_id mantém a caixa; nome de Activity é aparado; jornada normaliza trim, uppercase e alias JOR_AQS_/JOR_AQUISICAO_.
- Temporalidade: datas de negócio em America/Sao_Paulo. A exportação é evidência de configuração, não prova da versão historicamente enviada.
- Criação de template precede FKs; o backend atualiza apenas os activities.id explicitamente revisados e sem vínculo anterior. Um vínculo já igual é no-op; diferente bloqueia.
- Slots existentes e seu momento manual são preservados; novos slots representam uso configurado. Não são certificados como disparos reais.
- Conteúdo é versionado por hash do JSON de renderização. Links e atribuição permanecem na ocorrência; rastreamento não muda o hash visual.
- Troca da atual é explícita e compara o ID atual esperado. Mais de uma escolha para o mesmo template no lote é recusada.
- Simulação gera fingerprint dos alvos. Mudança entre simulação e aplicação bloqueia a transação.
- package_sha256 + origem + usuário evita repetir a importação. Uma UUID por aplicação permite repetir a requisição sem duplicar dados.
- Aplicações são transacionais e preservam ator, decisões, antes/depois e observações de origem.
- Novas tabelas possuem RLS e SELECT autenticado, sem escrita direta para authenticated/anon.
- Wrappers públicos SECURITY INVOKER chamam funções privadas em gaas_sfmc_private. SECURITY DEFINER privado é necessário para a fronteira de escrita sem grants diretos nas tabelas novas; todas as mutações validam auth.uid e usam search_path explícito. Aplicar/rejeitar revisão exige o autor da importação; escolher versão atual é colaborativo e auditado.
- Fluxos antigos de vínculo passam a preencher somente template_id nulo, protegendo vínculos existentes.
- Os 57 erros históricos do TypeScript continuam registrados no gate; nenhuma nova dívida é aceita.
- Nenhuma escrita no SFMC, execução de AMPscript, chamada AppsFlyer ou alteração de fórmulas de métricas.

## Tabelas e RPCs

Tabelas: sfmc_package_imports, sfmc_package_messages, communication_template_contents, communication_template_content_observations, sfmc_package_application_runs e sfmc_package_application_changes.

RPCs: stage_sfmc_package, sfmc_package_candidates, preview_sfmc_package_apply, apply_sfmc_package_import, reject_sfmc_package_messages e select_communication_template_content.

Migration: supabase/migrations/20261007203329_sfmc_package_ingestion.sql. É aditiva, idempotente e precisa ser aplicada no Supabase antes do deploy do frontend.

## Renderização

MessagePreview exibe WhatsApp/SMS como nós React, sem HTML injetado: negrito/itálico/riscado, quebras, banner, rodapé, botões e exemplos de parâmetros. Banner que falha não impede leitura do texto. Mostrar campos alterna exemplos e referências.

SMS conta alfabeto GSM-7, extensão de dois septetos e Unicode com unidades UTF-16. O total é uma estimativa do exemplo, não do envio personalizado.

E-mails dinâmicos preservam estrutura/asset, mas não recebem cópia inventada: o conteúdo depende do briefing. Push sem texto completo conserva estado de indisponibilidade.

A peça cadastrada continua prioritária na Performance; erro do arquivo ou ausência permite fallback para conteúdo atual. Biblioteca dá acesso ao texto mesmo quando o catálogo já tem arquivo.

## Validação reproduzível

- npm test: paridade de fixtures derivadas dos três ZIPs (18/93/2 mensagens), grafo convergente, URLs, exclusões e GSM.
- npm run test:sfmc-package-sql: PostgreSQL isolado via PGlite. Migration repetida, FK, idempotência, conflito, período/jornada, stale review, preservação de atual e slots manuais, RLS/grants.
- npm run typecheck:release e npm run build.
- npm run dev -- --host 127.0.0.1 --port 3017 --open false
- node scripts/qa-sfmc-package.mjs: navegador isolado com RPCs em banco de teste; upload → Worker → staging → simulação → aplicação. Usa fixture de carrinho; SFMC_QA_ZIP permite usar o original local. Nenhuma requisição a produção.
- Evidências visuais locais geradas em artifacts/sfmc-package-qa/.

Os ZIPs versionados em fixtures foram reduzidos a entidades necessárias e não contêm registros de DE. Arquivos .expected.json vieram do extract_messages.py da skill sfmc-jornadas-pacote.

## Limites deste corte

Não há reversão automatizada pela interface; a trilha antes/depois permite preparar compensação revisada. Não há confirmação temporal automática, integração com Wiki nem substituição da evidência manual pelo parser. Não deduplicar pessoas nem interpretar preview como prova de resultado causal.



## Evolução Cadastro e Templates V2 (07/10/2026)
A revisão deixou o modal de upload e passou à fila compartilhada Propostas. IDs/contexto/revisão agora são persistidos; operador pode editar, aprovar e rejeitar. O modal recebe o arquivo e retorna à fila. Consulte [contrato da fila e publicação de análise](COMMUNICATIONS_PROPOSAL_INBOX.md) para o estado atual e a separação produtor/reviewer. Esta atualização prevalece sobre descrições anteriores da revisão em estado local.


## Atualização 19/10/2026 — performance por atividade e vínculo automático

Contrato implementado nesta release:

- Performance → Todos é o recorte inicial. A unidade é BU de negócio + jornada normalizada + Activity Name exata + canal; cada activities.id entra uma vez após a projeção de revisões válidas. Atividades e execuções têm contagens separadas.
- Registros sem template preservam KPIs e evolução. A ação Vincular no Cadastro de templates leva jornada, canal, Activity Name e IDs pendentes; a volta preserva o recorte da Performance.
- O leitor do Fluxo mostra resultados da atividade mesmo com template_id nulo. O painel da jornada carrega todas as páginas antes de apresentar totais. Fluxo e Todos compartilham ExecutionResults: base total/acionável, abertura, clique, propostas, aprovados, cartões, custo, CAC e evolução diária (barras de volume e linha de taxa).
- Taxas e CAC exigem cobertura completa dos componentes; zero medido é distinto de ausência. Não se infere passagem de pessoas por ramos ou vigência da versão apenas a partir de resultados agregados.
- A identidade do template é separada do momento operacional e do dia relativo do grafo. Reuso de D02 no quarto toque não renomeia a peça nem muda a posição da atividade.
- A entrada de activities, o término da ingestão de um pack e a aprovação de um conteúdo/cadastro conhecido tentam atribuição automática por jornada + Activity Name + canal exatos. Só um ID comprovado no pack/cadastro aprovado, sem conflito e sem divergência histórica, é elegível. Nomes parecidos, títulos, ordem e score não autorizam vínculo automático.
- Templates novos permanecem em aprovação. Nenhum vínculo já preenchido é substituído. IDs diferentes para a mesma atividade aparecem como notificação na Performance e em Configurações → Packs SFMC; novas atribuições ficam suspensas.
- communication_auto_links conserva a execução de origem, regra, template e importação. RLS permite consulta autenticada, sem escrita direta. Funções de escrita ficam no schema privado.
- Configurações → Packs SFMC mostra ingestões, snapshots/versões por jornada, pendências de conteúdo e notificações. A data de recebimento do pack é diferente da criação do snapshot e da última execução. A origem da conta SFMC é Afinz ou Plurix; B2C/B2B2C são dimensões de negócio.
- Importações legadas sem conta SFMC declarada conservam source_scope e não ganham uma BU inferida. Nas próximas cargas por agente, usar --escopo Afinz ou --escopo Plurix; o parser e stage_core continuam compartilhados.
- Histórico de ingestão representa pacotes efetivamente recebidos no banco. Falhas de leitura antes do staging continuam sendo apresentadas pelo importador e não são inventadas como ingestões concluídas.

Validação: scripts/test-content-performance-integration.mjs (PGlite), src/utils/activityPerformance.test.ts, journeyFlow.test.ts, scripts/qa-activity-performance.mjs e scripts/test-journey-progressive-ui.mjs. As migrações são 20261019141419_content_performance_integration.sql e 20261019142130_approved_proposal_auto_attribution.sql. Aprovar o ID de uma mensagem sem af_sub3 também resolve seus usos exatos existentes, sem uma segunda confirmação.

Conferência em produção após a migração: 8.150 registros preservados; hash de todos os campos de origem/métricas inalterado (exceto template_id e updated_at); nenhum dos 1.169 vínculos preexistentes alterado; 29 vínculos automáticos novos. Outubro: 227 execuções e 685 cartões mantidos, vínculos passaram de 16 para 35. Na B2C SEM1, as duas execuções de 05 e 06/10 passaram a b2c_email_vibe_bsp_S1D01.
