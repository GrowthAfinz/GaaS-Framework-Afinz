# Reconciliação integrada de packs e Framework

Implementação em 07/10/2026. A fila de reconciliação existente é a superfície principal: linhas compactas, expansão, tags, métricas, sugestões e revisão. A origem padrão é Comunicações dos packs; a fila anterior de disparos do dashboard continua acessível no mesmo componente por seletor de origem. A Biblioteca e o Histórico permanecem disponíveis.

## Evidência consultada

Banco mipiwxadnpwtcgfcedym: activities possui 54 colunas e 7.911 registros no levantamento. Todos possuem jornada; 6.327 possuem ordem, incluindo 1.079 zeros. Os 7.889 horários preenchidos são 00:00. Esses horários e ordem zero não sustentam inferência de horário/posição. O mesmo Activity Name da Copa aparece em quatro registros distribuídos entre jornadas e públicos distintos. Carrinho 21D Serasa de setembro está declarado como Proprietaria no Framework: essa divergência precisa permanecer visível.

Governança: GOVERNANÇA_LINKS_E_TEMPLATES (5).xlsx e skill gaas-template-reconciliation, incluindo contratos de famílias car21/carsab, variante srsa, segmento declarado no af_sub1 e distinção entre af_sub2 e índice da peça. O ID conserva a caixa. Padrão é Oferta nas execuções consultadas e pode coexistir com Promocional Copa/Vibe. Não fundir essas dimensões.

## Motor

communicationOrchestrationService consulta todas as colunas do universo relevante de activities, paginado em lotes, por nomes de atividade e jornadas dos packs, e os communication_slots existentes. Remove duplicação por activities.id. O filtro PostgREST da coluna "Activity name / Taxonomia" utiliza o identificador entre aspas; o QA rejeita a forma sem aspas, que falhou na primeira conferência de produção. Oferta e Promocional recebem rótulos canônicos na UI para evitar opções duplicadas por caixa/acentuação, preservando valores/fontes originais nas evidências. RLS do projeto é preservada. A migration communication_execution_review acrescenta decisões auditadas de consolidação sem alterar activities. A projeção só omite a cópia de um par aprovado enquanto todos os campos continuam iguais ao snapshot; revisão desfeita, registro alterado ou terceiro membro invalida a consolidação.

communicationOrchestrator projeta dimensões com fonte por campo e valores alternativos: BU, parceiro, origem cadastrada, canal, segmento, subgrupo, Oferta, Promocional, Produto, etapa, perfil de crédito, safra e segunda oferta/promocional. N/A/vazio são ausência de evidência. O valor de apresentação não corrige silenciosamente a fonte; conflitos são destacados.

Métricas usam jornada normalizada + Activity Name exato + canal canônico. O único PeriodContext global filtra datas locais de São Paulo; não há intervalo independente na fila. O mesmo PeriodSelector do cabeçalho aparece junto à busca; abrir/aplicar ali modifica o contexto global, sem criar outro recorte. Configurações pendentes do acervo continuam visíveis mesmo sem execução no período, com zero execuções e volumes desconhecidos. Soma de bases é volume acumulado, não pessoas únicas. Base desconhecida não vira zero. Propostas, aprovados, cartões e cliques mostram cobertura de preenchimento; não são atribuídos à versão do conteúdo do pack.

Execuções de contexto semelhante são consultáveis na expansão quando coincidem público, BU, segmento, canal e oferta/promocional conhecidos. São candidatos do universo consultado, não entram na base da ocorrência e não viram vínculo por inferência.

Os candidatos de catálogo reutilizam matchTemplate, com razões por dimensão e avisos de incompatibilidade de subgrupo/parceiro. O score é pontuação de aderência, não probabilidade. Vibe foi acrescentado ao vocabulário do motor existente; JOR_AQS e JOR_AQUISICAO são reconhecidos pelo parser de identidade. O golden set anterior permanece testado.

## Momento

