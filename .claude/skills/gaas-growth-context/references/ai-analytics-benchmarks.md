# AI Analytics Benchmarks

Usar esta referencia para contrapor o plano GaaS com principios modernos de automacao e inteligencia analitica. Nao usar como fonte de numero do report.

## Takeaways

- Agentes de IA para analytics precisam de semantic layer: metricas canonicas, definicoes de negocio, dimensoes, qualidade, ownership e governanca.
- Data storytelling deve transformar evidencia em decisao e acao, nao apenas narrar KPI.
- A camada semantica deve reduzir reinterpretacao de metricas por tela, planilha ou prompt.
- Automacao de recomendacao deve explicar fonte, janela, regra, score, confianca e limite.
- Interface de report deve separar: contexto, diagnostico, acao e auditoria.

## Aplicacao no GaaS

- O Growth Context Pack e a semantic/context layer operacional do Report Live.
- Views tidy e contratos de slides evitam que a IA reinterprete metricas.
- `report_profile` permite outputs diferentes sem recriar o sistema.
- `TEXT_REGISTRY_FOR_SKIP_LLM` separa prosa de dado numerico.
- Action queue transforma storytelling em acompanhamento growth.

## Fontes de referencia consultadas

- Atlan: semantic layer for AI agents.
- ThoughtSpot: agentic semantic layer.
- Databricks: semantic layer.
- Databricks: data storytelling.

