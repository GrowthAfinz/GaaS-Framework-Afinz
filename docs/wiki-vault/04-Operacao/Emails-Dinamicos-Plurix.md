---
tags: [operacao,sfmc,crm,emails-dinamicos,ampscript,plurix,topo-de-funil]
tipo: operacao
camada: operacao
atualizado: 2026-10-06
status: confirmado
fonte: html-legado-sfmc + de-crm-topo-funil + template-institucional
---

# Emails Dinâmicos — Implementação Plurix (+amigo)

**Definição (1 frase precisa, para IA):** implementação do motor de e-mail dinâmico do SFMC para a BU Plurix, em que **um único e-mail no Content Builder serve as 6 bandeiras de supermercado** porque rodapé, deeplink e imagens de cada bandeira viajam como colunas do briefing em vez de estarem no HTML.

> Esta nota é **autocontida e reprodutível**. Um agente sem contexto prévio deve conseguir reconstruir a implementação inteira lendo apenas ela + [[Bandeiras-Plurix]] + [[Emails-Dinamicos-SFMC]]. Todo valor, nome de coluna e trecho de código aqui é literal.

---

## 1. Problema

Plurix vende o cartão `+amigo` através de 6 redes de supermercado (ver [[Bandeiras-Plurix]]). No modelo legado existia **um arquivo HTML por bandeira**, mantido à mão. Comparando os 6 arquivos reais, as diferenças eram: o rodapé, o deeplink do app, e em 2 casos uma imagem. Estrutura, cores, textos legais e layout eram byte-a-byte iguais.

Custo desse modelo: correção de bug precisa ser replicada 6 vezes; campanha nova precisa de 6 HTMLs novos.

**Solução:** transformar as diferenças em dado. `NM_PRODUTO_INTERNO` passa a carregar a bandeira, entrando na chave composta que já existia. O rodapé de cada bandeira ocupa `BANNER_3_CORPO`, coluna que estava vazia em 100% das linhas do institucional.

**Nenhuma coluna nova foi criada.** As 36 do institucional bastaram.

---

## 2. Arquitetura — 4 camadas

```
CAMADA 0 — DE de origem do CRM (ex.: CRM_PLURIX_202603_GC1)
  95.266 pessoas · 11 colunas · não vai para o SFMC nesse formato
        │  script de carga (filtra + renomeia)
        ▼
CAMADA 1 — TB_CAMPANHA_AQUISICAO ............ QUEM RECEBE
  73.078 linhas por sequência · 10 colunas · entrada da jornada
  1 linha = 1 pessoa em 1 sequência
        │  chave composta: PRODUTO + TP_CAMPANHA + SEQUENCIA
        ▼
CAMADA 2 — TB_BRIEFING_CAMPANHA_AQUISICAO ... O QUE É ENVIADO
  12 linhas · 36 colunas
  1 linha = 1 e-mail completo de 1 bandeira em 1 sequência
        │  LookupOrderedRows + validação de vigência
        ▼
CAMADA 3 — E-mail dinâmico (Content Builder)
  1 template · 42 variáveis AMPscript · 17 blocos condicionais
```

**A jornada não escolhe conteúdo.** Ela decide apenas quem entra. Quem escolhe o conteúdo é a chave composta. Essa separação é o que permite 2 jornadas (uma por sequência) servirem 6 bandeiras.

---

## 3. Camada 0 — DE de origem

Colunas: `CPF, PHONE, LOCALE, EMAIL, FIRST_NAME, INVESTIDA, SEGMENTO, SO_EMAIL, SO_PHONE, AMBOS, ID_LINHA`

Mapeamento para a Camada 1:

| Origem | Destino | Observação |
|---|---|---|
| `CPF` | `CPF` | único na origem (95.266 distintos, 0 repetidos) |
| `FIRST_NAME` | `PRI_NOME` | 100% preenchido |
| `EMAIL` | `EMAIL` | 86,2% preenchido |
| `PHONE` | `CELULAR` | não usado no e-mail |
| `LOCALE` | `LOCAL` | sempre `br` |
| `INVESTIDA` | `PRODUTO` | **a bandeira** — ver tabela de normalização em [[Bandeiras-Plurix]] |
| `SEGMENTO` | dentro de `CAMPANHA` | não entra na chave |
| `SO_EMAIL` / `SO_PHONE` / `AMBOS` | filtro de corte | não são gravados |
| `ID_LINHA` | descartado | controle do CRM |
| — | `LIMITE` | **vazio** — não existe no topo de funil |
| — | `TP_CAMPANHA` | constante `Topo de Funil` |
| — | `SEQUENCIA` | `E-mail 1` / `E-mail 2` |

### Regra de elegibilidade (crítica)

```
elegivel = EMAIL preenchido
           AND (AMBOS = "SIM" OR SO_EMAIL = "SIM")
           AND EMAIL casa com regex de e-mail válido
           AND INVESTIDA está no dicionário de bandeiras
```

| Etapa | Pessoas |
|---|---:|
| Base bruta | 95.266 |
| − sem e-mail | −13.130 |
| − com e-mail mas **sem flag de canal** | −9.058 |
| **Endereçáveis** | **73.078** |

