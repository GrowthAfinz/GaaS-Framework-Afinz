# Release 8 — Gatilhos por frente e camada de IA do Loop de Aprendizado Growth

**Data:** 2026-10-27
**Status:** revisão de contratos v3 para diagnóstico e preparação da implementação. Nenhuma implementação ou verificação de produção é atestada por este documento.
**Revisão:** 27/10/2026. Substitui a versão `_SPEC_2.md`. Regras operacionais adicionais e critérios de bloqueio estão na §14; os números históricos permanecem hipóteses a verificar na fatia 0/backtest.
**Autoria:** Claude (Cowork). Implementação: Codex. Aprovação e incorporação: Pablo.
**Lugar no repositório:** `docs/plans/learning-loop/`, depois de `RELEASE_7C_*`.

## 0. Por que esta release existe

As Releases 1 a 7B entregaram a infraestrutura do loop: feed, aposta, avaliador de outcome, memória versionada e reuso (`learning-loop/IMPLEMENTATION_ROADMAP.md`). O loop não fecha porque **não entra sinal que valha uma aposta**.

Estado reportado pela especificação original como medido em 27/10/2026; ainda não revalidado nesta revisão:

| Fato | Valor |
|---|---:|
| `report_action_candidates` | 48 |
| Códigos de sinal distintos | **3** |
| Desses, sinais de performance | **0** |
| `growth_signal_decisions` | 0 |
| `growth_bets` | 1 |
| `report_action_outcomes` | 0 |
| `growth_result_retrospectives` | 0 |
| Último build do Report Live | 15/09 |

Os três códigos são de higiene e renascem a cada run, porque a deduplicação só vale dentro do run:

| Código | Ocorrências |
|---|---:|
| `TEMPLATE_COVERAGE_LT_80` | 25 |
| `MEDIA_ZERO_CONVERSION_WITH_CLICKS` | 17 |
| `PARTNER_NA_CLASSIFICATION` | 6 |

Esta release cria a camada que faltava, entre os dados e a Fila:

```text
Registro de Operações → Gatilhos por frente → Candidata com identidade estável
→ Camada de IA (agrupa, decompõe, redige) → Fila → Aposta → Outcome → Memória
```

O princípio do `learning-loop/INDEX.md` continua valendo: **a detecção é determinística; a IA só lê e redige**. Número, faixa, desvio e veredito nunca são escritos por IA.

## 1. Decisões de produto que esta spec assume

Decisões de 27/10/2026:

- Escopo: todas as frentes de aquisição e de cross-sell. Ficam fora rentabilização e ciclo de vida.
- Desvio positivo também gera candidata, com o propósito de entender o que funcionou e replicar.
- Mês certificado e depois revisado na base: o snapshot certificado continua valendo, e a diferença gera um gatilho de revisão.
- Sensibilidade: nível **Moderado** (§4.3).
- Execução: Claude especifica e implementa o renderer; Codex implementa dados e pipeline; Pablo revisa e incorpora no vault.

Decisões de 25/09/2026 que permanecem (`report-live-async/PRODUCT_DECISIONS_2026-09-25.md`):

- O output oficial é `monthly_full`, com cardinalidade dinâmica.
- P7 e M7 incorporados a C8.
- Renderer PPTX/PDF pelo Claude Cowork, publicação em Storage e cadência de 3 vezes por semana.

## 2. Escopo por frente

| Frente | Unidade | Fonte | Frescor em 27/10 | Gatilhos ligados |
|---|---|---|---|---|
| CRM Aquisição B2C Proprietária | operação BU × segmento × parceiro | `activities` | até 26/10 | T1, T2, T6, T5 |
| CRM Aquisição B2B2C (Serasa, Bem Barato, Dia) | idem | `activities` | até 26/10 | T1, T2, T6, T5 |
| CRM Aquisição Plurix | idem | `activities` | até 26/10 | T1, T2, T6, T5 |
| Mídia paga de aquisição | campanha canônica | `paid_media_metrics` + `canonical_paid_media_campaigns` | até 22/10 | T4, T5, T7 |
| Originação B2C e funis | população (`total`, `serasa_api`, `crm`) e funil | `b2c_daily_metrics`, `app_afinz_funnel_daily_raw`, `serasa_bi_daily_funnel` | **27/09, 28/09 e 12/07** | T5 agora; T1 quando a fonte voltar |
| Cross-sell: Seguros | campanha e família | mídia Seguros Leads/Venda; `rentabilizacao_activities` filtrada por família de seguros | parcial | T5 e T4 apenas, até a métrica de venda ser certificada |

**Leitura de escopo a confirmar:** "cross-sell" foi interpretado como Seguros (vendido a cartonistas) e Upgrade. Upgrade não aparece como segmento em `activities` no período mar–out/2026. Por isso entra só quando existir.

**Fora:** famílias RENT de uso, ativação, welcome e Copa, e réguas de ciclo de vida.

## 3. Registro de Operações

### 3.1 O que já existe

Segundo o inventário citado, as 164 notas `07-Evolucao/Assunto-*.md` do vault representam o inventário de entidades gerado em 03/10/2026 (`07-Evolucao/Inventario-Operacoes-Growth.md`). Cada uma tem `inventory_id` e escopo tipado.

