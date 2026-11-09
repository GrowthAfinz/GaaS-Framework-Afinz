---
tags: [entidade, sfmc, data-extension, vai-de-visa, ofertas, pool, conteudo-dinamico]
tipo: entidade
camada: entidades
aliases: [BRIEFING_OFERTAS_VISA, BRIEFING_OFERTAS, DE_VDV_OFERTAS, VDV_OFERTAS, pool de ofertas Vai de Visa]
atualizado: 2026-11-09
status: a-validar
fonte: DE criada no SFMC em 03/11/2026; arquivo Ofertas_novembro.xlsx (Cupons Negociados | Novembro 2026); operador
---

# DE `BRIEFING_OFERTAS_VISA` (SFMC)

### `BRIEFING_OFERTAS_VISA` · 41 campos

Catálogo de ofertas e registros de tema e hero. Uma linha por ID; PK ID; não enviável. OFERTA não usa VERSAO, enquanto TEMA e HERO usam a versão do tema. Não criar DEs separadas de hero/tema nem adicionar GRUPO_2 ou SAFRA ao contrato atual.

A carga é uma publicação manual do catálogo a partir da Fábrica/CSV. operação relatou o import; faltam recibo de linhas aceitas, checagem de imagens/links e teste do motor novo. Antes de Overwrite, guardar a exportação anterior e garantir o catálogo completo: retirar uma oferta ainda referenciada pode impedir reconstruir rodadas antigas. Retenção, External Key e defaults atuais não foram inspecionados.

Na tabela, “Obrigatório” é a exigência de uso/referência documental, não leitura da propriedade IsRequired do tenant. Colunas específicas de OFERTA, TEMA e HERO precisam aceitar vazios nos outros tipos. A nulidade de VERSAO para OFERTA e de INICIO/FIM precisa ser compatível com os registros e SQLs atuais.

| Campo | Tipo / tamanho de referência | PK | Obrigatório | Uso |
|---|---|---|---|---|
| `ID` | Text(60) | Sim | Sim | Chave única (ex.: `NOV26_PUMA`, `TEMA_BF26_V1`) |
| `TIPO` | Text(20) | — | Sim | `OFERTA`, `TEMA` ou `HERO` |
| `VERSAO` | Text(30), referência | — | Não para OFERTA; sim para TEMA/HERO | Código de versão da peça (ex.: `BF26_V1`) |
| `ATIVA` | Boolean | — | Sim | Indicador de oferta vigente (1 = Ativa; 0 = Inativa) |
| `INICIO` | Date | — | Não; SQL aceita NULL | Início do período de validade |
| `FIM` | Date | — | Não; SQL aceita NULL | Término do período de validade |
| `MARCA` | Text(100) | — | Não | Nome comercial da loja parceira |
| `GRUPO` | Text(50) | — | Não | Categoria primária (`MODA`, `SAUDE_BELEZA`, etc.) |
| `LOGO` | Text(500) | — | Não | URL HTTPS pública do logo no Content Builder |
| `FOTO` | Text(500) | — | Não | URL HTTPS pública da imagem de fundo do card |
| `ALT` | Text(200) | — | Não | Texto alternativo de acessibilidade |
| `PREFIXO` | Text(50) | — | Não | Texto de apoio ao valor (ex.: "Até") |
| `VALOR` | Text(50) | — | Não | Expressão do benefício (ex.: "15%", "R$ 100") |
| `SUFIXO` | Text(50) | — | Não | Complemento curto (ex.: "OFF") |
| `COMPLEMENTO` | Text(200) | — | Não | Escopo da promoção (ex.: "em todo o site") |
| `COR` | Text(10) | — | Não | Código HEX da cor da marca para o valor |
| `RESGATE` | Text(30) | — | Não | Mecânica: `CUPOM`, `LINK` ou `PAGAR_COM_VISA` |
| `CUPOM` | Text(50) | — | Não | Código alfanumérico do voucher promocional |
| `LINK` | Text(500) | — | Não | Link de afiliado / redirecionamento rastreado |
| `CONDICOES` | Text(500) | — | Não | Regras de uso e avisos legais obrigatórios |
| `HERO` | Text(50) | — | Não | Identificador da arte hero (para linhas de HERO) |
| `HERO_IMG` | Text(500) | — | Não | URL HTTPS da imagem de cabeçalho |
| `HERO_ALT` | Text(200) | — | Não | Texto descritivo do hero |
| `HERO_LINK` | Text(500) | — | Não | URL de destino do clique no hero |
| `NOME_CARTAO` | Text(100) | — | Não | Grafia padronizada do produto associado ao hero |
| `TEMA` | Text(100) | — | Não | Título institucional da campanha |
| `ASSUNTO` | Text(200) | — | Não | Linha de assunto do E-mail 1 (V1) |
| `PREHEADER` | Text(200) | — | Não | Pré-cabeçalho do E-mail 1 (V1) |
| `ASSUNTO_V2` | Text(200) | — | Não | Linha de assunto do E-mail 2 (V2) |
| `PREHEADER_V2` | Text(200) | — | Não | Pré-cabeçalho do E-mail 2 (V2) |
| `SAUDACAO` | Text(100) | — | Não | Texto de saudação dinâmico com tag `{NOME}` |
| `SAUDACAO_SEM_NOME` | Text(100) | — | Não | Saudação padrão para cadastros sem nome |
| `INTRO` | Text(500) | — | Não | Parágrafo introdutório do corpo da mensagem |
| `CARTAO_PADRAO` | Text(100) | — | Não | Nome padrão do cartão para fallback |
| `CTA` | Text(50) | — | Não | Rótulo dos botões dos cards (ex.: "Aproveitar oferta") |
| `TITULO_CONDICOES` | Text(100) | — | Não | Título da seção de rodapé legal |
| `RODAPE_CONDICOES` | Text(1000) | — | Não | Texto jurídico de termos e condições |
| `COR_FUNDO` | Text(10) | — | Não | Código HEX de fundo do template |
| `COR_TEXTO` | Text(10) | — | Não | Código HEX de texto principal |
| `COR_TITULO` | Text(10) | — | Não | Código HEX dos cabeçalhos |
| `COR_TEMA` | Text(10) | — | Não | Código HEX da cor de destaque da campanha |

