# SDD Complemento — UX Reference & Implementation Guide

**Referência:** [SDD_EXPERIMENTOS_KANBAN.md](SDD_EXPERIMENTOS_KANBAN.md)  
**Data:** 2026-06-10  
**Fontes:** GrowthBook (MIT, open source), Eppo, Statsig, Optimizely, codebase scan

---

## 1. Discoveries — O que muda na implementação

### 1.1 Slot já existe em `DiarioBordo.tsx`
`src/components/DiarioBordo.tsx` já renderiza `<ExperimentsView />` na tab "Gestor de Experimentos". **Não cria nova rota** — substitui o conteúdo do componente `src/components/diary/ExperimentsView.tsx` existente.

```tsx
// DiarioBordo.tsx — slot existente
{activeTab === 'experimentos' ? <ExperimentsView /> : <DiaryView />}
```

### 1.2 `react-beautiful-dnd` já instalado
Usado em `ActivityCard.tsx` no Launch Planner. Usar o mesmo padrão para o kanban — sem nova dependência. O `@hello-pangea/dnd` é equivalente com tipos melhores, mas evitar migração desnecessária.

---

## 2. UX Principles — O que aprendemos das melhores plataformas

| Plataforma | Padrão adotado |
|-----------|----------------|
| **GrowthBook** | CI como barra cinza atrás do número; cor = verde/vermelho/cinza pela significância |
| **Eppo** | Learning KB com `view_count`; todos os resultados (inclusive negativos) entram por default |
| **Statsig** | Pulsing dot no badge "Rodando"; barra de progresso **bloqueia** o botão de decisão |
| **Optimizely** | Série temporal por braço revela efeitos de dia da semana |
| **Interno (Afinz)** | Três números sempre juntos: `Controle 3.2% / Variante 4.1% / (+28.1%)` |

---

## 3. Component Library — Código Pronto (Padrões do Projeto)

### 3.1 ExperimentCard — Card Collapsed (visão kanban)

Padrão da borda esquerda por canal (Rec 1 da pesquisa): identidade visual instantânea sem ler badge.

