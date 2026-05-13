# TAB: Diario de Bordo

**Rota:** `/diario`
**Componente Principal:** `DiarioBordo.tsx`
**Categoria:** PLANEJAMENTO

---

## Overview

O Diario de Bordo e o sistema de anotacoes e tracking de experimentos do Growth Marketing. Permite registrar aprendizados, hipoteses, testes A/B e seus resultados, criando uma base de conhecimento para a equipe.

---

## Features

- Criacao de entradas de diario
- Tracking de experimentos A/B
- Calculadora de significancia estatistica
- Vinculo com campanhas/segmentos
- Classificacao por BU
- Status de experimentos
- Filtros multi-dimensionais
- Import/export de entradas

---

## Arquitetura de Componentes

```
DiarioBordo.tsx
├── TabSwitcher (Diario | Experimentos)
│
├── [Tab: Diario]
│   └── DiaryView.tsx
│       ├── FilterBar
│       │   ├── DateRangePicker
│       │   ├── BUFilter
│       │   └── StatusFilter
│       ├── DiaryEntryForm
│       │   ├── DatePicker
│       │   ├── TitleInput
│       │   ├── DescriptionEditor
│       │   ├── BUSelector
│       │   ├── SegmentSelect (multi)
│       │   └── CanalSelect (multi)
│       └── DiaryEntryList
│           └── DiaryEntryCard (multiple)
│
└── [Tab: Experimentos]
    └── ExperimentsView.tsx
        ├── ExperimentFilters
        │   └── MultiSelectChips.tsx
        ├── ExperimentForm
        │   ├── HipoteseInput
        │   ├── MetricsInputs
        │   └── ConclusaoInput
        ├── ExperimentList
        │   └── ExperimentCard (multiple)
        └── SignificanceCalculator.tsx
```

---

## Componentes Principais

### DiarioBordo.tsx
Router principal que alterna entre Diario e Experimentos.

### DiaryView.tsx
Interface para entradas de diario gerais.

**Funcionalidades:**
- Criar novas anotacoes
- Filtrar por periodo/BU/status
- Editar entradas existentes
- Excluir entradas
- Vincular a campanhas

### ExperimentsView.tsx
Interface dedicada a experimentos A/B.

**Funcionalidades:**
- Registrar hipoteses
- Informar metricas de controle/variante
- Calcular significancia
- Registrar conclusoes
- Acompanhar status

### SignificanceCalculator.tsx
Calculadora de significancia estatistica.

**Inputs:**
- Amostra Controle
- Conversoes Controle
- Amostra Variante
- Conversoes Variante

**Outputs:**
- Taxa Conversao Controle
- Taxa Conversao Variante
- Diferenca Relativa (%)
- P-value
- Significancia (Sim/Nao)
- Confianca (%)

### MultiSelectChips.tsx
Componente de selecao multipla com chips.

**Usado para:**
- Segmentos
- Canais
- Parceiros

---

## Estrutura de Dados

### DiaryEntry
```typescript
interface DiaryEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  date: string;           // Data de referencia
  bu: BU;

  // Conteudo
  title: string;
  description?: string;

  // Vinculos
  segmentos: string[];
  parceiros: string[];
  canais?: string[];
  campanhasRelacionadas?: string[];

  // Experimento A/B
  isTesteAB: boolean;
  statusExperimento?: ExperimentStatus;
  hipotese?: string;
  conclusao?: string;
  metrics?: {
    controle: { disparos: number; conversoes: number };
    variante: { disparos: number; conversoes: number };
  };
}

type ExperimentStatus =
  | 'hipotese'     // Hipotese registrada
  | 'rodando'      // Teste em execucao
  | 'concluido'    // Teste finalizado
  | 'aprendizado'; // Conclusoes extraidas
```

---

## Fluxo de Dados

