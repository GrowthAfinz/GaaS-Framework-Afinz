export interface FunnelMetrics {
    baseEnviada: number;
    baseEntregue: number;
    propostas: number;
    aprovados: number;
    emissoes: number;
}

export interface GargaloComTendencia {
    etapa: string;
    taxaAtual: number;
    taxaAnterior: number;
    tendencia: number | null;  // percentual de mudança, null se não houver anterior
    direcao: 'up' | 'down' | 'stable' | 'none';
}

export const useBottleneckTrend = () => {
    const calcularTendencia = (
        dadosAtuais: FunnelMetrics,
        dadosAnteriores: FunnelMetrics | null
    ): GargaloComTendencia[] => {
        const etapas = [
            { nome: 'Envio → Entrega', atualKey: 'taxaEntrega', metricKey: 'baseEntregue', prevKey: 'baseEnviada' },
            { nome: 'Entrega → Abertura', atualKey: 'taxaAbertura', metricKey: 'propostas', prevKey: 'baseEntregue' },
            { nome: 'Abertura → Proposta', atualKey: 'taxaProposta', metricKey: 'aprovados', prevKey: 'propostas' },
            { nome: 'Proposta → Emissão', atualKey: 'taxaEmissao', metricKey: 'emissoes', prevKey: 'aprovados' },
        ];

        return etapas.map(etapa => {
            // Calculate rates
            const taxaAtual = calculateRate(dadosAtuais, etapa.metricKey as keyof FunnelMetrics, etapa.prevKey as keyof FunnelMetrics);
            const taxaAnterior = dadosAnteriores
                ? calculateRate(dadosAnteriores, etapa.metricKey as keyof FunnelMetrics, etapa.prevKey as keyof FunnelMetrics)
                : 0;

            // Calculate trend
            let tendencia: number | null = null;
            let direcao: 'up' | 'down' | 'stable' | 'none' = 'none';

            if (taxaAnterior > 0) {
                tendencia = ((taxaAtual - taxaAnterior) / taxaAnterior) * 100;

                if (tendencia > 2) direcao = 'up';
                else if (tendencia < -2) direcao = 'down';
                else direcao = 'stable';
            }

            return {
                etapa: etapa.nome,
                taxaAtual,
                taxaAnterior,
                tendencia,
                direcao,
            };
        });
    };

    const calculateRate = (metrics: FunnelMetrics, currentKey: keyof FunnelMetrics, prevKey: keyof FunnelMetrics): number => {
        const current = metrics[currentKey];
        const prev = metrics[prevKey];
        return prev > 0 ? (current / prev) * 100 : 0;
    };

    return {
        calcularTendencia
    };
};
