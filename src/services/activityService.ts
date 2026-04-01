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
    const validated = ActivityFormSchema.parse(formData);

    const { data: maxOrder } = await supabase
        .from('activities')
        .select('"Ordem de disparo"')
        .eq('Segmento', segmento)
        .order('Ordem de disparo', { ascending: false })
        .limit(1);

    const nextOrder = (maxOrder?.[0]?.['Ordem de disparo'] || 0) + 1;

    const activityRow: Partial<ActivityRow> = {
        prog_gaas: true,
        status: validated.status,
        BU: validated.bu,
        jornada: validated.jornada,
        'Activity name / Taxonomia': validated.activityName,
        'Data de Disparo': validated.dataInicio,
        'Data Fim': validated.dataFim,
        Segmento: segmento,
        'Perfil de Crédito': validated.perfilCredito || null,
        Oferta: validated.oferta || null,
        Promocional: validated.promocional || null,
        'Oferta 2': validated.oferta2 || null,
        'Promocional 2': validated.promocional2 || null,
        Parceiro: validated.parceiro || null,
        Subgrupos: validated.subgrupo || null,
        'Etapa de aquisição': validated.etapaAquisicao || null,
        Produto: validated.produto || null,
        'Base Total': Number(validated.baseVolume) || null,
        'Ordem de disparo': validated.ordemDisparo === 'Pontual'
            ? 1
            : (Number(validated.ordemDisparo) || nextOrder),
        'Horário de Disparo': validated.horarioDisparo || '10:00',
        updated_at: new Date().toISOString(),
    };

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

export const getAllActivities = async (): Promise<ActivityRow[]> => {
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('Data de Disparo', { ascending: false })
        .limit(10000);

    if (error) throw error;
    return data || [];
};