```tsx
// src/components/experiments/ExperimentCard.tsx
import { Draggable } from 'react-beautiful-dnd';
import { ConversionSparkline } from './ConversionSparkline';
import { SampleProgressBar } from './SampleProgressBar';
import type { Experiment, ExperimentStats } from '../../types/experiments';

const CANAL_BORDER: Record<string, string> = {
  'E-mail':    'border-l-blue-500',
  'SMS':       'border-l-amber-500',
  'WhatsApp':  'border-l-emerald-500',
  'Push':      'border-l-purple-500',
};

const CANAL_TEXT: Record<string, string> = {
  'E-mail':   'text-blue-400',
  'SMS':      'text-amber-400',
  'WhatsApp': 'text-emerald-400',
  'Push':     'text-purple-400',
};

interface Props {
  experiment: Experiment;
  stats?: ExperimentStats;
  index: number;
  onClick: () => void;
}

export function ExperimentCard({ experiment, stats, index, onClick }: Props) {
  const canal = experiment.definicao.canal;
  const borderColor = CANAL_BORDER[canal] ?? 'border-l-slate-500';
  const isRunning = experiment.status === 'rodando';
  const isDone = experiment.status === 'concluido';
  const iceScore = (
    (experiment.ice_impact ?? 5) *
    (experiment.ice_confidence ?? 5) *
    (experiment.ice_ease ?? 5)
  );

  return (
    <Draggable draggableId={experiment.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={[
            'rounded-lg border-l-4 border border-slate-700 bg-slate-800/80',
            'p-3 mb-2 cursor-pointer space-y-2.5',
            'hover:border-slate-500 hover:bg-slate-800 transition-all',
            snapshot.isDragging ? 'shadow-xl ring-1 ring-slate-400 rotate-1 z-50' : '',
            borderColor,
          ].join(' ')}
        >
          {/* Header: canal tag + ICE badge */}
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${CANAL_TEXT[canal] ?? 'text-slate-400'}`}>
              {canal}
            </span>
            <span className="text-[10px] font-mono bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
              ICE {iceScore}
            </span>
          </div>

          {/* Título */}
          <p className="text-sm font-semibold text-slate-100 line-clamp-2 leading-snug">
            {experiment.titulo}
          </p>

          {/* Três números — sempre juntos (Controle / Variante / Lift) */}
          {stats && (isDone || isRunning) && (
            <div className="flex items-baseline gap-2 text-xs">
              <span className="text-slate-400">
                C: <span className="text-slate-200 font-mono">{(stats.conv_controle * 100).toFixed(2)}%</span>
              </span>
              <span className="text-slate-400">
                V: <span className="text-slate-200 font-mono">{(stats.conv_variante * 100).toFixed(2)}%</span>
              </span>
              <span className={[
                'ml-auto font-semibold font-mono',
                !stats.significativo ? 'text-slate-500' :
                stats.delta_rel > 0 ? 'text-emerald-400' : 'text-red-400'
              ].join(' ')}>
                {stats.delta_rel > 0 ? '+' : ''}{(stats.delta_rel * 100).toFixed(1)}%
              </span>
            </div>
          )}

          {/* Sparkline (só Rodando com dados) */}
          {isRunning && stats && (
            <ConversionSparkline
              data={[]}  // alimentar de vw_experiment_metrics daily slice
              color={stats.significativo ? '#10b981' : '#64748b'}
              height={24}
            />
          )}

          {/* Barra de progresso da amostra */}
          {isRunning && stats && (
            <SampleProgressBar
              nAtual={Math.min(stats.n_variante, stats.n_controle)}
              nNecessario={stats.n_min_per_group}
            />
          )}

          {/* Footer: status badge + owner + dias */}
          <div className="flex items-center justify-between pt-0.5">
            <StatusBadge status={experiment.status} decisao={experiment.decisao} />
            <span className="text-[10px] text-slate-500">
              {experiment.owner_id?.slice(0, 6)}
              {isRunning && experiment.iniciado_em &&
                ` · ${Math.floor((Date.now() - new Date(experiment.iniciado_em).getTime()) / 86400000)}d`
              }
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
```

### 3.2 StatusBadge — com pulsing dot para "Rodando"

```tsx
// src/components/experiments/StatusBadge.tsx
type Props = {
  status: 'backlog' | 'rodando' | 'concluido';
  decisao?: 'validado' | 'refutado' | 'inconclusivo';
};

