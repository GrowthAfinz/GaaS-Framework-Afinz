# Fluxo de jornadas V2 — plano executável de implementação

Data: 08/10/2026. Estado: **núcleo V2 implementado; validação e publicação nesta rodada**. Integração com memória de Growth permanece etapa posterior. Contrato implementado e limites em `docs/tabs/fluxo-jornadas.md`.

Objetivo: fazer o operador encontrar uma jornada, explorar seus caminhos e ler uma comunicação rapidamente, com resultados e reuso governados, sem carregar todo o histórico ou inflar o canvas.

## 1. Decisões consolidadas

- Nome: Fluxo de jornadas, em Comunicações; identidade visual e gramática SFMC preservadas.
- Entrada progressiva: contexto de público/parceiro → segmento → jornada → versão.
- Nenhuma jornada aberta automaticamente na primeira visita. Última seleção pode ser restaurada se ainda existir e estiver autorizada.
- Uma jornada pode aparecer em vários contextos. Filtrar uma comunicação destaca seu caminho; não apaga conexões nem reescreve o grafo.
- Um único leitor de comunicação, com apresentação compacta e ampliada. Ampliar não abre outro modal.
- Enquadrar fluxo e Tela cheia são controles distintos.
- PNG e PDF vêm de uma cena de exportação, não de uma captura do viewport com barras de rolagem.
- Estrutura, conteúdo, métricas, reuso e aprendizados são carregados em momentos diferentes.
- Manter React/TypeScript, layout próprio de árvore/DAG e SVG. Não introduzir React Flow, elkjs ou dagre.
- Reaproveitar regras e contratos existentes; não criar outro motor de classificação, vinculação ou cálculo.
- Flow permanece leitura. Aprovação/rejeição/edição de vínculos ocorre na fila existente.
- As regras de reuso, cobertura, proveniência e período fazem parte da entrega; integração contextual com Growth fica explicitamente separada do primeiro lançamento.

## 2. Diagnóstico do código atual

| Local | Comportamento observado | Consequência |
|---|---|---|
| `JourneyFlowView.tsx` | Inicializa `useReconciliation` e índice geral de conteúdos | Pede catálogo, propostas, mensagens, histórico e revisões sem seleção de comunicação |
| `journeyFlowService.ts` | `readJourneySnapshot` usa `select('*')` | Baixa grafo e todas as mensagens, incluindo HTML e imagens base64 |
| `MessagePreview.tsx` | Miniatura de e-mail cria iframe HTML | Mantém documentos completos para peças pequenas/offscreen |
| `JourneyFlowView.tsx` | `fit` usa somente largura e limita escala a 1 | Não enquadra a altura nem faz fullscreen |
| Leitor + `ChannelPreview` | Várias áreas de overflow; ampliar abre `PreviewModal` | Rolagens aninhadas e dois mecanismos de leitura |
| View monolítica | Estado de seleção, zoom, busca e leitor no mesmo componente | Precisa de medição e isolamento para reduzir trabalho de render |
| `useTemplateContentIndex` | Evita consulta por card, mas lê todas as versões | Bom cache existente, porém amplo demais para o fluxo sob demanda |
| Projeção de duplicidades | Exige todos os membros e snapshots completos | Reduzir dados sem respeitar o contrato altera contagem e segurança |

Isso identifica candidatos à lentidão, não substitui perfil de desempenho em produção. Medir antes de mudar e repetir depois com a mesma jornada/dispositivo.

## 3. Regras de dados que não podem mudar

1. ID preserva caixa. ID observado no link, ID proposto e template efetivamente vinculado têm papéis distintos.
2. Estrutura é snapshot do pack. Período global filtra resultados, não comprova versão enviada nem traversal de contatos pelos ramos.
3. Ocorrência: snapshot + referência/versão de jornada + activity_key. Activity Name sozinho não identifica um nó histórico.
4. Execução: ID específico de `activities`, preservando data, canal e jornada; nenhum vínculo novo por leitura.
5. Reuso de asset/conteúdo não elimina ocorrência nem implica duplicidade de execução.
6. Dois nós com mesmo Activity Name/canal não recebem automaticamente os mesmos resultados como se cada um tivesse enviado a base.
7. Dimensões e subgrupos usam regras oficiais já existentes. Ausência é explícita. Não assumir Institucional, Diário, 21D ou Sábado por fallback.
8. Disparo, dia e semana são dimensões distintas. `Dispd1_21d` não vira Disparo 121 nem Dia 21.
9. Dias nominais somam esperas fixas; Einstein é janela adicional; esperas variáveis e ciclos mantêm os avisos atuais.
10. Métricas ausentes ficam nulas; resultados sem execução não viram zero; cobertura parcial permanece visível.
11. Não somar taxas nem médias de percentuais. Usar as definições de numerador/denominador existentes.
12. Opt-outs/atividades operacionais permanecem na estrutura; não contam automaticamente como template promocional elegível.
13. Snapshot, curadoria e atividade executada têm proveniência separada; renderização não aprova conteúdo nem seleciona versão atual.

