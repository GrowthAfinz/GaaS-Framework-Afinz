---
tags: [dimensao,plurix,bandeira,parceiro,emails-dinamicos]
tipo: dimensao
camada: dados
atualizado: 2026-10-02
status: confirmado
fonte: html-legado-sfmc + de-crm-topo-funil
---

# Bandeiras Plurix

**Definição (1 frase precisa, para IA):** as 6 redes de supermercado da holding Plurix que vendem o mesmo cartão `+amigo`; cada uma tem rodapé, deeplink e site próprios, mas compartilham marca, cores e estrutura de e-mail.

## Por que esta dimensão existe

`Plurix` é tratada como **BU** em [[BUs]], mas não é um parceiro único. É uma holding. O cartão vendido é sempre o `+amigo` — a mesma marca, o mesmo app, o mesmo azul. O que muda por bandeira é a **assinatura de varejo**: qual supermercado aparece no rodapé e para qual deeplink o botão aponta.

Essa distinção é o que permite **um único e-mail dinâmico servir as 6** (ver [[Emails-Dinamicos-Plurix]]). Se as bandeiras tivessem cartões de marca própria — como acontece em [[Parceiros]] B2B2C (`Bem Barato` → *Bem Mais Afinz Visa*) — seria necessário um template por bandeira.

## Valores reais

Campo de origem na DE do CRM: `INVESTIDA`. Campo de destino no SFMC: `PRODUTO` (audiência) e `NM_PRODUTO_INTERNO` (briefing).

| `INVESTIDA` (origem) | `PRODUTO` (SFMC) | slug | Nome comercial |
|---|---|---|---|
| `Amigao` | `AMIGAO` | `amigao` | Amigão Supermercados |
| `Boa` | `BOA` | `boa` | Boa Supermercados |
| `Avenida` | `AVENIDA` | `avenida` | Supermercados Avenida |
| `Compre Mais` | `COMPRE MAIS` | `compremais` | Compre Mais Supermercados |
| `Parana` | `PARANA` | `parana` | Paraná Supermercados |
| `Superpao` | `SUPERPAO` | `superpao` | Superpão Supermercados |

> **Convenção de nomenclatura:** `NM_PRODUTO_INTERNO` usa **nome puro, sem prefixo de BU**, seguindo o padrão já existente em `TB_BRIEFING_JORNADAS` (`INSTITUCIONAL`, `BEM BARATO`, `ALVORADA`). Não usar `PLURIX_AMIGAO`. A BU não entra na chave composta — ela é rastreada pelo `activity_name` e pelo framework do GaaS.

## Volume — snapshot 2026-03-05 (DE `CRM_PLURIX_202603_GC1`, topo de funil)

| Bandeira | Base | Endereçáveis por e-mail | Aproveitamento |
|---|---:|---:|---:|
| Amigão | 45.953 | 30.891 | 67,2% |
| Boa | 15.764 | 14.427 | 91,5% |
| Avenida | 14.870 | 12.847 | 86,4% |
| Compre Mais | 11.457 | 9.553 | 83,4% |
| Paraná | 4.445 | 2.947 | 66,3% |
| Superpão | 2.777 | 2.413 | 86,9% |
| **Total** | **95.266** | **73.078** | **76,7%** |

⚠️ **Amigão concentra o volume e o pior aproveitamento** — 15 mil pessoas na base sem canal de e-mail elegível. É problema de higiene de cadastro, não de e-mail. Maior ganho disponível sem custo de mídia.

## Assets por bandeira (usados no briefing)

Base de URLs:
- `V2` = `https://stoplxmkt.blob.core.windows.net/plxmkt/20250625-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ-V2`
- `BF` = `https://stoplxmkt.blob.core.windows.net/plxmkt`

| Bandeira | Rodapé (`BANNER_3_CORPO`) | Site (`LINK_BANNER_3_CORPO`) | Deeplink OneLink |
|---|---|---|---|
| Amigão | `V2/footer-amigao.png` | `https://www.amigao.com/` | `.../OfSm/fhmnfq0n` |
| Boa | `BF/20241125-EM-BOA-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-hd.png` | `https://www.boasupermercados.com.br/` | `.../OfSm/21tz9kvu` |
| Avenida | `BF/20241125-EM-AVE-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-avenida.png` | `https://loja.supermercadosavenida.com.br/` | `.../OfSm/igg3hn81` |
| Compre Mais | `BF/20241125-EM-CPM-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-compre-mais.png` | `https://www.somoscompremais.com.br/` | `.../OfSm/cvfabp9o` |
| Paraná | `V2/footer-parana.png` | `https://www.paranasupermercados.com.br` | `.../OfSm/8qywzwt2` |
| Superpão | `BF/20241125-EM-SPO-TEMPLATE-BLACK_FRIDAY_BANCO_DE_OFERTAS/footer-superpao.png` | `https://loja.superpao.com.br/` | `.../OfSm/hn04qjlj` |