⚠️ **Filtrar apenas por "EMAIL não vazio" dispara para 9.058 pessoas indevidamente.** As flags de canal são a fonte de verdade, não o preenchimento do campo.

### Três diferenças estruturais vs. o protótipo institucional

1. **`LIMITE` não existe.** Topo de funil não tem limite pré-aprovado. `@LimiteNovo` chega vazio no e-mail — nenhuma copy pode prometer valor.
2. **`CPF` é único nas duas pontas — origem e Camada 1.** `TB_CAMPANHA_AQUISICAO` tem **1 linha por pessoa**, com `CPF` como chave primária. A `SEQUENCIA` é **campo de estado mutável**: quem avança a régua é o `Update Contact` da jornada, atualizando a linha no lugar, não uma carga nova.

   > **Correção 2026-08-19.** A versão anterior desta nota afirmava que `CPF` não era único e que era preciso um arquivo de carga por sequência. Isso estava errado — a duplicidade observada veio de testes fechados iniciais com CPFs fabricados, não do modelo de produção. Consequência prática: **um único arquivo de audiência**, e a régua avança dentro da própria DE.
3. **`INVESTIDA` não tem equivalente no institucional**, onde `PRODUTO` é sempre `INSTITUCIONAL`.

---

## 4. Camada 1 — `TB_CAMPANHA_AQUISICAO` (10 colunas)

| # | Coluna | Valor Plurix | Papel |
|---|---|---|---|
| 1 | `CPF` | da origem | **chave primária**, 1 linha por pessoa → `@SubscriberKey` |
| 2 | `PRI_NOME` | da origem | → `@FirstName`, usado na copy |
| 3 | `EMAIL` | da origem | **relação de assinante** — o envio sai por aqui |
| 4 | `CELULAR` | da origem | reservado para SMS/WhatsApp |
| 5 | `LOCAL` | `br` | não usado |
| 6 | `LIMITE` | **vazio** | → `@LimiteNovo` |
| 7 | `PRODUTO` | `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA`, `SUPERPAO` | **chave 1/3** |
| 8 | `TP_CAMPANHA` | `Topo de Funil` | **chave 2/3** + filtro da jornada |
| 9 | `SEQUENCIA` | `E-mail 1` / `E-mail 2` | **chave 3/3** + filtro da jornada · **campo de estado**, avançado in-place pelo `Update Contact` |
| 10 | `CAMPANHA` | `afz_aqs_{slug}_reg_cart_email_{segmento}{n}_diario` | activity_name — ver [[Taxonomia-Activity-Name]] |

A coluna `CAMPANHA` está **vazia em todos os exemplos do institucional**. Na implementação Plurix ela carrega o segmento normalizado (minúsculo, sem acento, sem espaço) + o número da sequência. Exemplo: `afz_aqs_amigao_reg_cart_email_prechurn1_diario`.

---

## 5. Camada 2 — `TB_BRIEFING_CAMPANHA_AQUISICAO` (36 colunas)

Ordem literal das colunas no CSV:

```
DT_INICIO, DT_FIM, UTM_CAMPANHA, TP_CAMPANHA, SEQUENCIA, ASSUNTO, PRE_CABECALHO, HEADER,
CARTAO_NM_COMERCIAL, NM_PRODUTO_INTERNO, TITULO_COPY_1_AZUL, COR_COPY_1,
TAMANHO_DA_FONTE_TITULO_COPY_1, TITULO_CTA_1, LINK_CTA_1, COPY_1_PRETO, COR_COPY_PRETO_1,
TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1, TITULO_COPY_2, COR_TITULO_COPY_2,
TAMANHO_DA_FONTE_TITULO_COPY_2, COPY_2_PRETO, COR_COPY_2, TAMANHO_DA_FONTE_COPY_2,
TITULO_CTA_2, LINK_CTA_2, BANNER_1_CORPO, LINK_BANNER_1_CORPO, BANNER_2_CORPO,
LINK_BANNER_2_CORPO, BANNER_3_CORPO, LINK_BANNER_3_CORPO, NOTA_LEGAL, COR_NOTA_LEGAL,
TAMANHO_DA_FONTE_NOTA_LEGAL, RODAPE
```

### Rastreamento completo: coluna → variável → onde age

