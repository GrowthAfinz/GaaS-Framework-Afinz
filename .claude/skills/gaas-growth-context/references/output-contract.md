# Output Contract

O principal artefato desta skill e o Growth Context Pack.

## Growth Context Pack

Estrutura recomendada:

1. `report_profile`
2. resumo da operacao
3. invariantes aplicados
4. fontes consultadas
5. freshness e qualidade dos dados
6. mapa frente x parceiro x segmento
7. contrato de views/slides aplicavel
8. narrativa sugerida
9. action queues
10. textos para `skip_llm`
11. pendencias de dado/modelagem

## Text registry para skip_llm

Formato JSON recomendado:

```json
{
  "slide_id": "aqs_parceiro_001",
  "view": "VIEW_AQS_PARCEIRO",
  "block": "Aquisicao CRM",
  "title": "Parceiros que explicam a aquisicao",
  "commentary": "Texto da IA sem inventar numero.",
  "recommendation": "Acao sugerida.",
  "confidence": "directional",
  "source_limit": "Comparacao usada como contexto auxiliar."
}
```

## Action queue

Colunas recomendadas:

`prioridade`, `bucket`, `frente`, `parceiro`, `segmento`, `objetivo`, `campanha`, `problema`, `evidencia`, `acao`, `janela`, `metrica_de_sucesso`, `confianca`, `limite_de_leitura`

Buckets recomendados:

- `Agir hoje`: bloqueio, perda material, oportunidade clara ou acao de baixo arrependimento.
- `Acompanhar`: sinal relevante que precisa de nova janela ou confirmacao.
- `Investigar`: baixa confianca, problema de dado, tracking, mapping ou hipotese ainda fraca.

## View contract row

Cada slide/view normalizado deve declarar:

`ordem_tecnica`, `bloco`, `view`, `grao`, `colunas`, `perfil_aplicavel`, `papel_operacional`, `limites`, `comentario_esperado`

## Payload minimo para Report Live skip_llm

Declarar:

`report_id`, `report_profile`, `periodo`, `comparison_window`, `briefing_version`, `skip_llm`, `texts`, `recomendacoes`, `metadata`, `quality_notes`

`texts` e `recomendacoes` devem ter chave estavel por slide/view para permitir auditoria e reprocessamento.
