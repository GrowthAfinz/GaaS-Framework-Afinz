import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/App.css';
import { AuthProvider } from '../../src/context/AuthContext';
import { supabase } from '../../src/services/supabaseClient';
import { LoopAttention } from '../../src/components/growth-learning/attention/LoopAttention';
import { InheritedGoalNotice } from '../../src/components/launch-planner/InheritedGoalNotice';
import { inheritedGoalNoticeKey } from '../../src/utils/inheritedGoalNoticePreference';
import type { LoopItem } from '../../src/components/growth-learning/attention/attentionService';

// Local fixture only. No session tokens, production reads or writes.
const user = { id: 'notification-layout-fixture', app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' };
Object.assign(supabase.auth, {
    getSession: async () => ({ data: { session: { user } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
});
const rows: LoopItem[] = [
    { id: 'outcome', front: 'crm_acquisition', state: 'needs_review', title: 'Resultado de aposta aguardando revisão', summary: 'A janela terminou em 30/09/2026. Confira a execução e o resultado registrado.' },
    { id: 'source', front: 'paid_media', state: 'needs_data', title: 'Atualizar os dados de Google Ads', summary: 'Dados disponíveis até 17/08/2026. Confira a atualização esperada para o período.' },
    { id: 'long', front: 'crm_acquisition', state: 'analysis_ready', title: 'Plurix / Negados — análise pronta para decidir o próximo passo da operação', summary: 'A análise está pronta. Confira os resultados, os limites da leitura e registre o próximo passo para este contexto.' },
].map(row => ({ kind: 'source', source_id: row.id, period: '2026-09-01', next_action: 'Conferir as evidências e registrar o próximo passo.', route: '?view=learning&section=feed', revision: 1, notice_revision: 1, priority: 20, evidence: {}, following: false, hidden: false, snoozed_until: null, updated_at: '2026-10-29', analysis: null, ...row })) as LoopItem[];
let scenario = 'populated';
Object.assign(supabase, { rpc: async (name: string, args: Record<string, unknown>) => {
    if (name === 'growth_loop_list') return scenario === 'error' ? { data: null, error: new Error('Não foi possível ler os avisos. Tente atualizar.') } : { data: scenario === 'empty' ? [] : rows.filter(row => args.p_include_hidden || !row.hidden).map(row => ({ ...row })), error: null };
    if (name === 'growth_loop_prefer') { const row = rows.find(row => row.id === args.p_item); if (row) { if (args.p_action === 'dismiss' || args.p_action === 'snooze') row.hidden = true; if (args.p_action === 'restore') row.hidden = false; if (args.p_action === 'follow') row.following = true; if (args.p_action === 'unfollow') row.following = false; } return { error: null }; }
    return { data: null, error: new Error('Operação desabilitada nesta demonstração local.') };
} });
const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => String(input instanceof Request ? input.url : input).includes('supabase.co') ? Promise.resolve(new Response(JSON.stringify({ message: 'Operação desabilitada nesta demonstração local.' }), { status: 403, headers: { 'content-type': 'application/json' } })) : originalFetch(input, init);
const goal = { mes: '2026-10', herdada_de: '2026-07', b2c_meta: 6442, b2b2c_meta: 100, plurix_meta: 400, cac_max: 31 };
function Fixture() {
    const [version, setVersion] = useState(0);
    const [showGoal, setShowGoal] = useState(true);
    const [width, setWidth] = useState('1100');
    return <main className="min-h-screen bg-slate-50 p-5">
        <div className="mb-5 flex flex-wrap gap-4 text-xs"><button onClick={() => { localStorage.removeItem(inheritedGoalNoticeKey(goal, user.id)); setVersion(value => value + 1); }}>Reiniciar preferências da meta</button><p>Validação local · dados simulados · operações remotas bloqueadas</p><label>Cenário <select onChange={event => { scenario = event.target.value; setVersion(value => value + 1); }}><option value="populated">Com avisos</option><option value="empty">Sem avisos</option><option value="error">Erro</option></select></label><label><input type="checkbox" checked={showGoal} onChange={event => setShowGoal(event.target.checked)}/>Mostrar meta</label><label>Largura <select value={width} onChange={event => setWidth(event.target.value)}><option>1100</option><option>640</option><option>600</option><option>360</option></select></label></div>
        <div style={{ maxWidth: Number(width) }}><AuthProvider><LoopAttention key={version} placement="planner" goalNotice={showGoal ? onVisibilityChange => <InheritedGoalNotice goal={goal} onVisibilityChange={onVisibilityChange}/> : undefined}/></AuthProvider></div>
    </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