| # | Coluna | Variável | Onde age no e-mail | Eixo |
|---|---|---|---|---|
| 1 | `DT_INICIO` | `@DtInicio` | validação de vigência | fixa |
| 2 | `DT_FIM` | `@DtFim` | validação de vigência | fixa |
| 3 | `UTM_CAMPANHA` | — | **nunca lida** ⚠ (ver §11) | bandeira × seq |
| 4 | `TP_CAMPANHA` | — | chave do lookup | fixa |
| 5 | `SEQUENCIA` | — | chave do lookup | sequência |
| 6 | `ASSUNTO` | `@Assunto` | `<title>` + campo Assunto do CB | sequência |
| 7 | `PRE_CABECALHO` | `@PreCabecalho` | div oculta + campo Pré-cabeçalho do CB | sequência |
| 8 | `HEADER` | `@Header` | imagem topo, 600px | bandeira |
| 9 | `CARTAO_NM_COMERCIAL` | `@CartaoNmComercial` | `alt` do header | fixa |
| 10 | `NM_PRODUTO_INTERNO` | — | chave do lookup | bandeira |
| 11 | `TITULO_COPY_1_AZUL` | `@TituloCopy1` | `<h1>` bloco 1 | sequência |
| 12 | `COR_COPY_1` | `@CorCopy1` | cor do `<h1>` | fixa |
| 13 | `TAMANHO_DA_FONTE_TITULO_COPY_1` | `@TamanhoFonteTituloCopy1` | tamanho do `<h1>` | fixa |
| 14 | `TITULO_CTA_1` | `@TituloCTA1` | rótulo do botão 1 | sequência |
| 15 | `LINK_CTA_1` | `@LinkCTA1` | `href` do botão 1 via `RedirectTo` | bandeira |
| 16 | `COPY_1_PRETO` | `@Copy1Preto` | parágrafo bloco 1 | sequência |
| 17 | `COR_COPY_PRETO_1` | `@CorCopyPreto1` | cor do parágrafo | fixa |
| 18 | `TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1` | `@TamanhoFonteCopyPreto1` | tamanho do parágrafo | fixa |
| 19 | `TITULO_COPY_2` | `@TituloCopy2` | `<h2>` faixa lavanda | sequência |
| 20 | `COR_TITULO_COPY_2` | `@CorTituloCopy2` | cor do `<h2>` | fixa |
| 21 | `TAMANHO_DA_FONTE_TITULO_COPY_2` | `@TamanhoFonteTituloCopy2` | tamanho do `<h2>` | fixa |
| 22 | `COPY_2_PRETO` | `@Copy2Preto` | parágrafo faixa lavanda | sequência |
| 23 | `COR_COPY_2` | `@CorCopy2` | cor | fixa |
| 24 | `TAMANHO_DA_FONTE_COPY_2` | `@TamanhoFonteCopy2` | tamanho | fixa |
| 25 | `TITULO_CTA_2` | `@TituloCTA2` | rótulo do botão 2 | sequência |
| 26 | `LINK_CTA_2` | `@LinkCTA2` | `href` do botão 2 | bandeira |
| 27 | `BANNER_1_CORPO` | `@Banner1Corpo` | imagem de benefícios, 552px | bandeira |
| 28 | `LINK_BANNER_1_CORPO` | `@LinkBanner1` | `href` da imagem de benefícios | bandeira |
| 29 | `BANNER_2_CORPO` | `@Banner2Corpo` | imagem "como solicitar", 552px | fixa |
| 30 | `LINK_BANNER_2_CORPO` | `@LinkBanner2` | `href` do "como solicitar" | bandeira |
| 31 | `BANNER_3_CORPO` | `@Banner3Corpo` | **rodapé da bandeira**, 600px | bandeira |
| 32 | `LINK_BANNER_3_CORPO` | `@LinkBanner3` | `href` do rodapé → site | bandeira |
| 33 | `NOTA_LEGAL` | `@NotaLegal` | texto legal | fixa |
| 34 | `COR_NOTA_LEGAL` | `@CorNotaLegal` | cor | fixa |
| 35 | `TAMANHO_DA_FONTE_NOTA_LEGAL` | `@TamanhoFonteNotaLegal` | tamanho | fixa |
| 36 | `RODAPE` | `@Rodape` | assinatura da bandeira | bandeira |

**32 das 36 colunas são lidas.** Das 4 restantes, 3 são a chave (filtram, não renderizam) e 1 é `UTM_CAMPANHA`, que é lacuna real.

---

## 6. Os quatro eixos de variação

Classificando as 36 colunas por **o que faz o valor mudar** — este é o núcleo conceitual do framework:

| Eixo | Nº | Colunas |
|---|---:|---|
| **Fixa** | 15 | cores, tamanhos, nota legal, vigência, `BANNER_2_CORPO`, `TP_CAMPANHA`, `CARTAO_NM_COMERCIAL` |
| **Varia por bandeira** | 11 | `HEADER`, `NM_PRODUTO_INTERNO`, `LINK_CTA_1/2`, `BANNER_1_CORPO`, `LINK_BANNER_1/2/3_CORPO`, `BANNER_3_CORPO`, `RODAPE` |
| **Varia por sequência** | 9 | `SEQUENCIA`, `ASSUNTO`, `PRE_CABECALHO`, `TITULO_COPY_1_AZUL`, `TITULO_CTA_1`, `COPY_1_PRETO`, `TITULO_COPY_2`, `COPY_2_PRETO`, `TITULO_CTA_2` |
| **Varia por bandeira × sequência** | 1 | `UTM_CAMPANHA` |

**Leitura útil: identidade e mensagem são independentes.** Trocar a copy de uma sequência mexe em 9 colunas e não toca em nenhum rodapé. Trocar o rodapé de uma bandeira mexe em 1 coluna e não toca em nenhuma copy.

**Custo escondido:** as 11 colunas de bandeira estão repetidas em cada sequência. Com 2 sequências, o deeplink de uma bandeira aparece em 8 lugares (2 linhas × 4 campos de link). Desnormalização consciente — ver §11.

---

## 7. O AMPscript (verbatim, reprodutível)