Reutilizar: `parsePackage.ts`, `layoutJourney`, `occurrenceExecutions`, `resolvePreview`, `TemplateIdChips`, `facetsFromRecords`, `projectExecutions`, `executionMetrics`, `sumCovered` e `saoPauloPeriodBounds`.

## 4. Experiência e estados

### 4.1 Seleção da jornada

1. Abrir aba: índice leve, opções de contexto e segmento; canvas vazio com instrução útil.
2. Escolher contexto: valores governados de frente/público e parceiro/origem. Exibição pode agrupar B2C e parceiros, sem fundir as dimensões no banco.
3. Escolher segmento: opções e contagens dependem do contexto.
4. Escolher jornada: lista pesquisável com nome completo acessível; identificadores técnicos ficam secundários.
5. Escolher versão: maior número primeiro; mostrar origem/data do pack. Não chamar versão do pack de versão executada.
6. Guardar última escolha e viewport para retorno, após conferir autorização e validade da seleção.

Uma jornada com vários parceiros/segmentos recebe vários bindings de contexto. Selecionar Serasa, por exemplo, não transforma todos os seus nós em Serasa.

Jornadas com classificação ausente ou conflitante continuam acessíveis em “Sem classificação / Revisar contexto”. Não desaparecem da ferramenta.

Filtros globais de BU e dimensões compatíveis limitam as opções e as métricas. Não manter uma jornada invisivelmente incompatível: explicar o conflito e permitir trocar a seleção. Período sem execução mantém o desenho e mostra o estado sem métricas.

### 4.2 Filtros de mensagem

Canal, subgrupo, oferta, promocional, momento e situação do vínculo, mais busca por ID, Activity Name e nome da peça.

- Momento oferece tipos válidos naquele contexto: semana/dia/disparo e “Não identificado”.
- Filtro destaca mensagens e seus caminhos; demais nós ficam atenuados, sem remover conexões.
- Um atalho “Ir ao disparo” centraliza o nó selecionado explicitamente.
- Clique normal não move inesperadamente a jornada nem altera seu zoom.
- Chips dos filtros ativos, contador de correspondências e ação Limpar.
- Preservar o recorte ao fechar leitor ou retornar de outra tela.

### 4.3 Workspace de fluxo

- Layout flex com altura realmente disponível e uma área de navegação do canvas; retirar o conjunto de rolagens da página/ficha/prévia sobrepostas.
- Header e comandos compactos; barra petróleo com resumo e cobertura, sem KPI por nó.
- `Enquadrar fluxo`: considerar bounding box real, largura E altura, padding e posição central. Calcular `min(larguraDisponível/larguraConteúdo, alturaDisponível/alturaConteúdo)` com limites de zoom e tratamento de dimensões inválidas.
- `Tela cheia`: Fullscreen API no workspace que contém canvas, leitor e popovers. Portais internos usam o container fullscreen, não `document.body`.
- Reaproveitar `src/components/ui/FullscreenButton.tsx`, estendendo o contrato para alvo/container e tratamento de falha. O controle global continua funcionando; não criar dois estados independentes de fullscreen nem silenciar uma falha como sucesso.
- Se fullscreen nativo falhar/não existir, oferecer modo expandido na aplicação, sem afirmar que é fullscreen nativo.
- `ResizeObserver` atualiza dimensões. Não refazer enquadramento a cada seleção ou imagem carregada; respeitar o viewport do usuário.
- Arraste com limiar entre clique e pan; manter scroll/gestos naturais. Zoom por gesto deve ter âncora, limites e comportamento explícito.
- Modo Só fluxo e minimapa leve opcional para jornadas extensas, sem HTML ou imagens duplicadas no minimapa.
- Acesso por teclado aos nós e controles; foco visível; fechamento retorna ao acionador.

### 4.4 Leitor único

