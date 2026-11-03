---
tags: [ia,memoria,arquitetura,adr]
tipo: referencia
camada: evolucao
atualizado: 2026-06-20
status: confirmado
fonte: ADR-001
---

# Roteamento de Memória

**Definição:** a regra que diz **onde cada tipo de conhecimento mora** no segundo cérebro,
para que nenhum fato viva em dois lugares (evita duplicação e drift). Decisão **D-1** do
[[ADR-001|ADR-001 — Arquitetura do Segundo Cérebro]], validada pela literatura de *Cognitive
Architectures for Language Agents* (working / episodic / semantic memory).

## Os três níveis
| Nível | É no projeto | Guarda | Característica |
|---|---|---|---|
| **Working memory** | `CLAUDE.md` + memory tool | Estado de sessão, foco atual, decisões recentes | Volátil, sempre carregado |
| **Memória semântica** | Vault Obsidian (notas) | Conceitos estáveis, definições, regras | 1 nota = 1 conceito, durável |
| **Memória episódica** | Snapshots datados (`> 📊 Snapshot AAAA-MM-DD`) | Números reais com timestamp | Dado vivo, reidratável ([[Runbook-Vault-Vivo]]) |
| **Contexto carregado** | [[Ontologia-v2]] / `AFINZ_GAAS_ONTOLOGY.md` | Compilação seletiva da semântica p/ a IA | Derivado — **nunca** é fonte |

## Decision tree (para humano e IA, ao escrever um fato)
```
O fato é um número que muda no tempo (CAC, conversão, spend)?
  → SIM: snapshot datado na nota relevante (episódica). NUNCA no CLAUDE.md.
  → NÃO ↓
O fato é um conceito/definição/regra estável da operação?
  → SIM: nota no vault (semântica). 1 conceito por nota.
  → NÃO ↓
O fato só importa para a sessão/tarefa atual?
  → SIM: CLAUDE.md / memory (working). Expira.
```

## Por que importa
Sem esta regra, a IA recebe informação contraditória (número velho no CLAUDE.md vs. snapshot
novo na nota) e o corpus incha. Com ela, o write-back da IA é disciplinado — pré-requisito
para o loop de retroalimentação ([[Vault-como-Contexto]]).

## Relacionado
- [[ADR-001]] · [[Vault-como-Contexto]] · [[Runbook-Vault-Vivo]] · [[Estrategia-de-Contexto]] · [[Governança-de-Dados]]