Bloco idêntico ao do e-mail institucional. **A única diferença entre os dois e-mails é o HTML depois de `]%%`.**

```ampscript
%%[
/* 1. Captura de Variáveis do Destinatário (TB_CAMPANHA_AQUISICAO) */
SET @SubscriberKey = [CPF]
SET @FirstName = [PRI_NOME]
SET @LimiteNovo = [LIMITE]
SET @Produto = [PRODUTO]
SET @Sequencia = [SEQUENCIA]
SET @TpCampanha = [TP_CAMPANHA]

/* 2. Busca na DE de Briefing com Filtro de Chave Composta e Vigência */
SET @Today = NOW()
SET @BriefingRows = LookupOrderedRows(
    "TB_BRIEFING_CAMPANHA_AQUISICAO",
    1,
    "DT_INICIO DESC",
    "NM_PRODUTO_INTERNO", @Produto,
    "SEQUENCIA", @Sequencia,
    "TP_CAMPANHA", @TpCampanha
)
SET @RowCount = RowCount(@BriefingRows)

IF @RowCount > 0 THEN
    SET @Row = Row(@BriefingRows, 1)

    /* Validação de Vigência da Campanha */
    SET @DtInicio = Field(@Row, "DT_INICIO")
    SET @DtFim = Field(@Row, "DT_FIM")

    IF @Today >= @DtInicio AND @Today <= @DtFim THEN

        SET @Assunto = Field(@Row, "ASSUNTO")
        SET @PreCabecalho = Field(@Row, "PRE_CABECALHO")
        SET @Header = Field(@Row, "HEADER")
        SET @CartaoNmComercial = Field(@Row, "CARTAO_NM_COMERCIAL")

        SET @TituloCopy1 = Field(@Row, "TITULO_COPY_1_AZUL")
        SET @CorCopy1 = Field(@Row, "COR_COPY_1")
        SET @TamanhoFonteTituloCopy1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_1")
        SET @Copy1Preto = Field(@Row, "COPY_1_PRETO")
        SET @CorCopyPreto1 = Field(@Row, "COR_COPY_PRETO_1")
        SET @TamanhoFonteCopyPreto1 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1")
        SET @TituloCTA1 = Field(@Row, "TITULO_CTA_1")
        SET @LinkCTA1 = Field(@Row, "LINK_CTA_1")

        SET @TituloCopy2 = Field(@Row, "TITULO_COPY_2")
        SET @CorTituloCopy2 = Field(@Row, "COR_TITULO_COPY_2")
        SET @TamanhoFonteTituloCopy2 = Field(@Row, "TAMANHO_DA_FONTE_TITULO_COPY_2")
        SET @Copy2Preto = Field(@Row, "COPY_2_PRETO")
        SET @CorCopy2 = Field(@Row, "COR_COPY_2")
        SET @TamanhoFonteCopy2 = Field(@Row, "TAMANHO_DA_FONTE_COPY_2")
        SET @TituloCTA2 = Field(@Row, "TITULO_CTA_2")
        SET @LinkCTA2 = Field(@Row, "LINK_CTA_2")

        SET @Banner1Corpo = Field(@Row, "BANNER_1_CORPO")
        SET @LinkBanner1 = Field(@Row, "LINK_BANNER_1_CORPO")
        SET @Banner2Corpo = Field(@Row, "BANNER_2_CORPO")
        SET @LinkBanner2 = Field(@Row, "LINK_BANNER_2_CORPO")
        SET @Banner3Corpo = Field(@Row, "BANNER_3_CORPO")
        SET @LinkBanner3 = Field(@Row, "LINK_BANNER_3_CORPO")

        SET @NotaLegal = Field(@Row, "NOTA_LEGAL")
        SET @CorNotaLegal = Field(@Row, "COR_NOTA_LEGAL")
        SET @TamanhoFonteNotaLegal = Field(@Row, "TAMANHO_DA_FONTE_NOTA_LEGAL")
        SET @Rodape = Field(@Row, "RODAPE")

    ELSE
        RaiseError("Campanha fora do prazo de vigência.", true)
    ENDIF
ELSE
    RaiseError("Dados de briefing da campanha não encontrados.", true)
ENDIF
]%%
```

### Duas funções de saída, papéis distintos

| Função | Uso | Por quê |
|---|---|---|
| `%%=v(@X)=%%` | cores, tamanhos, URLs de imagem | imprime o valor cru |
| `%%=TreatAsContent(@X)=%%` | todo campo de texto | **reprocessa o valor como AMPscript** — é o que faz `%%=v(@FirstName)=%%` gravado dentro de uma célula do CSV resolver no envio |
| `%%=RedirectTo(TreatAsContent(@X))=%%` | todo `href` | tracking de clique do SFMC + resolve AMPscript embutido na URL |

Sem `TreatAsContent`, a personalização escrita na planilha sairia literal para o cliente.

---

## 8. Estrutura do HTML (spec reprodutível)

Arquivo literal: `SFMC_PLURIX_IMPLANTACAO/03_email_dinamico_plurix.html`

Container: `<table>` 600px, centralizado, fundo branco. Fonte DM Sans com fallback Arial.
**17 blocos `%%[ IF NOT EMPTY(...) THEN ]%%`** — campo vazio no briefing faz o bloco sumir sem deixar buraco.

