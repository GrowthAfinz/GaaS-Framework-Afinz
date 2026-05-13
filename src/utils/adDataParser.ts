import * as XLSX from 'xlsx';
import { DailyAdMetricsSchema, DailyAdMetrics, BudgetSchema, Budget } from '../schemas/paid-media';
import { z } from 'zod';

export const parsePaidMediaExcel = async (file: File): Promise<{ metrics: DailyAdMetrics[], budgets: Budget[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });

                // 1. Parse 'Daily Data' (Assumed tab name or first tab)
                // We look for a tab that resembles raw data
                let dataSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('dados') || n.toLowerCase().includes('base'));
                if (!dataSheetName) dataSheetName = workbook.SheetNames[0];

                const rawData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[dataSheetName]);
                const metrics: DailyAdMetrics[] = [];

                rawData.forEach((row, index) => {
                    // Mapper: Excel Columns -> Schema Keys
                    // Adjust these keys based on the REAL Excel file format from 'midia-paga-afinz'
                    // Context from Step 0: inspect_excel.ts output was not fully shown but we have code from 'fileParser.ts' in mind.
                    // Assuming columns: "Data", "Canal", "Campanha", "Investimento", "Impressões", "Cliques", "Conversões"

                    try {
                        const dateVal = row['Data'] || row['Date'] || row['Dia'];
                        let parsedDate = new Date();
                        if (typeof dateVal === 'number') {
                            parsedDate = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
                        } else if (typeof dateVal === 'string') {
                            parsedDate = new Date(dateVal);
                        }

                        const cleanObj = {
                            date: parsedDate,
                            channel: normalizeChannel(row['Canal'] || row['Plataforma']),
                            campaign: row['Campanha'] || row['Campaign Name'] || 'Unknown',
                            spend: Number(row['Investimento'] || row['Custo'] || row['Cost'] || 0),
                            impressions: Number(row['Impressões'] || row['Impressions'] || 0),
                            clicks: Number(row['Cliques'] || row['Clicks'] || 0),
                            conversions: Number(row['Conversões'] || row['Conversions'] || 0),
                        };

                        // Zod Validation
                        const valid = DailyAdMetricsSchema.parse(cleanObj);
                        metrics.push(valid);
                    } catch (err) {
                        console.warn(`Row ${index + 2} skipped due to validation error:`, err);
                    }
                });

                // 2. Parse 'Budgets' (Assumed tab name 'Budgets' or 'Metas')
                const budgetSheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('meta') || n.toLowerCase().includes('budget'));
                const budgets: Budget[] = [];

                if (budgetSheetName) {
                    const rawBudgets = XLSX.utils.sheet_to_json<any>(workbook.Sheets[budgetSheetName]);
                    rawBudgets.forEach(row => {
                        try {
                            const bObj = {
                                id: crypto.randomUUID(),
                                channel: normalizeChannel(row['Canal']),
                                value: Number(row['Valor'] || row['Budget']),
                                month: row['Mês'] || new Date().toISOString().slice(0, 7) // Default to current YYYY-MM if missing
                            };
                            const valid = BudgetSchema.parse(bObj);
                            budgets.push(valid);
                        } catch (e) {
                            // ignore invalid budgets
                        }
                    });
                }

                resolve({ metrics, budgets });

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

function normalizeChannel(val: any): 'meta' | 'google' | 'tiktok' | 'unknown' {
    if (!val) return 'unknown';
    const s = String(val).toLowerCase();
    if (s.includes('meta') || s.includes('facebook') || s.includes('instagram')) return 'meta';
    if (s.includes('google') || s.includes('youtube')) return 'google';
    if (s.includes('tiktok')) return 'tiktok';
    return 'unknown';
}
