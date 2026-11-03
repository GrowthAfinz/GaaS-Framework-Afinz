---
tags: [ia, gaas, report-live, memoria, loop, outcome, aprendizado]
tipo: inteligencia-ia
camada: operacao
tipo_diataxis: explanation
criado: 2026-09-13
atualizado: 2026-09-15
status: a-validar
fonte: supabase-inventario-set-2026
aliases: [Loop de Outcome, Prestação de Contas do Report Live]
---

# Report Live — Loop de Outcome (mínimo viável)

**Definição:** o menor conjunto de mudanças que faz o Report Live aprender entre ciclos — fechar o resultado das recomendações que o sistema já emite, sem criar tabela nova e sem tocar no motor determinístico. É o passo anterior à [[Report-Live-V2-Loop-de-Aprendizado-e-Memoria]], não um substituto dela.

## Contexto

O [[Agente-Report-Live-Handoff]] já manda, no passo 3: *"ler a memória e comparar cada recomendação anterior (`valor_esperado`) com o realizado"*. A tabela existe, o campo existe, três ciclos foram gravados. **Nenhum foi fechado.**

## Estado real da memória

> 📊 Snapshot 2026-09-13 — projeto Supabase `mipiwxadnpwtcgfcedym`

**Preenchido:** `report_memory` 3 ciclos (jun/jul/ago) · `report_action_candidates` 43 · `report_runs` 31 · `paid_media_insights` 333 · `campaign_context` 7 · `goals` 7.

**Vazio:** `report_action_outcomes` **0** · `report_memory.outcomes` **0 nos três ciclos** · `report_memory.licoes` **0 caracteres nos três** · `experiments` **0** — e com ela a view `vw_experiment_batting_average`, pronta para calcular taxa de acerto e sem uma linha para medir · `paid_media_targets` **0**.

**43 previsões emitidas, 0 verificadas.**

Sintoma que confirma o diagnóstico: recomendações por ciclo caindo — **junho 4 · julho 2 · agosto 1**. A certificação subiu a régua de rigor corretamente, mas sem memória nenhum sinal ganha confiança com o tempo. Rigor sem memória produz silêncio, não prudência.

## O ciclo de junho, fechado manualmente

> 📊 Snapshot 2026-09-13 — verificação das 4 recomendações de `report_memory` ciclo `2026-06`

| Recomendação | Esperado | Realizado | Veredito |
|---|---|---|---|
| Auditar tracking Plurix | 980 conv./mês | indicador inexistente | premissa falsa |
| Reduzir parceiro N/A a <10% | ≤ 10% | 38% → 32% → **56%** | falhou e regrediu |
| Frear Copa ou formalizar teto | R$ 5.000 (jul) | R$ 8.645 | estourou 73% |
| Teste Google Search B2C | CPC ≤ R$ 1,20 | R$ 0,67 → 0,63 → **0,56** | bateu com folga |

Placar: **1 de 4**. Ressalvas de filtro: spend de Copa por `campaign ilike '%copa%|%rentabiliza%|%lp_visa%'` é piso; CPC é do canal Google inteiro, não só B2C.

O que cada linha ensina e se perdeu:

- **Plurix** — a recomendação previa 980 conversões apoiada num número que o relatório trimestral de agosto descobriu não existir (Meta retorna "Not available"; app +amigo nunca cadastrado no AppsFlyer, ver [[Deck-Relatorio-Resultados-Arquitetura]]). A descoberta de agosto **invalida retroativamente** a recomendação de junho, e não há caminho de volta.
- **Parceiro N/A** — a regressão de 38% para 56% é a origem direta do risco descrito em [[Dimensao-Canonica-de-Parceiro]]. O problema que o report apontou em junho virou, três meses depois, risco de credibilidade do próprio report.
- **CPC Google** — acertou com folga. Sem registro, ninguém sabe que o motor é conservador nesse tipo de estimativa, e a próxima projeção erra para o mesmo lado.

## Proposta — três mudanças, nenhuma tabela nova

**1. A recomendação declara quando será cobrada.** Três campos a mais no JSON que a `report-sync` já aceita:

```json
{ "acao": "Reduzir parceiro N/A a <10%",
  "metrica": "pct_cartoes_sem_parceiro",
  "valor_esperado": 10, "unidade": "%",
  "direcao": "menor_melhor",
  "janela_outcome": "2026-09-30",
  "consulta_verificacao": "VIEW_PARTNER_ROUTER" }
```

Sem prazo, uma recomendação nunca vence — é por isso que nenhuma das 43 foi cobrada.

