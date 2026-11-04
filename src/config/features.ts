/**
 * Flags de produto. Desligar uma flag esconde a tela sem apagar o código;
 * a exclusão definitiva fica para quando a decisão estiver consolidada.
 */
export const FEATURES = {
  /**
   * Aba "Jornada & Disparos" (Análise). Desligada em 04/11/2026: as três partes que
   * só ela tinha (evolução de performance, anomalias e Insight Deck) foram integradas
   * em Relatórios › Evolução e anomalias. Quando confirmado, excluir
   * JornadaDisparosView.tsx e a rota 'jornada'.
   */
  jornadaDisparosTab: false,
} as const;
