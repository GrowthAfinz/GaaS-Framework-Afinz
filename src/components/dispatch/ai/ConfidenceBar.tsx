import React from 'react';

interface ConfidenceBarProps {
    confidence: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    showPercentage?: boolean;
}

/**
 * Barra visual de confianca
 * Cores: Verde (>70%), Amarelo (40-70%), Vermelho (<40%)
 */
export const ConfidenceBar: React.FC<ConfidenceBarProps> = ({
    confidence,
    size = 'md',
    showLabel = false,
    showPercentage = true
}) => {
    // Determinar cor baseada na confianca
    const getColor = () => {
        if (confidence >= 70) return 'bg-emerald-500';
        if (confidence >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getBackgroundColor = () => {
        if (confidence >= 70) return 'bg-emerald-500/20';
        if (confidence >= 40) return 'bg-amber-500/20';
        return 'bg-red-500/20';
    };

    const getLabel = () => {
        if (confidence >= 80) return 'Alta';
        if (confidence >= 60) return 'Moderada';
        if (confidence >= 40) return 'Baixa';
        return 'Muito Baixa';
    };

    const heights = {
        sm: 'h-1',
        md: 'h-1.5',
        lg: 'h-2'
    };

    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] text-slate-500 uppercase font-medium">
                        Confianca
                    </span>
                    <span className={`text-[9px] font-bold ${
                        confidence >= 70 ? 'text-emerald-600' :
                        confidence >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                        {getLabel()}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-2">
                <div className={`flex-1 ${heights[size]} ${getBackgroundColor()} rounded-full overflow-hidden`}>
                    <div
                        className={`h-full ${getColor()} rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                    />
                </div>

                {showPercentage && (
                    <span className={`text-[9px] font-bold min-w-[28px] text-right ${
                        confidence >= 70 ? 'text-emerald-600' :
                        confidence >= 40 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                        {Math.round(confidence)}%
                    </span>
                )}
            </div>
        </div>
    );
};

export default ConfidenceBar;
