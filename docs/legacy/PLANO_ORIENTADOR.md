# Plano de Implementação - Fase 2: Orientador (Recommendation Engine)

## Objetivo
Criar uma engine de recomendação que analisa o histórico de campanhas e sugere as melhores combinações de **Canal + Oferta + Segmento** baseadas em performance passada.

## Arquitetura

### 1. Tipagem (`src/types/recommendations.ts`)
Definir interfaces para:
- `RecommendationScore`: O score calculado para uma combinação.
- `RecommendationCombo`: A combinação única de Canal/Oferta/Segmento.
- `RecommendationInsight`: Insights textuais gerados (ex: "Alta conversão, mas CAC alto").

### 2. Engine de Recomendação (`src/hooks/useRecommendationEngine.ts`)
Hook responsável por:
1.  **Agrupar** dados históricos por combinação (Canal + Oferta + Segmento).
2.  **Calcular Métricas Médias** para cada grupo (CAC, Conversão, Volume).
3.  **Calcular Score** ponderado:
    - CAC (40%): Menor é melhor.
    - Conversão (40%): Maior é melhor.
    - Volume (20%): Mais dados = maior confiança.
4.  **Rankear** as combinações.

### 3. Interface de Usuário
- **Aba Orientador**: Nova aba principal no `App.tsx`.
- **RecommendationCard**: Componente visual para exibir uma recomendação com seus scores e métricas.
- **HistoricoModal**: Ao clicar num card, mostrar as campanhas passadas que geraram aquele score.

## Passos de Implementação

1.  [ ] Criar definições de tipos (`src/types/recommendations.ts`).
2.  [ ] Implementar lógica de agrupamento e scoring (`useRecommendationEngine.ts`).
3.  [ ] Criar componente `RecommendationCard`.
4.  [ ] Criar componente `HistoricoModal`.
5.  [ ] Integrar nova aba "Orientador" no `App.tsx`.
6.  [ ] Adicionar filtros globais à aba Orientador.

## Regras de Negócio (Score)
O score vai de 0 a 100.
- **Score CAC (0-100)**: Normalizado invertido (menor CAC = maior score).
- **Score Conversão (0-100)**: Normalizado direto (maior taxa = maior score).
- **Score Volume (0-100)**: Logarítmico ou linear até um teto (ex: 10 campanhas = 100%).

$$ FinalScore = (ScoreCAC * 0.4) + (ScoreConv * 0.4) + (ScoreVol * 0.2) $$