Precedência: curadoria manual; gramática do ID exibido (original ou proposto) (DispDn = disparo; SxDy = semana/dia; Negados Dn = toque); Activity Name; ordem consistente válida; índice não contextualizado de baixa confiança. Ordens 21/31 em régua 21D e números YYYYMMDD não são ordinais. Disparo 2 versus tracking d1 gera divergência explícita. Ordinais divergentes, índice do template, af_sub2 e esperas ficam separados e explicados. disp21 em jornada de recência 21D é ambíguo e não vira ordinal 21.

Não se infere calendário do nome da safra, posição pelo número de execuções, horário por 00:00 ou ordem entre ramos paralelos. As esperas do pack são exibidas, mas os packs já persistidos não preservam toda a trilha de nós de envio necessária para comprovar uma ordem global. Percentuais de probabilidade continuam fora da entrega: precisam de exemplos rotulados e validação/calibração. A curadoria manual reutiliza communication_slots; é uma decisão operacional no mesmo escopo, não prova de envio ou vigência de conteúdo.

## Interface e aplicação

Frente/BU e segmento são escolhidos antes de abrir a fila; todos podem ser escolhidos explicitamente. Filtros adicionais incluem parceiro, canal, subgrupo, campanha, Oferta, semana, dia/disparo, estado e busca. Tags mostram valores diretamente; Família e Recência não ocupam a linha. activities lidera a classificação. Abandonados é o segmento; Subgrupos Abandonados D-21 A D>7 e Abandonados D-7 aparecem como D-21 A D>7 e D-7, preservando a fonte. Diario permanece Diário; nome da jornada não o sobrescreve. O ID observado/proposto e os IDs já vinculados são evidências de compatibilidade, nunca correção silenciosa da tabela. Ordenadores de base, execuções, data, ordem e prioridade permitem inverter direção; ausência de métricas fica ao final. Ordem compara semana/índice diretamente, sem o nome da jornada interferir no ordenador. Paginação de 25 linhas limita a altura da fila.

A origem dos packs tem três trilhas: links com c/af_sub1/af_sub2/af_sub3, comunicações com aviso de parâmetros ausentes e nós técnicos/opt-outs. Colunas de activities lideram a classificação; af_sub1, c e IDs vinculados conferem compatibilidade; o ID proposto orienta a variante e o momento exibidos; o original permanece como evidência, com divergências explícitas e confiança reduzida para correções ainda propostas. Presença de ID não elimina conflitos. A linha prioriza ID e tags; Activity Name e jornada são evidência secundária. Prévia do pack WhatsApp/SMS abre em modal central; imagens existentes do catálogo podem suprir ausência de prévia configurada, com origem explícita. Sem recurso renderizável, a ausência é indicada. HTML/AMPscript dinâmico do SFMC não é executado. Há foco contido, Escape, retorno de foco e bloqueio do scroll nos modais de prévia, revisão e momento.

Sugestões alternativas abrem a revisão com o ID selecionado, sem aprovar. IDs seguem editáveis. Lote exige propostas prontas, grupo homogêneo e evidência carregada; conflitos novos do Framework pedem revisão individual. A revisão explícita anterior continua registrada; evidências conflitantes não desaparecem. Mudança de filtro/recorte/revisão/evidência invalida seleção e simulação, incluindo a alternância acervo/período. A seleção efetiva sempre pertence às linhas visíveis. O operador escolhe o grupo pronto em um seletor com quantidade, público, canal e origem. Atualização explícita recarrega activities/consolidações mesmo se a revisão da proposta não mudou; foco não recarrega a fila.

Aplicação mantém os RPCs existentes: revisão otimista, simulação, fingerprint, aprovação idempotente, versão atual explícita e vínculo apenas aos IDs históricos selecionados dentro de período confirmado. O filtro de métricas não é evidência automática para esse vínculo. Não foram aprovadas comunicações de produção pelo agente.

## Validação

