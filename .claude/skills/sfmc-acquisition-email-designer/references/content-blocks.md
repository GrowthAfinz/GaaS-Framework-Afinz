# Blocos de conteúdo para os campos do briefing

Use sempre que o Pablo mandar a aba **Briefing Fábrica** (xlsx) com e-mails novos, ou pedir para
deixar o conteúdo de um e-mail dinâmico mais atrativo. O layout do conteúdo muda **dentro dos
campos de texto** (`COPY_1_PRETO`, `COPY_2_PRETO`), sem criar versão nova de template.

O HTML vem sempre de `scripts/content_blocks.py`. Não escreva tabela à mão: a régua só fica
padronizada se todo e-mail usar a mesma marcação, mudando apenas o texto.

## Fluxo com a aba Briefing Fábrica

1. Leia a aba por rótulo (coluna "Onde fica"), não por posição. Pule as linhas automáticas.
2. Converta o texto: negrito em `<b>`, quebra em `<br>`, `PRI_NOME%%` em `%%=v(@FirstName)=%%`,
   espaço invisível no começo removido. Texto escrito em campo de imagem (ex.: `BANNER_1_CORPO`)
   vai para o texto do bloco onde faz sentido.
3. Escolha o bloco pelo formato do conteúdo (tabela abaixo) e monte com `content_blocks.py`.
4. Reorganize sem mudar o sentido: pode quebrar parágrafo em itens, encurtar título longo,
   tirar frase repetida e padronizar botão em caixa alta. **Não** acrescente benefício, número,
   condição ou promessa que não esteja na planilha ou na ficha do produto.
5. Rode `check_size` em cada campo (limite 4000 caracteres da DE, sem quebra de linha crua).
6. Renderize antes e depois (desktop 680px e celular 390px) e mande as imagens com a lista de
   mudanças de texto. Só grave no GaaS depois da aprovação.

## Qual bloco usar

| Conteúdo da planilha | Bloco | Função |
|---|---|---|
| 3 a 6 benefícios com título e explicação ("**Mais prazo:** até 40 dias...") | Grade de benefícios | `benefit_grid([(titulo, descricao)])` |
| 2 ou 3 benefícios que são números (+5%, 40 dias, 70%) | Números em destaque | `stat_tiles([(numero, legenda)])` |
| Lista curta de vantagens sem explicação | Lista com check | `check_list([texto])` |
| Como pedir, passo a passo | Passo a passo | `steps([(titulo, descricao)])` |
| Frase que apresenta o bloco | Abertura | `lead(texto)` |
| Chamada antes do botão | Fechamento | `closing(texto)` |

## Faixa de limite (MENSAGEM_LIMITE)

- **A saudação muda a cada e-mail, acompanhando o avanço da régua.** Não repita a mesma abertura
  em todos. Exemplo da V2 TOPO DE FUNIL DINÂMICO:
  - E-mail 1: "Boa notícia, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo."
  - E-mail 2: "Seu cartão está mais perto, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado no cartão +amigo."
  - E-mail 3: "Ainda dá tempo, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado para pedir seu cartão +amigo."
- Use o padrão "Abertura, {{nome}}: ..." (nome depois da vírgula). Sem nome na base, o template tira
  ", {{nome}}" e a frase vira "Boa notícia: ...". Não comece a frase com {{nome}}: sem nome, ela
  começaria em minúscula (a Fábrica avisa).
- Não use palavra genérica no lugar do nome (ex.: "cliente").
- Nunca prometa aprovação garantida ou disponibilidade: pré-aprovação segue sujeita a análise.

## Regras visuais

- Título do segundo bloco: uma ideia, sem negrito interno (o título já é negrito), até ~50
  caracteres; tamanho 24 quando passar de uma linha.
- Lista centralizada não funciona: itens vão sempre alinhados à esquerda, em grade ou lista.
- **Todo elemento novo precisa ficar simétrico visualmente.** Cartões, quadros e colunas lado a lado
  têm a mesma altura e o mesmo alinhamento interno: cada um é uma célula da mesma linha da tabela
  (nunca uma tabela separada por item, que cresce só até o próprio texto). Espaço entre eles com
  `cellspacing`; no celular, `stack-column` empilha e a `margin-bottom` da célula separa.
- Textos paralelos com tamanhos parecidos: títulos de cartão até ~26 caracteres (cabem em uma
  linha) e legendas de número com comprimento próximo. Confira na imagem do antes e depois.
- Antes de entregar, olhe a renderização desktop e celular procurando assimetria (alturas,
  alinhamentos, espaçamentos diferentes entre itens iguais).
- Botões em caixa alta, começando com verbo.
- Paleta fixa: azul `#2C3490`, amarelo `#E7A921`, fundo de cartão `#F4F5FB`, borda `#E1E3F2`,
  texto de apoio `#4A4F6A`.
- A grade usa a classe `stack-column`: duas colunas no desktop, uma no celular (V13 em diante).
- Não use emoji nem imagem de ícone: o selo é HTML (círculo amarelo com ✓ ou número).

## Pontos do template que não se resolvem no campo

Avise na entrega, sem tentar contornar pelo texto:
- nome repetido entre o título ("Olá, Vania!") e a faixa de limite;
- logo +amigo no topo e de novo dentro do header dinâmico;
- bloco fixo "Peça agora seu cartão +amigo" do E-mail 2, alinhado à esquerda.
