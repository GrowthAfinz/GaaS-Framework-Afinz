# QA editorial — régua Plurix, E-mails 3 a 8

Data: 2026-08-31  
Status: `needs_review`  
Escopo: 36 briefings (`6 sequências × 6 bandeiras`)

## Mapa gerencial da régua

| Sequência | Argumento único | Prova/benefício prioritário | Decisão de CTA |
|---|---|---|---|
| E-mail 3 | Migração do Clube para +amigo | Ofertas do Clube + acesso aos benefícios do cartão | Conhecer o +amigo + pedir o cartão |
| E-mail 4 | Saúde com Você Bem | Consultas desde R$ 50, exames desde R$ 10 e cobertura familiar | Pedir o cartão + conferir rede de saúde |
| E-mail 5 | Pontos e recompensas | Bloqueado: a peça antiga conflita com o guardrail atual do produto | Sem CTA até Produto/Marketing validar |
| E-mail 6 | Aceitação Visa + Vai de Visa | Gastronomia, eletrônicos, streaming, beleza, saúde e bem-estar | Pedir o cartão + conferir Vai de Visa |
| E-mail 7 | Clube versus cartão | Clube entrega ofertas/eventos; cartão adiciona descontos | Uma CTA de aquisição |
| E-mail 8 | Prova de preço no açougue | Simulação R$ 49,90 → R$ 43,90 → R$ 41,70 | Uma CTA de aquisição |

## Rastreabilidade por e-mail

As linhas abaixo se referem ao arquivo de referência fornecido no briefing operacional.

### E-mail 3

| Campo | Origem |
|---|---|
| `ASSUNTO`, `PRE_CABECALHO` | linhas 118–119 |
| `TITULO_COPY_1_AZUL`, `COPY_1_PRETO` | linhas 124–127 |
| `TITULO_CTA_1` | linhas 136–137 e 144 |
| `TITULO_COPY_2`, `COPY_2_PRETO`, `TITULO_CTA_2` | linhas 127 e 144–149 |
| `HEADER`, `BANNER_1_CORPO`, `BANNER_2_CORPO` pendentes | linhas 136–140 |

### E-mail 4

| Campo | Origem |
|---|---|
| `ASSUNTO`, `PRE_CABECALHO` | linhas 162–163 |
| `TITULO_COPY_1_AZUL`, `COPY_1_PRETO`, `TITULO_CTA_1` | linhas 168–177 e 186–187 |
| `TITULO_COPY_2`, `COPY_2_PRETO`, `TITULO_CTA_2` | linhas 198–214 |
| `HEADER`, `BANNER_1_CORPO`, `BANNER_2_CORPO` pendentes | linhas 186–194 |

### E-mail 5

| Campo | Origem |
|---|---|
| Tema e conteúdo legado sob validação | linhas 224–267 |
| Parceiros/recompensas que exigem revalidação | linhas 245–254 |
| Assets pendentes condicionados à validação | linhas 275–287 |

O texto do legado não foi promovido a promessa comercial. O vault atual registra que Plurix/+amigo não possui pontos; por isso o briefing explicita a pendência e permanece bloqueado para exportação.

### E-mail 6

| Campo | Origem |
|---|---|
| `ASSUNTO`, `PRE_CABECALHO` | linhas 303–304, com retirada da promessa de limite |
| `TITULO_COPY_1_AZUL`, `COPY_1_PRETO`, `TITULO_CTA_1` | linhas 309, 330–331 |
| `TITULO_COPY_2`, `COPY_2_PRETO`, `TITULO_CTA_2` | linhas 316–322 e 339 |
| Assets pendentes | linhas 330–340 |

### E-mail 7

| Campo | Origem |
|---|---|
| `ASSUNTO`, `PRE_CABECALHO` | linhas 360–361 |
| `TITULO_COPY_1_AZUL`, `COPY_1_PRETO`, `TITULO_CTA_1` | linhas 366–370 e 380–382 |
| `TITULO_COPY_2`, `COPY_2_PRETO` | linhas 367–369 e 387–396 |
| Assets pendentes | linhas 380–383 |

### E-mail 8

| Campo | Origem |
|---|---|
| `ASSUNTO`, `PRE_CABECALHO` | linhas 407–408 |
| `TITULO_COPY_1_AZUL`, `COPY_1_PRETO`, `TITULO_CTA_1` | linhas 413–416 e 428–430 |
| `TITULO_COPY_2`, `COPY_2_PRETO` | linhas 417–418 e 435–443 |
| Assets pendentes | linhas 428–431 |

## Fila consolidada de arte

| E-mail | Quantidade | Especificação |
|---|---:|---|
| 3 | 3 | Header 600 px de migração; banner 552 px da mudança; banner 552 px dos benefícios do cartão |
| 4 | 3 | Header 600 px Você Bem; banner 552 px das categorias; banner 552 px de preços e cobertura |
| 5 | 3 | Produção condicionada à confirmação do programa de pontos |
| 6 | 3 | Header 600 px Visa; banner 552 px das categorias Vai de Visa; banner 552 px de apoio ao CTA |
| 7 | 2 | Header 600 px comparativo; matriz comparativa 552 px |
| 8 | 2 | Header 600 px churrasco; comparação de preços 552 px |
| **Total** | **16 conceitos** | Cada conceito precisa de desdobramento/validação para as seis assinaturas quando houver marca da bandeira na arte |

## Evidências técnicas

- Template: 58 aberturas e 58 fechamentos AMPscript; 28 `IF` e 28 `ENDIF`.
- Nenhum texto fixo de CTA ou o antigo bloco “Peça agora...” permanece no ramo dos E-mails 2 a 8.
- 36/36 registros com `briefing_data.__id = id`, `status = needs_review` e `version = 2` após a atualização.
- Limites máximos observados: títulos 29/31; copies 169/186; CTAs 19/22.
- Zero `%%first_name%%`, quebras cruas ou CTAs iguais.
- O Test Send no SFMC continua sendo a certificação final.
