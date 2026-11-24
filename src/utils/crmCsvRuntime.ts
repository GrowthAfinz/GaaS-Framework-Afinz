// Shared, browser-independent entry point for the audited CSV executor.
import Papa from 'papaparse';
import { decodeDelimitedFile } from './intelligentUpdateEngine';
export { processTotalCrmDinamicaBI, buildRentHistoryIndex, normalizeKey, buildDispatchSignature } from './intelligentUpdateEngine';
export { mapSqlToActivity } from './activitySqlMapper';
export { numericPatch, buildInsertPayload, buildRentabilizacaoInsertPayload } from './intelligentUpdatePayload';
export { acquisitionJourneyIdentity } from './intelligentImportRouting';
export { previousWeekStart } from '../components/admin/importSelection';

export function parseCsvBytes(bytes: Uint8Array): string[][] {
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const result = Papa.parse<string[]>(decodeDelimitedFile(buffer), { skipEmptyLines: false, delimiter: '' });
    if (result.errors.length && !result.data.length) throw new Error(result.errors[0].message);
    return result.data.filter(Array.isArray).map(row => row.map(cell => String(cell ?? '').trim()));
}
