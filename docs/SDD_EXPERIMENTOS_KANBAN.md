# SDD — Gestor de Experimentos (Kanban Warehouse-Native)

**Status:** Spec aprovada para desenvolvimento  
**Autor:** Pablo Prado (Growth Marketing)  
**Data:** 2026-06-10  
**Versão:** 1.0

---

## 1. Problema

A operação de CRM da Afinz realiza dezenas de variações de campanha por safra — troca de canal, oferta, subgrupo, recência — mas nenhuma delas é registrada como experimento. Quando uma combinação funciona (ex.: Carrinho B2C WhatsApp Diario saltou de 8,42% para 24,05% entre fev e mar/26), a causa fica invisível e o aprendizado se perde.

O sistema precisa:
1. Capturar intenções de teste **antes** do disparo, usando o fluxo já existente de agendamento.
2. Conectar automaticamente os disparos executados como grupos de controle/variante.
3. Calcular significância estatística **sem que ninguém digite número** — dados vêm das views ponderadas do Supabase.
4. Tornar o acervo de aprendizados (inclusive os fracassados) pesquisável e permanente.

---

## 2. Princípios de Design

| # | Princípio | Implicação |
|---|-----------|------------|
| 1 | **Warehouse-native** | Métricas = views ponderadas do Supabase; zero input manual de número |
| 2 | **`activity_name` como unidade** | Cada disparo se associa a um experimento; os grupos são atribuídos por regra |
| 3 | **Oferta+Promocional como chave composta** | Auto-attach usa o par (Oferta, Promocional), nunca um campo isolado |
| 4 | **Repositório permanente** | Experimentos refutados são cidadãos de 1ª classe; nada se apaga |
| 5 | **Kanban simples, card rico** | 3 colunas; card mostra o essencial em 3 segundos |
| 6 | **Owner por login** | `profiles` (7 usuários); aprendizado assinado pelo criador |
| 7 | **IA nas costuras** | Sugere hipóteses, detecta candidatos, redige aprendizado; nunca inventa número |

---

## 3. Modelo de Dados (Supabase)

### 3.1 Migration SQL

```sql
-- ===============================================================
-- experiments — a hipótese e seus metadados
-- ===============================================================
CREATE TABLE experiments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT NOT NULL,
  hipotese      TEXT NOT NULL,       -- "Se aumentarmos a recência do público de D-21 para D-7, a conv. no WhatsApp aumentará ≥30%"
  tipo          TEXT NOT NULL        -- 'prospectivo' | 'natural' | 'retroativo'
                CHECK (tipo IN ('prospectivo','natural','retroativo')),
  status        TEXT NOT NULL DEFAULT 'backlog'
                CHECK (status IN ('backlog','rodando','concluido')),
  owner_id      UUID REFERENCES auth.users(id),

  -- ICE scoring (1–10 cada)
  ice_impact    SMALLINT CHECK (ice_impact BETWEEN 1 AND 10),
  ice_confidence SMALLINT CHECK (ice_confidence BETWEEN 1 AND 10),
  ice_ease      SMALLINT CHECK (ice_ease BETWEEN 1 AND 10),
  -- ice_score = ice_impact * ice_confidence * ice_ease (calculado no frontend)

  -- Definição do experimento (filtros que determinam quais activities pertencem)
  definicao     JSONB NOT NULL DEFAULT '{}',
  /*
    Estrutura do JSONB:
    {
      "bu": "B2C",
      "segmento": "Cartao Abandono",
      "canal": "WhatsApp",
      "safra_inicio": "2026-03",
      "safra_fim": "2026-03",
      "variante_regra": {
        "campo": "Oferta+Promocional",   -- sempre o par composto
        "variante_valor": "Vibe+Padrao",
        "controle_valor": "Padrao+Padrao"
      }
    }
  */

  -- Resultado e decisão
  decisao       TEXT                 -- 'validado' | 'refutado' | 'inconclusivo'
                CHECK (decisao IN ('validado','refutado','inconclusivo')),
  decisao_nota  TEXT,                -- contexto operacional da decisão
  aprendizado   TEXT,                -- texto gerado/editado pelo operador (Booking-style)

  -- Datas
  iniciado_em   DATE,
  encerrado_em  DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===============================================================
-- experiment_activities — vínculo disparo ↔ experimento
-- ===============================================================
CREATE TABLE experiment_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id   UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  activity_name   TEXT NOT NULL,     -- FK lógica para activities."Activity name"
  grupo           TEXT NOT NULL      -- 'controle' | 'variante'
                  CHECK (grupo IN ('controle','variante')),
  atribuicao      TEXT NOT NULL DEFAULT 'manual'
                  CHECK (atribuicao IN ('manual','auto_taxonomia','auto_atributo')),
  atributo_chave  TEXT,              -- ex.: "Oferta+Promocional=Vibe+Padrao"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (experiment_id, activity_name)  -- cada disparo só entra uma vez por experimento
);

-- Índices
CREATE INDEX idx_exp_activities_name     ON experiment_activities(activity_name);
CREATE INDEX idx_exp_activities_exp_id   ON experiment_activities(experiment_id);
CREATE INDEX idx_experiments_status      ON experiments(status);
CREATE INDEX idx_experiments_owner       ON experiments(owner_id);

-- RLS: todos os usuários autenticados leem; só o owner edita
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura_autenticada" ON experiments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "escrita_owner" ON experiments
  FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "leitura_autenticada_ea" ON experiment_activities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "escrita_owner_ea" ON experiment_activities
  FOR ALL USING (
    experiment_id IN (SELECT id FROM experiments WHERE owner_id = auth.uid())
  );
```

