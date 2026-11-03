---
tags: [engenharia,appsflyer,template,ingestao,pull-api,orquestracao,arquitetura]
tipo: engenharia
camada: codigo-dados
atualizado: 2026-07-28
status: proposto
fonte: investigacao-mcp-appsflyer + planilha-governanca + decisao-operador
---

# AppsFlyer — Ingestão via template_id (Arquitetura)

**Definição:** a arquitetura que pluga a performance de app do AppsFlyer na espinha [[activities]] usando o **`template_id` (`af_sub3`)** como chave — não o [[Taxonomia-Activity-Name|Activity Name]] — para virar **prior de conteúdo do [[Orquestrador]]**.

## Por que template_id (e não Activity Name)
- **Activity Name = one-shot.** Um disparo aconteceu uma vez; sua performance não é reaproveitável. É sinal do **passado**.
- **template_id = prior reutilizável.** O mesmo criativo ([[Template]]) atravessa disparos, safras e campanhas. Aprender *"template X converte Y% clique→install no segmento Negados, na semana S1"* é conhecimento que o [[Orquestrador]] aplica ao planejar a próxima [[Régua]]. É sinal do **futuro**.
- `af_sub3` embute a **posição de régua** (`S1D01`) → o orquestrador aprende efeito de dia/criativo por segmento, não só de campanha.

## O crux que define o pipe

**Três coisas distintas (não confundir):**
1. **Ler o valor do template_id no link** — trivial (parse da string; a planilha já tem). Nunca foi o problema.
2. **Performance agregada POR template_id** — o endpoint **agregado** (usado no MCP) só agrupa/filtra por `af_sub1`. `af_sub2`/`af_sub3` **não são dimensões no agregado**. O AppsFlyer captura o af_sub3 (fonte = link), mas o relatório agregado não deixa fatiar por ele.
3. **Performance bruta POR template_id** — só via **raw data** (Pull API ou Data Locker), onde cada linha traz as colunas `Sub Param 1..5`.

| Recorte | Fonte AppsFlyer | Pipe |
|---|---|---|
| Install/clique por **campanha · origem · segmento (af_sub1)** | API agregada | MCP/skill (fácil) |
| Install/onboarding por **template_id (af_sub3)** | Raw data | **Pull API** ou Data Locker |
| **Clique** por **template_id** | Raw data | **só Data Locker** (Pull API não tem relatório de clique) |

## Fonte do raw: Pull API vs Data Locker

Decisão inicial (2026-07-28): **Pull API via skill**. Mas se o **BI já tiver Data Locker**, esse vira o caminho melhor — bifurcação a resolver com o time de BI.

**Pull API** (raw data pull) — a skill puxa CSV sob demanda.
- Endpoint: `https://hq1.appsflyer.com/api/raw-data/export/app/{app_id}/{report}/v5` · header `Authorization: Bearer <token V2.0>` (gerado no painel, admin, vale p/ toda a conta).
- Relatórios: `installs_report`, `in_app_events_report` (+ `organic_*`). Params: `from`/`to`, `timezone`, `event_name`, `maximum_rows`, `additional_fields`.
- Cada linha traz `Sub Param 1..5` (fonte = link) → **af_sub3 = template_id por install/evento**.
- Limites: janela **90 dias**, **1M linhas/chamada**, CSV.
- ⚠️ **Não tem relatório de clique** → clique fica no grão de **campanha** (agregado).

**Data Locker** (premium) — AppsFlyer **empurra** o raw continuamente pro warehouse do BI.
- Destinos: bucket AWS do AppsFlyer, ou **seu** S3 / GCS / Azure / **BigQuery** / **Snowflake**. CSV/Parquet, multi-app, sem limite de volume, janela de 14 dias no bucket.
- Frescor: installs/eventos de hora em hora; uninstalls diário.
- ✅ Inclui **cliques** (fecha o gap da Pull API) + installs + eventos, todos com af_sub1-5.
- Dono operacional = **time de BI**. Se existe, o GaaS lê do warehouse (view/sync) em vez de puxar.

**Checklist p/ o BI (define o cenário):**
1. Data Locker ativo? Para quais apps e relatórios (installs / in-app events / **clicks**)?
2. Cai onde — S3 / BigQuery / Snowflake? Acesso de leitura ou view?
3. ⭐ **As colunas `Sub Param 1–5` (af_sub1..5) estão no schema entregue?** (Data Locker deixa escolher campos; sem sub params, o template_id não chega mesmo com Data Locker.)
4. Segregado por app ou unificado? CSV/Parquet?

**Cenários:**
- **Data Locker COM sub params** → melhor: GaaS lê do warehouse; ganha clique-por-template; a "skill Pull API" vira **sync warehouse → Supabase**.
- **Data Locker SEM sub params** → pedir inclusão de af_sub1-5 na config (mudança pequena do lado BI).
- **Sem Data Locker** → **Pull API via skill** (installs + eventos por template; clique em campanha).

## Arquitetura em camadas