**Regras por tipo:** OFERTA exige ID, marca, benefício e link; a Q08 também exige FOTO não vazia e elimina MARCA vazia. TEMA precisa de exatamente um registro ativo/vigente em BF26_V1. HERO identifica a arte, URL e eventual correção do nome do cartão. RESGATE=CUPOM exige cupom coerente; preservar condições legais, ALT e HTTPS. Logo ausente não é o mesmo que foto ausente: o template anterior tem fallback textual de marca, mas a seleção atual exige FOTO.

**Catálogo de referência:** 89 registros, 66 ofertas, 22 heros e um tema; 60 ofertas ativas, 52 ofertas sem foto e 62 sem logo. Conferir a carga importada combinando atividade, vigência, marca, foto, link e valor.


[[Estrategia-Pool-de-Ofertas-Visa]] · [[Rotacao-de-Ofertas-Vai-de-Visa]]


:::details Histórico anterior a 09/11 · não executar como instrução vigente
### DE `BRIEFING_OFERTAS_VISA` (SFMC)

**Definição e propósito:** a vitrine do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] pronta para o e-mail e a LP: uma linha por **versão × grupo × posição**, com tudo que o card precisa (logo, valor, descrição, link, cupom). Upload manual; não entra na automação.

> Nomes anteriores no planejamento: `DE_VDV_OFERTAS`, `VDV_OFERTAS`, `BRIEFING_OFERTAS`.

### Estrutura vigente (05/11/2026, 18h) · catálogo + vitrine em DE separada

Decisões do operador:
- **Colunas com nomes simples.** A DE é recriada; a chave passa a ser só `ID`.
- **Catálogo**, com 1 linha por oferta e sem versão; tema e heros também ficam aqui, separados pelo `TIPO`.
- **A vitrine sai desta DE** e vai para [[DE-MOVIMENTO_OFERTAS_VISA]].
- **Saíram:** limite mínimo (vira filtro da jornada), arte inteira do card, prioridade e status.

