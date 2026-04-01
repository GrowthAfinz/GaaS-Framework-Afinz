import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { FrameworkRowSchema } from '../schemas/frameworkSchema';
import { parseDate, parseNumber, parseCurrency, parsePercentage, parseSafraToKey } from '../utils/formatters';
import { Activity, FrameworkRow } from '../types/framework';

export type WorkerMessage =
    | { type: 'PARSE_B2C_CSV'; fileContent: string }
    | { type: 'PARSE_FRAMEWORK_CSV'; fileContent: string }
    | { type: 'PARSE_PAID_MEDIA_XLSX'; fileContent: ArrayBuffer };

export type WorkerResponse =
    | { type: 'SUCCESS'; data: { rows: FrameworkRow[]; activities: Activity[] }; warnings?: string[] }
    | { type: 'SUCCESS_B2C'; data: any; warnings?: string[] }
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
        self.postMessage({ type: 'ERROR', error: err?.message ? err.message : String(err) });
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
    return headers.find((header) => normalizeColumnName(header) === normalized) || null;
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

const FRAMEWORK_ALLOWED_HEADERS = new Set([
    'Disparado?',
    'Jornada',
    'Activity name / Taxonomia',
    'Canal',
    'Data de Disparo',
    'Data Fim',
    'Safra',
    'BU',
    'Parceiro',
    'SIGLA',
    'Segmento',
    'Subgrupos',
    'Base Total',
    'Base Acionável',
    'Abertura',
    'Cliques',
    '% Otimização de base',
    'Etapa de aquisição',
    'Ordem de disparo',
    'Perfil de Crédito',
    'Produto',
    'Oferta',
    'Promocional',
    'Oferta 2',
    'Promocional 2',
    'Custo Unitário Oferta',
    'Custo Total da Oferta',
    'Custo unitário do canal',
    'Custo total canal',
    'Taxa de Entrega',
    'Taxa de Abertura',
    'Taxa de Clique',
    'Taxa de Proposta',
    'Taxa de Aprovação',
    'Taxa de Finalização',
    'Taxa de Conversão',
    'Custo Total Campanha',
    'CAC',
    'Cartões Gerados',
    'Aprovados',
    'Propostas',
    'Emissões Independentes',
    'Emissões Assistidas',
].map(normalizeColumnName));

const sanitizeFrameworkCsv = (csvText: string): { csvText: string; warnings: string[] } => {
    const warnings: string[] = [];
    const trimmedTrailingSeparators = csvText.replace(/;+(?=\r?\n|$)/g, '');

    if (trimmedTrailingSeparators.length !== csvText.length) {
        warnings.push('Staging: colunas vazias à direita foram removidas antes do processamento.');
    }

    const lines = trimmedTrailingSeparators.split(/\r?\n/);
    if (lines.length === 0 || !lines[0]) {
        return { csvText: trimmedTrailingSeparators, warnings };
    }

    const rawHeaders = lines[0]
        .split(';')
        .map((header) => header.replace(/^\uFEFF/, '').trim());

    const selectedIndexes: number[] = [];
    const selectedHeaders: string[] = [];
    const ignoredHeaders = new Set<string>();
    let siglaCount = 0;

    rawHeaders.forEach((header, index) => {
        if (!header) return;

        const normalizedHeader = normalizeColumnName(header);
        if (normalizedHeader === normalizeColumnName('SIGLA')) {
            siglaCount += 1;
            selectedIndexes.push(index);
            selectedHeaders.push(siglaCount === 1 ? 'SIGLA' : `SIGLA.${siglaCount - 1}`);
            return;
        }

        if (FRAMEWORK_ALLOWED_HEADERS.has(normalizedHeader)) {
            selectedIndexes.push(index);
            selectedHeaders.push(header);
            return;
        }

        ignoredHeaders.add(header);
    });

    if (ignoredHeaders.size > 0) {
        warnings.push(`Staging: ${ignoredHeaders.size} colunas fora do modelo foram ignoradas.`);
    }

    if (selectedIndexes.length === 0) {
        return { csvText: trimmedTrailingSeparators, warnings };
    }

    const sanitizedLines = [selectedHeaders.join(';')];
    for (let lineIndex = 1; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        if (!line) {
            sanitizedLines.push('');
            continue;
        }

        const cells = line.split(';');
        sanitizedLines.push(selectedIndexes.map((index) => cells[index] ?? '').join(';'));
    }

    return {
        csvText: sanitizedLines.join('\n'),
        warnings,
    };
};

