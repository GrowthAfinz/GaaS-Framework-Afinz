---
tags: [evolucao,governanca,dados]
tipo: evolucao
camada: evolucao
atualizado: 2026-11-03
status: confirmado
fonte: gaas-supabase
---

# Inconsistências a Corrigir

**Definição:** as duplicidades e lacunas reais nos dados, expostas ao reconciliar a [[Ontologia-v2]] com o Supabase.

> 📊 Snapshot 2026-06-08.

| Dimensão | Problema | Ação |
|---|---|---|
| [[Parceiros]] | "Bem Barato"(13) + "Bem_Barato"(11) | unificar → Bem_Barato |
| [[Parceiros]] | "Acordo Certo" | padronizar → Acordo_Certo |
| [[Subgrupos]] | "Leais"(121) + "Leal"(1) | unificar |
| [[Produtos]] | "Cartao" genérico (592) | mapear → Classic/Platinum (a validar) |
| [[Ofertas]] | 5 disparos sem oferta | corrigir origem |
| [[Segmentos]] | "Recencia de Compra" com espaço | → Recencia_de_Compra |
| [[Safra]] | ~~"06/26"(117) + "05/26"(11) vs padrão AAAA-MM~~ | ✅ **corrigido 2026-06-10** (UPDATE → 2026-06/2026-05); novas ingestões devem validar regex `^\d{4}-\d{2}$` |

## Incongruências de taxonomia SFMC (fonte: skill `copa-crm-parser`)
| Problema | Tratamento |
|---|---|
| Bem Barato com 2 siglas: `bb` (e-mail) vs `bbt` (WPP) | ambos → Bem_Barato |
| Plurix: `plu_` nas activities vs `PLURIX` nas journeys | resolver por posição/journey |
| `upo` (público inexistente na taxonomia) | classificar como "Upload" |
| `rec` ambíguo: público=Recência vs área=Recorrente | resolver por posição no nome |
| Grafia de safra: `ABR26`=`ABRI26`, `MAI26`=`MAIO26` | normalizar |
| Journey sem BU: `JOR_AQUISICAO_BB_...` (falta `B2B2C_`) | ainda é Bem Barato |
| Carrinho abandonado usa `_aqs_` mas é Reativação | classificar pela journey (`*_ABD`) |
| Finalizados ECRED ausentes no SFMC (journeys ABD) | resultado real vem do GaaS (`Emitidos`) |

## Catálogo Vai de Visa (out/2026)

> 📊 Catálogo Visa mapeado na aba "Ofertas x Segmento" da spec; conferido em 03/11/2026.

| Problema | Ação |
|---|---|
| Lojas Lebes (fim 01/11/2026) e Unidas (fim 31/10/2026) já vencidas no primeiro disparo | tirar da [[DE-BRIEFING_OFERTAS_VISA]] |
| 5 ofertas duplicadas (Seara, Giuliana Flores, L'Occitane en Provence, L'Occitane au Brésil, Movida) | manter uma linha |
| Riachuelo com oferta `0.1`; Decolar com `120`, `400`… sem "R$ OFF" | padronizar texto da oferta |
| Categoria "Saúde e Belezza" e "Saúde / Beleza" | normalizar → Saúde e Beleza |
| Brinquedos (b5) com 1 oferta; Eletrônicos (b4) com 1 acessível com R$ 200 | completar slots com genéricas ou pedir mais ofertas à Visa |
| Coluna "Top vendida Visa" vazia | ver [[Decisões-Abertas]] item 16 |

## Arquivo "Ofertas_novembro" (Cupons Negociados | Novembro 2026)

| Problema | Tratamento |
|---|---|
| 4 linhas duplicadas (Seara, Giuliana Flores, L'Occitane ×2) | 62 ofertas únicas |
| Sem data fim e sem ticket mínimo em coluna própria | usados os da spec de out/26, conferidos com a descrição |
| Larroude: desconto 15%, descrição 10% · Zee Now: desconto 5%, descrição 10% | usado o da descrição; confirmar |
| Assist Card "apenas para MASS" | fora das vitrines até confirmar se Platinum pode |
| Spicy como Eletrodomésticos, mas é cozinha/mesa | Genérico (Casa) |
| Evino (bebida alcoólica) | exige aviso legal no card |

## Por que importa
Variação de grafia quebra agregação e distorce as bases de conhecimento (Fase 1). Corrigir é pré-requisito de comparabilidade.

## Relacionado
- [[Governança-de-Dados]] · [[Ontologia-v2]] · [[Taxonomia-Activity-Name]]
