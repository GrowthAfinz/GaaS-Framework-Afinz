# Data Quality Guardrails

Nenhuma recomendacao de growth deve esconder limite de dado.

## Classificacao

| Classe | Uso |
| --- | --- |
| `confirmed` | Fonte atual, completa, coerente e com volume suficiente. |
| `directional` | Util para leitura, mas com alguma limitacao de amostra, freshness, tracking ou comparacao. |
| `suspect` | Divergencia, lacuna, zeramento abrupto, denominador ausente ou padrao inesperado. |
| `blocked` | Nao usar para conclusao/acao ate corrigir a fonte ou regra. |

## Dias fechados

- Usar apenas dias fechados para comparacao operacional.
- Dia corrente parcial nao deve entrar como conclusao principal.
- Em semana parcial, comparar mesmos dias com mesmos dias.

## Recomendacoes proibidas

- Escalar campanha com coleta incompleta.
- Cortar budget so por CPA se CAC/cartao nao estiver medido.
- Concluir causa usando apenas correlacao.
- Juntar aquisicao e rentabilizacao sem avisar.
- Automatizar escrita sem governanca, revisao e rollback.

## Toda acao deve ter

- motivo;
- evidencia;
- janela;
- metrica de sucesso;
- dono sugerido quando aplicavel;
- confianca;
- limite de leitura.

