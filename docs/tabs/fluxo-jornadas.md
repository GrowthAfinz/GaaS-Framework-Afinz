# Fluxo de jornadas

Implementação de 08/10/2026. Entrada: **Comunicações → Fluxo de jornadas**.

## V2: navegação e carregamento

O operador escolhe contexto de público/parceiro, segmento, jornada e versão antes de abrir o fluxo. Não há jornada automática na primeira visita. A última seleção fica na sessão do usuário; classificação ausente continua explícita. Filtros de canal, subgrupo, oferta, promocional, momento, ID e vínculo destacam caminhos sem apagar ramos. A estrutura do pack independe do período; cobertura e resultados respeitam o recorte global em dias de São Paulo.

O canvas usa SVG e layout próprio. Arraste atualiza a transformação diretamente; miniaturas são montadas na área visível e uma margem. Enquadrar considera largura e altura. Tela cheia usa a API nativa; quando indisponível, expande o workspace. Uma única ficha abre compacta ou ampliada dentro do mesmo workspace, com navegação entre mensagens e retorno ao zoom anterior. Resultados e outros usos só são consultados quando suas abas são abertas.

`journeyReadService` consulta índice leve, manifesto da jornada selecionada, mensagem individual e resultados delimitados. Não carrega todos os HTMLs ou todo o histórico para abrir o módulo. Cache de leitura usa identidade autenticada, TTL, limite de memória e invalidação após mudanças. O restante do GaaS conserva seu carregamento global existente.

Prévias derivadas usam `MessagePreview` e o HTML exportado sanitizado, sem scripts ou execução de AMPscript. São preparadas ao abrir/exportar e, após staging pela UI, em segundo plano com concorrência limitada. IndexedDB e registros privados separam usuário, snapshot, fingerprint de conteúdo e versão do renderer. Catálogo é fallback identificado; sua imagem não vira prova do conteúdo enviado. Falhas de imagens externas aparecem como avisos e não bloqueiam ingestão/aprovação.

PNG exporta o fluxo completo, o caminho destacado ou fluxo com fichas, independentemente do zoom. PDF tem fluxo vetorial e fichas paginadas para comunicações longas. PNG limita resolução/memória; jornadas excessivas orientam usar PDF ou um caminho. Preview indisponível permanece explícito. Não há screenshot parcial do viewport como exportação final.

Migrações adicionais aplicadas: `20261009013157_journey_flow_v2_read.sql` e `20261009015520_journey_preview_renditions.sql`. RPCs SECURITY INVOKER respeitam RLS; anônimo não recebe conteúdo. Renditions pertencem ao usuário e usam o bucket privado existente, sem mudar suas políticas. Consulta de performance fecha os grupos de execução para aplicar a revisão de duplicidades existente; não deduplica por asset reutilizado. Acima de 5.000 registros, recorte incompleto retorna aviso, nunca soma parcial silenciosa.

Validação V2: 371 testes frontend; contratos SQL de snapshots, leitura leve, RLS, cache privado, fechamento de grupos e período vazio; navegador com pack e execuções reais, seleção progressiva, tela cheia, leitor único, reuso, filtros e downloads PNG/PDF. Preservados 60 snapshots, 19 conteúdos, nenhuma versão atual e 1.073 execuções vinculadas. A integração futura com memória de Growth continua separada desta entrega.

## Experiência

Consulta visual da estrutura exportada pelo Package Manager, separada da operação de aprovação de templates. Selecionar jornada e versão abre um canvas com ícones por tipo, conectores ortogonais, rótulos de ramo, mensagens numeradas e miniaturas. Zoom, arraste, ajuste à tela e modo “Só fluxo”.

Uma comunicação abre uma ficha lateral com prévia visual, nome da peça, Activity Name completo, af_sub3 observado, tags do ID e das activities, todos os caminhos exportados até o nó, dia nominal e reuso. Reutilizar uma peça em outro ramo/momento conserva as duas ocorrências. O reuso isolado não é erro.

A ficha tem tabela de ativações e evolução diária. “Esta atividade” exige jornada normalizada + Activity Name exato + canal + template efetivamente vinculado. “Usos dos templates vinculados” reúne todas as activities dos IDs efetivamente vinculados àquele contexto, no recorte global. O ID observado no link e o asset compartilhado não constituem vínculo de performance.

## Fontes e limites

