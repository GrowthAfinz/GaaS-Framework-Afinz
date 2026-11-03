---
tags: [operacao,appsflyer,atribuicao,tracking,governanca,template]
tipo: operacao
camada: operacao
atualizado: 2026-07-28
status: confirmado
fonte: planilha-governanca + validacao-mcp-appsflyer
---

# AppsFlyer — Tracking e Atribuição (CRM + Mídia)

**Definição:** a camada de **atribuição unificada** — CRM ([[SFMC-Salesforce-Marketing-Cloud|SFMC]]/WhatsApp), [[Mídia-Paga]] e parceiros lidos de forma padronizada no AppsFlyer, por origem, canal, campanha, público, **template** e etapa de conversão do funil de cartão.

> ⚠️ **Correção 2026-07-28.** A versão anterior desta nota mapeava os sub-params errado (dizia `af_ad_id + af_sub1 = ID do template` e `af_ad = Activity Name`). A **fonte de verdade** agora é a planilha oficial `GOVERNANÇA_LINKS_E_TEMPLATES` (aba `Base_Links_CRM`, 556 links), validada contra os dados vivos via MCP AppsFlyer. O mapa correto está abaixo.

## Decisão estrutural — mapa de parâmetros (corrigido)
`pid=crm` é a **Media Source única de governança**; o canal real vive em `af_channel`. Parâmetros de query são capturados no clique (nada precisa ser pré-cadastrado).

| Parâmetro | Valor / origem | Significado |
|---|---|---|
| `pid` | `crm` (fixo) | Media Source de governança |
| `af_channel` | whatsapp, sms, email, push (meta_ads/google_ads na mídia) | canal real de ativação |
| `c` | campanha CRM | [[Campanha]] |
| `af_sub1` | **[[Segmentos]]** — base_proprietaria, negados, abandonados… | público |
| `af_sub2` | **SEMANA/MOMENTO** — s1, s2… | posição na [[Régua]] |
| `af_sub3` | **ID [[Template]]** — ex. `b2c_email_copa_bsp_S1D01` | **identidade de conteúdo reutilizável (chave da orquestração)** |
| `af_dp` | `sorocredapp://` | deep link (destino no app) |
| `af_ad` | *(vazio hoje)* | seria o [[Taxonomia-Activity-Name]] — **NÃO está ligado**; só auditoria |

O `af_sub3` embute BU+canal+campanha+segmento+**semana/dia da régua** (`SxDy`). A aba `ID_Dicionario` da planilha traz a normalização de códigos (Negados→`ngd`, whatsapp→`wpp`) que resolve a duplicação de caixa `CRM`/`crm`.

Em Meta/Google, `c`/`af_adset`/`af_ad` usam **macros dinâmicas** (`{{campaign.name}}`…); no CRM o valor é **fixado por template**.

## Validação de cobertura (2026-07-28)
- ✅ Links carregam `af_sub3` na query: `…/9ODN/mtuc2zhn?c=b2c_topo_de_funil_copa&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_copa_bsp_S1D01`.
- ✅ `discover_onelink` confirma `pid=crm` + `af_channel=email` + `af_dp=sorocredapp://` no link base (template `9ODN` = PROD_AFINZ_ONELINKS).
- ✅ Links governados estão **vivos e atribuindo**: `pid=crm` aparece como a media source `crm` (minúscula) no agregado, com as campanhas/segmentos batendo.
- 🟡 **Só links governados** (`LINK AJUSTADO?=True`) carregam `af_sub3`. Legados aparecem como `WhatsApp`/`CRM`(maiúsc)/`SMS`/`Cross_sale` **sem** template.
- 🔴 **Crux:** a API **agregada** só expõe `af_sub1`. `af_sub2`/`af_sub3` **só saem por raw data** → performance por template exige **Pull API / Data Locker** (ver [[AppsFlyer-Ingestao-Template-Arquitetura]]).

## Conversão em dois níveis
Clique é métrica intermediária. Funil: clique → install/abertura → `account_created` → `proposal_submitted` → `account_approved` → cartão emitido.
- **Conversão operacional:** `Account Created` (evento primário de otimização de mídia).
- **Conversão de negócio:** `Account Approved` / cartão emitido (qualidade da aquisição).

> ⚠️ **Estado real do app (2026-07-28):** hoje só o evento auto-coletado `af_content_view` chega ao AppsFlyer — os eventos de negócio são disparados como `af_content_view` + `af_param_1` (mapeamento condicional → StartTrial/registration no Facebook). Não há evento de **cartão emitido**. Ver [[Funis-de-Onboarding-GaaS]].

## OneLink — 1 link base por canal
Domínio: **`cartao-afinz.onelink.me`**, template **`9ODN`** (PROD_AFINZ_ONELINKS). Parâmetros na query **sobrescrevem** os do link curto. 12 templates na conta; `Afinz_B2C` (I1Ur, 80 links) e `9ODN` (7) são os B2C de produção; `Campanhas Hirota` (tEcz) = parceiro com domínio próprio.

**Gerador:** planilha `Gerador_Links_AppsFlyer_CRM_Afinz_v2.xlsx` → hoje consolidada na `GOVERNANÇA_LINKS_E_TEMPLATES`.

## Papel do AppsFlyer no GaaS
Camada de atribuição que **liga o CRM à espinha [[activities]] via [[Template|template_id]]** (não via Activity Name). É a fonte do rastro de app (clique→install→sessão) que hoje falta em cada disparo, e o **prior de conteúdo** do [[Orquestrador]]. Arquitetura completa em [[AppsFlyer-Ingestao-Template-Arquitetura]].

## Pendências
> ⚠️ A validar: amostra Pull API provando `af_sub3` no raw (passo 0); geração dos links dos canais restantes; SDK+UDL e eventos SDK nomeados + `Card order completed` no app (time dev); tabela `attribution_links` como entidade.

## Relacionado
- [[AppsFlyer-Ingestao-Template-Arquitetura]] · [[appsflyer_template_daily]] · [[Template]] · [[Taxonomia-Activity-Name]] · [[Segmentos]] · [[Orquestrador]] · [[Funis-de-Onboarding-GaaS]] · [[SFMC-Salesforce-Marketing-Cloud]] · [[Mídia-Paga]]