### 3.2 View de Métricas por Grupo (Warehouse-Native)

```sql
-- Calcula as métricas de cada grupo direto das activities — sem digitar número
CREATE OR REPLACE VIEW vw_experiment_metrics AS
SELECT
  ea.experiment_id,
  ea.grupo,
  count(*)                                                          AS n_disparos,
  sum(a."Base Acionável")                                           AS base_total,
  sum(a."Cartões Gerados")                                          AS cartoes_total,
  sum(a."Propostas")                                                AS propostas_total,
  sum(a."Aprovados")                                                AS aprovados_total,
  round(
    (sum(a."Cartões Gerados")::numeric / NULLIF(sum(a."Base Acionável"),0))::numeric,
    5
  )                                                                 AS conv_ponderada,
  round(
    (sum(a."Custo Total Campanha")::numeric / NULLIF(sum(a."Cartões Gerados"),0))::numeric,
    2
  )                                                                 AS cac_ponderado
FROM experiment_activities ea
JOIN activities a ON a."Activity name" = ea.activity_name
WHERE a.status = 'Realizado'
GROUP BY ea.experiment_id, ea.grupo;
```

---

## 4. Metodologia Estatística

### 4.1 Teste utilizado
**Z-test para duas proporções (bicaudal, α = 0,05, poder = 80%)**

Escolha justificada: a métrica primária `conv_ponderada` é uma proporção — cartões / base acionável. O Z-test bicaudal detecta tanto ganho quanto perda, é interpretável pela equipe e amplamente aceito para testes A/B de produto.

### 4.2 Fórmulas

```
Métrica primária: p̂ = sum(cartões) / sum(base)

Tamanho de amostra necessário (por grupo):
  MDE padrão: 20% lift relativo → p2 = p1 * 1.20
  n = (z_α/2 + z_β)² × [p1(1−p1) + p2(1−p2)] / (p1−p2)²
  z_α/2 = 1.96  (α = 0.05)
  z_β   = 0.84  (poder = 80%)
  → constante (1.96+0.84)² ≈ 7.85

Estatística Z:
  p_pool = (x1 + x2) / (n1 + n2)   [x = cartões; n = base]
  SE     = √( p_pool × (1−p_pool) × (1/n1 + 1/n2) )
  z      = (p̂_variante − p̂_controle) / SE
  p_value = 2 × (1 − Φ(|z|))

Intervalo de confiança 95%:
  diff = p̂_variante − p̂_controle
  CI   = diff ± 1.96 × SE_diff
  SE_diff = √( p̂1(1−p̂1)/n1 + p̂2(1−p̂2)/n2 )

Fallback Fisher's exact: quando qualquer célula < 30 disparos
```

### 4.3 Lógica de decisão automática

| Condição | Ação |
|----------|------|
| p < 0,05 E ambos grupos ≥ n_min | Badge amarelo "Pronto para decisão" — operator confirma |
| p ≥ 0,05 E n_atual ≥ 2 × n_min | Badge cinza "Inconclusivo — amostras suficientes" |
| n_atual < n_min | Barra de progresso de amostra (%) |

