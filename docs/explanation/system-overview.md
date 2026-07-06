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

Stack tecnológico completo: ver [reference/stack.md](../reference/stack.md).

---

## Arquitetura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   10 TABS   │  │  130+ COMP  │  │     20 HOOKS            │  │
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

## As 10 Abas Principais

O sistema e organizado em 10 abas/views principais, agrupadas em 4 categorias (fonte de verdade: `src/config/navigation.ts`):

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
| **Relatorio** | `/relatorio` | Exportacao de relatorios XLSX (mensal/diario, agregados, comparativos) |
| **Orientador** | `/orientador` | Motor de recomendacoes AI baseado em historico |

### ORIGEM

| Aba | Rota | Descricao |
|-----|------|-----------|
| **Originacao B2C** | `/originacao-b2c` | Analise de aquisicao B2C com orquestrador de funil |
| **Media Analytics** | `/midia-paga` | Modulo full-screen para analise de midia paga |

### FRAMEWORK

| Aba | Rota | Descricao |
|-----|------|-----------|
| **Explorador Avancado** | `/explorador` | Exploracao avancada de dados de disparo (sucessor da antiga aba "Campanhas") |
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
├── relatorio/          (13) Exportacao de relatorios XLSX
├── communications/     (15) Sistema de mensageria (em evolucao)
├── experiments/        (12) Kanban de experimentos
├── explorer/           (1)  Explorador Avancado
├── admin/              (5)  Gestao de dados
├── orientador/         (2)  Recomendacoes
├── paid-media/         (3)  Midia paga
├── resultados/         (2)  Projecoes
├── layout/             (8)  Layout e navegacao
└── [demais componentes raiz]
```

> Nota: contagens por pasta são um snapshot; ver `docs/reference/` para referência técnica atualizada por área quando disponível.

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

Referência completa: [reference/hooks.md](../reference/hooks.md).

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

Referência completa: [reference/services.md](../reference/services.md) e [reference/ml-services.md](../reference/ml-services.md).

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
- **Exportação de relatórios XLSX** (aba Relatório)
- **Explorador avançado de dados de disparo** (sucessor da aba Campanhas)

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
- [reference/tabs/TAB_LAUNCH_PLANNER.md](../reference/tabs/TAB_LAUNCH_PLANNER.md) - Documentacao do Launch
- [reference/tabs/TAB_JORNADA_DISPAROS.md](../reference/tabs/TAB_JORNADA_DISPAROS.md) - Documentacao de Jornada
- [reference/supabase-schema.md](../reference/supabase-schema.md) - Schema do banco
- [reference/ml-services.md](../reference/ml-services.md) - Pipeline de ML
- [DOCS_GOVERNANCE.md](../DOCS_GOVERNANCE.md) - Regra repo vs vault