Testes de domínio cobrem conflitos Serasa/Proprietaria, subgrupos car21/carsab, Oferta/Promocional separados, datas São Paulo, métricas desconhecidas, escopo por jornada/canal, curadoria manual, índice/recência e regressão do motor anterior. QA isolado de navegador verifica filtros/ordenação, métricas 80→66 no recorte de um dia, exclusão de outra jornada, prévia ampliável, revisão, persistência, simulação, aplicação, rejeição, opt-outs e mobile. Os testes SQL existentes protegem aplicação e concorrência. Produção é verificada sem aprovar ou editar conteúdo.

## Consolidação de execuções

Painel recolhido no mesmo período global: compara todas as colunas e propõe apenas pares idênticos (exceto ID/datas de cadastro) ou diferentes somente em template vazio/preenchido. Preserva o membro enriquecido. Custos, produtos, parceiros ou resultados divergentes impedem essa aprovação. A justificativa e o ator ficam em eventos append-only protegidos por RLS; funções públicas invoker chamam o gateway privado com sessão validada. Contagem inicial auditada: 166 grupos no histórico, 18 candidatos compatíveis. Nenhuma aprovação foi feita pelo agente.

Essa projeção corrige somente métricas da fila de packs. Não certifica JobID SFMC, não modifica dashboards externos, não apaga registros nem aplica UNIQUE por nome/data. O staging de ZIP já é idempotente por hash; reimportações do Framework ficam para decisão contextual.

## Correção de classificação — 08/10/2026

DispD1_21d conserva delimitadores: Disparo 1 e subgrupo D-21 A D>7. Vibe compara com Oferta; Copa/Upgrade com Promocional. Vibe + Promocional Padrão é concordância, não conflito. No contexto carrinho, Institucional é comparável ao público Proprietaria, mantendo as duas fontes nos detalhes. O motor não cria família/recência pela jornada. Perfil, produto, etapa, safra, oferta/promocional secundários ficam na expansão. Resultados acrescentam emissões, abertura e custo registrado com cobertura; não calculam média de taxas ou CAC.

Links incompletos continuam fora dos lotes. Após revisão humana com motivo obrigatório, uma única comunicação pode ser simulada e aplicada pelos RPCs existentes; opt-outs permanecem bloqueados. Não se preenche o link original nem se infere vínculo histórico. Propostas e conflitos persistidos de análises anteriores permanecem registrados; esta release corrige a projeção e não reaprova conteúdo de produção.


## Integração pack × execução e reuso (08/10/2026)

A fila de Disparos sem template consulta propostas e mensagens dos packs, catálogo e histórico completo de execuções vinculadas. O agrupamento agora preserva jornada normalizada, Activity Name, canal e dimensões do contexto; nomes iguais em jornadas diferentes não são fundidos.

Prioridade: correspondência exata de jornada + atividade + canal no pack; depois candidatos de reuso histórico por BU, parceiro, segmento, subgrupo, Oferta e Promocional. O histórico é sugestão revisável, não prova de versão enviada. Índice de peça e momento da atividade ficam separados; o ID real não é reescrito para simular outro momento. Conteúdos diferentes para um ID, IDs concorrentes, links incompletos e propostas não revisadas divergentes do observado impedem classificação automática como forte. Score não é probabilidade calibrada.

Regra contextual confirmada no Vault Upgrade.md: Activity Name ANC com menor, e segmento Aprovados_nao_convertidos em activities, permite peça de Repescagem/Negados. O segmento da execução continua ANC. Maior não recebe essa exceção. O tracking af_sub1 original continua visível; campanha upgrade no c não é automaticamente Promocional Upgrade. A divergência esperada ANC × Negados deixa de ser conflito do motor, mantendo as fontes e a auditoria anterior.

A aprovação em massa considera apenas as linhas visíveis pelos filtros. Prévia visual do pack pode ser ampliada na própria linha. Confirmação mostra período, jornada, canal, template e número de execuções e exige evidência do operador. Atualização dos dados cancela seleção pendente. Duplicidades já aprovadas usam a projeção existente; mudança da fonte invalida essa decisão.

