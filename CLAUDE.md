# CLAUDE.MD - Calendario Estrategico de Disparos Salesforce

**Project:** Calendario Estrategico (Strategic Calendar Dashboard)
**Owner:** Pabloooo (Growth Marketing)
**Type:** React + TypeScript Dashboard
**Purpose:** Visual analytics for Salesforce campaign performance tracking

---

## PROJECT OVERVIEW

This is a strategic calendar dashboard designed for growth marketing operators to visualize, analyze, and optimize Salesforce campaign performance over time. It transforms CSV data from the "Framework Growth" system into an interactive calendar interface with advanced analytics.

**Core Value Proposition:**
- Replace static campaign lists with temporal visualization
- Enable pattern analysis (performance by date/channel/BU)
- Support data-driven decisions through 14+ KPIs
- Provide single source of truth for campaign tracking
- AI-powered dispatch scheduling with field projections
- Recommendation engine based on historical performance

---

## KNOWLEDGE BASE & ONTOLOGY (OBSIDIAN VAULT)

O conhecimento de negócio, baselines e regras operacionais da Afinz (mídia paga, CRM, canais, segmentos, KPIs) está documentado no **Vault Obsidian** localizado em `../Afinz-CRM-Midia-Vault/` (pasta irmã deste repositório).

Para que a IA tenha acesso completo, instantâneo e com recall perfeito a este contexto, ele é compilado em um arquivo unificado:
*   **Ontologia Compilada:** `../docs/AFINZ_GAAS_ONTOLOGY.md` (gerado fora deste repositório, na raiz de `ACALENDARIO APP/`)
*   **Como atualizar:** Ao fazer alterações no Obsidian Vault, execute `python ../scripts/bundle_vault.py` no terminal para recompilar a ontologia.
*   **Instrução para IA:** Antes de qualquer alteração de código, análise de dados ou geração de insights, você **DEVE** ler `AFINZ_GAAS_ONTOLOGY.md` para usar a taxonomia, baselines e regras de negócio corretas.
*   **Governança da documentação técnica:** ver `docs/DOCS_GOVERNANCE.md` para a regra de "o que vai no repo vs. o que vai no vault" (pasta `08-Engenharia/` do vault cobre a síntese de negócio; este `docs/` cobre o detalhe técnico de implementação).

---

## PILAR DO PROJETO: Automatizacao por Historico

> **A AUTOMATIZACAO E BUSCA BASEADA EM HISTORICO E O PILAR FUNDAMENTAL DO PROJETO!**

Todo campo preenchivel do modal de programacao de disparo DEVE:

1. **Ler historico de disparos** (tabela activities no Supabase)
2. **Oferecer SELECT com opcoes do historico** (NAO usar Input com datalist)
3. **Sugerir valores baseados em contexto** (BU + Campanha + Jornada)
4. **Permitir preenchimento rapido** sem digitacao manual

### Campos que DEVEM usar SELECT com historico:
| Campo | Fonte do Historico |
|-------|-------------------|
| CAMPANHA (ex-Segmento) | Segmentos unicos do historico |
| Jornada | Jornadas filtradas por BU |
| Parceiro | Parceiros do historico |
| Subgrupo | Subgrupos do historico |
| Oferta | Ofertas do historico |
| Promocional | Promocionais do historico |
| Oferta 2 | Ofertas secundarias |
| Promo 2 | Promocionais secundarios |
| Produto | Produtos do historico |
| Perfil Credito | Perfis de credito |
| Etapa Funil | Etapas de aquisicao |

### Campos auto-calculados:
| Campo | Logica |
|-------|--------|
| ActivityName | Auto-gerar: BU_CAMP_JORNADA_ORD_SAFRA |
| Safra | Ultimo disparo do segmento + 1 mes |
| Ordem | Calculado mas EDITAVEL pelo usuario |
| C.U. Canal | Automatico por canal selecionado |
| Total Campanha | Volume * (C.U. Oferta + C.U. Canal) |