- Um `CommunicationInspector` com modos compacto e focado, mantendo mensagem, aba e posição de leitura.
- Apresentação focada: prévia legível à esquerda; detalhes à direita. No mobile, apresentação de página inteira com navegação anterior/próxima.
- Não abrir `PreviewModal` adicional para a comunicação dentro do Flow.
- Prévia em largura adequada ao canal. E-mail longo em largura de leitura, não reduzido integralmente até caber na altura.
- Uma área de rolagem por coluna, evitando container → preview → iframe com três barras encadeadas.
- Abas: Comunicação/Contexto, Resultados, Outros usos. Aprendizados entra no corte posterior de Growth.
- Activity Name completo, ID observado, ID vinculado, versão da prévia e tags com fonte acessíveis.
- Erro de imagem tem recuperação local e não apaga estrutura ou métricas.
- Escape fecha/amplia conforme estado, sem fechar vários níveis involuntariamente.

## 5. Arquitetura de componentes

| Componente/serviço | Responsabilidade |
|---|---|
| `JourneyFlowWorkspace` | Coordena seleção/contexto; não monta todo o histórico |
| `JourneyContextPicker` | Contexto → segmento → jornada → versão |
| `JourneyMessageFilters` | Busca e filtros de nós; mantém topologia |
| `JourneyViewport` | Pan/zoom/enquadramento/fullscreen e dimensões |
| `JourneyScene` | SVG/conectores e nós estáveis; deriva do mesmo grafo |
| `JourneyMessageNode` | Ícone, número, marco nominal, estado e miniatura leve |
| `CommunicationInspector` | Único leitor e abas; conteúdo sob demanda |
| `JourneyCoverageSummary` | Contadores definidos e vinculados à fonte/período |
| `JourneyResultsPanel` | Contratos de métricas/cobertura existentes |
| `JourneyReusePanel` | Outros usos, equivalência e proveniência |
| `JourneyExportService` | Congela estado e gera PNG/PDF fora da cena interativa |
| `journeyReadService` | Consultas pequenas, canceláveis e autenticadas |
| `journeyPreviewService` | Manifesto de rendition, URL assinada e fallback |

Extrair funções puras e componentes do View atual. Não reimplementar taxonomia ou matching dentro dos componentes. Manter funcionalidades antigas até a substituição passar pelos gates.

## 6. Contratos de leitura propostos

APIs/RPCs abaixo são contratos novos de leitura, não endpoints já existentes.

### 6.1 Índice/contextos

`read_journey_index(filters, cursor)` retorna:

- snapshot_id, import_id, reference, journey_name, journey_version e data da fonte;
- context bindings: frente/público, parceiro, segmento/subgrupo, fontes e estado confirmado/proposto/misto/ausente;
- contagem estrutural de mensagens e tipos de canal;
- revisão do índice e cursor.

Sem HTML, texto completo, base64, URLs assinadas, catálogo inteiro ou histórico de activities.

Bindings reutilizam a precedência de fonte vigente da governança: dados executados compatíveis, revisão do pack, catálogo/planilha e gramática do ID com seu limite. Não cruzar todas as safras de um mesmo nome como se comprovassem o contexto daquele snapshot. Classificação sem período/versão comprovados deve permanecer proposta ou histórica, com fonte explícita.

Não associar fases do funil ao segmento por uma regra nova dentro desta tela. Usar as definições governadas já disponíveis.

### 6.2 Manifesto da jornada

`read_journey_manifest(snapshot_id)` retorna:

- grafo necessário ao layout, entradas, decisões/esperas, outcomes, raízes e junções;
- metadados por mensagem: occurrence_key, activity_key/name, canal, asset_id/name, af_sub3 observado, alertas, fingerprint de conteúdo e referência de prévia;
- origem e versão de parser/renderização.

O manifesto não contém os corpos HTML/base64 das mensagens. Grafo de exibição deriva da projeção canônica do parser; detalhes brutos permanecem consultáveis quando necessários, sem apagar o snapshot original.

### 6.3 Conteúdo da ocorrência

`read_journey_message(snapshot_id, occurrence_key)` retorna o payload somente da mensagem selecionada, mais informação de resolução de prévia. Nunca usa a versão atual do catálogo como se fosse a versão historicamente enviada.

Conteúdo do pack, rendition gerada e catálogo ficam diferenciados. Uma rendition é representação visual, não nova versão aprovada.

### 6.4 Resultados e cobertura

`read_journey_results(scope, period, filters, cursor)` suporta:

- occurrence context: jornada normalizada + Activity Name + canal;
- linked templates: IDs efetivamente vinculados ao contexto, sem usar candidato como chave de métrica.

Retorna registros projetados, métricas com coverage, timeline diária de São Paulo, proveniência, estado de completude e cursor de ativações.

**Cuidado obrigatório com duplicidades:** a projeção atual compara snapshots completos, exige todos os membros e invalida revisão quando aparece outro registro do evento. Buscar só as linhas vinculadas ou selecionar meia dúzia de colunas invalida essa garantia.

Primeiro corte de otimização:

1. Buscar apenas eventos relevantes ao contexto/período selecionado.
2. Buscar o fechamento completo desses grupos, incluindo registros sem template e revisões aplicáveis.
3. Aplicar `projectExecutions` com a mesma forma completa de registro usada hoje.
4. Aplicar filtros finais de público/parceiro e a seleção de IDs vinculados.
5. Só então calcular métricas com funções canônicas.

Não carregar todo o histórico como solução para obter o fechamento. Se não conseguir provar completude, não suprimir linhas nem entregar soma conclusiva sem aviso.

A leitura de membros, revisões e existência de terceiro membro precisa ser consistente: preferir uma RPC de leitura com um único statement/CTEs para formar esse conjunto, sob RLS, e aplicar a função compartilhada no cliente no primeiro corte. Retornar revisão/completude da fonte. Não acrescentar campos derivados aos registros antes da comparação com os snapshots completos.

Incluir revisões revertidas/não aprovadas na busca da revisão mais recente, não somente as aprovadas. Se o escopo exigir paginação, não misturar páginas de universos diferentes sem watermark/revalidação de completude. Agregados e timeline devem vir do conjunto completo, nunca somente da página de ativações visível.

Mover a projeção para SQL só com testes de equivalência contra a implementação compartilhada, incluindo atualização de fonte, terceiro membro, reversão e timestamps. Não manter dois algoritmos divergentes.

Cobertura deve definir denominador: mensagens de campanha da versão selecionada. Opt-outs/operacionais são identificados separadamente. Estados de cobertura devem ser mutuamente exclusivos; “há ID no link”, “há aprovação” e “há execução vinculada no período” não são sinônimos.

### 6.5 Reuso

`read_journey_reuse(occurrence_key, fingerprint, cursor)` retorna referências leves de outros usos autorizados, com contexto, template IDs, versão e tipo de evidência. Métricas dos outros usos só são carregadas ao selecioná-los.

Evidências separadas:

- Mesmo template ID: mesma identidade governada; conteúdo pode ter versões diferentes.
- Mesmo fingerprint completo: mesma configuração de conteúdo segundo uma serialização canônica versionada.
- Mesma prévia renderizada: mesma aparência no perfil de exemplo/renderer; não prova equivalência de links ou envio histórico.
- Asset compartilhado: `(source_scope/BU comprovada, asset_id)`, nunca asset_id global isolado. Conteúdo e parâmetros podem diferir.
- Texto parecido: candidato explicável; não aprova, vincula ou deduplica execução.

Se for necessário ignorar parâmetros de tracking para comparar criativos, criar uma assinatura separada, explicitamente normalizada e testada. Preservar hash integral e URL original. Não remover parâmetros que alterem destino/CTA nem fundir versões automaticamente.

## 7. Índices e projeções persistidas

Implementar migrações aditivas apenas quando necessárias ao contrato de leitura:

- índice derivado de contextos/ocorrências dos snapshots, sem repetir HTML;
- manifesto de renditions com status, hash, renderer_version, perfil, dimensões e Storage path;
- índices de consulta por snapshot, occurrence_key e fingerprint; índices nas consultas de events/templates devem ser escolhidos depois de `EXPLAIN`, não por presunção.

A construção do índice começa no staging validado e é enriquecida pelos eventos/revisões já existentes. Filtro/busca não dispara análise LLM nem varredura de toda a base.

Projeções derivadas podem ser reconstruídas. Não atualizar snapshots originais, alterar aprovações, marcar conteúdo atual ou preencher activities.template_id durante backfill.

Preservar visibilidade da importação pai, RLS e leitura autenticada. Views expostas usam security_invoker; nenhum acesso anônimo às peças privadas. Escrita de índices/renditions usa o caminho interno governado. Cache não amplia autorização.

## 8. Carregamento e cache

| Ação | Solicitação permitida |
|---|---|
| Abrir aba | Índice/classificação leve |
| Escolher contexto/segmento | Opções dependentes/contagens; sem corpos de mensagem |
| Escolher jornada | Manifesto/grafo da versão |
| Navegar no fluxo | Miniaturas visíveis e pequena margem de antecipação |
| Abrir mensagem | Rendition completa ou payload daquela ocorrência |
| Abrir Resultados | Execuções/métricas do escopo e período |
| Abrir Outros usos | Índice de reuso; resultados dos usos só ao entrar neles |
| Exportar | Recursos exigidos pelo escopo congelado do arquivo |

Cache inicial em memória, sem adicionar biblioteca de query por hábito. Usar infraestrutura existente onde houver contrato compatível; centralizar dedupe de promises, keys, cancelamento e invalidação num serviço pequeno.