Os prefixos são CRM (33), RENT (43), MID (29), MAP (18), COP (12), meta-name (10), DOC (7), FUN (6), B2C (3) e uuid (3). Todas estão com `status: candidato` ou `inventariado`.

### 3.2 O que esta release cria

Tabela `growth_operations`, aditiva, como fonte que o motor lê:

```text
operation_id text pk          -- = inventory_id (ex.: CRM-c063e536a7)
front text                    -- crm_aquisicao | midia_aquisicao | originacao_b2c | cross_sell_seguros | fora_de_escopo
domain text                   -- CRM | MID | B2C | FUN | RENT | ...
scope jsonb                   -- {bu, segment, partner} ou {canonical_campaign_id} ou {population}
display_name text
lifecycle text                -- candidata | confirmada | aposentada
aliases jsonb                 -- MAP-* e meta-name-* apontam para a operação MID correspondente
vault_note_path text          -- caminho da nota no vault
confirmed_by text null
confirmed_at timestamptz null
valid_from date                -- início da vigência do escopo
valid_to date null             -- fim exclusivo; null = vigente
regime_start date null         -- corte de comparabilidade; Serasa: 2026-02-01
scope_schema_version integer
provenance jsonb               -- inventário, hash, linha/nota e classificação
created_at, updated_at
```

Regras:

1. **Seed:** as 33 operações CRM entram como `candidata`, com escopo idêntico ao do inventário (BU × segmento × parceiro canônico). As MID entram com a campanha canônica. RENT entra como `fora_de_escopo`, exceto as famílias de seguros, que entram como `cross_sell_seguros`.
2. **Confirmação:** gatilho de performance só dispara para operação `confirmada`. Até Pablo confirmar, roda em modo de observação: aparece no relatório de backtest e não vai para a Fila.
3. **MAP, meta-name e COP** não são operações. São identidades de campanha. Viram `aliases` da operação MID que representam, ou `fora_de_escopo` quando forem de Copa ou rentabilização.
4. **DOC** não é operação. Vira linha do tempo na nota da operação a que se refere.

### 3.3 Recompilação das notas (gerador)

O gerador passa a ler `growth_operations` e escrever cada nota com:

- **o que é próprio da operação:** escopo, campanhas, variantes, proveniência e estado;
- **uma seção nova, "Gatilhos, apostas e outcomes desta operação":** consulta ao vivo no reader; no Markdown, só o link;
- **frontmatter:** `vigencia: gerado` e `operacao_estado` (candidata, confirmada ou aposentada).

O texto genérico hoje repetido nas 164 notas ("Elegibilidade, supressões… clique não comprova uso ou venda", "A pergunta para cada mês é…") vai para uma nota única, `07-Evolucao/Leitura-de-Operacoes.md`. Cada nota de operação aponta para ela.

Os caracteres corrompidos (`TUD�O`, `Jor_Aquisi��o`) e a safra misturada (`07/26` e `2026-07`) são corrigidos na origem, antes da geração.

## 4. Catálogo de gatilhos

### 4.1 Famílias

| ID | Família | Pergunta | Métrica | Fila |
|---|---|---|---|---|
| T1 | Volume | A operação gerou muito mais ou menos cartões que o normal? | cartões | performance |
| T2 | Eficiência | O CAC desta operação saiu do normal com impacto em reais? | CAC canônico = Σcusto ÷ Σcartões | performance |
| T3 | Taxa de funil | Proposta, aprovação ou finalização mudou de patamar? | taxas em p.p. | performance (**desligado** até calibrar, §4.5) |
| T4 | Mídia | O custo por evento saiu do plano ou do próprio histórico? | CPA de evento, **nunca CAC** | performance |
| T5 | Frescor | A fonte parou de chegar? | última data observada | qualidade |
| T6 | Revisão | Um mês certificado mudou na base? | Δ entre snapshot certificado e base atual | qualidade |
| T7 | Higiene | Os 3 códigos atuais | os de hoje | qualidade |

### 4.2 Regras comuns

- **Janela:** os 6 meses fechados anteriores. Nunca atravessa `corte_regime`; a Serasa começa em 2026-02.
- **Mês aberto:** não dispara T1, T2 nem T4. Aparece no painel, sem veredito.
- **Ausência não é zero:** mês sem disparo da operação conta como sem atividade. Não é observação de zero cartões e não entra em mínimo, máximo ou mediana.
- **Amostra:**
  - T1 exige 4 ou mais meses com atividade na janela.
  - T2 exige 4 ou mais meses com 30 ou mais cartões e o mês atual com 30 ou mais cartões.
- **Referência:** faixa de 6 meses (mínimo e máximo) **e** mediana. A faixa sozinha deixa passar mudança grande quando o histórico é volátil. Foi o caso da Serasa e da Proprietária Negados em setembro.

### 4.3 Sensibilidade Moderada (aprovada)

| Família | Dispara quando | Filtro de materialidade |
|---|---|---|
| T1 | valor fora da faixa **ou** \|Δ vs mediana\| ≥ 30% | \|Δ absoluto\| ≥ 50 cartões |
| T2 | CAC fora da faixa **ou** \|Δ vs mediana\| ≥ 30% | \|(CAC − mediana) × cartões\| ≥ R$ 1.000 |
| T6 | \|base atual − certificado\| ≥ 2% **ou** ≥ 20 cartões | — |
| T5 | dias desde a última data > tolerância da fonte | tolerância por fonte em `growth_trigger_rules` |

