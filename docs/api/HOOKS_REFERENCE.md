# Referencia: Custom Hooks

**Diretorio:** `src/hooks/`
**Total:** 20+ Hooks

---

## Hooks de Dados (Core)

### `useFrameworkData`
Hook central que gerencia o carregamento e sincronizacao dos dados.
- **Responsabilidade:** Buscar activities, cachear, fornecer estado global.
- **Retorno:** `{ activities, loading, error, refresh }`

### `useActivities`
CRUD especifico para atividades do Launch Planner.
- **Metodos:** `saveActivity`, `updateActivity`, `deleteActivity`, `getById`.
- **Integracao:** Chama `activityService` e atualiza `useAppStore`.

### `useGoals`
Gerencia metas mensais.
- **Metodos:** `getGoalsByMonth`, `saveGoal`.
- **Estado:** Sincroniza com `useMetaStore`.

### `useVersionManager`
Controle de versoes da tabela framework.
- **Metodos:** `uploadVersion`, `activateVersion`, `listVersions`, `restoreVersion`.

---

## Hooks de Analise

### `useAdvancedFilters`
Logica complexa de filtros multi-dimensionais.
- **Input:** Lista de activities bruta.
- **Filtros:** Periodo, BU, Status, Canal, Segmento, Texto.
- **Retorno:** Lista filtrada + funcoes de filtro.

### `useStrategyMetrics`
Calcula metricas de performance segmentada.
- **Retorno:** KPIs agregados por estrategia (Segmento/Jornada).

### `useMediaCorrelation`
Motor de analise para aba Media Analytics.
- **Feature:** Calcula Time-Lag e correlacao (Pearson/Spearman).
- **Dados:** Cruza `paid_media_metrics` com `b2c_daily_metrics`.

### `useB2CAnalysis`
Analise comparativa para Originação B2C.
- **Feature:** Merge de dados CRM vs B2C Total.
- **Calculo:** Share of voice, indices de performance.

### `useConversionFunnel`
Calcula o funil de conversao para a aba Jornada.
- **Retorno:** Taxas de cada etapa (Entrega -> Emissao).

### `useBottleneckTrend`
Identifica gargalos e tendencias.
- **Uso:** Aba Jornada (Analise de Gargalos).

---

## Hooks de UI/Interacao

### `useCalendarFilter`
Logica especifica do calendario mensal.
- **Feature:** Filtra atividades para a grid do mes visivel.
- **Contadores:** Gera badges com contagem diaria.

### `useNotes` / `useNotesWithTags`
Sistema de diario de bordo.
- **Funcionalidade:** CRUD de notas, busca por tags.

### `useCSVParser`
Utilitario para parsing de arquivos.
- **Feature:** Detecta encoding, valida headers, converte para JSON.

---

## Hooks de ML/AI

### `useRecommendationEngine`
Motor da aba Orientador.
- **Processamento:** Pesado (roda em useEffect com dependencias controladas).
- **Output:** Lista ordenada de recomendacoes com scores.

### `useFieldProjection`
Projecoes em tempo real para o Modal de Disparo.
- **Input:** Valor atual do campo + contexto do formulario.
- **Output:** Projecao dos KPIs esperados.

### `useAIProjections` (Legacy)
Versao anterior simplificada das projecoes (sera descontinuada).

---

## Hooks de Formulario

### `useFrameworkOptions`
Extrai opcoes unicas para dropdowns baseadas no historico.
- **Cache:** Memoiza opcoes para evitar recalculo.
- **Retorno:** `{ segmentos, jornadas, parceiros, ofertas, ... }`

---

## Exemplo de Uso (Launch Planner)

```typescript
// Exemplo simplificado de composicao de hooks
const LaunchPlanner = () => {
  // 1. Dados
  const { activities } = useFrameworkData();
  
  // 2. Filtros
  const { filteredData, filters, setFilters } = useAdvancedFilters(activities);
  
  // 3. UI Helper
  const { calendarData } = useCalendarFilter(filteredData, currentMonth);
  
  // 4. ML (quando modal abre)
  const { projection } = useFieldProjection(field, formState);

  return <Calendar data={calendarData} />;
};
```