Keys incluem identidade/escopo autorizado e revisões aplicáveis:

- índice: filtros canônicos + index_revision;
- manifesto/layout: snapshot_id + layout_version + modo;
- conteúdo: snapshot_id + occurrence_key + fingerprint;
- rendition: fingerprint + renderer_version + perfil/canal;
- métricas: escopo + período + filtros canônicos + revisão de vínculo/dedup;
- reuso: fingerprint/identidade + revisão do índice + filtros autorizados.

Valores iniciais sujeitos a medição: índice com freshness de 5 minutos; métricas com freshness de 1 minuto; manifesto/conteúdo imutável enquanto na sessão; limitar LRU a poucos snapshots e a um orçamento de bytes de conteúdo completo, não somente número de entradas.

- Trocar período invalida resultados, não grafo ou miniaturas.
- Aplicar pack invalida índice/contexto afetado; conteúdos imutáveis não são baixados de novo por padrão.
- Vincular/desvincular/rever duplicidade invalida resultados e cobertura afetados.
- Escolher versão atual invalida fallback do catálogo, não o payload de ocorrência do pack.
- Sair/trocar usuário limpa cache privado. Mudança de acesso requer reconferência de autorização.
- Reusar signed URL cache vigente e renovar antes de expirar; guardar paths, não URLs expiradas no banco.
- AbortController quando suportado pelo cliente; sempre request token/sequence guard. Resposta antiga nunca substitui seleção nova, mesmo que a rede não cancele.
- Estados separados por área: loading, empty, error, partial, stale e blocked. Não substituir todo o fluxo por spinner por causa de uma falha de métrica.
- Após mudar recorte, não apresentar métricas antigas sob o novo rótulo; ocultar ou rotular claramente o recorte anterior até a resposta correta.

## 9. Prévias e renditions

Resolver no processamento do pack/renderer controlado:

- miniatura leve WebP/PNG e representação completa legível quando possível;
- cache por conteúdo + renderer_version + modo de exemplo, e não somente ID/asset;
- renderer reutiliza MessagePreview e materialização de HTML existentes;
- HTML não executa AMPscript nem scripts importados; valores de exemplo permanecem identificados;
- navegador/headless necessário ao render não deve ser presumido disponível numa Edge Function. Usar o processamento de packs existente ou um worker Node/Playwright controlado, conforme ambiente validado;
- armazenar artefatos no bucket privado existente ou prefixo privado equivalente, com vínculo de proveniência;
- job idempotente com estados queued/rendering/ready/failed/missing, tentativas limitadas e recuperação por peça;
- fontes/imagens externas carregadas somente pelas regras autorizadas do renderer, com timeout e limite de tamanho. Nunca renderizar HTML importado como página administrativa confiável;
- ausência de imagem/HTML mostra aviso correto e não impede o fluxo.

No primeiro corte, usar thumbnails do catálogo quando comprovadamente compatíveis, com rótulo de catálogo. Não apresentá-las como rendition exata do pack. Manter MessagePreview como fallback de leitura da mensagem selecionada, evitando iframe em cada miniatura.

O cache de miniaturas não exige aprovação do template; renderizar não altera estado de reconciliação. Corrigir rendition por novo renderer_version sem reescrever conteúdo aprovado.

## 10. Exportação

Um `JourneyExportModel` congela jornada/versão, contexto/filtros, período, nós, edges, numeração, referências de imagens, fontes e avisos. Não exportar React state mutável enquanto o usuário troca de jornada.

Escopos: completo; caminho destacado com contexto preservado; fluxo + fichas numeradas.

- Cena SVG própria derivada do mesmo layout e ícones existentes, com imagens preparadas e fontes consistentes.
- PNG: rasterizar cena de exportação em resolução alta, default 3x quando dentro do orçamento; verificar dimensões/pixels antes da alocação. Para jornadas enormes, oferecer trechos/PDF em vez de travar ou entregar um PNG ilegível.
- PDF: jsPDF + svg2pdf.js para fluxo vetorial; fichas legíveis em páginas seguintes, com continuação de e-mails longos e numeração coerente. Validar fontes/acentos e conjunto suportado de SVG.
- Não capturar a área visível com zoom/scroll atuais como se fosse o fluxo completo.
- Imagens/fontes disponíveis e exportáveis devem ser preparadas antes da geração; problemas de CORS/canvas não podem virar documento branco.
- Se uma peça estiver indisponível, exportar o aviso e a fonte, não uma imagem inventada.
- Identificação: nome da jornada, versão, fonte/importação, data de geração, filtros e período das métricas, se incluídas. Não certificar versão histórica enviada.
- Progresso/cancelamento. Falhar exportação não bloqueia a navegação nem expõe artefatos privados em assets públicos.
- Render e export devem concordar em nós, ramos, dias e mensagens; diferenças visuais não alteram a topologia.