**41 colunas:**
- comuns: `ID, TIPO (OFERTA|TEMA|HERO), VERSAO, ATIVA, INICIO, FIM`;
- oferta: `MARCA, GRUPO, LOGO, FOTO, ALT, PREFIXO, VALOR, SUFIXO, COMPLEMENTO, COR, RESGATE, CUPOM, LINK, CONDICOES`;
- hero: `HERO, HERO_IMG, HERO_ALT, HERO_LINK, NOME_CARTAO`;
- tema: `TEMA, ASSUNTO, PREHEADER, ASSUNTO_V2, PREHEADER_V2, SAUDACAO, SAUDACAO_SEM_NOME, INTRO, CARTAO_PADRAO, CTA, TITULO_CONDICOES, RODAPE_CONDICOES, COR_FUNDO, COR_TEXTO, COR_TITULO, COR_TEMA`.

Fonte operacional: `Ofertas_novembro_2_VDV.xlsx`, com o catálogo nas colunas H→X da aba Novembro e as abas TEMA, HEROS, MOVIMENTO, CSV_BRIEFING e CSV_MOVIMENTO. Carga BF26: 89 linhas (66 ofertas, das quais 60 ativas; 1 tema; 22 heros).

**Regra de hero:** B2C recebe V1 no e-mail 1 e V2 no e-mail 2. B2B2C com arte cadastrada recebe a arte do parceiro nos dois. B2B2C sem arte recebe o V2 nos dois.

### Histórico · DE única com 3 tipos de registro (substituído)

Decisão do operador: **tudo fica nesta DE**, inclusive o tema e os heros. As notas [[DE-BRIEFING_VDV_TEMA]] e [[DE-BRIEFING_VDV_HERO]] passam a descrever **tipos de registro** desta DE, não DEs separadas.

- Campo novo `TP_REGISTRO`: `OFERTA` · `TEMA` (`CD_GRUPO = "_TEMA"`, `NR_POSICAO = 0`) · `HERO` (`CD_GRUPO = "_HERO"`, `NR_POSICAO` 1..n, chave lógica `CD_HERO` = `V1` / `V2` / parceiro).
- **45 colunas:** chave e vigência (7) · oferta (17) · hero (5: `CD_HERO`, `URL_HERO`, `ALT_HERO`, `URL_LINK_HERO`, `TX_NOME_CARTAO`) · tema (16, incluindo `TX_ASSUNTO_V2`, `TX_PREHEADER_V2` e `TX_NOME_CARTAO_PADRAO`). Lista exata no `SPEC_CODEX_Fabrica_Vai_de_Visa.md`.
- BF26_V1: 39 linhas (1 tema, 22 heros, 16 ofertas, 4 por grupo).
- Quem não tem hero personalizado (B2C, parceiro sem KV) recebe o institucional da versão do e-mail.

### Grão e chave

- **PK composta:** `ID_VERSAO` + `CD_GRUPO` + `NR_POSICAO`. Versão nova **adiciona** linhas (não sobrescreve), para a medição saber qual vitrine cada cliente viu (`ID_VERSAO_OFERTAS` em [[DE-VDV_ENVIO]]).
- `CD_GRUPO` usa os mesmos códigos de [[DE-VDV_APTOS]]: `MODA`, `SAUDE_BELEZA`, `FAMILIA_PRESENTES`, `GENERICO`.

### Campos (20)

`ID_VERSAO` · `CD_GRUPO` · `NR_POSICAO` · `ID_OFERTA` · `NM_MARCA` · `URL_LOGO` · `TX_PREFIXO` ("até") · `TX_VALOR` ("15%") · `TX_SUFIXO` ("OFF") · `DS_COMPLEMENTO` ("em todo o site") · `DS_MARCA` (descrição curta) · `COR_DESTAQUE` (cor da marca no valor, hex) · `TP_RESGATE` (CUPOM / LINK / PAGAR_COM_VISA) · `CD_CUPOM` · `URL_CTA` · `NOTA_CONDICOES` · `VL_LIMITE_EXIGIDO` · `DT_INICIO` · `DT_FIM` · `FL_ATIVA`. Recomendado tornar `NM_MARCA`, `TX_VALOR` e `URL_CTA` obrigatórios (card quebrado é recusado no import).

**Campos acrescentados em 03/11/2026 (3, total 23):** `URL_FUNDO` Text 500 (foto da marca atrás do card, 1200×300 exibida 600×150) · `URL_CARD` Text 500 (opcional: arte inteira, substitui o híbrido) · `ALT_CARD` Text 200.

