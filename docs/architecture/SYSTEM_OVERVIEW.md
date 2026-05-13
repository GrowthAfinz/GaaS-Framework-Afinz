# Sistema Calendario Estrategico - Overview

**Versao:** 2.0 (Post-MVP)
**Data:** 2026-02-02
**Status:** Producao Ativa

---

## Introducao

O **Calendario Estrategico** e uma plataforma de analytics para Growth Marketing que transforma dados de campanhas Salesforce em visualizacoes interativas e insights acionaveis. O sistema permite que operadores de marketing visualizem, analisem e otimizem o desempenho de campanhas ao longo do tempo.

### Proposta de Valor
- Substituir listas estaticas de campanhas por visualizacao temporal
- Permitir analise de padroes (performance por data/canal/BU)
- Suportar decisoes baseadas em dados atraves de KPIs
- Fornecer fonte unica de verdade para tracking de campanhas
- Automatizar agendamento de disparos com projecoes AI

---

## Stack Tecnologico

| Camada | Tecnologia | Versao |
|--------|------------|--------|
| **Frontend** | React + TypeScript | 18 / 5.2 |
| **Build Tool** | Vite | 5.0 |
| **Styling** | Tailwind CSS | 3.3 |
| **State Management** | Zustand + React Context | 5.0 |
| **Charts** | Recharts | 3.5 |
| **Icons** | Lucide React | 0.563 |
| **Data Processing** | Papaparse | 5.4 |
| **Storage Local** | IndexedDB (idb-keyval) | 6.2 |
| **Backend** | Supabase | 2.93 |
| **Validacao** | Zod | 3.x |

---

## Arquitetura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   9 TABS    │  │  130+ COMP  │  │     20 HOOKS            │  │
│  │   /VIEWS    │  │  ONENETS    │  │     CUSTOMIZADOS        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    ZUSTAND STORES (3)                       ││
│  │  useAppStore | useMetaStore | diaryStore                    ││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    SERVICES (13)                            ││
│  │  activityService | dataService | ML Services (6)            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND (Supabase)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │  activities   │  │  b2c_daily_     │  │  paid_media_     │  │
│  │  (principal)  │  │  metrics        │  │  metrics         │  │
│  └───────────────┘  └─────────────────┘  └──────────────────┘  │
│  ┌───────────────┐  ┌─────────────────┐                        │
│  │    goals      │  │  framework_     │                        │
│  │               │  │  versions       │                        │
│  └───────────────┘  └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## As 9 Abas Principais

O sistema e organizado em 9 abas/views principais, agrupadas em 4 categorias:

### PLANEJAMENTO

| Aba | Rota | Descricao |
|-----|------|-----------|
| **Launch** | `/launch` | Calendario interativo para agendamento de campanhas com modal inteligente e projecoes AI |
| **Diario de Bordo** | `/diario` | Sistema de anotacoes e tracking de experimentos A/B |

### ANALISE

| Aba | Rota | Descricao |
|-----|------|-----------|
| **Jornada & Disparos** | `/jornada` | Analise de funil de conversao com deteccao de anomalias |
| **Resultados** | `/resultados` | Metricas de performance, metas e projecoes |
| **Orientador** | `/orientador` | Motor de recomendacoes AI baseado em historico |

### ORIGEM

| Aba | Rota | Descricao |
|-----|------|-----------|
| **Originacao B2C** | `/originacao-b2c` | Analise de aquisicao B2C com orquestrador de funil |
| **Media Analytics** | `/midia-paga` | Modulo full-screen para analise de midia paga |

### FRAMEWORK

| Aba | Rota | Descricao |
|-----|------|-----------|
| **Campanhas** | `/framework` | Editor de dados CSV com versionamento e historico |
| **Configuracoes** | `/configuracoes` | Admin, gestao de metas, versionamento de dados |

---

## Estrutura de Componentes (130+)

