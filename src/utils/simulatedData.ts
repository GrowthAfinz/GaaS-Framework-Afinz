import { Activity, FrameworkRow } from '../types/framework';
import { addDays, subMonths, startOfMonth, differenceInDays } from 'date-fns';

export const generateSimulatedData = (): { rows: FrameworkRow[], activities: Activity[] } => {
    const activities: Activity[] = [];
    const rows: FrameworkRow[] = [];

    const today = new Date();
    // Generate data from 2 months ago to 1 month ahead to cover MoM and future planning
    const startDate = startOfMonth(subMonths(today, 2));
    const endDate = addDays(today, 60);

    const channels = ['Email', 'SMS', 'Push', 'WhatsApp'];
    const segments = ['Ativos', 'Churn', 'Novos', 'Alto Valor', 'Inativos'];
    const bus = ['B2C', 'B2B2C', 'Plurix'] as const;

    // Calculate number of days between start and end
    const numDays = differenceInDays(endDate, startDate) + 1;

    console.log(`🔧 Gerando dados simulados: ${numDays} dias de ${startDate.toLocaleDateString()} a ${endDate.toLocaleDateString()}`);

    for (let dayOffset = 0; dayOffset < numDays; dayOffset++) {
        const currentDate = addDays(startDate, dayOffset);

        // Skip some weekends to make it realistic, but keep some for variety
        if (Math.random() > 0.8 && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) continue;

        // Generate 3-8 activities per day for density
        const dailyCount = Math.floor(Math.random() * 6) + 3;

        for (let i = 0; i < dailyCount; i++) {
            const channel = channels[Math.floor(Math.random() * channels.length)];
            const segment = segments[Math.floor(Math.random() * segments.length)];
            // Ensure variety in BUs
            const bu = bus[i % bus.length]; // Rotate BUs to ensure all are present often

            // Realistic metrics
            const baseTotal = Math.floor(Math.random() * 50000) + 5000;
            const sent = Math.floor(baseTotal * (0.85 + Math.random() * 0.14)); // 85-99% sent
            const delivered = Math.floor(sent * (0.90 + Math.random() * 0.09)); // 90-99% delivery

            const openRate = Math.random() * 0.25 + 0.15; // 15-40% open
            const opened = Math.floor(delivered * openRate);

            const clickRate = Math.random() * 0.15 + 0.02; // 2-17% click
            const clicked = Math.floor(opened * clickRate);

            const conversionRate = Math.random() * 0.08 + 0.01; // 1-9% conversion
            const converted = Math.floor(clicked * conversionRate);

            const costPerUnit = 0.05 + Math.random() * 0.1;
            const cost = sent * costPerUnit;

            // Format date as string for FrameworkRow
            const dateStr = currentDate.toLocaleDateString('pt-BR');
            const idCounter = dayOffset * 100 + i;
            const activityName = `Campanha ${bu} ${channel} ${idCounter}`;

            // Create FrameworkRow
            const row: FrameworkRow = {
                'Activity name / Taxonomia': activityName,
                'Data de Disparo': dateStr,
                'Data Fim': dateStr,
                'BU': bu,
                'Canal': channel,
                'Segmento': segment,
                'Jornada': 'Jornada Simulada',
                'Parceiro': 'Simulado',
                'Safra': currentDate.toLocaleDateString('pt-BR', { year: '2-digit', month: '2-digit' }),
                'Oferta': 'Oferta Simulada',
                'Ordem de disparo': i + 1,
                'Base Total': baseTotal,
                'Base Acionável': sent, // Using sent as actionable for simplicity
                'Taxa de Entrega': delivered / sent,
                'Propostas': clicked, // Approximating proposals as clicks for funnel
                'Taxa de Proposta': clicked / delivered,
                'Aprovados': Math.floor(converted * 0.8),
                'Taxa de Aprovação': 0.8,
                'Cartões Gerados': converted,
                'Taxa de Finalização': 1.0,
                'Taxa de Conversão': conversionRate,
                'Taxa de Abertura': openRate,
                'CAC': converted > 0 ? cost / converted : 0,
                'Custo Total Campanha': cost,
                'Disparado?': 'Sim',
                // Missing fields required by interface
                'SIGLA': 'SIG',
                'SIGLA.1': 'SIG1',
                'SIGLA.2': 'SIG2',
                'Subgrupos': 'Geral',
                'Etapa de aquisição': 'Conversão',
                'Perfil de Crédito': 'A',
                'Produto': 'Cartão',
                'Promocional': 'Não',
                'Oferta 2': '',
                'Promocional 2': '',
                'Custo Unitário Oferta': 0,
                'Custo Total da Oferta': 0,
                'Custo unitário do canal': costPerUnit,
                'Custo total canal': cost,
                'Taxa de Clique': clickRate,
                '% Otimização de base': 0
            };

            rows.push(row);

            const activity: Activity = {
                id: activityName,
                dataDisparo: new Date(currentDate),
                canal: channel,
                segmento: segment,
                bu: bu,
                kpis: {
                    baseEnviada: sent,
                    baseEntregue: delivered,
                    taxaEntrega: sent > 0 ? (delivered / sent) * 100 : 0,
                    taxaAbertura: openRate * 100,
                    taxaConversao: conversionRate * 100,
                    custoTotal: cost,
                    cartoes: converted,
                    aprovados: Math.floor(converted * 0.8),
                    propostas: clicked,
                    taxaPropostas: delivered > 0 ? (clicked / delivered) * 100 : 0,
                    taxaAprovacao: 80,
                    emissoes: converted,
                    taxaFinalizacao: 100,
                    cac: converted > 0 ? cost / converted : 0
                },
                parceiro: 'Simulado',
                jornada: 'Jornada Simulada',
                raw: row
            };

            activities.push(activity);
        }
    }

    console.log(`✅ Dados simulados gerados: ${activities.length} atividades`);
    return { rows, activities };
};