### Custos por Canal:
| Canal | Custo Unitario |
|-------|---------------|
| E-mail | R$ 0,001 |
| Push | R$ 0,001 |
| SMS | R$ 0,064 |
| WhatsApp | R$ 0,420 |

---

## SYSTEM ARCHITECTURE

### 10 Main Tabs/Views

O sistema possui 10 abas principais organizadas em 4 categorias (ver `src/config/navigation.ts` — fonte de verdade da navegação **no código**).

> ⚠️ **Divergência observada em teste de produção (2026-07-05):** o menu renderizado (`GlobalHeader.tsx`) não é 1:1 com `NAV_CONFIG`. Achados reais navegando em `https://growthafinz.github.io/GaaS-Framework-Afinz/#`:
> - **Comunicações** aparece como item de nav próprio (dropdown: "Cadastro e Templates", "Performance do Conteúdo") — não listado em `navigation.ts`.
> - O grupo "FRAMEWORK" renderiza como link único direto para o Explorador Avançado (sem dropdown), e "Configurações" some do nav visível (ver bug de layout abaixo).
> - **Não há link visível para "Resultados"** no menu — seu conteúdo parece ter sido absorvido pelo Launch (seção "Metas & Resultados") e pelo Relatório.
> - **Bug de layout confirmado:** em viewport de ~1238px de largura, os ícones do canto direito do header (incluindo o botão "Configurações" e "Tela cheia") ficam posicionados fora da área visível (x=1300–1334px), sem scroll horizontal disponível — inacessíveis por clique normal.
> Antes de confiar cegamente em `navigation.ts` para decisões de UX/nav, confirmar contra o comportamento real renderizado.

#### PLANEJAMENTO
| Aba | Rota | Componente | Funcao |
|-----|------|------------|--------|
| **Launch** | `launch` | LaunchPlanner.tsx | Calendario de agendamento com modal inteligente e projecoes AI |
| **Diario de Bordo** | `diario` | DiarioBordo.tsx | Tracking de experimentos e anotacoes |

#### ANALISE
| Aba | Rota | Componente | Funcao |
|-----|------|------------|--------|
| **Jornada & Disparos** | `jornada` | JornadaDisparosView.tsx | Analise de funil e deteccao de anomalias |
| **Resultados** | `resultados` | ResultadosView.tsx | Metricas de performance e metas |
| **Relatorio** | `relatorio` | RelatorioView.tsx | Exportacao de relatorios XLSX (mensal/diario, agregados, comparativos) |
| **Orientador** | `orientador` | OrientadorView.tsx | Motor de recomendacoes AI |

#### ORIGEM
| Aba | Rota | Componente | Funcao |
|-----|------|------------|--------|
| **Originacao B2C** | `originacao-b2c` | OriginacaoB2CView.tsx | Analise de aquisicao B2C e orquestrador de funil |
| **Media Analytics** | `midia-paga` | PaidMediaAfinzApp.tsx | Analise de midia paga (modulo full-screen) |

#### FRAMEWORK
| Aba | Rota | Componente | Funcao |
|-----|------|------------|--------|
| **Explorador Avancado** | `explorador` | DisparoExplorer.tsx | Exploracao avancada de dados de disparo (sucessor da antiga aba "Campanhas") |
| **Configuracoes** | `configuracoes` | ConfiguracoesView.tsx | Admin, versionamento, metas |

> Nota: `FrameworkView.tsx` (antiga aba "Campanhas") ainda existe no codigo mas nao esta mais em `NAV_CONFIG` — nao documentar como aba ativa sem confirmar com o usuario.

---

### Tech Stack
- **Frontend:** React 18 + TypeScript 5.2
- **Build Tool:** Vite 5.0
- **Styling:** Tailwind CSS 3.3 (dark mode)
- **State Management:** Zustand 5.0 + React Context
- **Data Processing:** Papaparse 5.4 (CSV parsing)
- **Charts:** Recharts 3.5
- **Icons:** Lucide React 0.563
- **Storage:** IndexedDB via idb-keyval 6.2
- **Backend:** Supabase 2.93
- **Validation:** Zod 3.x

