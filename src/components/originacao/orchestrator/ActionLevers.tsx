import React from 'react';
import { ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const ActionLevers: React.FC = () => {
    // Mock Recommendations
    const recommendations = [
        {
            type: 'opportunity',
            title: 'Escalar Google Ads (Campanha Institucional)',
            impact: 'Alto',
            description: 'Eficiência de CPA está 25% acima da meta. Aumentar orçamento em R$ 5k/semana pode trazer +120 cartões.',
            actionLabel: 'Simular Aumento',
            icon: <TrendingUp className="text-emerald-600" size={20} />,
            color: 'border-emerald-300 bg-emerald-50'
        },
        {
            type: 'warning',
            title: 'Atenção: Queda de Aprovação no Meta',
            impact: 'Médio',
            description: 'Taxa de aprovação caiu para 12%. Revisar segmentação de público para evitar leads desqualificados.',
            actionLabel: 'Ver Detalhes',
            icon: <AlertTriangle className="text-yellow-600" size={20} />,
            color: 'border-yellow-300 bg-yellow-50'
        },
        {
            type: 'check',
            title: 'Parceiro "Azul" Estável',
            impact: 'Baixo',
            description: 'Volume e custo dentro do esperado. Manter estratégia atual.',
            headingColor: 'text-slate-500',
            icon: <CheckCircle2 className="text-blue-600" size={20} />,
            color: 'border-blue-200 bg-blue-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, i) => (
                <div key={i} className={`p-5 rounded-xl border ${rec.color} transition-all hover:scale-[1.02] cursor-pointer group`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                            {rec.icon}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${rec.impact === 'Alto' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                                rec.impact === 'Médio' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' :
                                    'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                            Impacto {rec.impact}
                        </span>
                    </div>

                    <h4 className={`text-sm font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors`}>{rec.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                        {rec.description}
                    </p>

                    <div className="flex items-center gap-1 text-xs font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                        <span>{rec.actionLabel || 'Analisar'}</span>
                        <ArrowUpRight size={14} />
                    </div>
                </div>
            ))}
        </div>
    );
};