Fora da faixa dispara sempre que a amostra for válida. O filtro de materialidade vale para o caminho da mediana.

### 4.4 Configuração

Tabela `growth_trigger_rules`, versionada:

```text
rule_id text pk               -- ex.: T1_crm_moderado_v1
front text
family text                   -- T1..T7
metric text
params jsonb                  -- limiares, janela, amostra mínima, materialidade
enabled boolean
mode text                     -- observacao | ativo
version integer
backtest_ref text             -- caminho do relatório de backtest que justificou a versão
created_by, created_at
```

Nenhum limiar fica no código. Mudança de limiar cria nova versão, que precisa de novo backtest antes de passar para `ativo`.

### 4.5 T3 e T4 dependem de calibração

- **T3:** a semântica `lead_pre_qualificado` da Serasa invalida o funil padrão, e a régua de taxa precisa de denominador por métrica. Liga só depois de um backtest próprio.
- **T4:** `paid_media_targets` tem 0 linhas. Enquanto o plano não for preenchido, T4 compara o CPA de evento da campanha canônica com a mediana das 8 semanas anteriores, com 30 ou mais eventos por semana.
  - Google `conversion` tem **0 conversões** de junho a agosto, então o caso fica em T7.
  - Não há linhas Google em setembro e outubro, então dispara T5.
- **Classificação de frente das campanhas:** hoje é derivada no TypeScript (`report-live-engine.ts:139-149`) sem equivalente em SQL. Precisa ir para `growth_operations` antes de T4 sair de observação. Sem isso, campanha de Copa ou rentabilização entraria como aquisição.

## 5. Backtest e golden de setembro

### 5.1 Volume esperado (Moderado, T1 + T2, grão de operação CRM)

Medido no banco em 27/10/2026 (`activities`, `parceiro_canonico <> 'N/A'`, janela de 6 meses e regime Serasa respeitado):

| Mês | Gatilhos T1 | Gatilhos T2 | Operações | Com sinal positivo | Parceiros |
|---|---:|---:|---:|---:|---:|
| 2026-04 | 4 | 1 | 4 | 3 | 2 |
| 2026-05 | 3 | 2 | 5 | 1 | 2 |
| 2026-06 | 4 | 3 | 6 | 4 | 3 |
| 2026-07 | 5 | 4 | 8 | 4 | 4 |
| 2026-08 | 5 | 2 | 6 | 3 | 4 |
| 2026-09 | 7 | 2 | 8 | 4 | 4 |

Isso dá **4 a 8 operações por mês**, das quais cerca de metade com sinal positivo. Depois do agrupamento pela IA, a estimativa é de **3 a 5 candidatas por mês**. É um volume que uma pessoa revisa.

### 5.2 Golden de setembro: 9 gatilhos reportados para comparação

| Operação | Família | Valor | Referência | Direção |
|---|---|---|---|---|
| B2C · Negados · Proprietária | T1 | 934 cartões | mediana 589, faixa 71–857 | ↑ acima |
| B2C · Negados · Proprietária | T2 | CAC R$ 15,79 | mediana R$ 24,51 | ↑ melhora |
| B2C · Abandonados · Proprietária | T1 | 210 | mediana 41, faixa 14–147 | ↑ acima |
| B2C · Aprovados não convertidos · Proprietária | T1 | 70 | mediana 7, faixa 1–18 | ↑ acima |
| B2C · Abandonados · Serasa | T2 | CAC R$ 3,25 | mediana R$ 5,77 | ↑ melhora |
| Plurix · CRM · Plurix | T1 | 118 | mediana 342, faixa 213–574 | ↓ abaixo |
| Plurix · Negados · Plurix | T1 | 76 | mediana 279, faixa 79–553 | ↓ abaixo |
| Plurix · Abandonados · Plurix | T1 | 18 | mediana 55, faixa 39–99 | ↓ abaixo |
| B2B2C · CRM · Bem Barato | T1 | 45 | mediana 116, faixa 67–224 | ↓ abaixo |

**Não pode aparecer:**

- **Dia · CRM** (3 cartões; mediana 26; faixa 0–93): o Δ absoluto é menor que 50 cartões e a faixa contém o valor.
- **Plurix · Aprovados não convertidos** com CAC de R$ 124,52: há só 2 meses com 30 ou mais cartões.

Gatilho T6 esperado no mesmo run: **Serasa agosto**, certificado com 988 cartões em 13/09 e hoje com 941 na base (−4,8%).

**Falsificador:** divergência sem explicação linha a linha impede o aceite. Divergência explicada exige revisão antes de substituir o golden; não ajustar limiar para bater.

## 6. Identidade e ciclo de vida da candidata

```text
series_key = sha256(canonical_json([front, operation_id, family, metric, direction]))
signal_key = sha256(canonical_json([series_key, period]))
episode_id = identificador persistido da candidata que reúne ocorrências consecutivas
# serialização UTF-8, array JSON compacto; period = AAAA-MM, direction = up|down
# regras, versões e revisões da evidência são metadados, não identidade da ocorrência
```

