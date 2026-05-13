import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ActivityRow, ActivityStatus } from '../../../types/activity';
import { useAppStore } from '../../../store/useAppStore';
import {
    CUSTO_UNITARIO_CANAL,
    CUSTO_UNITARIO_OFERTA,
    generateSafra,
    calculateOrdemDisparo,
    suggestActivityName,
    calcularCustoTotalOferta,
    calcularCustoTotalCanal,
    calcularCustoTotalCampanha,
    BU_SEGMENTO_MAP,
    SEGMENTO_CONTEXT_MAP,
    OFERTA_DETALHE_MAP
} from '../../../constants/frameworkFields';
import { suggestFieldsBasedOnHistory } from '../../../utils/intelligentSuggestions';
import { getAIOrchestrator } from '../../../services/ml/AIOrchestrator';
import type { Canal } from '../../../constants/frameworkFields';
import type { FieldProjection } from '../../../services/ml/types';

/**
 * =============================================================================
 * VALIDAÇÃO DE CAMPOS MÍNIMOS - Garantir Projeções Cientificamente Válidas
 * =============================================================================
 */

// Tipo para tracking de readiness das projeções
export type ProjectionReadiness = 'insufficient' | 'partial' | 'good' | 'excellent';

// Campos CRÍTICOS necessários para que as projeções sejam cientificamente válidas
const MINIMUM_REQUIRED_FIELDS = {
    bu: true,           // BU é obrigatório (15% weight)
    segmento: true,     // Segmento/Campanha é obrigatório (15% weight)
    canal: true,        // Canal crítico: afeta custos e comportamento (12% weight)
    baseVolume: true    // Volume crítico: base de todos os cálculos de funil
} as const;

/**
 * Verifica se os campos mínimos necessários foram preenchidos
 * para gerar projeções cientificamente válidas
 */
function hasMinimumRequiredFields(formData: any): boolean {
    return !!(
        formData.bu &&
        formData.segmento &&
        formData.canal &&                    // NOVO REQUISITO: Canal (12% weight)
        formData.baseVolume &&               // NOVO REQUISITO: Volume (fator X)
        Number(formData.baseVolume) > 0      // Volume deve ser positivo
    );
}

/**
 * Determina o nível de readiness das projeções baseado em campos preenchidos
 *
 * NÍVEIS:
 * - insufficient: Não há dados suficientes para projetar (faltam campos críticos)
 * - partial: Apenas campos críticos preenchidos (BU+Segmento+Canal+Volume)
 * - good: Campos críticos + 1-2 campos importantes (Oferta, Jornada, etc)
 * - excellent: Campos críticos + 3+ campos importantes (máxima precisão)
 */
function determineProjectionReadiness(formData: any): ProjectionReadiness {
    const hasMinimum = hasMinimumRequiredFields(formData);

    if (!hasMinimum) {
        return 'insufficient';
    }

    // Contar campos importantes preenchidos (além dos 4 críticos)
    const importantFields = [
        formData.oferta,           // 8% weight - afeta conversão e custo
        formData.jornada,          // 10% weight - afeta performance
        formData.perfilCredito,    // 10% weight - afeta aprovação
        formData.parceiro,         // 5% weight - afeta disponibilidade
        formData.produto,          // 5% weight - afeta aprovação
    ].filter(Boolean).length;

    if (importantFields >= 3) {
        return 'excellent';  // 4 críticos + 3+ importantes = máxima precisão
    }
    if (importantFields >= 1) {
        return 'good';       // 4 críticos + 1-2 importantes = boa confiança
    }
    return 'partial';        // Apenas 4 campos críticos = projeções básicas
}

/**
 * Form Input - Todos os campos do formulario de disparo
 */
export interface DispatchFormData {
    // Identificacao
    bu: 'B2C' | 'B2B2C' | 'Plurix' | 'Bem Barato' | '';
    segmento: string;
    jornada: string;
    activityName: string;
    canal: Canal | '';
    parceiro: string;
    subgrupo: string;

    // Cronograma
    dataInicio: string;
    dataFim: string;
    horarioDisparo: string;
    safra: string;
    ordemDisparo: number | string;

    // Produto & Oferta
    produto: string;
    perfilCredito: string;
    etapaAquisicao: string;
    oferta: string;
    promocional: string;
    oferta2: string;
    promocional2: string;

