# TAB: Launch Planner

**Rota:** `/launch`
**Componente Principal:** `LaunchPlanner.tsx`
**Categoria:** PLANEJAMENTO

---

## Overview

O Launch Planner e a interface principal para agendamento e planejamento de campanhas de marketing. Oferece um calendario interativo onde os operadores podem visualizar, criar e editar disparos programados, com suporte a projecoes AI e sugestoes baseadas em historico.

---

## Features

- Calendario interativo com visualizacao de atividades por dia
- Modal inteligente de agendamento com 5 blocos de formulario
- Projecoes AI para campos baseadas em campanhas similares
- Sugestoes de preenchimento baseadas em historico
- KPIs em tempo real do periodo selecionado
- Filtros por Segmento, Jornada e BU
- Alternancia de perspectiva (Segmento/Jornada/BU)
- Status de atividades (Rascunho, Scheduled, Enviado, Realizado)

---

## Arquitetura de Componentes

```
LaunchPlanner.tsx
├── DashboardLayout.tsx
│   ├── CalendarSummary.tsx
│   │   └── Calendar.tsx
│   │       └── DayCell.tsx
│   │           └── ActivityCard.tsx
│   ├── LaunchPlannerKPIs.tsx
│   │   └── KPIOverview.tsx
│   └── PerspectiveSwitcher.tsx
│
├── ProgramarDisparoModal.tsx (Modal principal)
│   ├── DispatchFormContext
│   ├── IdentificationBlock.tsx
│   ├── ScheduleBlock.tsx
│   ├── ProductOfferBlock.tsx
│   ├── InvestmentBlock.tsx
│   └── AIProjectionBlock.tsx
│       ├── FieldProjectionTooltip.tsx
│       ├── SimilarCampaignsList.tsx
│       ├── CausalFactorsList.tsx
│       └── ConfidenceBar.tsx
│
├── DailyDetailsModal.tsx
├── ActivityEditModal.tsx
└── TimelineRow.tsx
```

---

## Componentes Principais

### LaunchPlanner.tsx
Orquestra toda a view, gerencia estado de modais e integracao com stores.

**Responsabilidades:**
- Renderizar layout principal
- Gerenciar abertura/fechamento de modais
- Integrar com useAppStore para dados
- Coordenar filtros e perspectivas

### DashboardLayout.tsx
Layout em grid com calendario a esquerda e KPIs a direita.

### CalendarSummary.tsx
Wrapper do calendario com resumo de atividades do periodo.

### LaunchPlannerKPIs.tsx
Exibe KPIs agregados do periodo selecionado:
- Total de Disparos
- Cartoes Projetados
- CAC Medio
- Investimento Total

### ProgramarDisparoModal.tsx
Modal principal para criar/editar atividades. Usa arquitetura de blocos.

---

## Sistema de Dispatch Modal (5 Blocos)

### 1. IdentificationBlock

Campos de identificacao da campanha:

| Campo | Tipo | Fonte |
|-------|------|-------|
| BU | Select | Fixo (B2C, B2B2C, Plurix) |
| Campanha/Segmento | Combobox | Historico |
| Activity Name | Input | Auto-gerado |
| Jornada | Combobox | Filtrado por BU |
| Canal | Combobox | CANAIS enum + historico |
| Parceiro | Combobox | Historico |
| Subgrupo | Combobox | Historico |

### 2. ScheduleBlock

Configuracao temporal do disparo:

| Campo | Tipo | Validacao |
|-------|------|-----------|
| Data Inicio | Date | >= hoje |
| Data Fim | Date | >= Data Inicio |
| Horario | Time | HH:MM |
| Frequencia | Select | Unico, Diario, Semanal |

### 3. ProductOfferBlock

Definicao de oferta e produto:

| Campo | Tipo | Obrigatorio |
|-------|------|-------------|
| Oferta | Combobox | Sim* |
| Oferta 2 | Combobox | Nao |
| Promocional | Combobox | Sim* |
| Promo 2 | Combobox | Nao |
| Produto | Combobox | Nao |
| Perfil Credito | Combobox | Nao |
| Etapa Aquisicao | Combobox | Nao |

*Pelo menos Oferta OU Promocional e obrigatorio

### 4. InvestmentBlock

Calculo de investimento:

| Campo | Tipo | Calculo |
|-------|------|---------|
| Volume | Number | Input manual |
| C.U. Canal | Number | Auto por canal |
| C.U. Oferta | Number | Input manual |
| Total Campanha | Number | Volume * (CU Canal + CU Oferta) |

