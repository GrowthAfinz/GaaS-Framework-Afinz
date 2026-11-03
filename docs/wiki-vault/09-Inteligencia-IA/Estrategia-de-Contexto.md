---
tags: [ia,contexto,rag,arquitetura,adr]
tipo: referencia
camada: evolucao
atualizado: 2026-06-20
status: confirmado
fonte: ADR-001
---

# Estratégia de Contexto

**Definição:** a regra de **quando carregar a ontologia inteira vs. recuperar seletivamente**
(RAG / sub-índices). Decisão **D-2** do [[ADR-001]]. Evita tanto RAG prematuro (complexidade
e risco de recall miss) quanto degradação silenciosa de recall em contexto longo.

## Por que existe um limite
A pesquisa (2026-06-20) mostra que **markdown-em-contexto (LLM-wiki) vence RAG até
~150–200k tokens**; abaixo disso, RAG só adiciona complexidade. Acima, o recall cai
("context cliff") e o custo de token explode.

> 📊 Snapshot 2026-06-20 — `AFINZ_GAAS_ONTOLOGY.md`: 4.755 linhas / 272.878 caracteres
> (≈ **75–90k tokens** estimados). **Ainda na zona "carrega tudo"**, perto do gatilho.

## Gatilho de migração (decisão amarrada a número, não a opinião)
| Tamanho da ontologia | Ação |
|---|---|
| **< 120k tokens** | Carrega total. Garantir **split por header `##`** (maior ganho barato de qualidade). |
| **120k – 180k tokens** | Compilar **sub-índices por camada** — carregar só as camadas relevantes à query. |
| **> 180k tokens** | Migrar para **recuperação seletiva / RAG** sobre o vault (chunking por header, ~512 tokens). |

## Implementação (ver checklist no [[ADR-001]])
- `scripts/bundle_vault.py` deve **imprimir a contagem de tokens** ao final e alertar se cruzar 120k.
- Manter headers de seção (`##`) na ontologia → base do futuro chunking estruturado.

## Relacionado
- [[ADR-001]] · [[Roteamento-de-Memoria]] · [[Ontologia-v2]] · [[Vault-como-Contexto]]