> Revisão de 05/11/2026: assunto, pré-cabeçalho, hero e textos do e-mail saíram desta DE e foram para [[DE-BRIEFING_VDV_TEMA]] (1 linha por versão). Se `TX_ASSUNTO`, `TX_PREHEADER`, `URL_HERO` e `ALT_HERO` já foram criados aqui, ficam vazios e sem uso.

**Card híbrido (decisão de 03/11/2026):** foto e logo da marca são imagens no Content Builder (ativos perenes, reaproveitados entre safras); valor, complemento, cupom e CTA são texto vindo da DE. Arquivo da versão: `BRIEFING_OFERTAS_VISA_BF26_V1.csv`. Imagens: subir no Content Builder em `Black Afinz/VDV/Marcas/` e colar a URL pública em `URL_LOGO` / `URL_FUNDO`. Evino usa o cupom `VISA1` (frete grátis na 1ª compra); `VISA2` fica fora.

### O pool de ofertas

As ofertas são tratadas como **um pool único priorizado**, não como vitrines independentes:

1. Catálogo do mês → limpeza (vencidas, duplicadas, formato) → **7 etiquetas** por oferta: grupo, tipo de resgate, mecânica, limite exigido (`max(200; ticket × 1,10)`), vigência (safra/perene), destaque Visa, status.
2. **Nota de prioridade 0–100:** força da marca 25 · destaque Visa 15 · desconto até 20 · acessível com R$ 200 10 · abrangência até 10 · alcance da categoria na base até 10 · tema Visa 5 · vence na safra 5.
3. Vitrine do grupo = ofertas do grupo em ordem de prioridade; o que faltar vem do topo do pool. Vitrine genérica = topo do pool, máx. 2 por grupo.

> 📊 Arquivo de novembro/2026: 66 linhas, **62 ofertas únicas** (4 duplicadas). Ranking completo, critérios e vitrines na planilha local `VDV_Pool_Ofertas_Nov26.xlsx` (gerada em 03/11/2026). Topo do ranking: Nike, Movida, L'Occitane en Provence, Puma, oBoticário. Saíram do catálogo de out/26: Decolar (7), Lojas Lebes, Unidas e a aba "Só com Visa".

### Vitrine da versão `BF26_V1` (1º teste, 3 cards)

| CD_GRUPO | 1 | 2 | 3 |
|---|---|---|---|
| `MODA` | Puma · 15% | Riachuelo · 10% | Decathlon · 10% |
| `SAUDE_BELEZA` | oBoticário · 15% | Granado · 15% | Beleza na Web · 10% |
| `FAMILIA_PRESENTES` | LEGO · 10% | Giuliana Flores · 15% | Evino · 10% |
| `GENERICO` | Movida · 12% | Alura · 15% | Oceane · 10% |

Seleção do operador a partir de uma lista de 12 marcas (decisão de 03/11/2026). Todas com limite de R$ 200, sem reserva. Giuliana Flores e Evino vencem 30/11.

### Lacunas e pendências

- Riachuelo veio com desconto `0.1` → confirmar 10% OFF → Ofertas.
- Evino é bebida alcoólica → card precisa de "Beba com moderação" e regras do CONAR → Ofertas/Jurídico.
- Logos, cores e descrições curtas → necessários para o CSV → Pietra / Ofertas.
- Genérico mistura Oceane (beleza) com SAUDE_BELEZA → aproxima SEG-A e SEG-B nesse grupo → aceito no 1º teste.

### Campos propostos para a rotação (05/11/2026)

- `GRUPO_2` Text 30 (linhas de oferta): segundo grupo em que a marca circula. Exemplos: Movida com `GRUPO = VIAGEM` e `GRUPO_2 = GENERICO`; Oceane com `SAUDE_BELEZA` e `GENERICO`.
- `SAFRA` Text 30 (linha de tema): código da safra (`VDV_2026_11_BF`). As queries 04, 05 e 06 leem versão e safra do **tema ativo e vigente**, sem valor fixo no SQL; trocar de tema vira uma linha nova aqui.
- *(aberto)* `DESTAQUE`: põe a oferta na posição 1 de todos os grupos quando houver pedido comercial.
- Como o acervo vira vitrine: [[Rotacao-de-Ofertas-Vai-de-Visa]].

### Relacionado

[[Emails-Dinamicos-Vai-de-Visa]] · [[DE-VDV_ENVIO]] · [[DE-VDV_APTOS]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[Inconsistências-a-Corrigir]]
:::