export const syncFrameworkActivities = async (
    frameworkActivities: any[]
): Promise<void> => {
    const { error: deleteError } = await supabase
        .from('activities')
        .delete()
        .eq('prog_gaas', false);

    if (deleteError) {
        console.error('Erro ao limpar dados antigos:', deleteError);
        throw new Error('Falha ao limpar histórico antigo.');
    }

    if (frameworkActivities.length === 0) return;

    const sqlBatch = frameworkActivities.map((activity) => {
        const parseNum = (value: any): number | null => {
            if (typeof value === 'number') return Number.isFinite(value) ? value : null;
            if (value === null || value === undefined || value === '' || value === 'N/A' || value === '#DIV/0!') return null;

            let clean = String(value).trim().replace(/[R$\s%]/g, '');
            if (!clean || clean === '-') return null;

            if (clean.includes(',') && clean.includes('.')) {
                clean = clean.replace(/\./g, '').replace(',', '.');
            } else if (clean.includes(',')) {
                clean = clean.replace(',', '.');
            }

            const parsed = parseFloat(clean);
            return Number.isFinite(parsed) ? parsed : null;
        };

        const toISOSafe = (value: any): string | null => {
            if (!value) return null;
            if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
            const parsed = parseDate(String(value));
            if (parsed && Number.isFinite(parsed.getTime())) return parsed.toISOString();
            return null;
        };

        return {
            prog_gaas: false,
            status: 'Realizado',
            "Activity name / Taxonomia": activity.id || activity.raw?.['Activity name / Taxonomia'],
            "Data de Disparo": toISOSafe(activity.dataDisparo),
            "Data Fim": toISOSafe(activity.raw?.['Data Fim']),
            "BU": activity.bu,
            "Canal": activity.canal,
            "Safra": activity.safraKey || activity.raw?.['Safra'],
            "jornada": activity.jornada || activity.raw?.['Jornada'],
            "Parceiro": activity.parceiro,
            "SIGLA_Parceiro": activity.raw?.['SIGLA'],
            "Segmento": activity.segmento,
            "SIGLA_Segmento": activity.raw?.['SIGLA.1'],
            "Subgrupos": activity.raw?.['Subgrupos'],
            "Etapa de aquisição": activity.raw?.['Etapa de aquisição'],
            "Perfil de Crédito": activity.raw?.['Perfil de Crédito'],
            "Produto": activity.raw?.['Produto'],
            "Oferta": activity.oferta,
            "Promocional": activity.raw?.['Promocional'],
            "SIGLA_Oferta": activity.raw?.['SIGLA.2'],
            "Oferta 2": activity.raw?.['Oferta 2'],
            "Promocional 2": activity.raw?.['Promocional 2'],
            "Ordem de disparo": typeof activity.ordemDisparo === 'number'
                ? activity.ordemDisparo
                : tryParseInt(activity.raw?.['Ordem de disparo']),
            "Base Total": activity.kpis?.baseEnviada ?? parseNum(activity.raw?.['Base Total']),
            "Base Acionável": activity.kpis?.baseEntregue ?? parseNum(activity.raw?.['Base Acionável']),
            "Abertura": activity.kpis?.aberturas ?? parseNum(activity.raw?.['Abertura']),
            "Cliques": activity.kpis?.cliques ?? parseNum(activity.raw?.['Cliques']),
            "% Otimização de base": parseNum(activity.raw?.['% Otimização de base']),
            "Custo Unitário Oferta": parseNum(activity.raw?.['Custo Unitário Oferta']),
            "Custo Total da Oferta": parseNum(activity.raw?.['Custo Total da Oferta']),
            "Custo unitário do canal": parseNum(activity.raw?.['Custo unitário do canal']),
            "Custo total canal": parseNum(activity.raw?.['Custo total canal']),
            "Custo Total Campanha": activity.kpis?.custoTotal ?? parseNum(activity.raw?.['Custo Total Campanha']),
            "CAC": activity.kpis?.cac ?? parseNum(activity.raw?.['CAC']),
            "Taxa de Entrega": activity.kpis?.taxaEntrega ?? parseNum(activity.raw?.['Taxa de Entrega']),
            "Taxa de Abertura": activity.kpis?.taxaAbertura ?? parseNum(activity.raw?.['Taxa de Abertura']),
            "Taxa de Clique": parseNum(activity.raw?.['Taxa de Clique']),
            "Taxa de Proposta": activity.kpis?.taxaPropostas ?? parseNum(activity.raw?.['Taxa de Proposta']),
            "Taxa de Aprovação": activity.kpis?.taxaAprovacao ?? parseNum(activity.raw?.['Taxa de Aprovação']),
            "Taxa de Finalização": activity.kpis?.taxaFinalizacao ?? parseNum(activity.raw?.['Taxa de Finalização']),
            "Taxa de Conversão": activity.kpis?.taxaConversao ?? parseNum(activity.raw?.['Taxa de Conversão']),
            "Cartões Gerados": activity.kpis?.cartoes ?? parseNum(activity.raw?.['Cartões Gerados']),
            "Aprovados": activity.kpis?.aprovados ?? parseNum(activity.raw?.['Aprovados']),
            "Propostas": activity.kpis?.propostas ?? parseNum(activity.raw?.['Propostas']),
            "Emissões Independentes": activity.kpis?.emissoesIndependentes ?? parseNum(activity.raw?.['Emissões Independentes']),
            "Emissões Assistidas": activity.kpis?.emissoesAssistidas ?? parseNum(activity.raw?.['Emissões Assistidas'])
        };
    });

    console.log(`🔃 Sincronizando ${sqlBatch.length} atividades com Supabase...`);
    const CHUNK_SIZE = 100;

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

function tryParseInt(value: any): number | null {
    const parsed = parseInt(value);
    return Number.isNaN(parsed) ? null : parsed;
}

export const activityService = {
    saveActivity,
    updateActivity,
    deleteActivity,
    publishActivity,
    confirmDraft,
    getAllActivities,
    getActivitiesBySegment,
    syncFrameworkActivities
};

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
        const cleanName = file.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9._-]/g, '_');

        const filePath = `framework_versions/${Date.now()}_${cleanName}`;
        const { error: uploadError } = await supabase.storage
            .from('app-data')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data, error: dbError } = await supabase
            .from('framework_versions')
            .insert({
                filename: file.name,
                storage_path: filePath,
                row_count: rowCount,
                is_active: false
            })
            .select()
            .single();

        if (dbError) throw dbError;
        return data;
    },

    async activateVersion(versionId: string, parsedData: any[]) {
        await supabase
            .from('framework_versions')
            .update({ is_active: false })
            .neq('id', '00000000-0000-0000-0000-000000000000');

        await supabase
            .from('framework_versions')
            .update({ is_active: true })
            .eq('id', versionId);

        await syncFrameworkActivities(parsedData);
    },

    async deleteVersion(versionId: string, storagePath: string) {
        const { error: dbError } = await supabase
            .from('framework_versions')
            .delete()
            .eq('id', versionId);

        if (dbError) throw dbError;

        if (storagePath) {
            await supabase.storage
                .from('app-data')
                .remove([storagePath]);
        }
    }
};
