---
tags: [ia, gaas, report-live, growth-context, handoff, codex, revisao]
tipo: inteligencia-ia
camada: operacao
tipo_diataxis: explanation
atualizado: 2026-07-08
status: em-revisao
fonte: codex-gpt5
---

# Report Live V4 - Growth Context Handoff Codex

Esta nota registra o que foi decidido, criado e aplicado pelo Codex em 08/07/2026 para evoluir o Report Live do GaaS/Afinz. O objetivo e permitir auditoria pela IA que construiu a primeira versao, sem confundir o estado confirmado da V3 com a proposta/implementacao parcial de V4.

## Leitura obrigatoria realizada

Antes de atuar, foram lidos os pilares e procedimentos:

- `CLAUDE.md` na raiz do repo ACALENDARIO APP.
- `docs/AFINZ_GAAS_ONTOLOGY.md`.
- `Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Sheets-Slides.md`.
- `Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Agente-Report-Live-Handoff.md`.
- Skill criada neste ciclo: `C:\Users\Pablo Prado\.codex\skills\gaas-growth-context\SKILL.md` e referencias associadas.

## Invariantes preservados

Estes pontos foram tratados como regra fixa:

- Arquitetura do Report Live: `DB append-only -> VIEWS tidy -> narrativa LLM -> DECK vitrine`.
- Numero e codigo/dado. Prosa e LLM.
- A IA nao calcula numero final de report. Ela escreve texto, diagnostico, limite de leitura, recomendacao e action queue.
- Dados devem vir de Supabase, SQL, DB tabs ou formulas de views.
- O modo padrao continua `skip_llm:true`: a IA da sessao escreve os textos e envia prontos.
- Publicacao final do report continua sendo via `report-sync` + `pg_net` + validacao em `report_runs`.
- A aba `BRIEFING` da planilha-mestre segue como lei para tom, persona e estilo.
- `report_memory` segue separado do briefing: memoria de negocio e prestacao de contas, nao tom editorial.
- CPA de plataforma nao e CAC.
- Delta e variacao sao complemento analitico, nao obrigacao de dizer "melhorou/piorou".
- Plurix/B2B2C deve ser tratado dentro de Aquisicao CRM, nao como bloco externo isolado.
- Seguros deve ser resumido e conectado a CRM/Midia, salvo pedido explicito de deep dive.
- Midia paga nao pode privilegiar apenas funil B2C app. Todos os objetivos precisam receber nivel semelhante de importancia.

## O que o usuario pediu para evoluir

O Pablo avaliou que as abas/views atuais medem KPIs pouco direcionados a cada segmento, frente e parceiro. A expectativa de V4 e aumentar o numero de abas e transformar a planilha/deck em uma inteligencia de acompanhamento growth, com:

- Mapa Estrategico da Operacao.
- Matriz Frente x Parceiro x Segmento.
- Mais views por bloco, respeitando a ordem tecnica das tabelas.
- Storytelling com fluxo de acompanhamento growth, nao apenas ordem de tabelas.
- Possibilidade de outputs diferentes do mensal, por exemplo uma sexta-feira olhando a semana atual com dados ate quarta.
- Bloco de Aquisicao CRM com leitura de BU, parceiro, segmento, canal, funil, top campanhas/disparos e action queue.
- `VIEW_AQS_TOP_CAMPANHAS` sempre por parceiro.
- Bloco de Midia Paga com simetria por objetivo, incluindo `VIEW_MEDIA_B2C_APP_FUNNEL` apenas como referencia possivel, nao como estrutura principal.
- Bloco de Seguros mais resumido, aproveitando inteligencia das outras frentes.

## Skill criada

Foi criada a skill local:

`C:\Users\Pablo Prado\.codex\skills\gaas-growth-context`

Arquivos principais:

- `SKILL.md`
- `references/report-live-invariants.md`
- `references/output-profiles.md`
- `references/growth-slide-view-contract.md`
- `references/storytelling-growth.md`
- `references/metric-dictionary.md`
- `references/supabase-source-map.md`
- `references/data-quality-guardrails.md`
- `references/asset-patterns.md`
- `references/output-contract.md`
- `references/ai-analytics-benchmarks.md`
- `scripts/normalize_view_contract.py`
- `scripts/scan_growth_context.py`

A skill foi pensada para preparar um Growth Context Pack antes de gerar narrativa ou publicar report. Ela nao substitui SQL, Supabase, planilha ou `report-sync`. Ela organiza contrato, perfil de output, guardrails, storytelling e action queues.

### Saidas que a skill deve conseguir produzir

- `GROWTH_CONTEXT_PACK.md`
- `VIEW_CONTRACT_NORMALIZED.tsv` ou JSON equivalente
- `NARRATIVE_PLAN.md`
- `TEXT_REGISTRY_FOR_SKIP_LLM.json`
- `ACTION_QUEUE_SCHEMA.tsv`
- `DATA_QUALITY_NOTES.md`

### Perfis de output previstos

A skill foi desenhada para nao assumir que todo output e mensal. Ela declara `report_profile` antes de montar o report.

Exemplo para report semanal parcial:

```yaml
report_profile:
  output_type: weekly_impact_cutoff
  audience: lideranca_operacional
  analysis_window: current_week_monday_to_latest_closed_day
  comparison_window: previous_week_same_weekdays
  context_window: month_to_date_until_latest_closed_day
  data_cutoff_rule: latest_closed_day_available
  narrative_mode: acompanhamento_growth
  depth: standard
```

Regra especifica para "sexta com dados ate quarta":

- Janela analisada: segunda ate ultimo dia fechado disponivel.
- Comparacao principal: mesmos dias da semana anterior.
- Contexto auxiliar: mes acumulado ate o mesmo corte.
- Proibido comparar semana parcial com semana cheia como conclusao principal.

## Contrato V4 de views/slides proposto

A ordem tecnica da planilha foi separada da ordem narrativa. A skill precisa entender a ordem tecnica, mas o storytelling pode reorganizar a leitura como acompanhamento growth.

| Ordem | Bloco | View | Grao | Papel |
| --- | --- | --- | --- | --- |
| 1 | Cockpit Growth | `VIEW_GROWTH_COCKPIT` | Resumo executivo por frente | Estado da operacao e proxima acao |
| 2 | Aquisicao CRM | `VIEW_AQS_BU` | BU/frente | Sustentacao de producao e eficiencia por frente |
| 3 | Aquisicao CRM | `VIEW_AQS_PARCEIRO` | Parceiro | Importancia por volume, eficiencia, custo e risco |
| 4 | Aquisicao CRM | `VIEW_AQS_SEGMENTO__PARCEIRO` | Segmento dentro de parceiro | Explicar resultado do parceiro por publico/funil |
| 5 | Aquisicao CRM | `VIEW_AQS_CANAL__PARCEIRO__SEGMENTO` | Canal dentro de parceiro e segmento | Diagnosticar alavanca ou gargalo de canal |
| 6 | Aquisicao CRM | `VIEW_AQS_FUNIL__PARCEIRO` | Funil por parceiro | Mostrar onde a producao escapa |
| 7 | Aquisicao CRM | `VIEW_AQS_TOP_CAMPANHAS__PARCEIRO` | Campanhas/disparos por parceiro | Explicar producao ou risco por disparo |
| 8 | Aquisicao CRM | `VIEW_AQS_ACTION_QUEUE__PARCEIRO` | Acoes por parceiro | Fechar com fila operacional |
| 9 | Midia Paga | `VIEW_MEDIA_PACING__OBJETIVO` | Objetivo de midia | Controlar gasto, ritmo e entrega por objetivo |
| 10 | Midia Paga | `VIEW_MEDIA_OBJETIVO_PLATAFORMA` | Objetivo x plataforma | Entender dependencia e eficiencia por plataforma |
| 11 | Midia Paga | `VIEW_MEDIA_CAMPANHAS__OBJETIVO` | Campanha por objetivo | Explicar producao, desperdicio ou concentracao |
| 12 | Midia Paga | `VIEW_MEDIA_CRIATIVOS__OBJETIVO` | Criativo/grupo/campanha por objetivo | Mostrar tracao, fadiga ou concentracao criativa |
| 13 | Midia Paga | `VIEW_MEDIA_TRACKING_QUALITY__OBJETIVO` | Qualidade por objetivo | Separar performance real de limite de mensuracao |
| 14 | Midia Paga | `VIEW_MEDIA_ACTION_QUEUE__OBJETIVO` | Acoes por objetivo | Fechar midia com acompanhamento growth |
| 15 | Seguros | `VIEW_SEGUROS_SUMMARY` | Resumo de seguros | Conectar seguros com CRM e midia |
| 16 | Seguros | `VIEW_SEGUROS_ACTIONS` | Acoes de seguros | Acionar pendencias ou oportunidades |
| 17 | Matriz Estrategica | `VIEW_GROWTH_MATRIX_FRENTE_PARCEIRO_SEGMENTO` | Frente x parceiro x segmento | Tabela-mae da inteligencia |

