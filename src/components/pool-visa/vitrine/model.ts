// Mockup Vitrine Pool: modelo em cima das extrações reais (harness, fora do git).
import raw from './data.json';

export type Row = Record<string, string>;
export interface Snapshot { id: string; fileDate: string; rows: Row[] }
export const DATA = raw as unknown as { positions: Snapshot[]; briefing: { fileDate: string; rows: Row[] }[] };

export const GROUPS = ['MODA', 'SAUDE_BELEZA', 'FAMILIA_PRESENTES', 'GENERICO'] as const;
export const GROUP_LABEL: Record<string, string> = { MODA: 'Moda', SAUDE_BELEZA: 'Saúde e Beleza', FAMILIA_PRESENTES: 'Família e Presentes', GENERICO: 'Genérico' };
export const MOTIVO_LABEL: Record<string, string> = { GRUPO: 'do grupo', DESCOBERTA: 'descoberta', COMPLETAR: 'completar' };

/** '30/11/2026 00:00:00' ou '2026-11-30' → '2026-11-30'. */
export function isoDate(v: string | undefined): string {
  const s = (v ?? '').trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`;
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}
export const br = (iso: string) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : 'sem data');
export const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
export const daysUntil = (iso: string) => (iso ? Math.round((Date.parse(`${iso}T12:00:00`) - Date.parse(`${today}T12:00:00`)) / 86400000) : null);
export const isTrue = (v: string | undefined) => /^true$/i.test((v ?? '').trim()) || v === '1';
export const filled = (v: string | undefined) => Boolean((v ?? '').trim());

export const latestBriefing = DATA.briefing[DATA.briefing.length - 1];
export const briefingById = (snap: { rows: Row[] }) => new Map(snap.rows.map((r) => [r.ID, r]));
export const LATEST = briefingById(latestBriefing);

export interface Position { versao: string; grupo: string; celula: string; posicao: number; ofertaId: string; ativa: string; motivo: string; dtRodada: string; versaoTema: string }
export const toPositions = (snap: Snapshot): Position[] => snap.rows.map((r) => ({
  versao: r.VERSAO, grupo: r.GRUPO, celula: r.CELULA, posicao: Number(r.POSICAO), ofertaId: r.OFERTA_ID, ativa: r.ATIVA, motivo: r.MOTIVO, dtRodada: isoDate(r.DT_RODADA), versaoTema: r.VERSAO_TEMA,
}));
export const versionsOf = (snap: Snapshot) => [...new Set(snap.rows.map((r) => r.VERSAO))].sort();
export const versionDate = (v: string) => { const m = /(\d{4})(\d{2})(\d{2})$/.exec(v); return m ? `${m[1]}-${m[2]}-${m[3]}` : ''; };

export const benefit = (r: Row) => [r.PREFIXO, r.VALOR, r.SUFIXO].map((s) => (s ?? '').trim()).filter(Boolean).join(' ');
