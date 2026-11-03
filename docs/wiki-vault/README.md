# Afinz CRM & Mídia — Bíblia de Contexto

Vault Obsidian com o conhecimento consolidado da operação de **aquisição de cartão via CRM e mídia paga** da Afinz (sistema **GaaS**).

## Como usar
1. Abra esta pasta no Obsidian: *Open folder as vault*.
2. Comece por **[[🏠 HOME]]** (pasta `00-Indice`).
3. Navegue clicando nos links `[[ ]]`. Use `Ctrl+O` para pular entre notas e o **Grafo** para ver as conexões.

## Convenções
- **1 nota = 1 conceito.** Notas curtas e linkadas.
- **Frontmatter YAML** em toda nota (`tipo`, `camada`, `status`, `atualizado`).
- **Status de confiança:** `confirmado` (dado duro), `inferência` (dedução), `a-validar` (pendente).
- **Snapshots datados:** números reais levam `> 📊 Snapshot 2026-06-08` — dado vivo muda.

## Camadas (pastas)
| Pasta | Conteúdo |
|---|---|
| `00-Indice` | Mapas de conteúdo (MOCs), porta de entrada |
| `01-Conceitos` | Dicionário vivo (CAC, Jornada, Safra, Template, Experimento...) |
| `02-Entidades-Dados` | Tabelas do Supabase e relações |
| `03-Dimensoes` | Canais, Segmentos, Ofertas, Parceiros, BUs (com dados reais) |
| `04-Operacao` | Como o GaaS funciona (9 áreas, ingestão, taxonomia) |
| `05-Estrategia` | Função objetivo, CAC ótimo, plano do diretor, roadmap |
| `06-Performance` | Evidências reais (CAC por canal, funil, recorrência) |
| `07-Evolucao` | Ontologia v2, orquestrador, decisões abertas/tomadas, governança |
| `08-Engenharia` | *(gerada via Claude Code)* arquitetura, código, hooks, ML |
| `09-Inteligencia-IA` | Vault como contexto, MCP, skills, agentes, runbook de vault vivo |
| `99-Templates` | Template de nota + convenções do vault |

> **Mídia paga** atravessa as camadas (conceitos, dimensões, entidades, performance) — ponto de entrada em [[MOC-Midia-Paga]].

## Fonte dos dados
Supabase projeto **"GaaS Framework Afinz"** (`mipiwxadnpwtcgfcedym`), tabela `activities` e correlatas. Período de referência: jan/2025 – jun/2026.