## Diferenca entre V3 confirmada e V4 iniciada

### V3 confirmada no vault

A V3 registrada em [[Report-Live-Sheets-Slides]] tem:

- Edge function principal: `report-sync`, versao 8/v3.1.
- Planilha fixa: `1BYLpYzDvppMC32ITfbSQdejB3RSxOcAdJZteCd54nwA`.
- Deck fixo: `1iGAdoxp1yC91v9_Y0zCD0XHrkjZvUrikyLXbKP-_wv0`.
- Abas base: `BRIEFING`, `CONFIG`, `DB_MIDIA`, `DB_CRM`, `DB_B2C`.
- 9 views antigas:
  - `VIEW_MP_TOTAL`
  - `VIEW_MP_META`
  - `VIEW_MP_GOOGLE`
  - `VIEW_MP_SHARE`
  - `VIEW_MP_PACING`
  - `VIEW_CRM_BU`
  - `VIEW_CRM_PARCEIRO`
  - `VIEW_CRM_SEGMENTO`
  - `VIEW_CRM_FUNIL`
- 20 placeholders textuais antigos no deck.
- Publicacao mensal via `report-sync`, `skip_llm:true`, `texts`, `recomendacoes`, `pg_net`, `report_runs`.

### V4 iniciada pelo Codex

O que foi feito nao substituiu a `report-sync` V3. Foi criada uma edge function separada para setup de estrutura V4:

`calendar-estrategico/supabase/functions/report-sync-v4-setup/index.ts`

Configuracao adicionada em:

`calendar-estrategico/supabase/config.toml`

```toml
[functions.report-sync-v4-setup]
enabled = true
verify_jwt = true
```

Nome remoto publicado no Supabase:

`report-sync-v4-setup`

Caracteristicas:

- Funcao separada da `report-sync`.
- `verify_jwt:true`, seguindo a postura atual da `report-sync`.
- `GET` faz health check.
- `POST { "mode": "setup_views" }` cria/repara abas, formulas, graficos e slides V4.
- `POST { "mode": "inspect_views" }` foi adicionado depois para inspecionar amostras das views V4.
- Usa os mesmos secrets da V3:
  - `REPORT_SHEET_ID`
  - `REPORT_SLIDES_ID`
  - `GOOGLE_SERVICE_ACCOUNT_JSON`
- Usa Google Sheets API e Google Slides API diretamente.
- Usa as abas `DB_MIDIA` e `DB_CRM` existentes como base para formulas.
- Nao sincroniza novos dados do Supabase.
- Nao publica narrativa final.
- Nao escreve em `report_runs`.
- Nao substitui os 20 placeholders antigos.

## O que foi aplicado de fato em Google Sheets/Slides

