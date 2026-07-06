# TAB: Explorador Avançado

**Rota:** `/explorador` (rotulado como **"Framework"** no menu de navegação de produção — clique único, sem dropdown)
**Componente Principal:** `DisparoExplorer.tsx` (`src/components/explorer/`)
**Categoria:** FRAMEWORK

---

## Overview

Explorador hierárquico de dados de disparo (BU → Segmento → Jornada → Canal → Disparo), sucessor funcional — **não substituto 1:1** — da antiga aba "Campanhas" (`FrameworkView.tsx`, ainda existe no código mas fora da navegação principal). Enquanto o Framework antigo era um editor de tabela linha-a-linha com versionamento, o Explorador é uma ferramenta de análise visual e drill-down, com edição pontual via modal.

Testado em produção (2026-07-05) com BU B2C, depois B2C+Plurix, período de 6 meses (01/02/2026–31/07/2026), 1.360–1.756 disparos conforme frente.

---

## Features

- Árvore de 5 níveis com contadores de volume por nó (ex: `B2C 5,4M` → `Aprovados_nao_convertidos 48,1k` → atividades individuais).
- Painel de comparação central com gráfico de barras (drill-down por clique) e gráfico temporal.
- Painel de detalhes à direita com métricas agregadas do nó selecionado (Disparos, Cartões, CAC médio, Custo Total, Propostas, Tx Conversão).
- Multi-seleção de nós (Ctrl/Cmd+click) para comparação lado a lado.
- Busca rápida (`QuickSearch`) por jornada/segmento com score de relevância.
- Clique em disparo (nó folha) abre modal de edição inline (`DisparoDetailModal`).
- Clique em dia no gráfico temporal abre `DailyDetailsModal`.
- Botão "Reset Comparison" (limpa foco/seleção) e Expand/Collapse.
- Toggle de frente Aquisição↔Rentabilização muda completamente a árvore (ex: em Rentabilização a raiz mostra jornadas "Desbloqueio", "Incentivo ao Uso", "Welcome" em vez dos segmentos de aquisição).

---

## Arquitetura de Componentes

```
DisparoExplorer.tsx
├── TreeView (painel esquerdo, ~420px)
│   ├── QuickSearch
│   └── nós: BU → Segmento → Jornada → Canal → Disparo
│
├── ComparisonPanel (painel central, flex-1)
│   ├── BarChart (drill-down por clique)
│   └── gráfico temporal (linhas/stacked por dia)
│
└── DetailsPane (painel direito, ~320px)
    ├── métricas agregadas do nó em foco
    ├── distribuição por canal/oferta/promoção/parceiro/subgrupo
    └── botão "View All" → navega para FrameworkView com filtros aplicados
```

---

## Componentes Principais

### DisparoExplorer.tsx
Orquestra os 3 painéis, sincroniza filtros globais (BU/segmento/canal/jornada) com o `explorerStore`, e mapeia `Activity[]` do store (`useAppStore().activities`) para `ActivityRow[]` normalizado.

### explorerStore.ts (Zustand)
```typescript
ExplorerFilters {
  periodo: { inicio, fim }
  bus: string[]        // vazio = todas
  segmentos: string[]
  jornadas: string[]
  canais: string[]
  status: (...)[]      // suportado no tipo, não exposto na UI hoje
}
```

### useTreeData.ts
Constrói a árvore via `useMemo` com dependência em `[activities, filters]` — recalcula toda vez que período/filtros mudam.

### useExplorerSearch.ts
Scoring de busca: exact match (50) > startsWith (30) > includes (20), retorna até 20 resultados com caminho completo (ex: `B2C > CRM > Jornada_Ativa`).

---

## Fluxo de Dados

```
useAppStore().activities (fonte primária)
         │  (fallback se vazio)
         ▼
activityService.getAllActivities() (Supabase, tabela `activities`)
         │
         ▼
Normalização Activity → ActivityRow (parse de datas, agregação de KPIs)
         │
         ▼
explorerStore.filters (período + BU/segmento/jornada/canal, sincronizado com filtros globais)
         │
         ▼
useTreeData constrói a árvore hierárquica
         │
         ▼
Seleção/foco de nó → useComparisonData agrega para o ComparisonPanel e DetailsPane
```

---

## Recomendações de Uso e Limitações de Performance

- **Sem paginação** — a árvore inteira é carregada em memória via `useMemo`. Testado com sucesso: B2C+Plurix, 6 meses, ~1.756 disparos, sem lentidão perceptível.
- Recomendação (não é limite rígido, é heurística observada): períodos de 1–3 meses com 1–2 BUs para volumes muito grandes (>10k disparos); para volumes na faixa testada (até ~1.800 disparos em 6 meses) o comportamento foi fluido.
- O botão "View All" no `DetailsPane` navega para `FrameworkView.tsx` (a antiga aba "Campanhas", ainda presente no código mas sem entrada própria na navegação) com os filtros do nó aplicados — é o único ponto de acesso a essa tela remanescente.

---

## Casos de Uso

### 1. Investigar performance de um segmento
1. Selecionar BU e período (ex: B2C, 6 meses).
2. Expandir o segmento de interesse na árvore.
3. Clicar no nó — o DetailsPane mostra métricas agregadas (CAC, Custo Total, Propostas, Tx Conversão).

### 2. Comparar dois segmentos ou BUs
1. Ctrl+click em dois nós de mesmo nível.
2. Ler o ComparisonPanel (barras lado a lado).

### 3. Investigar um dia específico
1. Com um nó em foco, clicar em um ponto do gráfico temporal.
2. `DailyDetailsModal` abre com as atividades daquele dia.

### 4. Buscar uma jornada/segmento específico
1. Digitar no QuickSearch.
2. Clicar no resultado — a árvore expande e foca automaticamente no nó.

---

## Hooks/Store Utilizados

| Hook/Store | Função |
|---|---|
| `explorerStore` (Zustand) | Filtros do explorador (período, BU, segmento, jornada, canal) |
| `useTreeData` | Constrói a árvore hierárquica a partir de activities+filtros |
| `useComparisonData` | Agrega dados para o gráfico de comparação |
| `useExplorerSearch` | Busca com scoring |
| `useAppStore().activities` | Fonte primária de dados (fallback: `activityService.getAllActivities()`) |

---

## Gaps/Limitações Conhecidas

- Sem paginação — para volumes muito grandes (dezenas de milhares de disparos), pode haver degradação de performance (não observada nos testes realizados, que ficaram na faixa de ~1.800 disparos).
- O filtro `status` existe no tipo `ExplorerFilters` mas não está exposto na UI.
- Coexiste com `FrameworkView.tsx` (fora do nav), que ainda concentra a função de edição/versionamento de CSV — o Explorador não substitui essa função, apenas complementa com visão analítica.

---

## Arquivos Relacionados

- `src/components/explorer/DisparoExplorer.tsx`
- `src/store/explorerStore.ts`
- `src/components/explorer/useTreeData.ts`
- `src/components/explorer/useExplorerSearch.ts`
- `src/components/FrameworkView.tsx` (tela legada, acessível via "View All")

---

**Última Atualização:** 2026-07-05