**2. O fechamento roda junto com o build do mês seguinte.** Antes de calcular o período novo, o run lê as recomendações com janela vencida, busca a métrica declarada no snapshot e grava o outcome. Veredito determinístico: `confirmado` quando o realizado atinge o esperado na direção declarada; `nao_confirmado` quando não atinge; **`premissa_invalida`** quando a métrica não existe mais ou nunca existiu — o caso Plurix, que nenhuma comparação numérica captaria.

**3. O slide C7 deixa de ser tabela vazia.** "Resultado das ações anteriores" já existe no deck com a justificativa correta de que não há janela encerrada. A partir do segundo ciclo com prazo, mostra o placar do mês anterior e a taxa de acerto acumulada por tipo de sinal.

## O que adiar

Alinhado com o que a própria [[Report-Live-V2-Loop-de-Aprendizado-e-Memoria]] já exclui, e indo um passo além: **nesta fase também não construir as três camadas de contexto encapsulado.** Elas fazem sentido depois que houver track record para justificar o que vale guardar. Sem loop fechado, "memória revisada" é opinião arquivada — três narrativas mensais já estão gravadas em `report_memory.narrativa` e não produziram um aprendizado sequer.

Fora de escopo: banco vetorial, múltiplos agentes, aprendizado autônomo, promoção automática de hipótese, metadados de storytelling por slide, tabela nova de qualquer tipo.

## Fundamentos

- **Argyris & Schön — single-loop antes de double-loop.** Single-loop corrige a ação mantendo as premissas; double-loop questiona as premissas. A V2 mira o segundo laço, mas o Report Live ainda não faz o primeiro — não sabe se a ação funcionou. E o caso Plurix mostra que o double-loop chega sozinho quando o primeiro roda: a premissa caiu porque alguém foi medir.
- **Viés retrospectivo.** Sem registro prévio da expectativa, a memória se reorganiza para fazer o resultado parecer previsível. Metade do trabalho já está feita — `valor_esperado` é gravado no momento da recomendação.
- **Calibração / track record.** Brier score exige previsão probabilística; as recomendações do GaaS são valores esperados. O equivalente honesto é **erro relativo e taxa de acerto por tipo de sinal**.
- **Prática mínima viável.** Afirmação inequívoca + prazo + número + acompanhamento. O formato atual já atende três dos quatro; falta a janela.

Referências: [Argyris (infed)](https://infed.org/dir/welcome/chris-argyris-theories-of-action-double-loop-learning-and-organizational-learning/) · [Commoncog — evaluating your own predictions](https://commoncog.com/how-do-you-evaluate-your-own-predictions/) · [Hindsight bias at work](https://www.suebehaviouraldesign.com/en/blog/hindsight-bias-at-work/) · [Good Judgment Project](https://aiimpacts.org/evidence-on-good-forecasting-practices-from-the-good-judgment-project/)

Análise completa: https://claude.ai/code/artifact/ba610167-7c03-4b40-ad1f-bf5943fff352

## Relacionado

- [[Report-Live-V2-Loop-de-Aprendizado-e-Memoria]] — a direção conceitual que esta nota antecede
- [[Agente-Report-Live-Handoff]] — passos 3 e 7, onde o loop já está especificado
- [[Report-Live-Arquitetura-Editorial]] — o critério de permanência de slide depende deste loop
- [[Report-Live-Enciclopedia]] · [[Dimensao-Canonica-de-Parceiro]] · [[Diário-de-Bordo]]

## Implementação candidata — 15/09/2026

O contrato foi materializado sem tabela nova. `report_action_candidates` recebe valor, unidade, direção, fim da janela e view de verificação; `report_action_outcomes` recebe a procedência da verificação. A captura atômica deixa de congelar `actionCandidates=[]` e passa a incluir as recomendações anteriores no snapshot imutável.

O build avalia somente recomendação `approved`, com janela vencida e contrato quantitativo completo. O resultado é `confirmado`, `nao_confirmado` ou `premissa_invalida`; view, entidade ou métrica ausente permanecem nulas e explicadas. `VIEW_ACTION_OUTCOMES` reúne detalhe e placar acumulado por `signal_code`, tornando C7 renderizável quando houver primeiro fechamento real.

Sinal repetido em dois runs sem outcome recebe `status=backlog`, dono `Growth Ops` quando ausente e deixa a fila apresentada no deck. A regra não apaga a candidata nem inventa resultado.

Estado: código, migration e testes locais concluídos; nenhum outcome histórico foi retropreenchido automaticamente.
