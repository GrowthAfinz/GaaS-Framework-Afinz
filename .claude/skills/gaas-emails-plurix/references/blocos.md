# Segundo bloco: catálogo

O segundo bloco (`COPY_2_PRETO`) é montado pelo GaaS a partir de `secondBlock`, uma lista de blocos.
Você manda dados; o HTML sai sempre igual, com tabelas que funcionam no Outlook e empilham no celular.
`scripts/content_blocks.py` gera exatamente o mesmo HTML do GaaS.

| Conteúdo | Bloco | Regra |
|---|---|---|
| Frase que apresenta o bloco | `lead` | Centralizada. Aceita <b>. |
| 2 a 6 benefícios com título e explicação | `benefit_grid` | Número par de itens. Título até ~26 caracteres, sem HTML; explicação aceita <b>. |
| 2 ou 3 benefícios que são números | `stat_tiles` | 2 ou 3 itens; legendas com comprimento parecido. Sem HTML. |
| Lista curta de vantagens | `check_list` | Itens alinhados à esquerda, aceitam <b>. |
| Como pedir, passo a passo | `steps` | O GaaS numera. Sem HTML. |
| Chamada antes do botão | `closing` | Curta, em destaque. |

## Regras visuais

- Varie o formato em relação ao e-mail anterior da régua (o GaaS avisa quando repete).
- Tudo simétrico: cartões e quadros lado a lado têm a mesma altura porque são células da mesma linha;
  mantenha textos paralelos com tamanhos parecidos para não sobrar espaço vazio.
- Lista centralizada não funciona: itens sempre alinhados à esquerda, em grade ou lista.
- Sem emoji e sem imagem de ícone: o selo é HTML (círculo amarelo com check ou número).
- Paleta fixa do bloco: azul #2C3490, amarelo #E7A921, fundo #F4F5FB, borda #E1E3F2, texto #4A4F6A.

## Exemplos (formato do arquivo)

### lead

```json
{
  "type": "lead",
  "text": "Com o <b>cartão de crédito +amigo</b>, você conta com:"
}
```

### benefit_grid

```json
{
  "type": "benefit_grid",
  "items": [
    {
      "title": "Visa no Brasil e no mundo",
      "text": "Mais possibilidades de uso e o <b>Programa Vai de Visa</b>, com promoções, descontos, sorteios e benefícios exclusivos."
    },
    {
      "title": "Desconto extra no mercado",
      "text": "<b>+5% de desconto extra</b> em produtos selecionados nas redes participantes."
    },
    {
      "title": "Mais prazo para pagar",
      "text": "<b>Até 40 dias</b>, conforme a data da compra e o vencimento da fatura."
    },
    {
      "title": "Desconto em saúde",
      "text": "<b>Até 70% de desconto</b> em consultas, exames e medicamentos pelo Programa Você Bem."
    }
  ]
}
```

### stat_tiles

```json
{
  "type": "stat_tiles",
  "items": [
    {
      "number": "+5%",
      "label": "OFF em produtos selecionados"
    },
    {
      "number": "40 dias",
      "label": "para pagar"
    },
    {
      "number": "70%",
      "label": "OFF em consultas e exames"
    }
  ]
}
```

### check_list

```json
{
  "type": "check_list",
  "items": [
    "<b>A partir de 5% de desconto</b> em produtos selecionados.",
    "<b>Até 40 dias para pagar</b>: mais flexibilidade para você.",
    "<b>Até 70% de desconto</b> em consultas, exames e medicamentos.",
    "<b>Benefícios com Visa</b>: aceito no Brasil e no mundo, com acesso a promoções, descontos, sorteios e benefícios exclusivos."
  ]
}
```

### steps

```json
{
  "type": "steps",
  "items": [
    {
      "title": "Peça pelo app",
      "text": "Leva poucos minutos."
    },
    {
      "title": "Aguarde a análise",
      "text": "Você recebe a resposta no app."
    },
    {
      "title": "Use o cartão virtual",
      "text": "Se aprovado, ele aparece no app na hora."
    }
  ]
}
```

### closing

```json
{
  "type": "closing",
  "text": "Peça seu cartão +amigo e aproveite!"
}
```