```
CATÁLOGO      communication_templates (existe — skill gaas-governanca-comunicacoes)
                PK template_id (UPPER) · metadata.template_id_planilha = af_sub3 (case misto)
                + campanha, af_sub2(semana), af_sub1(segmento), canal, activity_names
                    │ template_id
LINKS         attribution_links (A CRIAR — planilha já tem LINK URL FINAL)
                template_id → OneLink URL + params (pid=crm, af_channel, c, af_sub1..3)
                    │ af_sub3 = template_id
PERFORMANCE   appsflyer_template_daily (A CRIAR — via Pull API)
                grão: date × template_id · af_clicks, af_installs, af_sessions
                (fut.) af_onboarding_started / _finished · FK → communication_templates
                    │ rollup por template_id
ESPINHA       activities (cada disparo tem template_id) → ganha o rastro de app
                    │ priors por template
ORQUESTRADOR  "qual template propor no próximo disparo, por segmento e posição de
                régua, para maximizar clique→install→cartão"
```

## Tabelas novas (schema enxuto)

### `appsflyer_template_daily`
- **Grão:** `date × template_id`. Atributos denormalizados (canal, segmento af_sub1, semana af_sub2, campanha) vêm do catálogo, não do AppsFlyer.
- **Colunas:** `af_clicks`, `af_installs`, `af_sessions`; fase 2: `af_onboarding_started`, `af_onboarding_finished`.
- **FK:** `template_id` → `communication_templates`.
- **Volume:** baixo (nº de templates ativos × dias). Zero raw por usuário.

### `appsflyer_template_map` (crosswalk)
- Resolve `campanha + af_sub1 + af_sub2 + canal + date` → `activities.id` **onde `af_sub3` falta** (links legados), com `confidence` + fila de revisão — reusa a UX do [[Ingestão-de-Dados|GaaS Updater]] / padrão [[paid_media_campaign_mappings]].

### `appsflyer_collection_runs` (governança)
- Lifecycle `pending → complete | failed`. Ausência = `not_available` (nulo); zero explícito = `explicit_zero`. Sem soma cruzada de grãos. Espelha o coletor Meta ([[Funil-Onboarding-Arquitetura-e-Ingestao]]).

## Regras de join (quebram em silêncio se ignoradas)
1. **Caixa:** `af_sub3` do link é **case misto** (`b2c_email_copa_bsp_S1D01`); o PK de `communication_templates` é **UPPER**. Join **sempre** em `metadata.template_id_planilha` (ou `lower(af_sub3)=lower(pk)`), **nunca** no PK direto.
2. **Cobertura:** só links governados (`LINK AJUSTADO?=True`) carregam `af_sub3`. Legados (media source `WhatsApp`/`CRM`-maiúsc/`SMS`/`Cross_sale`) caem no crosswalk fuzzy. Nunca fingir template onde não há.
3. **Gate confirmado/direcional/bloqueado:** só entra no funil o que reconcilia; cobertura parcial fica direcional; sem `af_sub3` no raw = bloqueado.

## Contrato da skill (Pull API)
1. **Passo 0 — prova de cobertura (obrigatório):** puxar amostra de raw data e **confirmar `af_sub3` preenchido** antes de qualquer gravação. Sem isso, aborta (não constrói sobre vazio — lição do `af_ad=None`).
2. **Puxar** installs + in-app events (raw) na janela → **normalizar** `af_sub3` (case, dicionário) → **agregar** por `af_sub3 × dia`.
3. **Gravar** `appsflyer_template_daily` com run governada; reconciliar contra o catálogo; fuzzy só onde falta template.
4. **Reportar** cobertura (% de installs com template resolvido) — nunca truncar em silêncio.

## Duas alavancas independentes (não confundir)
| Alavanca | Liga | Dono | Dificuldade |
|---|---|---|---|
| **Governança de link** (`af_sub3` no gerador) | topo/atribuição → template → espinha | CRM ops | 🟢 baixa (já em curso) |
| **Eventos SDK nomeados + emissão** | fundo (onboarding→cartão) | time mobile | 🟡 média |

## Consumo
- **5ª aba do [[Funis-de-Onboarding-GaaS|Funil de Aquisição]]:** performance por template (clique→install→sessão), lente de segmento e posição de régua.
- **[[Orquestrador]]:** lê `appsflyer_template_daily` como prior por template × segmento × S/D.
- **Custo-por-install de CRM:** cruzar `af_installs` com a tarifa de canal do GaaS ([[Custos-e-Investimento]]) → o CRM finalmente ganha denominador de app, na mesma régua da paga ([[Função-Objetivo]]).

## Relacionado
- [[AppsFlyer-Tracking-CRM]] · [[appsflyer_template_daily]] · [[Template]] · [[activities]] · [[Orquestrador]] · [[Ingestão-de-Dados]] · [[paid_media_campaign_mappings]] · [[Funil-Onboarding-Arquitetura-e-Ingestao]] · [[Função-Objetivo]]