## 11. Growth e inteligência reaproveitada

Entrega inicial: cobertura + reuso + comparação contextual, com fatos e origem. Sem “score de IA” novo para preencher lacunas.

Usar tags/contextos existentes para encontrar outros usos comparáveis: público, parceiro, segmento/subgrupo, canal, oferta/promocional, momento, período e versão. Distinguir igualdade de conteúdo de compatibilidade de contexto.

Corte posterior: registrar Flow/Template como superfície contextual no contrato de Growth; hoje `GROWTH_CONTEXT_SURFACES` não contempla essa origem. Atualizar rotas, retorno ao recorte, backend e testes juntos.

- Consulta de memória apenas quando abrir Aprendizados; usar matcher vigente, proveniência e validade.
- Diferenciar vault_curated de outcome; hipótese da IA não vira fato.
- Memória vencida/contestada/incompatível não orienta silenciosamente a sugestão.
- Vincular retrospectivas, apostas e outcomes ao mesmo recorte.
- Sugestões de alteração de régua não executam ações no SFMC nesta entrega.
- Sem resultado por ramo ou frequência individual inferidos de métricas agregadas.

## 12. Sequência de implementação e gates

### Etapa 0 — baseline e preparação

Medir no build de produção: abertura da aba, seleção de jornada, volume transferido, montagem de iframes, abertura do leitor, zoom/pan e resultado do enquadramento. Cache frio/quente. Não usar fixture sintética para provar performance de banco.

Capturar jornadas de referência: VIBE_SEM1; carrinho com respostas/esperas variáveis e junções; uma jornada com resultado vinculado no período; versão extensa de VBSS em QA. Registrar viewport e dispositivo.

Gate: baseline, contratos, samples e dependências do renderer documentados; nenhum total ou vínculo alterado.

### Etapa 1 — viewport e leitor

Extrair componentes, corrigir altura/overflow, criar fullscreen/enquadramento separados, leitor único compacto/focado, preservar viewport e focos. Placeholder leve para prévia durante carregamento.

Gate: quadro inteiro enquadrado em largura/altura; fullscreen com controles/leitor visíveis; Escape correto; sem segundo modal nem deslocamento inesperado; mobile acessível.

### Etapa 2 — índice e leitura sob demanda

Adicionar contratos leves e index de contexto; remover autoabertura; fazer seleção progressiva e filtros por mensagem. Desacoplar Flow de useReconciliation e índice global de corpos, preservando funções compartilhadas.

Gate: abrir aba não requisita históricos/payloads; escolher jornada não baixa HTML de todas as mensagens; trocar período não baixa grafo; navegar rapidamente não troca a seleção por resposta antiga.

### Etapa 3 — resultados e cobertura

Implementar serviço de eventos completos por escopo; métricas e timeline canônicas; paginação e provas de completude; sinalização de versão desconhecida e situação do vínculo.

Gate: equivalência com o motor anterior para os mesmos filtros e fonte; duplicidades/revisões/stale source preservadas; nulos/cobertura corretos; nenhuma execução adicionada/vinculada.

### Etapa 4 — renditions e fluidez

Introduzir manifest/jobs privados de preview, backfill idempotente de artefatos, cache, lazy loading e isolamento de render do canvas. Somente ampliar virtualização/worker de layout se o perfil mostrar necessidade.

Gate: zero iframe de e-mail no canvas normal; peças carregadas fora da área visível obedecem orçamento; falha de uma peça é local; render de preview não executa scripts/AMPscript nem muda aprovações.

### Etapa 5 — exportação

Implementar export model/scene, PNG/PDF, preparo de recursos, limites de tamanho, cancelamento e arquivos com procedência.

Gate: baixar e abrir os arquivos reais; comparar contra referência; nenhum ramo omitido; fichas legíveis; acentos corretos; avisos e versão consistentes; imagens indisponíveis explícitas.

### Etapa 6 — reuso e comparação contextual

Index leve de outros usos, distinção de evidências por hash/asset/ID, contextualização e atalho para navegar preservando filtros. Sem novo motor de reconciliação.

Gate: mesmo asset em BUs distintas não prova equivalência; mesma peça em momentos distintos não é deduplicada; links candidatos não alimentam métricas.

### Etapa 7 — integração Growth

Superfície contextual, memória aplicável, retrospectivas e rotas de retorno. Entrega separada, após UX e dados estáveis; não bloquear as etapas anteriores por essa integração.