Prefixo completo do deeplink: `https://mais-amigo.onelink.me`

**Os 6 deeplinks são distintos e carregam a atribuição da bandeira.** Trocar um pelo outro não gera erro visível — o e-mail renderiza normalmente e a conversão é atribuída à bandeira errada. Conferência obrigatória no Test Send.

### Variações de imagem (não são iguais entre bandeiras)

| Bandeira | `HEADER` | `BANNER_1_CORPO` (benefícios) |
|---|---|---|
| Boa | `V2/semana-01/header-semana1-i2.png` | `V2/semana-01/beneficios-cartao-flv-semana1-i2.png` — versão **FLV** (frutas/legumes/verduras) |
| Compre Mais | `V2/semana-01/header-compre-mais-semana-1.png` — header **próprio** (migração de clube) | `V2/semana-01/banner-cartao-basicos.png` |
| Amigão, Avenida, Paraná, Superpão | `V2/semana-01/header-semana1-i2.png` | `V2/semana-01/beneficios-cartao-basicos-semana1-i2.png` |

Constante para todas: `BANNER_2_CORPO` = `V2/semana-01/como-solicitar-cartao.png`

### Identidade visual compartilhada (chumbada no HTML, não é dado)

| Elemento | Valor |
|---|---|
| Logo topo | `BF/20240513-EM-JORNADA_DE_AQUISICAO_MAIS_AMIGO-AFINZ/logo-mais-amigo.png` (190px) |
| Link do logo | `https://clubemaisamigo.com.br` |
| Azul +amigo (botões, títulos) | `#2C3490` |
| Lavanda (faixa do bloco 2) | `#D1D4EB` |
| Cinza de fundo (bloco 1) | `#efefef` |
| Cinza do rodapé legal | `#EBEBEB` |
| Fonte | DM Sans |

> Estes 4 valores de cor + o logo são **o que impede** o template de servir também B2B2C. Ver [[Emails-Dinamicos-Plurix]] §Escala.

## Segmentos cruzados

A DE de origem traz `SEGMENTO` com 8 valores: `Leal`, `Pre Churn`, `Recorrente`, `Churn`, `Ocasional`, `Frequente`, `Novo Explorador`, `Sem Segmento`. Ver [[Segmentos]].

**Decisão:** o segmento **não entra na chave composta**. A copy é idêntica para todos os segmentos; o segmento viaja apenas no `activity_name` (coluna `CAMPANHA`), permitindo leitura de resultado por segmento sem multiplicar o briefing por 8.

## Relacionado
- [[Emails-Dinamicos-Plurix]] · [[Emails-Dinamicos-SFMC]] · [[BUs]] · [[Parceiros]] · [[Segmentos]] · [[Topo-de-Funil]]

## Aplicação operacional — revisão editorial 02/10/2026

### Lista comercial versus configuração de comunicação

As seis linhas desta nota descrevem o recorte operacional histórico de assinaturas. A pesquisa comercial em [[Cartao-Amigo-Afinz-Visa]] menciona oito redes, incluindo Mega e Dom Olívio. Não importar automaticamente as duas para a Fábrica nem universalizar desconto/escopo por pertencerem ao Clube.

### Marca nas novas peças

Consulta ao guardrail ativo de +amigo em 02/10 confirmou: Compre Mais e Superpão comunicam apenas como +amigo no escopo de todos os oito e-mails da régua até definição de nova marca. Amigão, Boa, Paraná e Avenida conservam nome próprio no registro. Assets e URLs antigos acima permanecem históricos; não autorizam reutilizar rodapé ou marca bloqueada. Chaves técnicas devem ser preservadas ou migradas explicitamente; trocar nome visual não altera por si só a DE.

### Lacunas

Faltam validação atual dos ativos, nome novo das duas redes e confirmação operacional de inclusão de redes adicionais. Volumes de março não representam audiência atual. Próximo passo: [[Ficha-de-Produto-Guia]] → [[Servico-Emails-Dinamicos]].
