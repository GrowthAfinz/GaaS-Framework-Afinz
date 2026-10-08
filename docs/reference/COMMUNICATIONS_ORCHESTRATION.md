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
