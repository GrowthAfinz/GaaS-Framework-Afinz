---
tags: [engenharia, gaas, estado]
tipo: engenharia
camada: codigo
tipo_diataxis: reference
atualizado: 2026-06-08
status: legado
fonte: codigo-gaas
status_original: confirmado
legado_desde: 2026-10-29
---

# Modelo de Estado

> **Legado (foto de jun/2026).** Esta nota ficou fora da estrutura nova da wiki em 29/10/2026 e é mantida como histórico, sem alteração de conteúdo. Para o estado atual, ver a documentação do repositório (`calendar-estrategico/docs/`) e o [[08-Engenharia/MOC-Engenharia|MOC de engenharia]].

O estado global é dividido entre **4 stores Zustand** e **4 React Contexts**. Não há um arquivo de referência dedicado a isso no repo ainda; a visão mais próxima é [`calendar-estrategico/docs/explanation/system-overview.md`](../../calendar-estrategico/docs/explanation/system-overview.md) — para o detalhe exato de cada store/context, ler o código em `src/store/` e `src/context(s)/`.

**O que importa saber, com lente de negócio:**
- **`useAppStore`** (Zustand) guarda os dados centrais (activities, framework, metas, diário) e a aba ativa. Ponto crítico: `activities` e `frameworkData` **não ficam em cache local** — são buscados do Supabase a cada carregamento da página. Ou seja, a fonte da verdade é sempre o Supabase, nunca o navegador do operador. Ver [[Decisões-Técnicas]].
- **Período e BU selecionada vivem fora do Zustand**, em React Context (`PeriodContext`, `BUContext`) — uma separação que evoluiu organicamente e hoje exige que `App.tsx` funda os dois antes de aplicar qualquer filtro. Isso é fonte de confusão ao debugar por que um filtro "não pegou" numa view. Ver [[Dívida-Técnica]].
- **`useMetaStore`** guarda as metas mensais (Cartões, Pedidos, CAC) por mês/BU — é a ponte direta com [[Metas-e-CAC]].

## Relacionado
- [[Arquitetura-Geral]]
- [[Hooks-Catálogo]]
- [[Decisões-Técnicas]]
- [[Convenções-de-Código]]
- [[Metas-e-CAC]]
- [[MOC-Engenharia]]
