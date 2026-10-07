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