**Nenhuma decisão é automática.** O sistema aponta; o operador confirma. Isso evita early stopping false positives.

### 4.4 MDE configurável por experimento
O campo `definicao.mde_relativo` (default `0.20`) permite ajustar o tamanho de efeito mínimo por hipótese:
- Efeitos grandes esperados (nova oferta): `0.30`
- Efeitos marginais (ajuste de horário): `0.10` → requer n maior

---

## 5. UX — Kanban

### 5.1 Estrutura de colunas

```
┌─────────────────┬─────────────────┬─────────────────────────┐
│   BACKLOG        │    RODANDO       │    CONCLUÍDO             │
│  (ordenar: ICE↓) │ (ordenar: dias↑) │  (ordenar: data↓)        │
│                  │                  │  [✅ Validado]            │
│                  │                  │  [❌ Refutado]            │
│                  │                  │  [⚠️ Inconclusivo]        │
└─────────────────┴─────────────────┴─────────────────────────┘
```

+ Tab separada: **"Aprendizados"** — repositório Booking-style, pesquisável.

### 5.2 Card design — o que aparece em 3 segundos

```
┌─────────────────────────────────────────────────┐
│ [ICE 8.4] [WhatsApp] [B2C]              [Pablo] │
│ Título do experimento (max 2 linhas)            │
│─────────────────────────────────────────────────│
│  variante  ████████████ 8.42%                   │
│  controle  █ 0.49%           Δ +17,2pp (×17×)  │
│─────────────────────────────────────────────────│
│  ████████████░░░░░░░░░░  68% da amostra         │
│  n=320 / n_min=470 · 14 dias rodando            │
└─────────────────────────────────────────────────┘
```

**Os 4 elementos em 3 segundos:**
1. **Delta de conversão** (variante vs controle, ∆pp e multiplicador)
2. **Progresso de amostra** (barra %, n atual / n mínimo)
3. **ICE badge** (para ordenar visualmente no backlog)
4. **Owner inicial** (accountability)

### 5.3 Card expandido (clique)

```
┌─────────────────────────────────────────────────┐
│ Hipótese completa                               │
│ Definição: Segmento · Safra · Oferta+Promo      │
│─────────────────────────────────────────────────│
│ Métricas detalhadas:                            │
│   Conv.   Propostas  Aprovados  CAC             │
│ V: 8.42%  12.1%      85.3%      R$142           │
│ C: 0.49%   0.9%      60.0%      R$890           │
│─────────────────────────────────────────────────│
│ p-value: 0.0003 · z = 3.62                      │
│ IC 95%: [+6.9pp, +9.1pp]                        │
│ MDE configurado: 20% relativo                   │
│─────────────────────────────────────────────────│
│ ▸ Disparos vinculados (N activities)            │
│─────────────────────────────────────────────────│
│ Guardrails: ✅ CAC < R$500 · ✅ Entrega > 90%  │
│─────────────────────────────────────────────────│
│ [Registrar aprendizado]  [Mover para Concluído] │
└─────────────────────────────────────────────────┘
```

### 5.4 Modal "Novo Experimento"

Formulário em 3 passos dentro da tela de Experimentos (não um modal flutuante global — experiência começa aqui):

**Passo 1 — Hipótese**
- Título (texto livre)
- Hipótese (template: "Se _______, então _______ aumentará/diminuirá em ~___% porque _______")
- Tipo: prospectivo / natural (detecção de quebra histórica) / retroativo
- ICE sliders (1–10 com tooltips explicativos)
- MDE relativo (default 20%)

**Passo 2 — Definição do grupo**
- BU (select)
- Segmento (select)
- Canal (select)
- Safra início/fim
- Chave de atribuição: campo `Oferta+Promocional` (par composto, obrigatório)
  - Variante: Oferta=X, Promocional=Y
  - Controle: Oferta=A, Promocional=B
- Preview: lista de activities que seriam auto-attached

**Passo 3 — Revisão**
- Mostra n_min calculado com a conv. histórica do segmento/canal como p1 base
- Lista de activities auto-attached (editável manualmente)
- Botão "Criar experimento"

---

## 6. Arquitetura de Componentes

