import React, { useState } from 'react';
import { Calculator, ChevronLeft, ChevronRight, Save, Target } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

type GoalFormState = {
    cartoes_meta: string | number;
    b2b2c_meta: string | number;
    plurix_meta: string | number;
    b2c_meta: string | number;
};

const inputBase =
    'w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 font-mono text-slate-900 transition placeholder:text-slate-400 focus:border-blue-500 focus:outline-none';

const goalFields: Array<{
    key: keyof GoalFormState;
    label: string;
    hint: string;
    accent: string;
}> = [
    { key: 'cartoes_meta', label: 'Dia', hint: 'Meta mensal de cartões', accent: 'text-blue-600' },
    { key: 'b2b2c_meta', label: 'Bem Barato', hint: 'Meta mensal de cartões', accent: 'text-amber-600' },
    { key: 'plurix_meta', label: 'Plurix', hint: 'Meta mensal de cartões', accent: 'text-violet-600' },
    { key: 'b2c_meta', label: 'B2C', hint: 'Meta mensal de cartões', accent: 'text-emerald-600' }
];

export const GoalsManager: React.FC = () => {
    const { goals, setGoals } = useAppStore();
    const [currentDate, setCurrentDate] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [loading, setLoading] = useState(false);

    const getMonthKey = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const addMonth = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
    const currentMonthKey = getMonthKey(currentDate);

    const [formState, setFormState] = useState<GoalFormState>({
        cartoes_meta: 0,
        b2b2c_meta: 0,
        plurix_meta: 0,
        b2c_meta: 0
    });

    React.useEffect(() => {
        const goal = goals.find((entry) => entry.mes === currentMonthKey);
        setFormState({
            cartoes_meta: goal?.cartoes_meta || 0,
            b2b2c_meta: goal?.b2b2c_meta || 0,
            plurix_meta: goal?.plurix_meta || 0,
            b2c_meta: goal?.b2c_meta || 0
        });
    }, [currentMonthKey, goals]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const currentGoal = goals.find((entry) => entry.mes === currentMonthKey);
            const nextGoal = {
                mes: currentMonthKey,
                cartoes_meta: Number(formState.cartoes_meta) || 0,
                b2b2c_meta: Number(formState.b2b2c_meta) || 0,
                plurix_meta: Number(formState.plurix_meta) || 0,
                b2c_meta: Number(formState.b2c_meta) || 0,
                cac_max: currentGoal?.cac_max || 0
            };

            const nextGoals = [...goals.filter((goal) => goal.mes !== currentMonthKey), nextGoal];
            setGoals(nextGoals);

            const { dataService } = await import('../../services/dataService');
            await dataService.upsertGoal(nextGoal);
            alert('Meta mensal salva com sucesso.');
        } catch (error: any) {
            console.error('Erro ao salvar meta:', error);
            alert(`Erro ao salvar meta: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                        <Target size={22} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-slate-950">Meta central de cartões</h3>
                        <p className="mt-1 text-sm text-slate-500">
                            Fonte única para metas mensais consumidas pelas demais abas do sistema.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <button
                        type="button"
                        onClick={() => setCurrentDate(addMonth(currentDate, -1))}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Competência</p>
                        <h4 className="mt-1 text-lg font-semibold capitalize text-slate-900">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h4>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCurrentDate(addMonth(currentDate, 1))}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {goalFields.map((field) => (
                        <div key={field.key} className="rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {field.label}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{field.hint}</p>
                            <div className="relative mt-4">
                                <Calculator size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${field.accent}`} />
                                <input
                                    type="number"
                                    value={formState[field.key]}
                                    onChange={(event) =>
                                        setFormState((previous) => ({
                                            ...previous,
                                            [field.key]: event.target.value
                                        }))
                                    }
                                    className={inputBase}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm text-slate-500">
                        A aba de Originação B2C usa a meta de <strong className="text-slate-700">B2C</strong> como referência mensal.
                    </p>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={16} />
                        {loading ? 'Salvando...' : 'Salvar metas'}
                    </button>
                </div>
            </div>
        </div>
    );
};
