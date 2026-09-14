# SDD — Reconciliação AppsFlyer × Activities via motor de taxonomia

Companion técnico do `ADR-003-reconciliacao-appsflyer-activities.md`. Este documento é a spec de implementação; o ADR é a decisão. Leia o ADR primeiro.

## 1. Problema

A aba Comunicações → Performance do Conteúdo (`TemplatePerformanceGrid.tsx`, alimentada por `useAppsFlyerAnalytics.ts`) mostra instalações/cliques/sessões da AppsFlyer por `template_id`, mas:

1. Só 2,6% dos installs carregam `af_sub3` (a maioria dos disparos não usa link governado).
2. Das linhas que carregam `af_sub3`, 100% falham no join contra o catálogo por um bug de case no coletor (ver ADR-003).
3. Não existe hoje nenhuma tentativa de reconciliar as linhas SEM `af_sub3` contra `activities` — elas ficam permanentemente como "Não reconciliado no catálogo", mesmo quando o dado (`af_channel`, `sub_param_1`=segmento, data, app→BU) já contém sinal suficiente pra reduzir bastante a ambiguidade.

Testei manualmente uma junção ingênua por `(BU, Canal, Segmento, dia)`: no período 30/07–05/08, buckets desse tipo têm rotineiramente **5 a 12 `activity_name` candidatas** (ex.: B2B2C e-mail CRM em 03/08 teve 12). Uma junção só por essas 4 dimensões não atribui — só lista suspeitos. É preciso o sinal extra que o motor de taxonomia já sabe extrair (momento/sequência, principalmente).

## 2. O motor existente (não reinventar)

`src/utils/taxonomy.ts` — usado hoje só em `useReconciliation.ts` (Activities↔Templates). Funções relevantes para reuso:

- `parseSeqParts(name)` / `parseSeq(name)`: extrai `S{semana}D{disparo}` ou `D{disparo}` de uma string livre (activity_name OU template_id), com 5 padrões de regex cobrindo variações reais de nomenclatura observadas em produção.
- `parseActivity(name, structured)`: decodifica `{publico, canal, campanha, segmento, cadencia, seq, variante, divergencias}` cruzando colunas estruturadas (`BU`, `Parceiro`, `Segmento`, `Canal`, `jornada`) com a string, com prioridade de fonte definida (coluna estruturada > jornada > string).
- `matchTemplate(parsed, candidatos)`: casa um `ParsedActivity` contra uma lista de `{dims: TemplateDims}`, com **veto duro** em `canal`/`publico` divergentes (nunca deixa casar com parceiro errado) e pontuação ponderada nas demais dimensões (`DIM_WEIGHT`: seq=26, canal=24, segmento=22, publico=16, campanha=12, variante=10 — desempate).
- `confidenceOf(match)`: `forte` (canal+publico+segmento+seq todos batem) / `provavel` (canal+segmento+pelo menos um de publico/seq) / `fraca` (canal + pelo menos um sinal) / `novo` (sem match).
- `translateTemplateId(id)`: decompõe um `template_id`/`af_sub3` já formatado nas mesmas dimensões, para exibição e para alimentar o matcher.
- `canalToId`, `segmentoKey`, `partnerCode`, `publicoFromColumns`: normalizadores de vocabulário, já validados contra dado real (comentário em `taxonomy.ts:224`: "Regra validada 2026-07-19 contra os dados reais").

Regressão: `src/utils/taxonomy.goldenset.ts`, rodada em DEV via `useReconciliation.ts:18-21`. Qualquer mudança no motor deve manter esse golden-set verde e, idealmente, ganhar novos casos cobrindo os exemplos de AppsFlyer deste documento.

## 3. Modelo de dados de origem (o que já existe, confirmado em produção)

### `appsflyer_acquisition_daily` (raw, grão fino)
Colunas relevantes: `business_date`, `app_id`, `platform`, `media_source`, `af_channel`, `campaign`, `sub_param_1..5`, `installs`, `metric_status` (jsonb).

Exemplo real (2026-08-04, Android, `br.com.sorocred.sorocredapp`):
```
media_source=crm  af_channel=whatsapp  campaign=repescagem_copa
sub_param_1=negados  sub_param_3=b2c_wpp_copa_ngd_d1  installs=196  quality_status=complete
```
```
media_source=crm  af_channel=email  campaign=dia_topo_de_funil_copa
sub_param_1=crm  sub_param_3=dia_email_copa_crm_s1d01  installs=38  quality_status=complete
```
Linhas com `media_source` diferente de `crm` (`cross_sale`, `blog`, `restricted`, `organic`, `facebook ads`) vêm com `af_channel`/`sub_param_*` vazios e `quality_status=directional` — **fora do escopo desta reconciliação** (ver ADR-003 §Escopo).