Ordem dos blocos — **idêntica à do institucional**, o que garante que a mesma linha de briefing renderize na mesma sequência nas duas BUs:

| Ordem | Bloco | Fundo | Conteúdo |
|---|---|---|---|
| 0 | preheader | — | `<div>` oculta com `@PreCabecalho` |
| 1 | logo +amigo | `#ffffff` | fixo, 190px, link `clubemaisamigo.com.br` |
| 2 | header | `#efefef` | `@Header`, 600px, cantos superiores 16px |
| 3 | **bloco 1** | `#efefef` | `@TituloCopy1` (h1) → `@Copy1Preto` (p) → CTA 1 → `@Banner1Corpo` (552px) |
| 4 | **bloco 2** | `#D1D4EB` | `@TituloCopy2` (h2) → `@Copy2Preto` → CTA 2 → `@Banner2Corpo` (552px); cantos inferiores 16px |
| 5 | **banner 3** | — | `@Banner3Corpo` = **rodapé da bandeira**, 600px, link `@LinkBanner3` |
| 6 | legal | `#EBEBEB` | `@NotaLegal` → `@Rodape` → bloco fixo Afinz + `%%profile_center_url%%` / `%%unsub_center_url%%` |
| 7 | CAN-SPAM | oculto | `%%Member_Busname%%`, `%%Member_Addr%%` etc. |

Botões CTA: tabela aninhada (bulletproof), `bgcolor="#2C3490"`, `border-radius: 12px`, padding `16px 36px`, texto branco bold 16px.

Banners usam padrão `%%[ IF ... THEN ]%% <a><img></a> %%[ ELSE ]%% <img> %%[ ENDIF ]%%` — nunca IF aninhado em volta da âncora.

### Campos do Content Builder

| Campo | Valor exato |
|---|---|
| **Assunto** | `%%=v(@Assunto)=%%` |
| **Pré-cabeçalho** | `%%=v(@PreCabecalho)=%%` |

⚠️ O pré-cabeçalho existe **nos dois lugares** (campo do CB + div oculta no corpo), replicando o institucional. Se o preview duplicar na caixa de entrada, remover a div e manter só o campo.

⚠️ `v()` **não** resolve AMPscript dentro do valor. Para assunto personalizado, o campo precisa virar `%%=TreatAsContent(@Assunto)=%%`.

---

## 9. Jornada

**2 jornadas no total — uma por sequência, não uma por bandeira.**

```
Journey Builder → Nova jornada → Extensão de dados como entrada
Nome:    JOR_TOPOFUNIL_PLURIX_SEQ1
Entrada: TB_CAMPANHA_AQUISICAO

Critérios de filtro:
  TP_CAMPANHA  é igual a  Topo de Funil
  SEQUENCIA    é igual a  E-mail 1
```

As 6 bandeiras passam pela mesma jornada e pelo mesmo e-mail. `Topo de Funil` é exclusivo de Plurix, então não há risco de contato institucional entrar.

`TB_CAMPANHA_AQUISICAO` precisa estar marcada como **"É enviável"** com `EMAIL` como relação de assinante.

---

## 10. Procedimento de reprodução

### Geração dos arquivos

**Briefing** (12 linhas = 6 bandeiras × 2 sequências): produto cartesiano de `BANDEIRAS × SEQUENCIAS`. Cada bandeira contribui com os campos de identidade (assets de [[Bandeiras-Plurix]]); cada sequência contribui com os campos de mensagem. **Registro histórico de agosto:** datas em `MM/DD/AAAA HH:MM:SS`, campos entre aspas duplas, `<br>` em vez de `\n` e UTF-8 com BOM. **Para novas exportações, usar o contrato homologado em setembro de [[Emails-Dinamicos-SFMC]]: UTF-8 sem BOM, vírgula, CRLF e qualificação mínima.**

**Audiência** (1 arquivo por sequência): filtra a DE de origem pela regra de elegibilidade (§3), renomeia colunas, deixa `LIMITE` vazio, monta `CAMPANHA` como `afz_aqs_{slug}_reg_cart_email_{segmento_slug}{n}_diario`.

Scripts: `SFMC_PLURIX_IMPLANTACAO/scripts/gen_briefing.py` e `gen_audiencia.py`.

### Ordem de execução no SFMC

1. Conferir que as duas DEs existem e que a de audiência é "enviável"
2. **Importar o briefing** (sempre antes da audiência — sem briefing, o `RaiseError` derruba o envio)
3. Importar a audiência **da sequência atual apenas**
4. Criar o e-mail em Content Builder → HTML livre
5. Preencher Assunto e Pré-cabeçalho
6. Criar a jornada com o filtro
7. **6 Test Sends, um por bandeira**
8. Ativar

### Configuração de import (as duas DEs)

| Campo | Valor |
|---|---|
| Codificação | UTF-8 |
| Delimitador | vírgula |
| Respeitar aspas duplas | ☑️ **marcar — desmarca sozinha a cada import** |
| Ação | Adicionar e atualizar |

### QA automatizável

Verificações que um agente deve rodar antes de subir:

