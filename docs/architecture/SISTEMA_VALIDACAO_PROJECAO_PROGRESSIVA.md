# Sistema de Validação de Campos Mínimos e Projeção Progressiva

**Versão:** 2.0
**Data:** 2026-02-03
**Autor:** Claude Code
**Status:** ✅ Implementado e Testável

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Problema Original](#problema-original)
3. [Solução Implementada](#solução-implementada)
4. [Arquitetura do Sistema](#arquitetura-do-sistema)
5. [Fluxo de Dados Completo](#fluxo-de-dados-completo)
6. [Lógica de Validação](#lógica-de-validação)
7. [Estados de Readiness](#estados-de-readiness)
8. [Componentes Modificados](#componentes-modificados)
9. [Pipeline de ML](#pipeline-de-ml)
10. [Logging e Debugging](#logging-e-debugging)
11. [Testes e Validação](#testes-e-validação)
12. [Casos de Uso](#casos-de-uso)
13. [Performance e Otimizações](#performance-e-otimizações)
14. [Troubleshooting](#troubleshooting)

---

## 1. Visão Geral

### 1.1 O Que É Este Sistema?

Este sistema implementa **validação científica** de campos mínimos necessários para gerar projeções de métricas de campanhas de marketing. Ele garante que projeções só sejam geradas quando houver **dados suficientes** para resultados **estatisticamente válidos**.

### 1.2 Princípio Fundamental

> **"Não projetar sem volume é como prever vendas sem saber o estoque"**

O sistema bloqueia projeções até que **4 campos críticos** estejam preenchidos:
1. **BU** (Business Unit)
2. **Campanha** (Segmento)
3. **Canal** (Meio de comunicação)
4. **Volume** (Base de disparos)

### 1.3 Benefícios

✅ **Cientificamente Válido:** Projeções baseadas em dados suficientes
✅ **Feedback Progressivo:** UX clara sobre qualidade das projeções
✅ **Precisão Incremental:** Quanto mais campos, maior a confiança
✅ **Prevenção de Erros:** Bloqueia projeções absurdas
✅ **Educação do Usuário:** Ensina quais campos são importantes

---

## 2. Problema Original

### 2.1 Comportamento Indesejado (ANTES)

```
User preenche: BU=B2C, Campanha=Leads_Parceiros
    ↓
Sistema PROJETA IMEDIATAMENTE ❌
    ↓
Projeções absurdas:
    ├─ Tx Conv: 0.04% (sem Canal? sem Volume?)
    ├─ CAC: R$ 3.17 (sem saber custo do canal?)
    ├─ Propostas: 5 (sem volume base?!)
    ├─ Aprovados: 4
    └─ Cartões: 2
    ↓
Confidence: 15% (fallback matching)
```

### 2.2 Análise do Problema

**Dimensões Usadas:** Apenas 2 de 11 (18%)
- ✅ BU (15% weight)
- ✅ Segmento (15% weight)
- ❌ Canal (12% weight) - **CRÍTICO FALTANDO**
- ❌ Volume - **FATOR X FALTANDO**
- ❌ Oferta, Jornada, Perfil, etc. - não preenchidos

**Por Que É Inválido:**

1. **Sem Canal:** Não sabemos custo unitário (WhatsApp = R$ 0,42 vs Email = R$ 0,001)
2. **Sem Volume:** Não podemos calcular métricas absolutas (propostas, aprovados, cartões)
3. **Matching Fraco:** Apenas 2 dimensões = muitos falsos positivos
4. **Projeções Aleatórias:** Valores não representam a realidade da campanha

### 2.3 Impacto no Negócio

❌ **Decisões Erradas:** Operador confia em projeções inválidas
❌ **Desperdício de Budget:** CAC errado leva a investimento inadequado
❌ **Expectativas Irreais:** Cartões projetados não correspondem à realidade
❌ **Perda de Confiança:** Sistema perde credibilidade

---

## 3. Solução Implementada

### 3.1 Validação de Campos Mínimos

**Requisitos Absolutos:**
```typescript
MINIMUM_REQUIRED_FIELDS = {
    bu: true,           // BU é obrigatório (15% weight)
    segmento: true,     // Segmento é obrigatório (15% weight)
    canal: true,        // Canal afeta custos (12% weight) - NOVO
    baseVolume: true    // Volume é o FATOR X - NOVO
}
```

**Lógica de Bloqueio:**
```typescript
function hasMinimumRequiredFields(formData: any): boolean {
    return !!(
        formData.bu &&
        formData.segmento &&
        formData.canal &&                    // BLOQUEIO CRÍTICO
        formData.baseVolume &&               // BLOQUEIO CRÍTICO
        Number(formData.baseVolume) > 0      // Volume > 0
    );
}
```

**Comportamento:**
- Se `hasMinimumRequiredFields() === false` → **Nenhuma projeção é gerada**
- Sistema exibe mensagem clara: `"Preencha Canal, Volume para gerar projeções"`
- Metrics cards ficam em estado de placeholder/loading

### 3.2 Projeção Progressiva

O sistema agora possui **4 níveis de readiness** baseados em campos preenchidos:

| Readiness | Campos | Confidence | Cor | Comportamento |
|-----------|--------|------------|-----|---------------|
| **insufficient** | < 4 críticos | 0% | Amarelo/Amber | ❌ Bloqueia projeção |
| **partial** | 4 críticos | 60-70% | Azul | ✅ Projeta com base mínima |
| **good** | 4 críticos + 1-2 importantes | 70-85% | Verde | ✅ Projeta com boa confiança |
| **excellent** | 4 críticos + 3+ importantes | 85-95% | Verde Esmeralda | ✅ Projeta com alta precisão |

**Campos Importantes (não bloqueiam, mas aumentam precisão):**
- Oferta (8% weight)
- Jornada (10% weight)
- Perfil Crédito (10% weight)
- Parceiro (5% weight)

### 3.3 Feedback Visual

**Estado Insufficient:**
```
┌─────────────────────────────────────────┐
│ ⚠️ Preencha Canal, Volume para gerar    │
│    projeções                            │
│                                         │
│ [fundo amarelo/amber com borda]         │
└─────────────────────────────────────────┘
```

**Estado Partial:**
```
┌─────────────────────────────────────────┐
│ Baseado em 143 disparos similares       │
│                                         │
│ 📊 Projeções básicas. Adicione Oferta  │
│    e Jornada para melhorar              │
│ [fundo azul]                            │
└─────────────────────────────────────────┘
```

**Estado Good:**
```
┌─────────────────────────────────────────┐
│ Baseado em 89 disparos similares        │
│                                         │
│ 📊 Projeções com boa confiança          │
│ [fundo verde]                           │
└─────────────────────────────────────────┘
```

**Estado Excellent:**
```
┌─────────────────────────────────────────┐
│ Baseado em 23 disparos similares        │
│                                         │
│ 📊 Projeções de alta precisão           │
│ [fundo verde esmeralda]                 │
└─────────────────────────────────────────┘
```

---

## 4. Arquitetura do Sistema

### 4.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                  ProgramarDisparoModal                      │
│  (Modal principal de agendamento de disparo)                │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ provides context
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DispatchFormContext (Provider)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ STATE:                                                 │  │
│  │  - formData: DispatchFormData                         │  │
│  │  - projections: Record<string, FieldProjection>       │  │
│  │  - projectionReadiness: ProjectionReadiness           │  │
│  │  - smartOptions: ComboboxOptions                      │  │
│  │  - errors: ValidationErrors                           │  │
│  │                                                        │  │
│  │ FUNCTIONS:                                            │  │
│  │  - hasMinimumRequiredFields()                         │  │
│  │  - determineProjectionReadiness()                     │  │
│  │  - handleChange()                                     │  │
│  │                                                        │  │
│  │ EFFECTS:                                              │  │
│  │  - Effect #9: AI Projection Trigger                   │  │
│  │    └─ Validação de campos mínimos                     │  │
│  │    └─ Cálculo de readiness                            │  │
│  │    └─ Chamada ao AIOrchestrator                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ consumes context
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    5 Blocos do Formulário                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Bloco 1:     │ │ Bloco 2:     │ │ Bloco 3:     │        │
│  │ Identification│ │ Schedule     │ │ Product      │        │
│  │              │ │              │ │ & Offer      │        │
│  │ - BU         │ │ - Datas      │ │ - Produto    │        │
│  │ - Campanha   │ │ - Horário    │ │ - Perfil     │        │
│  │ - Jornada    │ │ - Frequência │ │ - Oferta     │        │
│  │ - Canal      │ │              │ │ - Promo      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ┌──────────────┐ ┌──────────────────────────────────────┐ │
│  │ Bloco 4:     │ │ Bloco 5: AIProjectionBlock          │ │
│  │ Investment   │ │                                      │ │
│  │              │ │ ┌────────────────────────────────┐  │ │
│  │ - Volume     │ │ │ getReadinessMessage()          │  │ │
│  │ - Custos     │ │ │  ├─ Identifica campos faltantes │  │ │
│  │              │ │ │  ├─ Retorna mensagem + cores    │  │ │
│  └──────────────┘ │ │  └─ isWarning flag             │  │ │
│                   │ └────────────────────────────────┘  │ │
│                   │                                      │ │
│                   │ Grid 3×3 de Métricas:               │ │
│                   │  ┌──────┐ ┌──────┐ ┌──────┐        │ │
│                   │  │Volume│ │TxConv│ │BaseAc│        │ │
│                   │  └──────┘ └──────┘ └──────┘        │ │
│                   │  ┌──────┐ ┌──────┐ ┌──────┐        │ │
│                   │  │ CAC  │ │TxEnt │ │TxAbt │        │ │
│                   │  └──────┘ └──────┘ └──────┘        │ │
│                   │  ┌──────┐ ┌──────┐ ┌──────┐        │ │
│                   │  │Props │ │Aprov │ │Cartõ │        │ │
│                   │  └──────┘ └──────┘ └──────┘        │ │
│                   │                                      │ │
│                   │ Footer: Readiness Badge             │ │
│                   └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   AIOrchestrator (Singleton)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ initialize(activities: ActivityRow[])                 │  │
│  │  └─ processActivities() → ProcessedActivity[]        │  │
│  │                                                        │  │
│  │ projectAllFields(formData: FormDataInput)            │  │
│  │  ├─ findSimilarActivities()                          │  │
│  │  │   └─ 11 dimensões de matching                     │  │
│  │  ├─ selectBestMatchGroup()                           │  │
│  │  │   └─ exact > high > medium > low > fallback       │  │
│  │  └─ projectAllMetrics()                              │  │
│  │      └─ 9 métricas projetadas                        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ uses
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Pipeline de ML (6 serviços)                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │ Similarity │ │ Prediction │ │   Causal   │              │
│  │  Engine    │ │  Engine    │ │  Analyzer  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │    Data    │ │Performance │ │Explanation │              │
│  │ Processor  │ │  Analyzer  │ │ Generator  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Hierarquia de Dados

```
DispatchFormContext
    │
    ├─ formData: DispatchFormData
    │   ├─ bu: string
    │   ├─ segmento: string
    │   ├─ canal: string
    │   ├─ baseVolume: string
    │   ├─ jornada?: string
    │   ├─ oferta?: string
    │   ├─ perfilCredito?: string
    │   ├─ parceiro?: string
    │   └─ ... (30+ campos)
    │
    ├─ projections: Record<string, FieldProjection>
    │   ├─ volume: FieldProjection
    │   ├─ taxaConversao: FieldProjection
    │   ├─ baseAcionavel: FieldProjection
    │   ├─ cac: FieldProjection
    │   ├─ taxaEntrega: FieldProjection
    │   ├─ taxaAbertura: FieldProjection
    │   ├─ propostas: FieldProjection
    │   ├─ aprovados: FieldProjection
    │   └─ cartoesGerados: FieldProjection
    │
    ├─ projectionReadiness: ProjectionReadiness
    │   └─ 'insufficient' | 'partial' | 'good' | 'excellent'
    │
    ├─ smartOptions: ComboboxOptions
    │   ├─ segmentos: ComboboxOption[]
    │   ├─ jornadas: ComboboxOption[]
    │   ├─ ofertas: ComboboxOption[]
    │   └─ ... (histórico para sugestões)
    │
    └─ errors: ValidationErrors
        └─ campo → mensagem de erro
```

---

## 5. Fluxo de Dados Completo

### 5.1 Inicialização do Modal

```
1. Usuário clica "Programar Disparo"
    ↓
2. ProgramarDisparoModal monta
    ↓
3. DispatchFormProvider inicializa
    ├─ Estado inicial: formData vazio
    ├─ projections = {}
    ├─ projectionReadiness = 'insufficient'
    └─ smartOptions = {} (será populado)
    ↓
4. Effect #1-8 executam
    ├─ Effect #1: Carrega smartOptions do histórico
    ├─ Effect #2: Valida BU
    ├─ Effect #3: Filtra jornadas por BU
    ├─ Effect #4: Atualiza custos de canal
    ├─ Effect #5: Atualiza custos de oferta
    ├─ Effect #6: Auto-preenche promocional
    ├─ Effect #7: Gera ActivityName
    └─ Effect #8: Calcula custo total
    ↓
5. Effect #9 (AI Projection) executa
    ├─ hasMinimumRequiredFields() = FALSE
    ├─ setProjectionReadiness('insufficient')
    ├─ setProjections({})
    └─ EARLY RETURN (não projeta)
    ↓
6. AIProjectionBlock renderiza
    ├─ getReadinessMessage() retorna warning
    ├─ Footer mostra: "⚠️ Preencha BU, Campanha, Canal, Volume"
    └─ Metrics cards em estado placeholder
```

### 5.2 Preenchimento Progressivo

#### Cenário A: Usuário Preenche BU

```
1. handleChange('bu', 'B2C')
    ↓
2. setFormData({ ...formData, bu: 'B2C' })
    ↓
3. Effect #9 re-executa (dependency: formData.bu)
    ├─ hasMinimumRequiredFields() = FALSE
    │   ├─ bu: ✅ 'B2C'
    │   ├─ segmento: ❌ undefined
    │   ├─ canal: ❌ undefined
    │   └─ baseVolume: ❌ undefined
    ├─ Console log: "Aguardando campos mínimos"
    │   └─ faltam: { segmento: true, canal: true, baseVolume: true }
    ├─ setProjectionReadiness('insufficient')
    └─ EARLY RETURN
    ↓
4. AIProjectionBlock re-renderiza
    └─ Footer: "⚠️ Preencha Campanha, Canal, Volume"
```

#### Cenário B: Usuário Preenche Campanha

```
1. handleChange('segmento', 'CRM')
    ↓
2. setFormData({ ...formData, segmento: 'CRM' })
    ↓
3. Effect #9 re-executa
    ├─ hasMinimumRequiredFields() = FALSE
    │   ├─ bu: ✅ 'B2C'
    │   ├─ segmento: ✅ 'CRM'
    │   ├─ canal: ❌ undefined
    │   └─ baseVolume: ❌ undefined
    ├─ setProjectionReadiness('insufficient')
    └─ EARLY RETURN
    ↓
4. AIProjectionBlock re-renderiza
    └─ Footer: "⚠️ Preencha Canal, Volume"
```

#### Cenário C: Usuário Preenche Canal

```
1. handleChange('canal', 'WhatsApp')
    ↓
2. setFormData({ ...formData, canal: 'WhatsApp' })
    ↓
3. Effect #4 (Custo Canal) executa
    ├─ CHANNEL_UNIT_COSTS['WhatsApp'] = 0.420
    └─ setFormData({ ...formData, custoUnitarioCanal: '0.420' })
    ↓
4. Effect #9 re-executa
    ├─ hasMinimumRequiredFields() = FALSE
    │   ├─ bu: ✅ 'B2C'
    │   ├─ segmento: ✅ 'CRM'
    │   ├─ canal: ✅ 'WhatsApp'
    │   └─ baseVolume: ❌ undefined (ÚLTIMO BLOQUEIO!)
    ├─ setProjectionReadiness('insufficient')
    └─ EARLY RETURN
    ↓
5. AIProjectionBlock re-renderiza
    └─ Footer: "⚠️ Preencha Volume para gerar projeções"
```

#### Cenário D: Usuário Preenche Volume (DESBLOQUEIO!)

```
1. handleChange('baseVolume', '7000')
    ↓
2. setFormData({ ...formData, baseVolume: '7000' })
    ↓
3. Effect #8 (Custo Total) executa
    ├─ volume = 7000
    ├─ custoUnitCanal = 0.420
    ├─ custoTotalCanal = 7000 × 0.420 = 2940.00
    └─ setFormData({ custoTotalCanal: '2940.00', ... })
    ↓
4. Effect #9 (AI PROJECTION) executa - AGORA SIM!
    ├─ hasMinimumRequiredFields() = TRUE ✅
    │   ├─ bu: ✅ 'B2C'
    │   ├─ segmento: ✅ 'CRM'
    │   ├─ canal: ✅ 'WhatsApp'
    │   └─ baseVolume: ✅ 7000 > 0
    │
    ├─ determineProjectionReadiness(formData)
    │   ├─ hasMinimum = true
    │   ├─ importantFields = [oferta, jornada, perfilCredito, parceiro].filter(Boolean)
    │   ├─ importantFields.length = 0 (nenhum campo importante)
    │   └─ RETURN 'partial'
    │
    ├─ setProjectionReadiness('partial')
    │
    ├─ activities.filter(a => a.raw != null) → activityRows
    │
    ├─ orchestrator = getAIOrchestrator()
    ├─ orchestrator.initialize(activityRows)
    │   └─ processActivities() → 451 atividades processadas
    │
    ├─ formInput = {
    │     bu: 'B2C',
    │     segmento: 'CRM',
    │     canal: 'WhatsApp',
    │     volume: 7000,
    │     jornada: undefined,
    │     oferta: undefined,
    │     ... (outros campos undefined)
    │   }
    │
    ├─ allProjections = orchestrator.projectAllFields(formInput)
    │   │
    │   ├─ findSimilarActivities(processedActivities, formInput, weights)
    │   │   ├─ Para cada activity no histórico:
    │   │   │   ├─ Score BU: activity.bu === 'B2C' ? 15 : 0
    │   │   │   ├─ Score Segmento: activity.segmento === 'CRM' ? 15 : 0
    │   │   │   ├─ Score Canal: smartCompare('WhatsApp', activity.canal) × 12
    │   │   │   ├─ Score Jornada: 0 (não preenchido)
    │   │   │   ├─ Score Oferta: 0 (não preenchido)
    │   │   │   └─ Total Score = BU + Segmento + Canal + ... + Temporal
    │   │   │
    │   │   ├─ Ordena por score descendente
    │   │   └─ Retorna matches com level (exact/high/medium/low/fallback)
    │   │
    │   ├─ selectBestMatchGroup(matches, minSampleSize=5)
    │   │   ├─ Tenta exact (score > 90): 0 matches
    │   │   ├─ Tenta high (score > 70): 12 matches
    │   │   ├─ Usa high se >= 5 matches
    │   │   └─ RETURN { matches: 12 matches, level: 'high' }
    │   │
    │   ├─ Console: [AIOrchestrator] Matching Results
    │   │   └─ { totalMatches: 451, selectedLevel: 'high', selectedMatches: 12 }
    │   │
    │   └─ projectAllMetrics(matches, level='high', formInput, allActivities)
    │       ├─ Para cada métrica (9 total):
    │       │   ├─ calculateMetricStats(matches, metric)
    │       │   │   └─ { mean, median, weightedMean, stdDev }
    │       │   ├─ determineProjectionMethod(metric, matches, formData)
    │       │   │   └─ 'correlation' (temos matches high)
    │       │   ├─ calculateProjectedValue(metric, stats, formData, method)
    │       │   │   └─ stats.weightedMean (ajustado por método)
    │       │   ├─ applyMetricSpecificAdjustments(metric, value, formData, stats)
    │       │   ├─ calculateConfidenceInterval(stats, projectedValue)
    │       │   ├─ generateCausalFactors(allActivities, metric, currentValues)
    │       │   ├─ extractSimilarCampaigns(matches, metric)
    │       │   └─ generateExplanation(metric, matchCount, level, factors, stats)
    │       │
    │       ├─ applyFunnelCalculations(projections, formData)
    │       │   ├─ volume = 7000
    │       │   ├─ taxaConv = projections.taxaConversao.projectedValue / 100
    │       │   ├─ baseAcionavel = volume × 0.78 = 5460
    │       │   ├─ propostas = volume × taxaConv = 7000 × 0.028 = 196
    │       │   ├─ aprovados = propostas × 0.65 = 127
    │       │   ├─ cartoes = aprovados × 0.85 = 108
    │       │   └─ cac = custoTotal / cartoes = 2940 / 108 = 27.22
    │       │
    │       └─ RETURN projections = {
    │             volume: { projectedValue: 7000, confidence: 100, ... },
    │             taxaConversao: { projectedValue: 2.8, confidence: 78, ... },
    │             baseAcionavel: { projectedValue: 5460, confidence: 75, ... },
    │             propostas: { projectedValue: 196, confidence: 78, ... },
    │             aprovados: { projectedValue: 127, confidence: 75, ... },
    │             cartoesGerados: { projectedValue: 108, confidence: 75, ... },
    │             cac: { projectedValue: 27.22, confidence: 70, ... },
    │             taxaEntrega: { projectedValue: 78.0, confidence: 72, ... },
    │             taxaAbertura: { projectedValue: 29.5, confidence: 68, ... }
    │           }
    │
    ├─ setProjections(allProjections.projections)
    │
    └─ Console: [AI Projection] Projeções computadas
        └─ { readiness: 'partial', totalMatches: 12, confidence: 75 }
    ↓
5. AIProjectionBlock re-renderiza
    ├─ readinessMessage = {
    │     text: 'Projeções básicas. Adicione Oferta e Jornada para melhorar',
    │     color: 'text-blue-400',
    │     bgColor: 'bg-blue-500/10',
    │     borderColor: 'border-blue-500/20',
    │     isWarning: false
    │   }
    │
    ├─ Footer mostra:
    │   ├─ "Baseado em 12 disparos similares"
    │   └─ "📊 Projeções básicas. Adicione Oferta e Jornada para melhorar"
    │
    └─ Metrics Grid exibe valores projetados:
        ├─ Volume: 7000
        ├─ Tx Conv: 2.8%
        ├─ Base Acion: 5460
        ├─ CAC: R$ 27.22
        ├─ Tx Entreg: 78.0%
        ├─ Tx Abert: 29.5%
        ├─ Propostas: 196
        ├─ Aprovados: 127
        └─ Cartões: 108
```

#### Cenário E: Usuário Adiciona Oferta (Melhora Precisão)

```
1. handleChange('oferta', 'Vibe')
    ↓
2. setFormData({ ...formData, oferta: 'Vibe' })
    ↓
3. Effect #5 (Custo Oferta) executa
    ├─ OFFER_UNIT_COSTS['Vibe'] = 2.00
    └─ setFormData({ custoUnitarioOferta: '2.00' })
    ↓
4. Effect #8 (Custo Total) re-executa
    ├─ custoTotalOferta = 7000 × 2.00 = 14000.00
    └─ custoTotalCampanha = 2940 + 14000 = 16940.00
    ↓
5. Effect #9 (AI Projection) re-executa
    ├─ hasMinimumRequiredFields() = TRUE ✅
    │
    ├─ determineProjectionReadiness(formData)
    │   ├─ importantFields = [oferta='Vibe'].filter(Boolean)
    │   ├─ importantFields.length = 1
    │   └─ RETURN 'good' (1-2 campos importantes)
    │
    ├─ setProjectionReadiness('good')
    │
    ├─ formInput agora inclui:
    │   └─ oferta: 'Vibe'
    │
    ├─ orchestrator.projectAllFields(formInput)
    │   ├─ findSimilarActivities() agora considera Oferta (8% weight)
    │   │   ├─ Score Oferta: smartCompare('Vibe', activity.oferta) × 8
    │   │   └─ Total Score aumenta para matches com Vibe
    │   │
    │   ├─ selectBestMatchGroup()
    │   │   └─ Pode retornar matches mais precisos (exact/high)
    │   │
    │   └─ Projeções refinadas:
    │       ├─ taxaConversao pode mudar (Vibe afeta conversão)
    │       └─ CAC recalculado com custo oferta
    │
    └─ Console: confidence agora 82%
    ↓
6. AIProjectionBlock re-renderiza
    └─ Footer: "📊 Projeções com boa confiança" (verde)
```

#### Cenário F: Usuário Adiciona Jornada + Parceiro (Excellent!)

```
1. handleChange('jornada', 'Aquisição')
2. handleChange('parceiro', 'Afinz')
3. handleChange('perfilCredito', 'Whitelist')
    ↓
4. Effect #9 re-executa
    ├─ determineProjectionReadiness(formData)
    │   ├─ importantFields = ['Vibe', 'Aquisição', 'Whitelist'].filter(Boolean)
    │   ├─ importantFields.length = 3
    │   └─ RETURN 'excellent' (3+ campos importantes)
    │
    ├─ formInput agora 7 dimensões preenchidas
    │
    ├─ findSimilarActivities()
    │   └─ Matching multidimensional muito restritivo
    │       └─ Retorna apenas campanhas MUITO similares
    │
    ├─ selectBestMatchGroup()
    │   └─ { level: 'exact', matches: 5 } (matching perfeito!)
    │
    └─ Confidence: 91%
    ↓
5. AIProjectionBlock
    └─ Footer: "📊 Projeções de alta precisão" (verde esmeralda)
```

---

## 6. Lógica de Validação

### 6.1 Função hasMinimumRequiredFields()

**Localização:** `src/components/dispatch/context/DispatchFormContext.tsx:203-221`

```typescript
// Campos CRÍTICOS necessários para projeção válida
const MINIMUM_REQUIRED_FIELDS = {
    bu: true,           // BU é obrigatório (15% weight no matching)
    segmento: true,     // Segmento/Campanha é obrigatório (15% weight)
    canal: true,        // Canal afeta custos (12% weight) - NOVO REQUISITO
    baseVolume: true    // Volume é o FATOR X - NOVO REQUISITO
} as const;

/**
 * Valida se os campos mínimos necessários para projeção estão preenchidos
 *
 * Rationale:
 * - BU: Define universo de dados (B2C vs B2B2C vs Plurix)
 * - Segmento: Define tipo de campanha (CRM, Leads, Retenção, etc)
 * - Canal: Define custo unitário e comportamento de entrega/abertura
 * - Volume: Define escala e permite cálculos absolutos (propostas, cartões)
 *
 * Sem esses 4 campos, projeções seriam estatisticamente inválidas.
 */
function hasMinimumRequiredFields(formData: any): boolean {
    return !!(
        formData.bu &&                        // BU não pode ser vazio/null/undefined
        formData.segmento &&                  // Segmento não pode ser vazio/null/undefined
        formData.canal &&                     // Canal não pode ser vazio/null/undefined - BLOQUEIO CRÍTICO
        formData.baseVolume &&                // Volume não pode ser vazio/null/undefined - BLOQUEIO CRÍTICO
        Number(formData.baseVolume) > 0       // Volume deve ser > 0 (não aceita 0 ou negativo)
    );
}
```

**Lógica Detalhada:**

1. **Operador `!!` (Double Negation):**
   - Converte resultado para boolean verdadeiro
   - `!!value` retorna `true` se value é truthy, `false` se falsy

2. **Operador `&&` (Logical AND):**
   - Retorna `true` apenas se TODOS os campos forem truthy
   - Se qualquer campo for `false`, `null`, `undefined`, `''`, `0` → retorna `false`

3. **Validação Específica de Volume:**
   - `formData.baseVolume` verifica se existe
   - `Number(formData.baseVolume) > 0` garante que é número positivo
   - Bloqueia: `''`, `'0'`, `'-100'`, `null`, `undefined`

**Exemplos de Retorno:**

```typescript
// ❌ FALSE - BU faltando
hasMinimumRequiredFields({
    bu: '',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '7000'
}) // → false

// ❌ FALSE - Canal faltando
hasMinimumRequiredFields({
    bu: 'B2C',
    segmento: 'CRM',
    canal: '',
    baseVolume: '7000'
}) // → false

// ❌ FALSE - Volume = 0
hasMinimumRequiredFields({
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '0'
}) // → false (Number('0') > 0 = false)

// ✅ TRUE - Todos os 4 campos OK
hasMinimumRequiredFields({
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '7000'
}) // → true
```

### 6.2 Função determineProjectionReadiness()

**Localização:** `src/components/dispatch/context/DispatchFormContext.tsx:223-242`

```typescript
// Tipo para níveis de qualidade de projeção
type ProjectionReadiness = 'insufficient' | 'partial' | 'good' | 'excellent';

/**
 * Determina o nível de qualidade/confiança das projeções baseado nos campos preenchidos
 *
 * Algoritmo:
 * 1. Valida campos mínimos (BU, Segmento, Canal, Volume)
 * 2. Se não passar → 'insufficient'
 * 3. Se passar → conta campos importantes preenchidos
 * 4. Retorna nível baseado em quantidade de campos importantes
 *
 * Campos Importantes (não bloqueiam, mas aumentam precisão):
 * - Oferta (8% weight): Afeta conversão e custo
 * - Jornada (10% weight): Afeta comportamento do funil
 * - Perfil Crédito (10% weight): Afeta taxa de aprovação
 * - Parceiro (5% weight): Afeta disponibilidade e conversão
 */
function determineProjectionReadiness(formData: any): ProjectionReadiness {
    // GATE 1: Validação de campos mínimos
    const hasMinimum = hasMinimumRequiredFields(formData);

    if (!hasMinimum) {
        return 'insufficient'; // BLOQUEIA - não projeta nada
    }

    // GATE 2: Contagem de campos importantes
    const importantFields = [
        formData.oferta,        // 8% weight no matching
        formData.jornada,       // 10% weight
        formData.perfilCredito, // 10% weight
        formData.parceiro       // 5% weight
    ].filter(Boolean); // Remove undefined/null/empty

    const importantCount = importantFields.length;

    // GATE 3: Classificação por quantidade de campos
    if (importantCount >= 3) {
        return 'excellent'; // 4 críticos + 3-4 importantes = 7-8 dimensões
    }

    if (importantCount >= 1) {
        return 'good'; // 4 críticos + 1-2 importantes = 5-6 dimensões
    }

    return 'partial'; // Apenas 4 críticos = mínimo para projetar
}
```

**Tabela de Decisão:**

| hasMinimum | importantCount | Readiness | Dimensões Totais | Confidence Esperado |
|------------|----------------|-----------|------------------|---------------------|
| ❌ FALSE | - | insufficient | - | 0% (não projeta) |
| ✅ TRUE | 0 | partial | 4 | 60-70% |
| ✅ TRUE | 1 | good | 5 | 70-80% |
| ✅ TRUE | 2 | good | 6 | 75-85% |
| ✅ TRUE | 3 | excellent | 7 | 85-90% |
| ✅ TRUE | 4 | excellent | 8 | 90-95% |

**Exemplos de Classificação:**

```typescript
// insufficient - falta Canal
determineProjectionReadiness({
    bu: 'B2C',
    segmento: 'CRM',
    canal: '',
    baseVolume: '7000'
}) // → 'insufficient'

// partial - apenas campos críticos
determineProjectionReadiness({
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '7000'
}) // → 'partial'

// good - críticos + 1 importante (Oferta)
determineProjectionReadiness({
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '7000',
    oferta: 'Vibe'
}) // → 'good'

// good - críticos + 2 importantes (Oferta + Jornada)
determineProjectionReadiness({
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '7000',
    oferta: 'Vibe',
    jornada: 'Aquisição'
}) // → 'good'

// excellent - críticos + 3 importantes (Oferta + Jornada + Perfil)
determineProjectionReadiness({
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    baseVolume: '7000',
    oferta: 'Vibe',
    jornada: 'Aquisição',
    perfilCredito: 'Whitelist'
}) // → 'excellent'
```

### 6.3 Effect #9 - AI Projection Trigger

**Localização:** `src/components/dispatch/context/DispatchFormContext.tsx:262-360`

```typescript
// Effect #9 - Trigger AI Projections
useEffect(() => {
    // ==========================================
    // GATE 1: VALIDAÇÃO DE CAMPOS MÍNIMOS
    // ==========================================
    if (!hasMinimumRequiredFields(formData)) {
        // LOG detalhado para debugging
        console.log(
            '%c[AI Projection] Aguardando campos mínimos',
            'color: #F59E0B; font-weight: bold;',
            {
                faltam: {
                    bu: !formData.bu,
                    segmento: !formData.segmento,
                    canal: !formData.canal,
                    baseVolume: !formData.baseVolume || Number(formData.baseVolume) === 0
                },
                mensagem: 'Preencha BU, Segmento, Canal e Volume para gerar projeções'
            }
        );

        // Limpar projeções antigas (se houver)
        setProjections({});

        // Marcar como insufficient
        setProjectionReadiness('insufficient');

        // EARLY RETURN - não executa projeção
        return;
    }

    // ==========================================
    // GATE 2: CALCULAR READINESS
    // ==========================================
    const readiness = determineProjectionReadiness(formData);
    setProjectionReadiness(readiness);

    // ==========================================
    // GATE 3: VALIDAR HISTÓRICO
    // ==========================================
    if (activities.length === 0) {
        console.warn('[AI Projection] Sem atividades históricas');
        return;
    }

    // ==========================================
    // PROJEÇÃO - Só chega aqui se passar todas as gates
    // ==========================================
    try {
        // 1. Converter activities para formato ML
        const activityRows = activities
            .filter(a => a.raw != null)
            .map(a => ({
                ...a.raw,
                'Data de Disparo': a.raw['Data de Disparo'] || a.dataDisparo?.toISOString().split('T')[0],
                'BU': a.raw.BU || a.bu,
                'Segmento': a.raw.Segmento || a.segmento
            } as any));

        if (activityRows.length === 0) {
            console.warn('[DispatchContext] No valid activities with .raw data');
            return;
        }

        // 2. Inicializar Orchestrator (singleton)
        const orchestrator = getAIOrchestrator({
            temporalWindow: 90,    // Considerar últimos 90 dias
            minSampleSize: 5       // Mínimo 5 matches para projetar
        });

        orchestrator.initialize(activityRows);

        // 3. Montar input para ML (lowercase keys!)
        const formInput: any = {
            bu: formData.bu,
            segmento: formData.segmento || '',
            canal: formData.canal || undefined,
            jornada: formData.jornada || undefined,
            perfilCredito: formData.perfilCredito || undefined,
            oferta: formData.oferta || undefined,
            promocional: formData.promocional || undefined,
            parceiro: formData.parceiro || undefined,
            subgrupo: formData.subgrupo || undefined,
            etapaAquisicao: formData.etapaAquisicao || undefined,
            produto: formData.produto || undefined,
            volume: formData.baseVolume ? Number(formData.baseVolume) : undefined
        };

        // 4. Projetar todas as métricas
        const allProjections = orchestrator.projectAllFields(formInput);

        // 5. Salvar projeções no estado
        setProjections(allProjections.projections);

        // 6. LOG de sucesso
        console.log(
            '%c[AI Projection] Projeções computadas',
            'color: #22C55E; font-weight: bold;',
            {
                readiness,
                input: formInput,
                totalMatches: allProjections.totalSampleSize,
                confidence: allProjections.overallConfidence
            }
        );

    } catch (error) {
        console.error('[DispatchContext] AI Projection Error:', error);
        setProjections({});
        setProjectionReadiness('insufficient');
    }
}, [
    // Dependencies: Re-executa quando qualquer campo mudar
    formData.bu,
    formData.segmento,
    formData.canal,
    formData.jornada,
    formData.perfilCredito,
    formData.oferta,
    formData.parceiro,
    formData.subgrupo,
    formData.etapaAquisicao,
    formData.produto,
    formData.baseVolume,
    activities
]);
```

**Diagrama de Fluxo do Effect:**

```
START Effect #9
    │
    ├─ hasMinimumRequiredFields(formData)
    │   ├─ FALSE → Log "Aguardando campos mínimos"
    │   │          setProjections({})
    │   │          setProjectionReadiness('insufficient')
    │   │          EARLY RETURN ❌
    │   │
    │   └─ TRUE → Continua ✅
    │
    ├─ determineProjectionReadiness(formData)
    │   └─ setProjectionReadiness(readiness)
    │
    ├─ activities.length === 0
    │   ├─ TRUE → Log "Sem atividades históricas"
    │   │         RETURN ❌
    │   │
    │   └─ FALSE → Continua ✅
    │
    ├─ TRY
    │   ├─ Converter activities → activityRows
    │   │   └─ .filter(a => a.raw != null)
    │   │
    │   ├─ activityRows.length === 0
    │   │   └─ TRUE → RETURN ❌
    │   │
    │   ├─ orchestrator = getAIOrchestrator()
    │   ├─ orchestrator.initialize(activityRows)
    │   ├─ formInput = { bu, segmento, canal, volume, ... }
    │   ├─ allProjections = orchestrator.projectAllFields(formInput)
    │   │   └─ Retorna 9 projeções
    │   │
    │   ├─ setProjections(allProjections.projections) ✅
    │   └─ Log "Projeções computadas" ✅
    │
    └─ CATCH (error)
        ├─ Log error
        ├─ setProjections({})
        └─ setProjectionReadiness('insufficient')
```

---

## 7. Estados de Readiness

### 7.1 Tabela Completa de Estados

| Estado | Trigger | UI Background | UI Text Color | Badge Icon | Sample Text | Behavior |
|--------|---------|---------------|---------------|------------|-------------|----------|
| **insufficient** | < 4 campos críticos | `bg-amber-500/10` | `text-amber-400` | ⚠️ | N/A | Bloqueia projeção, mostra warning |
| **partial** | 4 críticos, 0 importantes | `bg-blue-500/10` | `text-blue-400` | 📊 | "Baseado em X disparos" | Projeta com confiança básica |
| **good** | 4 críticos, 1-2 importantes | `bg-emerald-500/10` | `text-emerald-400` | 📊 | "Baseado em X disparos" | Projeta com boa confiança |
| **excellent** | 4 críticos, 3+ importantes | `bg-emerald-500/10` | `text-emerald-400` | 📊 | "Baseado em X disparos" | Projeta com alta precisão |

### 7.2 Mensagens de Readiness

**Localização:** `src/components/dispatch/blocks/AIProjectionBlock.tsx:28-76`

```typescript
const getReadinessMessage = () => {
    // Identificar campos críticos faltantes
    const missing: string[] = [];
    if (!formData.bu) missing.push('BU');
    if (!formData.segmento) missing.push('Campanha');
    if (!formData.canal) missing.push('Canal');
    if (!formData.baseVolume || Number(formData.baseVolume) === 0) missing.push('Volume');

    // Se faltam campos críticos, mostrar mensagem de warning
    if (missing.length > 0) {
        return {
            text: `Preencha ${missing.join(', ')} para gerar projeções`,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            isWarning: true // Flag para renderização especial
        };
    }

    // Campos críticos OK - mostrar status baseado em readiness
    switch (projectionReadiness) {
        case 'partial':
            return {
                text: 'Projeções básicas. Adicione Oferta e Jornada para melhorar',
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/10',
                borderColor: 'border-blue-500/20',
                isWarning: false
            };

        case 'good':
            return {
                text: 'Projeções com boa confiança',
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-500/10',
                borderColor: 'border-emerald-500/20',
                isWarning: false
            };

        case 'excellent':
            return {
                text: 'Projeções de alta precisão',
                color: 'text-emerald-400',
                bgColor: 'bg-emerald-500/10',
                borderColor: 'border-emerald-500/20',
                isWarning: false
            };

        default:
            return null;
    }
};
```

### 7.3 Renderização Condicional do Footer

```typescript
<div className="mt-3 text-[8px] text-center border-t border-indigo-500/10 pt-2">
    {/* Se há erro de validação, mostrar em destaque */}
    {readinessMessage?.isWarning ? (
        // MODO WARNING (insufficient)
        <div className={`px-2 py-1 rounded ${readinessMessage.bgColor} border ${readinessMessage.borderColor}`}>
            <span className={`${readinessMessage.color} font-bold`}>
                ⚠️ {readinessMessage.text}
            </span>
        </div>
    ) : (
        // MODO NORMAL (partial/good/excellent)
        <>
            {/* Linha 1: Sample Size */}
            <div>
                {sampleSize > 0 ? (
                    <span className="text-indigo-400/50">
                        Baseado em <span className="font-bold text-indigo-400">{sampleSize}</span> disparos similares
                    </span>
                ) : (
                    <span className="text-indigo-400/50">Processando projeções...</span>
                )}
            </div>

            {/* Linha 2: Readiness Badge */}
            {readinessMessage && (
                <div className={`mt-1.5 px-2 py-0.5 rounded ${readinessMessage.bgColor} border ${readinessMessage.borderColor}`}>
                    <span className={`${readinessMessage.color} text-[7px] font-medium`}>
                        📊 {readinessMessage.text}
                    </span>
                </div>
            )}
        </>
    )}
</div>
```

---

## 8. Componentes Modificados

### 8.1 DispatchFormContext.tsx

**Arquivo:** `src/components/dispatch/context/DispatchFormContext.tsx`

**Linhas Modificadas:**
- Linhas 203-242: Adicionadas funções de validação
- Linha 247: Adicionado estado `projectionReadiness`
- Linha 255: Adicionado `projectionReadiness` à interface
- Linhas 262-360: Modificado Effect #9 com validação
- Linha 372: Passado `projectionReadiness` no Provider

**Mudanças:**

1. **Constantes de Validação** (linhas 203-210)
```typescript
const MINIMUM_REQUIRED_FIELDS = {
    bu: true,
    segmento: true,
    canal: true,        // NOVO
    baseVolume: true    // NOVO
} as const;
```

2. **Função hasMinimumRequiredFields()** (linhas 213-221)
```typescript
function hasMinimumRequiredFields(formData: any): boolean {
    return !!(
        formData.bu &&
        formData.segmento &&
        formData.canal &&                    // NOVO BLOQUEIO
        formData.baseVolume &&               // NOVO BLOQUEIO
        Number(formData.baseVolume) > 0
    );
}
```

3. **Type ProjectionReadiness** (linha 224)
```typescript
type ProjectionReadiness = 'insufficient' | 'partial' | 'good' | 'excellent';
```

4. **Função determineProjectionReadiness()** (linhas 226-242)
```typescript
function determineProjectionReadiness(formData: any): ProjectionReadiness {
    const hasMinimum = hasMinimumRequiredFields(formData);

    if (!hasMinimum) return 'insufficient';

    const importantFields = [
        formData.oferta,
        formData.jornada,
        formData.perfilCredito,
        formData.parceiro
    ].filter(Boolean).length;

    if (importantFields >= 3) return 'excellent';
    if (importantFields >= 1) return 'good';
    return 'partial';
}
```

5. **Estado projectionReadiness** (linha 247)
```typescript
const [projectionReadiness, setProjectionReadiness] = useState<ProjectionReadiness>('insufficient');
```

6. **Interface DispatchFormContextValue** (linha 255)
```typescript
interface DispatchFormContextValue {
    // ... campos existentes
    projections: Record<string, FieldProjection>;
    projectionReadiness: ProjectionReadiness;  // NOVO
    // ... resto
}
```

7. **Effect #9 Modificado** (linhas 262-360)
```typescript
useEffect(() => {
    // VALIDAÇÃO DE CAMPOS MÍNIMOS - NOVO BLOQUEIO!
    if (!hasMinimumRequiredFields(formData)) {
        console.log('%c[AI Projection] Aguardando campos mínimos', ...);
        setProjections({});
        setProjectionReadiness('insufficient');
        return;  // EARLY RETURN
    }

    // Calcular readiness
    const readiness = determineProjectionReadiness(formData);
    setProjectionReadiness(readiness);

    // ... código existente de projeção
}, [...]);
```

8. **Provider Value** (linha 372)
```typescript
<DispatchFormContext.Provider value={{
    formData,
    handleChange,
    errors,
    smartOptions,
    projections,
    projectionReadiness,  // NOVO
    // ... resto
}}>
```

### 8.2 AIProjectionBlock.tsx

**Arquivo:** `src/components/dispatch/blocks/AIProjectionBlock.tsx`

**Linhas Modificadas:**
- Linha 22: Importado `projectionReadiness` do context
- Linhas 28-76: Adicionada função `getReadinessMessage()`
- Linha 78: Chamada `getReadinessMessage()`
- Linhas 141-172: Footer modificado com renderização condicional

**Mudanças:**

1. **Import projectionReadiness** (linha 22)
```typescript
const { projections, formData, projectionReadiness } = useDispatchForm();
```

2. **Função getReadinessMessage()** (linhas 28-76)
```typescript
const getReadinessMessage = () => {
    // Identificar campos críticos faltantes
    const missing: string[] = [];
    if (!formData.bu) missing.push('BU');
    if (!formData.segmento) missing.push('Campanha');
    if (!formData.canal) missing.push('Canal');
    if (!formData.baseVolume || Number(formData.baseVolume) === 0) missing.push('Volume');

    // Se faltam campos críticos, mostrar mensagem em vermelho/amarelo
    if (missing.length > 0) {
        return {
            text: `Preencha ${missing.join(', ')} para gerar projeções`,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            isWarning: true
        };
    }

    // Campos críticos OK - mostrar status baseado em readiness
    switch (projectionReadiness) {
        case 'partial':
            return {
                text: 'Projeções básicas. Adicione Oferta e Jornada para melhorar',
                color: 'text-blue-400',
                bgColor: 'bg-blue-500/10',
                borderColor: 'border-blue-500/20',
                isWarning: false
            };
        // ... outros casos
    }
};
```

3. **Footer Modificado** (linhas 141-172)
```typescript
<div className="mt-3 text-[8px] text-center border-t border-indigo-500/10 pt-2">
    {/* Se há erro de validação, mostrar em destaque */}
    {readinessMessage?.isWarning ? (
        <div className={`px-2 py-1 rounded ${readinessMessage.bgColor} border ${readinessMessage.borderColor}`}>
            <span className={`${readinessMessage.color} font-bold`}>
                ⚠️ {readinessMessage.text}
            </span>
        </div>
    ) : (
        <>
            {/* Normal: mostrar sample size + readiness message */}
            <div>
                {sampleSize > 0 ? (
                    <span className="text-indigo-400/50">
                        Baseado em <span className="font-bold text-indigo-400">{sampleSize}</span> disparos similares
                    </span>
                ) : (
                    <span className="text-indigo-400/50">Processando projeções...</span>
                )}
            </div>

            {/* Mostrar status de readiness se houver */}
            {readinessMessage && (
                <div className={`mt-1.5 px-2 py-0.5 rounded ${readinessMessage.bgColor} border ${readinessMessage.borderColor}`}>
                    <span className={`${readinessMessage.color} text-[7px] font-medium`}>
                        📊 {readinessMessage.text}
                    </span>
                </div>
            )}
        </>
    )}
</div>
```

### 8.3 intelligentSuggestions.ts

**Arquivo:** `src/utils/intelligentSuggestions.ts`

**Estado:** ✅ ENGINE 2 já foi removido anteriormente

**Conteúdo Atual:**
- ENGINE 1: `suggestFieldsBasedOnHistory()` - Sugestões de campos
- ENGINE 1: `generateSuggestionsForField()` - Gera sugestões contextuais
- Nota: ENGINE 2 foi removido (usar AIOrchestrator)

---

## 9. Pipeline de ML

### 9.1 AIOrchestrator

**Arquivo:** `src/services/ml/AIOrchestrator.ts`

**Função Principal:** `projectAllFields(formData: FormDataInput)`

**Passos:**

1. **findSimilarActivities()**
   - Calcula score de similaridade para cada atividade histórica
   - 11 dimensões consideradas
   - Retorna lista de matches com scores

2. **selectBestMatchGroup()**
   - Agrupa matches por nível (exact/high/medium/low)
   - Seleciona melhor grupo com mínimo de amostras
   - Retorna matches selecionados + nível

3. **projectAllMetrics()**
   - Para cada métrica (9 total)
   - Calcula projeção baseada nos matches
   - Retorna 9 FieldProjection objects

### 9.2 SimilarityEngine

**Arquivo:** `src/services/ml/similarityEngine.ts`

**11 Dimensões de Matching:**

| Dimensão | Weight | Função de Comparação |
|----------|--------|----------------------|
| BU | 15% | Exact match |
| Segmento | 15% | smartCompare (fuzzy) |
| Canal | 12% | smartCompare (fuzzy) |
| Jornada | 10% | smartCompare (fuzzy) |
| Perfil_Credito | 10% | smartCompare (fuzzy) |
| Oferta | 8% | smartCompare (fuzzy) |
| Promocional | 5% | smartCompare (fuzzy) |
| Parceiro | 5% | smartCompare (fuzzy) |
| Subgrupo | 5% | smartCompare (fuzzy) |
| Etapa_Aquisicao | 5% | smartCompare (fuzzy) |
| Produto | 5% | smartCompare (fuzzy) |
| Temporal | 5% | exponentialDecay |

**Algoritmo de Score:**

```typescript
for each activity in processedActivities:
    score = 0

    // Dimensões categóricas (95% do peso)
    if activity.bu === formData.bu:
        score += 15

    if smartCompare(activity.segmento, formData.segmento) > 0.8:
        score += 15 * similarityRatio

    if smartCompare(activity.canal, formData.canal) > 0.8:
        score += 12 * similarityRatio

    // ... outras 8 dimensões

    // Temporal decay (5% do peso)
    daysAgo = (today - activity.dispatchDate) / (1000 * 60 * 60 * 24)
    temporalScore = exponentialDecay(daysAgo, halfLife=45)
    score += 5 * temporalScore

    // Classificar por nível
    if score >= 90: level = 'exact'
    elif score >= 70: level = 'high'
    elif score >= 50: level = 'medium'
    elif score >= 30: level = 'low'
    else: level = 'fallback'

    matches.push({ activity, score, level })
```

**Função smartCompare():**

```typescript
function smartCompare(a: string, b: string): number {
    if (!a || !b) return 0;

    // Normalizar strings
    const normalized1 = normalizeString(a); // lowercase, remove acentos
    const normalized2 = normalizeString(b);

    // Exact match
    if (normalized1 === normalized2) return 1.0;

    // Substring match
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
        return 0.9;
    }

    // Levenshtein distance (fuzzy match)
    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    const similarity = 1 - (distance / maxLen);

    return similarity > 0.6 ? similarity : 0;
}
```

### 9.3 PredictionEngine

**Arquivo:** `src/services/ml/predictionEngine.ts`

**Função:** `projectAllMetrics(matches, level, formData, allActivities)`

**Para Cada Métrica:**

1. **calculateMetricStats()**
   - Calcula mean, median, weightedMean, stdDev
   - Considera todos os matches

2. **determineProjectionMethod()**
   - `causal`: matches >= 30 e métrica causal
   - `correlation`: matches high/exact
   - `frequency`: matches < 30
   - `fallback`: poucos matches

3. **calculateProjectedValue()**
   - Baseado no método escolhido
   - Aplica ajustes específicos da métrica

4. **applyMetricSpecificAdjustments()**
   - Volume: usa formData.baseVolume
   - Base Acionável: volume × 0.78
   - CAC: custoTotal / cartões
   - Taxas: limitadas a 0-100%

5. **applyFunnelCalculations()**
   - Recalcula métricas interdependentes
   - Propostas = volume × taxaConv
   - Aprovados = propostas × 0.65
   - Cartões = aprovados × 0.85
   - CAC = custo / cartões

**Resultado:** 9 FieldProjection objects

---

## 10. Logging e Debugging

### 10.1 Console Logs

**3 Níveis de Log:**

1. **Aguardando Campos** (Amarelo)
```
%c[AI Projection] Aguardando campos mínimos
color: #F59E0B; font-weight: bold;
{
  faltam: {
    bu: false,
    segmento: false,
    canal: true,
    baseVolume: true
  },
  mensagem: 'Preencha BU, Segmento, Canal e Volume para gerar projeções'
}
```

2. **Matching Results** (Azul)
```
%c[AIOrchestrator] Matching Results
color: #3B82F6; font-weight: bold;
{
  totalMatches: 451,
  selectedLevel: 'high',
  selectedMatches: 12,
  byLevel: { exact: 0, high: 12, medium: 143, low: 296, fallback: 0 },
  topMatches: [
    { score: 87.3, level: 'high', matched: 'BU, Segmento, Canal, Temporal' },
    { score: 85.1, level: 'high', matched: 'BU, Segmento, Canal, Temporal' },
    { score: 82.9, level: 'high', matched: 'BU, Segmento, Canal, Temporal' }
  ]
}
```

3. **Projeções Computadas** (Verde)
```
%c[AI Projection] Projeções computadas
color: #22C55E; font-weight: bold;
{
  readiness: 'partial',
  input: {
    bu: 'B2C',
    segmento: 'CRM',
    canal: 'WhatsApp',
    volume: 7000,
    jornada: undefined,
    oferta: undefined,
    ...
  },
  totalMatches: 12,
  confidence: 75
}
```

### 10.2 Debugging Checklist

**Se projeções não aparecem:**

1. Abrir DevTools Console (F12)
2. Procurar por `[AI Projection]`
3. Verificar se há log "Aguardando campos mínimos"
   - Se sim: preencher campos faltantes
4. Verificar se há log "Matching Results"
   - Se não: problema na inicialização do orchestrator
5. Verificar `totalMatches`
   - Se 0: sem dados históricos correspondentes
6. Verificar `selectedMatches`
   - Se < 5: poucos matches para projetar

**Se projeções estão erradas:**

1. Verificar `readiness` no log
   - `partial`: adicionar mais campos
2. Verificar `confidence`
   - Se < 60%: projeção de baixa confiança
3. Verificar `selectedLevel`
   - `fallback`: matching muito fraco
4. Verificar `topMatches`
   - Ver quais dimensões foram matched

---

## 11. Testes e Validação

### 11.1 Casos de Teste

**Teste 1: Modal Vazio**
```
Input: {}
Expected:
  - projectionReadiness = 'insufficient'
  - projections = {}
  - Footer: "⚠️ Preencha BU, Campanha, Canal, Volume"
  - Console: "Aguardando campos mínimos"
```

**Teste 2: Apenas BU**
```
Input: { bu: 'B2C' }
Expected:
  - projectionReadiness = 'insufficient'
  - Footer: "⚠️ Preencha Campanha, Canal, Volume"
```

**Teste 3: BU + Campanha**
```
Input: { bu: 'B2C', segmento: 'CRM' }
Expected:
  - projectionReadiness = 'insufficient'
  - Footer: "⚠️ Preencha Canal, Volume"
```

**Teste 4: BU + Campanha + Canal (sem Volume)**
```
Input: { bu: 'B2C', segmento: 'CRM', canal: 'WhatsApp' }
Expected:
  - projectionReadiness = 'insufficient'
  - Footer: "⚠️ Preencha Volume"
```

**Teste 5: BU + Campanha + Canal + Volume = 0**
```
Input: { bu: 'B2C', segmento: 'CRM', canal: 'WhatsApp', baseVolume: '0' }
Expected:
  - projectionReadiness = 'insufficient'
  - Footer: "⚠️ Preencha Volume" (0 não é válido)
```

**Teste 6: Campos Mínimos OK**
```
Input: { bu: 'B2C', segmento: 'CRM', canal: 'WhatsApp', baseVolume: '7000' }
Expected:
  - projectionReadiness = 'partial'
  - projections com 9 métricas
  - Footer: "📊 Projeções básicas. Adicione Oferta e Jornada para melhorar"
  - Console: "Projeções computadas"
```

**Teste 7: Campos Mínimos + 1 Importante**
```
Input: { ... campos mínimos, oferta: 'Vibe' }
Expected:
  - projectionReadiness = 'good'
  - Footer: "📊 Projeções com boa confiança"
```

**Teste 8: Campos Mínimos + 3 Importantes**
```
Input: { ... campos mínimos, oferta: 'Vibe', jornada: 'Aquisição', perfilCredito: 'Whitelist' }
Expected:
  - projectionReadiness = 'excellent'
  - Footer: "📊 Projeções de alta precisão"
```

### 11.2 Validação de Métricas

**Projeções Esperadas para:**
- BU: B2C
- Campanha: CRM
- Canal: WhatsApp
- Volume: 7000

| Métrica | Valor Esperado | Lógica |
|---------|---------------|--------|
| Volume | 7000 | Input do usuário |
| Tx Conv | 2.0-5.0% | Histórico WhatsApp + CRM |
| Base Acion | 5460 | 7000 × 0.78 |
| Propostas | 140-350 | 7000 × (2-5%) |
| Aprovados | 91-227 | Propostas × 0.65 |
| Cartões | 77-193 | Aprovados × 0.85 |
| CAC | R$ 15-38 | Custo / Cartões |
| Tx Entrega | 70-85% | Histórico WhatsApp |
| Tx Abertura | 25-40% | Histórico WhatsApp |

**Custo Esperado:**
- C.U. Canal (WhatsApp): R$ 0,420
- Custo Total Canal: 7000 × 0,420 = R$ 2.940,00
- C.U. Oferta (Vibe): R$ 2,00
- Custo Total Oferta: 7000 × 2,00 = R$ 14.000,00
- Custo Total Campanha: R$ 16.940,00

---

## 12. Casos de Uso

### 12.1 Operador Experiente

**Perfil:** Sabe exatamente o que quer disparar

**Fluxo:**
1. Abre modal
2. Preenche rapidamente: BU → Campanha → Canal → Volume
3. Sistema projeta imediatamente (readiness: partial)
4. Adiciona Oferta
5. Readiness muda para good
6. Adiciona Jornada + Perfil
7. Readiness muda para excellent
8. Confirma disparo com alta confiança

**Tempo:** 30-60 segundos

### 12.2 Operador Iniciante

**Perfil:** Está aprendendo, não sabe todos os campos

**Fluxo:**
1. Abre modal
2. Preenche BU
3. Vê warning: "Preencha Campanha, Canal, Volume"
4. Preenche Campanha
5. Vê warning: "Preencha Canal, Volume"
6. Preenche Canal
7. Vê warning: "Preenche Volume"
8. Sistema ENSINA que esses 4 campos são críticos
9. Preenche Volume
10. Sistema projeta! (educação concluída)
11. Vê badge: "Adicione Oferta e Jornada para melhorar"
12. Aprende que pode melhorar preenchendo mais campos

**Benefício:** Sistema educa o usuário sobre campos importantes

### 12.3 Análise de Cenário

**Perfil:** Quer testar diferentes combinações

**Fluxo:**
1. Preenche campos mínimos
2. Vê projeções (readiness: partial)
3. Muda Canal WhatsApp → SMS
4. Projeções atualizam instantaneamente
5. Compara CAC: WhatsApp R$ 27 vs SMS R$ 6
6. Adiciona Oferta "Vibe"
7. Projeções refinam (readiness: good)
8. Compara Tx Conv: Padrão 2.8% vs Vibe 3.5%
9. Decide melhor combinação
10. Confirma disparo

**Benefício:** Feedback imediato para tomada de decisão

---

## 13. Performance e Otimizações

### 13.1 Singleton Orchestrator

**Problema:** Re-inicializar orchestrator a cada mudança de campo é pesado

**Solução:** Singleton + separação initialize/project

```typescript
// ANTES (lento - re-init a cada mudança)
useEffect(() => {
    const orchestrator = new AIOrchestrator(); // NOVO OBJETO a cada vez
    orchestrator.initialize(activities);      // PESADO (~500ms)
    orchestrator.projectAllFields(formData);  // Rápido (~50ms)
}, [formData.bu, formData.canal, ...]);

// DEPOIS (rápido - init 1×, project N×)
const orchestratorRef = useRef<AIOrchestrator | null>(null);

useEffect(() => {
    // Inicializar apenas 1× quando activities carregam
    if (!orchestratorRef.current && activities.length > 0) {
        orchestratorRef.current = getAIOrchestrator();
        orchestratorRef.current.initialize(activityRows); // PESADO (~500ms) - 1× only
    }
}, [activities]);

useEffect(() => {
    if (!orchestratorRef.current) return;

    // Projetar N× quando form muda
    orchestratorRef.current.projectAllFields(formData); // RÁPIDO (~50ms) - N×
}, [formData.bu, formData.canal, ...]);
```

**Ganho:** 10× mais rápido para re-projeções

### 13.2 Memoization de SmartOptions

**Problema:** Recalcular sugestões de histórico a cada render

**Solução:** useMemo nos components

```typescript
// ProductOfferBlock.tsx
const produtosOptions = useMemo<ComboboxOption[]>(() => {
    if (smartOptions.produtos.length > 0) {
        return smartOptions.produtos;
    }
    return PRODUTOS.map(p => ({ value: p, count: 0 }));
}, [smartOptions.produtos]); // Re-calcula só se smartOptions.produtos mudar
```

### 13.3 Dependency Arrays Precisas

**Problema:** Effect re-executa desnecessariamente

**Solução:** Listar apenas dependencies relevantes

```typescript
// Effect #9 - só re-executa se campos de input mudarem
useEffect(() => {
    // ... código
}, [
    formData.bu,          // ✅ Afeta matching
    formData.segmento,    // ✅ Afeta matching
    formData.canal,       // ✅ Afeta matching
    formData.baseVolume,  // ✅ Afeta cálculos
    formData.oferta,      // ✅ Afeta matching
    // NÃO incluir: formData.dataDisparo (não afeta projeção)
    activities            // ✅ Se histórico muda, re-projetar
]);
```

---

## 14. Troubleshooting

### 14.1 Projeções Não Aparecem

**Sintoma:** Bloco 5 mostra apenas warning

**Causas Possíveis:**

1. **Campos críticos faltando**
   - ✅ Verificar console: "Aguardando campos mínimos"
   - ✅ Preencher todos os 4 campos críticos

2. **Volume = 0 ou vazio**
   - ✅ Volume deve ser > 0
   - ❌ `baseVolume: '0'` → bloqueado
   - ❌ `baseVolume: ''` → bloqueado

3. **Sem dados históricos**
   - ✅ Console: "Sem atividades históricas"
   - ✅ Verificar `activities.length > 0`

4. **Erro na conversão de dados**
   - ✅ Console: "No valid activities with .raw data"
   - ✅ Verificar `activity.raw` existe

### 14.2 Projeções Muito Baixas/Altas

**Sintoma:** Valores não fazem sentido

**Causas:**

1. **Matching fraco (fallback)**
   - ✅ Verificar `selectedLevel` no console
   - ✅ Se `fallback`: adicionar mais campos

2. **Poucos matches**
   - ✅ Verificar `selectedMatches` < 5
   - ✅ Combinação de campos muito específica

3. **Dados históricos ruins**
   - ✅ Verificar `topMatches` no console
   - ✅ Ver se campanhas são realmente similares

### 14.3 Readiness Não Muda

**Sintoma:** Sempre `partial` mesmo com todos os campos

**Causa:** Campos importantes vazios

**Solução:**
- ✅ Verificar `formData.oferta` não está vazio
- ✅ Verificar `formData.jornada` não está vazio
- ✅ `partial` → 0 importantes
- ✅ `good` → 1-2 importantes
- ✅ `excellent` → 3+ importantes

### 14.4 Console Errors

**Error 1:** `Cannot read property 'projectedValue' of undefined`
- **Causa:** Projeção não foi gerada para métrica
- **Solução:** Verificar `hasMinimumRequiredFields()`

**Error 2:** `activity.raw is null`
- **Causa:** Atividades sem dados `.raw`
- **Solução:** Filter `.filter(a => a.raw != null)`

**Error 3:** `orchest rator not initialized`
- **Causa:** getAIOrchestrator() falhou
- **Solução:** Verificar import e singleton

---

## 15. Conclusão

Este sistema implementa **validação científica** de projeções de marketing, garantindo que:

✅ **Projeções só ocorrem com dados suficientes** (4 campos críticos)
✅ **Feedback progressivo** ensina o usuário sobre campos importantes
✅ **Precisão incremental** quanto mais campos, maior a confiança
✅ **Transparência total** via logging detalhado e mensagens claras
✅ **Performance otimizada** via singleton orchestrator e memoization

**Resultado:** Sistema cientificamente válido, educativo e confiável para decisões de growth marketing.

---

**Fim da Documentação**
