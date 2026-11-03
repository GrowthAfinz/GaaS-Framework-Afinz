---
tags: [operacao,whatsapp,copy,convencao,meta]
tipo: operacao
camada: operacao
atualizado: 2026-08-19
status: confirmado
fonte: pesquisa-externa
---

# Formatação de WhatsApp — variáveis e espaçamento

**Definição:** a convenção de merge field e de quebra de linha para copy de WhatsApp da Afinz. **Sobrepõe qualquer outra fonte do vault sobre merge fields de WhatsApp.**

> Corrigido pelo **Pablo Prado em 19/08/2026**, a partir da aba `Base Templates Meta` da planilha real de briefing.

## O erro que esta nota impede

Uma régua de 14 briefings foi entregue usando `%%FirstName%%` e `%%LIMITE_CRD%%` nas peças de WhatsApp. **Está errado.** Aquelas tags vieram de prints antigos de template — mas de **outro canal**. O WhatsApp da Afinz passa pelo Business Manager da Meta, e a Meta só aceita placeholder posicional numerado.

## 1. Variável é `{{n}}`, não `%%TAG%%`

| Canal | Sintaxe | Exemplo |
|---|---|---|
| **WhatsApp** | `{{1}}` `{{2}}` `{{3}}` — posicional numerado (padrão Meta) | `Oi, {{1}}, seu limite de R${{2}}...` |
| **E-mail (SFMC)** | `%%=v(@FirstName)=%%` | ver [[Emails-Dinamicos-SFMC]] |
| **SMS / Push** | `%%NOME%%`, `%%LIMITE_CRD%%` | confirmar com a ferramenta de disparo |

**Ordem convencionada:** `{{1}}` = nome · `{{2}}` = limite (ou limite **anterior**, se houver comparativo) · `{{3}}` = limite novo.

### Armadilha A — reusar o mesmo número

Se `{{1}}` é o nome, ele **não pode** também ser o limite mais adiante. Bug encontrado em peça real:

```
Oi, {{1}},
recapitulando o que te espera no cartão +amigo Afinz Visa: {{1}} de limite pré-aprovado,
```

Renderiza `Fernanda de limite pré-aprovado`. O segundo tinha que ser `{{2}}`.

→ Ao escrever, contar os slots **distintos** e numerar em ordem de aparição.

### Armadilha B — `R$` dentro e fora da variável

Decidir **uma vez por régua**: ou o valor chega já formatado com `R$` e a copy escreve `{{2}}`, ou chega cru e a copy escreve `R${{2}}`. Misturar gera `R$R$4.000` em metade dos disparos.

Peças reais da mesma régua têm as duas formas hoje. Precisa padronizar.

## 2. Espaçamento faz parte da copy

WhatsApp é lido no celular, em rolagem rápida. Bloco corrido não é lido. Padrão validado:

```
Oi, {{1}},

seu *cartão +amigo Afinz Visa* rende dentro do supermercado:
são 5% OFF pagando com ele, além de descontos exclusivos.

Seu limite de R${{2}} continua reservado. Peça agora!

Sujeito à análise de crédito.
```

1. **Vocativo sozinho na 1ª linha**, com quebra depois. Nunca emendado no corpo.
2. **Blocos curtos separados por linha em branco.** Um bloco, uma ideia.
3. **Quebra de linha dentro do bloco** quando a frase tem duas partes (o benefício e o detalhamento dele), mesmo sem linha em branco entre elas.
4. **CTA no fim do último bloco de conteúdo**, não isolado.
5. **Disclaimer sozinho na última linha**, separado por linha em branco.
6. **Negrito com asterisco simples** — `*cartão +amigo Afinz Visa*` — markdown nativo do WhatsApp. Só no **nome do produto**, nunca em frase inteira.

## 3. Como entregar a copy

Sempre dentro de **bloco de código**, com as quebras reais preservadas. Copy de WhatsApp colada como parágrafo de markdown perde o espaçamento e chega errada na ferramenta — foi exatamente o que aconteceu em 19/08/2026.

## 4. Outras regras de canal (evidência de peças reais)

- **CTA duplo obrigatório:** ação positiva + saída explícita *"Não tenho interesse agora"*. 11/11 peças reais, zero exceções.
- **Emoji varia por marca:** B2C usa bastante (🎉 🎁 💳 💙); **+amigo é zero emoji**, ênfase em CAIXA ALTA.
- Template de Marketing/Utility passa por **aprovação prévia da Meta** — não assumir liberdade total de texto.

## Relacionado

- [[Galeria-de-Templates]] · [[Dicionario-de-Produtos]] · [[Pode-Dizer-Nao-Pode-Dizer]]
- [[Emails-Dinamicos-SFMC]] · [[Plataformas-de-Comunicação]] · [[Template]] · [[Canais]]
- [[Motor-de-Briefing-Automatico]]