```
1. chave composta única no briefing (NM_PRODUTO_INTERNO + TP_CAMPANHA + SEQUENCIA)
2. toda linha de audiência tem briefing correspondente (join pela chave)
3. DT_INICIO e DT_FIM casam com ^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$
4. nenhum campo contém \n ou \r cru
5. nenhum campo contém merge field legado %%TOKEN%% (regex: %%(?![=\[])([A-Za-z_]+)%%)
6. nenhum placeholder "PEGAR NA BASE" ou "CRIAR"
7. HEADER e BANNER_* começam com https://
8. BANNER_3_CORPO preenchido em todas as linhas (rodapé é obrigatório)
9. nº de rodapés distintos == nº de bandeiras
10. nº de deeplinks distintos == nº de bandeiras
11. template: contagem de %%[ igual a ]%%; IF/ENDIF balanceados no AMPscript e no HTML
12. template: nenhuma URL de bandeira específica chumbada no HTML
```

### Test Send — 7 pontos por bandeira

1. Assunto veio do briefing, não vazio
2. Primeiro nome resolveu
3. **Rodapé é o da bandeira certa**
4. **Deeplink é o da bandeira certa** (6 distintos)
5. Imagem de benefícios correta (Boa = FLV, Compre Mais = header/banner próprios)
6. Botões `#2C3490`, faixa `#D1D4EB`
7. "Gerenciar cadastro" e "Descadastrar" abrem

---

## 11. Modos de falha

| Sintoma | Causa | Correção |
|---|---|---|
| `Dados de briefing da campanha não encontrados.` | chave não bate entre as duas DEs | comparar `PRODUTO` × `NM_PRODUTO_INTERNO` caractere a caractere (maiúscula e acento contam) |
| `Campanha fora do prazo de vigência.` | hoje fora de `DT_INICIO`–`DT_FIM` | corrigir vigência no briefing |
| `Contagem de arquivos inválida: N` | checkbox de aspas duplas desmarcada | remarcar e reimportar |
| `Data inválida` | datas em DD/MM em vez de MM/DD | reescrever em MM/DD; **não abrir o CSV no Excel** |
| `arquivo inválido` | quebra de linha crua num campo | trocar `\n` por `<br>` |
| Disparo nunca sai, **sem erro nenhum** | nenhuma jornada ativa filtra aquele `TP_CAMPANHA` + `SEQUENCIA` | criar/ativar a jornada |
| Rodapé ou deeplink de outra bandeira | erro de preenchimento do briefing | só o Test Send pega — não há validação automática |

---

## 12. Log de decisões (com razão — não reverter sem motivo novo)

| Decisão | Alternativa descartada | Razão |
|---|---|---|
| E-mail dedicado Plurix, separado do institucional | e-mail único parametrizado | exigiria ~6 colunas novas de marca; com 2 templates o custo de duplicação ainda é baixo |
| Rodapé da bandeira em `BANNER_3_CORPO` | migrar para `TB_BRIEFING_JORNADAS` | essa DE **não é lida por este template nem por nada no repositório** — serve jornadas de onboarding/desbloqueio. Migrar exigiria máquina nova e mexeria numa DE compartilhada cujo consumidor não é inspecionável |
| `NM_PRODUTO_INTERNO` = nome puro (`AMIGAO`) | `PLURIX_AMIGAO` | alinha ao padrão existente `INSTITUCIONAL` / `BEM BARATO` / `ALVORADA` |
| `TP_CAMPANHA` = `Topo de Funil` | reaproveitar `Aquisição` | colidiria com o institucional no filtro da jornada |
| Segmento fora da chave, só no `activity_name` | chave de 4 campos | copy é idêntica por segmento; entrar na chave multiplicaria o briefing por 8 (12 → 96 linhas) |
| **1 arquivo de audiência, `SEQUENCIA` avançada in-place** | 1 arquivo por sequência | `CPF` é chave primária e a pessoa tem uma linha só. A régua anda pelo `Update Contact` da jornada, não por carga nova. Exige que o e-mail leia a `SEQUENCIA` ao vivo (`LookupRows`), porque o Journey Builder congela os dados de entrada |
| Imagemap removido do rodapé | manter os 2–5 links por rodapé | imagemap não funciona no app do Gmail; parte dos cliques já estava perdida |
| AMPscript copiado verbatim do institucional | reescrever/otimizar | garante que a mesma linha de briefing se comporte igual nas duas BUs |
| `CAMPANHA` e `UTM_CAMPANHA` como **auditoria não-bloqueante** | exigir preenchimento antes de exportar | nenhum dos dois afeta entrega ou renderização; travar disparo válido por etiqueta de tracking ausente custa mais do que disparar sem ela. Ver §15 |

---

## 13. Lacunas conhecidas

**`UTM_CAMPANHA` nunca chega ao destino.** Verificado por parsing do template: zero ocorrências de `utm_` no HTML, nos 5 `RedirectTo`. A coluna é preenchida com 12 valores distintos e simplesmente não é lida. Quem clica chega no OneLink sem marcação de campanha — a atribuição do lado do app fica cega. **O institucional tem a mesma lacuna.** Correção conhecida (concatenar `@UtmCampanha` no `RedirectTo`), mas exige validar concatenação de parâmetro em deeplink OneLink com clique real antes de entrar em produção.