export function StatusBadge({ status, decisao }: Props) {
  if (status === 'rodando') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-900/30 text-blue-400">
        {/* Pulsing dot (Statsig pattern) — comunica "live" sem palavras */}
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
        </span>
        Rodando
      </span>
    );
  }

  if (status === 'concluido') {
    const config = {
      validado:    { cls: 'bg-emerald-900/30 text-emerald-400', label: '✓ Validado' },
      refutado:    { cls: 'bg-red-900/30 text-red-400',         label: '✗ Refutado' },
      inconclusivo:{ cls: 'bg-amber-900/30 text-amber-400',     label: '⚠ Inconclusivo' },
    };
    const d = decisao ? config[decisao] : { cls: 'bg-slate-700 text-slate-400', label: 'Concluído' };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${d.cls}`}>
        {d.label}
      </span>
    );
  }

  // Backlog
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-700 text-slate-400">
      Backlog
    </span>
  );
}
```

### 3.3 SampleProgressBar — bloqueia decisão antes de 100%

```tsx
// src/components/experiments/SampleProgressBar.tsx
interface Props {
  nAtual: number;
  nNecessario: number;
  compact?: boolean;
}

export function SampleProgressBar({ nAtual, nNecessario, compact = false }: Props) {
  const progress = Math.min(1, nAtual / Math.max(nNecessario, 1));
  const pct = Math.round(progress * 100);
  const reached = progress >= 1;

  return (
    <div className={compact ? 'space-y-0.5' : 'space-y-1.5'}>
      {!compact && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Amostra</span>
          <span className={`font-mono text-[11px] ${reached ? 'text-emerald-400' : 'text-slate-300'}`}>
            {nAtual.toLocaleString('pt-BR')} / {nNecessario.toLocaleString('pt-BR')}
            {reached && ' ✓'}
          </span>
        </div>
      )}
      <div className="relative h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            reached ? 'bg-emerald-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] text-slate-500">
          {reached
            ? 'Amostra suficiente — pode declarar resultado'
            : `Faltam ~${(nNecessario - nAtual).toLocaleString('pt-BR')} registros`
          }
        </p>
      )}
    </div>
  );
}
```

### 3.4 LiftPlot — CI horizontal (GrowthBook style, sem Recharts)

```tsx
// src/components/experiments/LiftPlot.tsx
// CI plot como div/SVG — Recharts é overkill para uma linha com ponto

interface Props {
  liftPct: number;     // ponto estimado, ex: 28.1
  ciLow: number;       // limite inferior %, ex: 8.4
  ciHigh: number;      // limite superior %, ex: 47.8
  significant: boolean;
}

export function LiftPlot({ liftPct, ciLow, ciHigh, significant }: Props) {
  const SCALE = 60; // eixo vai de -60% a +60%
  const pct = (v: number) => Math.max(0, Math.min(100, ((v + SCALE) / (2 * SCALE)) * 100));

  const barColor = !significant
    ? '#475569'
    : liftPct > 0 ? '#10b981' : '#ef4444';

  return (
    <div className="space-y-1">
      {/* Label */}
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">IC 95%</span>
        <span className={`font-mono font-semibold ${
          !significant ? 'text-slate-400' :
          liftPct > 0 ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {liftPct > 0 ? '+' : ''}{liftPct.toFixed(1)}%
          {!significant && <span className="text-slate-500 font-normal ml-1">(n.s.)</span>}
        </span>
      </div>

      {/* Plot */}
      <div className="relative h-5 w-full">
        {/* Track */}
        <div className="absolute top-1/2 -translate-y-1/2 h-px w-full bg-slate-600" />
        {/* Zero line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-500"
          style={{ left: `${pct(0)}%` }}
        />
        {/* CI bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full opacity-40"
          style={{
            left: `${pct(ciLow)}%`,
            width: `${pct(ciHigh) - pct(ciLow)}%`,
            backgroundColor: barColor,
          }}
        />
        {/* Ponto estimado */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-slate-900"
          style={{
            left: `${pct(liftPct)}%`,
            transform: 'translate(-50%, -50%)',
            backgroundColor: barColor,
          }}
        />
        {/* Eixo labels */}
        <span className="absolute -bottom-4 left-0 text-[9px] text-slate-600">-{SCALE}%</span>
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-slate-600">0</span>
        <span className="absolute -bottom-4 right-0 text-[9px] text-slate-600">+{SCALE}%</span>
      </div>
    </div>
  );
}
```

### 3.5 ConversionSparkline — Recharts, sem animação (obrigatório em listas)

```tsx
// src/components/experiments/ConversionSparkline.tsx
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: { date: string; controle: number; variante: number }[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

export function ConversionSparkline({ data, color = '#3b82f6', height = 28, showTooltip = false }: Props) {
  if (!data.length) return <div className="h-7 bg-slate-700/30 rounded animate-pulse" />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['auto', 'auto']} />
        {showTooltip && (
          <Tooltip
            formatter={(v: number) => [`${(v * 100).toFixed(2)}%`]}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: 11 }}
            itemStyle={{ color: '#f1f5f9' }}
          />
        )}
        {/* Controle: tracejado cinza */}
        <Line
          type="monotone"
          dataKey="controle"
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="3 3"
          dot={false}
          isAnimationActive={false}  // CRÍTICO: sem animação em listas de cards
        />
        {/* Variante: sólida colorida */}
        <Line
          type="monotone"
          dataKey="variante"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 3.6 Card Expandido — Modal de detalhes