**Custos por Canal:**
- E-mail: R$ 0,001
- Push: R$ 0,001
- SMS: R$ 0,064
- WhatsApp: R$ 0,420

### 5. AIProjectionBlock

Projecoes inteligentes baseadas em ML:

**Componentes:**
- `FieldProjectionTooltip` - Tooltips com projecoes por campo
- `SimilarCampaignsList` - Lista de campanhas similares encontradas
- `CausalFactorsList` - Fatores causais identificados
- `ConfidenceBar` - Indicador de confianca da projecao

**Metricas Projetadas:**
- Taxa de Entrega esperada
- Taxa de Abertura esperada
- Taxa de Conversao esperada
- CAC projetado
- Cartoes estimados

---

## Fluxo de Dados

```
User abre modal "Programar Disparo"
         │
         ▼
DispatchFormContext inicializa
         │
         ▼
useActivities busca historico do Supabase
         │
         ▼
SmartSelect/SmartInput populam opcoes
         │
         ▼
User preenche campos
         │
         ▼
useFieldProjection busca projecoes AI
         │
         ▼
AIOrchestrator calcula:
├─ Campanhas similares
├─ Predicoes de KPIs
└─ Fatores causais
         │
         ▼
User confirma
         │
         ▼
activityService.saveActivity()
         │
         ▼
Supabase salva com status 'Rascunho' ou 'Scheduled'
         │
         ▼
useAppStore atualiza state local
```

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useActivities` | CRUD de atividades |
| `useFrameworkData` | Dados do calendario |
| `useCalendarFilter` | Filtros aplicados |
| `useFieldProjection` | Projecoes AI |
| `useFrameworkOptions` | Opcoes para dropdowns |

---

## Casos de Uso

### 1. Criar Novo Disparo
1. Clicar em dia no calendario ou botao "Programar Disparo"
2. Preencher campos de identificacao
3. Definir datas e horario
4. Selecionar ofertas
5. Informar volume e verificar custo
6. Revisar projecoes AI
7. Salvar como Rascunho ou Agendar

### 2. Editar Disparo Existente
1. Clicar em atividade no calendario
2. Modal abre com dados preenchidos
3. Editar campos desejados
4. Salvar alteracoes

### 3. Visualizar Detalhes do Dia
1. Clicar em dia com atividades
2. DailyDetailsModal mostra lista
3. Clicar em atividade para editar

### 4. Alternar Perspectiva
1. Usar PerspectiveSwitcher
2. Alternar entre Segmento/Jornada/BU
3. Calendario reagrupa atividades

---

## Integracao com ML

O Launch Planner integra com o pipeline de ML para projecoes:

```
DispatchFormContext.values
         │
         ▼
useFieldProjection(field, context)
         │
         ▼
AIOrchestrator.getFieldProjection()
├─ dataProcessor.prepare()
├─ similarityEngine.findSimilar()
├─ predictionEngine.predict()
├─ causalAnalyzer.analyze()
└─ explanationGenerator.explain()
         │
         ▼
FieldProjectionTooltip renderiza resultado
```

---

## Validacoes (Zod Schema)

```typescript
ActivityFormSchema = z.object({
  bu: z.enum(['B2C', 'B2B2C', 'Plurix', 'Bem Barato']),
  segmento: z.string().min(1),
  jornada: z.string().min(1),
  activityName: z.string().min(1),
  dataInicio: z.string(), // >= hoje
  dataFim: z.string(),    // >= dataInicio
  horarioDisparo: z.string().regex(/^\d{2}:\d{2}$/),
  canal: z.enum(['E-mail', 'Push', 'SMS', 'WhatsApp']),
  status: z.enum(['Rascunho', 'Scheduled', 'Enviado', 'Realizado']),
  // ... demais campos opcionais
}).refine(data => data.oferta || data.promocional, {
  message: "Oferta ou Promocional obrigatorio"
})
```

---

## Arquivos Relacionados

- `src/components/launch-planner/LaunchPlanner.tsx`
- `src/components/launch-planner/DashboardLayout.tsx`
- `src/components/dispatch/ProgramarDisparoModal.tsx`
- `src/components/dispatch/blocks/*.tsx`
- `src/components/dispatch/ai/*.tsx`
- `src/hooks/useActivities.ts`
- `src/hooks/useFieldProjection.ts`
- `src/schemas/ActivityFormSchema.ts`

---

**Ultima Atualizacao:** 2026-02-02