A funcao `report-sync-v4-setup` foi deployada no Supabase e executada com `mode:"setup_views"`.

Resultado retornado pela funcao:

```json
{
  "ok": true,
  "tabs_created": 19,
  "views": 17,
  "charts_available": 12,
  "slides_created": 17,
  "placeholders": [
    "v4_growth_cockpit",
    "v4_aqs_bu",
    "v4_aqs_parceiro",
    "v4_aqs_segmento_parceiro",
    "v4_aqs_canal_parceiro_segmento",
    "v4_aqs_funil_parceiro",
    "v4_aqs_top_campanhas_parceiro",
    "v4_aqs_action_queue_parceiro",
    "v4_media_pacing_objetivo",
    "v4_media_objetivo_plataforma",
    "v4_media_campanhas_objetivo",
    "v4_media_criativos_objetivo",
    "v4_media_tracking_quality_objetivo",
    "v4_media_action_queue_objetivo",
    "v4_seguros_summary",
    "v4_seguros_actions",
    "v4_growth_matrix"
  ]
}
```

Portanto, a planilha/deck fixos foram alterados:

- 19 abas novas/criadas ou garantidas:
  - `REPORT_PROFILE`
  - `VIEW_CONTRACT`
  - 17 views V4 listadas acima.
- 12 graficos criados/disponibilizados.
- 17 slides V4 criados no deck fixo.
- 17 placeholders novos no padrao `ph:v4_*`.

## Validacoes feitas

Valido:

- A skill `gaas-growth-context` passou em validacao local simples.
- O script `normalize_view_contract.py` foi testado com TSV colado.
- O script `scan_growth_context.py` foi testado no workspace.
- O arquivo `report-sync-v4-setup/index.ts` foi validado localmente via transpile TypeScript com Node.
- O build do app em `calendar-estrategico` passou com `npm run build`.
- O health check da funcao remota retornou:

```json
{
  "ok": true,
  "checks": {
    "sheet_id": true,
    "slides_id": true,
    "service_account": true,
    "views": 17,
    "google_auth": true
  }
}
```

Pendente:

- A inspeção `POST { "mode": "inspect_views" }` ainda nao foi concluida depois da pausa solicitada pelo Pablo.
- A primeira tentativa de inspecao falhou antes de chamar a funcao, por erro de escaping de regex no PowerShell usado para extrair a chave anon. Nao foi erro da edge function.
- Ainda nao ha confirmacao visual dos slides V4.
- Ainda nao foi gerado `TEXT_REGISTRY_FOR_SKIP_LLM.json` real.
- Ainda nao foi disparada nenhuma run final com `skip_llm:true` na `report-sync` V3.
- Ainda nao houve validacao em `report_runs` para um report V4 narrativo.

## Riscos e pontos de possivel desalinhamento com a IA original

Este e o trecho mais importante para revisao.

1. A V4 foi iniciada como funcao paralela `report-sync-v4-setup`, nao como evolucao direta da `report-sync` V3. Isso evita quebrar a V3, mas pode estar diferente do caminho que a IA original escolheria.
2. A funcao V4 cria abas/slides no mesmo Sheet/Deck fixo. Isso ja alterou os artefatos compartilhados, mesmo sem publicar report final.
3. As formulas V4 foram geradas assumindo posicoes de colunas nas abas `DB_CRM` e `DB_MIDIA` da V3. Isso precisa ser conferido com `inspect_views` e, idealmente, com a IA original.
4. As action queues V4 ainda estao como estrutura/manual-IA. Nao existe ainda regra SQL completa para popular automaticamente prioridade, evidencia, acao, metrica de sucesso e confianca.
5. `VIEW_GROWTH_COCKPIT` e algumas views resumidas ainda sao esqueleto operacional, nao cockpit maduro com scoring.
6. `VIEW_MEDIA_TRACKING_QUALITY__OBJETIVO` ainda e uma primeira aproximacao, nao auditoria completa de tracking.
7. Seguros foi conectado por filtros simples em CRM e Midia, mas ainda precisa validar nomenclatura real na base.
8. A matriz estrategica foi criada como view inicial, mas ainda nao contem todos os campos semanticos desejados (`papel_no_funil`, `kpi_norte`, `kpi_guardrail`, `risco`, `oportunidade`) com logica final.
9. A V4 ainda nao le a aba `BRIEFING` para gerar texto. Ela so prepara estrutura.
10. A V4 ainda nao grava `briefing_version`, metadata, quality notes ou memoria.

