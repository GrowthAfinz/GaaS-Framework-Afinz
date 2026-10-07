# Reconciliação integrada de packs e Framework

Implementação em 07/10/2026. A fila de reconciliação existente é a superfície principal: linhas compactas, expansão, tags, métricas, sugestões e revisão. A origem padrão é Comunicações dos packs; a fila anterior de disparos do dashboard continua acessível no mesmo componente por seletor de origem. A Biblioteca e o Histórico permanecem disponíveis.

## Evidência consultada

Banco mipiwxadnpwtcgfcedym: activities possui 54 colunas e 7.911 registros no levantamento. Todos possuem jornada; 6.327 possuem ordem, incluindo 1.079 zeros. Os 7.889 horários preenchidos são 00:00. Esses horários e ordem zero não sustentam inferência de horário/posição. O mesmo Activity Name da Copa aparece em quatro registros distribuídos entre jornadas e públicos distintos. Carrinho 21D Serasa de setembro está declarado como Proprietaria no Framework: essa divergência precisa permanecer visível.

Governança: GOVERNANÇA_LINKS_E_TEMPLATES (5).xlsx e skill gaas-template-reconciliation, incluindo contratos de famílias car21/carsab, variante srsa, segmento declarado no af_sub1 e distinção entre af_sub2 e índice da peça. O ID conserva a caixa. Padrão é Oferta nas execuções consultadas e pode coexistir com Promocional Copa/Vibe. Não fundir essas dimensões.

## Motor

communicationOrchestrationService consulta todas as colunas do universo relevante de activities, paginado em lotes, por nomes de atividade e jornadas dos packs, e os communication_slots existentes. Remove duplicação por activities.id. O filtro PostgREST da coluna "Activity name / Taxonomia" utiliza o identificador entre aspas; o QA rejeita a forma sem aspas, que falhou na primeira conferência de produção. Oferta e Promocional recebem rótulos canônicos na UI para evitar opções duplicadas por caixa/acentuação, preservando valores/fontes originais nas evidências. RLS do projeto é preservada. Nenhuma nova migration ou escrita operacional é necessária para calcular a fila.

communicationOrchestrator projeta dimensões com fonte por campo e valores alternativos: BU, parceiro/variante, origem cadastrada, canal, segmento, subgrupo, recência/cadência, família, Oferta, Promocional, Produto, etapa, perfil de crédito, safra e segunda oferta/promocional. N/A/vazio são ausência de evidência. O valor de apresentação não corrige silenciosamente a fonte; conflitos são destacados.

Métricas usam jornada normalizada + Activity Name exato + canal canônico. O período escolhido filtra datas locais de São Paulo. Sem período, o escopo é todo o histórico daquela identidade, explicitamente indicado. Soma de bases é volume acumulado, não pessoas únicas. Base desconhecida não vira zero. Propostas, aprovados, cartões e cliques mostram cobertura de preenchimento; não são atribuídos à versão do conteúdo do pack.

Execuções de contexto semelhante são consultáveis na expansão quando coincidem público, BU, segmento, canal e oferta/promocional conhecidos. São candidatos do universo consultado, não entram na base da ocorrência e não viram vínculo por inferência.

Os candidatos de catálogo reutilizam matchTemplate, com razões por dimensão e avisos adicionais de família/variante. O score é pontuação de aderência, não probabilidade. Vibe foi acrescentado ao vocabulário do motor existente; JOR_AQS e JOR_AQUISICAO são reconhecidos pelo parser de identidade. O golden set anterior permanece testado.

## Momento

Precedência de apresentação: curadoria manual do slot jornada/atividade/canal; posição declarada no Activity Name; ordem positiva consistente no Framework; índice do ID como sugestão de baixa confiança. Ordinais divergentes, índice do template, af_sub2 e esperas ficam separados e explicados. disp21 em jornada de recência 21D é ambíguo e não vira ordinal 21.

Não se infere calendário do nome da safra, posição pelo número de execuções, horário por 00:00 ou ordem entre ramos paralelos. As esperas do pack são exibidas, mas os packs já persistidos não preservam toda a trilha de nós de envio necessária para comprovar uma ordem global. Percentuais de probabilidade continuam fora da entrega: precisam de exemplos rotulados e validação/calibração. A curadoria manual reutiliza communication_slots; é uma decisão operacional no mesmo escopo, não prova de envio ou vigência de conteúdo.

## Interface e aplicação

Frente/BU e segmento são escolhidos antes de abrir a fila; todos podem ser escolhidos explicitamente. Filtros adicionais incluem parceiro, canal, subgrupo, recência, Promocional, Oferta, família, semana, disparo, estado e busca. Ordenadores de base, execuções, data, ordem e prioridade permitem inverter direção; ausência de métricas fica ao final. Ordem agrupa por jornada e ordena os momentos dentro dela. Paginação de 25 linhas limita a altura da fila.

A linha prioriza ID e tags; Activity Name e jornada são evidência secundária. Prévia do pack WhatsApp/SMS abre em modal central; imagens existentes do catálogo podem suprir ausência de prévia configurada, com origem explícita. Sem recurso renderizável, a ausência é indicada. HTML/AMPscript dinâmico do SFMC não é executado. Há foco contido, Escape, retorno de foco e bloqueio do scroll nos modais de prévia, revisão e momento.

Sugestões alternativas abrem a revisão com o ID selecionado, sem aprovar. IDs seguem editáveis. Lote exige propostas prontas, grupo homogêneo e evidência carregada; conflitos novos do Framework pedem revisão individual. A revisão explícita anterior continua registrada; evidências conflitantes não desaparecem. Mudança de filtro/recorte/revisão invalida seleção e simulação.

Aplicação mantém os RPCs existentes: revisão otimista, simulação, fingerprint, aprovação idempotente, versão atual explícita e vínculo apenas aos IDs históricos selecionados dentro de período confirmado. O filtro de métricas não é evidência automática para esse vínculo. Não foram aprovadas comunicações de produção pelo agente.

## Validação

Testes de domínio cobrem conflitos Serasa/Proprietaria, família car21/carsab, Oferta/Promocional separados, datas São Paulo, métricas desconhecidas, escopo por jornada/canal, curadoria manual, índice/recência e regressão do motor anterior. QA isolado de navegador verifica filtros/ordenação, métricas 80→66 no recorte de um dia, exclusão de outra jornada, prévia ampliável, revisão, persistência, simulação, aplicação, rejeição, opt-outs e mobile. Os testes SQL existentes protegem aplicação e concorrência. Produção é verificada sem aprovar ou editar conteúdo.
