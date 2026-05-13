export interface SegmentStrategy {
  nome: string; // Segmento/Campanha
  totalCartoes: number;
  taxaEntregaMédia: number;
  taxaAberturaMédia: number;
  taxaPropostaMédia: number;
  cacMédio: number;
  custoTotal: number;
  atividades: number;
  variacao: number; // Percentual de variação vs mês anterior
  status: 'em-progresso' | 'concluido' | 'parado';
  bu: string[]; // Quais BUs estão envolvidas
  datas: string[]; // Datas das atividades
}

export interface StrategyMetrics {
  [segmento: string]: SegmentStrategy;
}