**Identidade desnormalizada.** Rodapé e deeplink repetidos por linha de briefing. Aceitável em 12 linhas; degrada linearmente com o número de campanhas.

**Dois templates para manter.** Institucional e Plurix. Bug de HTML precisa ser corrigido nos dois.

---

## 14. Escala — modelo aplicável às outras BUs

A pergunta que determina quantos templates existem **não é "quantas BUs?"**, é **"quantas identidades visuais distintas o e-mail precisa servir?"**

| BU | Identidades | O que varia | Templates | Status |
|---|---|---|---|---|
| **B2C** | 1 (Afinz Visa) | nada | 1 | resolvido — nada precisa virar dado |
| **Plurix** | 1 marca (`+amigo`), 6 assinaturas | rodapé + deeplink | 1 | **resolvido** — virou coluna do briefing |
| **B2B2C** | N marcas de cartão | logo, cores, nome do cartão | 1 por parceiro | **em aberto** |

Em B2B2C os parceiros têm cartão de marca própria — `Bem Barato` → *Bem Mais Afinz Visa*, `Alvorada` → *Alvorada Afinz Visa*. O campo `FLAG_WHITELABEL` em `TB_BRIEFING_JORNADAS` existe exatamente para marcar isso. Não é só rodapé diferente.

**O que trava tecnicamente:** quatro valores estão chumbados no HTML do template Plurix — o logo `+amigo`, o azul `#2C3490`, o lavanda `#D1D4EB` e o cinza `#efefef`. Promover esses quatro a colunas do briefing é o que faria o mesmo motor servir B2B2C.

**Quando fazer:** o gatilho é a **terceira identidade** — quando o primeiro parceiro whitelabel de B2B2C precisar de e-mail dinâmico. Com 2 templates, duplicar uma correção é chato. Com 3, alguém corrige em 2 e esquece o terceiro.

**Hipótese não validada:** B2B2C tem apenas 115 disparos ([[BUs]], snapshot 2026-06-10). É possível que seja pequeno *porque* cada parceiro novo custa um template, não porque o mercado é pequeno. Se o custo marginal cair para uma linha de planilha, a pergunta "quantos parceiros a operação aguenta?" muda de resposta. Testar antes de assumir que B2B2C é nicho.

---

## 15. Próximos passos — rastreamento é auditoria, não pré-requisito

**Decisão de arquitetura (2026-08-18):** `CAMPANHA` (activity_name) e `UTM_CAMPANHA` formam uma **camada de auditoria**. Ela é desejável, mas **não é obrigatória** para o disparo — e não deve ser tratada como bloqueante em nenhuma validação futura.

### Por quê

Nenhum dos dois campos participa do funcionamento do e-mail:

| Campo | Entra na chave? | Renderiza? | Bloqueia o envio? |
|---|---|---|---|
| `CAMPANHA` (activity_name) | não | não | **não** |
| `UTM_CAMPANHA` | não | não (hoje nem é lida) | **não** |

Um briefing sem `UTM_CAMPANHA` e uma audiência sem `CAMPANHA` produzem exatamente o mesmo e-mail, entregue às mesmas pessoas. O que se perde é **leitura de resultado**, não entrega.

Separar as duas camadas evita o modo de falha mais caro que existe aqui: **travar um disparo válido por causa de uma etiqueta de tracking ausente.** Campanha que não sai custa mais do que campanha que sai sem `utm`.

### Como implementar essa distinção

Nas validações do briefing (§10) e no motor da Fábrica de e-mails do GaaS:

- Regras que garantem **entrega** → severidade `erro`, bloqueiam exportação.
  Chave duplicada, placeholder na chave, data inválida, URL não-HTTPS, sintaxe de personalização incompatível.
- Regras de **auditoria** → severidade `aviso`, nunca bloqueiam.
  `UTM_CAMPANHA` vazia, `CAMPANHA` vazia ou fora do padrão de [[Taxonomia-Activity-Name]], segmento não reconhecido.

Hoje `UTM_CAMPANHA` já é validada como `erro` na regra de placeholder (`"CRIAR"`) no módulo `dynamic-email` do GaaS. **Rebaixar para `aviso`** é o ajuste concreto a fazer.

### O contraponto — o risco de rebaixar

Aviso que ninguém lê vira campo vazio permanente. Se `CAMPANHA` degradar em silêncio, a leitura de resultado por segmento — que é a única razão de o segmento existir fora da chave (§12) — para de funcionar sem que nada quebre.

Mitigação sugerida, na ordem em que vale fazer:

1. **Contador visível** na Fábrica: "N de 12 briefings sem UTM" no header, não escondido dentro da linha.
2. **Preencher por padrão** em vez de exigir: o `gen_briefing.py` já monta `UTM_CAMPANHA` automaticamente a partir de bandeira + sequência. Gerar sempre e deixar editável é melhor do que validar depois.
3. **Fechar a lacuna da UTM antes de rebaixar a regra** — hoje o campo é obrigatório e inútil, o pior dos dois mundos. Ver §13.

### Ordem recomendada dos próximos passos

