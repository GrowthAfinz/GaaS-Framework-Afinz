# Índice — Reconciliação AppsFlyer × Activities

Ponto de entrada rápido para o pacote de specs deste tema. Ordem de leitura recomendada:

1. [ADR-003-reconciliacao-appsflyer-activities.md](ADR-003-reconciliacao-appsflyer-activities.md) — a decisão: contexto, bug confirmado, o que muda e por quê. Ler primeiro.
2. [SDD_RECONCILIACAO_APPSFLYER.md](SDD_RECONCILIACAO_APPSFLYER.md) — a spec de implementação: arquitetura em 3 camadas, modelo de dados, decisões em aberto, fases.
3. [CODEX_PROMPT_reconciliacao_appsflyer_activities.md](CODEX_PROMPT_reconciliacao_appsflyer_activities.md) — prompt autocontido para colar no Codex, com todo o contexto necessário para revisar/desafiar o plano antes de implementar.

## Depende de / relacionado

- [ADR-002-identidade-comunicacoes-template-appsflyer.md](ADR-002-identidade-comunicacoes-template-appsflyer.md) — define o contrato `template_id`/`af_sub3` que este pacote estende.
- [CODEX_PROMPT_appsflyer_analytics_view.md](CODEX_PROMPT_appsflyer_analytics_view.md) — prompt irmão, sobre a view de analytics AppsFlyer em geral (installs/campanha/lifecycle). Este pacote é especificamente sobre a reconciliação com `activities`/Comunicações, não sobrepõe.
- [COMMUNICATIONS_CONTENT_PERFORMANCE_V2_SPEC.md](COMMUNICATIONS_CONTENT_PERFORMANCE_V2_SPEC.md) — spec da tela Performance do Conteúdo que consumirá o resultado desta reconciliação.
- `src/utils/taxonomy.ts` + `src/hooks/useReconciliation.ts` — o motor de matching existente que este pacote reaproveita, não recria.

## Estado

Proposto em 2026-08-06, aguardando revisão do Codex. Nenhum código de produção foi alterado ainda.