- `parsePackage.ts` é a fonte única das mensagens e dos grafos. Snapshot distingue importação, referência e versão; não duplica nós em junções.
- O layout próprio em grade suporta árvore e DAG com junções. Ciclos e destinos não exportados produzem aviso, sem conexões inventadas. Não utiliza React Flow, dagre ou elkjs.
- Dias somam exclusivamente esperas fixas válidas. Einstein permanece janela adicional. Espera por evento/data, espera sem duração e Path Optimizer tornam o dia variável; não equivalem a zero. Até 256 percursos por nó; exceder torna o tempo não certificado.
- A estrutura não é filtrada pelo período. Métricas usam `periodLinked` do motor existente, com datas de São Paulo e filtros globais. Mesma Activity Name em vários nós impede atribuição automática de resultados a uma ocorrência.
- O pack não prova a versão enviada em uma execução, nem quantos contatos passaram por cada ramo. Não há contagem de registros inferida da DE nem métricas de ramo fabricadas.
- Campos e ofertas não são reclassificados pelo canvas. Tags de activities vêm dos registros vinculados no período; tags do ID usam o componente existente.
- `MessagePreview` renderiza WhatsApp/SMS/push e o HTML exportado do e-mail em iframe sem scripts. HTML é materializado dos slots, não executa AMPscript. Imagens pequenas embutidas são preservadas; imagens grandes usam URL publicada quando existir. Ausência/limite tem aviso. Prévia de catálogo continua identificada como catálogo.
- Limites de conteúdo: 750 mil caracteres por HTML, 300 mil caracteres de base64 por imagem e 6 MB de HTML por pack. Uma prévia grande não bloqueia toda a ingestão. Esses limites são de renderização, não alteram a definição dos links.

## Persistência e publicação

Migração: `supabase/migrations/20261008214036_sfmc_journey_snapshots.sql`.

Cria `sfmc_journey_snapshots` com SELECT autenticado condicionado à visibilidade da importação pai. Anônimo e escrita direta autenticada bloqueados. Estende atomicamente o staging existente, tanto UI como agente, aceitando packs legados sem `graphs`. Snapshot é idempotente por importação + referência + versão e conserva a primeira leitura. As mensagens de cada snapshot são selecionadas pela ocorrência/referência; jornadas distintas com o mesmo nome não são misturadas.

**Migração aplicada em produção.** Os quatro packs já importados foram reprocessados por SHA-256: 60 snapshots e 176 mensagens. Foram preservados 19 conteúdos, nenhuma versão atual selecionada e 1.073 execuções vinculadas (mesmos totais antes/depois). A estrutura é independente do status de aprovação. VBSS continua somente como fixture local de QA.

Para packs existentes, preparar SQL aditivo usando o ZIP exato:

```powershell
node scripts/prepare-journey-snapshots.mjs '<pack.zip>' '<saida.sql>'
# Para envio administrativo com limite de tamanho, um SQL por jornada:
node scripts/prepare-journey-snapshots.mjs '<pack.zip>' '<pasta-saida>' --split
```

O comando apenas escreve SQL local. O SQL verifica o SHA-256 contra importações existentes, insere snapshots e não atualiza propostas, mensagens antigas, versões atuais ou execuções. Não deve criar uma importação nova para um arquivo sem correspondência. Revisar e aplicar o SQL com o mecanismo administrativo já usado pelo projeto. Não armazenar SQL de conteúdo privado em `dist` ou em assets públicos.

## Verificação realizada

- Cinco ZIPs reais: 62 versões de jornadas, 210 ocorrências de comunicação. Todos os grafos desenháveis; junções preservadas. Dados de VBSS usados apenas em QA, sem nova importação em produção.
- VIBE_SEM1: 24 atividades, quatro e-mails e um SMS; 5 saídas. VBSS completo: 34 atividades e 21 comunicações. Dias nominais e janelas Einstein separados.
- QA em navegador: seleção de versão, ficha SMS/e-mail, reuso, zoom, modo só fluxo, Escape, resultados por atividade versus template e período sem execução. Grafos e mensagens reais; métricas sintéticas identificadas como fixtures de teste.
- Vitest: parser, tempos/caminhos, junções, atribuição, segurança/materialização de HTML e resolução de prévia.
- PGlite: staging idempotente, separação de jornadas com mesmo nome, RLS, bloqueio de anônimo e de escrita autenticada.
- Build de produção e gate TypeScript sem erros novos. Dívida preexistente do main registrada pelo gate.

Evidências locais: `outputs/journey-flow-qa/` no workspace principal. Não são assets da aplicação publicada.

## Revisão para publicação

Busca de comunicações por Activity Name, nome da peça, af_sub3 e canal. Abrir ficha centraliza o nó e destaca seu caminho. Versões de uma mesma jornada ordenadas pelo número, depois data. Grafos indisponíveis mantêm uma lista de mensagens com fichas, sem cálculo inventado de caminho. Prévia SMS mais compacta e largura responsiva. Atualizar tenta novamente a leitura da versão selecionada. Eixo do gráfico usa data completa para evitar misturar dias iguais de anos diferentes.
