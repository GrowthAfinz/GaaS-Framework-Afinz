# Exportação SFMC com header V13

O serializador já incluía as 41 colunas. Coluna presente não significa conteúdo preenchido: o arquivo SFMC de 12 linhas fornecido na revisão tinha os quatro campos de header vazios.

O diálogo de exportação agora mostra a quantidade de linhas selecionadas com título dinâmico. O modo V13 vem marcado quando há conteúdo de header ou template que lê HEADER_TITULO, e exige título e imagem do cartão em todas as linhas selecionadas. Logo e subtítulo permanecem opcionais. O operador pode manter o modo legado por imagem.

O tipo de campanha pode ser definido para o arquivo (por exemplo CRM), sem editar os briefings salvos. Colisões da chave produto + campanha + sequência são bloqueadas após essa conversão. As escolhas são registradas no histórico de exportação existente.

Não há preenchimento automático de criativos ausentes nem escrita de conteúdo em produção. O CSV conserva 41 colunas em ordem, vírgula, aspas qualificadoras quando necessárias, CRLF, UTF-8 sem BOM e datas MM/DD/AAAA.

Validação: 53 testes focados passaram; build Vite passou. A checagem de tipos usa o gate de dívida preexistente do repositório. Execução no SFMC e publicação do app permanecem etapas separadas.