Usar o padrão `SectionCard` já existente (`dispatch/blocks/shared.tsx`) para consistência visual:

```tsx
// src/components/experiments/ExperimentDetailModal.tsx
// Usa o mesmo SectionCard do dispatch modal

import { SectionCard } from '../dispatch/blocks/shared';
import { LiftPlot } from './LiftPlot';
import { ConversionSparkline } from './ConversionSparkline';
import { SampleProgressBar } from './SampleProgressBar';

export function ExperimentDetailModal({ experiment, stats, onClose, onDecision }) {
  const canDecide = stats?.sample_progress >= 1;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{experiment.titulo}</h2>
            <p className="text-xs text-slate-400 mt-0.5 italic">"{experiment.hipotese}"</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 ml-4">✕</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Bloco 1: Definição */}
          <SectionCard title="Definição" icon={null} badge={experiment.tipo}>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-slate-500">BU</span><p className="text-slate-200 font-medium">{experiment.definicao.bu}</p></div>
              <div><span className="text-slate-500">Segmento</span><p className="text-slate-200 font-medium">{experiment.definicao.segmento}</p></div>
              <div><span className="text-slate-500">Canal</span><p className="text-slate-200 font-medium">{experiment.definicao.canal}</p></div>
              <div><span className="text-slate-500">Safra</span><p className="text-slate-200 font-medium">{experiment.definicao.safra_inicio}</p></div>
              <div className="col-span-2">
                <span className="text-slate-500">Oferta+Promocional</span>
                <p className="text-slate-200 font-medium font-mono text-[11px]">
                  V: {experiment.definicao.variante_regra.variante_valor} / C: {experiment.definicao.variante_regra.controle_valor}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Bloco 2: Métricas */}
          {stats && (
            <SectionCard title="Métricas" icon={null}>
              {/* Três números sempre juntos */}
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                {[
                  { label: 'Controle', value: `${(stats.conv_controle * 100).toFixed(2)}%`, cls: 'text-slate-300' },
                  { label: 'Variante', value: `${(stats.conv_variante * 100).toFixed(2)}%`, cls: stats.significativo ? (stats.delta_rel > 0 ? 'text-emerald-400' : 'text-red-400') : 'text-slate-300' },
                  { label: 'Lift', value: `${stats.delta_rel > 0 ? '+' : ''}${(stats.delta_rel * 100).toFixed(1)}%`, cls: !stats.significativo ? 'text-slate-500' : stats.delta_rel > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold' },
                ].map(m => (
                  <div key={m.label} className="bg-slate-800 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{m.label}</p>
                    <p className={`text-lg font-mono font-semibold ${m.cls}`}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* CI Plot */}
              <div className="mb-6 px-2">
                <LiftPlot
                  liftPct={stats.delta_rel * 100}
                  ciLow={stats.ci_low * 100}
                  ciHigh={stats.ci_high * 100}
                  significant={stats.significativo}
                />
              </div>

              {/* Stats técnicas (para analistas) */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs mt-2">
                {[
                  { label: 'p-value', value: stats.p_value < 0.001 ? '<0.001' : stats.p_value.toFixed(3) },
                  { label: 'z-score', value: stats.z_score.toFixed(2) },
                  { label: 'n variante', value: stats.n_variante.toLocaleString('pt-BR') },
                  { label: 'n controle', value: stats.n_controle.toLocaleString('pt-BR') },
                ].map(s => (
                  <div key={s.label} className="bg-slate-800/50 rounded p-1.5">
                    <p className="text-slate-500 text-[9px] uppercase">{s.label}</p>
                    <p className="text-slate-300 font-mono text-[11px]">{s.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Bloco 3: Amostra */}
          {stats && experiment.status === 'rodando' && (
            <SectionCard title="Progresso" icon={null}>
              <SampleProgressBar
                nAtual={Math.min(stats.n_variante, stats.n_controle)}
                nNecessario={stats.n_min_per_group}
              />
              {/* Sparkline */}
              <div className="mt-3">
                <p className="text-[10px] text-slate-500 mb-1">Conversão diária (tracejado = controle)</p>
                <ConversionSparkline data={[]} height={48} showTooltip />
              </div>
            </SectionCard>
          )}

          {/* SRM Alert — detecta desequilíbrio nas bases */}
          {stats && <SRMAlert nVariante={stats.n_variante} nControle={stats.n_controle} />}

          {/* Bloco 4: Guardrails */}
          <SectionCard title="Guardrails" icon={null}>
            <GuardrailsPanel stats={stats} />
          </SectionCard>

          {/* Bloco 5: Aprendizado + Decisão */}
          {experiment.status === 'rodando' && (
            <SectionCard title="Declarar Resultado" icon={null}>
              <div className="space-y-3">
                <textarea
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:ring-1 focus:ring-cyan-400/30 focus:outline-none resize-none"
                  rows={3}
                  placeholder="O que aprendemos? (obrigatório para concluir — resultados negativos são tão importantes quanto positivos)"
                />
                {/* Botão BLOQUEADO até 100% da amostra — Statsig pattern */}
                <div className="flex gap-2">
                  {['validado', 'refutado', 'inconclusivo'].map(d => (
                    <button
                      key={d}
                      disabled={!canDecide}
                      onClick={() => onDecision(d)}
                      title={!canDecide ? 'Aguarde 100% da amostra para evitar falsos positivos' : ''}
                      className={[
                        'flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all',
                        canDecide
                          ? d === 'validado' ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : d === 'refutado' ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-slate-600 hover:bg-slate-500 text-white'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed',
                      ].join(' ')}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                {!canDecide && (
                  <p className="text-[10px] text-amber-400 text-center">
                    ⚠ Aguarde {stats?.n_min_per_group
                      ? `${(stats.n_min_per_group - Math.min(stats.n_variante, stats.n_controle)).toLocaleString('pt-BR')} registros`
                      : '100% da amostra'
                    } para evitar falsos positivos
                  </p>
                )}
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Features Adicionais (da Pesquisa)

### 4.1 SRM Detection — Alerta de Desequilíbrio nas Bases

SRM (Sample Ratio Mismatch) detecta se o split Salesforce está com bug. Implementar com chi-square simples.

```tsx
// src/components/experiments/SRMAlert.tsx
// Chi-square com expected 50/50 split