---

### Project Structure (130+ Components)

```
calendar-estrategico/
├── src/
│   ├── components/              # 130+ React components
│   │   ├── dispatch/            # (15) Modal inteligente com AI
│   │   │   ├── ai/              # Projecoes e tooltips
│   │   │   ├── blocks/          # Blocos do formulario
│   │   │   │   ├── IdentificationBlock.tsx
│   │   │   │   ├── ScheduleBlock.tsx
│   │   │   │   ├── ProductOfferBlock.tsx
│   │   │   │   ├── InvestmentBlock.tsx
│   │   │   │   ├── AIProjectionBlock.tsx
│   │   │   │   └── shared.tsx
│   │   │   ├── form/            # SmartInput, SmartSelect
│   │   │   ├── context/         # DispatchFormContext
│   │   │   └── ProgramarDisparoModal.tsx
│   │   │
│   │   ├── launch-planner/      # (9) Planejamento
│   │   │   ├── LaunchPlanner.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── CalendarSummary.tsx
│   │   │   ├── KPIOverview.tsx
│   │   │   ├── LaunchPlannerKPIs.tsx
│   │   │   ├── ActivityCard.tsx
│   │   │   ├── ActivityEditModal.tsx
│   │   │   ├── TimelineRow.tsx
│   │   │   └── PerspectiveSwitcher.tsx
│   │   │
│   │   ├── jornada/             # (3) Analise de jornada
│   │   │   ├── PerformanceEvolutionChart.tsx
│   │   │   ├── DailyDetailsModal.tsx
│   │   │   └── BottleneckAnalysis.tsx
│   │   │
│   │   ├── diary/               # (4) Diario e experimentos
│   │   │   ├── DiaryView.tsx
│   │   │   ├── ExperimentsView.tsx
│   │   │   ├── MultiSelectChips.tsx
│   │   │   └── SignificanceCalculator.tsx
│   │   │
│   │   ├── analise/             # (6) Analytics avancados
│   │   │   ├── MediaCorrelationCharts.tsx
│   │   │   ├── MediaKPIGrid.tsx
│   │   │   ├── EfficiencyHeatmap.tsx
│   │   │   ├── DualAxisTimeline.tsx
│   │   │   ├── ScatterRegression.tsx
│   │   │   └── CorrelationBadge.tsx
│   │   │
│   │   ├── originacao/          # (15) B2C + Orchestrator
│   │   │   ├── orchestrator/    # (6) Orquestrador de funil
│   │   │   │   ├── FunnelOrchestrator.tsx
│   │   │   │   ├── FunnelLayers.tsx
│   │   │   │   ├── InfluenceMatrix.tsx
│   │   │   │   ├── ActionLevers.tsx
│   │   │   │   ├── OrchestratorFilters.tsx
│   │   │   │   └── ResultEstimates.tsx
│   │   │   ├── OriginacaoCharts.tsx
│   │   │   ├── OriginacaoTable.tsx
│   │   │   ├── OriginacaoKPIs.tsx
│   │   │   └── ...
│   │   │
│   │   ├── admin/               # (2) Gestao de dados
│   │   │   ├── DataMigration.tsx
│   │   │   └── GoalsManager.tsx
│   │   │
│   │   ├── orientador/          # (2) Recomendacoes
│   │   │   ├── RecommendationCard.tsx
│   │   │   └── HistoricoModal.tsx
│   │   │
│   │   ├── paid-media/          # (3) Midia paga
│   │   ├── resultados/          # (1) Projecoes
│   │   │   └── ProjectionsSection.tsx
│   │   │
│   │   ├── layout/              # (5) Layout e navegacao
│   │   │   ├── MainLayout.tsx
│   │   │   ├── GlobalHeader.tsx
│   │   │   ├── NavDropdown.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── PageTransition.tsx
│   │   │
│   │   ├── ui/                  # (1) Utilitarios
│   │   │   └── LoadingSkeleton.tsx
│   │   │
│   │   └── [40+ root components]
│   │       ├── Calendar.tsx
│   │       ├── DayCell.tsx
│   │       ├── CSVUpload.tsx
│   │       ├── ResultadosView.tsx
│   │       ├── JornadaDisparosView.tsx
│   │       ├── FrameworkView.tsx
│   │       ├── OrientadorView.tsx
│   │       ├── OriginacaoB2CView.tsx
│   │       ├── ConfiguracoesView.tsx
│   │       ├── DiarioBordo.tsx
│   │       └── ...
│   │
│   ├── hooks/                   # 20+ Custom hooks
│   │   ├── useFrameworkData.ts
│   │   ├── useCalendarFilter.ts
│   │   ├── useAdvancedFilters.ts
│   │   ├── useActivities.ts
│   │   ├── useRecommendationEngine.ts
│   │   ├── useMediaCorrelation.ts
│   │   ├── useB2CAnalysis.ts
│   │   ├── useGoals.ts
│   │   ├── useVersionManager.ts
│   │   ├── useStrategyMetrics.ts
│   │   ├── useNotes.ts
│   │   ├── useNotesWithTags.ts
│   │   ├── useCSVParser.ts
│   │   ├── useFieldProjection.ts
│   │   └── ...
│   │
│   ├── services/                # 13 Services
│   │   ├── activityService.ts
│   │   ├── dataService.ts
│   │   ├── storageService.ts
│   │   ├── versionService.ts
│   │   ├── supabaseClient.ts
│   │   └── ml/                  # ML Pipeline
│   │       ├── AIOrchestrator.ts
│   │       ├── predictionEngine.ts
│   │       ├── similarityEngine.ts
│   │       ├── causalAnalyzer.ts
│   │       ├── explanationGenerator.ts
│   │       ├── dataProcessor.ts
│   │       └── types.ts
│   │
│   ├── store/                   # 3 Zustand stores
│   │   ├── useAppStore.ts
│   │   ├── useMetaStore.ts
│   │   └── diaryStore.ts
│   │
│   ├── types/                   # 6 Type definitions
│   │   ├── framework.ts
│   │   ├── activity.ts
│   │   ├── b2c.ts
│   │   ├── recommendations.ts
│   │   ├── strategy.ts
│   │   └── paid-media.ts
│   │
│   ├── schemas/                 # 3 Zod schemas
│   │   ├── frameworkSchema.ts
│   │   ├── ActivityFormSchema.ts
│   │   └── paid-media.ts
│   │
│   ├── context/                 # React contexts
│   ├── utils/                   # Utility functions
│   ├── workers/                 # Web Workers
│   └── config/                  # Configuration
│
├── docs/                        # Documentation (Diátaxis — ver DOCS_GOVERNANCE.md)
│   ├── tutorials/
│   ├── how-to/
│   ├── reference/
│   │   └── tabs/
│   ├── explanation/
│   ├── plans/
│   ├── specs/
│   └── legacy/
│
└── public/                      # Static assets
```

