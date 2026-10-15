# Fluxo de Jornada — catálogo e workspace

Atualizado em 15/10/2026.

## Entrada e navegação

A tela abre um catálogo leve de todas as jornadas extraídas dos packs acessíveis. As tabelas são agrupadas por BU → parceiro/público → segmento e mostram somente nome e última atividade registrada, ordenada da mais recente para a mais antiga. Jornadas sem histórico continuam disponíveis com indicação explícita. Cada nome é contado uma vez, independentemente do número de versões ou grupos em que aparece. Os grupos permanecem fixos durante o refinamento do recorte, com rolagem interna.

- **Frente** é um bloco cinza fixo em Aquisição. O antigo seletor Frente foi renomeado para **BU**, respeitando as BUs do cabeçalho global.
- B2C usa **Público / origem** e B2B2C usa **Parceiro / público**. Plurix mostra **N/A**, cinza e não interativo, sem divisão por bandeira.
- Proprietaria/Proprietária e Institucional representam **Institucional**, conforme definição explícita do usuário. Ausência de identificação de outras BUs não vira Institucional.
- Público, segmento e canal/subgrupo compartilham o estado dos filtros globais. Busca, oferta, promocional, momento, vínculo e atividade no período ficam na faixa secundária.
- Os filtros devem coincidir numa mesma comunicação e num mesmo contexto histórico. Não se combinam atributos de mensagens ou execuções diferentes para inventar uma correspondência.
- A última atividade é histórica; o período selecionado restringe resultados e os filtros de vínculo/atividade no período. As datas respeitam America/Sao_Paulo.
- Clique na linha ou escolha um nome para abrir a versão mais recente compatível com o recorte. A versão vem preenchida; pode ser trocada posteriormente. O seletor de jornada também mostra a data histórica.
- **Classificação pendente** preserva o acesso aos packs incompletos; nenhum pack é descartado pela ausência de histórico. Retornar ao catálogo preserva filtros e a posição de navegação.

## Contratos de leitura

- `read_journey_flow_catalog(p_start,p_end)` retorna identificadores das versões, classificação e resumos históricos por tupla de BU/público/segmento/canal/subgrupo/oferta/promocional. Inclui recência histórica e contagem/flags de vínculo no período. Não retorna grafo, HTML, previews, fingerprints nem linhas de performance.
- `read_journey_flow_detail(p_snapshot)` e o manifesto são consultados somente após escolher uma jornada. O conteúdo integral da comunicação continua sob demanda no leitor.
- `read_journey_flow_performance_page(p_snapshot,p_start,p_end,p_cursor,p_limit)` é chamada somente quando Performance está visível. O cliente pede 30 grupos por página; cursor descendente por data/jornada/Activity Name/canal. Um grupo de revisão não é dividido entre páginas. Grupos acima de 5.000 linhas retornam `complete=false`, sem resultados parciais, e a interface pede um período menor.
- `journey_flow_activity_matches` centraliza correspondência exata de jornada normalizada, Activity Name e canal, além dos aliases com período de evidência. Não cria vínculos nem altera o histórico.
- Todas as funções usam `security invoker`, autenticação, search_path fixo e RLS existentes. PUBLIC/anon não executam as funções. As duas consultas JSON usam PL/pgSQL com JIT desativado apenas na chamada para evitar custo de compilação desproporcional.
- Cache por identidade da sessão: catálogo/detalhe 5 minutos, performance 1 minuto, manifesto 1 hora. Importações e alterações de vínculos invalidam o cache. Mudança de período não exibe os resumos do período anterior; respostas antigas não substituem a seleção atual. Falhas oferecem **Tentar novamente**.

## Desenho e performance

A área do desenho mede o espaço disponível considerando o zoom CSS global, com altura física mínima de 440 px no modo normal. Pan/zoom manual e foco não são perdidos ao redimensionar ou expandir Performance. O modo tela cheia mantém o mesmo workspace.

O botão fixo **Performance** abre um painel flutuante à direita, com tabela e carregamento paginado. O painel pode ocupar o workspace inteiro e voltar à jornada preservando o desenho. Selecionar um nó filtra o painel; **Localizar no fluxo** faz o caminho inverso quando a correspondência é única. Resultados ambíguos não recebem localização falsa. O contador descreve somente os registros das páginas carregadas. Dados ausentes são —; custo e CAC observado usam valores registrados, sem custo presumido.

O pin **Último disparo registrado** destaca a ocorrência mais recente do recorte. Empates são mantidos; atividades operacionais/opt-out e correspondências ambíguas não recebem pin. O pin não representa posição atual dos contatos nem comprova a versão do pack enviada. Classificação revisada da peça nunca reclassifica os resultados históricos da execução.

## Validação

Contratos SQL cobrem autenticação/RLS, aliases, períodos, payload leve e paginação sem sobreposição ou divisão de grupos. Testes unitários cobrem contagem de nomes, versões compatíveis, tuplas, recência, ausência de histórico e pins. `node scripts/test-journey-progressive-ui.mjs` usa serviços simulados e componentes reais para catálogo, filtros globais/secundários, Plurix, versões, altura com zoom global, tela cheia, paginação/expansão, retorno ao desenho, retry de catálogo e mobile. Gere o CSS de QA antes com `npx tailwindcss -i src/App.css -o tmp/journey-workspace.css --minify`.

Medições pontuais no banco real sob role authenticated, em transação revertida antes da publicação: catálogo ~129 ms e primeira página do maior snapshot ~656 ms. Não incluem rede/renderização e não constituem SLA. A consulta de catálogo substitui a antiga leitura inicial de mensagens visuais.