Gate: origem/recorte/versionamento preservados; memórias incompatíveis rejeitadas; nenhuma hipótese apresentada como validada.

As etapas podem ser commits/PRs menores. Para o usuário, liberar a V2 principal quando seleção, leitor, carregamento, exportação e reuso/cobertura estiverem verificáveis em conjunto.

## 13. Critérios de desempenho e qualidade

Metas iniciais para comparação em ambiente documentado, não promessas universais de rede:

- Feedback visual de clique/seleção: até 100 ms em mediana; p95 alvo até 200 ms.
- Fluxo visível após manifesto disponível: p95 alvo até 300 ms nas jornadas representativas.
- Abrir leitor com cache quente: p95 alvo até 200 ms; conteúdo frio usa skeleton imediato sem bloquear canvas.
- Pan/zoom: buscar frames dentro de ~16,7 ms em desktop de referência; registrar long tasks, sem afirmar 60 fps em todo dispositivo.
- Primeiro carregamento pede apenas índice: zero payload de mensagens/base64 e zero consulta ao histórico global.
- Pedido frio da jornada recebe manifesto, não todos os corpos; orçamento inicial indicativo de até 200 KB comprimidos nas jornadas de referência, com exceções justificadas por dimensão estrutural.
- Miniatura: alvo até 100 KB por peça; concorrência inicial de até 4 recursos e margem de antecipação limitada, ajustadas pelo perfil.
- Sem long task recorrente acima de 50 ms provocada por abrir/fechar ficha nos cenários de referência.

Medir p50/p95, bytes e quantidade de requisições com dataset, browser, viewport, build e condições de cache registrados. Não aceitar aceleração obtida omitindo dados obrigatórios ou alterando o universo.

## 14. Testes necessários

- Unitários: projeção de contextos, precedência/proveniência, filtros e manutenção de topologia, tipos de momento, reuso, cache/invalidação, bounding box e export model.
- SQL: RLS, leitura de importação pai, isolamento de acesso, índice idempotente, completude dos grupos, fonte alterada, terceiro membro, revisão revertida e equivalência das métricas.
- Navegador: seleção progressiva; fullscreen/expandido; Escape/foco; canvas/leitor sem salto; filtros globais/locais; corrida A→B; erro de conteúdo/métricas; cache frio/quente; preview de todos os canais; mobile.
- Export: fluxo completo/caminho/fichas; PDF aberto e renderizado; PNG aberto; Unicode/fontes; CORS/asset ausente; jornada extensa dentro dos limites; nenhuma barra de scroll no arquivo.
- Regressão de negócio: `Dispd1_21d`; subgrupos oficiais de Abandonados; Vibe/oferta versus Padrão/promocional; reuso Upgrade menor/repescagem; af_sub3 repetido em momentos diferentes.
- Casos sem métricas e sem classificação permanecem usáveis e honestos.

Não criar teste que somente replique a implementação; cada teste protege um comportamento ou risco concreto.

## 15. Publicação, observação e reversão

- Migrações novas por CLI/fluxo vigente, com histórico local/remoto reconciliado; não alterar migrações já aplicadas.
- Aplicar alterações aditivas de banco antes do frontend que as consome.
- Backfill de índice/renditions por lotes com hash de origem, contagens e erros por jornada/peça. Sem reimportar/criar aprovações para contornar ausência de preview.
- Registrar antes/depois: templates, conteúdos aprovados/atuais, execuções vinculadas e revisões. Índices/renditions não podem alterar esses totais.
- Gates do projeto: frontend tests, contratos SQL, TypeScript sem erro novo, build e CI de main.
- Verificar no app autenticado: seleção real, resultado de uma jornada com vínculos, estado vazio, fullscreen, leitor ampliado e downloads. Artefato servido HTTP 200 não substitui essa conferência.
- Se a automação do navegador falhar, registrar o bloqueio e não chamar a etapa interativa de validada. Reproduzir com ferramenta autorizada/manual antes de fechar UAT.
- Rollback do frontend para release anterior continua possível; tabelas/artefatos aditivos podem permanecer. Não remover histórico ou execuções para reverter UX.
- Telemetria: timings/bytes/cache hit/erros de renderer/export, sem textos de comunicação, credenciais ou dados pessoais em logs públicos.

## 16. Entrega esperada

O operador escolhe contexto e segmento, abre uma jornada, navega com fluidez, lê qualquer comunicação num único leitor, consulta resultados/reuso sob demanda e baixa um PNG/PDF coerente com o fluxo.

A inteligência existente continua explicável e auditável. A melhoria de velocidade não inventa classificação, versão enviada, métricas nem percurso de pessoas.

