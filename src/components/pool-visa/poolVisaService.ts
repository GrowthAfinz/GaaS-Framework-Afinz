import { supabase } from '../../services/supabaseClient';
import { POOL_VISA_JOURNEYS, toPoolDispatchRow, type PoolDispatchRow } from './poolVisaModel';
import { toLpEventRow, toLpTrafficRow, type LpEventRow, type LpTrafficRow } from './poolVisaLpModel';

export interface PoolVisaLpLoad {
  traffic: LpTrafficRow[];
  events: LpEventRow[];
  /** Última carga gravada (ok ou divergente). */
  lastRun: { createdAt: string; status: string; dateStart: string; dateEnd: string } | null;
  /** Período coberto pelas cargas ok (fora dele a LP é desconhecida, não zero). */
  coverage: { start: string; end: string } | null;
}

async function readAll(table: string, order: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from(table).select('*').order(order, { ascending: true }).range(from, from + pageSize - 1);
    if (error) throw new Error(`Não foi possível ler ${table}: ${error.message}`);
    const page = (data ?? []) as unknown as Record<string, unknown>[];
    out.push(...page);
    if (page.length < pageSize) return out;
  }
}

/** Leitura somente: visitas e cliques da LP do Pool (GA4) já carregados no Supabase. */
export async function fetchPoolVisaLp(): Promise<PoolVisaLpLoad> {
  const [traffic, events, runs] = await Promise.all([
    readAll('pool_visa_lp_traffic_daily', 'event_date'),
    readAll('pool_visa_lp_events_daily', 'event_date'),
    supabase.from('pool_visa_lp_ingest_runs').select('created_at,status,date_start,date_end').order('created_at', { ascending: false }).limit(500),
  ]);
  if (runs.error) throw new Error(`Não foi possível ler as cargas da LP: ${runs.error.message}`);
  const runRows = (runs.data ?? []) as Record<string, unknown>[];
  const run = runRows[0];
  const ok = runRows.filter((r) => r.status === 'ok');
  const coverage = ok.length
    ? { start: ok.map((r) => String(r.date_start)).sort()[0], end: ok.map((r) => String(r.date_end)).sort().slice(-1)[0] }
    : null;
  return {
    coverage,
    traffic: traffic.map(toLpTrafficRow).filter((r): r is LpTrafficRow => r !== null),
    events: events.map(toLpEventRow).filter((r): r is LpEventRow => r !== null),
    lastRun: run ? { createdAt: String(run.created_at), status: String(run.status), dateStart: String(run.date_start), dateEnd: String(run.date_end) } : null,
  };
}

export interface PoolVisaLoad {
  rows: PoolDispatchRow[];
  /** Linhas da fonte descartadas por data inválida (nunca deveria acontecer). */
  discarded: number;
  fetchedAt: string;
}

/** Leitura somente: disparos do Pool Visa em rentabilizacao_activities. */
export async function fetchPoolVisaDispatches(): Promise<PoolVisaLoad> {
  const raws: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('rentabilizacao_activities')
      .select('*')
      .in('jornada', Object.keys(POOL_VISA_JOURNEYS))
      .order('Data de Disparo', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`Não foi possível ler os disparos do Pool: ${error.message}`);
    const page = (data ?? []) as unknown as Record<string, unknown>[];
    raws.push(...page);
    if (page.length < pageSize) break;
  }
  const rows: PoolDispatchRow[] = [];
  for (const raw of raws) {
    const row = toPoolDispatchRow(raw);
    if (row) rows.push(row);
  }
  return { rows, discarded: raws.length - rows.length, fetchedAt: new Date().toISOString() };
}
