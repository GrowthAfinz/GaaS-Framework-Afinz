# TAB: Media Analytics

**Rota:** `/midia-paga`
**Componente Principal:** `PaidMediaAfinzApp.tsx`
**Categoria:** ORIGEM

---

## Overview

O Media Analytics e um modulo full-screen dedicado a analise de midia paga. Permite acompanhar investimentos, performance e correlacao entre gastos em anuncios e resultados de cartoes emitidos.

**Nota Importante:** Atualmente, a midia paga nao possui atribuicao direta de emissoes de cartoes. As conversoes registradas referem-se a "Installs do App". A analise de emissoes e feita por correlacao estatistica.

---

## Features

- Dashboard de budgets por canal
- Tabela de performance de campanhas
- Analise de correlacao spend-to-card
- Graficos de eficiencia por canal
- Metricas de CPA, CPM, CTR
- Comparacao entre Meta, Google, TikTok
- Analise de time-lag (dias entre gasto e resultado)

---

## Arquitetura de Componentes

```
PaidMediaAfinzApp.tsx
├── HeaderBar
│   ├── PeriodSelector
│   └── ChannelFilter
│
├── BudgetCards
│   └── BudgetCard.tsx (por canal)
│       ├── SpendProgress
│       ├── BudgetInfo
│       └── ChannelIcon
│
├── CampaignPerformanceTable.tsx
│   ├── TableHeader
│   ├── CampaignRows
│   │   ├── CampaignName
│   │   ├── Channel
│   │   ├── Spend
│   │   ├── Impressions
│   │   ├── Clicks
│   │   ├── Conversions
│   │   ├── CTR
│   │   ├── CPC
│   │   └── CPA
│   └── TotalRow
│
├── ChannelComparisonChart.tsx
│   └── BarChart por canal
│
└── CorrelationAnalysis (via useMediaCorrelation)
    ├── ScatterPlot
    ├── RegressionLine
    └── CorrelationStats
```

---

## Componentes Principais

### PaidMediaAfinzApp.tsx
Componente principal do modulo de midia paga.

**Responsabilidades:**
- Carregar dados de midia paga
- Coordenar visualizacoes
- Gerenciar filtros
- Integrar analise de correlacao

### BudgetCard.tsx
Card mostrando budget e gasto por canal.

**Informacoes:**
- Canal (Meta, Google, TikTok)
- Budget mensal definido
- Gasto atual
- Percentual utilizado
- Barra de progresso

### CampaignPerformanceTable.tsx
Tabela detalhada com metricas por campanha.

**Colunas:**
- Campanha
- Canal
- Objetivo
- Gasto (R$)
- Impressoes
- Cliques
- Conversoes (Install App)
- CTR (%)
- CPC (R$)
- CPM (R$)
- CPA (R$)

### ChannelComparisonChart.tsx
Grafico comparando performance entre canais.

**Metricas Comparadas:**
- Gasto total
- Conversoes (Install App)
- CPA medio
- ROI estimado

---

## Analise de Correlacao

### useMediaCorrelation Hook

Analisa correlacao entre gasto em midia e emissao de cartoes. Como nao ha atribuicao direta (pixels rastreando emissao), o sistema utiliza correlacao estatistica para inferir impacto.

**Processo:**
1. Carrega dados de midia paga (por dia)
2. Carrega dados de cartoes emitidos (por dia)
3. Aplica diferentes time-lags (0-7 dias)
4. Calcula correlacao para cada lag
5. Identifica melhor lag
6. Gera estatisticas de regressao

### Metricas Calculadas

```typescript
interface CorrelationStats {
  bestLag: number;           // Dias de defasagem otima
  r2: number;               // R-quadrado (0-1)
  slope: number;            // Inclinacao da regressao
  intercept: number;        // Intercepto
  formula: string;          // "y = 0.5x + 100"
  quality: 'Alta' | 'Moderada' | 'Baixa';
  interpretation: string;   // Explicacao em texto
}
```

### Time-Lag Analysis
```
Dia 0: Gasto no dia = Cartoes no mesmo dia
Dia 1: Gasto no dia = Cartoes no dia seguinte
...
Dia 7: Gasto no dia = Cartoes 7 dias depois

Melhor Lag = Lag com maior R²
```

---

## Fluxo de Dados

