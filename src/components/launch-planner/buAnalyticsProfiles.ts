import { Goal } from '../../types/framework';

export type AcquisitionBU = 'B2C' | 'B2B2C' | 'Plurix';
export type BreakdownDimension = 'segmento' | 'parceiro';

export interface BUAnalyticsProfile {
    bu: AcquisitionBU;
    color: string;
    sourceMode: 'b2c_total_plus_crm' | 'crm';
    breakdown: BreakdownDimension;
    breakdownLabel: string;
    accumulatedTitle: string;
    proposalsTitle: string;
    cacTitle: string;
    emissionsTitle: string;
}

export const ACQUISITION_BUS: AcquisitionBU[] = ['B2C', 'B2B2C', 'Plurix'];

export const BU_ANALYTICS_PROFILES: Record<AcquisitionBU, BUAnalyticsProfile> = {
    B2C: {
        bu: 'B2C',
        color: '#2563EB',
        sourceMode: 'b2c_total_plus_crm',
        breakdown: 'segmento',
        breakdownLabel: 'segmento',
        accumulatedTitle: 'ACUMULADO TOTAL CARTÕES B2C VS META',
        proposalsTitle: 'EVOLUÇÃO DE PROPOSTAS CRM B2C',
        cacTitle: 'EVOLUÇÃO DE CAC CRM B2C',
        emissionsTitle: 'EVOLUÇÃO DE EMISSÕES CRM B2C',
    },
    B2B2C: {
        bu: 'B2B2C',
        color: '#059669',
        sourceMode: 'crm',
        breakdown: 'parceiro',
        breakdownLabel: 'parceiro',
        accumulatedTitle: 'ACUMULADO TOTAL CARTÕES B2B2C VS META',
        proposalsTitle: 'EVOLUÇÃO DE PROPOSTAS CRM B2B2C',
        cacTitle: 'EVOLUÇÃO DE CAC CRM B2B2C',
        emissionsTitle: 'EVOLUÇÃO DE EMISSÕES CRM B2B2C',
    },
    Plurix: {
        bu: 'Plurix',
        color: '#7C3AED',
        sourceMode: 'crm',
        breakdown: 'segmento',
        breakdownLabel: 'segmento',
        accumulatedTitle: 'ACUMULADO TOTAL CARTÕES PLURIX VS META',
        proposalsTitle: 'EVOLUÇÃO DE PROPOSTAS CRM PLURIX',
        cacTitle: 'EVOLUÇÃO DE CAC CRM PLURIX',
        emissionsTitle: 'EVOLUÇÃO DE EMISSÕES CRM PLURIX',
    },
};

const asNumber = (value: unknown): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const getCardsGoal = (goal: Goal | undefined, bu: AcquisitionBU): number => {
    if (!goal) return 0;

    const profileGoal = asNumber(goal.bus?.[bu]?.cartoes);
    if (profileGoal > 0) return profileGoal;

    if (bu === 'B2C') return asNumber(goal.b2c_meta);
    if (bu === 'B2B2C') return asNumber(goal.b2b2c_meta);
    return asNumber(goal.plurix_meta);
};

export const getCacGoal = (goal: Goal | undefined, bu: AcquisitionBU): number => {
    const profileGoal = asNumber(goal?.bus?.[bu]?.cac);
    if (profileGoal > 0) return profileGoal;
    return bu === 'B2C' ? asNumber(goal?.cac_max) : 0;
};

export const canConsolidateBUs = (bus: AcquisitionBU[]): boolean =>
    bus.length > 1 && !bus.includes('B2C');
