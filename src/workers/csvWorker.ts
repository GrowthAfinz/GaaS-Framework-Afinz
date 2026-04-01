
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FrameworkRowSchema } from '../schemas/frameworkSchema';
import { parseDate, parseNumber, parseCurrency, parsePercentage, parseSafraToKey } from '../utils/formatters';
import { Activity, FrameworkRow } from '../types/framework';

// Define message types
export type WorkerMessage =
    | { type: 'PARSE_B2C_CSV'; fileContent: string }
    | { type: 'PARSE_FRAMEWORK_CSV'; fileContent: string }
    | { type: 'PARSE_PAID_MEDIA_XLSX'; fileContent: ArrayBuffer };

export type WorkerResponse =
    | { type: 'SUCCESS'; data: { rows: FrameworkRow[]; activities: Activity[] }; warnings?: string[] } // Updated generic data
    | { type: 'SUCCESS_B2C'; data: any; warnings?: string[] } // Kept for B2C backward compat
    | { type: 'ERROR'; error: string };

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
    const { type, fileContent } = e.data;

    try {
        switch (type) {
            case 'PARSE_B2C_CSV':
                handleB2C(fileContent as string);
                break;
            case 'PARSE_FRAMEWORK_CSV':
                handleFramework(fileContent as string);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (err: any) {
        console.error('Worker global catch:', err);
        self.postMessage({ type: 'ERROR', error: (err && err.message) ? err.message : String(err) });
    }
};

const normalizeColumnName = (col: string): string => {
    return col
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const findColumnByNormalized = (headers: string[], pattern: string): string | null => {
    const normalized = normalizeColumnName(pattern);
    return headers.find(h => normalizeColumnName(h) === normalized) || null;
};

const normalizeBU = (value: unknown): string => {
    const raw = String(value ?? '').trim();
    const normalized = raw.toUpperCase().replace(/\s+/g, '');
    if (normalized === 'B2C') return 'B2C';
    if (normalized === 'B2B2C') return 'B2B2C';
    if (normalized === 'PLURIX') return 'Plurix';
    if (normalized === 'SEGUROS' || normalized === 'SEGURO') return 'Seguros';
    return raw;
};

const handleFramework = (csvText: string) => {
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
            try {
                const rawRows = results.data as any[];

                if (rawRows.length === 0) {
                    self.postMessage({ type: 'ERROR', error: 'Arquivo CSV vazio' });
                    return;
                }

                const headers = Object.keys(rawRows[0] || {});
                const columnMap: Record<string, string> = {};
                const requiredColumns = [
                    'Activity name / Taxonomia', 'Data de Disparo', 'BU', 'Canal', 'Segmento', 'Jornada',
                    'Base Total', 'Base Acionável', 'Taxa de Entrega', 'Propostas', 'Taxa de Proposta',
                    'Aprovados', 'Taxa de Aprovação', 'Cartões Gerados', 'Taxa de Finalização',
                    'Taxa de Conversão', 'Taxa de Abertura', 'CAC', 'Custo Total Campanha'
                ];

                const findCol = (name: string, synonyms: string[] = []) => {
                    const found = findColumnByNormalized(headers, name);
                    if (found) return found;
                    for (const syn of synonyms) {
                        const foundSyn = findColumnByNormalized(headers, syn);
                        if (foundSyn) return foundSyn;
                    }
                    return null;
                };

                // Mapping Logic (Copied from useFrameworkData)
                columnMap['Activity name / Taxonomia'] = findCol('Activity name / Taxonomia') ?? 'Activity name / Taxonomia';
                columnMap['Data de Disparo'] = findCol('Data de Disparo') ?? 'Data de Disparo';
                columnMap['BU'] = findCol('BU') ?? 'BU';
                columnMap['Canal'] = findCol('Canal') ?? 'Canal';
                columnMap['Segmento'] = findCol('Segmento') ?? 'Segmento';
                columnMap['Jornada'] = findCol('Jornada') ?? 'Jornada';
                columnMap['Parceiro'] = findCol('Parceiro') ?? 'Parceiro';
                columnMap['Safra'] = findCol('Safra', ['Ciclo', 'Mes', 'Mês']) ?? 'Safra';
                columnMap['Oferta'] = findCol('Oferta', ['Tipo de Oferta', 'Tipo Oferta']) ?? 'Oferta';
                columnMap['Ordem de disparo'] = findCol('Ordem de disparo', ['Ordem', 'Step', 'Etapa']) ?? 'Ordem de disparo';
                columnMap['Disparado?'] = findCol('Disparado?', ['Disparado', 'Status Disparo', 'Status', 'Envio', 'Enviado?', 'Foi disparado?', 'Disparo Realizado']) ?? 'Disparado?';
                columnMap['Perfil de Crédito'] = findCol('Perfil de Crédito', ['Perfil', 'Credit Profile']) ?? 'Perfil de Crédito';
                columnMap['Base Total'] = findCol('Base Total', ['Base Enviada', 'Enviados', 'Volume Enviado', 'Total Enviado']) ?? 'Base Total';
                columnMap['Base Acionável'] = findCol('Base Acionável', ['Base Entregue', 'Base Acionavel', 'Volume Entregue', 'Vol. Entregas', 'Entregues', 'Total Entregue', 'Entregue']) ?? 'Base Acionável';
                columnMap['Taxa de Entrega'] = findCol('Taxa de Entrega') ?? 'Taxa de Entrega';
                columnMap['Propostas'] = findCol('Propostas') ?? 'Propostas';
                columnMap['Taxa de Proposta'] = findCol('Taxa de Proposta') ?? 'Taxa de Proposta';
                columnMap['Aprovados'] = findCol('Aprovados') ?? 'Aprovados';
                columnMap['Taxa de Aprovação'] = findCol('Taxa de Aprovação') ?? 'Taxa de Aprovação';
                columnMap['Cartões Gerados'] = findCol('Cartões Gerados', ['Emissões', 'Cartoes Gerados', 'Cartões', 'Contas Abertas', 'Contas']) ?? 'Cartões Gerados';
                columnMap['Taxa de Finalização'] = findCol('Taxa de Finalização') ?? 'Taxa de Finalização';
                columnMap['Taxa de Conversão'] = findCol('Taxa de Conversão') ?? 'Taxa de Conversão';
                columnMap['Taxa de Abertura'] = findCol('Taxa de Abertura') ?? 'Taxa de Abertura';
                columnMap['CAC'] = findCol('CAC') ?? 'CAC';
                columnMap['Custo Total Campanha'] = findCol('Custo Total Campanha') ?? 'Custo Total Campanha';
                columnMap['Emissões Independentes'] = findCol('Emissões Independentes') ?? 'Emissões Independentes';
                columnMap['Emissões Assistidas'] = findCol('Emissões Assistidas') ?? 'Emissões Assistidas';

                const missing = requiredColumns.filter(col => !columnMap[col]);
                if (missing.length > 0) {
                    const critical = ['Activity name / Taxonomia', 'Data de Disparo', 'BU'];
                    const missingCritical = critical.filter(c => missing.includes(c));
                    if (missingCritical.length > 0) {
                        throw new Error(`Colunas obrigatórias ausentes: ${missingCritical.join(', ')}`);
                    }
                }

                const processedRows: FrameworkRow[] = [];
                const newActivities: Activity[] = [];
                let validCount = 0;
                const errors: string[] = [];

                rawRows.forEach((row, idx) => {
                    const mappedRow: any = { ...row };
                    Object.entries(columnMap).forEach(([standardKey, csvKey]) => {
                        if (csvKey && standardKey !== csvKey) {
                            mappedRow[standardKey] = row[csvKey];
                        }
                    });

                    const validation = FrameworkRowSchema.safeParse(mappedRow);
                    let validRow: FrameworkRow;

                    if (validation.success) {
                        validRow = validation.data as FrameworkRow;
                    } else {
                        const msg = `Linha ${idx + 2}: ${validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`;
                        if (!mappedRow['Activity name / Taxonomia'] || !mappedRow['Data de Disparo']) {
                            if (errors.length < 5) errors.push(msg);
                            return;
                        }
                        validRow = mappedRow as FrameworkRow;
                    }

                    processedRows.push(validRow);

                    const date = parseDate(validRow['Data de Disparo']);
                    if (!date) {
                        if (errors.length < 5) errors.push(`Linha ${idx + 2}: Data inválida`);
                        return;
                    }

                    const buValue = normalizeBU(validRow['BU']);
                    let jornadaValue = validRow['Jornada'] || 'Desconhecido';
                    const perfilCredito = validRow['Perfil de Crédito'];
                    if (perfilCredito && String(perfilCredito).toLowerCase().includes('serasa api integrado')) {
                        jornadaValue = 'Carrinho Abandonado';
                    }

                    const activity: Activity = {
                        id: validRow['Activity name / Taxonomia'],
                        dataDisparo: date,
                        canal: validRow['Canal'] || 'Desconhecido',
                        bu: buValue as any,
                        segmento: validRow['Segmento'] || 'Desconhecido',
                        jornada: jornadaValue,
                        parceiro: validRow['Parceiro'] || 'Desconhecido',
                        ordemDisparo: typeof validRow['Ordem de disparo'] === 'number' ? validRow['Ordem de disparo'] : undefined,
                        oferta: validRow['Oferta'],
                        safraKey: parseSafraToKey(validRow['Safra']) || undefined,
                        kpis: {
                            baseEnviada: parseNumber(validRow['Base Total']),
                            baseEntregue: parseNumber(validRow['Base Acionável']),
                            taxaEntrega: parsePercentage(validRow['Taxa de Entrega']),
                            propostas: parseNumber(validRow['Propostas']),
                            taxaPropostas: parsePercentage(validRow['Taxa de Proposta']),
                            aprovados: parseNumber(validRow['Aprovados']),
                            taxaAprovacao: parsePercentage(validRow['Taxa de Aprovação']),
                            emissoes: parseNumber(validRow['Cartões Gerados']),
                            taxaFinalizacao: parsePercentage(validRow['Taxa de Finalização']),
                            taxaConversao: parsePercentage(validRow['Taxa de Conversão']),
                            taxaAbertura: parsePercentage(validRow['Taxa de Abertura']),
                            cartoes: parseNumber(validRow['Cartões Gerados']),
                            emissoesIndependentes: parseNumber(validRow['Emissões Independentes']),
                            emissoesAssistidas: parseNumber(validRow['Emissões Assistidas']),
                            cac: parseCurrency(validRow['CAC']),
                            custoTotal: parseCurrency(validRow['Custo Total Campanha'])
                        },
                        raw: validRow
                    };
                    newActivities.push(activity);
                    validCount++;
                });

                if (validCount === 0) {
                    throw new Error(`Nenhuma linha válida encontrada. Erros: ${errors.join('; ')}`);
                }

                // Send back Success
                self.postMessage({ type: 'SUCCESS', data: { rows: processedRows, activities: newActivities }, warnings: errors });

            } catch (err: any) {
                console.error('handleFramework error:', err);
                self.postMessage({ type: 'ERROR', error: (err && err.message) ? err.message : String(err) });
            }
        },
        error: (err: any) => {
            console.error('Papa.parse error callback:', err);
            self.postMessage({ type: 'ERROR', error: (err && err.message) ? err.message : String(err) });
        }
    });
};