function detectSRM(nVariante: number, nControle: number): boolean {
  const total = nVariante + nControle;
  const expected = total / 2;
  const chi2 = ((nVariante - expected) ** 2 / expected) + ((nControle - expected) ** 2 / expected);
  return chi2 > 3.841; // p < 0.05, 1 grau de liberdade
}

export function SRMAlert({ nVariante, nControle }: { nVariante: number; nControle: number }) {
  if (!detectSRM(nVariante, nControle)) return null;

  const total = nVariante + nControle;
  return (
    <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 rounded-lg p-3">
      <span className="text-red-400 text-sm mt-0.5">⚠</span>
      <div>
        <p className="text-xs font-semibold text-red-400">SRM Detectado</p>
        <p className="text-[11px] text-red-300/70 mt-0.5">
          Divisão esperada: 50/50 ({Math.round(total/2).toLocaleString('pt-BR')} cada).
          Observado: {Math.round(nVariante/total*100)}%/{Math.round(nControle/total*100)}%.
          Verifique a lógica de split no SFMC antes de interpretar resultados.
        </p>
      </div>
    </div>
  );
}
```

### 4.2 Batting Average — Meta-análise por canal

View SQL + componente de programa. Responde: "em qual canal nossos experimentos costumam ganhar?"

```sql
-- Adicionar à migration ou criar como view separada
CREATE OR REPLACE VIEW vw_experiment_batting_average AS
SELECT
  (definicao->>'canal') AS canal,
  count(*) AS total_experimentos,
  sum(CASE WHEN decisao = 'validado' THEN 1 ELSE 0 END) AS vencedores,
  round(
    sum(CASE WHEN decisao = 'validado' THEN 1 ELSE 0 END)::numeric
    / NULLIF(count(*), 0) * 100, 1
  ) AS win_rate_pct