### `activities` (Framework/Salesforce)
Colunas relevantes: `"Activity name / Taxonomia"`, `"BU"`, `"Canal"`, `"Parceiro"`, `"Segmento"`, `"Data de Disparo"` (timestamptz), `jornada`, `template_id` (nullable, FK textual para `communication_templates.template_id`).

Cobertura real de `template_id` por BU/Canal (2026-08-06, dataset completo):
```
Plurix   WhatsApp  1984 disparos   0 com template_id
B2C      WhatsApp   964 disparos  246 com template_id
B2C      E-mail     930 disparos  202 com template_id
B2C      SMS        910 disparos    0 com template_id
Plurix   E-mail     669 disparos    2 com template_id
B2C      Push       586 disparos  243 com template_id
B2B2C    E-mail     270 disparos   10 com template_id
```

### `communication_templates`
`template_id` (PK, case-sensitive), `channel`, `metadata` (jsonb — chaves observadas em uso: `segmento_af_sub1`, `campanha`; ver `useReconciliation.ts:119-134`, função `templateDims()`).

### `appsflyer_governed_apps`
Mapeia `app_id` → o app real. Hoje só 2 dos 8 apps AppsFlyer da conta estão cadastrados (Android/iOS Afinz). **Pré-requisito externo a este SDD**: `app_id` → `BU` é 1:1 e confiável (`br.com.sorocred.sorocredapp`/`id1416167782` = B2C hoje) — mas quebra se/quando Plurix (`br.com.plurix.maisamigoapp`) e Bem Mais forem adicionados, porque passa a existir mais de um `app_id` por BU e o mapeamento app→BU deixa de ser trivial. Ver §7.

## 4. Arquitetura em 3 camadas

### Camada 0 — fix de normalização (pré-requisito, bloqueia as outras)

Em `supabase/functions/collect-appsflyer/index.ts`, `extractDimensionKey()`: `sub3` não deve passar por `norm()` (que faz `.toLowerCase()`). Preservar case, só `.trim()`. As outras 4 sub_params (`sub1`, `sub2`, `sub4`, `sub5`) continuam normalizadas — não são identidade de catálogo, são chaves de agrupamento livres.

Atenção ao efeito colateral: `sub_param_3` hoje faz parte da chave `onConflict` do upsert em `appsflyer_acquisition_daily` (`business_date,app_scope,app_id,platform,media_source,af_channel,campaign,geo,sub_param_1,sub_param_2,sub_param_3,sub_param_4,sub_param_5,attributed_touch_type,is_retargeting`). Preservar case muda o valor da chave para linhas que já existem no banco com a versão minúscula — a próxima coleta vai criar linhas NOVAS (case-correta) em vez de atualizar as antigas. Isso é o comportamento correto (a linha antiga estava com identidade errada), mas como o `deleteWindow()` já apaga o recorte antes de reinserir (ver `collect-appsflyer/index.ts`, mudança do incidente de 05/08), não deve sobrar resíduo — só confirmar que a mesma janela é recoletada após o deploy, não assumir que fica certo sozinho.

### Camada 1 — reconciliação exata (via `af_sub3`, depois do fix de case)

Para toda linha de `appsflyer_acquisition_daily`/`appsflyer_campaign_daily` com `sub_param_3`/`template_id` não vazio:

1. Tentar achar `communication_templates` com esse `template_id` exato (agora que a case bate).
2. Se achar: as `activity_name` candidatas são as que já têm esse mesmo `template_id` em `activities.template_id` (join direto).
3. Se não achar no catálogo, mas o valor parsear como um `template_id` bem formado (`translateTemplateId()` retorna dimensões válidas): tratar como candidato a NOVO template — sinalizar na fila de revisão de Cadastro e Templates (reaproveita o fluxo "+ Criar template" que já existe), não como erro silencioso.

Confiança desta camada: equivalente a `forte` sempre que o `template_id` bate exato — é o mesmo nível de certeza que uma FK.

### Camada 2 — reconciliação inferida (sem `af_sub3`, `media_source='crm'`)

Para cada linha de `appsflyer_acquisition_daily` com `media_source='crm'` e `sub_param_3` vazio:

1. Montar um `ParsedActivity` sintético via um novo adaptador `parseAppsFlyerRow()` (a escrever, em `src/utils/taxonomy.ts` ou módulo irmão), usando:
   - `canal` ← `canalToId(af_channel)` (mesma função já usada para `activities.Canal`)
   - `segmento` ← `segmentoKey(sub_param_1)` (mesma função já usada para `activities.Segmento`; sub_param_1 observado carrega valores como `negados`/`abandonados`/`crm`, vocabulário compatível)
   - `publico` ← resolvido de `app_id` via `appsflyer_governed_apps` (ver ressalva §3 sobre Plurix/multi-app)
   - `campanha` ← tentar `resolveDim('campanha', campaign)` (campo `campaign` da AppsFlyer, ex. `repescagem_copa`, `dia_topo_de_funil_copa` — vocabulário parcialmente compatível com `TAXO.campanha`, validar cobertura real antes de confiar)
   - `seq` ← não disponível diretamente sem `af_sub3`; ficará `null` nesta camada (é exatamente o sinal que falta e que gera a ambiguidade de 5-12 candidatos)
2. Buscar candidatas em `activities` com `"Data de Disparo"::date = business_date` (± 1 dia de tolerância, configurável — CRM pode disparar próximo da meia-noite) e `BU`/`Canal` batendo.
3. Rodar `matchTemplate()`-adaptado (ou uma variante que casa direto contra `ParsedActivity` de activities candidatas, não contra `TemplateDims` de catálogo — **é preciso decidir se se generaliza `matchTemplate` para aceitar `ParsedActivity` nos dois lados, ou se se escreve uma função irmã** `matchActivity(parsedAppsFlyer, activitiesCandidatas)`; ver §6, decisão em aberto).
4. Resultado esperado, dado que `seq` fica `null` nesta camada: a confiança teto realista é `provavel` (canal+segmento+publico batem, mas sem `seq` nunca chega em `forte` pela definição atual de `confidenceOf`). Quando sobrar mais de uma candidata com o mesmo score, **não escolher**: registrar todas como candidatas com o score, deixar pra fila de revisão.

### Camada 3 — persistência

Grava o resultado de qualquer confiança **exceto `novo`**, mas só marca como "atribuído" (contável em relatórios) o que tiver confiança configurável mínima (sugestão: `forte` conta automático; `provavel`/`fraca` entram na fila de revisão e só contam depois de confirmação humana — mesmo padrão UX que `useReconciliation.ts` já usa para órfãos de template).

## 5. Modelo de dados novo

Proposta de tabela nova (opção recomendada — ver alternativa e trade-off no ADR-003 §Decisão item 4):

```sql
create table activity_appsflyer_reconciliation (
  id uuid primary key default gen_random_uuid(),
  activity_name text not null,              -- FK textual para activities."Activity name / Taxonomia"
  business_date date not null,
  app_id text not null,
  platform text not null,
  installs numeric,
  clicks numeric,
  sessions numeric,
  metric_status jsonb not null default '{}',      -- mesma convenção do resto do GaaS: confirmed | not_available
  reconciled_via text not null,              -- 'sub3_exact' | 'matcher_inferred' | 'manual'
  confidence text not null,                  -- 'forte' | 'provavel' | 'fraca' (nunca grava 'novo')
  match_reasons jsonb,                       -- saída crua de matchTemplate()/matchActivity() para auditoria
  candidate_activity_names text[],           -- outras candidatas descartadas, para auditoria/reversão
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  source_run_id bigint references appsflyer_collection_runs(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activity_name, business_date, reconciled_via)
);
```

Por que tabela separada e não colunas em `activities`: `activities` é espelho do Framework/Salesforce, reprocessado por importadores próprios (`IntelligentFrameworkUpdate.tsx` e afins) — colunas de outra fonte ali correm risco de serem apagadas/sobrescritas num reprocessamento e misturam proveniência na mesma linha, contra o princípio de governança já em uso no resto do projeto (`metric_status` por fonte, nunca fusão silenciosa de grãos diferentes). A tabela nova é auditável, reversível (basta `DELETE`/reprocessar), e o join para consumo (`activities` ⋈ `activity_appsflyer_reconciliation` por `activity_name`) é trivial no front. **Se o time preferir simplicidade de query e aceitar o trade-off de acoplamento, a alternativa é adicionar `af_installs`, `af_clicks`, `af_sessions`, `af_reconciliation_confidence` como colunas nullable em `activities` — funcionalmente equivalente, só perde o histórico de candidatas descartadas e fica mais arriscado em reprocessamento. Decisão do time, não uma imposição técnica deste SDD.**

## 6. Decisões em aberto (para o Codex avaliar, não estão fechadas)

