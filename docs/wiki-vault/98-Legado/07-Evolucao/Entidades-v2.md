---
tags: [evolucao,v2]
tipo: evolucao
camada: evolucao
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Entidades v2 (Campanha, Template, Experimento)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[05-Estrategia/Ontologia-v2|Ontologia v2]] e [[09-Inteligencia-IA/Loop-de-Aprendizado-Growth|Loop de aprendizado]].

**Definição:** as três entidades que a [[Ontologia-v2|v2]] adiciona para transformar execução em aprendizado.

## As três + pergunta de negócio que cada uma responde
| Entidade | O que é | Pergunta |
|---|---|---|
| [[Campanha]] (explícita) | disparos por jornada+safra | *qual campanha performou?* |
| [[Template]] | conteúdo desacoplado do envio (atributo) | *qual criativo gerou resposta?* |
| [[Experimento]] | agrupa variações A/B testadas | *qual variação teve efeito comprovado?* |

## Decisão de modelagem
**Experimento agrupa disparos; Template é atributo.** O experimento é a unidade de aprendizado (contém variações); o template começa como `template_id` e pode virar tabela depois.

## Relacionado
- [[Ontologia-v2]] · [[Campanha]] · [[Template]] · [[Experimento]]
