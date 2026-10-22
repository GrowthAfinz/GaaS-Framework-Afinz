import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/App.css';
import { AuthProvider, useAuth } from '../../src/context/AuthContext';
import { InheritedGoalNotice } from '../../src/components/launch-planner/InheritedGoalNotice';
import type { Goal } from '../../src/types/framework';

const initial: Goal = { mes: '2026-10', herdada_de: '2026-07', b2c_meta: 6442, b2b2c_meta: 100, plurix_meta: 400, cac_max: 31 };
function Fixture() {
    const { user, loading } = useAuth();
    const [goal, setGoal] = useState(initial);
    (window as any).setNoticeGoal = setGoal;
    return <main className="min-h-screen bg-slate-50 p-4">
        <p className="mb-3 text-xs text-slate-400">Validação local — dados simulados</p>
        <div style={{ maxWidth: 600 }}>{!loading && user && <InheritedGoalNotice goal={goal} />}</div>
    </main>;
}
createRoot(document.getElementById('root')!).render(<AuthProvider><Fixture /></AuthProvider>);
