# Guia de Implementação: Comparativo Month-over-Month (MoM)

## Visão Geral

Este guia documenta a implementação completa de comparativo **Month-over-Month (MoM)** na aplicação. A funcionalidade permite comparar métricas de um período com o mesmo período no mês anterior.

## Arquivos Criados

### 1. **Tipos de Dados** (`src/types/framework.ts`)
Define as interfaces TypeScript para toda a lógica de MoM:
- `MoMComparison`: Armazena valores atuais, anteriores e diferenças
- `MoMMetrics`: Agrupa comparativas para conversao, cac, entrega e abertura
- `ComparisonData`: Estende dados agregados com métricas de MoM
- `PeriodComparison`: Controla o estado do período e se MoM está ativo

### 2. **Utilitários de Cálculo** (`src/utils/momCalculations.ts`)
Funções puras para processamento de dados MoM:

#### `getPreviousMonthDateRange(startDate, endDate)`
Calcula o range de datas correspondente no mês anterior.
- Lida corretamente com dias que não existem em meses com menos dias
- Exemplo: Jan 31 → Dec 31

#### `aggregateActivitiesForRange(data, startDate, endDate, filters?)`
Agrega atividades dentro de um intervalo de datas com suporte a filtros:
- Filtra por BU, canais, segmentos, parceiros
- Calcula totais de baseEnviada, baseEntregue, propostas, cartões, custo

#### `calculateMoMMetrics(currentData, previousData)`
Calcula as 4 métricas principais com variação MoM:
- **Conversão**: (Cartões / Base Enviada) × 100
- **CAC**: Custo / Cartões
- **Entrega**: (Base Entregue / Base Enviada) × 100
- **Abertura**: (Propostas / Base Entregue) × 100

#### `matchPreviousMonthData(currentData, previousData)`
Faz matching entre períodos pelo dia do mês:
- Jan 15 → Dec 15 (ambos dia 15)
- Garante comparação de períodos equivalentes

### 3. **Hook Customizado** (`src/hooks/useMoMComparison.ts`)
`useMoMComparison()` - Encapsula toda a lógica de MoM:

```typescript
const comparisonData = useMoMComparison({
  data: calendarData,
  periodComparison: { 
    current: { startDate, endDate }, 
    isMoMEnabled: true 
  },
  filters: { canais: ['SMS'], segmentos: ['Premium'] }
});
```

**Retorna**: Array de `ComparisonData` com métricas MoM calculadas

### 4. **Componente: Period Selector** (`src/components/PeriodSelector.tsx`)
Modal para seleção de período com opção de comparativo MoM:

**Features**:
- ✓ Períodos predefinidos (Esta semana, Este mês, Últimos 30 dias, etc.)
- ✓ Seleção customizada de data inicial e final
- ✓ Checkbox para ativar/desativar comparativo MoM
- ✓ Feedback visual quando MoM está ativo

**Uso**:
```typescript
<PeriodSelector
  onPeriodChange={(periodComparison) => setPeriodComparison(periodComparison)}
  initialDate={new Date()}
/>
```

### 5. **Componente: Performance Chart com MoM** (`src/components/PerformanceEvolutionChartWithMoM.tsx`)
Gráfico de evolução temporal com suporte completo a MoM:

**Features**:
- ✓ Integra PeriodSelector automaticamente
- ✓ Exibe duas linhas quando MoM ativo: período atual (azul) + anterior (cinza tracejado)
- ✓ Tooltip customizado mostrando comparativa MoM
- ✓ Métricas de estatísticas: Média, Máx, Mín, Variação MoM
- ✓ Agrupamento por período (Diário/Semanal)
- ✓ Códigos de cores para indicar ganhos/perdas

**Uso**:
```typescript
<PerformanceEvolutionChartWithMoM
  data={calendarData}
  selectedCanais={['SMS']}
  selectedSegmentos={['Premium']}
/>
```

### 6. **Componente: Segment Performance** (`src/components/SegmentPerformanceWithMoM.tsx`)
Tabela de performance por segmento/canal/parceiro com MoM:

**Features**:
- ✓ Comparação de conversão e CAC vs mês anterior
- ✓ Indicador visual de mudança percentual
- ✓ Cores automáticas: verde (ganho), vermelho (perda)
- ✓ Responsivo em dispositivos menores

**Uso**:
```typescript
<SegmentPerformanceWithMoM
  data={calendarData}
  periodComparison={periodComparison}
  segmentKey="canal"
/>
```

