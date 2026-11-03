---
tags: [estrategia,framework,contrato]
tipo: estrategia
camada: estrategia
atualizado: 2026-06-08
status: legado
fonte: gaas-supabase
status_original: confirmado
legado_desde: 2026-10-29
---

# Casos de Uso (Contratos de I/O)

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver [[05-Estrategia/Função-Objetivo|Função-objetivo]] e [[05-Estrategia/Orquestrador|Orquestrador]].

**Definição:** os contratos de entrada→saída do orquestrador, já especificados pelo [[Framework-v1-Diretor|diretor]].

## Os casos
| Caso | Entrada | Saída | Objetivo |
|---|---|---|---|
| **Definição de Canal** | Segmento, BU, Parceiro, Etapa, Tipo de Oferta | Canal + taxas + conversão + confiança | Conversão |
| **Definição de Oferta** | (idem) | Oferta + Canal + Conversão + CAC | Conversão |

## v2 (novos)
- **Sugestão de Régua:** jornada-base + safra → sequência sugerida.
- **Detecção de Oportunidade:** histórico + metas → lista priorizada.
- **Leitura de Experimento:** experimento_id → variação vencedora + aprendizado.

## Contexto
A assinatura das funções do orquestrador **já está definida** — não precisa inventar entrada/saída. Função objetivo tática = conversão; ver [[Função-Objetivo]].

## Relacionado
- [[Função-Objetivo]] · [[Orquestrador]] · [[Canais]] · [[Ofertas]]
