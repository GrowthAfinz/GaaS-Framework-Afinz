# Review Técnico Completo — GaaS Framework
**Data:** 25/02/2026
**Revisor:** Claude Code
**Status:** Pendente de execução

---

## 🔴 CRÍTICO — Risco de perda de dados ou crash

| # | Problema | Local | Ação |
|---|----------|-------|------|
| 1 | **Sync destrói dados GaaS** — `delete().eq('prog_gaas', false)` sem transação. Se falha no meio, dados perdidos | `activityService.ts:156` | Substituir por upsert |
| 2 | **`useDispatchInsights` importado mas não existe** — crash em runtime ao abrir modal | `ProgramarDisparoModal.tsx:19` | Criar hook ou remover import |
| 3 | **RLS policies permitem escrita anônima** — `USING (true) WITH CHECK (true)` em todas as tabelas | `migrations/001,002` | Implementar RLS com auth real |
| 4 | **Date parsing type mismatch** — `.toISOString()` chamado em campo `string` | `useStrategyMetrics.ts:61` | Normalizar para Date antes de operar |
| 5 | **Memory leak no hydration listener** — `onFinishHydration` nunca chama `unsub()` | `useFrameworkData.ts:126` | Adicionar cleanup |
| 6 | **Batch sync sem rollback** — chunk 3 de 10 falha, chunks 1-2 já inseridos | `activityService.ts:259` | Transação ou retry idempotente |

---

## 🟠 ALTO — Features incompletas ou quebradas

### Modal de Disparo
- 11 `useEffect` encadeados → risco de loop infinito
- Auto-fill sobrescreve input do usuário sem aviso
- Ofertas com 0 uso histórico ocultas, mesmo sendo válidas

### Funnel Orchestrator
- `FunnelLayers`, `InfluenceMatrix`, `ResultEstimates`, `ActionLevers` — **100% dados mockados hardcoded**, nada conectado ao banco real

### FrameworkView
- Auto-cálculos não implementados: ActivityName (`BU_CAMP_JORNADA_ORD_SAFRA`), Safra, Total Campanha, C.U. Canal
- Edição de célula sem validação alguma

### Filtros ausentes em `useAdvancedFilters`
- Status (`Rascunho`, `Scheduled`, `Enviado`, `Realizado`) — declarado, nunca aplicado
- Oferta / Promocional — declarado, ignorado
- Safra — inexistente
- BU filter em `useB2CAnalysis` — definido, nunca usado nos cálculos

---

## 🟡 MÉDIO — Arquitetura e qualidade

### Dados / Schema Supabase
- Sem índice composto `(BU, "Data de Disparo")` — queries mais comuns sem índice
- `goals` table: 10+ migrations de correção — schema instável
- `b2c_daily_metrics` e `paid_media_metrics` sem migration file — não versionadas
- `.limit(10000)` como substituto de paginação — timebomb
- Upsert com `onConflict: 'mes'` mas sem constraint UNIQUE no schema

### ML / IA
- "Causal Analysis" é correlação simples disfarçada de causalidade
- `pValue` e `correlation` hardcoded (`0.01`, `0.7`) — não calculados
- Fallbacks sem base estatística: 78% delivery rate, 10k volume, 2% conversão
- Levenshtein distance ~440k vezes para 500 activities — trava UI

### State Management
- Filtros definidos em 4 lugares: `PeriodContext`, `BUContext`, `useAppStore`, `App.tsx`
- Nenhuma view tem Error Boundary — qualquer erro = tela branca
- Modal state não persiste ao trocar de aba
- Tab state perdida ao navegar

### Timezone / Datas
- 3 padrões de parse simultâneos: `format()`, `.toISOString().split('T')`, split manual
- Usuário UTC-3 pode ver atividade no dia errado

---

## 🔵 MELHORIAS — Alto impacto, esforço justificado

### Performance
| Melhoria | Impacto | Esforço |
|----------|---------|---------|
| `React.memo` no `DayCell` + memoizar `getDominantBU` | Alto | Baixo |
| Substituir delete+insert por upsert no sync | Alto | Médio |
| Paginação real no Supabase | Alto | Médio |
| `react-window` na tabela Framework | Médio | Médio |
| Índice composto `(BU, Data de Disparo)` | Alto | Baixo |

### UX / Features ausentes
- Lifecycle completo: `Rascunho → Scheduled → Enviado → Realizado` — só transição inicial existe
- Sem atalhos de teclado (`Ctrl+N`, `Esc`, `←/→` mês)
- Sem undo/redo em edições
- Sem busca de atividade no calendário
- Sem clone de atividade (campanhas recorrentes)
- Sem export iCal/PDF
- `OriginacaoTable` usa tema claro — único componente fora do dark mode

---

## Roadmap de Execução

```
SEMANA 1 — Estabilidade (não perder dados)
├── Sync: delete → upsert com deduplicação
├── Criar useDispatchInsights ou remover import
├── RLS com autenticação real
└── Fix memory leak hydration listener

SEMANA 2 — Features core
├── Funnel Orchestrator: conectar dados reais
├── FrameworkView: auto-cálculos (ActivityName, Safra, Total)
├── Filtros: Status, Safra, Oferta
└── Lifecycle de atividade completo

SEMANA 3 — Arquitetura
├── Unificar filtros em Zustand (uma fonte)
├── Error Boundaries em todas as views
├── Unificar utilitários de data
└── Índices compostos no Supabase

SEMANA 4 — Performance & UX
├── React.memo no DayCell
├── Paginação Supabase
├── Undo/redo básico
└── Atalhos de teclado
```

---

*Gerado após revisão completa de 130+ componentes, 20+ hooks, 13 services e schema Supabase*