## Fluxo de Dados

```
CalendarData (YYYY-MM-DD -> Activity[])
    ↓
useMoMComparison Hook
    ├─→ aggregateActivitiesForRange(current period)
    ├─→ aggregateActivitiesForRange(previous month)
    ├─→ matchPreviousMonthData()
    └─→ calculateMoMMetrics() para cada dia
    ↓
ComparisonData[]
    ├─→ PerformanceEvolutionChartWithMoM
    ├─→ SegmentPerformanceWithMoM
    └─→ Outros componentes que usem MoM
```

## Integração na Aplicação

### Passo 1: Importar Tipos
```typescript
import {
  CalendarData,
  PeriodComparison,
  ComparisonData
} from '../types/framework';
```

### Passo 2: Usar o Hook
```typescript
const [periodComparison, setPeriodComparison] = useState<PeriodComparison>({
  current: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  },
  isMoMEnabled: false
});

const comparisonData = useMoMComparison({
  data,
  periodComparison,
  filters: { canais: selectedCanais }
});
```

### Passo 3: Renderizar Componentes
```typescript
<PeriodSelector onPeriodChange={setPeriodComparison} />
<PerformanceEvolutionChartWithMoM
  data={data}
  selectedCanais={selectedCanais}
  periodComparison={periodComparison}
/>
```

## Exemplos de Cálculo

### Exemplo 1: Conversão MoM
```
Período Atual (jan 15): 100 base enviada, 5 cartões
- Conversão Atual: 5% 

Período Anterior (dez 15): 80 base enviada, 3 cartões
- Conversão Anterior: 3.75%

Variação MoM: 5% - 3.75% = +1.25 ponto percentual
Percentual de Mudança: (5 - 3.75) / 3.75 × 100 = +33.33%
```

### Exemplo 2: CAC MoM
```
Período Atual: R$ 50 gasto, 5 cartões
- CAC Atual: R$ 10

Período Anterior: R$ 60 gasto, 3 cartões
- CAC Anterior: R$ 20

Variação MoM: R$ 10 - R$ 20 = -R$ 10 (50% melhor)
```

## Performance

- **Memoization**: Hook utiliza `useMemo` para evitar recálculos desnecessários
- **Aggregation**: Dados são agregados uma única vez por período
- **Filtering**: Aplicado inline durante agregação
- **Complexity**: O(n) onde n = número de registros no período

## Tratamento de Edge Cases

1. **Período incompleto**: Se mês anterior tem menos dias, usa o último dia disponível
2. **Sem dados no período**: Retorna dados vazios, componentes lidam graciosamente
3. **Divisão por zero**: CAC e taxas retornam 0 quando denominador é 0
4. **Períodos diferentes**: Matching é feito por dia do mês para equivalência

## Customização

### Adicionar Nova Métrica
1. Adicione à enum `MetricType` em `PerformanceEvolutionChartWithMoM`
2. Implemente lógica em `calculateMetricValue()` em `momCalculations.ts`
3. Atualize select de métrica no componente

### Customizar Cores
Edite em `PeriodSelector.tsx`:
```typescript
className="px-2 py-1 bg-blue-100 text-blue-700"  // MoM badge
```

### Mudar Formato de Data
Edite em `momCalculations.ts`:
```typescript
const label = format(parseISO(dateKey), 'dd/MM', { locale: ptBR });
```

## Debugging

### Verificar dados de comparação
```typescript
console.log('Comparison Data:', comparisonData);
comparisonData.forEach(item => {
  console.log(`${item.date}:`, {
    current: item.baseEnviada,
    previous: item.previousData?.baseEnviada,
    metrics: item.momMetrics
  });
});
```

### Testar período MoM
```typescript
const testRange = {
  startDate: new Date(2024, 0, 15),  // Jan 15
  endDate: new Date(2024, 0, 20)     // Jan 20
};
```

## Testes Recomendados

1. ✓ Período sem dados
2. ✓ MoM com todos os filtros
3. ✓ Agrupamento semanal com MoM
4. ✓ Métricas com valores zero
5. ✓ Comparação cross-month (Jan vs Dez)

## Notas de Implementação

- Todos os tipos são estritamente tipados (TypeScript)
- Funções são puras e testáveis
- Sem mutações de dados originais
- Suporta lógica de filtros complexos
- Performático com dados grandes (1000+ registros)
- Totalmente compatível com Tailwind CSS
