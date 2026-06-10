export interface ExperimentRule {
  campo: 'Promocional' | 'Oferta' | 'Subgrupos' | 'Activity name / Taxonomia';
  controle_valor: string;
  variante_valor: string;
}

export interface ExperimentDefinition {
  bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Seguros';
  segmento: string;
  canal: string;
  safra_inicio: string;
  variante_regra: ExperimentRule;
}

export interface Experiment {
  id: string;
  titulo: string;
  hipotese?: string;
  status: 'backlog' | 'rodando' | 'concluido';
  decisao?: 'validado' | 'refutado' | 'inconclusivo';
  aprendizado?: string;
  definicao: ExperimentDefinition;
  owner_id?: string;
  iniciado_em?: string; // YYYY-MM-DD
  encerrado_em?: string; // YYYY-MM-DD
  view_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExperimentStats {
  n_controle: number;
  conv_controle: number;
  conv_rate_controle: number;
  n_variante: number;
  conv_variante: number;
  conv_rate_variante: number;
  
  // Computed client-side by StatsEngine
  delta_abs: number;
  delta_rel: number;
  z_score: number;
  p_value: number;
  significativo: boolean;
  ci_low: number;
  ci_high: number;
  srm_p_value: number;
  srm_detectado: boolean;
  n_min_per_group: number;
  sample_progress: number;
}