Fontes: código atual; `docs/tabs/fluxo-jornadas.md`; vault `Reguas-Inteligentes-Arquitetura`, `Comunicacoes-Pacote-SFMC-Catalogo`, `Loop-de-Aprendizado-Growth`, `Resultados-Evolucao-e-Retrospectivas`; documentação oficial React, MDN Fullscreen/iframe/canvas e yWorks svg2pdf/jsPDF.

## 17. Esqueleto dos tipos e pontos de alteração

DTOs abaixo são especificação a validar/implementar, não descrição de uma API já publicada. Tipos completos devem importar `JourneyGraph`, `MessageContent`, `FrameworkActivity`, `ExecutionReview`, `ScopeFacets`, `CoveredValue` e `ExecutionMetrics` existentes.

```ts
type ClassificationState = 'confirmed' | 'proposed' | 'mixed' | 'missing';
type InspectorTab = 'communication' | 'results' | 'reuse' | 'learnings';
type RenditionStatus = 'queued' | 'rendering' | 'ready' | 'failed' | 'missing';
type ReadState = 'idle' | 'loading' | 'ready' | 'empty' | 'partial' | 'error' | 'blocked';

interface JourneyContextBinding {
  snapshotId: string;
  occurrenceKeys: string[];
  facets: ScopeFacets;
  classification: ClassificationState;
  sources: { kind: string; reference: string; revision?: string }[];
}

interface JourneyMessageSummary {
  occurrenceKey: string;
  activityKey: string;
  activityName: string;
  channel: string;
  assetId: string | null;
  assetName: string | null;
  observedTemplateId: string | null;
  contentFingerprint: string;
  renditionStatus: RenditionStatus;
  alerts: string[];
}

interface JourneyManifest {
  snapshotId: string;
  schemaVersion: number;
  sourceRevision: string;
  graph: JourneyGraph;
  messages: JourneyMessageSummary[];
  // Ausência intencional de MessageContent/HTML/base64 neste DTO.
}

interface JourneyResultsEnvelope {
  scopeKey: string;
  period: { start: string; end: string; timezone: 'America/Sao_Paulo' };
  sourceRevision: string;
  completeGroups: boolean;
  metrics: ExecutionMetrics | null;
  // metrics=null quando não há conjunto apto a agregação conclusiva.
  timeline: { day: string; values: Record<string, CoveredValue> }[];
  executionPage: FrameworkActivity[];
  nextCursor: string | null;
  warnings: string[];
}
```

Pontos de alteração previstos:

- `JourneyFlowView.tsx`: substituir coordenação monolítica por composição de workspace, picker, viewport e inspector.
- `journeyFlowService.ts`: manter compatibilidade para consumidores antigos; adicionar métodos de índice/manifesto/detalhe ou movê-los para `journeyReadService` com adapter explícito.
- `journeyFlow.ts`: preservar semântica do layout/tempos/joins; extrair bounding box e caminhos destacados testáveis. Não alterar o grafo por filtro.
- `ContentPreview`/`ChannelPreview`: permitir consumidor usar inspector próprio e rendition; manter comportamento de Cadastro/Performance até sua própria validação.
- `MessagePreview`: fonte da renderização da mensagem, não miniatura HTML obrigatória em cada nó.
- `FullscreenButton`: aceitar alvo e recuperação sem quebrar uso global.
- `executionProjection`/`contentPerformanceModel`: compartilhados; testes de equivalência antes de qualquer alteração da projeção.
- `templateContentIndex`/URLs assinadas: criar leitura focada de metadados/conteúdo; revisar limpeza de caches compartilhados em troca de sessão.
- `sfmc-package-changed` e eventos de vínculo/revisão: invalidar as chaves corretas; não atualizar métricas apenas após upload.
- `growthLearningNavigation`: só na etapa 7, acrescentar superfície/rota governada e retorno ao contexto.
- Novas migrations: índice/renditions e RPCs de leitura, criadas e reconciliadas pelo fluxo vigente. Não copiar nome/timestamp de migration antiga.

Durante desenvolvimento, manter a tela publicada como fallback e comparar as duas experiências no mesmo recorte. A seleção da versão da UI não pode mudar permissões, dataset, semântica de métrica nem método de aprovação. Encerrar o fallback temporário depois da validação/release para evitar manutenção indefinida de duas telas.

Referências técnicas para a execução:

- Fullscreen: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
- Custo de iframe: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe
- Memoização e medição: https://react.dev/reference/react/memo
- Rasterização PNG: https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
- SVG/PDF: https://github.com/yWorks/svg2pdf.js
- Limites da captura DOM: https://github.com/bubkoo/html-to-image
