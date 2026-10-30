# Shared Growth Report Output Contract

Todos os agentes devem produzir JSON válido ou uma estrutura equivalente com os mesmos campos.

```json
{
  "agent": "skill-name",
  "run_date": "YYYY-MM-DD",
  "status": "success|partial|failed",
  "scope": {
    "start": "YYYY-MM-DD",
    "end_exclusive": "YYYY-MM-DD",
    "last_closed_day": "YYYY-MM-DD"
  },
  "data_quality": [],
  "entities": [
    {
      "entity_type": "dispatch|segment|campaign|adset|ad|source|metric",
      "entity_id": "stable-id",
      "label": "human-readable label",
      "dimensions": {},
      "metrics": {},
      "comparisons": {},
      "contribution": {},
      "findings": [
        {
          "signal": "what changed",
          "impact": "business impact",
          "probable_cause": "hypothesis, not unsupported fact",
          "evidence": [],
          "severity": "low|medium|high|critical",
          "confidence": "low|medium|high",
          "measurement_status": "trusted|directional|suspect|blocked"
        }
      ],
      "recommended_actions": [
        {
          "action": "clear verb and object",
          "reason": "finding addressed",
          "owner": "CRM|Media|Data|Engineering|Business",
          "deadline": "today|48h|week|month",
          "expected_impact": "production|efficiency|reliability",
          "confidence": "low|medium|high",
          "success_criterion": "metric and validation window"
        }
      ]
    }
  ],
  "totals": {},
  "restrictions": [],
  "blocked_conclusions": [],
  "summary": {
    "headline": "",
    "top_changes": [],
    "top_risk": "",
    "top_opportunity": "",
    "priority_action": ""
  }
}
```

## Contract Rules

- Usar números, não strings formatadas, em `metrics` e `totals`.
- Informar unidade dentro da chave ou em metadado próximo.
- Usar intervalos semiabertos.
- Diferenciar `null` de zero.
- Não omitir restrições.
- Não declarar causalidade sem experimento ou desenho válido.
- Cada ação deve apontar para pelo menos um finding.
- IDs devem ser estáveis dentro da fonte.