1. **Generalizar `matchTemplate()` ou escrever `matchActivity()` irmã?** `matchTemplate` hoje espera candidatos com `{dims: TemplateDims}`. Uma linha de `activities` parseada por `parseActivity()` já produz um formato quase idêntico (`ParsedActivity`) — dá pra unificar os tipos com pouco atrito, ou vale a pena manter funções separadas para não acoplar dois casos de uso (Activities↔Templates vs AppsFlyer↔Activities) que podem divergir de regra no futuro? Recomendo começar com função irmã (menos risco de regressão no fluxo já em produção) e avaliar unificação depois que os dois estiverem estáveis.
2. **Tolerância de data.** CRM pode disparar de véspera/madrugada; `business_date` da AppsFlyer é fuso `America/Sao_Paulo` (confirmado no coletor), `Data de Disparo` em `activities` é `timestamptz` — confirmar se ambos já estão no mesmo fuso antes de decidir a janela de tolerância (±0, ±1 dia).
3. **Threshold de confiança mínima para contar em relatório vs exigir revisão.** Proposta inicial no §4 (forte=automático, provável/fraca=fila) é um ponto de partida, não dogma — calibrar depois de rodar contra 1-2 semanas de dado real e olhar quantos casos `provavel` realmente batem quando um humano revisa.
4. **`campaign` da AppsFlyer como sinal de campanha.** Os valores observados (`repescagem_copa`, `dia_topo_de_funil_copa`, `carrinho_copa`, `missao_vibe`) parecem carregar sinal de jornada/campanha, mas não foi validado sistematicamente contra `TAXO.campanha` nem contra `activities.jornada`. Vale um passo de auditoria antes de usar esse campo com peso alto no matcher.
5. **`app_id` → `BU` deixa de ser 1:1 quando Plurix/Bem Mais forem adicionados a `appsflyer_governed_apps`** (hoje só Android/iOS Afinz estão cadastrados — ver achado paralelo sobre cobertura de apps). Nesse momento, `publico` na Camada 2 passa a vir do `app_id` real (cada BU tem seu próprio app), o que na verdade **facilita** o matcher (sinal mais forte que hoje) — mas o adaptador `parseAppsFlyerRow()` não deveria hardcodar o mapeamento atual (só B2C); escrever já esperando N apps.

## 7. Fora do controle deste SDD (fica registrado, não é ação de código)

- Cobertura de link governado fora do CRM (Plurix inteiro, SMS, parte do Push/E-mail) é decisão de processo/instrumentação de quem gera os links, não algo que reconciliação por matching resolve — matching nunca inventa um `af_sub3` que nunca existiu.
- A discrepância `af_sub1` (ADR-002 diz template_id, dado real mostra segmento) deveria ser esclarecida com quem mantém o gerador de OneLink, e o ADR-002 corrigido se for o caso.

## 8. Plano de fases

**Fase 1 — fix + camada exata (baixo risco, alto retorno imediato).**
Corrigir case no coletor. Trocar join exato por chamada ao motor via `translateTemplateId()`. Sem tabela nova ainda — só corrigir o join existente em `useAppsFlyerAnalytics.ts`. Critério de aceite: linhas com `af_sub3` presente deixam de aparecer como "Não reconciliado no catálogo" quando o template existe no catálogo.

**Fase 2 — modelo de dados + camada inferida, sem automação.**
Criar `activity_appsflyer_reconciliation`. Escrever `parseAppsFlyerRow()` + matching (camada 2). Persistir tudo com `reviewed_at IS NULL`. Nenhuma UI nova ainda — validar via SQL que os matches fazem sentido antes de expor.

**Fase 3 — UI de revisão.**
Estender `ReconciliationAudit.tsx`/`ReconciliationQueue.tsx` (ou criar aba irmã) para mostrar candidatas por confiança, permitir confirmar/rejeitar. Reaproveitar o padrão visual já existente (fila de órfãos com "Sugestões").

**Fase 4 — consumo em Performance do Conteúdo.**
`TemplatePerformanceGrid.tsx`/`useAppsFlyerAnalytics.ts` passam a ler também `activity_appsflyer_reconciliation` (via join com `activities`), com badge de proveniência (`confirmado via af_sub3` / `inferido, confiança X` / `revisado manualmente`) — nunca misturar com o funil interno (`Cartões Gerados`, `CAC`) sem deixar a fonte visualmente óbvia, mesma regra já usada no restante do GaaS.

## 9. Riscos e guardrails

- Nunca contar instalação inferida como `confirmed` no `metric_status` — usar `inferred_via_matcher` explicitamente, distinto de `confirmed_via_sub3`.
- Nunca atribuir 1:1 quando há empate de score entre duas ou mais candidatas — persistir todas em `candidate_activity_names`, sem escolher.
- Rodar o golden-set de `taxonomy.ts` antes de qualquer merge que toque nas funções compartilhadas — regressão ali quebra silenciosamente o fluxo de Cadastro e Templates que já está em produção.
- Escopo travado em `media_source='crm'` nesta fase — não tentar reconciliar mídia paga contra `activities` (não são a mesma classe de evento; mídia paga vai para o bridge com `paid_media_metrics`, assunto separado).