---

## DATA LAYER

### Custom Hooks (20+)

| Hook | Proposito | Componentes que Usam |
|------|-----------|---------------------|
| `useFrameworkData` | Parse CSV, sync Supabase, cache | Calendar, FrameworkView |
| `useCalendarFilter` | Filtro por BU, contadores | Calendar, LaunchPlanner |
| `useAdvancedFilters` | Filtros multi-dimensionais | FilterSidebar, Analytics |
| `useActivities` | CRUD de atividades GaaS | ProgramarDisparoModal |
| `useRecommendationEngine` | Score e rank campanhas | OrientadorView |
| `useMediaCorrelation` | Correlacao spend-to-card | PaidMediaAfinzApp |
| `useB2CAnalysis` | Comparacao CRM vs B2C | OriginacaoB2CView |
| `useGoals` | Get/save metas mensais | GoalsManager, ResultadosView |
| `useVersionManager` | Controle de versoes CSV | ConfiguracoesView |
| `useStrategyMetrics` | Performance por segmento | Strategy dashboards |
| `useFieldProjection` | Projecoes AI por campo | DispatchModal |

### Zustand Stores (3)

**useAppStore** - Estado global principal
```typescript
{
  frameworkData: FrameworkRow[]
  activities: Activity[]
  goals: Goal[]
  journal: JournalEntry[]
  viewSettings: {
    periodo: { inicio, fim }
    abaAtual: TabType
    filtrosGlobais: FilterState
    modoTempoJornada: 'diario' | 'semanal'
    perspective: 'total' | 'crm' | 'b2c'
  }
  b2cData: B2CDataRow[]
  paidMediaData: DailyAdMetrics[]
}
```

