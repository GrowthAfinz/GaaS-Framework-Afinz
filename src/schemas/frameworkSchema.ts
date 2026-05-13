import { z } from 'zod';

// Helper to parse numbers from various formats (e.g. "1.000,00", "95%", "R$ 10,00")
const parseFlexibleNumber = (val: unknown): number | null => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        let clean = val.trim();
        if (clean === '-' || clean === '') return null;

        // Remove R$, %, spaces
        clean = clean.replace(/[R$\s%]/g, '');

        // Handle mixed delimiters (e.g. 1.000,00 or 1,000.00)
        if (clean.includes(',') && clean.includes('.')) {
            const lastDot = clean.lastIndexOf('.');
            const lastComma = clean.lastIndexOf(',');

            if (lastDot < lastComma) {
                // PT-BR: 1.000,00 -> remove dots, replace comma with dot
                clean = clean.replace(/\./g, '').replace(',', '.');
            } else {
                // EN: 1,000.00 -> remove commas
                clean = clean.replace(/,/g, '');
            }
        } else if (clean.includes(',')) {
            // Assumes 1000,00 (PT-BR) -> replace comma with dot
            clean = clean.replace(',', '.');
        }
        // If only dots (1000.00), parseFloat handles it natively

        const num = parseFloat(clean);
        return isNaN(num) ? null : num;
    }
    return null;
};

// Custom Zod transform for numbers
const flexibleNumber = z.preprocess(parseFlexibleNumber, z.number().nullable());

// Custom Zod transform for number OR string (to preserve "aguardando", "confirmar")
const numberOrString = z.preprocess((val) => {
    const parsed = parseFlexibleNumber(val);
    if (parsed !== null) return parsed;
    if (typeof val === 'string' && val.trim() !== '') return val;
    return null;
}, z.union([z.number(), z.string()]).nullable());

export const FrameworkRowSchema = z.object({
    'Disparado?': z.string().optional(),
    'Jornada': z.string().optional(),
    'Activity name / Taxonomia': z.string().min(1, "Activity Name é obrigatório"),
    'Canal': z.string().optional(),
    'Data de Disparo': z.string().min(1, "Data de Disparo é obrigatória"),
    'Data Fim': z.string().optional(),
    'Safra': z.string().optional(),
    'BU': z.string().transform(val => val.toUpperCase().trim()),
    'Parceiro': z.string().optional(),
    'SIGLA': z.string().optional(),
    'Segmento': z.string().optional(),
    'SIGLA.1': z.string().optional(),
    'Subgrupos': z.string().optional(),
    'Base Total': flexibleNumber,
    'Base Acionável': flexibleNumber,
    'Abertura': flexibleNumber,
    'Cliques': flexibleNumber,
    '% Otimização de base': flexibleNumber,
    'Etapa de aquisição': z.string().optional(),
    'Ordem de disparo': flexibleNumber,
    'Perfil de Crédito': z.string().optional(),
    'Produto': z.string().optional(),
    'Oferta': z.string().optional(),
    'Promocional': z.string().optional(),
    'SIGLA.2': z.string().optional(),
    'Oferta 2': z.string().optional(),
    'Promocional 2': z.string().optional(),
    'Custo Unitário Oferta': flexibleNumber,
    'Custo Total da Oferta': flexibleNumber,
    'Custo unitário do canal': flexibleNumber,
    'Custo total canal': flexibleNumber,
    'Taxa de Entrega': flexibleNumber,
    'Taxa de Abertura': flexibleNumber,
    'Taxa de Clique': flexibleNumber,
    'Taxa de Proposta': flexibleNumber,
    'Taxa de Aprovação': flexibleNumber,
    'Taxa de Finalização': flexibleNumber,
    'Taxa de Conversão': flexibleNumber,
    'Custo Total Campanha': flexibleNumber,
    'CAC': flexibleNumber,
    'Cartões Gerados': numberOrString,
    'Aprovados': flexibleNumber,
    'Propostas': flexibleNumber
}).passthrough(); // Allow extra columns

export type FrameworkRowZod = z.infer<typeof FrameworkRowSchema>;
