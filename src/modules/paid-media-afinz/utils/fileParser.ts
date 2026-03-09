import * as XLSX from 'xlsx';
import type { DailyMetrics } from '../types';
import { parse, isValid } from 'date-fns';

const METRICS_MAP: Record<string, string> = {
    'nome da campanha': 'campaign',
    'campanha': 'campaign',
    'dia': 'date',
    'valor usado (brl)': 'spend',
    'custo': 'spend',
    'impressões': 'impressions',
    'impr.': 'impressions',
    'resultados': 'results', // Changed from 'conversions' to intermediate 'results'
    'conv': 'conversions',
    'conversões': 'conversions', // Added explicit Portuguese match
    'frequência': 'frequency',
    'alcance': 'reach',
    'cpm': 'cpm',
    'cpm médio': 'cpm',
    'cliques no link': 'clicks',
    'cliques': 'clicks',
    'cpc': 'cpc',
    'cpc méd.': 'cpc',
    'ctr': 'ctr'
};

const TAB_MAPPING = {
    'extração meta ads_downloads': { channel: 'meta', defaultObjective: null }, // Objective from campaign name
    'extração meta_marca+downloads': { channel: 'meta', defaultObjective: null },
    'extração google ads_marca+b2c': { channel: 'google', defaultObjective: null },
    'extração alcance bf 2025': { channel: 'meta', defaultObjective: null }
} as const;

/* eslint-disable @typescript-eslint/no-explicit-any */
const normalizeHeader = (header: string) => header.trim().toLowerCase();

const parseDate = (dateVal: any): string | null => {
    if (!dateVal) return null;
    let date: Date;

    if (typeof dateVal === 'number') {
        // Excel serial date
        date = XLSX.SSF.parse_date_code(dateVal);
        // @ts-expect-error XLSX SSF types might differ slightly in check
        date = new Date(date.y, date.m - 1, date.d);
    } else if (dateVal instanceof Date) {
        date = dateVal;
    } else {
        // Try parsing string formats common in BR
        const str = String(dateVal).trim();
        if (str.includes('-')) {
            date = new Date(str);
        } else if (str.includes('/')) {
            // Assume DD/MM/YYYY
            date = parse(str, 'dd/MM/yyyy', new Date());
        } else {
            date = new Date(str);
        }
    }

    if (!isValid(date)) return null;
    return date.toISOString();
};

const determineObjective = (campaignName: string, _tabObjective: string | null): 'marca' | 'b2c' | 'plurix' => {
    const lower = campaignName.toLowerCase();
    if (lower.includes('plurix')) return 'plurix';
    if (lower.includes('download') || lower.includes('app')) return 'b2c';
    return 'marca';
};

const cleanNumber = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;

    // Convert to string
    let str = String(val);

    // Remove currency symbol and whitespace
    str = str.replace('R$', '').trim();

    // Force BR Logic: 
    // 1. Remove all dots (thousands separators)
    // 2. Replace comma with dot (decimal)
    // This assumes inputs are strictly BR formatted (1.000,00) or simple (1000)
    // It MIGHT fail for US inputs (1.5 -> 15), but guarantees BR correctness.
    str = str.replace(/\./g, '').replace(',', '.');

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};