O RPC link_communication_executions recebe snapshots completos e IDs explícitos. Revalida sessão, cadastro/canal, período local São Paulo, ausência de vínculo e snapshots sob bloqueio transacional. Rejeita concorrência e grava auditoria append-only em communication_execution_links. Não altera conteúdo, versão atual ou registros fora da seleção. Cada grupo é transacional; um lote de vários grupos pode concluir os primeiros antes de falhar em um posterior, e a fila recarrega após erro. A auditoria exibe também esses vínculos. O legado linkActivityToTemplate está bloqueado; a ação antiga do gerenciador de assets aponta para usar a fila no período.

Validação: testes de reuso maior/menor, IDs e versões concorrentes, contexto e momento; contratos SQL de escopo, concorrência, permissões e atomicidade; QA browser dos filtros, visual ampliado, confirmação e preservação de outra jornada. Nenhuma execução de produção é vinculada pelo deploy.

### Prévia pelo ID original (2026-10-08)
As duas filas resolvem a peça visual pelo ID original observado no link, com caixa preservada e canal compatível. Na ausência de arquivo original, podem mostrar o arquivo do ID proposto, explicitamente como candidato. A comunicação WhatsApp/SMS configurada no pack continua prioritária. A resolução visual não altera IDs, versões atuais ou vínculos. Quando nenhum arquivo existe, a miniatura informa a ausência e seu tooltip identifica o ID original; não busca peças de outros momentos. Exemplo verificado: bb_email_vibe_bsp_S3D03 e bb_email_vibe_crm_S3D03 não estavam cadastrados no catálogo.

### Nome da peça e ausência de prévia
O nome original do Content Builder permanece como asset_name no payload persistido de cada ocorrência SFMC, preservando a proveniência sem substituir o template_id. As duas filas exibem esse nome; o modal visual também. Na ausência de peça visual, um ID observado é mostrado como ID identificado · sem prévia. O tooltip distingue a indisponibilidade de HTML para a prévia nesta importação da ausência de ID.

### Performance: prévias integradas
A Performance renderiza a versão atual escolhida de WhatsApp, SMS ou Push, quando há corpo disponível e canal compatível. Sem essa versão, usa o arquivo do catálogo e identifica sua origem. E-mail distingue HTML de imagem. A tabela usa miniaturas reais. Métricas continuam limitadas às execuções vinculadas no período; aprovação isolada não gera performance. A peça atual não certifica a versão enviada historicamente.

## Performance por conteúdo: três visões (08/10/2026)

A Performance deixou de consultar só `activities` com `template_id` preenchido. Ela consome o mesmo motor da fila (`useReconciliation`, via `useContentPerformance`): activities do período com e sem template, paginadas, com a projeção de duplicidades revisadas, evidência de pack/histórico, catálogo, propostas e histórico vinculado. Não há algoritmo concorrente de sugestão.

### Unidades
- **Com template vinculado:** template com execução vinculada no período. Métricas somam essas execuções; não certificam qual versão do conteúdo foi enviada. Execução vinculada sem nenhum resultado registrado (abertura, clique, proposta, cartão) entra na contagem, mas fica sem score e sem diagnóstico; galeria e tabela mostram "—".
- **Disparos sem template:** grupo `executionContextKey` (jornada normalizada, Activity Name, canal, BU, parceiro, segmento, subgrupo, Oferta, Promocional). Mesmo Activity Name em outra jornada, canal ou data é outro grupo. Métricas somam só valores preenchidos e mostram a cobertura (k/n); ausente é "—", nunca zero.
- **Comunicações aprovadas:** identidade do template.

### Aprovação (contrato atual, sem migração)
Aprovada = versão aprovada na revisão do pack (`communication_template_contents`, criada só por `review_communication_proposals`/apply; o template nasce `draft`) **ou** cadastro com status `active`/`paused` no catálogo. Proposta `ready`/`review` não é aprovação; `applied` não comprova envio. `draft` sem versão aprovada é rascunho (ex.: pré-cadastro da governança). `superseded`/`archived` são inativos. Legados `active` aparecem como "Cadastro ativo no catálogo", sem aprovação histórica inferida. "Incluir rascunhos" age só na biblioteca, com contagem; desabilitado quando não há rascunho/inativo.

