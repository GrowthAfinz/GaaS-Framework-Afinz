# TAB: Originacao B2C

**Rota:** `/originacao-b2c`
**Componente Principal:** `OriginacaoB2CView.tsx`
**Categoria:** ORIGEM

---

## Overview

A aba Originacao B2C e dedicada a analise de aquisicao de clientes no segmento B2C. Permite comparar performance do CRM com resultados totais da originacao, identificar correlacoes e usar o Funnel Orchestrator para simular cenarios de otimizacao.

---

## Features

- Comparacao CRM vs B2C Total
- Upload de dados B2C externos (CSV)
- Graficos de correlacao e share
- Analise de performance por segmento
- Funnel Orchestrator para simulacoes
- KPIs comparativos
- Deteccao de anomalias de share

---

## Arquitetura de Componentes

```
OriginacaoB2CView.tsx
├── B2CUpload.tsx (upload de CSV B2C)
├── FilterBar (periodo, perspectiva)
│
├── OriginacaoKPIs.tsx
│   ├── OriginacaoKPIsComparison.tsx
│   └── OriginacaoKPIsPerformance.tsx
│
├── OriginacaoCharts.tsx
│   ├── ShareBySegmentChart.tsx
│   └── ActivityShareCorrelationChart.tsx
│
├── OriginacaoTable.tsx
│   └── Tabela de dados diarios
│
└── FunnelOrchestrator/ (sub-modulo)
    ├── FunnelOrchestrator.tsx
    ├── FunnelLayers.tsx
    ├── InfluenceMatrix.tsx
    ├── ActionLevers.tsx
    ├── OrchestratorFilters.tsx
    └── ResultEstimates.tsx
```

---

## Componentes Principais

### OriginacaoB2CView.tsx
Componente principal que coordena toda a analise B2C.

**Responsabilidades:**
- Carregar dados B2C
- Merge com dados CRM
- Calcular metricas comparativas
- Coordenar sub-componentes

### B2CUpload.tsx
Componente para upload de dados B2C externos.

**Formato CSV Esperado:**
```csv
data,propostas_b2c_total,emissoes_b2c_total,percentual_conversao_b2c
2026-01-15,1500,450,30.0
2026-01-16,1600,480,30.0
```

### OriginacaoKPIs.tsx
Exibe KPIs comparativos entre CRM e B2C.

**Metricas:**
- Share CRM (%) - Quanto o CRM representa do total
- Propostas CRM vs B2C
- Emissoes CRM vs B2C
- Taxa Conversao CRM vs B2C
- Performance Index

### OriginacaoCharts.tsx
Graficos de analise de originacao.

**Graficos:**
- Share por Segmento (pie chart)
- Correlacao Atividade x Share
- Evolucao temporal de share

### OriginacaoTable.tsx
Tabela detalhada com dados diarios.

**Colunas:**
- Data
- Propostas B2C / CRM
- Emissoes B2C / CRM
- Share CRM (%)
- Performance Index
- Flag de Anomalia

---

## Funnel Orchestrator

Sub-modulo avancado para simulacao e otimizacao do funil.

### FunnelOrchestrator.tsx
Componente principal do orquestrador.

### FunnelLayers.tsx
Visualizacao das camadas do funil:
1. Base Total
2. Ativacao
3. Proposta
4. Aprovacao
5. Emissao

### InfluenceMatrix.tsx
Matriz mostrando influencia de cada acao em cada etapa do funil.

```
              | Entrega | Abertura | Proposta | Emissao |
Email Volume  |   0.8   |   0.5    |   0.3    |   0.2   |
SMS Volume    |   0.9   |   0.3    |   0.4    |   0.3   |
WPP Volume    |   0.7   |   0.6    |   0.5    |   0.4   |
```

### ActionLevers.tsx
Controles deslizantes para simular ajustes.

**Alavancas Disponiveis:**
- Volume por canal (+/- %)
- Investimento em oferta
- Frequencia de disparo

### ResultEstimates.tsx
Mostra estimativas de resultado baseadas nas simulacoes.

**Saidas:**
- Emissoes projetadas
- CAC projetado
- ROI estimado
- Comparacao vs cenario atual

---

## Fluxo de Dados

```
Upload CSV B2C
         │
         ▼
useCSVParser processa arquivo
         │
         ▼
useAppStore.setB2CData()
         │
         ▼
useB2CAnalysis()
├─ Carrega activities (CRM)
├─ Carrega b2cData (B2C total)
├─ Merge por data
├─ Calcula shares e indices
└─ Detecta anomalias
         │
         ▼
Dados distribuidos para:
├─ OriginacaoKPIs (metricas)
├─ OriginacaoCharts (graficos)
├─ OriginacaoTable (tabela)
└─ FunnelOrchestrator (simulacao)
```

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useB2CAnalysis` | Analise comparativa CRM/B2C |
| `useCSVParser` | Parse de CSV B2C |
| `useFrameworkData` | Dados CRM |
| `useAdvancedFilters` | Filtros |

---

## Casos de Uso

### 1. Importar Dados B2C
1. Clicar em "Importar B2C"
2. Arrastar arquivo CSV
3. Verificar preview dos dados
4. Confirmar importacao
5. Dados aparecem na tabela

### 2. Analisar Share CRM
1. Visualizar KPIs de share
2. Identificar dias com share baixo
3. Verificar correlacao com volume de atividades
4. Planejar acoes corretivas

### 3. Simular Cenarios com Orchestrator
1. Acessar Funnel Orchestrator
2. Ajustar alavancas de volume
3. Observar estimativas de resultado
4. Comparar cenarios
5. Escolher melhor configuracao

### 4. Investigar Anomalias
1. Filtrar por anomalias na tabela
2. Identificar dias problematicos
3. Verificar atividades CRM do dia
4. Correlacionar com eventos externos

---

## Metricas Calculadas

### DailyAnalysis
```typescript
{
  data: string;
  dia_semana: string;

  // B2C Total
  propostas_b2c_total: number;
  emissoes_b2c_total: number;
  taxa_conversao_b2c: number;

  // CRM
  propostas_crm: number;
  emissoes_crm: number;
  entregas_crm: number;
  custo_crm: number;
  num_campanhas_crm: number;

  // Calculados
  share_propostas_crm_percentual: number;
  share_emissoes_crm_percentual: number;
  taxa_conversao_crm: number;
  performance_index: number;  // Conv CRM / Conv B2C
  cac_medio: number;

  // Anomalia
  eh_anomalia: boolean;
}
```

### MetricsSummary
```typescript
{
  periodo_inicio: string;
  periodo_fim: string;
  share_crm_media: number;
  emissoes_crm_total: number;
  emissoes_b2c_total: number;
  cac_medio: number;
  taxa_conversao_crm_media: number;
  taxa_conversao_b2c_media: number;
  performance_index_medio: number;
  total_dias: number;
  dias_com_anomalia: number;
}
```

---

## Configuracao de Anomalias

```typescript
// Em useAppStore.alertConfig
{
  share_crm_limiar: 15,     // Share abaixo de 15% = anomalia
  ativar_anomalias: true    // Liga/desliga deteccao
}
```

---

## Arquivos Relacionados

- `src/components/OriginacaoB2CView.tsx`
- `src/components/originacao/OriginacaoCharts.tsx`
- `src/components/originacao/OriginacaoTable.tsx`
- `src/components/originacao/OriginacaoKPIs.tsx`
- `src/components/originacao/orchestrator/*.tsx`
- `src/hooks/useB2CAnalysis.ts`
- `src/types/b2c.ts`

---

**Ultima Atualizacao:** 2026-02-02
