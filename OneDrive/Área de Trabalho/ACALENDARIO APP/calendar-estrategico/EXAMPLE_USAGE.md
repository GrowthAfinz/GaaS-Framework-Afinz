# Exemplo de Uso: Implementação Completa de MoM

## 1. App Principal - Integração Completa

```typescript
// App.tsx
import React, { useState } from 'react';
import { CalendarData, PeriodComparison } from './types/framework';
import { PerformanceEvolutionChartWithMoM } from './components/PerformanceEvolutionChartWithMoM';
import { SegmentPerformanceWithMoM } from './components/SegmentPerformanceWithMoM';

// Dados de exemplo
const mockData: CalendarData = {
  '2024-01-01': [
    {
      id: '1',
      bu: 'B2C',
      canal: 'SMS',
      segmento: 'Premium',
      parceiro: 'Partner A',
      kpis: {
        baseEnviada: 1000,
        baseEntregue: 950,
        propostas: 450,
        cartoes: 50,
        custoTotal: 500
      },
      raw: {}
    }
  ],
  // ... mais dados
};

function App() {
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison>({
    current: {
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 31)
    },
    isMoMEnabled: false
  });

  const [selectedCanais, setSelectedCanais] = useState<string[]>(['SMS']);

  return (
    <div className="p-6 bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Relatório de Performance</h1>

      {/* Gráfico com seletor de período integrado */}
      <PerformanceEvolutionChartWithMoM
        data={mockData}
        selectedCanais={selectedCanais}
        onDayClick={(date) => console.log('Clicou em:', date)}
      />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Performance por Canal</h2>
        
        {periodComparison.isMoMEnabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 font-medium">
              ✓ Comparativo MoM ativado - Comparando com {new Date(periodComparison.current.startDate).toLocaleDateString('pt-BR')} do mês anterior
            </p>
          </div>
        ) : null}

        <SegmentPerformanceWithMoM
          data={mockData}
          periodComparison={periodComparison}
          segmentKey="canal"
          selectedCanais={selectedCanais}
        />
      </div>
    </div>
  );
}

export default App;
```

## 2. Hook Customizado - Padrão de Uso

```typescript
// hooks/useReportData.ts
import { useMoMComparison } from './useMoMComparison';
import { CalendarData, PeriodComparison } from '../types/framework';

interface UseReportDataProps {
  data: CalendarData;
  periodComparison: PeriodComparison;
  selectedFilters: {
    bu?: string;
    canais?: string[];
    segmentos?: string[];
    parceiros?: string[];
  };
}

export function useReportData({
  data,
  periodComparison,
  selectedFilters
}: UseReportDataProps) {
  // Usar o hook MoM
  const comparisonData = useMoMComparison({
    data,
    periodComparison,
    filters: selectedFilters
  });

  // Processar dados adicionalmente se necessário
  const summary = comparisonData.reduce((acc, item) => ({
    totalBaseEnviada: acc.totalBaseEnviada + item.baseEnviada,
    totalCartoes: acc.totalCartoes + item.cartoes,
    totalCusto: acc.totalCusto + item.custo
  }), { totalBaseEnviada: 0, totalCartoes: 0, totalCusto: 0 });

  return {
    comparisonData,
    summary,
    isMoMEnabled: periodComparison.isMoMEnabled
  };
}
```

## 3. Componente com Múltiplas Abas

```typescript
// components/ReportDashboard.tsx
import React, { useState } from 'react';
import { PeriodSelector } from './PeriodSelector';
import { PerformanceEvolutionChartWithMoM } from './PerformanceEvolutionChartWithMoM';
import { SegmentPerformanceWithMoM } from './SegmentPerformanceWithMoM';
import { PeriodComparison } from '../types/framework';

const ReportDashboard: React.FC<{ data: CalendarData }> = ({ data }) => {
  const [periodComparison, setPeriodComparison] = useState<PeriodComparison>({
    current: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      endDate: new Date()
    },
    isMoMEnabled: false
  });

  const [activeTab, setActiveTab] = useState<'performance' | 'canais' | 'segmentos'>('performance');

  return (
    <div className="space-y-6">
      {/* Period Selector sempre visível */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <PeriodSelector onPeriodChange={setPeriodComparison} />
      </div>

      {/* Status do MoM */}
      {periodComparison.isMoMEnabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-bold">📊 Modo de Comparação Ativo:</span> Comparando período de{' '}
            {periodComparison.current.startDate.toLocaleDateString('pt-BR')} a{' '}
            {periodComparison.current.endDate.toLocaleDateString('pt-BR')} com o mesmo período do mês anterior
          </p>
        </div>
      )}

      {/* Abas */}
      <div className="border-b border-slate-200">
        <div className="flex gap-0">
          {[
            { id: 'performance', label: '📈 Evolução de Performance' },
            { id: 'canais', label: '📡 Performance por Canal' },
            { id: 'segmentos', label: '🎯 Performance por Segmento' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo da Aba */}
      <div className="space-y-6">
        {activeTab === 'performance' && (
          <PerformanceEvolutionChartWithMoM
            data={data}
            onDayClick={(date) => console.log('Clicou:', date)}
          />
        )}

        {activeTab === 'canais' && (
          <SegmentPerformanceWithMoM
            data={data}
            periodComparison={periodComparison}
            segmentKey="canal"
          />
        )}

        {activeTab === 'segmentos' && (
          <SegmentPerformanceWithMoM
            data={data}
            periodComparison={periodComparison}
            segmentKey="segmento"
          />
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;
```

