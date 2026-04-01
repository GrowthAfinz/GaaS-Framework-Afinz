import { supabase } from './supabaseClient';
import { parseDate } from '../utils/formatters';
import { ActivityFormSchema, ActivityFormInput } from '../schemas/ActivityFormSchema';
import { ActivityRow } from '../types/activity';

/**
 * Service Layer para operações Unificadas de Atividades (GaaS + Histórico)
 */

export const saveActivity = async (
    formData: ActivityFormInput,
    segmento: string
): Promise<ActivityRow> => {
    // 1. Validar com Zod
    const validated = ActivityFormSchema.parse(formData);

    // 2. Calcular próxima ordem para este segmento (considerando tabela unificada)
    // Nota: Isso pega o MAX ordem de QUALQUER atividade do segmento, histórico ou programado
    const { data: maxOrder } = await supabase
        .from('activities')
        .select('"Ordem de disparo"')
        .eq('Segmento', segmento)
        .order('Ordem de disparo', { ascending: false })
        .limit(1);

    const nextOrder = (maxOrder?.[0]?.['Ordem de disparo'] || 0) + 1;

    // 3. Montar ActivityRow completo
    // Mapeamento Input -> DB
    const activityRow: Partial<ActivityRow> = {
        // IDs e Controle
        prog_gaas: true, // FLAG IMPORTANTE: Identifica origem GaaS
        status: validated.status,

        // Dados do Form
        BU: validated.bu,
        jornada: validated.jornada,
        'Activity name / Taxonomia': validated.activityName,
        'Data de Disparo': validated.dataInicio,
        'Data Fim': validated.dataFim,
        Segmento: segmento,

        // Opcionais
        'Perfil de Crédito': validated.perfilCredito || null,
        Oferta: validated.oferta || null,
        Promocional: validated.promocional || null,
        'Oferta 2': validated.oferta2 || null,
        'Promocional 2': validated.promocional2 || null,

        // Novos campos
        Parceiro: validated.parceiro || null,
        Subgrupos: validated.subgrupo || null,
        'Etapa de aquisição': validated.etapaAquisicao || null,
        Produto: validated.produto || null,
        'Base Total': Number(validated.baseVolume) || null,

        // Calculados
        'Ordem de disparo': validated.ordemDisparo === 'Pontual'
            ? 1
            : (Number(validated.ordemDisparo) || nextOrder),

        // Horário de Disparo
        'Horário de Disparo': validated.horarioDisparo || '10:00',

        // Timestamps gerenciados pelo BD ou aqui
        updated_at: new Date().toISOString(),
    };

    // 4. INSERT
    const { data, error } = await supabase
        .from('activities')
        .insert(activityRow)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateActivity = async (
    id: string,
    updates: Partial<ActivityRow>
): Promise<ActivityRow> => {
    const { data, error } = await supabase
        .from('activities')
        .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteActivity = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

export const publishActivity = async (id: string): Promise<ActivityRow> => {
    return updateActivity(id, { status: 'Scheduled' });
};

/**
 * Confirma um rascunho, alterando o status para "Scheduled" (Programado)
 */
export const confirmDraft = async (id: string): Promise<ActivityRow> => {
    return updateActivity(id, { status: 'Scheduled' });
};

export const getActivitiesBySegment = async (
    segmento: string
): Promise<ActivityRow[]> => {
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('Segmento', segmento)
        .order('Data de Disparo', { ascending: true });

    if (error) throw error;
    return data || [];
};

/**
 * Busca todas as atividades (Históricas + Programadas)
 * Usado na carga inicial do App
 */
export const getAllActivities = async (): Promise<ActivityRow[]> => {
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('Data de Disparo', { ascending: false })
        .limit(10000);

    if (error) throw error;
    return data || [];
};

// ... existing code ...

/**
 * Sincroniza dados do Framework (Excel/CSV) com o Banco de Dados
 * Estratégia:
 * 1. Remove todos os registros históricos (prog_gaas = false)
 * 2. Insere os novos dados do CSV
 */
export const syncFrameworkActivities = async (
    frameworkActivities: any[]
): Promise<void> => {
    // 1. Limpar Histórico antigo (prog_gaas = false)
    // Isso preserva os agendamentos futuros criados no App (prog_gaas = true)
    const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('prog_gaas', false);

    if (deleteError) {
        console.error('Erro ao limpar dados antigos:', deleteError);
        throw new Error('Falha ao limpar histórico antigo.');
    }

    if (frameworkActivities.length === 0) return;

    // 2. Mapear para Formato SQL (Aspas e Tipos)
    const sqlBatch = frameworkActivities.map(a => {
        // Helper to parse numbers safely — returns null for blank/invalid cells
        // IMPORTANT: must return null (not 0) so blank CSV cells are not stored as zero
        const parseNum = (val: any): number | null => {
            if (typeof val === 'number') return Number.isFinite(val) ? val : null;
            if (val === null || val === undefined || val === '' || val === 'N/A' || val === '#DIV/0!') return null;
            let s = String(val).trim().replace(/[R$\s%]/g, '');
            if (!s || s === '-') return null;
            // BR Format handling (1.000,00)
            if (s.includes(',') && s.includes('.')) {
                s = s.replace(/\./g, '').replace(',', '.'); // 1.000,00 -> 1000.00
            } else if (s.includes(',')) {
                s = s.replace(',', '.'); // 10,5 -> 10.5
            }
            const n = parseFloat(s);
            return Number.isFinite(n) ? n : null;
        };

        // Helper to safely serialize a date value (Date object OR any string format) to ISO
        const toISOSafe = (val: any): string | null => {
            if (!val) return null;
            if (val instanceof Date) return Number.isFinite(val.getTime()) ? val.toISOString() : null;
            const parsed = parseDate(String(val));
            if (parsed && Number.isFinite(parsed.getTime())) return parsed.toISOString();
            return null;
        };

        return {
            // Controle Interno
            prog_gaas: false,
            status: 'Realizado', // Histórico assume realizado/importado

            // Core IDs
            // Mapeando o ID "slug" do CSV para o campo de Taxonomia
            "Activity name / Taxonomia": a.id || a.raw?.['Activity name / Taxonomia'],

            "Data de Disparo": toISOSafe(a.dataDisparo),
            "Data Fim": toISOSafe(a.raw?.['Data Fim']),

            "BU": a.bu,
            "Canal": a.canal,
            "Safra": a.safraKey || a.raw?.['Safra'],

            // Segmentação
            "jornada": a.jornada || a.raw?.['Jornada'],
            "Parceiro": a.parceiro,
            "SIGLA_Parceiro": a.raw?.['SIGLA'],
            "Segmento": a.segmento,
            "SIGLA_Segmento": a.raw?.['SIGLA.1'],
            "Subgrupos": a.raw?.['Subgrupos'],
            "Etapa de aquisição": a.raw?.['Etapa de aquisição'],
            "Perfil de Crédito": a.raw?.['Perfil de Crédito'],

            // Ofertas
            "Produto": a.raw?.['Produto'],
            "Oferta": a.oferta,
            "Promocional": a.raw?.['Promocional'],
            "SIGLA_Oferta": a.raw?.['SIGLA.2'],
            "Oferta 2": a.raw?.['Oferta 2'],
            "Promocional 2": a.raw?.['Promocional 2'],
            "Ordem de disparo": typeof a.ordemDisparo === 'number' ? a.ordemDisparo : tryParseInt(a.raw?.['Ordem de disparo']),

            // Métricas (Priorizar KPIs já calculados pelo Worker)
            "Base Total": a.kpis?.baseEnviada ?? parseNum(a.raw?.['Base Total']),
            "Base Acionável": a.kpis?.baseEntregue ?? parseNum(a.raw?.['Base Acionável']),
            "% Otimização de base": parseNum(a.raw?.['% Otimização de base']),

            // Financeiro
            "Custo Unitário Oferta": parseNum(a.raw?.['Custo Unitário Oferta']),
            "Custo Total da Oferta": parseNum(a.raw?.['Custo Total da Oferta']),
            "Custo unitário do canal": parseNum(a.raw?.['Custo unitário do canal']),
            "Custo total canal": parseNum(a.raw?.['Custo total canal']),
            "Custo Total Campanha": a.kpis?.custoTotal ?? parseNum(a.raw?.['Custo Total Campanha']),
            "CAC": a.kpis?.cac ?? parseNum(a.raw?.['CAC']),

            // Taxas
            "Taxa de Entrega": a.kpis?.taxaEntrega ?? parseNum(a.raw?.['Taxa de Entrega']),
            "Taxa de Abertura": a.kpis?.taxaAbertura ?? parseNum(a.raw?.['Taxa de Abertura']),
            "Taxa de Clique": parseNum(a.raw?.['Taxa de Clique']),
            "Taxa de Proposta": a.kpis?.taxaPropostas ?? parseNum(a.raw?.['Taxa de Proposta']),
            "Taxa de Aprovação": a.kpis?.taxaAprovacao ?? parseNum(a.raw?.['Taxa de Aprovação']),
            "Taxa de Finalização": a.kpis?.taxaFinalizacao ?? parseNum(a.raw?.['Taxa de Finalização']),
            "Taxa de Conversão": a.kpis?.taxaConversao ?? parseNum(a.raw?.['Taxa de Conversão']),

            // Volumes e Resultados
            "Cartões Gerados": a.kpis?.cartoes ?? parseNum(a.raw?.['Cartões Gerados']),
            "Aprovados": a.kpis?.aprovados ?? parseNum(a.raw?.['Aprovados']),
            "Propostas": a.kpis?.propostas ?? parseNum(a.raw?.['Propostas']),
            "Emissões Independentes": a.kpis?.emissoesIndependentes ?? parseNum(a.raw?.['Emissões Independentes']),
            "Emissões Assistidas": a.kpis?.emissoesAssistidas ?? parseNum(a.raw?.['Emissões Assistidas'])
        };
    });

    // 3. Insert Batch (Chunked to avoid size limits)
    console.log(`🔃 Sincronizando ${sqlBatch.length} atividades com Supabase...`);
    const CHUNK_SIZE = 100; // Smaller batches are MORE robust
    for (let i = 0; i < sqlBatch.length; i += CHUNK_SIZE) {
        const chunk = sqlBatch.slice(i, i + CHUNK_SIZE);
        const currentBatch = i / CHUNK_SIZE + 1;
        const totalBatches = Math.ceil(sqlBatch.length / CHUNK_SIZE);
        
        console.log(`📤 Enviando lote ${currentBatch} de ${totalBatches}... (${chunk.length} linhas)`);
        
        const { error } = await supabase.from('activities').insert(chunk);
        if (error) {
            console.error(`❌ Erro no lote ${currentBatch}:`, error);
            throw new Error(`Erro ao sincronizar lote ${currentBatch}: ${error.message}`);
        }
    }
    console.log('✅ Sincronização concluída com sucesso!');
};

function tryParseInt(val: any): number | null {
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
}

export const activityService = {
    saveActivity,
    updateActivity,
    deleteActivity,
    publishActivity,
    confirmDraft,
    getAllActivities,
    getActivitiesBySegment,
    syncFrameworkActivities // Export new function
};

/**
 * Service Layer para Versionamento de Framework
 */
export const versionService = {
    async listVersions() {
        const { data, error } = await supabase
            .from('framework_versions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async uploadVersion(file: File, rowCount: number) {
        // 1. Upload Storage (Sanitize filename to avoid "Invalid Key")
        // Remove accents and special chars
        const cleanName = file.name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-zA-Z0-9._-]/g, "_"); // Replace spaces/others with _

        const filePath = `framework_versions/${Date.now()}_${cleanName}`;
        const { error: uploadError } = await supabase.storage
            .from('app-data')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Insert DB
        const { data, error: dbError } = await supabase
            .from('framework_versions')
            .insert({
                filename: file.name,
                storage_path: filePath,
                row_count: rowCount,
                is_active: false // Default not active
            })
            .select() // Return inserted row
            .single();

        if (dbError) throw dbError;
        return data;
    },

    async activateVersion(versionId: string, parsedData: any[]) {
        // 1. Deactivate all others
        await supabase
            .from('framework_versions')
            .update({ is_active: false })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Safety

        // 2. Activate this one
        await supabase
            .from('framework_versions')
            .update({ is_active: true })
            .eq('id', versionId);

        // 3. Sync Data (Wipe & Replace)
        await syncFrameworkActivities(parsedData);
    },

    async deleteVersion(versionId: string, storagePath: string) {
        // 1. Delete DB
        const { error: dbError } = await supabase
            .from('framework_versions')
            .delete()
            .eq('id', versionId);

        if (dbError) throw dbError;

        // 2. Delete Storage
        if (storagePath) {
            await supabase.storage
                .from('app-data')
                .remove([storagePath]);
        }
    }
};