    // Investimento
    baseVolume: string;
    custoUnitarioOferta: string;
    custoTotalOferta: string;
    custoUnitarioCanal: string;
    custoTotalCanal: string;
    custoTotalCampanha: string;

    // Status
    status: ActivityStatus;
}

/**
 * Opcao com frequencia para Combobox
 */
export interface OptionWithFrequency {
    value: string;
    count: number;
    isSmart?: boolean; // Se veio do Framework
}

/**
 * Opcoes historicas extraidas do banco COM FREQUENCIA
 * PILAR: Automatizacao por Historico - ordenado por uso
 */
export interface HistoricalOptions {
    segmentos: OptionWithFrequency[];
    perfisCredito: OptionWithFrequency[];
    ofertas: OptionWithFrequency[];
    ofertas2: OptionWithFrequency[];
    promocionais: OptionWithFrequency[];
    promocionais2: OptionWithFrequency[];
    jornadas: OptionWithFrequency[];
    parceiros: OptionWithFrequency[];
    subgrupos: OptionWithFrequency[];
    etapasAquisicao: OptionWithFrequency[];
    produtos: OptionWithFrequency[];
    canais: OptionWithFrequency[];
}

/**
 * Interface do Context
 */
interface DispatchFormContextValue {
    // Estado do form
    formData: DispatchFormData;
    setFormData: React.Dispatch<React.SetStateAction<DispatchFormData>>;
    handleChange: (field: keyof DispatchFormData, value: string | number) => void;

    // Erros de validacao
    errors: Record<string, string>;
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;

    // Opcoes INTELIGENTES (Framework + Historico)
    smartOptions: HistoricalOptions;

    // Projecoes IA
    projections: Record<string, FieldProjection>;

    // Readiness das projeções (novo!)
    projectionReadiness: ProjectionReadiness;

    // Estado de loading
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

    // Activity sendo editada
    editingActivity: ActivityRow | null;

    // Activities (historico)
    activities: ActivityRow[];
}

const DispatchFormContext = createContext<DispatchFormContextValue | null>(null);

/**
 * Hook para usar o context
 */
export const useDispatchForm = () => {
    const context = useContext(DispatchFormContext);
    if (!context) {
        throw new Error('useDispatchForm deve ser usado dentro de DispatchFormProvider');
    }
    return context;
};

/**
 * Props do Provider
 */
interface DispatchFormProviderProps {
    children: React.ReactNode;
    editingActivity?: ActivityRow | null;
    activeSegmento: string;
}

/**
 * Valor inicial do form
 */
const INITIAL_FORM_DATA: DispatchFormData = {
    bu: '',
    segmento: '',
    jornada: '',
    activityName: '',
    canal: '',
    parceiro: '',
    subgrupo: '',
    dataInicio: '',
    dataFim: '',
    horarioDisparo: '10:00',
    safra: '',
    ordemDisparo: 1,
    produto: 'Classic',
    perfilCredito: '',
    etapaAquisicao: '',
    oferta: '',
    promocional: '',
    oferta2: '',
    promocional2: '',
    baseVolume: '',
    custoUnitarioOferta: '',
    custoTotalOferta: '',
    custoUnitarioCanal: '',
    custoTotalCanal: '',
    custoTotalCampanha: '',
    status: 'Rascunho',
};

/**
 * Provider do context
 */