1. Confirmar se a lacuna de `UTM_CAMPANHA` vale para o e-mail institucional também. Se valer, **nenhum e-mail dinâmico está sendo atribuído corretamente hoje** — isso muda como os relatórios de conversão devem ser lidos, e é maior que Plurix.
2. Corrigir o consumo da UTM no template (concatenar no `RedirectTo`), validando com clique real em deeplink OneLink antes de produção.
3. Só então rebaixar as regras de auditoria para `aviso` e adicionar o contador visível.

Fazer o passo 3 antes do 2 congela a lacuna: o campo deixa de ser cobrado e continua sem uso.

---

## Briefings CRM · Semana 1 (2026-08-19)

A caixa compartilhada da Fábrica foi substituída por dois briefings visuais adaptados dos HTMLs legados fornecidos pelo time:

- `TP_CAMPANHA = CRM`, sequências `E-mail 1` e `E-mail 2`.
- Ambos classificados em `Semana 1`, com vigência de `17/08/2026 00:00` a `01/10/2028 23:59`.
- Cada grupo visual gera seis linhas técnicas: `AMIGAO`, `BOA`, `AVENIDA`, `COMPRE MAIS`, `PARANA` e `SUPERPAO`.
- Deeplink, assinatura, site e UTM são específicos por bandeira. O E-mail 1 preserva as variações de benefício de Boa e Compre Mais.
- O conteúdo foi adaptado às 36 colunas existentes; image maps e CTAs gráficos extras foram traduzidos para CTA 1, CTA 2, banners e assinatura, sem alterar a DE.
- Estado auditado após a carga: 2 grupos, 12 linhas e 12 versões iniciais. A biblioteca ficou com 22 referências externas aprovadas.
- Quando o Supabase retorna uma caixa vazia, o frontend não repõe mais os exemplos locais antigos.

## Template PLURIX V10 · régua de topo reformulada (05/10/2026)

Evolução do V9 para a régua de topo nova (`TP_CAMPANHA = Topo de Funil`, convive com a régua `CRM` até a troca das jornadas). Três recursos que dependem de dados fora do briefing, sem coluna nova no briefing de 36 campos:

| Recurso | Fonte no SFMC | Regra |
|---|---|---|
| Header dinâmico | `TB_HEADER_VARIACOES` (código, título, subtítulo, imagem do cartão, cores) + `TB_REDE_ASSETS` (logo por rede) | `HEADER` com link = imagem (como antes); com código `HDR_...` = header em HTML. Compre Mais e Superpão sem logo |
| Faixa de limite | coluna `LIMITE` da audiência | Quem tem limite vê a faixa com o valor em todos os e-mails. Não é benefício escolhido por e-mail, é regra |
| Bloco 3, pool de ofertas | `DE_POOL_OFERTAS_PLURIX` | Oferta do dia da rede: produto em mais regiões, "a partir de" o menor preço, "cidades e regiões participantes". Sem oferta, o bloco some. Lookup nunca derruba o envio |

- **Fonte de verdade:** Fábrica do GaaS, aba "Header e ofertas" (variações, logos e cópia do pool para a prévia). A regra da oferta do dia existe em dois lugares que precisam andar juntos: o AMPscript do V10 e `domain/topoPlurixV10.ts`.
- **Pacote de subida:** `SFMC_PLURIX_IMPLANTACAO/v10/` (HTML do V10, CSVs das duas DEs e o LEIA-ME com o roteiro de Test Send).
- **Público:** só membros do Clube (ver [[Topo-de-Funil]]); parte da base pré-aprovada.
- **Pool hoje:** só o Amigão tem ofertas, todas de açougue, com validade de 1 dia (quinta a sábado) e preço por região. A audiência de topo não tem UF/cidade, por isso o tom publicitário.

## Relacionado

- [[Servico-Emails-Dinamicos]] · [[Briefing-e-Regua-de-Aquisicao]] · [[Fontes-e-Proveniencia-Growth]]
- [[Emails-Dinamicos-SFMC]] · [[Bandeiras-Plurix]] · [[SFMC-Salesforce-Marketing-Cloud]] · [[Taxonomia-Activity-Name]] · [[Topo-de-Funil]] · [[BUs]] · [[Parceiros]] · [[Segmentos]] · [[Jornada]]


## Evolução registrada em 06/10/2026

[[Emails-Dinamicos-Plurix-V11]] consolida a investigação do V9, o contrato audiência COMUNICACAO_PLX + estado ESTADO_SEQUENCIA_CRM + briefing, o teste de dois toques confirmado pelo usuário e as melhorias publicadas na Fábrica. A V11 mantém imagem, limite e nenhum pool. Cadastrar a V11 não troca os vínculos dos briefings CRM antigos. O contrato em uso ainda tem 36 colunas e a copy da faixa permanece fixa na versão testada.

[[Fabrica-XLSX-TOPO-CRM-3]] registra a próxima especificação: mensagem de limite como coluna opcional do briefing, escrita por toque no XLSX/GaaS, rascunhos enriquecidos por IA e a nova régua de dois toques TOPO DE FUNIL (CRM) 3. Essa evolução foi alinhada e documentada em prompt, mas não implementada; não tratar a futura coluna 37 ou o importador como disponíveis.
