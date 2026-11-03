---
tags: [gaas,aba,exploracao]
tipo: operacao
camada: operacao
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Aba: Explorador Avançado

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver o app atual e o [[00-Indice/MOC-Operacao|MOC de operação]].

**Definição:** a aba de **navegação livre por disparos** (`DisparoExplorer`) — árvore, busca, comparação e detalhe de [[Disparo|disparos]]. Nova, ausente do CLAUDE.md.

## O que entrega
- Árvore navegável (`tree/`, `useTreeData`, `useTreeNavigation`).
- Busca cross-dimensão (`search/`, `useExplorerSearch`).
- Comparação lado a lado (`comparison/`, `useComparisonData`) e painel de detalhe (`useDetailsPaneData`).
- Estado próprio em `explorerStore` (4º store Zustand — ver [[Modelo-de-Estado]]).

## Por que importa
É a ferramenta de **investigação ad-hoc** — permite ao operador "garimpar" padrões sem montar um relatório fixo. Complementa o [[Explorador-Avançado|explorer]] ao [[Orientador]] (que ranqueia automaticamente).

## Relacionado
- [[Disparo]] · [[Modelo-de-Estado]] · [[Orientador]] · [[GaaS-9-Áreas]]