FROM experiments
WHERE status = 'concluido'
GROUP BY definicao->>'canal'
ORDER BY win_rate_pct DESC;
```

```tsx
// No topo da ExperimentsView — bloco de programa (acima do kanban)
// Usar BarChart do Recharts com o padrão existente de ChannelComparisonChart.tsx

<BarChart data={battingData} layout="vertical" margin={{ top: 5, right: 40, left: 70, bottom: 5 }}>
  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
  <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
    tick={{ fill: '#94a3b8', fontSize: 11 }} />
  <YAxis type="category" dataKey="canal"
    tick={{ fill: '#94a3b8', fontSize: 12 }} width={65} />
  <Tooltip
    formatter={(v: number) => [`${v}%`, 'Win Rate']}
    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
  />
  <Bar dataKey="win_rate_pct" radius={[0, 4, 4, 0]} barSize={20}>
    {battingData.map((entry, i) => (
      <Cell key={i} fill={CANAL_COLORS_HEX[entry.canal] ?? '#64748b'} />
    ))}
  </Bar>
</BarChart>
```

### 4.3 Learning Repository — Workflow forçado

Quando experimento move para "Concluído", o campo `aprendizado` é **obrigatório** antes de salvar. Isso garante que resultados negativos sejam documentados (padrão Eppo).

```typescript
// src/components/experiments/hooks/useExperiments.ts