```
User cria entrada no DiaryView
         │
         ▼
DiaryEntryForm coleta dados
         │
         ▼
diaryStore.addEntry()
         │
         ▼
localStorage persiste (growth_brain_diary_store)
         │
         ▼
DiaryEntryList re-renderiza
         │
         ▼
[Se experimento]
         │
         ▼
ExperimentsView exibe na lista
         │
         ▼
User informa metricas
         │
         ▼
SignificanceCalculator calcula p-value
         │
         ▼
User registra conclusao
         │
         ▼
diaryStore.updateEntry()
```

---

## Hooks e Stores Utilizados

| Store/Hook | Funcao |
|------------|--------|
| `diaryStore` | Gerencia entradas de diario |
| `useFrameworkOptions` | Opcoes de segmentos/canais |

### diaryStore (Zustand)

**State:**
```typescript
{
  entries: DiaryEntry[]
}
```

**Actions:**
```typescript
{
  addEntry: (entry: DiaryEntry) => void
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void
  deleteEntry: (id: string) => void
  getEntriesByDate: (date: string) => DiaryEntry[]
  getEntriesByDateRange: (start: string, end: string) => DiaryEntry[]
  getEntriesByBU: (bu: BU) => DiaryEntry[]
  getExperimentos: () => DiaryEntry[]
  clearEntries: () => void
  importEntries: (entries: DiaryEntry[]) => void
}
```

---

## Casos de Uso

### 1. Registrar Aprendizado
1. Clicar "Nova Entrada"
2. Selecionar data
3. Informar titulo do aprendizado
4. Adicionar descricao detalhada
5. Vincular segmentos/campanhas relevantes
6. Salvar

### 2. Criar Experimento A/B
1. Marcar "E um teste A/B"
2. Escrever hipotese
3. Selecionar status "Rodando"
4. Vincular campanhas de controle/variante
5. Salvar

### 3. Registrar Resultado de Experimento
1. Abrir experimento existente
2. Informar metricas de controle
3. Informar metricas de variante
4. Verificar significancia na calculadora
5. Registrar conclusao
6. Alterar status para "Concluido"

### 4. Buscar Aprendizados Passados
1. Usar filtros de periodo
2. Filtrar por BU se necessario
3. Filtrar por status de experimento
4. Revisar entradas encontradas

### 5. Export/Import Entradas
1. Clicar "Exportar"
2. JSON com entradas baixado
3. Em outro dispositivo, clicar "Importar"
4. Selecionar arquivo JSON
5. Entradas carregadas

---

## Calculadora de Significancia

### Formula Utilizada

**Taxa de Conversao:**
```
taxa = conversoes / amostra
```

**Erro Padrao:**
```
se = sqrt(p * (1-p) / n)
```

**Z-score:**
```
z = (taxa_var - taxa_ctrl) / sqrt(se_ctrl^2 + se_var^2)
```

**P-value:**
```
p_value = 2 * (1 - CDF(|z|))
```

**Significancia:**
```
significante = p_value < 0.05
confianca = (1 - p_value) * 100
```

### Interpretacao

| P-value | Significancia | Interpretacao |
|---------|---------------|---------------|
| < 0.01 | Alta | Resultado muito confiavel |
| 0.01-0.05 | Moderada | Resultado estatisticamente significante |
| 0.05-0.10 | Baixa | Inconclusivo, considerar mais dados |
| > 0.10 | Nenhuma | Diferenca pode ser aleatoria |

---

## Arquivos Relacionados

- `src/components/DiarioBordo.tsx`
- `src/components/diary/DiaryView.tsx`
- `src/components/diary/ExperimentsView.tsx`
- `src/components/diary/MultiSelectChips.tsx`
- `src/components/diary/SignificanceCalculator.tsx`
- `src/store/diaryStore.ts`
- `calendar-estrategico/DOCUMENTACAO_FUNCIONAL_DIARIO_BORDO.md`

---

**Ultima Atualizacao:** 2026-02-02
