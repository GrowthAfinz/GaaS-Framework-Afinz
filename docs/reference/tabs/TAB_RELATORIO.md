# TAB: Relatório

**Rota:** `/relatorio`
**Componente Principal:** `RelatorioView.tsx`
**Categoria:** ANALISE

---

## Overview

A aba Relatório é a central de análise de performance por segmento/canal e de exportação de relatórios em XLSX. Tem 4 sub-modos (`reportMode`), acessíveis por abas dentro do cabeçalho teal da tela: **Overview**, **Diário**, **Mensal** e **XLSX Reports**. Consome os mesmos `activities` (Supabase) que as demais abas de análise, mais `dispatch_descriptions` (Supabase) para descrições de disparo.

Testado em produção (2026-07-05) com BU B2C, período 01/02/2026–31/07/2026 (6 meses, via atalho "6M" da própria visão Mensal — ver seção de particularidade abaixo), 1.360 disparos, 6 segmentos, 4 canais.

---

## Features

- **Overview (Performance):** tabelas agregadas (`AggregateTable`) de Performance por Campanhas e por Canais, agrupáveis por qualquer dimensão via `GroupBySelector`.
- **Diário:** evolução diária por segmento/canal (gráficos empilhados), com toggle Diário↔Acumulado e atalhos internos de 7/14/30 dias.
- **Mensal:** evolução mensal por segmento/canal + tabela de resultados mês-a-mês com comparação MoM (`MonthlyResultsTable`), com atalhos internos de 3/6/12 meses.
- **XLSX Reports:** central de 4 exports em Excel (Aquisição CRM Mensal, Aquisição CRM Diarizado, Mídia Paga + CRM Mensal, Rentabilização CRM Diarizado).
- Toggle de frente **Aquisição ↔ Rentabilização**, que muda o conjunto de colunas/métricas padrão exibidas (ex: Rentabilização mostra Aberturas/Cliques em vez de Propostas/Aprovados).
- Customização de colunas (`ColumnsCustomizer`) e de dimensões de detalhamento.
- Filtro de destaque na tabela de detalhamento: "Top Conversores" (top 40% por taxa de conversão), "Conversores" (emissões > 0), "Aguardando Resultado" (disparos D-3, ainda consolidando).
- Busca textual por Activity Name, jornada, segmento, canal, parceiro, descrição.

---

## Arquitetura de Componentes

```
RelatorioView.tsx
├── reportMode: 'performance' | 'daily' | 'monthly' | 'xlsx'
│
├── [Overview]
│   ├── GroupBySelector.tsx
│   ├── ColumnsCustomizer.tsx
│   ├── AggregateTable.tsx (Performance campanhas)
│   ├── AggregateTable.tsx (Performance canais)
│   └── DetailTable.tsx (Detalhamento por disparo)
│
├── [Diário]
│   └── DailyReportView.tsx
│       ├── DailyStackedBarChart.tsx
│       └── toggle Diário/Acumulado
│
├── [Mensal]
│   └── MonthlyReportView.tsx
│       ├── MonthlyStackedBarChart.tsx (por segmento e por canal)
│       └── MonthlyResultsTable.tsx (comparação MoM)
│
└── [XLSX Reports]
    └── 4 botões de export (ExcelJS workbooks)
```

---

## Componentes Principais

### RelatorioView.tsx
Orquestra os 4 sub-modos, filtros globais (BU/segmento/canal/jornada/parceiro), agrupamento, customização de colunas e os exports CSV/XLSX.

### AggregateTable.tsx
Tabela agregada por dimensão (`GROUPABLE_DIMENSIONS`: segmento, canal, bu, jornada, parceiro, subgrupo, oferta, produto, etapaAquisicao, perfilCredito, safraKey). Colunas padrão dependem da frente (Aquisição vs Rentabilização), definidas em `reportColumnsConfig.ts`.

### MonthlyReportView.tsx / MonthlyResultsTable.tsx
Agrega por `monthKey` (`YYYY-MM`, baseado em `dataDisparo`). A tabela de resultados mostra uma linha por mês com badges de variação MoM (verde/vermelho) para cada métrica.

### DailyReportView.tsx
Agrega por dia, com toggle para ver a série diária pura ou acumulada.

### Exports XLSX
Ver tabela na seção "Exports XLSX" abaixo.

---

## Fluxo de Dados

```
activities (Supabase) + dispatch_descriptions (Supabase)
         │
         ▼
Filtros globais: BU, Segmento, Canal, Jornada, Parceiro
+ Período (herdado do header global, PeriodContext)
+ Frente (Aquisição | Rentabilização) — muda colunas default
         │
         ▼
reportMode decide a view:
├─ performance → groupActivitiesByDimension() + computeRow()
├─ daily       → aggregateDailyByDimension() / accumulateDailyDimensionRows()
├─ monthly     → aggregateMonthlyByDimension() / aggregateMonthlyTotals()
└─ xlsx        → workbooks ExcelJS (aquisicaoCrmExcelExport, midiaPagaMonthlyReportExport, rentabilizacaoCrmExcelExport)
```

---

## Particularidade do período na visão Mensal (importante)

O header global (`PeriodContext`) só oferece presets até **90 dias** (`today`, `yesterday`, `thisWeek`, `last7/14/28/30/90`, `thisMonth`, `lastMonth`, `thisYear`, `custom`) — não há preset de 6 ou 12 meses ali.

