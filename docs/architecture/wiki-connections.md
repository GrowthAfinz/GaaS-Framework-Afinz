# Wiki: mapa de conexoes

A Wiki possui duas visualizacoes: Leitura e Mapa de conexoes. A navegacao lateral da leitura cresce com a pagina, sem uma segunda rolagem vertical.

O mapa carrega somente os metadados do catalogo e os vinculos existentes em `gaas_vault_links`, sob a mesma autenticacao e RLS. O Markdown continua sendo carregado apenas ao abrir uma nota. A leitura dos vinculos e paginada e rejeita snapshots incompletos ou alterados durante uma sincronizacao.

Cada aresta representa uma referencia dirigida entre duas notas ativas. Referencias repetidas, autorreferencias e alvos nao resolvidos nao aumentam a conectividade. O tamanho representa o numero de notas distintas que referenciam aquela nota, calculado no acervo completo; nao representa confianca, validacao ou popularidade de uso. As cores seguem os assuntos da Wiki.

A visualizacao local mostra um ou dois niveis de vizinhanca em ambas as direcoes. O acervo completo inclui notas isoladas. Busca e assunto filtram os pontos e suas arestas, preservando a metrica global de tamanho. Selecao exibe metadados e referencias recebidas/emitidas antes de abrir o leitor. Os parametros `wiki_graph_*` preservam o recorte ao alternar entre mapa e leitura e permitem compartilhar a URL.

O layout deterministico e calculado ao mudar o recorte, sem animacao continua. Zoom, arraste e navegacao por teclado oferecem exploracao; uma lista alternativa permite selecionar notas sem depender do SVG. Atualizar mapa refaz a leitura dos vinculos.

Validacao: testes de deduplicacao, referencias invalidas, vizinhanca, filtros, URL, layout, paginacao e consistencia de sincronizacao em `src/components/vault/graph/*.test.ts`.
