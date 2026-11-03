---
tags: [ia,contexto,metodo]
tipo: estrategia
camada: evolucao
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Vault como Contexto

**Definição:** o modelo em que este vault Obsidian é o **contexto persistente** que humanos e IAs leem antes de agir — em vez de reexplicar a operação a cada conversa, a IA lê, raciocina e escreve dentro deste conhecimento estruturado.

## Por que funciona aqui
O vault já tem os ingredientes que tornam um corpus legível por agente:
- **Markdown plano** + 1 nota = 1 conceito → recuperável e citável.
- **Frontmatter** (`tipo/camada/status`) → a IA filtra por relevância.
- **Status de confiança** (`confirmado|inferência|a-validar`) → a IA sabe o que é dado duro vs. dedução.
- **Snapshots datados** → a IA não trata número velho como verdade eterna (ver [[Runbook-Vault-Vivo]]).
- **Wikilinks densos** → a IA segue o raciocínio (CAC → CAC-Ótimo → Função-Objetivo → Orquestrador).

## O loop que destrava os "70%"
`dados vivos (Supabase) → SQL → reidrata snapshot no vault → IA lê contexto fresco → gera insight/ação`.
O elo que falta automatizar é a reidratação — ver [[Runbook-Vault-Vivo]]. As [[Skills-do-Projeto]] já consomem dados; fazê-las lerem o vault como ontologia torna as análises consistentes.

## Relacionado
- [[MCP-Visão-Geral]] · [[Obsidian-MCP]] · [[Runbook-Vault-Vivo]] · [[Skills-do-Projeto]] · [[Ontologia-v2]]
