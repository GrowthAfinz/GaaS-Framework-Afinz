---
tags: [ia,mcp,ga4,analytics,integracao,seguros]
tipo: operacao
camada: operacao
atualizado: 2026-10-01
status: confirmado
fonte: ga4-data-api + validacao-mcp-analytics
---

# GA4 MCP — como usar o Google Analytics pela IA

**Definição:** o MCP oficial do Google Analytics (`analytics-mcp`, mantido pelo Google) dá à IA acesso **somente leitura** ao GA4 da Afinz: lista contas/propriedades, roda relatórios com dimensões, métricas e filtros, relatórios em tempo real, funis e conversões. Ver [[MCP-Visão-Geral]].

## Setup (2026-10-01)
| Item | Valor |
|---|---|
| Servidor | `analytics-mcp` 0.7.0 · `C:\pipx\bin\analytics-mcp.exe` |
| Onde está ligado | Claude Desktop + Claude Code (escopo user) |
| Conta GA4 | **Afinz - Online** (`accounts/108058749`) |
| Propriedades | **Afinz – GA4** (`properties/337436715`) · cloud.relacionamento.afinz (`properties/439540906`) |
| Credencial | ADC do gcloud — **o mesmo arquivo do MCP do Google Ads** |

> ⚠️ **Regra de credencial:** GA4 e Google Ads dividem o mesmo `application_default_credentials.json`. Relogin **só** via `C:\Users\Pablo Prado\scripts\google-mcp\relogin.ps1` (já usa os 3 escopos: analytics.readonly + adwords + cloud-platform). Conferir com `checar.ps1`. Um relogin sem os 3 escopos quebra um dos dois MCPs.

## Como pedir — os 4 aprendizados
1. **Primeiro descubra quando os dados começam.** Antes de pedir "crescimento", peça a série mensal desde o início. Cada domínio tem o seu início (a propriedade começa em out/22; a loja de seguros só em 03/03/26). Sem isso a IA escolhe um período arbitrário.
2. **Diga a propriedade e filtre o domínio.** A "Afinz – GA4" mistura **vários sites** (afinz.com.br, cloud.relacionamento, loja.afinzseguros, staging, localhost…). Sempre filtre `hostName`, senão o site principal (≈97% das views) engole o resto.
3. **Peça a quebra, não só o número.** Crescimento sem quebra por canal (`sessionDefaultChannelGroup`), origem (`sessionSourceMedium`), página (`pagePath`) e dispositivo não explica nada.
4. **Peça para avisar se faltar dado** e para separar tráfego interno/teste (ver armadilhas).

### Prompt-modelo
> Na propriedade Afinz – GA4, filtrando hostName = `<domínio>`: (1) me diga a primeira data com dados; (2) mostre mês a mês desde então page views, usuários ativos e views por usuário, com variação % mês contra mês e do primeiro ao último mês completo; (3) quebre por canal e pelas 10 páginas principais; (4) exclua tráfego interno (sharepoint, IPs 172.x, tagassistant, betalabs); (5) avise se a amostra for pequena demais para concluir.

### Outros usos que valem
- **Origem do crescimento:** evolução por canal (orgânico × pago × direto × CRM).
- **Funil:** páginas de produto → `/checkout/cart` → `/checkout/payment` → `/checkout/completed`.
- **Tempo real:** conferir se um disparo/campanha está chegando no site.
- **Cruzar fontes:** tráfego que o GA4 atribui ao Google Ads × spend no MCP do Google Ads × cartões no Supabase.

## Armadilhas de leitura
- **"Views por usuário" não soma nem compara entre granularidades.** A média mensal é maior que a semanal (o mesmo usuário volta na semana seguinte). Compare só mês com mês ou semana com semana.
- **Amostra pequena = ruído.** Com ~200 usuários/mês, oscilações de ±15% na razão são normais. Confirme com o volume absoluto antes de chamar de tendência.
- **Mês corrente é parcial** — nunca usar na variação.
- **Tráfego interno não está filtrado** no GA4: aparecem `sorocredcombina.sharepoint.com`, IP `172.23.139.201`, `tagassistant.google.com`, `betalabs.com.br` (fornecedor da loja) e até uma compra de teste vinda de IP interno.
- **`purchaseRevenue` = 0** em todas as compras da loja: a receita não é enviada no evento.

## Snapshot — loja.afinzseguros.com.br (2026-10-01)
> 📊 Dados de 03/03/2026 a 30/09/2026 (7 meses completos). Foto do momento — confirmar no GA4 antes de reusar.

| Mês | Page views | Usuários ativos | Views/usuário |
|---|---|---|---|
| mar/26 | 544 | 235 | 2,31 |
| abr/26 | 429 | 188 | 2,28 |
| mai/26 | 402 | 184 | 2,18 |
| jun/26 | 380 | 165 | 2,30 |
| jul/26 | 533 | 247 | 2,16 |
| ago/26 | 436 | 158 | 2,76 |
| set/26 | 547 | 263 | 2,08 |

**Leitura:**
- **Views por usuário não cresceu: caiu ~10%** de mar a set (2,31 → 2,08; ≈ −1,7% ao mês). Sem tráfego interno, −13% (2,35 → 2,03). Na prática é **estável em ~2,2–2,3**; o pico de ago (2,76) veio de menos usuários com o mesmo volume de páginas, não de mais engajamento.
- **Volume também está de lado:** page views 544 → 547; usuários +12% (235 → 263). A loja não está crescendo.
- **Canal muda tudo:** referral do afinz.com.br = 3,39 views/usuário; direto 2,62; orgânico 2,02; **Meta pago = 1,00** (engajamento 24% — cai e sai).
- **Orgânico é a base:** 59% das sessões, quase tudo em `/voce-bem-saude-super` (806 usuários). Mobile = 75% dos usuários.
- **Compras vêm do site principal:** 9 compras no período; 6 vieram de `afinz.com.br / referral`, que tem ~18% dos usuários.
- **Funil do checkout:** carrinho 121 usuários → pagamento 53 (44%) → concluído 8 (15%). O maior vazamento é **no pagamento**.
- **Campanha Meta nova em 30/09:** 49 sessões via `meta / cpc` caindo em `/afinz-assistencia-24horas`, 1 página cada (por isso views/usuário da semana 40 caiu para 1,40).

## Gaps de instrumentação encontrados
- `AddToCart` dispara 3 vezes contra 121 usuários no carrinho → evento quebrado.
- Evento customizado `Início de sessão` (3.074) duplica o `session_start` (1.738).
- `purchase` sem receita.
- Sem filtro de tráfego interno.
- ⚠️ **Possíveis sites clonados com a tag da Afinz:** `afinzsabancomultiplo.online`, `www.afinzsabancomultiplo.online.acessaronlinesemparar.online`, `taxado.libereseupedido.tech`, `acessofinanceiro.online`, `oficialsmartbet.com` aparecem como hostname na propriedade (volume baixo). Padrão típico de **phishing** copiando o site — levar para Segurança/Fraude.

## Relacionado
- [[MCP-Visão-Geral]] · [[Mídia-Analytics]] · [[Integração-Mídia-Paga]] · [[AppsFlyer-Tracking-CRM]]
