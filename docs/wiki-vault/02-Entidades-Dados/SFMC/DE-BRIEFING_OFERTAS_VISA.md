---
tags: [entidade, sfmc, data-extension, vai-de-visa, ofertas, pool, conteudo-dinamico]
tipo: entidade
camada: entidades
aliases: [BRIEFING_OFERTAS_VISA, BRIEFING_OFERTAS, DE_VDV_OFERTAS, VDV_OFERTAS, pool de ofertas Vai de Visa]
atualizado: 2026-11-03
status: confirmado
fonte: DE criada no SFMC em 03/11/2026; arquivo Ofertas_novembro.xlsx (Cupons Negociados | Novembro 2026); operador
---

# DE `BRIEFING_OFERTAS_VISA` (SFMC)

**Definição e propósito:** a vitrine do [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa|Vai de Visa]] pronta para o e-mail e a LP: uma linha por **versão × grupo × posição**, com tudo que o card precisa (logo, valor, descrição, link, cupom). Upload manual; não entra na automação.

> Nomes anteriores no planejamento: `DE_VDV_OFERTAS`, `VDV_OFERTAS`, `BRIEFING_OFERTAS`.

## Grão e chave

- **PK composta:** `ID_VERSAO` + `CD_GRUPO` + `NR_POSICAO`. Versão nova **adiciona** linhas (não sobrescreve), para a medição saber qual vitrine cada cliente viu (`ID_VERSAO_OFERTAS` em [[DE-VDV_ENVIO]]).
- `CD_GRUPO` usa os mesmos códigos de [[DE-VDV_APTOS]]: `MODA`, `SAUDE_BELEZA`, `FAMILIA_PRESENTES`, `GENERICO`.

## Campos (20)

`ID_VERSAO` · `CD_GRUPO` · `NR_POSICAO` · `ID_OFERTA` · `NM_MARCA` · `URL_LOGO` · `TX_PREFIXO` ("até") · `TX_VALOR` ("15%") · `TX_SUFIXO` ("OFF") · `DS_COMPLEMENTO` ("em todo o site") · `DS_MARCA` (descrição curta) · `COR_DESTAQUE` (cor da marca no valor, hex) · `TP_RESGATE` (CUPOM / LINK / PAGAR_COM_VISA) · `CD_CUPOM` · `URL_CTA` · `NOTA_CONDICOES` · `VL_LIMITE_EXIGIDO` · `DT_INICIO` · `DT_FIM` · `FL_ATIVA`. Recomendado tornar `NM_MARCA`, `TX_VALOR` e `URL_CTA` obrigatórios (card quebrado é recusado no import).

## O pool de ofertas

As ofertas são tratadas como **um pool único priorizado**, não como vitrines independentes:

1. Catálogo do mês → limpeza (vencidas, duplicadas, formato) → **7 etiquetas** por oferta: grupo, tipo de resgate, mecânica, limite exigido (`max(200; ticket × 1,10)`), vigência (safra/perene), destaque Visa, status.
2. **Nota de prioridade 0–100:** força da marca 25 · destaque Visa 15 · desconto até 20 · acessível com R$ 200 10 · abrangência até 10 · alcance da categoria na base até 10 · tema Visa 5 · vence na safra 5.
3. Vitrine do grupo = ofertas do grupo em ordem de prioridade; o que faltar vem do topo do pool. Vitrine genérica = topo do pool, máx. 2 por grupo.

> 📊 Arquivo de novembro/2026: 66 linhas, **62 ofertas únicas** (4 duplicadas). Ranking completo, critérios e vitrines na planilha local `VDV_Pool_Ofertas_Nov26.xlsx` (gerada em 03/11/2026). Topo do ranking: Nike, Movida, L'Occitane en Provence, Puma, oBoticário. Saíram do catálogo de out/26: Decolar (7), Lojas Lebes, Unidas e a aba "Só com Visa".

## Vitrine da versão `BF26_V1` (1º teste, 3 cards)

| CD_GRUPO | 1 | 2 | 3 |
|---|---|---|---|
| `MODA` | Puma · 15% | Riachuelo · 10% | Decathlon · 10% |
| `SAUDE_BELEZA` | oBoticário · 15% | Granado · 15% | Beleza na Web · 10% |
| `FAMILIA_PRESENTES` | LEGO · 10% | Giuliana Flores · 15% | Evino · 10% |
| `GENERICO` | Movida · 12% | Alura · 15% | Oceane · 10% |

Seleção do operador a partir de uma lista de 12 marcas (decisão de 03/11/2026). Todas com limite de R$ 200, sem reserva. Giuliana Flores e Evino vencem 30/11.

## Lacunas e pendências

- Riachuelo veio com desconto `0.1` → confirmar 10% OFF → Ofertas.
- Evino é bebida alcoólica → card precisa de "Beba com moderação" e regras do CONAR → Ofertas/Jurídico.
- Logos, cores e descrições curtas → necessários para o CSV → Pietra / Ofertas.
- Genérico mistura Oceane (beleza) com SAUDE_BELEZA → aproxima SEG-A e SEG-B nesse grupo → aceito no 1º teste.

## Relacionado

[[Emails-Dinamicos-Vai-de-Visa]] · [[DE-VDV_ENVIO]] · [[DE-VDV_APTOS]] · [[Iniciativa-Pool-de-Ofertas-Vai-de-Visa]] · [[Inconsistências-a-Corrigir]]