**useMetaStore** - Metas mensais
```typescript
{
  metas: MetaMensal[] // Cartoes, Pedidos, CAC por mes/BU
}
```

**diaryStore** - Diario e experimentos
```typescript
{
  entries: DiaryEntry[] // Anotacoes, experimentos A/B
}
```

### Services (13)

| Service | Funcao |
|---------|--------|
| `activityService` | CRUD activities no Supabase, sync framework |
| `dataService` | Fetch/map dados (activities, b2c, paid_media, goals) |
| `storageService` | Upload/download arquivos no storage |
| `versionService` | Versionamento de framework CSV |
| **ML Services:** | |
| `AIOrchestrator` | Orquestra pipeline completo de ML |
| `predictionEngine` | Prediz KPIs futuros |
| `similarityEngine` | Encontra campanhas similares |
| `causalAnalyzer` | Analisa fatores causais |
| `explanationGenerator` | Gera explicacoes em linguagem natural |
| `dataProcessor` | Pre-processa dados para ML |

---

## KEY CONCEPTS

### 1. Activity Name (Taxonomia Salesforce)
The root data unit. Each row in the Framework represents a unique campaign dispatch identified by its Activity Name.

**Example:**
```
afz_aqs_boa_reg_cart_email_rfvchurn1_diario
afz_aqs_boa_reg_cart_sms_ordem2_padrao
afz_aqs_boa_reg_cart_wpp_leads_vibe
```

