# TAB: Jornada & Disparos

**Rota:** `/jornada`
**Componente Principal:** `JornadaDisparosView.tsx`
**Categoria:** ANALISE

---

## Overview

A aba Jornada & Disparos oferece analise aprofundada do funil de conversao e deteccao de anomalias em campanhas. Permite visualizar a evolucao de performance ao longo do tempo e identificar gargalos no processo de conversao.

---

## Features

- Grafico de funil de conversao (Entrega → Abertura → Proposta → Aprovacao → Emissao)
- Deteccao automatica de anomalias
- Grafico de evolucao de performance temporal
- Analise de gargalos (bottleneck analysis)
- Filtros por periodo, BU, Canal, Segmento
- Modos de visualizacao: Performance vs Anomalias
- Modal de detalhes diarios
- Agregacao diaria ou semanal

---

## Arquitetura de Componentes

```
JornadaDisparosView.tsx
├── FilterBar (periodo, BU, filtros)
├── ModeToggle (Performance | Anomalias)
│
├── [Modo Performance]
│   ├── JornadaChart.tsx (Funil principal)
│   └── PerformanceEvolutionChart.tsx
│       └── Timeline com metricas
│
├── [Modo Anomalias]
│   ├── AnomalyFilters
│   │   ├── Pendentes
│   │   ├── Sem Envio
│   │   ├── Sem Entrega
│   │   └── Sem Abertura
│   └── AnomalyList
│
├── BottleneckAnalysis.tsx
│   └── Identificacao de gargalos
│
└── DailyDetailsModal.tsx
    └── Detalhes por dia selecionado
```

---

## Componentes Principais

### JornadaDisparosView.tsx
Componente principal que orquestra toda a view de analise de jornada.

**Responsabilidades:**
- Gerenciar modo de visualizacao (Performance/Anomalias)
- Aplicar filtros globais
- Coordenar dados entre componentes
- Abrir modal de detalhes

### JornadaChart.tsx
Grafico de funil mostrando taxas de conversao em cada etapa.

**Etapas do Funil:**
1. **Base Enviada** - Total de registros enviados
2. **Entregues** - Taxa de entrega
3. **Abertos** - Taxa de abertura
4. **Propostas** - Taxa de proposta
5. **Aprovados** - Taxa de aprovacao
6. **Emissoes** - Taxa de finalizacao

### PerformanceEvolutionChart.tsx
Grafico temporal mostrando evolucao das metricas ao longo do periodo.

**Metricas Exibidas:**
- Taxa de Conversao (linha principal)
- Volume de Cartoes (barras)
- CAC (eixo secundario)

**Interacoes:**
- Hover mostra tooltip com detalhes
- Click abre DailyDetailsModal

### BottleneckAnalysis.tsx
Identifica e exibe gargalos no funil de conversao.

**Analises Realizadas:**
- Maior queda percentual entre etapas
- Etapa com pior performance vs benchmark
- Tendencia de piora/melhora
- Recomendacoes de acao

### DailyDetailsModal.tsx
Modal com detalhes completos de um dia especifico.

**Informacoes Exibidas:**
- Lista de campanhas do dia
- KPIs individuais por campanha
- Comparacao com media do periodo
- Anomalias identificadas

---

## Fluxo de Dados

```
useAppStore.activities
         │
         ▼
useAdvancedFilters aplica filtros
├─ BU selecionada
├─ Canais selecionados
├─ Periodo (inicio, fim)
└─ Segmentos/Parceiros
         │
         ▼
Dados filtrados passam para:
├─ JornadaChart (calcula funil agregado)
├─ PerformanceEvolutionChart (agrupa por dia/semana)
└─ BottleneckAnalysis (identifica gargalos)
         │
         ▼
User clica em ponto do grafico
         │
         ▼
DailyDetailsModal abre com dados do dia
```

---

## Deteccao de Anomalias

O sistema detecta 4 tipos de anomalias:

### 1. Pendentes
Campanhas agendadas que ainda nao foram executadas apos a data prevista.

**Criterio:** `status = 'Scheduled' AND dataDisparo < hoje`

### 2. Sem Envio
Campanhas marcadas como executadas mas sem registro de envio.

**Criterio:** `status = 'Enviado' AND baseEnviada = 0`

### 3. Sem Entrega
Campanhas com envio mas taxa de entrega anomala.

**Criterio:** `taxaEntrega < 50%` ou `baseEntregue = 0`

### 4. Sem Abertura
Campanhas entregues mas sem abertura registrada.

**Criterio:** `taxaEntrega > 0 AND taxaAbertura = 0`

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useFrameworkData` | Dados de atividades |
| `useAdvancedFilters` | Aplicacao de filtros |
| `useConversionFunnel` | Calculo do funil |
| `useBottleneckTrend` | Analise de gargalos |

---

## Casos de Uso

### 1. Analisar Performance do Periodo
1. Selecionar periodo desejado
2. Aplicar filtros de BU/Canal se necessario
3. Visualizar funil de conversao
4. Identificar etapas com maior queda
5. Usar BottleneckAnalysis para recomendacoes

### 2. Investigar Anomalias
1. Alternar para modo "Anomalias"
2. Filtrar por tipo de anomalia
3. Revisar lista de campanhas afetadas
4. Clicar para ver detalhes
5. Tomar acao corretiva

### 3. Acompanhar Evolucao Temporal
1. Selecionar periodo mais longo
2. Observar PerformanceEvolutionChart
3. Identificar tendencias
4. Clicar em pontos especificos para detalhes

### 4. Comparar Segmentos
1. Filtrar por segmento especifico
2. Anotar metricas
3. Alterar filtro para outro segmento
4. Comparar resultados

---

## Metricas Calculadas

### Funil de Conversao
```
Taxa Entrega = Base Entregue / Base Enviada
Taxa Abertura = Aberturas / Base Entregue
Taxa Proposta = Propostas / Aberturas
Taxa Aprovacao = Aprovados / Propostas
Taxa Finalizacao = Emissoes / Aprovados
Taxa Conversao Global = Emissoes / Base Enviada
```

### Performance Index
```
Performance = (Taxa Conversao Atual / Taxa Conversao Benchmark) * 100
```

### Trend Analysis
```
Tendencia = (Media Ultimos 7 dias - Media 7 dias Anteriores) / Media 7 dias Anteriores
```

---

## Configuracoes

### Agregacao Temporal
- **Diario:** Dados agrupados por dia
- **Semanal:** Dados agrupados por semana

### Thresholds de Anomalia
Configuraveis em `useAppStore.alertConfig`:
```typescript
{
  share_crm_limiar: 15,      // % minimo de share CRM
  ativar_anomalias: true     // Liga/desliga deteccao
}
```

---

## Arquivos Relacionados

- `src/components/JornadaDisparosView.tsx`
- `src/components/jornada/PerformanceEvolutionChart.tsx`
- `src/components/jornada/DailyDetailsModal.tsx`
- `src/components/jornada/BottleneckAnalysis.tsx`
- `src/hooks/useAdvancedFilters.ts`
- `src/hooks/useConversionFunnel.ts`

---

**Ultima Atualizacao:** 2026-02-02