export const DispatchFormProvider: React.FC<DispatchFormProviderProps> = ({
    children,
    editingActivity = null,
    activeSegmento,
}) => {
    const [formData, setFormData] = useState<DispatchFormData>(INITIAL_FORM_DATA);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [projections, setProjections] = useState<Record<string, FieldProjection>>({});
    const [projectionReadiness, setProjectionReadiness] = useState<ProjectionReadiness>('insufficient');

    // Buscar activities e framework data do store
    const activities = useAppStore((state) => state.activities) as unknown as ActivityRow[];
    const frameworkData = useAppStore((state) => state.frameworkData) || [];

    // 1. Extrair Opcoes HISTORICAS COM FILTRAGEM DINÂMICA EM CASCATA
    // Cada campo mostra contagens filtradas pelos campos anteriores selecionados
    const historicalOptions = useMemo<HistoricalOptions>(() => {
        // Helper para incrementar contagem
        const increment = (map: Map<string, number>, value: string | undefined | null) => {
            if (value && typeof value === 'string' && value.trim()) {
                const cleanValue = value.trim();
                map.set(cleanValue, (map.get(cleanValue) || 0) + 1);
            }
        };

        // Helper para converter Map em array ordenado por frequencia
        const mapToSortedArray = (map: Map<string, number>): OptionWithFrequency[] => {
            return Array.from(map.entries())
                .map(([value, count]) => ({ value, count, isSmart: false }))
                .sort((a, b) => b.count - a.count);
        };

        // Helper para extrair raw data
        const getRaw = (activity: any) => activity.raw || activity;

        // ============================================
        // FILTROS EM CASCATA
        // Cada nível filtra baseado nos campos anteriores
        // ============================================

        // Nível 0: Todas as activities
        const allActivities = activities;

        // Nível 1: Filtrado por BU (se selecionada)
        const activitiesByBU = formData.bu
            ? allActivities.filter((a: any) => getRaw(a).BU === formData.bu)
            : allActivities;

        // Nível 2: Filtrado por BU + Campanha (se selecionada)
        const activitiesByBUCampanha = formData.segmento
            ? activitiesByBU.filter((a: any) => getRaw(a).Segmento === formData.segmento)
            : activitiesByBU;

        // Nível 3: Filtrado por BU + Campanha + Canal (apenas para Parceiro)
        const activitiesByBUCampanhaCanal = formData.canal
            ? activitiesByBUCampanha.filter((a: any) => {
                const raw = getRaw(a);
                return (raw.Canal || raw.canal) === formData.canal;
            })
            : activitiesByBUCampanha;

        // Nível 4: Filtrado por BU + Campanha + Oferta (para Promocional, Oferta2, Promo2)
        const activitiesByBUCampanhaOferta = formData.oferta
            ? activitiesByBUCampanha.filter((a: any) => getRaw(a).Oferta === formData.oferta)
            : activitiesByBUCampanha;

        // ============================================
        // COMPUTAR CONTAGENS PARA CADA CAMPO
        // Usando o nível de filtro apropriado
        // ============================================

        // Campanha: filtrada por BU
        const segmentosMap = new Map<string, number>();
        activitiesByBU.forEach((a: any) => increment(segmentosMap, getRaw(a).Segmento));

        // Jornada: filtrada por BU + Campanha
        const jornadasMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => {
            const raw = getRaw(a);
            increment(jornadasMap, raw.Jornada || raw.jornada);
        });

        // Canal: filtrada por BU + Campanha
        const canaisMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => {
            const raw = getRaw(a);
            increment(canaisMap, raw.Canal || raw.canal);
        });

        // Parceiro: filtrada por BU + Campanha + Canal
        const parceirosMap = new Map<string, number>();
        activitiesByBUCampanhaCanal.forEach((a: any) => increment(parceirosMap, getRaw(a).Parceiro));

        // Subgrupo: filtrada por BU + Campanha
        const subgruposMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => increment(subgruposMap, getRaw(a).Subgrupos));

        // Produto: filtrada por BU + Campanha
        const produtosMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => increment(produtosMap, getRaw(a).Produto));

        // Perfil Crédito: filtrada por BU + Campanha
        const perfisMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => increment(perfisMap, getRaw(a)['Perfil de Crédito']));

        // Etapa Funil: filtrada por BU + Campanha
        const etapasMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => increment(etapasMap, getRaw(a)['Etapa de aquisição']));

        // Oferta: filtrada por BU + Campanha
        const ofertasMap = new Map<string, number>();
        activitiesByBUCampanha.forEach((a: any) => increment(ofertasMap, getRaw(a).Oferta));

        // Promocional: filtrada por BU + Campanha + Oferta
        const promocionaisMap = new Map<string, number>();
        activitiesByBUCampanhaOferta.forEach((a: any) => increment(promocionaisMap, getRaw(a).Promocional));

        // Oferta 2: filtrada por BU + Campanha + Oferta
        const ofertas2Map = new Map<string, number>();
        activitiesByBUCampanhaOferta.forEach((a: any) => increment(ofertas2Map, getRaw(a)['Oferta 2']));

        // Promocional 2: filtrada por BU + Campanha + Oferta
        const promocionais2Map = new Map<string, number>();
        activitiesByBUCampanhaOferta.forEach((a: any) => increment(promocionais2Map, getRaw(a)['Promocional 2']));

        // Log para debug
        console.log('%c[Dynamic Options] Cascading Filter Stats', 'color: #8B5CF6; font-weight: bold;', {
            totalActivities: allActivities.length,
            afterBU: activitiesByBU.length,
            afterCampanha: activitiesByBUCampanha.length,
            afterCanal: activitiesByBUCampanhaCanal.length,
            afterOferta: activitiesByBUCampanhaOferta.length,
            filters: {
                bu: formData.bu || '(all)',
                campanha: formData.segmento || '(all)',
                canal: formData.canal || '(all)',
                oferta: formData.oferta || '(all)'
            }
        });

        return {
            segmentos: mapToSortedArray(segmentosMap),
            perfisCredito: mapToSortedArray(perfisMap),
            ofertas: mapToSortedArray(ofertasMap),
            ofertas2: mapToSortedArray(ofertas2Map),
            promocionais: mapToSortedArray(promocionaisMap),
            promocionais2: mapToSortedArray(promocionais2Map),
            jornadas: mapToSortedArray(jornadasMap),
            parceiros: mapToSortedArray(parceirosMap),
            subgrupos: mapToSortedArray(subgruposMap),
            etapasAquisicao: mapToSortedArray(etapasMap),
            produtos: mapToSortedArray(produtosMap),
            canais: mapToSortedArray(canaisMap),
        };
    }, [activities, formData.bu, formData.segmento, formData.canal, formData.oferta]);


    // 2. Mesclar com Opcoes SMART (Framework) - preservando contagens reais
    const smartOptions = useMemo<HistoricalOptions>(() => {
        // Helper para mesclagem - combina, filtra zeros, e ordena por contagem (maior para menor)
        const mergeOptions = (smartList: string[] | undefined, historicalList: OptionWithFrequency[]) => {
            if (!smartList || smartList.length === 0) return historicalList;

            // Criar mapa de contagens do histórico
            const historicalMap = new Map(historicalList.map(opt => [opt.value, opt.count]));

            // Converter smart em objetos OptionWithFrequency COM contagem real
            const smartObjs = smartList.map(val => ({
                value: val,
                count: historicalMap.get(val) || 0,
                isSmart: true
            }));

            // Filtrar historicos que JA estao na lista smart
            const smartSet = new Set(smartList);
            const pureHistorical = historicalList.filter(opt => !smartSet.has(opt.value));

            // Combinar TODAS as opções, filtrar os que têm count = 0, e ordenar (maior para menor)
            const allOptions = [...smartObjs, ...pureHistorical];
            return allOptions
                .filter(opt => opt.count > 0) // Remove opções fora do contexto (sem dados)
                .sort((a, b) => b.count - a.count);
        };

        // --- Lógica Hierárquica ---

        // 1. Segmentos baseados na BU
        const smartSegmentos = formData.bu ? BU_SEGMENTO_MAP[formData.bu] : [];

        // 2. Parceiros/Subgrupos baseados no Segmento
        const segmentContext = SEGMENTO_CONTEXT_MAP[formData.segmento] || {};
        const smartParceiros = segmentContext.parceiros || [];
        const smartSubgrupos = segmentContext.subgrupos || [];

        // 3. Detalhes (Promocional) baseados na Oferta
        const smartPromocionais = OFERTA_DETALHE_MAP[formData.oferta] || [];

        // 3b. Detalhes para Oferta 2 (secundária)
        const smartPromocionais2 = OFERTA_DETALHE_MAP[formData.oferta2] || [];

        // 4. Jornadas do Framework (Extrair do CSV importado, não do histórico sujo)
        // Isso garante que apenas Jornadas "Oficiais" apareçam com estrela
        const smartJornadas = Array.from(new Set(
            frameworkData
                .map(row => row.Jornada || row.jornada) // FrameworkRow usually has Capitalized keys or lowercase depending on parsing
                .filter(Boolean)
        )) as string[];

        return {
            ...historicalOptions,
            segmentos: mergeOptions(smartSegmentos, historicalOptions.segmentos),
            parceiros: mergeOptions(smartParceiros, historicalOptions.parceiros),
            subgrupos: mergeOptions(smartSubgrupos, historicalOptions.subgrupos),
            promocionais: mergeOptions(smartPromocionais, historicalOptions.promocionais),
            promocionais2: mergeOptions(smartPromocionais2, historicalOptions.promocionais2),
            jornadas: mergeOptions(smartJornadas, historicalOptions.jornadas),
        };
    }, [historicalOptions, formData.bu, formData.segmento, formData.oferta, formData.oferta2, frameworkData]);

    // Handler para mudanca de campo
    const handleChange = useCallback((field: keyof DispatchFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    }, [errors]);

    // Effect 1: Preencher form se editando
    useEffect(() => {
        if (editingActivity) {
            setFormData({
                bu: editingActivity.BU as any,
                segmento: editingActivity.Segmento,
                jornada: editingActivity.jornada,
                activityName: editingActivity['Activity name / Taxonomia'],
                canal: (editingActivity.Canal || '') as Canal,
                parceiro: editingActivity.Parceiro || '',
                subgrupo: editingActivity.Subgrupos || '',
                dataInicio: editingActivity['Data de Disparo'],
                dataFim: editingActivity['Data Fim'],
                horarioDisparo: editingActivity['Horário de Disparo'] || '10:00',
                safra: editingActivity.Safra || '',
                ordemDisparo: editingActivity['Ordem de disparo'] || 1,
                produto: editingActivity.Produto || 'Classic',
                perfilCredito: editingActivity['Perfil de Crédito'] || '',
                etapaAquisicao: editingActivity['Etapa de aquisição'] || '',
                oferta: editingActivity.Oferta || '',
                promocional: editingActivity.Promocional || '',
                oferta2: editingActivity['Oferta 2'] || '',
                promocional2: editingActivity['Promocional 2'] || '',
                baseVolume: String(editingActivity['Base Total'] || ''),
                custoUnitarioOferta: '',
                custoTotalOferta: '',
                custoUnitarioCanal: '',
                custoTotalCanal: '',
                custoTotalCampanha: '',
                status: editingActivity.status,
            });
        } else {
            setFormData({
                ...INITIAL_FORM_DATA,
                segmento: activeSegmento,
            });
            setErrors({});
        }
    }, [editingActivity, activeSegmento]);

    // Effect 2: Auto-fill Data Fim
    useEffect(() => {
        if (formData.dataInicio && !editingActivity) {
            const startDate = new Date(formData.dataInicio);
            startDate.setDate(startDate.getDate() + 2);
            const endDate = startDate.toISOString().split('T')[0];
            setFormData(prev => ({ ...prev, dataFim: endDate }));
        }
    }, [formData.dataInicio, editingActivity]);

    // Effect 3: Auto-calculo Safra
    useEffect(() => {
        if (formData.dataInicio) {
            const safra = generateSafra(formData.dataInicio);
            setFormData(prev => ({ ...prev, safra }));
        }
    }, [formData.dataInicio]);

    // Effect 4: Auto-calculo Ordem de Disparo
    useEffect(() => {
        if (formData.jornada && formData.dataInicio && !editingActivity) {
            const ordem = calculateOrdemDisparo(formData.jornada, formData.dataInicio, activities);
            setFormData(prev => ({ ...prev, ordemDisparo: ordem }));
        }
    }, [formData.jornada, formData.dataInicio, activities, editingActivity]);

    // Effect 5: Auto-sugestao Activity Name
    useEffect(() => {
        if (formData.bu && formData.segmento && formData.jornada && formData.safra && formData.ordemDisparo && !editingActivity) {
            const ordemNum = typeof formData.ordemDisparo === 'number' ? formData.ordemDisparo : 1;
            const suggestedName = suggestActivityName(
                formData.bu,
                formData.segmento,
                formData.jornada,
                ordemNum,
                formData.safra
            );
            if (suggestedName && !formData.activityName) {
                setFormData(prev => ({ ...prev, activityName: suggestedName }));
            }
        }
    }, [formData.bu, formData.segmento, formData.jornada, formData.safra, formData.ordemDisparo, editingActivity, formData.activityName]);

    // Effect 6: Custo Unitario Canal
    useEffect(() => {
        if (formData.canal && CUSTO_UNITARIO_CANAL[formData.canal as Canal]) {
            setFormData(prev => ({
                ...prev,
                custoUnitarioCanal: String(CUSTO_UNITARIO_CANAL[formData.canal as Canal].toFixed(3))
            }));
        }
    }, [formData.canal]);

    // Effect 7: Custo Unitario Oferta
    useEffect(() => {
        if (formData.oferta && CUSTO_UNITARIO_OFERTA[formData.oferta]) {
            setFormData(prev => ({
                ...prev,
                custoUnitarioOferta: String(CUSTO_UNITARIO_OFERTA[formData.oferta].toFixed(2))
            }));
        }
    }, [formData.oferta]);

    // Effect 8: Custos Totais
    useEffect(() => {
        const baseVol = Number(formData.baseVolume) || 0;
        const custoUnitOferta = Number(formData.custoUnitarioOferta) || 0;
        const custoUnitCanal = Number(formData.custoUnitarioCanal) || 0;

        if (baseVol > 0) {
            const custoTotalOf = calcularCustoTotalOferta(custoUnitOferta, baseVol);
            const custoTotalCan = calcularCustoTotalCanal(custoUnitCanal, baseVol);
            const custoTotalCamp = calcularCustoTotalCampanha(custoTotalOf, custoTotalCan);

            setFormData(prev => ({
                ...prev,
                custoTotalOferta: String(custoTotalOf.toFixed(2)),
                custoTotalCanal: String(custoTotalCan.toFixed(2)),
                custoTotalCampanha: String(custoTotalCamp.toFixed(2)),
            }));
        }
    }, [formData.baseVolume, formData.custoUnitarioOferta, formData.custoUnitarioCanal]);

    // Effect 9: Projecoes IA com AIOrchestrator
    useEffect(() => {
        // VALIDAÇÃO DE CAMPOS MÍNIMOS - NOVO BLOQUEIO!
        // Apenas projeta se BU + Segmento + Canal + Volume estão preenchidos
        if (!hasMinimumRequiredFields(formData)) {
            // Identificar quais campos faltam
            const missing: string[] = [];
            if (!formData.bu) missing.push('BU');
            if (!formData.segmento) missing.push('Segmento');
            if (!formData.canal) missing.push('Canal');
            if (!formData.baseVolume || Number(formData.baseVolume) === 0) missing.push('Volume');

            console.log(
                '%c[AI Projection] Aguardando campos mínimos',
                'color: #F59E0B; font-weight: bold;',
                {
                    faltam: missing.join(', '),
                    mensagem: 'Preencha BU, Segmento, Canal e Volume para gerar projeções'
                }
            );

            // Limpar projeções anteriores
            setProjections({});
            setProjectionReadiness('insufficient');
            return; // EARLY RETURN - não projeta!
        }

        // Campos mínimos OK - agora calcular readiness
        const readiness = determineProjectionReadiness(formData);
        setProjectionReadiness(readiness);

        const startTime = performance.now();

        if (formData.bu && activities.length > 0) {
            try {
                // Converter Activity[] para ActivityRow[] (usando .raw)
                const activityRows = activities
                    .filter((a: any) => a.raw != null)
                    .map((a: any) => ({
                        ...a.raw,
                        // Garantir campos obrigatórios existem
                        'Data de Disparo': a.raw['Data de Disparo'] || (a.dataDisparo ? new Date(a.dataDisparo).toISOString().split('T')[0] : ''),
                        'BU': a.raw.BU || a.bu,
                        'Segmento': a.raw.Segmento || a.segmento
                    } as any));

                if (activityRows.length === 0) {
                    console.warn('[DispatchContext] No valid activities with .raw data');
                    setProjections({});
                    return;
                }

                // Inicializar AIOrchestrator
                const orchestrator = getAIOrchestrator({
                    temporalWindow: 90,
                    similarityWeights: {
                        BU: 0.15,
                        Segmento: 0.15,
                        Canal: 0.12,
                        Jornada: 0.10,
                        Perfil_Credito: 0.10,
                        Oferta: 0.08,
                        Promocional: 0.05,
                        Parceiro: 0.05,
                        Subgrupo: 0.05,
                        Etapa_Aquisicao: 0.05,
                        Produto: 0.05,
                        Temporal: 0.05
                    },
                    minSampleSize: 5
                });

                // Inicializar com dados históricos
                orchestrator.initialize(activityRows);

                // Preparar input do form
                // IMPORTANTE: As chaves devem corresponder EXATAMENTE ao dimensionMappings do similarityEngine!
                // Usar camelCase minúsculo (bu, jornada, perfilCredito, etc)
                const formInput: any = {
                    bu: formData.bu,
                    segmento: formData.segmento || '',
                    canal: formData.canal || undefined,
                    jornada: formData.jornada || undefined,  // minúscula!
                    perfilCredito: formData.perfilCredito || undefined,  // camelCase!
                    oferta: formData.oferta || undefined,
                    promocional: formData.promocional || undefined,
                    parceiro: formData.parceiro || undefined,
                    subgrupo: formData.subgrupo || undefined,
                    etapaAquisicao: formData.etapaAquisicao || undefined,  // camelCase!
                    produto: formData.produto || undefined,
                    volume: formData.baseVolume ? Number(formData.baseVolume) : undefined
                };

                console.log('[Effect 9] Form Input Fields:', {
                    bu: formInput.bu,
                    segmento: formInput.segmento,
                    canal: formInput.canal,
                    jornada: formInput.jornada,
                    perfilCredito: formInput.perfilCredito,
                    oferta: formInput.oferta,
                    volume: formInput.volume
                });

                // Projetar TODOS os campos
                const result = orchestrator.projectAllFields(formInput);

                // Extrair apenas o objeto 'projections' do resultado
                const allProjections = result.projections || {};

                // Formatar para compatibilidade com UI
                const formattedProjections: Record<string, FieldProjection> = {};
                Object.entries(allProjections).forEach(([key, value]) => {
                    formattedProjections[key] = value as FieldProjection;
                });

                setProjections(formattedProjections);

                const endTime = performance.now();

                // LOG DETALHADO: Métricas chave
                console.log('%c[AI Projection] RESULTADOS COMPLETOS', 'color: #00ff00; font-weight: bold; font-size: 12px;', {
                    totalActivities: orchestrator.getDatasetStats().totalActivities,
                    sampleSize: result.totalSampleSize,
                    overallConfidence: result.overallConfidence + '%',
                    execTime: Math.round(endTime - startTime) + 'ms',
                    volume: {
                        projected: formattedProjections.volume?.projectedValue,
                        confidence: formattedProjections.volume?.confidence,
                        method: formattedProjections.volume?.method
                    },
                    taxaConversao: {
                        projected: formattedProjections.taxaConversao?.projectedValue + '%',
                        confidence: formattedProjections.taxaConversao?.confidence,
                        method: formattedProjections.taxaConversao?.method,
                        explanation: formattedProjections.taxaConversao?.explanation?.summary
                    },
                    cac: {
                        projected: 'R$ ' + formattedProjections.cac?.projectedValue?.toFixed(2),
                        confidence: formattedProjections.cac?.confidence,
                        method: formattedProjections.cac?.method
                    },
                    propostas: {
                        projected: formattedProjections.propostas?.projectedValue,
                        confidence: formattedProjections.propostas?.confidence,
                        method: formattedProjections.propostas?.method
                    },
                    aprovados: {
                        projected: formattedProjections.aprovados?.projectedValue,
                        confidence: formattedProjections.aprovados?.confidence,
                        method: formattedProjections.aprovados?.method
                    },
                    cartoes: {
                        projected: formattedProjections.cartoesGerados?.projectedValue,
                        confidence: formattedProjections.cartoesGerados?.confidence,
                        method: formattedProjections.cartoesGerados?.method
                    }
                });

            } catch (error) {
                console.error('[DispatchContext] AI Projection Error:', error);
                setProjections({});
                setProjectionReadiness('insufficient');
            }
        } else {
            setProjections({});
            setProjectionReadiness('insufficient');
        }
    }, [
        formData.bu,
        formData.segmento,
        formData.canal,
        formData.jornada,
        formData.perfilCredito,
        formData.oferta,
        formData.baseVolume,
        formData.parceiro,
        formData.subgrupo,
        formData.etapaAquisicao,
        formData.produto,
        activities
    ]);

    // Effect 10: Auto-sugestão de Promocional baseado na Oferta
    useEffect(() => {
        if (formData.oferta && !editingActivity && !formData.promocional) {
            // Buscar promocional mais usado para esta oferta no histórico
            const matchingActivities = activities.filter((a: any) => {
                const raw = a.raw || a;
                return raw.Oferta === formData.oferta && raw.Promocional;
            });

            if (matchingActivities.length > 0) {
                // Contar frequência de cada promocional
                const promocionalCounts = new Map<string, number>();
                matchingActivities.forEach((a: any) => {
                    const raw = a.raw || a;
                    const promo = raw.Promocional;
                    if (promo) {
                        promocionalCounts.set(promo, (promocionalCounts.get(promo) || 0) + 1);
                    }
                });

                // Pegar o mais frequente
                let mostUsedPromo = '';
                let maxCount = 0;
                promocionalCounts.forEach((count, promo) => {
                    if (count > maxCount) {
                        maxCount = count;
                        mostUsedPromo = promo;
                    }
                });

                if (mostUsedPromo) {
                    console.log('[DispatchForm] Auto-sugerindo Promocional:', mostUsedPromo, `(${maxCount}x usado)`);
                    setFormData(prev => ({ ...prev, promocional: mostUsedPromo }));
                }
            }
        }
    }, [formData.oferta, activities, editingActivity, formData.promocional]);

    // Effect 11: Auto-sugestão de Oferta 2 e Promocional 2 baseado no contexto
    useEffect(() => {
        if (formData.bu && formData.segmento && formData.oferta && !editingActivity) {
            // Buscar atividades similares com Oferta 2 preenchida
            const matchingActivities = activities.filter((a: any) => {
                const raw = a.raw || a;
                return raw.BU === formData.bu &&
                    raw.Segmento === formData.segmento &&
                    raw.Oferta === formData.oferta;
            });

            if (matchingActivities.length > 0) {
                // Auto-preencher Oferta 2 se não preenchido
                if (!formData.oferta2) {
                    const oferta2Counts = new Map<string, number>();
                    matchingActivities.forEach((a: any) => {
                        const raw = a.raw || a;
                        const of2 = raw['Oferta 2'];
                        if (of2) {
                            oferta2Counts.set(of2, (oferta2Counts.get(of2) || 0) + 1);
                        }
                    });

                    let mostUsed = '';
                    let maxCount = 0;
                    oferta2Counts.forEach((count, val) => {
                        if (count > maxCount) {
                            maxCount = count;
                            mostUsed = val;
                        }
                    });

                    if (mostUsed && maxCount >= 2) {
                        console.log('[DispatchForm] Auto-sugerindo Oferta 2:', mostUsed);
                        setFormData(prev => ({ ...prev, oferta2: mostUsed }));
                    }
                }

                // Auto-preencher Promocional 2 se não preenchido
                if (!formData.promocional2) {
                    const promo2Counts = new Map<string, number>();
                    matchingActivities.forEach((a: any) => {
                        const raw = a.raw || a;
                        const p2 = raw['Promocional 2'];
                        if (p2) {
                            promo2Counts.set(p2, (promo2Counts.get(p2) || 0) + 1);
                        }
                    });

                    let mostUsed = '';
                    let maxCount = 0;
                    promo2Counts.forEach((count, val) => {
                        if (count > maxCount) {
                            maxCount = count;
                            mostUsed = val;
                        }
                    });

                    if (mostUsed && maxCount >= 2) {
                        console.log('[DispatchForm] Auto-sugerindo Promocional 2:', mostUsed);
                        setFormData(prev => ({ ...prev, promocional2: mostUsed }));
                    }
                }
            }
        }
    }, [formData.bu, formData.segmento, formData.oferta, activities, editingActivity, formData.oferta2, formData.promocional2]);

    // Log de diagnóstico do estado do formulário
    useEffect(() => {
        console.log('[DispatchForm] Estado atual:', {
            bu: formData.bu,
            segmento: formData.segmento,
            jornada: formData.jornada,
            canal: formData.canal,
            oferta: formData.oferta,
            promocional: formData.promocional,
            oferta2: formData.oferta2,
            promocional2: formData.promocional2,
            baseVolume: formData.baseVolume,
            custoUnitarioOferta: formData.custoUnitarioOferta,
            custoUnitarioCanal: formData.custoUnitarioCanal,
            custoTotalCampanha: formData.custoTotalCampanha,
            projectionsKeys: Object.keys(projections),
            activitiesCount: activities.length
        });
    }, [formData, projections, activities]);

    const value = useMemo<DispatchFormContextValue>(() => ({
        formData,
        setFormData,
        handleChange,
        errors,
        setErrors,
        smartOptions, // <--- EXPORTANDO SMART OPTIONS
        projections,
        projectionReadiness, // <--- NOVO: Status de readiness das projeções
        loading,
        setLoading,
        editingActivity,
        activities,
    }), [formData, handleChange, errors, smartOptions, projections, projectionReadiness, loading, editingActivity, activities]);

    return (
        <DispatchFormContext.Provider value={value}>
            {children}
        </DispatchFormContext.Provider>
    );
};

export default DispatchFormContext;
