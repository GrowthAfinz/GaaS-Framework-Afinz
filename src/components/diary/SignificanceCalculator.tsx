import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, CheckCircle } from 'lucide-react';

interface SignificanceCalculatorProps {
    initialMetrics?: {
        controle: { disparos: number; conversoes: number };
        variante: { disparos: number; conversoes: number };
    };
    onCalculate?: (metrics: {
        controle: { disparos: number; conversoes: number };
        variante: { disparos: number; conversoes: number };
    }) => void;
}

export const SignificanceCalculator: React.FC<SignificanceCalculatorProps> = ({ initialMetrics, onCalculate }) => {
    const [control, setControl] = useState({ visitors: initialMetrics?.controle.disparos || 0, conversions: initialMetrics?.controle.conversoes || 0 });
    const [variant, setVariant] = useState({ visitors: initialMetrics?.variante.disparos || 0, conversions: initialMetrics?.variante.conversoes || 0 });
    const [result, setResult] = useState<{ confidence: number; isSignificant: boolean; winner: 'control' | 'variant' | null } | null>(null);

    useEffect(() => {
        if (initialMetrics) {
            setControl({ visitors: initialMetrics.controle.disparos, conversions: initialMetrics.controle.conversoes });
            setVariant({ visitors: initialMetrics.variante.disparos, conversions: initialMetrics.variante.conversoes });
        }
    }, [initialMetrics]);

    const calculateSignificance = () => {
        const cVis = Number(control.visitors);
        const cConv = Number(control.conversions);
        const vVis = Number(variant.visitors);
        const vConv = Number(variant.conversions);

        if (cVis === 0 || vVis === 0) {
            setResult(null);
            return;
        }

        const cRate = cConv / cVis;
        const vRate = vConv / vVis;

        // Standard Error
        const se = Math.sqrt((cRate * (1 - cRate) / cVis) + (vRate * (1 - vRate) / vVis));

        // Z-Score
        const z = Math.abs((cRate - vRate) / se);

        // Confidence (using normal distribution approximation)
        // This is a simplified approximation for 1-tailed test, but usually we want 2-tailed.
        // For 2-tailed:
        // Z=1.65 -> 90%
        // Z=1.96 -> 95%
        // Z=2.58 -> 99%

        // Let's approximate CDF


        let confLevel = 0;
        if (z >= 2.576) confLevel = 99;
        else if (z >= 1.96) confLevel = 95;
        else if (z >= 1.645) confLevel = 90;
        else confLevel = Math.round((1 - Math.exp(-0.7 * z * z)) * 100); // Heuristic

        const isSignificant = confLevel >= 90;
        const winner = cRate > vRate ? 'control' : 'variant';

        setResult({
            confidence: confLevel,
            isSignificant,
            winner: isSignificant ? winner : null
        });

        if (onCalculate) {
            onCalculate({
                controle: { disparos: cVis, conversoes: cConv },
                variante: { disparos: vVis, conversoes: vConv }
            });
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Calculator size={16} className="text-blue-600" />
                Calculadora de Significância
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Control */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Controle (A)</p>
                    <div>
                        <label className="text-xs text-slate-500">Disparos/Visitantes</label>
                        <input
                            type="number"
                            value={control.visitors}
                            onChange={(e) => setControl({ ...control, visitors: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500">Conversões</label>
                        <input
                            type="number"
                            value={control.conversions}
                            onChange={(e) => setControl({ ...control, conversions: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-900"
                        />
                    </div>
                    <div className="text-xs text-slate-500 pt-1">
                        Taxa: {control.visitors > 0 ? ((control.conversions / control.visitors) * 100).toFixed(2) : 0}%
                    </div>
                </div>

                {/* Variant */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Variante (B)</p>
                    <div>
                        <label className="text-xs text-slate-500">Disparos/Visitantes</label>
                        <input
                            type="number"
                            value={variant.visitors}
                            onChange={(e) => setVariant({ ...variant, visitors: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-900"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500">Conversões</label>
                        <input
                            type="number"
                            value={variant.conversions}
                            onChange={(e) => setVariant({ ...variant, conversions: Number(e.target.value) })}
                            className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm text-slate-900"
                        />
                    </div>
                    <div className="text-xs text-slate-500 pt-1">
                        Taxa: {variant.visitors > 0 ? ((variant.conversions / variant.visitors) * 100).toFixed(2) : 0}%
                    </div>
                </div>
            </div>

            <button
                onClick={calculateSignificance}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition mb-4"
            >
                Calcular
            </button>

            {result && (
                <div className={`p-3 rounded-lg border ${result.isSignificant ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        {result.isSignificant ? (
                            <CheckCircle size={16} className="text-emerald-600" />
                        ) : (
                            <AlertCircle size={16} className="text-slate-500" />
                        )}
                        <span className={`font-bold ${result.isSignificant ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {result.isSignificant ? 'Resultado Significativo!' : 'Inconclusivo'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">
                        Confiança estatística: <span className="text-slate-900 font-bold">{result.confidence}%</span>
                    </p>
                    {result.isSignificant && (
                        <p className="text-xs text-slate-500 mt-1">
                            Vencedor: <span className="text-emerald-600 font-bold uppercase">{result.winner === 'control' ? 'Controle (A)' : 'Variante (B)'}</span>
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