1. **Upsert por `signal_key`.** Rodar o mesmo período com a mesma evidência e regra não cria linha nem revisão nova. Mudança de evidência ou regra cria revisão auditável da ocorrência, sem sobrescrever a evidência congelada de aposta.
2. **Persistência entre períodos.** Uma ocorrência no mês consecutivo, com a mesma `series_key` e regra comparável, vincula-se ao episódio aberto. `persistencia_meses` é derivada dos meses consecutivos distintos, nunca incrementada por execução. Lacuna ou mudança de direção segue a §14.6.
3. **Envelhecimento.** Candidata sem decisão em `growth_signal_decisions` depois de 14 dias recebe `aging=true` e sobe na ordenação de prioridade do feed.
4. **Encerramento automático:** só quando a condição deixa de valer por 2 períodos seguidos **e** não há aposta. O motivo fica registrado (`resolved_without_action`).
5. **Migração das 48 atuais:** a quantidade final depende do código e do escopo comprovado de cada problema, com histórico preservado. Três códigos não implicam três candidatas. Nenhuma linha é apagada; as antigas recebem `status=superseded` e um ponteiro para a nova.

Colunas aditivas em `report_action_candidates`:

```text
signal_key, operation_id, trigger_family, rule_id, rule_version,
direction, series_key, episode_id, persistencia_meses, aging, cluster_id, ai_draft_id

O armazenamento de ocorrências/revisões deve preservar cada `signal_key` individual. A tabela de candidatas representa episódios; não usar uma única coluna `signal_key` para substituir seu histórico de ocorrências.
```

## 7. Camada de IA

### 7.1 O que a IA faz e o que não faz

| Faz | Não faz |
|---|---|
| Agrupa gatilhos irmãos em uma candidata (`cluster_id`) | Decidir o que disparou |
| Lê a decomposição já calculada e escolhe a hipótese principal | Calcular, arredondar ou corrigir número |
| Lista hipóteses alternativas e o que distinguiria entre elas | Emitir veredito de outcome |
| Redige o rascunho da aposta no contrato de `growth_bets` | Promover candidata a aposta |
| Cita aprendizado aplicável da memória (matcher da Release 6) | Usar dado de cliente ou CPF |
| Redige `takeaway`, `evidence[]` e `limitation` por slide | Escrever sem `evidence_ref` |
| Redige o rascunho da retrospectiva mensal por frente | Publicar ou ativar o que for |

### 7.2 Decomposição determinística (SQL, antes da IA)

Para cada gatilho T1 ou T2, o motor calcula e grava, junto com a candidata:

- **volume:** `cartões = base acionável × (cartões ÷ base)`, separando efeito de base e efeito de taxa pelo método simétrico especificado na §14.8, com período de referência explícito;
- **CAC:** `custo ÷ cartões`, separando efeito de custo e efeito de volume;
- **mix:** contribuição por canal e por jornada ativa ou parada no mês contra a referência;
- **execução:** número de disparos e jornadas novas, pausadas ou encerradas.

Exemplo do golden, Plurix · Negados:

| | Ago | Set |
|---|---:|---:|
| Base acionável | 21.364 | 2.073 (−90%) |
| Cartões ÷ base | 1,9% | 3,7% |
| Cartões | 403 | 76 |

A taxa quase dobrou. O que caiu foi a base.

### 7.3 Entrada e saída

**Entrada:**

- os gatilhos do período;
- a decomposição;
- a nota da operação (`vault_note_path`);
- as memórias vigentes de `growth_memory_active_v`;
- as apostas abertas.

**Saída** (JSON validado por schema; Zod no app, JSON Schema no worker):

```json
{
  "cluster_id": "...",
  "signal_keys": ["..."],
  "titulo": "Base de Negados da Plurix encolheu 90% em setembro",
  "hipotese_principal": {"texto": "...", "evidence_refs": ["decomp:base", "decomp:taxa"]},
  "alternativas": [{"texto": "...", "como_distinguir": "consulta ou dado que separa as hipóteses"}],
  "rascunho_aposta": {
    "hypothesis": "...", "action_text": "...", "metric_name": "...",
    "baseline_value": null, "baseline_evidence_ref": "...",
    "expected_value": null, "target_status": "requires_human_input", "expected_direction": "up|down",
    "expected_unit": "...", "outcome_window_start": null, "outcome_window_end": null, "window_status": "requires_human_input",
    "verification_view": "...", "stop_condition": "..."
  },
  "memorias_citadas": ["learning_id"],
  "limitacoes": ["..."]
}
```

`baseline_value` é copiado de evidência tipada e nunca gerado. O validador confere valor, métrica, unidade, operação e período pelo `baseline_evidence_ref`. Metas e datas futuras ficam nulas até preenchimento humano ou uso de política previamente aprovada e versionada; não são fatos observados. O validador segue a §14.9.

### 7.4 Degradação e governança

- A IA fica atrás de uma flag (`growth_ai_drafting_enabled`), começa **desligada** e é ligada por frente.
- Se falhar ou estiver desligada, a candidata sai com título e evidência determinísticos e sem rascunho. O loop nunca depende da IA.
- Cada rascunho grava modelo, versão do prompt, hash da entrada e hash da saída.
- Só agregados são enviados ao provedor. Nada de CPF ou linha individual.
- O provedor fica pendente de decisão (§11). O POL002-00 vale integralmente.