## 4. Interpretando Resultados MoM

### Cenário 1: Melhoria em Conversão
```
Período Atual (jan 1-31): Conversão 5%
Período Anterior (dez 1-31): Conversão 3%

Variação MoM: +2 pontos percentuais
Percentual: +66.67% 🟢 POSITIVO

Interpretação: A conversão melhorou significativamente no período atual
```

### Cenário 2: Aumento de Custo (CAC)
```
Período Atual: CAC R$ 25
Período Anterior: CAC R$ 20

Variação MoM: +R$ 5 (25% maior)
Percentual: +25% 🔴 NEGATIVO

Interpretação: Está custando mais por cartão adquirido
Ação: Revisar otimizações de mídia
```

### Cenário 3: Comparação Múltipla
```
📊 Resumo do Mês (Jan vs Dez)

Canal SMS:
- Conversão: 5% → 4% (-20% MoM) 🔴
- CAC: R$ 15 → R$ 18 (+20% MoM) 🔴
- Volume: 1000 → 1200 cartões (+20%) 🟢

Canal Email:
- Conversão: 8% → 10% (+25% MoM) 🟢
- CAC: R$ 20 → R$ 16 (-20% MoM) 🟢
- Volume: 500 → 600 cartões (+20%) 🟢

Conclusão: Email está com melhor performance, SMS precisa de otimização
```

## 5. Exportar Relatório com MoM

```typescript
// utils/reportExport.ts
import { ComparisonData } from '../types/framework';

export function exportToCSV(data: ComparisonData[], filename: string) {
  const headers = [
    'Data',
    'Base Enviada',
    'Cartões',
    'Conversão %',
    'Base Anterior',
    'Cartões Anterior',
    'Conversão Anterior %',
    'Variação MoM %'
  ];

  const rows = data.map(item => [
    item.date,
    item.baseEnviada,
    item.cartoes,
    ((item.cartoes / item.baseEnviada) * 100).toFixed(2),
    item.previousData?.baseEnviada || '-',
    item.previousData?.cartoes || '-',
    item.previousData?.baseEnviada
      ? ((item.previousData.cartoes / item.previousData.baseEnviada) * 100).toFixed(2)
      : '-',
    item.momMetrics?.conversao.percentDifference.toFixed(2) || '-'
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
}

// Uso
exportToCSV(comparisonData, 'relatorio-mom-janeiro-2024');
```

## 6. Testes Unitários

```typescript
// __tests__/momCalculations.test.ts
import { calculateMoMMetrics } from '../utils/momCalculations';
import { AggregatedData } from '../types/framework';

describe('MoM Calculations', () => {
  const currentData: AggregatedData = {
    date: '2024-01-15',
    label: '15/01',
    timestamp: 1000,
    baseEnviada: 100,
    baseEntregue: 95,
    propostas: 45,
    cartoes: 10,
    custo: 100,
    count: 1
  };

  const previousData: AggregatedData = {
    date: '2023-12-15',
    label: '15/12',
    timestamp: 2000,
    baseEnviada: 80,
    baseEntregue: 75,
    propostas: 30,
    cartoes: 8,
    custo: 120,
    count: 1
  };

  it('should calculate conversion MoM correctly', () => {
    const metrics = calculateMoMMetrics(currentData, previousData);
    // Current: 10/100 = 10%
    // Previous: 8/80 = 10%
    // Change: 0%
    expect(metrics.conversao.percentDifference).toBe(0);
  });

  it('should calculate CAC MoM correctly', () => {
    const metrics = calculateMoMMetrics(currentData, previousData);
    // Current: 100/10 = 10
    // Previous: 120/8 = 15
    // Change: -33.33%
    expect(metrics.cac.percentDifference).toBeCloseTo(-33.33, 1);
  });
});
```

## 7. Checklist de Implementação

- [ ] Copiar arquivos para o projeto
- [ ] Instalar dependências (date-fns já incluído)
- [ ] Importar componentes nos arquivos principais
- [ ] Configurar dados de exemplo
- [ ] Testar período predefinido (Este mês)
- [ ] Testar período customizado
- [ ] Ativar/desativar MoM
- [ ] Verificar tooltip com dados
- [ ] Testar agrupamento semanal com MoM
- [ ] Validar exportação de dados
- [ ] Verificar performance com grande volume
- [ ] Testes em dispositivos mobile

## Suporte

Para dúvidas ou bugs, consulte `MOM_IMPLEMENTATION_GUIDE.md`