```
Upload CSV Midia Paga / Supabase
         │
         ▼
useAppStore.setPaidMediaData()
         │
         ▼
PaidMediaAfinzApp carrega dados
         │
         ▼
useMediaCorrelation()
├─ Carrega paid_media_metrics
├─ Carrega b2cData (B2C total)
├─ Calcula correlacoes
└─ Identifica melhor lag
         │
         ▼
Dados distribuidos para:
├─ BudgetCards (budgets/gastos)
├─ CampaignPerformanceTable (campanhas)
├─ ChannelComparisonChart (comparativo)
└─ CorrelationAnalysis (scatter + stats)
```

---

## Estrutura de Dados

### DailyAdMetrics
```typescript
interface DailyAdMetrics {
  date: Date;
  channel: 'meta' | 'google' | 'tiktok' | 'unknown';
  campaign: string;
  objective?: 'brand' | 'conversion' | 'unknown';

  // Metricas core (Conversoes = App Installs)
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;

  // Calculados
  ctr?: number;     // clicks / impressions
  cpc?: number;     // spend / clicks
  cpm?: number;     // (spend / impressions) * 1000
  cpa?: number;     // spend / conversions (Cost Per Install)
}
```

### Budget
```typescript
interface Budget {
  id: string;
  channel: AdChannel;
  value: number;
  month: string;    // "2026-02"
}
```

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useMediaCorrelation` | Analise de correlacao |
| `useAppStore` | Dados de midia |
| `useFrameworkData` | Sync inicial |

---

## Casos de Uso

### 1. Verificar Consumo de Budget
1. Acessar Media Analytics
2. Visualizar BudgetCards
3. Identificar canais proximos do limite
4. Planejar realocacoes

### 2. Analisar Performance de Campanhas
1. Visualizar tabela de campanhas
2. Ordenar por CPA (menor primeiro)
3. Identificar campanhas eficientes
4. Pausar campanhas com CPA alto

### 3. Entender Correlacao Spend-Card
1. Visualizar grafico de correlacao
2. Verificar R² (qualidade do modelo)
3. Identificar best lag (dias de defasagem)
4. Usar para projecoes futuras

### 4. Comparar Canais
1. Visualizar ChannelComparisonChart
2. Comparar CPA entre canais
3. Identificar canal mais eficiente
4. Realocar budget

### 5. Importar Dados de Midia
1. Exportar dados da plataforma de ads
2. Formatar no schema esperado
3. Upload via Configuracoes
4. Dados aparecem no dashboard

---

## Formato CSV de Importacao

```csv
date,channel,campaign,objective,spend,impressions,clicks,conversions
2026-01-15,meta,Campanha_Janeiro,conversion,1500.00,50000,1200,45
2026-01-15,google,Search_Brand,conversion,800.00,30000,900,30
```

---

## Metricas Agregadas

### Por Canal
```typescript
{
  channel: 'meta',
  totalSpend: sum(spend),
  totalImpressions: sum(impressions),
  totalClicks: sum(clicks),
  totalConversions: sum(conversions),
  avgCTR: totalClicks / totalImpressions,
  avgCPC: totalSpend / totalClicks,
  avgCPM: (totalSpend / totalImpressions) * 1000,
  avgCPA: totalSpend / totalConversions
}
```

### Por Periodo
```typescript
{
  startDate: string,
  endDate: string,
  totalSpend: number,
  totalConversions: number,
  avgCPA: number,
  correlationWithCards: number,
  estimatedInfluence: number  // Cartoes atribuidos a midia
}
```

---

## Integracao com Supabase

### Tabela: paid_media_metrics
```sql
CREATE TABLE paid_media_metrics (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  channel VARCHAR NOT NULL,
  campaign VARCHAR NOT NULL,
  objective VARCHAR,
  spend DECIMAL(10,2) NOT NULL,
  impressions INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  conversions INTEGER NOT NULL,
  ctr DECIMAL(5,4),
  cpc DECIMAL(10,2),
  cpm DECIMAL(10,2),
  cpa DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_paid_media_date ON paid_media_metrics(date);
CREATE INDEX idx_paid_media_channel ON paid_media_metrics(channel);
```

---

## Arquivos Relacionados

- `src/paid-media/PaidMediaAfinzApp.tsx`
- `src/paid-media/blocks/*.tsx`
- `src/paid-media/components/*.tsx`
- `src/hooks/useMediaCorrelation.ts`
- `src/types/paid-media.ts`

---

**Ultima Atualizacao:** 2026-02-02
