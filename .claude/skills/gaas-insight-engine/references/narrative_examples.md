# Exemplos de Narrativa (few-shot) — GaaS Insight Engine

Cards aprovados pelo operator owner como referência de tom e estrutura.
O tom é de analista sênior: direto, com números, sem jargão de consultoria, sem hedging vazio.

## Exemplo 1 — tipo `oportunidade`, severidade `critico`

```json
{
  "tipo": "oportunidade",
  "severidade": "critico",
  "confianca": "alta",
  "bu": null,
  "canal": "E-mail",
  "segmento": "Abandonados",
  "etapa": "Meio_de_Funil",
  "titulo": "E-mail zerado no maior ativo da operação (Carrinho Abandonado)",
  "sinal": "O segmento Abandonados — melhor relação da operação — tem zero disparos de E-mail em toda a série histórica.",
  "impacto": "Abandonados gera 5.147 cartões via WhatsApp a CAC R$ 4,83. E-mail custa R$ 0,001/envio (420x mais barato que WPP). Cada ponto de conversão capturado via e-mail neste público é resultado a custo marginal ~zero.",
  "causa_provavel": "Lacuna de cobertura de canal, não decisão deliberada — a régua de Carrinho nasceu em WPP/SMS e nunca foi expandida.",
  "evidencia": {
    "disparos_segmento": 2409,
    "disparos_por_canal": {"WhatsApp": 1893, "SMS": 414, "Push": 102, "E-mail": 0},
    "conversao_bloco": 0.061,
    "cac_bloco": 4.83,
    "priorizacao": "impacto 10 (maior ativo da operação) x urgencia 3 (perda ativa toda safra) x confianca 3 / esforco 1 (adicionar onda na régua)"
  },
  "acao": "Adicionar onda de E-mail D-1 na régua de Carrinho Abandonado (B2C e Plurix) por 2 safras.",
  "criterio_sucesso": "Conversão incremental >= 1% a CAC < R$ 2 em 2 safras.",
  "prioridade": 90
}
```

## Exemplo 2 — tipo `gargalo`, severidade `medio` (guardrail de etapa aplicado)

```json
{
  "tipo": "gargalo",
  "severidade": "medio",
  "confianca": "alta",
  "etapa": "Aquisicao",
  "titulo": "Aquisição fria: abertura em 9,2% é o teto que limita todo o funil",
  "sinal": "Na etapa Aquisicao, a taxa de abertura (9,2%) está muito abaixo das demais etapas — aprovação a 58% mostra que quem chega, converte.",
  "impacto": "Com entrega a 90% e aprovação a 58%, cada ponto de abertura recuperado se propaga: +1pp de abertura ≈ +11% de propostas no frio, sem custo adicional de base.",
  "causa_provavel": "Candidatas: assunto/preview genéricos e horário não otimizado por subgrupo — o público qualificado responde quando abre (aprovação alta confirma aderência).",
  "evidencia": {
    "funil_fria": {"entrega": 0.90, "abertura": 0.092, "proposta": 0.118, "aprovacao": 0.58, "conversao": 0.067},
    "guardrail": "benchmark calculado APENAS dentro da etapa Aquisicao",
    "priorizacao": "impacto 6 x urgencia 2 x confianca 3 / esforco 1.5"
  },
  "acao": "Bateria de testes A/B de assunto + horário nos 2 maiores segmentos frios (Base_Proprietaria, CRM), registrados como Experimentos no Diário de Bordo.",
  "criterio_sucesso": "Abertura >= 11% em 2 safras.",
  "prioridade": 24
}
```

## Exemplo 3 — tipo `virada_safra`, severidade `medio`

```json
{
  "tipo": "virada_safra",
  "severidade": "medio",
  "confianca": "alta",
  "segmento": "Abandonados",
  "safra": "2026-03",
  "titulo": "A virada de março/26 em Abandonados ainda não tem causa registrada — risco de não replicar",
  "sinal": "Entre fev/26 e mar/26, o bloco Abandonados teve CAC ÷3 e conversão ×3,6 simultaneamente em B2C e Plurix — maior salto de eficiência da série.",
  "impacto": "Se a causa for estrutural (oferta/régua/qualidade de base) e não for documentada, a operação não consegue replicá-la em outros blocos nem protegê-la de regressão.",
  "causa_provavel": "Mudança operacional deliberada em março (não sazonal — ocorreu nos dois BUs ao mesmo tempo). Candidatas: ajuste de oferta, nova régua, higienização de base.",
  "evidencia": {
    "b2c": {"2026-02": {"cac": 9.32, "conv": 0.027}, "2026-03": {"cac": 2.79, "conv": 0.097}},
    "plurix": {"2026-02": {"cac": 27.70, "conv": 0.015}, "2026-03": {"cac": 6.60, "conv": 0.064}},
    "sustentacao": "eficiência mantida em abr-mai/26",
    "priorizacao": "impacto 6 x urgencia 2 x confianca 3 / esforco 1"
  },
  "acao": "Investigar e registrar no Diário de Bordo o que mudou na operação de Carrinho em março/26.",
  "criterio_sucesso": "Causa documentada com hipótese testável para replicação em Repescagem.",
  "prioridade": 36
}
```

## Anti-padrões (NÃO fazer)

- "A performance pode estar sendo impactada por diversos fatores..." → vazio, sem número
- "Recomendamos analisar mais a fundo" → não é ação mensurável
- "O canal X causou a queda" → causalidade declarada sem evidência
- Citar conversão média da operação para julgar um segmento de meio de funil → mistura de etapas
- Número que não existe no evidence pack → alucinação, descarte imediato
