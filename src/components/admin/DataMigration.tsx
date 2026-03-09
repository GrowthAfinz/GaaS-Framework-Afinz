import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../services/supabaseClient';
import { Database, UploadCloud, CheckCircle, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';

const toFiniteNumber = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined) return 0;

    const cleaned = String(value)
        .replace(/[R$\s%]/g, '')
        .replace(/\.(?=\d{3}(\D|$))/g, '')
        .replace(',', '.');

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
};

const toNonNegativeInt = (value: unknown): number => {
    const num = toFiniteNumber(value);
    if (num <= 0) return 0;
    return Math.round(num);
};

export const DataMigration = () => {
    const { activities, b2cData, paidMediaData } = useAppStore();
    const [status, setStatus] = useState<'idle' | 'migrating' | 'done' | 'error'>('idle');
    const [stage, setStage] = useState('');
    const [progress, setProgress] = useState(0);
    const [log, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev].slice(0, 100));

    const handleMigration = async () => {
        if (!confirm(`Confirmar migração de:\n- ${activities.length} Atividades\n- ${b2cData.length} Registros B2C\n- ${paidMediaData.length} Métricas de Mídia\n\nIsso enviará tudo para o Banco de Dados.`)) return;

        setStatus('migrating');
        setProgress(0);
        setLogs([]);
        addLog('Iniciando migração...');

        try {
            // 1. Prepare Data
            const batchSize = 50;
            const total = activities.length;
            let processed = 0;

            if (total === 0) {
                throw new Error("Nenhum registro encontrado em memória. Re-importe o CSV primeiro.");
            }

            // Split into batches
            for (let i = 0; i < total; i += batchSize) {
                const batch = activities.slice(i, i + batchSize);

                // Helper to clean numbers (R$ 1.00 or 10,5% or 1.000)
                const parseNum = (val: any) => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    let s = String(val).replace('R$', '').replace('%', '').trim();

                    // BR Format (1.000,00) -> 1000.00
                    if (s.includes(',')) {
                        s = s.split('.').join('').replace(',', '.');
                    }
                    // Else assume US/JS format (1000.00) or plain integer

                    return parseFloat(s) || 0;
                };

                const parseDate = (val: any) => {
                    if (!val) return null;
                    try {
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? null : d.toISOString();
                    } catch { return null; }
                };

                // Map to SQL Columns
                const sqlBatch = batch.map(a => ({
                    // Identity
                    activity_id: a.id,
                    data_disparo: new Date(a.dataDisparo).toISOString(),
                    data_fim: parseDate(a.raw?.['Data Fim']),

                    bu: a.bu,
                    canal: a.canal,
                    segmento: a.segmento,
                    segmento_sigla: a.raw?.['SIGLA.1'],
                    subgrupo: a.raw?.['Subgrupos'],

                    jornada: a.jornada,
                    etapa_aquisicao: a.raw?.['Etapa de aquisição'],
                    ordem_disparo: a.ordemDisparo ? String(a.ordemDisparo) : null,

                    parceiro: a.parceiro,
                    parceiro_sigla: a.raw?.['SIGLA'],

                    safra: a.safraKey,

                    perfil_credito: a.raw?.['Perfil de Crédito'],
                    produto: a.raw?.['Produto'],

                    oferta: a.oferta,
                    oferta_sigla: a.raw?.['SIGLA.2'],
                    oferta_2: a.raw?.['Oferta 2'],
                    promocional: a.promocional,
                    promocional_2: a.raw?.['Promocional 2'],

                    disparado: a.raw?.['Disparado?'],

                    // Bases
                    base_total: parseNum(a.raw?.['Base Total']),
                    base_acionavel: parseNum(a.raw?.['Base Acionável']),
                    optimizacao_base: parseNum(a.raw?.['% Otimização de base']),
                    base_enviada: a.kpis.baseEnviada || parseNum(a.raw?.['Base Enviada']) || 0,

                    // Costs
                    custo_unitario_oferta: parseNum(a.raw?.['Custo Unitário Oferta']),
                    custo_total_oferta: parseNum(a.raw?.['Custo Total da Oferta']),
                    custo_unitario_canal: parseNum(a.raw?.['Custo unitário do canal']),
                    custo_total_canal: parseNum(a.raw?.['Custo total canal']),
                    custo_total_campanha: parseNum(a.raw?.['Custo Total Campanha']),
                    custo_total: a.kpis.custoTotal || parseNum(a.raw?.['Custo total canal']) || 0,

                    // Rates
                    taxa_entrega: parseNum(a.raw?.['Taxa de Entrega']),
                    taxa_abertura: parseNum(a.raw?.['Taxa de Abertura']),
                    taxa_clique: parseNum(a.raw?.['Taxa de Clique']),
                    taxa_proposta: parseNum(a.raw?.['Taxa de Proposta']),
                    taxa_aprovacao: parseNum(a.raw?.['Taxa de Aprovação']),
                    taxa_finalizacao: parseNum(a.raw?.['Taxa de Finalização']),
                    taxa_conversao: parseNum(a.raw?.['Taxa de Conversão']),

                    // KPIs
                    propostas: parseNum(a.raw?.['Propostas']),
                    aprovados: a.kpis.aprovados || parseNum(a.raw?.['Aprovados']) || 0,
                    cartoes_gerados: a.kpis.cartoes || parseNum(a.raw?.['Cartões Gerados']) || 0,
                    emissoes: a.kpis.emissoes || 0,
                    cac: a.kpis.cac || parseNum(a.raw?.['CAC']) || 0,

                    // Metadata
                    filename: 'migration_v3_full'
                }));

                const { error } = await supabase.from('activities').insert(sqlBatch);

                if (error) {
                    console.error(error);
                    addLog(`Erro no lote ${i}: ${error.code} - ${error.message}`);
                    // If error is 42P01 (undefined table), catch it
                    throw error;
                }

                processed += batch.length;
                setProgress(Math.round((processed / total) * 100));

                // Add minor delay to avoid rate limits if huge
                await new Promise(r => setTimeout(r, 100));
            }

            // 2. Migrate B2C Data
            if (b2cData.length > 0) {
                addLog(`Migrando ${b2cData.length} registros B2C...`);
                const b2cBatch = b2cData.map(d => ({
                    data: d.data, // YYYY-MM-DD
                    propostas_total: toNonNegativeInt(d.propostas_b2c_total),
                    emissoes_total: toNonNegativeInt(d.emissoes_b2c_total),
                    percentual_conversao: toFiniteNumber(d.percentual_conversao_b2c),
                    // cac_medio: ?? Not in B2CDataRow, likely calculated or null
                    observacoes: d.observacoes
                }));

                const { error: b2cError } = await supabase.from('b2c_daily_metrics').insert(b2cBatch);
                if (b2cError) throw b2cError;
                addLog('✅ Dados B2C migrados.');
            }

            // 3. Migrate Paid Media Data
            if (paidMediaData.length > 0) {
                addLog(`Migrando ${paidMediaData.length} registros de Mídia Paga...`);
                const paidBatch = paidMediaData.map(d => ({
                    date: d.date instanceof Date ? d.date.toISOString() : d.date,
                    channel: d.channel,
                    campaign: d.campaign,
                    objective: d.objective,
                    spend: toFiniteNumber(d.spend),
                    impressions: toNonNegativeInt(d.impressions),
                    clicks: toNonNegativeInt(d.clicks),
                    conversions: toNonNegativeInt(d.conversions),
                    ctr: toFiniteNumber(d.ctr),
                    cpc: toFiniteNumber(d.cpc),
                    cpm: toFiniteNumber(d.cpm),
                    cpa: toFiniteNumber(d.cpa)
                }));

                const { error: paidError } = await supabase.from('paid_media_metrics').insert(paidBatch);
                if (paidError) throw paidError;
                addLog('✅ Mídia Paga migrada.');
            }

            setStatus('done');
            addLog('✅ Migração Concluída com Sucesso!');
            alert('Dados migrados com sucesso para o Supabase!');

        } catch (error: any) {
            setStatus('error');
            addLog(`❌ Erro Fatal: ${error.message}`);
            if (error.message.includes('relation "activities" does not exist')) {
                addLog('⚠️ Tabela não encontrada! Execute o script SQL no Supabase primeiro.');
            }
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 shadow-inner">
                        <Database size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Migração de Dados (SQL)</h3>
                        <p className="text-sm text-slate-400">Transfira dados do navegador para o Supabase DB.</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/50 rounded p-4 mb-6 border border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">Registros em Memória (CSV):</span>
                    <span className="text-2xl font-bold text-white">{activities.length}</span>
                </div>

                {activities.length !== 511 && (
                    <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-900/20 p-2 rounded border border-amber-900/50 mt-2">
                        <AlertTriangle size={16} />
                        <span>Atenção: Esperado 511. Encontrado {activities.length}. Re-importe o CSV se necessário.</span>
                    </div>
                )}
            </div>

            {status === 'idle' && (
                <button
                    onClick={handleMigration}
                    disabled={activities.length === 0}
                    className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition
                        ${activities.length === 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}
                    `}
                >
                    <UploadCloud />
                    Iniciar Migração para Banco de Dados
                </button>
            )}

            {status !== 'idle' && (
                <div className="space-y-4">
                    <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${status === 'error' ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-center text-white font-bold">{progress}%</div>

                    <div className="bg-black/50 p-4 rounded h-40 overflow-y-auto font-mono text-xs text-green-400 border border-slate-700">
                        {log.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};