### 6.1 Nova estrutura de arquivos

```
src/components/
└── experiments/                        # novo módulo
    ├── ExperimentsView.tsx             # tab principal (kanban + repository)
    ├── ExperimentKanban.tsx            # 3 colunas
    ├── ExperimentCard.tsx              # card (collapsed + expanded)
    ├── ExperimentModal.tsx             # criação/edição (3 passos)
    ├── LearningRepository.tsx          # tab Aprendizados (Booking-style)
    ├── StatsEngine.ts                  # Z-test + Fisher + sample size (TypeScript puro)
    ├── AutoAttachEngine.ts             # regra multi-dimensão de vinculação
    └── hooks/
        ├── useExperiments.ts           # CRUD Supabase experiments + experiment_activities
        ├── useExperimentMetrics.ts     # lê vw_experiment_metrics
        └── useAutoAttach.ts           # sugere activities com base na definicao JSONB
```

### 6.2 Rota e navegação

**App.tsx** — adicionar rota `experimentos`:
```typescript
case 'experimentos':
  return <ExperimentsView />;
```

**navigation.ts** — adicionar na seção PLANEJAMENTO (depois do Diário de Bordo):
```typescript
{
  id: 'experimentos',
  label: 'Experimentos',
  icon: 'FlaskConical',
  category: 'planejamento'
}
```

### 6.3 TypeScript Types

```typescript
// src/types/experiments.ts

export interface Experiment {
  id: string;
  titulo: string;
  hipotese: string;
  tipo: 'prospectivo' | 'natural' | 'retroativo';
  status: 'backlog' | 'rodando' | 'concluido';
  owner_id: string;
  ice_impact: number;
  ice_confidence: number;
  ice_ease: number;
  definicao: ExperimentDefinicao;
  decisao?: 'validado' | 'refutado' | 'inconclusivo';
  decisao_nota?: string;
  aprendizado?: string;
  iniciado_em?: string;
  encerrado_em?: string;
  created_at: string;
  updated_at: string;
}

export interface ExperimentDefinicao {
  bu: string;
  segmento: string;
  canal: string;
  safra_inicio: string;
  safra_fim?: string;
  mde_relativo?: number;          // default 0.20
  variante_regra: {
    campo: 'Oferta+Promocional';  // sempre o par composto
    variante_valor: string;       // "Vibe+Padrao"
    controle_valor: string;       // "Padrao+Padrao"
  };
}

export interface ExperimentActivity {
  id: string;
  experiment_id: string;
  activity_name: string;
  grupo: 'controle' | 'variante';
  atribuicao: 'manual' | 'auto_taxonomia' | 'auto_atributo';
  atributo_chave?: string;        // "Oferta+Promocional=Vibe+Padrao"
  created_at: string;
}

export interface ExperimentMetrics {
  experiment_id: string;
  grupo: 'controle' | 'variante';
  n_disparos: number;
  base_total: number;
  cartoes_total: number;
  propostas_total: number;
  aprovados_total: number;
  conv_ponderada: number;
  cac_ponderado: number;
}

export interface ExperimentStats {
  conv_variante: number;
  conv_controle: number;
  delta_abs: number;
  delta_rel: number;
  z_score: number;
  p_value: number;
  ci_low: number;
  ci_high: number;
  n_variante: number;
  n_controle: number;
  n_min_per_group: number;
  sample_progress: number;        // 0–1
  significativo: boolean;
  metodo: 'z_test' | 'fisher';
}
```

### 6.4 StatsEngine (TypeScript puro, sem biblioteca)

