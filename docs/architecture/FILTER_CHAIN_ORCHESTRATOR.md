# Filter Chain Orchestrator

## Contexto
Nao existia um orquestrador dedicado para contagem encadeada dos filtros globais
(`canais`, `jornadas`, `segmentos`, `parceiros`) no modo inline.

## Objetivo
Calcular de forma inteligente e eficiente:
- contagem por opcao em cada filtro considerando os demais filtros ativos (exclude-self),
- opcoes disponiveis no contexto estatico (periodo + BU),
- total de disparos restantes apos a cadeia completa de filtros.

## Implementacao
O orquestrador foi embutido no hook `useAdvancedFilters`:
- base estavel: atividades que passam em filtros estaticos (periodo + BU),
- contagem facetada: para cada dimensao, conta opcoes validas ignorando apenas a propria dimensao,
- consolidacao em uma estrutura memoizada para evitar recomputos desnecessarios.

## Saida
O hook passa a expor:
- `countByCanal`
- `countByJornada`
- `countBySegmento`
- `countByParceiro`
- `totalRemainingDisparos`

## UI
`InlineFilterBar` usa os novos dados para:
- mostrar contagens coerentes com a cadeia ativa,
- exibir total de disparos restantes,
- melhorar o filtro de Jornadas com busca + selecao multipla de itens visiveis.
