# Recuperação de documentos não versionados — 13/09/2026

Este registro classifica os documentos encontrados apenas no checkout antigo `calendar-estrategico`, branch `codex/report-live-august-durable`. O critério foi preservar na `main` decisões e contratos ainda vigentes, sem promover prompts de execução ou fotografias operacionais já superadas como se fossem instrução atual.

## Incorporados na `main`

| Documento | Decisão | Motivo |
| --- | --- | --- |
| `ADR-003-reconciliacao-appsflyer-activities.md` | Preservar | O fix de case já existe, mas a decisão de manter proveniência e não forçar reconciliação ambígua continua vigente. |
| `SDD_RECONCILIACAO_APPSFLYER.md` | Preservar | As camadas inferida, persistida e revisada ainda não foram implementadas; o SDD segue como contrato de backlog. |
| `SDD_RECONCILIACAO_APPSFLYER_INDEX.md` | Preservar | É o índice do pacote vivo acima. |
| `SPEC_REPORT_LIVE_MODULAR_AUTOMATICO_V1.md` | Preservar | Embora a sequência de execução tenha sido substituída por specs posteriores, as decisões de artefato modular, degradação por frente, publicação recuperável e a matriz A01–A32 continuam sendo a base da arquitetura v44/v45. |
| `CODEX_PROMPT_camada_editorial_2a.md` | Preservar | É o prompt vigente da próxima fatia e começa pelo inventário bloqueante do renderer. |

## Não incorporados como instrução vigente

| Documento | Classificação | Razão e sucessor |
| --- | --- | --- |
| `CODEX_PROMPT_appsflyer_analytics_view.md` | Executado/superado | A view e o hook AppsFlyer já existem no produto. O contrato atual deve ser lido no código, nos tipos e no ADR-002; repetir o prompt reabriria trabalho concluído. |
| `CODEX_PROMPT_reconciliacao_appsflyer_activities.md` | Superado pelo ADR/SDD | Era um prompt de revisão. As decisões duráveis ficaram no ADR-003 e no SDD preservados acima. |
| `CODEX_PROMPT_reconciliacao_appsflyer_GO.md` | Parcialmente executado e desatualizado | O fix de case foi aplicado; a parte inferida não deve ser iniciada por replay desse prompt. O backlog restante está no SDD. |
| `PROMPT_IMPLEMENTAR_REPORT_LIVE_MODULAR.md` | Histórico | O próprio arquivo se declara substituído pela spec de agosto. A implementação resultante evoluiu para a baseline v44/v45. |
| `REPORT_LIVE_HANDOFF_REVISAO.md` | Fotografia superada | Descreve `report-sync` v37 e `main` amputada; ambos deixaram de ser verdade após a recuperação da v44 e os PRs #6/#7. O vault é o handoff atual. |
| `DIAGNOSTICO_AGOSTO_2026.md` | Evidência histórica superada | O diagnóstico antecede a publicação durável de agosto. A regra ainda válida — CAC calculado por custo/cartões elegíveis, nunca pelo campo derivado congelado — já está no engine e nos contratos atuais. |
| `STATUS_REPORT_LIVE_2026-09-10.md` | Fotografia superada | O bloqueio de CPU da v38 foi resolvido pela execução durável e recuperável da v44/v45; seus próximos passos não são mais atuais. |

Os arquivos classificados como históricos permanecem no checkout arquivado até uma decisão explícita de descarte. Este registro preserva a decisão de não promovê-los para a `main`.
