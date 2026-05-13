
export interface B2CDataRow {
    id?: string;
    created_at?: string;
    data: string; // YYYY-MM-DD
    propostas_b2c_total: number;
    emissoes_b2c_total: number;
    percentual_conversao_b2c: number;
    observacoes?: string;
    tipo?: string;
    percentual_share?: number;
    pct_conv_canal?: number;
    user_id?: string;
}

export interface DailyAnalysis {
    data: string;
    dia_semana: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
    semana_mes: number;
    mes: number;
    ano: number;

    // B2C Data
    propostas_b2c_total: number;
    emissoes_b2c_total: number;
    taxa_conversao_b2c: number;

    // CRM Data
    propostas_crm: number;
    // Maps to 'Cartões Gerados'
    emissoes_crm: number;
    entregas_crm: number;
    custo_crm: number;
    num_campanhas_crm: number;

    // Calculated Metrics
    share_propostas_crm_percentual: number;
    share_emissoes_crm_percentual: number;
    taxa_conversao_crm: number;
    performance_index: number;
    cac_medio: number;

    // Anomaly Detection
    eh_anomalia: boolean;
}

export interface MetricsSummary {
    periodo_inicio: string;
    periodo_fim: string;
    share_crm_media: number;
    emissoes_crm_total: number;
    cac_medio: number;
    taxa_conversao_crm_media: number;
    taxa_conversao_b2c_media: number;
    performance_index_medio: number;
    total_dias: number;
    dias_com_anomalia: number;
    emissoes_b2c_total: number;
    propostas_b2c_total: number;
    propostas_crm_total: number;
}

export interface AlertConfig {
    share_crm_limiar: number; // default 10
    ativar_anomalias: boolean;
}