A visão **Mensal** tem seus próprios atalhos internos **3M / 6M / 12M** ("ATALHO MENSAL"). Testado em produção: clicar em **"6M"** efetivamente **atualiza o período global do header** (confirmado — o pill de período no topo da tela passou a mostrar `01 fev, 2026 - 31 jul, 2026` após o clique, e esse período novo propagou também para outras abas como Explorador Avançado). Ou seja, os atalhos 3M/6M/12M não são apenas um filtro local — eles escrevem no mesmo estado de período compartilhado por todo o app.

**Recomendação de uso:** para obter uma comparação MoM robusta (5+ linhas), use o atalho "6M" (ou "12M") dentro da própria visão Mensal, em vez de tentar montar um período longo pelo seletor do header (que não oferece opção além de 90 dias via preset — só via período customizado no calendário).

Evidência coletada: com "6M" ativo (01/02/2026–31/07/2026), a tabela de resultados mensais mostrou 6 linhas (fev a jul/26) com variação MoM populada em todas as colunas (ex: Base Enviada mar/26 649.893, **-11,9%** vs fev/26).

---

## Exports XLSX

| Botão | Função | Conteúdo |
|---|---|---|
| **Mídia Paga + CRM — Mensal** | `exportMidiaPagaMonthly()` | Frentes, criativo por grupo, Start Trial B2C, CRM e Diarizado |
| **Aquisição CRM — Mensal** | `exportAquisicaoCrmMonthly()` | MoM por BU, segmento, semana e canal |
| **Aquisição CRM — Diarizado** | `exportAquisicaoCrm()` | Por seção/bloco, com auditoria de mapeamento |
| **Rentabilização CRM — Diarizado** | `exportRentabilizacaoCrm()` | Cross-sell, ativação, seguros + auditoria |

O período usado pelos 4 exports é o mesmo período efetivo já ativo na tela (herdado do atalho Mensal ou do header). Testado: os 4 downloads dispararam sem erro visível no console nem `window.alert` de falha, com período de 6 meses ativo.

Exports CSV inline (dentro do Overview): `exportSegmento()`, `exportCanal()`, `exportDetail()`, `exportAll()` — geram `relatorio_segmento_YYYYMMDD.csv`, `relatorio_canal_YYYYMMDD.csv`, `relatorio_disparos_YYYYMMDD.csv` e `relatorio_completo_YYYYMMDD.csv` respectivamente.

---

## Hooks/Services Utilizados

| Hook/Service | Função |
|---|---|
| `useFrameworkData` | Carrega `activities` (CSV/Supabase) |
| `useAppStore().filtrosGlobais` | Segmento, canal, jornada, parceiro |
| `useBU()` | BUs selecionadas |
| `usePeriod()` | Período efetivo (herdado ou setado pelo atalho Mensal) |
| `aggregations.ts` | `computeRow`, `groupActivitiesByDimension` |
| `monthlyAggregation.ts` | `aggregateMonthlyTotals`, `aggregateMonthlyByDimension` |
| `dailyAggregation.ts` | `aggregateDailyTotals`, `aggregateDailyByDimension` |
| `aquisicaoCrmExcelExport.ts`, `midiaPagaMonthlyReportExport.ts`, `rentabilizacaoCrmExcelExport.ts` | Geração dos workbooks XLSX |

---

## Casos de Uso

### 1. Comparar performance por segmento no período
1. Ir para Overview, agrupar por "segmento" via GroupBySelector.
2. Selecionar BU e período realistas (ex: B2C, 90 dias).
3. Ler a tabela AggregateTable e usar Exportar CSV se necessário.

### 2. Acompanhar evolução mensal com MoM
1. Ir para Mensal.
2. Clicar em "6M" (ou "12M") no atalho interno — não usar o seletor de período do header para isso.
3. Ler `MonthlyResultsTable`, observando os badges de variação MoM.

### 3. Gerar relatório executivo em XLSX
1. Ajustar o período desejado (via atalho Mensal ou período customizado).
2. Ir para XLSX Reports.
3. Baixar o relatório relevante (ex: "Aquisição CRM — Mensal" para MoM por BU/segmento/semana/canal).

---

## Gaps/Limitações Conhecidas

- Os atalhos 3M/6M/12M da visão Mensal escrevem no período global compartilhado — usuários podem não perceber que isso também afeta outras abas (Explorador, Jornada & Disparos etc.) até navegarem para lá.
- A tabela `MonthlyResultsTable` é larga (12 métricas de Aquisição) e requer scroll horizontal em viewports estreitos — comportamento aceitável (scrollbar visível), mas vale considerar sticky column para o nome do mês em telas menores.

---

## Arquivos Relacionados

- `src/components/RelatorioView.tsx`
- `src/components/relatorio/AggregateTable.tsx`
- `src/components/relatorio/MonthlyReportView.tsx`
- `src/components/relatorio/MonthlyResultsTable.tsx`
- `src/components/relatorio/DailyReportView.tsx`
- `src/components/relatorio/DetailTable.tsx`
- `src/components/relatorio/reportColumnsConfig.ts`
- `src/services/aquisicaoCrmExcelExport.ts`, `midiaPagaMonthlyReportExport.ts`, `rentabilizacaoCrmExcelExport.ts`

---

**Última Atualização:** 2026-07-05
