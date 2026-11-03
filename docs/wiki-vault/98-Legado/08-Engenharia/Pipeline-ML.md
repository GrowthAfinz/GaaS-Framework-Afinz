---
tags: [engenharia, gaas, ml]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Pipeline ML

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

Definição precisa: o "ML" do GaaS **não usa modelos treinados nem bibliotecas de ML**. É um pipeline de **heurísticas estatísticas determinísticas** rodando 100% no browser, sobre o histórico de `activities`. Produz projeções por campo, intervalos de confiança, fatores causais e explicações em linguagem natural para o [[Modal-de-Disparo]] e o [[Orientador]].

Por que existe: dá ao operador uma estimativa "do que esperar" (conversão, CAC, cartões) antes de agendar um disparo, baseada em campanhas similares passadas — em vez de chute. É o que materializa o **pilar de automação por histórico** ([[Pilar-Automação-por-Histórico]]).

O detalhe técnico completo (arquitetura do orquestrador, algoritmo de similaridade, motor de projeção, etc.) vive no repo: [`calendar-estrategico/docs/reference/ml-services.md`](../../calendar-estrategico/docs/reference/ml-services.md).

## O que é preciso saber para confiar (ou não) numa recomendação

- **Similaridade e projeção são reais e funcionais**: o sistema compara a campanha sendo planejada com o histórico em várias dimensões (BU, segmento, canal, jornada, perfil de crédito etc.), pondera por recência, e projeta métricas com intervalo de confiança. Quanto menos dimensões coincidirem com casos históricos, menor o nível de confiança reportado — e a confiança de uma recomendação vem do **volume de execução** (nº de disparos históricos comparáveis), não do volume de conversão (conversão zero é resultado válido no mercado de cartão).
- **O rótulo "causal" é otimista**: o `causalAnalyzer` se autodescreve como "Shapley Values simplificado" / "Do-Calculus simplificado", mas na prática aproxima importância de fator por variância entre grupos — é uma heurística de correlação, não inferência causal rigorosa. Não usar como prova de causalidade em decisão de budget sem validação adicional. Ver [[Dívida-Técnica]].
- **Gaps conhecidos que afetam os números**: o custo unitário de oferta está zerado no cálculo (só o custo de canal é considerado), e a métrica de "taxa de sucesso" do motor de recomendação nunca foi definida — ambos pendentes, ver [[Dívida-Técnica]].

## Relacionado
- [[Camada-de-Serviços]]
- [[Modal-de-Disparo]]
- [[Hooks-Catálogo]]
- [[Orientador]]
- [[Pilar-Automação-por-Histórico]]
- [[Dívida-Técnica]]
- [[MOC-Engenharia]]