const handleFramework = (csvText: string) => {
    const { csvText: sanitizedCsvText, warnings: stagingWarnings } = sanitizeFrameworkCsv(csvText);

    Papa.parse(sanitizedCsvText, {
        delimiter: ';',
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
                    for (const synonym of synonyms) {
                        const foundSynonym = findColumnByNormalized(headers, synonym);
                        if (foundSynonym) return foundSynonym;
                    }
                    return null;
                };

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
                columnMap['Abertura'] = findCol('Abertura', ['Aberturas', 'Volume de Abertura', 'Vol de Abertura']) ?? 'Abertura';
                columnMap['Cliques'] = findCol('Cliques', ['Clicks', 'Volume de Cliques', 'Vol de Cliques']) ?? 'Cliques';
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

                columnMap['Data Fim'] = findCol('Data Fim') ?? 'Data Fim';
                columnMap['Produto'] = findCol('Produto') ?? 'Produto';
                columnMap['Promocional'] = findCol('Promocional') ?? 'Promocional';
                columnMap['Subgrupos'] = findCol('Subgrupos') ?? 'Subgrupos';
                columnMap['Etapa de aquisição'] = findCol('Etapa de aquisição', ['Etapa']) ?? 'Etapa de aquisição';
                columnMap['% Otimização de base'] = findCol('% Otimização de base') ?? '% Otimização de base';
                columnMap['Custo Unitário Oferta'] = findCol('Custo Unitário Oferta') ?? 'Custo Unitário Oferta';
                columnMap['Custo Total da Oferta'] = findCol('Custo Total da Oferta') ?? 'Custo Total da Oferta';
                columnMap['Custo unitário do canal'] = findCol('Custo unitário do canal') ?? 'Custo unitário do canal';
                columnMap['Custo total canal'] = findCol('Custo total canal') ?? 'Custo total canal';
                columnMap['Taxa de Clique'] = findCol('Taxa de Clique') ?? 'Taxa de Clique';
                columnMap['Oferta 2'] = findCol('Oferta 2') ?? 'Oferta 2';
                columnMap['Promocional 2'] = findCol('Promocional 2') ?? 'Promocional 2';
                columnMap['SIGLA'] = findCol('SIGLA') ?? 'SIGLA';
                columnMap['SIGLA.1'] = findCol('SIGLA.1') ?? 'SIGLA.1';
                columnMap['SIGLA.2'] = findCol('SIGLA.2') ?? 'SIGLA.2';

                const missing = requiredColumns.filter((column) => !columnMap[column]);
                if (missing.length > 0) {
                    const critical = ['Activity name / Taxonomia', 'Data de Disparo', 'BU'];
                    const missingCritical = critical.filter((column) => missing.includes(column));
                    if (missingCritical.length > 0) {
                        throw new Error(`Colunas obrigatórias ausentes: ${missingCritical.join(', ')}`);
                    }
                }

                const processedRows: FrameworkRow[] = [];
                const newActivities: Activity[] = [];
                let validCount = 0;
                const errors: string[] = [];

                const columnMapEntries = Object.entries(columnMap);
                const standardMappedKeysSet = new Set(Object.values(columnMap));

                standardMappedKeysSet.add('Activity name / Taxonomia');
                standardMappedKeysSet.add('Data de Disparo');
                standardMappedKeysSet.add('BU');

                rawRows.forEach((row, idx) => {
                    const mappedRow: any = { ...row };

                    columnMapEntries.forEach(([standardKey, csvKey]) => {
                        if (csvKey && standardKey !== csvKey) {
                            mappedRow[standardKey] = row[csvKey];
                        }
                    });

                    const validation = FrameworkRowSchema.safeParse(mappedRow);
                    let validRow: FrameworkRow;

                    if (validation.success) {
                        validRow = validation.data as FrameworkRow;
                    } else {
                        const msg = `Linha ${idx + 2}: ${validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`;
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

                    const prunedRaw: any = {};
                    Object.entries(validRow).forEach(([key, value]) => {
                        if (!standardMappedKeysSet.has(key) && value !== null && value !== undefined && value !== '') {
                            prunedRaw[key] = value;
                        }
                    });

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
                            aberturas: parseNumber(validRow['Abertura']),
                            cliques: parseNumber(validRow['Cliques']),
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
                        raw: prunedRaw
                    };

                    newActivities.push(activity);
                    validCount += 1;
                });

                if (validCount === 0) {
                    throw new Error(`Nenhuma linha válida encontrada. Erros: ${errors.join('; ')}`);
                }

                self.postMessage({
                    type: 'SUCCESS',
                    data: { rows: processedRows, activities: newActivities },
                    warnings: [...stagingWarnings, ...errors]
                });
            } catch (err: any) {
                console.error('handleFramework error:', err);
                self.postMessage({ type: 'ERROR', error: err?.message ? err.message : String(err) });
            }
        },
        error: (err: any) => {
            console.error('Papa.parse error callback:', err);
            self.postMessage({ type: 'ERROR', error: err?.message ? err.message : String(err) });
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
                results.errors.forEach((error: any) => warnings.push(`CSV Error: ${error.message}`));
            }

            if (!results.data || results.data.length === 0) {
                self.postMessage({ type: 'ERROR', error: 'Arquivo vazio ou inválido.' });
                return;
            }

            results.data.forEach((row: any) => {
                const rawDate = row.Data || row.data;
                const parsedDate = parseDate(rawDate);
                if (!parsedDate) return;

                const year = parsedDate.getFullYear();
                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                const day = String(parsedDate.getDate()).padStart(2, '0');
                const data = `${year}-${month}-${day}`;

                const safeParseFloat = (value: any) => {
                    if (typeof value === 'number') return value;
                    if (!value) return 0;
                    let clean = value.replace(/[R$\s%]/g, '');
                    clean = clean.replace(/\./g, '');
                    clean = clean.replace(',', '.');
                    return parseFloat(clean) || 0;
                };

                parsedData.push({
                    data,
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

void XLSX;