**Falsificador de qualidade.** Se a evidência e o contrato de base confirmarem o exemplo Plurix · Negados, a contração de base deve aparecer como hipótese principal. Sem base comparável, declarar a limitação (§14.8). Recomendar comunicação sem evidência correspondente falha o aceite.

## 8. Ligação com o loop existente

| Passo | Estrutura existente | O que esta release acrescenta |
|---|---|---|
| Sinal no feed | `growth_feed_events` (31 `recommendation_created`) | produtor dos gatilhos T1–T7, com `dedupe_key = signal_key` |
| Decisão | `growth_signal_decisions` (0) | aceitar, rejeitar, mesclar ou adiar a partir do rascunho da IA |
| Aposta | RPC `growth_accept_signal_as_bet` e `growth_bets` | pré-preenchimento com o rascunho e evidência congelada |
| Outcome | avaliador da Release 4 e `growth_outcomes_due_v` | nada novo; precisa receber as primeiras apostas |
| Memória | `growth_learnings` (Release 5) | nada novo |
| Reuso | matcher da Release 6 | a IA cita a memória encontrada |
| Retrospectiva | `growth_result_retrospectives` (0) | rascunho mensal por frente, revisado por Pablo |

## 9. Saída editorial (Report Live `monthly_full`)

- **C1 · Leitura executiva:** as candidatas do período agrupadas, com direção e impacto, o que disparou e por quê.
- **C8 · Fila:** candidatas abertas por frente e parceiro, incluindo P7 e M7 incorporados. Mostra idade, persistência e rascunho de aposta.
- **C7 · Outcomes e memória:** placar de outcomes fechados e aprendizados novos (Release 7C).
- **P1 de cada parceiro:** uma linha "o que disparou neste parceiro", ou um estado explícito de cobertura: "sem desvio detectado nas métricas avaliáveis", "amostra insuficiente" ou "dados indisponíveis". Ausência de gatilho não recomenda manter curso automaticamente.
- **C2 · Qualidade:** T5, T6 e T7.
- **Painel:** a evolução de 6 meses continua por operação, com faixa, mediana e estado de amostra.

O `ReportRenderPackage` passa a carregar, por slide:

- `takeaway`, `evidence[]` e `limitation` estruturados (rascunho da IA, revisável);
- `chart_contract` completo para todos os arquétipos de gráfico, e não só C4, P1 e P4. É o "maior bloqueio" registrado em `SLIDE_COVERAGE_REVIEW.md`.

O renderer é o do Claude Cowork (`report-live-async/CLAUDE_COWORK_RENDERER_SPEC.md`). Ele não escolhe série, eixo, formato nem narrativa.

## 10. Fatias de implementação

| Fatia | Dono | Entrega | Bloqueia |
|---|---|---|---|
| 0 | Codex | Diagnóstico de estado (run `c543aaa3`, publicação parada, branches, `monthly_full`) | tudo |
| 1 | Codex | `growth_operations` com seed; `growth_trigger_rules`; motor T1, T2, T5 e T6 em **modo observação**; backtest abr–set reproduzindo §5 | 2, 3 |
| 2 | Codex | identidades de ocorrência/episódio, upsert, envelhecimento, reconciliação das candidatas antigas por código e escopo, produtor do feed | 4 |
| 3 | Codex | decomposição determinística (§7.2) gravada com a candidata | 4 |
| 4 | Codex (código) + Claude (prompt e schema) | camada de IA atrás de flag, validador de números, rascunhos para o golden | 6 |
| 5 | Claude | renderer PPTX/PDF local (`report_live_renderer/`), golden de agosto e setembro | 6 |
| 6 | Codex | `ReportRenderPackage` com `chart_contract` e narrativa por slide; run de setembro e outubro (este parcial) | 7 |
| 7 | Codex | fila de render e Storage conforme `SUPABASE_ASYNC_PUBLISHING_PLAN.md`; cadência de 3 vezes por semana | — |
| 8 | Pablo + gerador | confirmação das operações; recompilação das notas `Assunto-*`; sync do vault | ativação de T1/T2 |

O caminho mais curto até um deck novo com o loop vivo é **0 → 1 → 2 → 5 → 6**. Pablo confirma as operações em paralelo. A IA (fatias 3 e 4) entra assim que a 2 estiver pronta. A fatia 7 é necessária para a cadência automática, não para o primeiro deck.

## 11. Pendências de decisão

1. **Provedor de LLM para a camada de IA** e onde fica a chave: secret do Supabase ou worker no Cowork.
2. **Tolerância de frescor por fonte (T5).** Proposta: `activities` 7 dias; mídia 3 dias; B2C 7 dias; funis 7 dias.
3. **Plano de mídia.** Preencher `paid_media_targets` (CPA alvo por objetivo) para T4 comparar com o plano, e não só com o histórico.
4. **Confirmação das 33 operações CRM.** Uma revisão de 15 minutos numa lista com volume e última atividade.

## 12. Critérios de aceite

