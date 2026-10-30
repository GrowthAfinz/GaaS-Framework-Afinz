# Escrita: campos, limites e conferência

## Campos que você escreve

O exemplo é o texto atual do primeiro e-mail da régua exportada, na primeira rede.

| Campo | Para que serve e limite | Exemplo atual |
|---|---|---|
| `ASSUNTO` | Assunto. Até ~50 caracteres, sem nome da pessoa; vale para as 6 redes. | Seu mercado pode render mais com o cartão +amigo |
| `PRE_CABECALHO` | Texto de pré-visualização na caixa de entrada. Até ~90 caracteres; complementa o assunto. | Você já tem o Clube. Com o cartão, ganha desconto extra em produtos selecionados. |
| `HEADER` | Header por imagem dos templates antigos. Deixe como está no V13. |   |
| `TITULO_COPY_1_AZUL` | Título do primeiro bloco (azul). | Olá, %%=v(@FirstName)=%%! |
| `TITULO_CTA_1` | Botão do primeiro bloco. Caixa alta, começa com verbo. | PEDIR CARTÃO +AMIGO |
| `COPY_1_PRETO` | Texto principal do primeiro bloco. Aceita <b>, <br>, %%=v(@FirstName)=%% e {no_mercado}. | Já pensou em aproveitar as melhores <b>vantagens e descontos dentro e fora do Supermercado</b>? Com o <b>cartão de crédito +amigo</b>, você |
| `TITULO_COPY_2` | Título do segundo bloco. Uma ideia, até ~50 caracteres, sem negrito interno. | Mais possibilidades para suas compras renderem |
| `COPY_2_PRETO` | Gerado pelo GaaS a partir de secondBlock. Não envie. | <p style="margin:0 0 14px 0;text-align:center;">E para aproveitar benefícios em diferentes momentos da rotina, conheça algumas das vantagens |
| `TITULO_CTA_2` | Botão do segundo bloco. Caixa alta, começa com verbo. | QUERO MEU CARTÃO +AMIGO |
| `BANNER_1_CORPO` | Imagem do corpo 1 (URL da biblioteca). Texto escrito em imagem vai para o bloco onde faz sentido. |   |
| `BANNER_2_CORPO` | Imagem do corpo 2 (URL da biblioteca). |   |
| `MENSAGEM_LIMITE` | Faixa de limite pré-aprovado. Formato "Abertura, {{nome}}: ... {{limite}} ...". Até 300. | Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo. |
| `HEADER_TITULO` | Título do header dinâmico (V13). Até 34 caracteres para caber em uma linha. | Seu mercado rende mais! |
| `HEADER_SUBTITULO` | Subtítulo do header dinâmico. Até 60 caracteres. | +5% de desconto extra em produtos selecionados |
| `HEADER_IMAGEM_CARTAO` | Imagem do cartão no header (URL da biblioteca de ativos; veja a régua). | https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/c6f51660-3c13-448e-aef3-5a68efaf2310.png |

Mande no arquivo só os campos que mudam. Em e-mail novo, o que você não mandar vem do e-mail anterior da
mesma rede (imagens, títulos), então mande tudo o que for diferente.

## Campos que você nunca preenche

`DT_FIM`, `UTM_CAMPANHA`, `CARTAO_NM_COMERCIAL`, `COR_COPY_1`, `TAMANHO_DA_FONTE_TITULO_COPY_1`, `LINK_CTA_1`, `COR_COPY_PRETO_1`, `TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1`, `COR_TITULO_COPY_2`, `TAMANHO_DA_FONTE_TITULO_COPY_2`, `COR_COPY_2`, `TAMANHO_DA_FONTE_COPY_2`, `LINK_CTA_2`, `LINK_BANNER_1_CORPO`, `LINK_BANNER_2_CORPO`, `BANNER_3_CORPO`, `LINK_BANNER_3_CORPO`, `NOTA_LEGAL`, `COR_NOTA_LEGAL`, `TAMANHO_DA_FONTE_NOTA_LEGAL`, `RODAPE`, `HEADER_LOGO`.

O GaaS preenche a partir dos rascunhos da régua: e-mail existente mantém os dele; e-mail novo herda do
e-mail anterior da mesma rede e troca o código do e-mail no link (S{semana}D{dia}) e na UTM (_EMAIL{n}_).
Se o arquivo trouxer algum desses campos, o valor é descartado com aviso.

## Supermercado e redes

- `{no_mercado}` vira "no Amigão", "no Avenida", "no Boa", "no Paraná"; Compre Mais e Superpão recebem
  "no seu supermercado" porque estão em transição de marca e não podem ser citadas.
- Não use `%%INVESTIDA%%`: ele traz o código da rede em caixa alta e sem acento.
- Texto diferente por rede vai em `networkOverrides` (raro; prefira um texto só com `{no_mercado}`).

## Faixa de limite (MENSAGEM_LIMITE)

- Formato "Abertura, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado ...". Só {{nome}} e {{limite}}.
- A abertura muda a cada e-mail, acompanhando a régua ("Boa notícia", "Seu cartão está mais perto",
  "Ainda dá tempo"...). Veja na régua as aberturas já usadas.
- Sem nome na base, o template tira ", {{nome}}" e a frase vira "Boa notícia: ...". Não comece com {{nome}}
  e não use palavra genérica no lugar do nome ("cliente").
- Nunca prometa aprovação: pré-aprovação segue sujeita a análise de crédito.

## Texto

- Só `<b>` e `<br>`, sem atributos, negrito sempre fechado, sem quebra de linha crua.
- Até 4000 caracteres por campo, contando o HTML que o segundo bloco gera.
- Reorganize sem mudar o sentido: pode quebrar parágrafo em itens, encurtar título, tirar repetição.
- Botões em caixa alta começando com verbo: PEÇA, PEDIR, SOLICITE, CONFIRA, APROVEITE, CONHEÇA, ACESSE,
  DESCUBRA, VEJA, COMECE, SAIBA, QUERO, FAÇA, BAIXE, ATIVE.
- Sem travessão. Frases curtas, concretas, do dia a dia de quem compra no mercado.

## Conferência final (mesmo sem rodar código)

1. Todo número, prazo e benefício está na ficha? Os fatos estão em `factsUsed`?
2. Assunto sem nome e com até ~50 caracteres? Header com até 34?
3. Faixa no formato certo e com abertura nova?
4. Nenhuma marca proibida, nenhum campo governado, nenhuma tag fora de <b> e <br>?
5. Segundo bloco simétrico e com formato diferente do e-mail anterior?
6. Status "draft" e `ruler` igual ao do pacote?