```typescript
// src/components/experiments/StatsEngine.ts

// Distribuição normal padrão acumulada (aproximação Horner)
function normalCDF(z: number): number {
  const a1=0.254829592, a2=-0.284496736, a3=1.421413741,
        a4=-1.453152027, a5=1.061405429, p=0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return 0.5 * (1 + sign * y);
}

export function calcSampleSize(p1: number, mde: number): number {
  const p2 = p1 * (1 + mde);
  const diff = p2 - p1;
  if (diff <= 0) return Infinity;
  const numerator = 7.85 * (p1*(1-p1) + p2*(1-p2));
  return Math.ceil(numerator / (diff * diff));
}

export function calcStats(
  cartoes_v: number, base_v: number,
  cartoes_c: number, base_c: number,
  n_min: number
): ExperimentStats {
  const p_v = base_v > 0 ? cartoes_v / base_v : 0;
  const p_c = base_c > 0 ? cartoes_c / base_c : 0;
  const p_pool = (cartoes_v + cartoes_c) / (base_v + base_c);
  const se = Math.sqrt(p_pool * (1-p_pool) * (1/base_v + 1/base_c));
  const z = se > 0 ? (p_v - p_c) / se : 0;
  const p_value = 2 * (1 - normalCDF(Math.abs(z)));
  const se_diff = Math.sqrt(p_v*(1-p_v)/base_v + p_c*(1-p_c)/base_c);
  const n_min_group = Math.max(n_min, 1);
  const sample_progress = Math.min(1, Math.min(base_v, base_c) / n_min_group);

  return {
    conv_variante: p_v,
    conv_controle: p_c,
    delta_abs: p_v - p_c,
    delta_rel: p_c > 0 ? (p_v - p_c) / p_c : 0,
    z_score: z,
    p_value,
    ci_low: (p_v - p_c) - 1.96 * se_diff,
    ci_high: (p_v - p_c) + 1.96 * se_diff,
    n_variante: base_v,
    n_controle: base_c,
    n_min_per_group: n_min_group,
    sample_progress,
    significativo: p_value < 0.05 && sample_progress >= 1,
    metodo: Math.min(base_v, base_c, cartoes_v, cartoes_c) < 30 ? 'fisher' : 'z_test'
  };
}
```

### 6.5 AutoAttachEngine

```typescript
// src/components/experiments/AutoAttachEngine.ts
// Busca no Supabase as activities que correspondem à definicao do experimento

export async function findCandidateActivities(
  def: ExperimentDefinicao,
  supabase: SupabaseClient
): Promise<{ activity_name: string; grupo: 'controle' | 'variante' }[]> {
  const { data } = await supabase
    .from('activities')
    .select('"Activity name", "Oferta", "Promocional"')
    .eq('"BU"', def.bu)
    .eq('"Segmento"', def.segmento)
    .eq('"Canal"', def.canal)
    .gte('"Safra"', def.safra_inicio)
    .lte('"Safra"', def.safra_fim ?? def.safra_inicio);

  if (!data) return [];

  // Chave composta Oferta+Promocional
  const [oferta_v, promo_v] = def.variante_regra.variante_valor.split('+');
  const [oferta_c, promo_c] = def.variante_regra.controle_valor.split('+');

  return data.flatMap(row => {
    const name = row['Activity name'];
    if (row['Oferta'] === oferta_v && row['Promocional'] === promo_v) {
      return [{ activity_name: name, grupo: 'variante' as const }];
    }
    if (row['Oferta'] === oferta_c && row['Promocional'] === promo_c) {
      return [{ activity_name: name, grupo: 'controle' as const }];
    }
    return [];
  });
}
```

---

## 7. Hooks

### 7.1 `useExperiments`
```typescript
// CRUD completo: create, update (status, decisao, aprendizado), delete (soft)
// Escuta realtime do Supabase para atualização de status sem reload
```

### 7.2 `useExperimentMetrics`
```typescript
// Lê vw_experiment_metrics para um experiment_id
// Calcula ExperimentStats via StatsEngine.calcStats()
// Recalcula ao abrir o card (não fica em polling — dados mudam ao registrar atividades)
```

### 7.3 `useAutoAttach`
```typescript
// Usa AutoAttachEngine para mostrar o preview no passo 2 do modal
// Debounce 500ms após mudança nos filtros da definicao
```

---

## 8. Integração com o Sistema Existente

### 8.1 Orientador → sugestão de hipótese
No `OrientadorView.tsx`, ao detectar anomalia/oportunidade com `delta > threshold`, adicionar botão "Criar experimento" que pré-preenche:
- `titulo` = "Oportunidade detectada: [canal] [segmento]"
- `hipotese` = texto gerado pelo `explanationGenerator`
- `definicao.bu`, `canal`, `segmento` pré-preenchidos

### 8.2 ProgramarDisparoModal → vinculação ao criar
No `ProgramarDisparoModal.tsx`, após salvar a atividade:
- Verificar se existem experimentos `rodando` com a mesma definição
- Se sim: toast "Esta atividade corresponde ao experimento X — adicionar como [variante/controle]?" com botão confirmar

