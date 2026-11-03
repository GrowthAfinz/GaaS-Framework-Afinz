---
tags: [conceito,unidade]
tipo: conceito
camada: negocio
atualizado: 2026-06-08
status: confirmado
fonte: gaas-supabase
---

# Campanha

**Definição:** conjunto de [[Disparo|disparos]] de uma mesma [[Jornada]] dentro de uma [[Safra]]. É a unidade de planejamento e leitura de resultado.

## Contexto
**Entidade nova na [[Ontologia-v2|v2]].** No [[Framework-v1-Diretor|v1]] a campanha era implícita — existia espalhada por N disparos sem ser nomeada. Torná-la explícita é a [[Roadmap-Framework|Fase 0]] do roadmap: deixar de ver 700 linhas soltas e passar a ver ~40 campanhas com régua e resultado.

**Chave lógica:** `BU + Segmento + Parceiro + Subgrupo + Etapa + Safra`.

## Relacionado
- [[Disparo]] · [[Jornada]] · [[Safra]] · [[Entidades-v2]] · [[Roadmap-Framework]]