- Backtest de abril a setembro reproduz a tabela de §5.1, ou explica cada divergência.
- Comparar os 9 gatilhos reportados em §5.2 e T6 Serasa agosto; reproduzir ou explicar e revisar divergências, validando grão e proveniência (§14.7).
- Rodar o mesmo período duas vezes não muda a contagem de candidatas.
- As candidatas antigas são reconciliadas por código e escopo comprovado, sem apagar histórico; a contagem final é resultado da auditoria.
- Mês aberto não gera T1, T2 nem T4.
- Toda afirmação numérica observada tem evidência tipada correspondente. Metas e janelas planejadas seguem aprovação própria (§14.9).
- A hipótese de Plurix · Negados acompanha a decomposição comprovada; sem base comparável, declarar a limitação (§14.8).
- Uma aposta criada a partir de candidata do golden fecha outcome no avaliador da Release 4, com janela sintética, em teste.
- Nenhuma escrita em produção antes do aceite do backtest e da autorização explícita de aplicação. A fatia 1 prepara migrations aditivas e seed como arquivos; consultas de produção são somente leitura, conforme §14.10.

## 13. Guardrails

- Ausência não é zero.
- Taxa é soma sobre soma.
- CPA de plataforma não é CAC de cartão.
- Desvio com amostra insuficiente não dispara; aparece como estado no painel.
- Não alterar `resolvePartner()`, motor de certificação, contrato de imutabilidade nem publicação vigente.
- Sem dado de produção em dev ou CI (POL002-00).
- Sem publicação nem ativação sem autorização explícita de Pablo.


## 14. Contratos executáveis revisados (v3)

Esta seção detalha as regras anteriores. Contradição descoberta durante a implementação deve ser reportada antes de escolher comportamento. Nenhuma referência histórica deste documento equivale a observação verificada nesta revisão.

### 14.1 Tempo, proveniência e reprodução

Toda execução registra `evaluation_as_of` com fuso America/Sao_Paulo, `data_read_at`, mês alvo, janela, versão das regras, versão/hash do registro de operações, versão do motor e referências/hashes das consultas e agregados. A extração deve usar snapshot consistente de leitura ou declarar sua limitação.

Há três avaliações independentes:

1. T1/T2: mês fechado e seis meses calendários anteriores, sem incluir o mês alvo; cortar a janela pelo regime e pela vigência comparável da operação. Não buscar meses mais antigos para completar seis observações. O backtest abr–set usa a base disponível em `data_read_at`: é retrospectivo com dados revisados, não reconstrução do que se sabia naquela época.
2. T5: frescor na data `evaluation_as_of`. As datas do documento são referências para comparação, não resultados a forçar. Backtest histórico de frescor só é válido com histórico de chegada/ingestão; a data de evento sozinha não prova quando o dado estava disponível.
3. T6: snapshot certificado versus base consultada agora, no mesmo período, métrica e escopo. Não se confunde com o backtest mensal T1/T2.

Mês aberto é definido pelo calendário nesse fuso, independentemente de haver registros até seu último dia. Só um contrato explícito de fechamento de fonte pode acrescentar restrições; não presumir completude de mês fechado.

### 14.2 Agregados e estados de avaliação

Cada agregado deve distinguir: atividade observada, cartões observados, custo observado, completude conhecida e valores desconhecidos. Mês com execução comprovada e cartões explicitamente zero é atividade com zero; pode entrar em T1. Mês sem execução comprovada não é zero. Linha ausente não comprova pausa, encerramento ou resultado zero.

A fatia 0/backtest deve documentar quais campos provam execução, cartões e custo, a semântica de null/zero e o CAC canônico vigente. Se a fonte não distingue ausência de zero, o recorte fica não avaliável. Não somar apenas custos conhecidos e apresentar como custo total.

Estados mínimos: `triggered`, `no_deviation_detected`, `open_period`, `no_activity`, `insufficient_sample`, `missing_data`, `incomplete_coverage`, `invalid_denominator`, `incomparable_scope`, `out_of_scope`. `lifecycle` e modo observação são dimensões separadas: uma operação candidata pode ter disparo calculado em observação, mas não produzir candidata no feed.

T1 exige cartões conhecidos no mês alvo e pelo menos quatro meses elegíveis com atividade e cartões conhecidos. T2 exige custo completo e não negativo e pelo menos 30 cartões em cada um dos quatro meses mínimos e no mês alvo. Custo zero explicitamente observado é válido; custo ausente não é zero. Zero cartões impede calcular CAC. Custos negativos ou ajustes sem contrato ficam não avaliáveis.

Não remover meses sabidamente incompletos e declarar a série completa: reportar cobertura e bloquear o veredito quando a incompletude comprometer a comparação. Mudança de definição de métrica ou escopo exige corte de comparabilidade.

### 14.3 Fórmula, precisão e fixtures

Com amostra e cobertura válidas:

`outside = current < min(history) OR current > max(history)`

`median_path = relative_deviation >= 0.30 AND materiality >= threshold`

`triggered = outside OR median_path`

T1: materialidade = `abs(current_cards - median_cards)`, limiar 50.
T2: materialidade = `abs((current_cac - median_cac) * current_cards)`, limiar R$ 1.000.
Desvio relativo = `abs(current - median) / abs(median)` quando mediana diferente de zero. Se mediana for zero, o caminho relativo é indefinido e não dispara; o caminho fora da faixa permanece válido. Registrar esse motivo, sem fabricar infinito.

