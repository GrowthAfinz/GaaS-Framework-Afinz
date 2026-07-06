# TAB: Resultados

**Rota:** `/resultados`
**Componente Principal:** `ResultadosView.tsx`
**Categoria:** ANALISE

---

## Overview

A aba Resultados apresenta uma visao consolidada das metricas de performance, progresso em relacao as metas e projecoes para o periodo. E o dashboard executivo para acompanhamento de KPIs.

---

## Features

- Visualizacao de metas vs realizado
- Projecoes de fechamento do mes
- Distribuicao de atividades por atributos
- Graficos de evolucao temporal
- Comparacao com periodos anteriores
- Cards de KPIs principais
- Modal de definicao de metas

---

## Arquitetura de Componentes

```
ResultadosView.tsx
├── PeriodSelector
├── BUSelector
│
├── GoalsVisualization.tsx
│   ├── ProgressBars (meta vs realizado)
│   └── GoalsModal.tsx (edicao de metas)
│
├── ProjectionsSection.tsx
│   ├── ProjecaoCartoes
│   ├── ProjecaoCAC
│   └── TendenciaChart
│
├── DistributionAnalysis.tsx
│   ├── PieChart por Canal
│   ├── PieChart por BU
│   └── PieChart por Segmento
│
└── KPICards
    ├── TotalCartoes
    ├── TotalPropostas
    ├── CACMedio
    └── CustoTotal
```

---

## Componentes Principais

### ResultadosView.tsx
Componente principal que consolida todas as metricas e visualizacoes.

**Responsabilidades:**
- Agregar dados por periodo
- Calcular projecoes
- Exibir comparativos
- Gerenciar modal de metas

### GoalsVisualization.tsx
Mostra progresso em relacao as metas definidas.

**Metricas com Metas:**
- Cartoes Gerados (meta mensal)
- Pedidos/Aprovacoes (meta mensal)
- CAC Maximo (limite superior)

**Visualizacao:**
- Barra de progresso colorida
- Percentual de atingimento
- Projecao de fechamento

### ProjectionsSection.tsx
Calcula e exibe projecoes baseadas em dados historicos.

**Projecoes Calculadas:**
```
Dias Restantes = Ultimo dia do mes - Hoje
Media Diaria = Total Atual / Dias Decorridos
Projecao = Total Atual + (Media Diaria * Dias Restantes)
```

**Cenarios:**
- Otimista: +20% sobre media
- Realista: Media atual
- Pessimista: -20% sobre media

### DistributionAnalysis.tsx
Graficos de distribuicao de atividades.

**Dimensoes Analisadas:**
- Por Canal (Email, SMS, WhatsApp, Push)
- Por BU (B2C, B2B2C, Plurix)
- Por Segmento
- Por Oferta

### GoalsModal.tsx
Modal para definicao de metas mensais.

**Campos:**
- Mes de referencia
- BU
- Meta de Cartoes
- Meta de Pedidos
- CAC Maximo permitido

---

## Fluxo de Dados

```
useAppStore.activities + useMetaStore.metas
         │
         ▼
useResultadosMetrics()
├─ Agrega por periodo selecionado
├─ Calcula totais e medias
├─ Compara com metas
└─ Gera projecoes
         │
         ▼
ResultadosView distribui dados para:
├─ GoalsVisualization (metas vs realizado)
├─ ProjectionsSection (projecoes)
├─ DistributionAnalysis (distribuicoes)
└─ KPICards (numeros principais)
         │
         ▼
User edita metas
         │
         ▼
GoalsModal -> useGoals.setGoal()
         │
         ▼
useMetaStore persiste + Supabase sync
```

---

## Hooks Utilizados

| Hook | Funcao |
|------|--------|
| `useFrameworkData` | Dados de atividades |
| `useGoals` | Metas mensais |
| `useResultadosMetrics` | Calculos agregados |
| `useMonthComparison` | Comparacao entre meses |

---

## Casos de Uso

### 1. Verificar Progresso do Mes
1. Acessar aba Resultados
2. Verificar barras de progresso
3. Comparar realizado vs meta
4. Avaliar projecao de fechamento

### 2. Definir Metas Mensais
1. Clicar em "Editar Metas"
2. Selecionar mes e BU
3. Informar metas de Cartoes, Pedidos, CAC
4. Salvar

### 3. Analisar Distribuicao
1. Visualizar graficos de pizza
2. Identificar canais/BUs com maior volume
3. Detectar desbalanceamentos
4. Planejar ajustes

### 4. Comparar Periodos
1. Selecionar periodo atual
2. Anotar metricas
3. Alterar para periodo anterior
4. Comparar evolucao

---

## Metricas Calculadas

### KPIs Principais
```typescript
{
  totalCartoes: sum(activity.kpis.cartoes),
  totalPropostas: sum(activity.kpis.propostas),
  totalAprovados: sum(activity.kpis.aprovados),
  cacMedio: totalCusto / totalCartoes,
  custoTotal: sum(activity.kpis.custoTotal),
  taxaConversaoMedia: avg(activity.kpis.taxaConversao)
}
```

### Atingimento de Metas
```typescript
{
  cartoesAtingimento: (totalCartoes / meta.cartoes_meta) * 100,
  pedidosAtingimento: (totalAprovados / meta.pedidos_meta) * 100,
  cacStatus: cacMedio <= meta.cac_max ? 'OK' : 'Acima'
}
```

### Projecoes
```typescript
{
  diasDecorridos: diasDesdeInicioMes,
  diasRestantes: diasAteFimMes,
  mediadiaria: totalCartoes / diasDecorridos,
  projecaoCartoes: totalCartoes + (mediaDiaria * diasRestantes),
  projecaoCAC: (custoProjetado / cartoesProjetados)
}
```

---

## Configuracao de Metas

As metas sao armazenadas em `useMetaStore`:

```typescript
interface MetaMensal {
  id: string;           // "2026-02-B2C"
  mes: string;          // "2026-02"
  bu: BU;
  cartoes_meta: number;
  pedidos_meta: number;
  cac_max: number;
  created_at: string;
  updated_at: string;
}
```

**Persistencia:**
- Local: localStorage (`growth-brain-metas`)
- Remoto: Supabase tabela `goals`

---

## Indicadores Visuais

### Cores de Status
```
Verde (#22C55E): >= 100% da meta
Amarelo (#F59E0B): 70-99% da meta
Vermelho (#EF4444): < 70% da meta
```

### Tendencias
```
Seta para cima: Crescimento vs periodo anterior
Seta para baixo: Queda vs periodo anterior
Igual: Variacao < 5%
```

---

## Arquivos Relacionados

- `src/components/ResultadosView.tsx`
- `src/components/resultados/ProjectionsSection.tsx`
- `src/components/GoalsVisualization.tsx`
- `src/components/GoalsModal.tsx`
- `src/components/DistributionAnalysis.tsx`
- `src/hooks/useGoals.ts`
- `src/store/useMetaStore.ts`

---

**Ultima Atualizacao:** 2026-02-02