const handleB2C = (csvText: string) => {
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const parsedData: any[] = [];
            const warnings: string[] = [];

            if (results.errors.length > 0) {
                results.errors.forEach((e: any) => warnings.push(`CSV Error: ${e.message}`));
            }

            if (!results.data || results.data.length === 0) {
                self.postMessage({ type: 'ERROR', error: 'Arquivo vazio ou inválido.' });
                return;
            }

            results.data.forEach((row: any) => {
                const rawDate = row.Data || row.data;
                const d = parseDate(rawDate);
                if (!d) return;

                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dataStr = `${year}-${month}-${day}`;

                const safeParseFloat = (val: any) => {
                    if (typeof val === 'number') return val;
                    if (!val) return 0;
                    let clean = val.replace(/[R$\s%]/g, '');
                    clean = clean.replace(/\./g, '');
                    clean = clean.replace(',', '.');
                    return parseFloat(clean) || 0;
                };

                parsedData.push({
                    data: dataStr,
                    propostas_b2c_total: safeParseFloat(row.Propostas_B2C_Total || row.propostas_b2c_total),
                    emissoes_b2c_total: safeParseFloat(row.Emissoes_B2C_Total || row.emissoes_b2c_total),
                    percentual_conversao_b2c: safeParseFloat(row['%_Conversao_B2C'] || row.percentual_conversao_b2c || row['%_conversao_b2c']),
                    observacoes: row.Observacoes || row.observacoes
                });
            });

            if (parsedData.length === 0) {
                self.postMessage({ type: 'ERROR', error: 'Nenhuma linha válida encontrada.' });
                return;
            }

            self.postMessage({ type: 'SUCCESS_B2C', data: parsedData, warnings });
        },
        error: (err: any) => {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    });
};