### 2. Business Units (BUs)
- **B2C:** Blue (#3B82F6)
- **B2B2C:** Green (#10B981)
- **Plurix:** Purple (#A855F7)

### 3. Core KPIs (14 Metrics)

**Volume:**
- Base Enviada, Base Entregue

**Taxas de Funil:**
- Taxa de Entrega, Taxa de Abertura, Taxa de Clique
- Taxa de Proposta, Taxa de Aprovacao
- Taxa de Finalizacao, Taxa de Conversao

**Resultados:**
- Propostas, Aprovados, Emissoes/Cartoes

**Financeiros:**
- CAC (Customer Acquisition Cost)
- Custo Total Campanha

### 4. Activity Status
- `Rascunho` - Draft, em planejamento
- `Scheduled` - Agendado para disparo
- `Enviado` - Disparo realizado
- `Realizado` - Resultados registrados

### 5. Dispatch Modal Blocks
O modal de agendamento usa arquitetura de blocos:
1. **IdentificationBlock** - BU, Campanha, Jornada, Canal
2. **ScheduleBlock** - Datas, horario, frequencia
3. **ProductOfferBlock** - Ofertas, promocionais, produto
4. **InvestmentBlock** - Volume, custos, investimento
5. **AIProjectionBlock** - Projecoes e recomendacoes AI

---

## DATA MODEL

### Required CSV Columns (Framework)
| Framework Column | App Usage | Required |
|-----------------|-----------|----------|
| Activity name / Taxonomia | Unique ID | Yes |
| Data de Disparo | Day grouping | Yes |
| Canal | Email, SMS, WhatsApp, Push | Yes |
| BU | B2C, B2B2C, Plurix | Yes |
| Segmento | Campaign segment | Yes |
| Jornada | Customer journey | No |
| Oferta | Offer type | No |
| Taxa de Entrega - Taxa de Conversao | Funnel KPIs | No |
| Cartoes Gerados | Cards issued | No |
| CAC | Acquisition cost | No |
| Custo Total Campanha | Total cost | No |

### Supabase Tables

| Table | Proposito |
|-------|-----------|
| `activities` | Atividades do framework + GaaS |
| `b2c_daily_metrics` | Metricas diarias B2C |
| `paid_media_metrics` | Metricas de midia paga |
| `goals` | Metas mensais |
| `framework_versions` | Versoes de CSV com storage |

---

## FEATURES

### Implemented Features

**MVP (Phase 1):**
- CSV upload with validation (Latin-1 encoding)
- Calendar grid visualization (monthly view)
- Month navigation (prev/next)
- BU filtering (real-time, multi-select)
- Hover cards with KPIs per activity
- Dark mode interface
- Activity counter per day
- Color coding by dominant BU

**Enhanced (Current):**
- Supabase backend integration
- Multiple analysis views (temporal, correlation, efficiency)
- Admin panel (goals management, data migration)
- Diary/experiment tracking with A/B test support
- Advanced analytics (scatter plots, heatmaps, dual-axis charts)
- Media correlation analysis
- Channel comparison charts
- Drag-and-drop data upload
- **AI-powered dispatch scheduling** with field projections
- **Recommendation engine** based on historical performance
- **Funnel Orchestrator** for B2C optimization
- **Version control** for framework data
- **Smart form inputs** with history-based suggestions

### Future Roadmap (Phase 2+)
- Google Sheets API integration
- PNG/PDF export
- Real-time auto-refresh
- Light/dark mode toggle
- Side-by-side comparison
- Filter presets
- Mobile optimization

---

## COMMON DEVELOPMENT TASKS

### Running the Application
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run deploy       # Deploy to GitHub Pages
```

### How-To Guides
- [Adicionar uma nova aba/view](docs/how-to/adicionar-nova-aba.md)
- [Adicionar um novo hook](docs/how-to/adicionar-novo-hook.md)
- [Trabalhar com o Modal de Disparo](docs/how-to/trabalhar-com-modal-disparo.md)
- [Adicionar uma feature de ML](docs/how-to/adicionar-feature-ml.md)

---

## CODING CONVENTIONS

### TypeScript
- Use strict mode (no `any` types)
- Define interfaces for all data structures
- Use type guards for runtime validation
- Prefer `interface` over `type` for object shapes

### React
- Use functional components with hooks
- Custom hooks for reusable logic (`use*` prefix)
- Memoize expensive computations with `useMemo`
- Handle side effects in `useEffect`
- Use React Context for cross-cutting concerns

### Styling
- Tailwind utility classes (dark mode: `dark:*`)
- Consistent color palette (slate for backgrounds, colored accents)
- Mobile-first approach (responsive utilities)
- Component-level CSS only when necessary

### File Naming
- Components: PascalCase (e.g., `Calendar.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useFrameworkData.ts`)
- Services: camelCase with `Service` suffix (e.g., `activityService.ts`)
- Utils: camelCase (e.g., `formatters.ts`)
- Types: PascalCase (e.g., `framework.ts`)

---

## KEY FILES TO KNOW

### Core Application
- **`src/App.tsx`** - Main application, routing, layout
- **`src/config/navigation.ts`** - Tab/navigation configuration

### Views (10 Main)
- **`src/components/launch-planner/LaunchPlanner.tsx`** - Launch tab
- **`src/components/JornadaDisparosView.tsx`** - Jornada tab
- **`src/components/ResultadosView.tsx`** - Resultados tab
- **`src/components/RelatorioView.tsx`** - Relatorio tab
- **`src/components/OrientadorView.tsx`** - Orientador tab
- **`src/components/OriginacaoB2CView.tsx`** - Originacao tab
- **`src/components/explorer/DisparoExplorer.tsx`** - Explorador Avancado tab
- **`src/components/DiarioBordo.tsx`** - Diario tab
- **`src/components/ConfiguracoesView.tsx`** - Configuracoes tab
- **`src/paid-media/PaidMediaAfinzApp.tsx`** - Media Analytics

### Dispatch System
- **`src/components/dispatch/ProgramarDisparoModal.tsx`** - Main modal
- **`src/components/dispatch/blocks/`** - Form blocks
- **`src/components/dispatch/ai/`** - AI projection components
- **`src/components/dispatch/context/DispatchFormContext.tsx`** - Form state

### Data Layer
- **`src/hooks/useFrameworkData.ts`** - CSV parsing and sync
- **`src/services/activityService.ts`** - Activity CRUD
- **`src/services/dataService.ts`** - Data mapping
- **`src/services/ml/AIOrchestrator.ts`** - ML pipeline
- **`src/store/useAppStore.ts`** - Global state

### Configuration
- **`tailwind.config.js`** - Tailwind customization
- **`vite.config.ts`** - Vite build configuration
- **`tsconfig.json`** - TypeScript compiler options

---

## DEBUGGING TIPS

### CSV Upload Issues
- Check encoding: Must be Latin-1 or UTF-8
- Verify column names match expected schema
- Look for validation errors in console
- Test with sample data from documentation

### Calendar Not Rendering
- Verify date format: DD/MM/YYYY
- Check if activities array is populated
- Inspect month/year state values
- Review browser console for errors

### Dispatch Modal Issues
- Check DispatchFormContext is provided
- Verify Supabase connection for history data
- Check SmartSelect options loading
- Review AI projection service responses

### Performance Issues
- Profile with React DevTools
- Check for unnecessary re-renders
- Verify memoization in hooks
- Consider Web Workers for heavy processing

### Supabase Issues
- Verify `.env` file exists with correct keys
- Check Supabase project is active
- Review network tab in DevTools
- Check RLS policies if data not loading

---

## ENVIRONMENT & SECRETS

### Supabase Configuration
Required environment variables (create `.env` file):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### GitHub Pages Deployment
- Homepage URL configured in `package.json`
- Deploy script: `npm run deploy`
- Uses `gh-pages` branch for hosting

---

## DOCUMENTATION FILES

Estrutura organizada pelo framework [Diátaxis](https://diataxis.fr/) — ver `docs/DOCS_GOVERNANCE.md` para a regra completa de organização e a divisão de papéis entre este `docs/` e o vault Obsidian (`08-Engenharia/`).

### Tutorials (aprender fazendo)
- **`docs/tutorials/quick-start.md`** - Quick start

### How-To Guides (resolver uma tarefa específica)
- **`docs/how-to/adicionar-nova-aba.md`**
- **`docs/how-to/adicionar-novo-hook.md`**
- **`docs/how-to/trabalhar-com-modal-disparo.md`**
- **`docs/how-to/adicionar-feature-ml.md`**
- **`docs/how-to/testar-validacao-projecao.md`**

### Reference (fatos técnicos, consulta rápida)
- **`docs/reference/stack.md`** - Stack tecnológico
- **`docs/reference/supabase-schema.md`** - Database schema
- **`docs/reference/ml-services.md`** - ML pipeline documentation
- **`docs/reference/hooks.md`** - Custom hooks reference
- **`docs/reference/services.md`** - Services reference
- **`docs/reference/tabs/TAB_*.md`** - Documentação por aba: Launch, Jornada, Resultados (⚠️ ver nota de nav abaixo), Orientador, Originação B2C, Framework/Campanhas, Diário, Configurações, Media Analytics, **Relatório**, **Explorador Avançado**, **Experimentos**, **Comunicações** (os 4 últimos preenchidos em 2026-07-05 — ver `docs/DOCS_GOVERNANCE.md` para o histórico do gap)

### Explanation (o porquê, decisões, arquitetura)
- **`docs/explanation/system-overview.md`** - Visão geral do sistema
- **`docs/explanation/arquitetura-visual.md`** - Diagramas visuais
- **`docs/explanation/validacao-projecao-progressiva.md`** - Sistema de validação/projeção
- **`docs/explanation/atualizador-inteligente-gaas.md`** - Atualizador inteligente
- **`docs/explanation/filter-chain-orchestrator.md`** - Orquestrador de filtros (stub)

### Plans & Specs (trabalho em andamento, fora de Diátaxis)
- **`docs/plans/`** - Specs de features em desenvolvimento
- **`docs/specs/`** - Specs de fixes pontuais

### Legacy
- **`docs/legacy/`** - Archived MVP documentation

---

## DESIGN SYSTEM

### Color Palette
```
BUs:
├── B2C: #3B82F6 (blue-500)
├── B2B2C: #10B981 (emerald-500)
└── Plurix: #A855F7 (purple-500)

Interface:
├── Background: #0F172A (slate-950)
├── Text: #E2E8F0 (slate-100)
├── Accent: #F59E0B (amber-500)
└── Borders: slate-700/800

Status:
├── Success: #22C55E (green-500)
├── Warning: #F59E0B (amber-500)
├── Error: #EF4444 (red-500)
└── Info: #3B82F6 (blue-500)
```

### Typography
- **Headings:** text-2xl/3xl font-bold
- **Body:** text-sm/base
- **Numbers:** text-lg/2xl font-semibold (for metrics)
- **Font:** System font stack (Tailwind default)

### Spacing
- **Container:** max-w-7xl mx-auto px-4
- **Cards:** p-4/6 rounded-lg
- **Grid gaps:** gap-2/4
- **Sidebar width:** w-64

---

## KNOWN LIMITATIONS

- Desktop-first (not optimized for mobile)
- No Google Sheets API (CSV upload only)
- No PNG/PDF export
- No side-by-side comparison
- Dark mode only (no toggle)
- No filter presets persistence
- Limited to displayed month in some views

---

## PERFORMANCE METRICS

- **Components:** 130+
- **Hooks:** 20+
- **Services:** 13
- **Bundle Size:** ~300KB (gzipped)
- **Build Time:** ~8 seconds
- **Load Time:** < 2s for 500+ activities

---

## CONTRIBUTING WORKFLOW

When working with Claude Code on this project:

1. **Context First:** Read relevant files before making changes
2. **Plan Complex Changes:** Use TodoWrite tool for multi-step tasks
3. **Type Safety:** Maintain strict TypeScript typing
4. **Test Changes:** Run `npm run dev` and verify in browser
5. **Documentation:** Update docs when adding major features
6. **Git Commits:** Use descriptive commit messages with Co-Authored-By tag

---

## TROUBLESHOOTING

### Issue: TypeScript errors after adding dependencies
```bash
npm install
npm run build  # Check for type errors
```

### Issue: Tailwind styles not applying
- Ensure Tailwind config includes all template paths
- Check tailwind.config.js content array

### Issue: CSV parsing fails
- Verify file encoding (Latin-1 or UTF-8)
- Check column names against schema
- Review error messages in upload component

### Issue: Supabase connection fails
- Verify `.env` file exists with correct keys
- Check Supabase project is active
- Review network tab in DevTools

### Issue: AI projections not loading
- Check ML services are properly imported
- Verify historical data exists in Supabase
- Review AIOrchestrator logs

---

**Last Updated:** 2026-02-02
**Status:** Active Development
**Current Phase:** Enhanced Analytics (Post-MVP)
**Components:** 130+ | **Hooks:** 20+ | **Services:** 13