Faixa usa extremos inclusivos: igualdade com mínimo ou máximo não está fora. Limiares de 30%, 50 e 1.000 são inclusivos. Mediana de amostra par é a média dos dois valores centrais. Calcular sem arredondamento de apresentação; dinheiro e razões com precisão decimal definida, sem epsilon arbitrário. `direction` representa movimento numérico (`up`/`down`); `assessment` separado representa favorável/desfavorável. CAC menor é movimento `down` e avaliação favorável.

Fixtures obrigatórias, com saídas esperadas:

- mês aberto: `open_period`;
- janela cortada no regime: somente meses comparáveis; se menos de quatro, `insufficient_sample`;
- sem execução: `no_activity`; execução com cartões zero: observação zero em T1;
- amostra menor que quatro: `insufficient_sample`;
- fora da faixa sem passar na mediana ou materialidade: `triggered`;
- dentro da faixa, desvio >=30% e materialidade abaixo do limiar: `no_deviation_detected`;
- dentro da faixa com ambos os limiares atingidos: `triggered`;
- limites exatos, mediana zero, custo zero, custo ausente e denominador zero;
- mesmo input duas vezes: mesmo resultado e nenhuma revisão duplicada.

### 14.4 Registro, aliases e regras

`scope` é validado por domínio e `scope_schema_version`. CRM exige BU, segmento e parceiro canônicos; MID exige ID de campanha canônica; B2C exige população; FUN exige identificador governado do funil e sua população, quando aplicável. Nenhum matching por semelhança de nome confirma identidade.

Para preservar `operation_id = inventory_id`, mudanças de escopo/regime precisam de histórico versionado, separado ou equivalente, mantendo a versão usada em cada execução. Não reescrever retrospectivamente o escopo vigente de um resultado. Alterar `resolvePartner()` segue proibido.

O manifesto de seed deve dar destino a cada uma das 164 entidades citadas: operação, alias, documento, fora de escopo ou pendente, com motivo e proveniência. CRM: 33 candidatas, se confirmado o inventário. MID: classificar pela evidência. RENT: seguros somente com família comprovada. MAP/meta-name/COP: aliases apenas com vínculo comprovado; não forçar associação. DOC: referência documental. FUN/B2C: operações tipadas apenas com escopo comprovado. UUID: resolver origem e domínio ou manter pendente fora do seed operacional. Nenhuma entidade sem destino pode desaparecer silenciosamente.

`aliases` carrega namespace, identificador de origem, destino, vigência e proveniência. Alias ambíguo permanece pendente. A mesma identidade não pode apontar simultaneamente para operações distintas na mesma vigência sem um contrato explícito de divisão.

Regras versionadas são imutáveis. `rule_id` identifica a versão; família lógica separada de `version`, com unicidade e seleção temporal determinística. Exigir parâmetros tipados, vigência, grão de avaliação e unicidade da regra aplicável. Limiares, amostras e tolerâncias são configuração, não constantes escondidas no motor.

### 14.5 T5 e T6

T5 tem grão de fonte/partição monitorada, não uma ocorrência duplicada por operação CRM. Fontes devem distinguir pelo menos Meta e Google; o frescor de Meta não cobre Google. Vínculos das operações afetadas são metadados.

Tolerâncias provisórias: activities 7 dias; mídia por plataforma 3; B2C e cada funil 7. Usar dias calendários no fuso definido e disparar quando `dias > tolerancia`. Especificar campo de data e partição em cada regra. Sem linha observada, última data e atraso ficam desconhecidos: emitir diagnóstico `missing_data`, nunca atraso zero ou data inventada. Distinguir fonte paralisada de partição sem operação esperada por meio de calendário/estado governado; ausência de calendário é limitação explícita.

T6 aceita apenas artefato imutável com hash verificado e contrato de métrica/escopo equivalente. Para cartões: `abs_delta >= 20 OR (certified != 0 AND abs_delta/abs(certified) >= 0.02)`. Se certificado for zero, usar somente o critério absoluto. Valores ausentes ou escopos incompatíveis são não avaliáveis. Exibir delta assinado, absoluto e percentual quando definido.

A fatia 0 deve verificar se o artefato `9bb55892…` permite operação ou apenas parceiro. Se só permitir parceiro, T6 é reportado nesse grão, identificado como tal; não distribuir 47 cartões pelas operações nem afirmar equivalência. Esse achado exige revisão explícita do aceite por operação. O exemplo 988→941 não é presumido verificado.

### 14.6 Ocorrência, episódio e migração

`signal_key` identifica ocorrência de uma série em um período. Para T5, substituir operação por identidade governada de fonte/partição e usar data de avaliação como período; para T6, incluir snapshot certificado, métrica, escopo e período certificado na identidade estável. Mudanças da base produzem revisões, não novos snapshots fictícios.

Uma candidata/episódio reúne ocorrências consecutivas da mesma série. Mesclar editorialmente via IA não muda a identidade nem apaga ocorrências. Mudança de direção abre outra série; a anterior só recebe resolução com avaliação válida. Troca de regra incompatível inicia nova continuidade, com vínculo ao episódio anterior; a compatibilidade deve ser declarada, não inferida.

