# Wiki: mapa de conexoes

A Wiki possui duas visualizacoes: Leitura e Mapa de conexoes. A navegacao lateral da leitura cresce com a pagina, sem uma segunda rolagem vertical.

O mapa carrega somente os metadados do catalogo e os vinculos existentes em `gaas_vault_links`, sob a mesma autenticacao e RLS. O Markdown continua sendo carregado apenas ao abrir uma nota. A leitura dos vinculos e paginada e rejeita snapshots incompletos ou alterados durante uma sincronizacao.

Cada aresta representa uma referencia dirigida entre duas notas ativas. Referencias repetidas, autorreferencias e alvos nao resolvidos nao aumentam a conectividade. O tamanho representa o numero de notas distintas que referenciam aquela nota, calculado no acervo completo; nao representa confianca, validacao ou popularidade de uso. As cores seguem os assuntos da Wiki.

A visualizacao local mostra um ou dois niveis de vizinhanca em ambas as direcoes. O acervo completo inclui notas isoladas. Busca e assunto filtram os pontos e suas arestas, preservando a metrica global de tamanho. Selecao exibe metadados e referencias recebidas/emitidas antes de abrir o leitor. Os parametros `wiki_graph_*` preservam o recorte ao alternar entre mapa e leitura e permitem compartilhar a URL.

O renderizador Sigma.js usa WebGL e e carregado sob demanda. O layout ForceAtlas2 usa Barnes-Hut e roda em um Web Worker com 220 iteracoes finitas; a interface nao executa a simulacao. Os ultimos oito layouts ficam em cache na sessao. Selecao e movimento de camera nao recriam o grafo nem recalculam suas posicoes. O worker e o renderizador sao encerrados ao sair ou trocar o recorte.

O acesso e um botao discreto Conexoes no cabecalho. Busca e filtros ocupam uma unica faixa. O mapa ocupa a altura restante da janela (minimo de 320px), sem lista ou legenda abaixo. Um painel recolhivel a direita concentra detalhes, lista de notas e legenda; suas secoes tambem sao expansiveis. Em telas pequenas o painel sobrepoe o grafo. O fundo azul acinzentado reforca o contraste com linhas pretas; setas aparecem nos vinculos da nota selecionada. O modo Mais detalhes aumenta a densidade de nomes e exibe contagens na lista. O enquadramento preserva a proporcao das coordenadas, sem alongamento horizontal. A paleta por assunto usa jade, azul, ametista, verde, ambar, rosa e azul acinzentado. Labels sao regulados por densidade e zoom para evitar sobreposicao. Na ausencia de WebGL, a lista continua disponivel. Atualizar mapa refaz a leitura dos vinculos.

Validacao: testes de deduplicacao, referencias invalidas, vizinhanca, filtros, URL, layout, paginacao e consistencia de sincronizacao em `src/components/vault/graph/*.test.ts`.