```
src/components/
├── dispatch/           (15) Modal inteligente com blocos AI
│   ├── ai/                  Projecoes e recomendacoes
│   ├── blocks/              Blocos do formulario
│   ├── form/                Inputs inteligentes
│   └── context/             Estado do formulario
│
├── launch-planner/     (9)  Planejamento de campanhas
│   ├── LaunchPlanner.tsx
│   ├── DashboardLayout.tsx
│   ├── CalendarSummary.tsx
│   └── ...
│
├── jornada/            (3)  Analise de jornada
│   ├── PerformanceEvolutionChart.tsx
│   ├── DailyDetailsModal.tsx
│   └── BottleneckAnalysis.tsx
│
├── diary/              (4)  Diario e experimentos
│   ├── DiaryView.tsx
│   ├── ExperimentsView.tsx
│   └── ...
│
├── analise/            (6)  Analytics avancados
│   ├── MediaCorrelationCharts.tsx
│   ├── EfficiencyHeatmap.tsx
│   └── ...
│
├── originacao/         (15) Analise B2C + Orchestrator
│   ├── orchestrator/        Orquestrador de funil
│   ├── OriginacaoCharts.tsx
│   └── ...
│
├── admin/              (2)  Gestao de dados
├── orientador/         (2)  Recomendacoes
├── paid-media/         (3)  Midia paga
├── resultados/         (1)  Projecoes
├── layout/             (5)  Layout e navegacao
└── [40+ root]               Componentes gerais
```

---

## Camada de Dados

### Hooks Customizados (20+)

| Hook | Proposito |
|------|-----------|
| `useFrameworkData` | Parse e sync de dados CSV/Supabase |
| `useCalendarFilter` | Filtros por BU no calendario |
| `useAdvancedFilters` | Filtros multi-dimensionais |
| `useActivities` | CRUD de atividades/disparos |
| `useRecommendationEngine` | Motor de recomendacoes AI |
| `useMediaCorrelation` | Correlacao spend-to-card |
| `useB2CAnalysis` | Analise CRM vs B2C |
| `useGoals` | Gestao de metas mensais |
| `useVersionManager` | Versionamento de dados |
| `useStrategyMetrics` | Metricas por segmento |

### Services (13)

| Service | Funcao |
|---------|--------|
| `activityService` | CRUD de atividades no Supabase |
| `dataService` | Mapeamento de dados |
| `storageService` | Upload/download de arquivos |
| `versionService` | Controle de versoes |
| **ML Services:** | |
| `AIOrchestrator` | Orquestra pipeline de ML |
| `predictionEngine` | Predicao de KPIs |
| `similarityEngine` | Campanhas similares |
| `causalAnalyzer` | Analise causal |
| `explanationGenerator` | Explicacoes em linguagem natural |
| `dataProcessor` | Pre-processamento de dados |

---

## Principais Features

### Implementadas (MVP + Enhanced)

- Upload CSV com validacao (Latin-1/UTF-8)
- Calendario visual com grid 7x6
- Navegacao por mes
- Filtros multi-dimensionais (BU, Canal, Segmento, Parceiro, Jornada)
- Cards de hover com 6+ KPIs
- Interface dark mode
- Contadores por dia
- Color coding por BU dominante
- Integracao Supabase
- Multiplas views de analise
- Painel administrativo
- Tracking de experimentos (Diario)
- Analytics avancados (scatter, heatmaps, dual-axis)
- Analise de correlacao de midia
- Graficos de comparacao de canal
- Upload drag-and-drop
- **Modal inteligente com projecoes AI**
- **Motor de recomendacoes**
- **Orquestrador de funil B2C**
- **Versionamento de dados**

### Roadmap (Futuro)

- Integracao Google Sheets API
- Export PNG/PDF
- Auto-refresh em tempo real
- Toggle light/dark mode
- Comparacao lado-a-lado
- Presets de filtros
- Otimizacao mobile

---

## KPIs Principais

O sistema rastreia 14+ KPIs organizados em categorias:

### Volume
- Base Enviada
- Base Entregue

### Taxas de Funil
- Taxa de Entrega
- Taxa de Abertura
- Taxa de Clique
- Taxa de Proposta
- Taxa de Aprovacao
- Taxa de Finalizacao
- Taxa de Conversao

### Resultados
- Propostas
- Aprovados
- Emissoes/Cartoes

### Financeiros
- CAC (Custo de Aquisicao)
- Custo Total Campanha

---

## Business Units (BUs)

| BU | Cor | Hex |
|----|-----|-----|
| B2C | Azul | #3B82F6 |
| B2B2C | Verde | #10B981 |
| Plurix | Roxo | #A855F7 |

---

## Documentacao Relacionada

- [CLAUDE.md](../../CLAUDE.md) - Guia do desenvolvedor
- [TAB_LAUNCH_PLANNER.md](../tabs/TAB_LAUNCH_PLANNER.md) - Documentacao do Launch
- [TAB_JORNADA_DISPAROS.md](../tabs/TAB_JORNADA_DISPAROS.md) - Documentacao de Jornada
- [SUPABASE_SCHEMA.md](../api/SUPABASE_SCHEMA.md) - Schema do banco
- [ML_SERVICES.md](../api/ML_SERVICES.md) - Pipeline de ML
