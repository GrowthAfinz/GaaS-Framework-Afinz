# TAB: Gestor de Experimentos (Experiments/Kanban)

**Rota:** Não é aba própria no nav — acessível dentro de **Diário de Bordo** (`/diario`), via botão "Gestor de Experimentos"
**Componente Principal:** `ExperimentsView.tsx` (`src/components/experiments/`, 12 componentes)
**Categoria:** PLANEJAMENTO (sub-feature de Diário de Bordo)

---

> **~70% implementado.** Ver spec completa em [`docs/plans/SDD_EXPERIMENTOS_KANBAN_INDEX.md`](../../plans/SDD_EXPERIMENTOS_KANBAN_INDEX.md) para modelo de dados, cálculo estatístico (Z-test/Fisher exact) e regras de negócio detalhadas — este documento cobre o observado em teste ao vivo e a estrutura de componentes, sem duplicar a spec.

## Overview

Sistema de gestão de experimentos (testes A/B) em formato Kanban, com repositório de aprendizados e análise de programa. Acessado a partir de "Diário de Bordo" → aba interna "Gestor de Experimentos". Tem 3 sub-abas: **Quadro Kanban**, **Repositório de Aprendizados**, **Análise do Programa**.

**Estado observado em teste ao vivo (2026-07-05, produção):** a tabela `experiments` está **sem registros** (0 experimentos cadastrados). As 3 sub-abas renderizam estados vazios tratados graciosamente (colunas Kanban zeradas, cards de métrica com "0"/"0.0%", sem erros no console) — este é um resultado esperado e válido, não um bug.

---

## Features

- **Quadro Kanban:** 3 colunas — Backlog (ordenado por ICE score), Rodando (ordenado por dias ativos), Concluído (ordenado por data). Drag-and-drop Backlog→Rodando→Concluído (não é possível voltar de Concluído).
- Botão "+ Nova Hipótese" abre modal de criação em 3 etapas (Etapa 1 testada: Título do Experimento, Hipótese do Teste, BU).
- **Repositório de Aprendizados:** busca por título/aprendizado/regra, filtros de Canal e Decisão.
- **Análise do Programa:** cards de resumo (Total Criados, Rodando Agora, Testes Concluídos, Batting Average Global) + gráficos "Win Rate por Canal" e "Histórico Cronológico do Programa".

---

## Arquitetura de Componentes

```
ExperimentsView.tsx
├── Quadro Kanban
│   ├── ExperimentKanban.tsx (3 colunas, drag-and-drop via hello-pangea/dnd)
│   ├── ExperimentCard.tsx
│   ├── ExperimentModal.tsx (criação, 3 etapas)
│   └── ExperimentDetailModal.tsx
│
├── Repositório de Aprendizados
│   └── LearningRepository.tsx (busca + filtros Canal/Decisão)
│
└── Análise do Programa
    └── ProgramaView.tsx (Total Criados, Rodando Agora, Concluídos, Batting Average, Win Rate por Canal, Histórico Cronológico)
```

Componentes de apoio (visuais): `ConversionSparkline`, `LiftPlot`, `SRMAlert`, `SampleProgressBar`, `StatusBadge`.

---

## Fluxo de Dados

Tabelas Supabase: `experiments` (hipótese, definição JSONB, status, decisão, aprendizado), `experiment_activities` (vínculo `experiment_id` ↔ `activity_name`, grupo controle/variante), view `vw_experiment_metrics` (métricas por grupo calculadas direto de `activities`, warehouse-native). Detalhe completo do modelo de dados e da fórmula estatística: ver [SDD_EXPERIMENTOS_KANBAN.md](../../plans/SDD_EXPERIMENTOS_KANBAN.md) seções 3 e 4.

---

## Regras de Negócio Críticas (resumo — ver spec para detalhe)

- **ICE Score** (Impact × Confidence × Ease, 1–10 cada) ordena o Backlog.
- Regra de variante usa sempre o **par composto Oferta+Promocional** (nunca um campo isolado) para o auto-attach de activities ao grupo controle/variante.
- Teste estatístico: Z-test de 2 proporções (α=0,05, poder=80%), fallback Fisher exact se alguma célula tiver menos de 30 disparos.
- **Nenhuma decisão é automática** — o badge indica "pronto para decisão" ou "inconclusivo", mas o operador confirma manualmente (design conservador, evita early stopping com falsos positivos).

---

## Casos de Uso

### 1. Criar uma nova hipótese de teste
1. Em Diário de Bordo → Gestor de Experimentos → Quadro Kanban.
2. Clicar "+ Nova Hipótese".
3. Preencher Título, Hipótese do Teste e BU (etapa 1 de 3) e prosseguir pelas etapas seguintes (definição de segmento/canal/safra/variante).

### 2. Acompanhar experimentos em andamento
1. Ver coluna "Rodando" do Kanban, ordenada por dias ativos (mais antigo primeiro).
2. Abrir o card para ver sparkline de conversão e barra de progresso de amostra.

### 3. Consultar aprendizados acumulados
1. Ir para "Repositório de Aprendizados".
2. Buscar por título/regra ou filtrar por Canal/Decisão.

### 4. Avaliar saúde do programa de experimentação
1. Ir para "Análise do Programa".
2. Ver Batting Average Global e Win Rate por Canal.

---

## Gaps/Limitações Conhecidas

- Auto-attach de activities ao par Oferta+Promocional: implementado no código, mas não pôde ser validado em teste ao vivo por falta de experimentos reais em produção.
- Sugestão automática de hipóteses: mencionada na spec, não confirmada como funcional no código atual.
- Refinamentos visuais (ícones por guardrail, explainer de MDE) pendentes conforme a spec.
- Documentação de referência (este arquivo) é nova — a spec completa (SDD, ~1.500 linhas somadas) continua sendo a fonte de detalhe para modelo de dados e estatística.

---

## Arquivos Relacionados

- `src/components/DiarioBordo.tsx` (entry point)
- `src/components/experiments/ExperimentsView.tsx`
- `src/components/experiments/ExperimentKanban.tsx`, `ExperimentCard.tsx`, `ExperimentModal.tsx`
- `docs/plans/SDD_EXPERIMENTOS_KANBAN.md`
- `docs/plans/SDD_EXPERIMENTOS_KANBAN_COMPLEMENTO.md`
- `docs/plans/SDD_EXPERIMENTOS_KANBAN_INDEX.md`

---

**Última Atualização:** 2026-07-05