async function concluirExperimento(
  id: string,
  decisao: 'validado' | 'refutado' | 'inconclusivo',
  aprendizado: string
) {
  if (!aprendizado.trim()) {
    throw new Error('O campo aprendizado é obrigatório para concluir um experimento.');
  }

  const { error } = await supabase
    .from('experiments')
    .update({
      status: 'concluido',
      decisao,
      aprendizado,
      encerrado_em: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id);  // só o owner pode concluir

  if (error) throw error;
}
```

**Learning Repository tab** com `view_count` (padrão Eppo):

```sql
-- Adicionar à tabela experiments:
ALTER TABLE experiments ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;

-- Incrementar no hook useExperimentMetrics ao abrir o detalhe:
UPDATE experiments SET view_count = view_count + 1 WHERE id = $1;
```

### 4.4 Oferta+Promocional como filtro composto no Learning Repository

```tsx
// Filtro no repositório que respeita a regra de par composto
const [filterOfertaPromo, setFilterOfertaPromo] = useState('');

const filtered = learnings.filter(exp => {
  if (!filterOfertaPromo) return true;
  const regra = exp.definicao.variante_regra;
  // Busca no par composto — nunca num campo isolado
  return (
    `${regra.variante_valor} ${regra.controle_valor}`
      .toLowerCase()
      .includes(filterOfertaPromo.toLowerCase())
  );
});
```

---

## 5. ExperimentsView — Estrutura Completa

```tsx
// src/components/diary/ExperimentsView.tsx (substituir componente existente)

type ViewTab = 'kanban' | 'aprendizados' | 'programa';

export function ExperimentsView() {
  const [viewTab, setViewTab] = useState<ViewTab>('kanban');
  const [selectedExp, setSelectedExp] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Colunas do kanban
  const byStatus = useMemo(() => ({
    backlog:  experiments.filter(e => e.status === 'backlog')
                .sort((a, b) => iceScore(b) - iceScore(a)),  // ICE desc
    rodando:  experiments.filter(e => e.status === 'rodando')
                .sort((a, b) => diasRodando(b) - diasRodando(a)),  // mais antigos primeiro
    concluido: experiments.filter(e => e.status === 'concluido')
                .sort((a, b) => new Date(b.encerrado_em!).getTime() - new Date(a.encerrado_em!).getTime()),
  }), [experiments]);

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs: Kanban / Aprendizados / Programa */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 pt-2 pb-0 bg-slate-900/50">
        <div className="flex gap-1">
          {(['kanban', 'aprendizados', 'programa'] as ViewTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setViewTab(tab)}
              className={[
                'px-3 py-2 text-xs font-medium capitalize border-b-2 transition-colors',
                viewTab === tab
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {tab === 'kanban' ? 'Kanban' : tab === 'aprendizados' ? 'Aprendizados' : 'Programa'}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-lg transition-colors"
        >
          + Nova hipótese
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-hidden p-4">
        {viewTab === 'kanban'       && <ExperimentKanban byStatus={byStatus} onCardClick={setSelectedExp} />}
        {viewTab === 'aprendizados' && <LearningRepository />}
        {viewTab === 'programa'     && <ProgramaView />}
      </div>

      {/* Modals */}
      {selectedExp && (
        <ExperimentDetailModal
          experiment={experiments.find(e => e.id === selectedExp)!}
          stats={metricsMap[selectedExp]}
          onClose={() => setSelectedExp(null)}
          onDecision={handleDecision}
        />
      )}
      {showNewModal && <ExperimentModal onClose={() => setShowNewModal(false)} />}
    </div>
  );
}
```

### 5.1 ExperimentKanban — 3 colunas DnD

```tsx
// src/components/experiments/ExperimentKanban.tsx
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';

const COLUMNS = [
  { id: 'backlog',   label: 'Backlog',   subtitle: 'ordenado por ICE' },
  { id: 'rodando',   label: 'Rodando',   subtitle: 'mais antigos primeiro' },
  { id: 'concluido', label: 'Concluído', subtitle: 'por data' },
] as const;

export function ExperimentKanban({ byStatus, onCardClick }) {
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.droppableId as keyof typeof byStatus;
    const to = result.destination.droppableId as keyof typeof byStatus;
    if (from === to) return;

    // Validar transição permitida
    const allowed = {
      backlog: ['rodando'],
      rodando: ['concluido', 'backlog'],
      concluido: [],  // não arrasta de volta
    };
    if (!allowed[from].includes(to)) return;

    // Transição rodando→concluido força o modal de aprendizado
    if (to === 'concluido') {
      openDecisionModal(result.draggableId);
      return;  // não mover ainda — modal confirma
    }

    // Optimistic update + Supabase
    updateExperimentStatus(result.draggableId, to);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-3 gap-4 h-full">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex flex-col">
            {/* Header da coluna */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-sm font-semibold text-slate-200 capitalize">{col.label}</span>
                <span className="ml-2 bg-slate-700 text-slate-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {byStatus[col.id].length}
                </span>
              </div>
              <span className="text-[10px] text-slate-600">{col.subtitle}</span>
            </div>

            {/* Droppable */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={[
                    'flex-1 rounded-lg p-2 min-h-[200px] transition-colors overflow-y-auto',
                    snapshot.isDraggingOver ? 'bg-slate-700/40' : 'bg-slate-800/20',
                  ].join(' ')}
                >
                  {byStatus[col.id].map((exp, index) => (
                    <ExperimentCard
                      key={exp.id}
                      experiment={exp}
                      stats={metricsMap[exp.id]}
                      index={index}
                      onClick={() => onCardClick(exp.id)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
```

---

## 6. Plano de Implementação Atualizado

### Fase 1 — Base (2 dias)
- [ ] Migration Supabase: tabelas + `view_count` + `vw_experiment_metrics` + `vw_experiment_batting_average`
- [ ] `src/types/experiments.ts`
- [ ] `src/components/experiments/StatsEngine.ts` (z-test + sample size + SRM detection)

### Fase 2 — Componentes visuais (2 dias)
- [ ] `StatusBadge.tsx` (pulsing dot)
- [ ] `SampleProgressBar.tsx`
- [ ] `LiftPlot.tsx` (CI horizontal)
- [ ] `ConversionSparkline.tsx` (`isAnimationActive={false}`)
- [ ] `SRMAlert.tsx`
- [ ] `ExperimentCard.tsx` (borda esquerda por canal + 3 números + progresso)

### Fase 3 — Kanban + Modal (2 dias)
- [ ] `ExperimentKanban.tsx` (DnD com react-beautiful-dnd)
- [ ] `ExperimentDetailModal.tsx` (SectionCard pattern + botão bloqueado)
- [ ] `ExperimentModal.tsx` (criação 3 passos)
- [ ] `ExperimentsView.tsx` (substituir componente existente + 3 sub-tabs)

### Fase 4 — Learning KB + Programa (1 dia)
- [ ] `LearningRepository.tsx` (filtro por Oferta+Promocional composto + view_count)
- [ ] `ProgramaView.tsx` (batting average chart + timeline)
- [ ] Aprendizado obrigatório no workflow de conclusão

### Fase 5 — Integrações (1 dia)
- [ ] Hook no Orientador → "Criar experimento" pré-preenchido
- [ ] Toast no ProgramarDisparoModal → vinculação sugerida
- [ ] Primeiro experimento retroativo: Vibe A/B (fev/26, Carrinho B2C WhatsApp)

---

## 7. Cores do Canal — Constantes Unificadas

Consolidar com o padrão do projeto (`ChannelComparisonChart.tsx`):

```typescript
// src/config/channels.ts (adicionar ou criar se não existir)
export const CANAL_COLORS: Record<string, string> = {
  'E-mail':   '#3B82F6',  // blue-500
  'SMS':      '#F59E0B',  // amber-500 (no projeto usa amber para Push; ajustar)
  'WhatsApp': '#10B981',  // emerald-500
  'Push':     '#A855F7',  // purple-500
};

export const CANAL_BORDER_CLASS: Record<string, string> = {
  'E-mail':   'border-l-blue-500',
  'SMS':      'border-l-amber-500',
  'WhatsApp': 'border-l-emerald-500',
  'Push':     'border-l-purple-500',
};

export const CANAL_TEXT_CLASS: Record<string, string> = {
  'E-mail':   'text-blue-400',
  'SMS':      'text-amber-400',
  'WhatsApp': 'text-emerald-400',
  'Push':     'text-purple-400',
};
```

> **Atenção:** o projeto usa `'SMS': '#10B981'` em `ChannelComparisonChart.tsx` mas WhatsApp e SMS não podem ter a mesma cor. Ajustar para SMS = amber (`#F59E0B`) na criação dos componentes de experimentos, e posteriormente padronizar em toda a base.

---

## Fontes da Pesquisa
- [GrowthBook GitHub](https://github.com/growthbook/growthbook) — MIT, código aberto
- [Eppo Knowledge Base](https://docs.geteppo.com/experiment-analysis/reporting/knowledge-base/) — padrões de KB
- [Statsig Results Table](https://www.statsig.com/updates/update/results_table_view) — visualização de CI
- [Optimizely Scorecard](https://support.optimizely.com/hc/en-us/articles/34053132157965) — série temporal por braço
- [Harlan Harris — CI for Conversion Rates](https://medium.com/@HarlanH/communicating-a-b-test-results-for-conversion-rates-with-ratios-and-uncertainty-intervals-4141ac66f343) — CI plot rationale