## O que eu nao fiz

- Nao substitui a edge function `report-sync`.
- Nao apaguei views V3.
- Nao apaguei placeholders antigos.
- Nao gerei um novo report mensal.
- Nao publiquei narrativa final.
- Nao alterei dados em tabelas Supabase de negocio.
- Nao rodei uma sincronizacao completa de DB tabs.
- Nao validei visualmente o deck.
- Nao corrigi a divida de RLS das tabelas expostas.

## Caminho sugerido agora

Antes de continuar implementando, pedir revisao da IA original sobre este plano.

Arquivo para ela ler:

`Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Report-Live-V4-Growth-Context-Handoff-Codex.md`

Arquivos que ela deve comparar:

- `Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Sheets-Slides.md`
- `Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Agente-Report-Live-Handoff.md`
- `C:\Users\Pablo Prado\.codex\skills\gaas-growth-context\references\growth-slide-view-contract.md`
- `calendar-estrategico/supabase/functions/report-sync-v4-setup/index.ts`

## Prompt sugerido para a IA original

Use este texto:

```text
Leia primeiro estas notas do vault:

1. Afinz-CRM-Midia-Vault/08-Engenharia/Report-Live-Sheets-Slides.md
2. Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Agente-Report-Live-Handoff.md
3. Afinz-CRM-Midia-Vault/09-Inteligencia-IA/Report-Live-V4-Growth-Context-Handoff-Codex.md

Depois compare com estes arquivos:

4. C:\Users\Pablo Prado\.codex\skills\gaas-growth-context\references\growth-slide-view-contract.md
5. calendar-estrategico/supabase/functions/report-sync-v4-setup/index.ts

Pergunta:

Voce concorda com o plano V4 iniciado pelo Codex para o Report Live?

Quero que voce revise especificamente:

- Se criar a funcao paralela report-sync-v4-setup foi o caminho certo ou se deveria evoluir diretamente a report-sync.
- Se as 17 views V4 respeitam os 8 pilares do Report Live.
- Se mexer no mesmo Sheet/Deck fixo com slides v4_* e seguro ou deveria ser feito em uma copia/template.
- Se o contrato de Aquisicao CRM por BU, parceiro, segmento, canal, funil, top campanhas por parceiro e action queue esta correto.
- Se Midia Paga por objetivo ficou simetrica o suficiente e nao privilegia B2C app.
- Se Seguros esta resumido do jeito certo.
- Se Plurix/B2B2C esta corretamente dentro de Aquisicao CRM.
- Quais formulas/views devem ser corrigidas antes de continuar.
- Qual deveria ser o proximo passo: inspecionar views, ajustar formulas, integrar V4 na report-sync, ou reverter/migrar para copia.

Responda como revisao tecnica, apontando riscos, divergencias e uma recomendacao objetiva de continuidade.
```

## Minha recomendacao atual, antes da revisao

Nao rodar nova geracao/publicacao ainda.

Proximo passo tecnico seguro:

1. Pedir revisao da IA original usando o prompt acima.
2. Se ela concordar com V4 paralela, rodar `inspect_views`.
3. Corrigir formulas quebradas.
4. Validar visualmente os slides V4.
5. So depois integrar narrativa `skip_llm` e payload final.

Se ela discordar:

- Manter a V3 como fonte de verdade.
- Decidir se os slides/abas V4 criados ficam como sandbox ou se devem ser removidos/manualizados.
- Replanejar V4 como evolucao interna da `report-sync` ou como copia/template separada.