### 8.3 DiarioBordo → aprendizados exportáveis
Ao definir `decisao` no experimento, oferecer "Exportar para Diário de Bordo" que cria uma entrada de aprendizado com o texto do campo `aprendizado`.

---

## 9. Tab "Aprendizados" (Repositório Booking-style)

Filtros:
- Decisão (validado / refutado / inconclusivo)
- Canal, BU, Segmento
- Período
- Texto livre (busca no título + hipótese + aprendizado)

Card de aprendizado:
```
[✅ Validado] WhatsApp · B2C · Cartão Abandono · mar/26
"Estratificação por recência (D-7 vs D-21) multiplica conversão por ×3"
Δ +17pp | p=0.001 | n=2.400 | Owner: Pablo
```

**Nada se apaga.** Experimentos refutados ficam com badge vermelho e texto "Por que testamos + o que aprendemos com o fracasso".

---

## 10. Guardrails padrão

> ⚠️ **Lacuna conhecida:** os guardrails dependem da `Unidade-Econômica-do-Cartão` — custo de aquisição máximo aceitável, threshold de taxa de entrega mínima. Esses valores ainda não estão documentados no vault.

**Provisório até definição formal:**
| Guardrail | Valor provisório | Fonte |
|-----------|-----------------|-------|
| CAC máx (B2C) | R$ 300 | histórico mar/26 |
| CAC máx (Plurix) | R$ 500 | histórico geral |
| Taxa de entrega mín | 85% | operacional |
| Base mínima por grupo | 100 | plataformas (Meta/Google) |

---

## 11. Plano de Implementação (fases)

### Fase 1 — Base (≈ 2 dias)
- [ ] Migration Supabase (tabelas + view + RLS)
- [ ] Types TypeScript (`src/types/experiments.ts`)
- [ ] `StatsEngine.ts` + testes unitários
- [ ] `useExperiments.ts` hook (CRUD)

### Fase 2 — Kanban MVP (≈ 2 dias)
- [ ] `ExperimentsView.tsx` com 3 colunas
- [ ] `ExperimentCard.tsx` (collapsed com 4 elementos + expanded)
- [ ] `ExperimentModal.tsx` passo 1 (hipótese + ICE)
- [ ] Rota + navegação

### Fase 3 — Auto-attach + Stats (≈ 1 dia)
- [ ] `AutoAttachEngine.ts`
- [ ] `useAutoAttach.ts` + `useExperimentMetrics.ts`
- [ ] Modal passo 2 (definição + preview de activities)
- [ ] Exibição de stats no card expandido

### Fase 4 — Integrações + Repositório (≈ 1 dia)
- [ ] Hook de sugestão no Orientador
- [ ] Toast de vinculação no ProgramarDisparoModal
- [ ] Tab "Aprendizados" com busca

### Fase 5 — IA e polish (≈ 1 dia)
- [ ] Geração de texto de aprendizado via `explanationGenerator`
- [ ] Sugestão de hipótese via anomalias do Orientador
- [ ] Experimentos retroativos (tipo = 'retroativo' com datas passadas)
- [ ] Registrar Vibe A/B e Virada de Mar/26 como primeiros experimentos retroativos

---

## 12. Decisões em aberto

| Decisão | Opções | Impacto |
|---------|--------|---------|
| **Guardrails definitivos** | Ver Unidade-Econômica-do-Cartão no vault | Bloqueia alertas automáticos |
| **Fisher's exact em JS** | Implementar manualmente vs. importar `jstat` | Adiciona dependência |
| **Multi-métrica** | Conv. primária + Propostas + CAC como guardrail | Complexidade do card |
| **Experimento entre canais** | Comparar WhatsApp vs. SMS na mesma hipótese | Requer stratificação obrigatória |

---

## Relacionado (vault)
- [[Sistema-de-Experimentacao-Referencias]] — benchmarks e validação retroativa
- [[Views-Performance]] — fonte das métricas warehouse-native
- [[Carrinho-Abandonado]] — caso 1 (Vibe A/B) e caso 2 (virada mar/26)
- [[Diário-de-Bordo]] — destino dos aprendizados validados
- [[Orientador]] — origem das sugestões de hipótese
- [[Metas-e-CAC]] — lacuna dos guardrails