Período desconhecido, aberto ou insuficiente não prova resolução nem continuidade; interrompe a contagem consecutiva e fica registrado como lacuna. Duas avaliações mensais consecutivas válidas sem condição encerram automaticamente apenas episódio sem aposta. Se a série voltar após lacuna, abrir novo episódio vinculado; não incrementar o antigo silenciosamente. Episódio com aposta preserva o contrato da aposta e exige decisão explícita para associação de recorrências. Aging usa primeira disponibilização para decisão, não `updated_at`; adiar exige data de retorno e não apaga a idade original.

A reconciliação das candidatas antigas exige simulação código × escopo × identidade da entidade × evidência, lista de IDs e destino. Usar `superseded` somente se o estado e referências forem compatíveis com o schema real. Preservar decisões, apostas e evidências; nenhum colapso automático para três. Quantidade e aplicação ficam para a fatia 2, após revisão específica.

### 14.7 Backtest e evidência de aceite

Entregar separadamente: A) performance abr–set com base atual; B) frescor observado em `evaluation_as_of`; C) revisão do snapshot certificado. Os números das §§5.1/5.2 são golden de comparação, não parâmetros nem resultados certificados.

Para cada operação/mês, registrar estado, meses elegíveis, exclusões e motivos, faixa, mediana, valor alvo, caminho de disparo, materialidade e versão da regra. Comparar agregados e lista completa; explicar divergências por atualização da base, escopo, fórmula, cobertura ou erro, com evidência. Não ajustar limiar para reproduzir golden. Divergência explicada deve ser revisada antes de substituir a referência; não autoriza ativação automaticamente.

### 14.8 Decomposição e linguagem causal

Baseline da detecção é a mediana histórica. Referência da decomposição deve ser um mês real explícito (inicialmente mês fechado anterior comparável), com agregados completos. Não decompor uma mediana como se fosse uma execução real. Falta de referência comparável deixa decomposição indisponível sem inventar valores.

Para cartões `C=B*r`, com base comparável e positiva: efeito base = `(B1-B0)*(r1+r0)/2`; efeito taxa = `(r1-r0)*(B1+B0)/2`. Soma dos efeitos deve reconciliar `C1-C0`. A base precisa ter semântica declarada: pessoas únicas somente com deduplicação comprovada; caso contrário, exposições/base de disparos, sem chamá-la de audiência única. Sem contrato válido, limitar-se aos volumes observados.

Para CAC `K/N`, N0 e N1 positivos: efeito custo = `(K1-K0)*(1/N1+1/N0)/2`; efeito cartões = `(1/N1-1/N0)*(K1+K0)/2`. Reconciliar com a variação de CAC; isso não estima retorno incremental nem causalidade. Mix deve reconciliar totais com bucket desconhecido explícito. Não somar efeitos de mix e fatores como contribuições independentes sem método que evite dupla contagem. Ausência de jornada não comprova pausa/encerramento sem estado operacional.

O exemplo Plurix Negados só exige hipótese de contração de base se os dados e o contrato sustentarem essa decomposição. Com base indisponível/incomparável, a saída correta é declarar a limitação, não fabricar a hipótese para passar no golden.

### 14.9 IA e narrativa

Evidência numérica tipada: ID, valor sem formatação, unidade, métrica, operação/escopo, período, origem e hash. Cada afirmação numérica deve apontar para a evidência correspondente; existência do mesmo número em outra evidência não valida a afirmação. Percentuais e arredondamentos de apresentação são calculados deterministicamente e referenciados.

`baseline_value` deve coincidir com a evidência tipada. `expected_value` e janelas futuras ficam nulos e não acionáveis até preenchimento humano ou política determinística aprovada, cuja ID/versão e derivação sejam registradas. Zero de exemplo não significa baseline ou meta conhecida. Schema de drafting deve admitir campos incompletos; aceitar como aposta exige o contrato completo validado. Hipótese é hipótese, sem atribuição causal comprovada por decomposição aritmética.

### 14.10 Fronteira da fatia 1 e passagem de gates

Fatia 0: somente leitura, sem mover anexos, aplicar migration, encerrar publicação ou alterar arquivos de produção. Primeiro verificar checkout e premissas; parar e reportar.

Após OK da fatia 0: fatia 1 prepara migrations/seed como arquivos e motor com fixtures sintéticas; não aplica DDL, seed, staging ou RPC de escrita em produção. O backtest lê produção conforme POL002-00 verificada, calcula agregados e gera relatório local. Não copiar linhas individuais para dev/CI. Configuração e registro simulados devem reproduzir os arquivos propostos e ter hash, sem exigir seed prévio no banco. Se a política real impedir o procedimento, reportar o bloqueio antes de extrair.

Depois do aceite do backtest, aplicação de migrations/seed em produção é um passo separado com autorização explícita, plano revisável e verificação posterior. Ativação exige operações confirmadas, regras aprovadas, cobertura suficiente e autorização própria. Aprovar esta revisão documental não aprova execução dessas etapas.

O caminho mínimo 0→1→2→5→6 não dispensa contratos e schemas exigidos por 6. Com IA desligada, narrativa e evidência devem ter fallback determinístico; 3/4 só deixam de bloquear se esse fallback cumprir o pacote. Gates de CI devem executar em checkout identificado, com baseline de diagnósticos registrado e sem atribuir falhas preexistentes à mudança.
