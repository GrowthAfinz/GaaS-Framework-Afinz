# TAB: Orientador

**Rota:** `/orientador`
**Componente Principal:** `OrientadorView.tsx`
**Categoria:** ANALISE

---

## Overview

O Orientador e o motor de recomendacoes AI do sistema. Analisa o historico de campanhas e sugere as melhores combinacoes de Canal x Oferta x Segmento baseado em performance historica, CAC e taxa de conversao.

---

## Features

- Ranking de recomendacoes com score 0-100
- Analise de CAC, conversao e volume
- Busca de campanhas similares no historico
- Filtros por BU e periodo
- Ordenacao por diferentes criterios
- Modal de historico detalhado
- Insights automaticos por recomendacao

---

## Arquitetura de Componentes

```
OrientadorView.tsx
├── FilterBar
│   ├── BUSelector
│   ├── PeriodSelector
│   └── SortSelector
│
├── RecommendationList
│   └── RecommendationCard.tsx (multiple)
│       ├── ScoreDisplay
│       ├── ComboInfo (Canal/Oferta/Segmento)
│       ├── MetricsRow
│       └── InsightsTags
│
└── HistoricoModal.tsx
    ├── SearchBar
    ├── FilterOptions
    └── CampaignList
```

---

## Componentes Principais

### OrientadorView.tsx
Componente principal que orquestra o motor de recomendacoes.

**Responsabilidades:**
- Chamar useRecommendationEngine
- Aplicar filtros e ordenacao
- Renderizar lista de recomendacoes
- Gerenciar modal de historico

### RecommendationCard.tsx
Card individual mostrando uma recomendacao.

**Informacoes Exibidas:**
- Score final (0-100)
- Combinacao: BU | Canal | Oferta | Segmento
- Metricas: CAC medio, Taxa Conversao, Volume
- Data ultima execucao
- Tags de insights

### HistoricoModal.tsx
Modal para buscar e visualizar campanhas historicas.

**Funcionalidades:**
- Busca por texto livre
- Filtros por BU, Canal, Periodo
- Lista paginada de campanhas
- Detalhes ao clicar

---

## Motor de Recomendacoes

### Algoritmo de Scoring

O sistema calcula um score final (0-100) baseado em 3 dimensoes:

```typescript
// 1. CAC Score (40% do peso)
// Quanto menor o CAC, melhor
cacScore = Math.max(0, 100 - (avgCAC / 2))

// 2. Conversion Score (40% do peso)
// Quanto maior a conversao, melhor
conversionScore = Math.min(100, (avgConversion / 0.05) * 100)

// 3. Volume Score (20% do peso)
// Mais dados = mais confianca
volumeScore = Math.min(100, (totalVolume / 10) * 100)

// Score Final
finalScore = (cacScore * 0.4) + (conversionScore * 0.4) + (volumeScore * 0.2)
```

### Agrupamento de Campanhas

Campanhas sao agrupadas pela chave:
```
BU | Canal | Oferta | Segmento | Promocional | Oferta2 | Promo2
```

### Metricas por Grupo

Para cada grupo, calcula-se:
```typescript
{
  avgCAC: media(cac),
  avgConversion: media(taxaConversao),
  totalVolume: soma(baseEnviada),
  totalCards: soma(cartoes),
  successRate: campanhasComCartoes / totalCampanhas,
  lastExecuted: maxDate(dataDisparo)
}
```

---

## Fluxo de Dados

```
useAppStore.activities
         │
         ▼
useRecommendationEngine()
├─ Agrupa por combinacao
├─ Calcula metricas por grupo
├─ Aplica algoritmo de scoring
├─ Gera insights automaticos
└─ Ordena por score
         │
         ▼
OrientadorView aplica filtros
├─ BU selecionada
├─ Periodo
└─ Criterio de ordenacao
         │
         ▼
RecommendationCard renderiza cada item
         │
         ▼
User clica em "Ver Historico"
         │
         ▼
HistoricoModal busca campanhas do combo
```

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useRecommendationEngine` | Gera recomendacoes |
| `useFrameworkData` | Dados historicos |
| `useAdvancedFilters` | Aplicacao de filtros |

---

## Casos de Uso

### 1. Encontrar Melhor Combo para Nova Campanha
1. Acessar aba Orientador
2. Filtrar por BU desejada
3. Ordenar por Score
4. Revisar top recomendacoes
5. Verificar insights e metricas
6. Usar combo sugerido no Launch Planner

### 2. Analisar Performance de Canal Especifico
1. Filtrar por BU
2. Ordenar por CAC (menor primeiro)
3. Identificar padroes de canais com bom CAC
4. Comparar com canais de maior volume

### 3. Buscar Campanhas Historicas
1. Clicar em "Ver Historico"
2. Usar busca por texto
3. Filtrar por periodo especifico
4. Analisar campanhas similares

### 4. Validar Estrategia Atual
1. Ordenar por Volume
2. Verificar se combos de alto volume tem bom score
3. Identificar oportunidades de otimizacao

---

## Sistema de Insights

O motor gera insights automaticos baseados nos dados:

### Tags de CAC
```typescript
if (avgCAC < 50) tag = "CAC Excelente"
else if (avgCAC < 100) tag = "CAC Bom"
else if (avgCAC < 200) tag = "CAC Moderado"
else tag = "CAC Alto"
```

### Tags de Conversao
```typescript
if (avgConversion > 0.05) tag = "Alta Conversao"
else if (avgConversion > 0.02) tag = "Conversao Media"
else tag = "Baixa Conversao"
```

### Tags de Volume
```typescript
if (totalVolume > 100000) tag = "Alto Volume"
else if (totalVolume > 10000) tag = "Volume Medio"
else tag = "Baixo Volume - Testar Mais"
```

### Tags de Recencia
```typescript
if (diasDesdeUltimaExec < 7) tag = "Executado Recentemente"
else if (diasDesdeUltimaExec < 30) tag = "Executado Este Mes"
else tag = "Nao Executado Recentemente"
```

---

## Ordenacao Disponivel

| Criterio | Descricao |
|----------|-----------|
| Score | Score final ponderado (padrao) |
| CAC | Menor CAC primeiro |
| Conversao | Maior conversao primeiro |
| Volume | Maior volume primeiro |
| Recencia | Mais recente primeiro |

---

## Estrutura de Dados

### Recommendation
```typescript
interface Recommendation {
  id: string;
  combo: {
    bu: BU;
    canal: string;
    oferta: string;
    segmento: string;
    promocional?: string;
    oferta2?: string;
    promocional2?: string;
  };
  metrics: {
    avgCAC: number;
    avgConversion: number;
    totalVolume: number;
    totalCards: number;
    successRate: number;
    lastExecuted: Date | null;
  };
  score: {
    cacScore: number;
    conversionScore: number;
    volumeScore: number;
    finalScore: number;
  };
  insights: InsightTag[];
  sampleActivities: Activity[];
}
```

---

## Arquivos Relacionados

- `src/components/OrientadorView.tsx`
- `src/components/orientador/RecommendationCard.tsx`
- `src/components/orientador/HistoricoModal.tsx`
- `src/hooks/useRecommendationEngine.ts`
- `src/types/recommendations.ts`

---

**Ultima Atualizacao:** 2026-02-02