Snapshot de produção (08/10): 213 templates; 156 ativos (5 deles com versão de pack aprovada, nenhuma marcada como atual), 57 rascunhos. Agosto/2026: 21 templates com 61 execuções vinculadas; 748 execuções sem template em ~152 grupos.

### Vínculo
Revisão individual e lote usam só `linkReviewedExecutions` → RPC `link_communication_executions` (IDs explícitos, snapshot completo, período São Paulo, canal, sem sobrescrever, auditoria). A revisão mostra IDs, jornada, canal, período, template escolhido, evidências, momento do disparo × momento da peça; permite trocar o template (busca no catálogo do mesmo canal, ranqueada por `rankTemplate`); exige caixa de confirmação e evidência escrita. Não escolhe nem altera versão atual de conteúdo. O modal de sugestões da fila também passou a exigir confirmação e evidência (antes usava texto fixo).

Lote (`utils/executionLinkEligibility.ts`, regra única para fila e Performance): candidato único, sugestão forte, sem conflitos/divergências, sem conflito de momento, template no catálogo, no filtro global e no mesmo canal, execução sem vínculo e contexto completo (jornada, Activity Name, canal, BU, parceiro, segmento, data). Seleção efetiva = selecionados ∩ visíveis após filtros ∩ elegíveis. Um RPC por grupo; o resultado lista sucesso e falha por grupo e recarrega as três visões.

### Prévias
`resolvePreview` (utils/communicationVisualResolution.ts) é a regra única: comunicação do pack configurada neste uso → versão atual escolhida do template (WhatsApp/SMS/Push com corpo e canal compatível) → catálogo (HTML de e-mail ou imagem) → indisponível com motivo (e-mail sem HTML/arquivo; versões importadas sem atual escolhida; canal divergente). ID observado tem precedência; ID sugerido/proposto aparece como "candidato". IDs com caixa exata. `ContentPreview` distingue carregando, falha de acesso e ausência; miniatura abre modal central com Escape, foco preso e retorno de foco; HTML em iframe sem `allow-scripts`. Versões vêm de um índice carregado uma vez (`services/templateContentIndex.ts`) e URLs assinadas ficam em cache: nenhuma consulta por card. `CommunicationVisual` (filas) usa o mesmo componente.

### Período e filtros
Limites `[início 00:00, fim+1 00:00)` no offset de São Paulo (`utils/saoPauloPeriod.ts`) na fila, na Performance e no período anterior; consultas paginadas de 500. Filtros de frente, parceiro, canal, segmento, subgrupo, oferta, promocional, momento e busca (ID, nome da peça, jornada, Activity Name) valem nas três visões e são preservados ao trocar de escopo. Ordenações por escopo; valores ausentes ficam ao final nos dois sentidos; na biblioteca, peças sem execução não recebem posição de ranking. Listas paginadas em 24.

### Validação
Vitest 53 arquivos/354 testes (novos: `contentPerformanceModel.test.ts`, `saoPauloPeriod.test.ts`); contratos SQL `npm run test:sfmc-package-sql` 17/17; `typecheck:release` sem erro novo; build ok. QA isolado `scripts/qa-content-performance.mjs` (PGlite + migration real do RPC; nenhuma chamada a produção): contagens, modal/Escape/foco, lote limitado por filtro, vínculo movendo execuções da visão 2 para a 1, outra jornada e outubro intactos, revisão individual com troca de template, recusa de sobrescrita, rascunhos, HTML sem script, Visão Geral isolada, último dia em São Paulo e largura 390px sem overflow. Os QAs anteriores (`qa-communications-proposals.mjs`, `qa-scoped-communication-links.mjs`) foram atualizados para os novos rótulos acessíveis e para o requisito de contexto completo no lote.