export const parseXLSX = async (file: File): Promise<DailyMetrics[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                let allData: DailyMetrics[] = [];

                // 1. Ler e criar o Mapa De-Para
                const deParaMap = new Map<string, 'marca' | 'b2c' | 'plurix'>();
                const deParaTabName = workbook.SheetNames.find(n => n.toLowerCase().includes('de-para') || n.toLowerCase().includes('depara'));

                if (deParaTabName) {
                    const deParaSheet = workbook.Sheets[deParaTabName];
                    // Ler como array de arrays para pegar col A e B
                    const deParaData = XLSX.utils.sheet_to_json<string[]>(deParaSheet, { header: 1 });

                    deParaData.forEach(row => {
                        if (row.length >= 2) {
                            const campaignName = String(row[0]).trim();
                            const objectiveRaw = String(row[1]).trim().toLowerCase();

                            if (campaignName) {
                                if (objectiveRaw === 'marca' || objectiveRaw === 'branding') {
                                    deParaMap.set(campaignName, 'marca');
                                } else if (objectiveRaw === 'b2c' || objectiveRaw === 'prafal' || objectiveRaw === 'performance') {
                                    deParaMap.set(campaignName, 'b2c');
                                } else if (objectiveRaw === 'plurix') {
                                    deParaMap.set(campaignName, 'plurix');
                                }
                            }
                        }
                    });
                    console.log(`De-Para carregado com ${deParaMap.size} mapeamentos.`);
                }

                Object.keys(TAB_MAPPING).forEach(tabKey => {
                    const sheetName = workbook.SheetNames.find(n => n.toLowerCase() === tabKey.toLowerCase());
                    if (!sheetName) return;

                    const config = TAB_MAPPING[tabKey as keyof typeof TAB_MAPPING];
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                    const parsedRows = json.map(row => {
                        const normalizedRow: Partial<DailyMetrics> & { results?: number } = {
                            channel: config.channel as 'meta' | 'google'
                        };

                        // Map columns
                        Object.keys(row).forEach(key => {
                            const normKey = normalizeHeader(key);
                            const metricKey = METRICS_MAP[normKey];
                            if (metricKey) {
                                if (metricKey === 'date') {
                                    const parsedDetails = parseDate(row[key]);
                                    if (parsedDetails) normalizedRow.date = parsedDetails;
                                } else if (metricKey === 'campaign') {
                                    normalizedRow.campaign = String(row[key]).trim(); // Trim inputs
                                } else if (metricKey === 'results') {
                                    normalizedRow.results = cleanNumber(row[key]); // Capture results
                                } else {
                                    // Numeric metrics
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    (normalizedRow as any)[metricKey] = cleanNumber(row[key]);
                                }
                            }
                        });

                        // Safety check
                        if (!normalizedRow.campaign) return null;
                        if (!normalizedRow.date) return null;

                        // Determine Objective
                        if (normalizedRow.campaign && deParaMap.has(normalizedRow.campaign)) {
                            normalizedRow.objective = deParaMap.get(normalizedRow.campaign)!;
                        } else {
                            normalizedRow.objective = determineObjective(normalizedRow.campaign, config.defaultObjective);
                        }

                        // CONDITIONAL MAPPING
                        // Map 'Results' to 'Conversions' ONLY IF not 'marca' (Awareness)
                        if (normalizedRow.conversions === undefined && normalizedRow.results !== undefined) {
                            if (normalizedRow.objective === 'b2c' || normalizedRow.objective === 'plurix') {
                                normalizedRow.conversions = normalizedRow.results;
                            } else {
                                // For Marca: Results = Reach/Impressions. Do NOT map to conversions.
                                if (!normalizedRow.reach) normalizedRow.reach = normalizedRow.results;
                                normalizedRow.conversions = 0;
                            }
                        }

                        // Ensure numbers
                        normalizedRow.spend = normalizedRow.spend || 0;
                        normalizedRow.impressions = normalizedRow.impressions || 0;
                        normalizedRow.clicks = normalizedRow.clicks || 0;
                        normalizedRow.conversions = normalizedRow.conversions || 0;

                        // Derived
                        if (!normalizedRow.cpm && normalizedRow.impressions > 0) {
                            normalizedRow.cpm = (normalizedRow.spend / normalizedRow.impressions) * 1000;
                        }
                        if (!normalizedRow.cpc && normalizedRow.clicks > 0) {
                            normalizedRow.cpc = normalizedRow.spend / normalizedRow.clicks;
                        }
                        if (!normalizedRow.ctr && normalizedRow.impressions > 0) {
                            normalizedRow.ctr = (normalizedRow.clicks / normalizedRow.impressions);
                        }

                        return normalizedRow as DailyMetrics;
                    }).filter((r): r is DailyMetrics => r !== null);

                    allData = [...allData, ...parsedRows];
                });

                // Deduplicate with Fuzzy Logic
                const uniqueRows: DailyMetrics[] = [];
                const seenSpends = new Map<string, number[]>();

                allData.forEach(row => {
                    const dateKey = String(row.date).substring(0, 10);
                    const key = `${row.campaign}|${dateKey}`;

                    const existingSpends = seenSpends.get(key) || [];
                    const isDuplicate = existingSpends.some(s => Math.abs(s - row.spend) < 0.10);

                    if (!isDuplicate) {
                        uniqueRows.push(row);
                        seenSpends.set(key, [...existingSpends, row.spend]);
                    }
                });

                resolve(uniqueRows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
