---
tags: [growth, resultados, evolucao, retrospectiva, evidencia]
tipo: analise-historica
camada: evolucao
atualizado: 2026-10-03
status: inferência
fonte: supabase-auditoria-2026-10-03
---

# Resultados — qualidade e cobertura

**Snapshot consultado em 03/10/2026.** Dias de negócio anteriores a 03/10/2026. Esta nota é uma leitura descritiva revisável; hipótese, decisão e aprendizado validado permanecem identificados separadamente. Atualizações futuras devem preservar o corte e a revisão anterior.

## Prontidão desta leitura

**Gate: exploração histórica com limites.** Último dia fechado esperado: 02/10/2026 (America/Sao_Paulo). Consultas independentes, sem snapshot transacional; leitura de todas as linhas das três fontes centrais, com agregações somente de datas anteriores ao corte.

| Fonte | Linhas auditadas | Última data de negócio | Situação |
|---|---:|---|---|
| activities | 7895 | 01/10/2026 | parcial; chaves repetidas e campos ausentes |
| Meta / paid_media_metrics | 6626 | 01/10/2026 | parcial para D-1; histórico e pipeline moderno devem ser distinguidos |
| Google / paid_media_metrics | 1872 | 17/08/2026 | desatualizado para leitura recente |
| b2c_daily_metrics | 936 | 27/09/2026 | setembro parcial; sem outubro |

### CRM

Nenhuma data, segmento ou parceiro canônico ausente. Isso não certifica classificações nem elimina N/A. Há 760 linhas em chaves repetidas (taxonomia/data/BU/canal), 52 sem cartões, 1257 sem propostas. Preservar as repetições para conciliação; não removê-las automaticamente. Presença diária não prova calendário completo. Não comparar um funil formado por somas com coberturas diferentes.

### Mídia

Nenhuma chave repetida encontrada por data/plataforma/campanha/conjunto/anúncio. Google mistura grãos em abril e maio de 2026: níveis devem permanecer separados. Alias ausente exige revisão de identidade; não apagar gasto. A interpretação de conversão depende do evento e da janela.

**Coleta moderna Meta:** último run diário completo em 02/10/2026 às 11:20 UTC, data_as_of 02/10; zero rejeições somadas nos runs completos consultados. Isso não certifica completude de todas as campanhas em metrics. **Logs genéricos legados:** último registro em 15/07/2026, status failed; não usá-lo sozinho para diagnosticar a coleta moderna.

### B2C

Sem chaves data/tipo repetidas. Total inclui componentes. Meses sem Serasa ou CRM não indicam componente zero. Set/2026 cobre dias 1–27; confirmar 28–30 antes de fechar o mês.

## Retrospectiva da qualidade

- **Observação:** as fontes têm cortes distintos e limitações de comparabilidade.
- **Aprendizado provisório:** uma série histórica útil precisa mostrar cobertura junto dos números e distinguir data de negócio de data de coleta.
- **Verificação proposta:** reconciliar CRM, atualizar Google/B2C e conferir o pipeline específico antes de decisões de orçamento ou eficiência.
- **Responsável, prazo e decisão:** pendentes de definição operacional.

## Evidências reproduzíveis

Consultas e resultados agregados: `outputs/wiki-resultados-historico-2026-10-03/consultas.sql` e `evidencias.json`, no repositório de contexto. Nenhum dado pessoal foi incorporado às notas. O arquivo de evidências é a base deste snapshot; novas consultas podem retornar outro estado.

[[Historico-Resultados-CRM]] · [[Historico-Resultados-Midia-Paga]] · [[Historico-Resultados-B2C]] · [[Retrospectiva-Growth-2026-09]].
