# Contrato de saída v1

```json
{
  "status": "conclusive",
  "summary": "Síntese do que pode ser verificado e da próxima decisão.",
  "facts": [{
    "text": "Observação sustentada pela referência abaixo.",
    "evidence_ids": ["YYYY-MM-01:cards"],
    "values": [{"evidence_id": "YYYY-MM-01:cards", "value": 10}]
  }],
  "hypotheses": [],
  "limitations": ["População integral da origem não certificada."],
  "next_checks": ["Conferir mudança de público e calendário de execução."],
  "candidate": {
    "title": "Investigar a mudança observada no recorte",
    "metric": "cards",
    "action": "Conferir volume e composição das execuções antes de ajustar a régua.",
    "success_criterion": "Concluir a verificação e registrar decisão com a evidência consultada."
  }
}
```

O exemplo é sintético, não um resultado para publicar. Substituir IDs e valores pelo pacote reservado.

- `status`: conclusive, inconclusive ou blocked. Conclusive significa conclusão da análise, não validação causal.
- `facts`: ao menos uma afirmação com referências existentes. Para mencionar números, preencher também `values` com igualdade exata ao campo value do pacote.
- `hypotheses`: pode ser vazio; cada item usa text/evidence_ids e explicita a verificação proposta.
- `limitations` e `next_checks`: listas não vazias de strings; manter limites materiais mesmo em casos elegíveis.
- `candidate`: null quando bloqueado, inconclusivo ou sem ação útil. Quando preenchido, métrica entre cards, cost_per_card, proposals e approved, mês fechado e evidência atual observada. Referências de CAC exigem histórico elegível.
- O servidor confere referências/valores e elegibilidade, mas não certifica automaticamente a fidelidade semântica de prosa livre. A revisão humana permanece necessária.
- Identidade e hash são fornecidos pela reserva e não podem ser trocados no resultado.

## Publicação pausada durante implantação

Uma análise concluída com produção de candidatas pausada permanece auditável, sem candidata. Após habilitação explícita do rollout, o agente pode chamar `growth_publish_investigation_analysis(analysis_id)` para publicar a candidata previamente validada. A chamada revalida hash/revisão e é idempotente; não reescreve análise ou decisão. Nunca habilitar flags para contornar uma recusa.

O hash da skill cobre SKILL.md, este contrato e o script de identidade/validação, com caminhos ordenados explicitamente e quebras LF.
