import { supabase } from "../../../services/supabaseClient";
import {
  VDV_BRIEFING_COLUMNS,
  VDV_MOVIMENTO_COLUMNS,
  type VdvBriefingRow,
  type VdvMovimentoRow,
} from "../domain/vaiDeVisa";
type Table = "briefing" | "movimento";
const columns = (table: Table) =>
  table === "briefing" ? VDV_BRIEFING_COLUMNS : VDV_MOVIMENTO_COLUMNS;
function fromDb(row: Record<string, unknown>, table: Table) {
  return Object.fromEntries([
    ...columns(table).map((c) => [
      c,
      c === "ATIVA"
        ? row.ativa
          ? "True"
          : "False"
        : String(row[c.toLowerCase()] ?? ""),
    ]),
    ["__version", String(row.version)],
    ["__source", String(row.source)],
  ]);
}
export async function loadVdv(table: Table): Promise<Record<string, string>[]> {
  const { data, error } = await supabase
    .from("dynamic_email_vdv_" + table)
    .select("*")
    .order(table === "briefing" ? "id" : "versao");
  if (error) throw error;
  return (data ?? []).map((r) => fromDb(r, table));
}
/** O RPC executa o lote numa transação e recusa versões concorrentes. */
export async function saveVdv(
  table: Table,
  rows: (VdvBriefingRow | VdvMovimentoRow)[],
  source: "import" | "gaas",
) {
  const items = rows.map((row) => ({
    ...Object.fromEntries(
      columns(table).map((c) => [
        c.toLowerCase(),
        c === "ATIVA"
          ? row[c].toLowerCase() === "true"
          : c === "POSICAO"
            ? Number(row[c])
            : row[c],
      ]),
    ),
    source,
    expected_version: Number(row.__version ?? 0),
  }));
  const { data, error } = await supabase.rpc("save_vdv_" + table, { items });
  if (error) throw error;
  return ((data as Record<string, unknown>[]) ?? []).map((r) =>
    fromDb(r, table),
  );
}
import type { WorkspaceBriefing } from '../domain/workspace';
import { exportableRow } from '../domain/workspace';
import { toBriefing } from './workspaceService';
import { validateVdv } from '../domain/vaiDeVisa';
import { factoryContextSchema } from '../domain/factoryEmail';

export function vdvSaveItems(table:Table,rows:Record<string,string>[]) {
 return rows.filter(r=>!r.__version||r.__dirty==='true').map(row=>({...Object.fromEntries(columns(table).map(c=>[c.toLowerCase(),c==='ATIVA'?row[c].toLowerCase()==='true':c==='POSICAO'?Number(row[c]):row[c]])),source:row.__source==='import'?'import':'gaas',expected_version:Number(row.__version||0)}));
}
/** Salva conteúdo compartilhado e documentos numa única transação, com comparação de versões. */
export async function saveVdvFactory(rows:WorkspaceBriefing[],content:{briefing:VdvBriefingRow[];movimento:VdvMovimentoRow[]},warnings:string[]) {
 for(const row of rows)factoryContextSchema.parse(row.__editor);
 const errors=validateVdv(content).filter(i=>i.severity==='error');
 if(errors.length)throw new Error(errors.map(i=>i.message).join(' '));
 const documents=rows.map(row=>({id:row.__id,briefing_data:exportableRow(row),partner:row.__meta.partner,segment:row.__meta.segment,week_key:row.__meta.weekKey,campaign_group_id:row.__meta.campaignGroupId,status:row.__meta.status,version:row.__meta.version,expected_version:row.__meta.savedAt?row.__meta.version-1:0,template_slot_id:row.__meta.templateSlotId,activity_names:row.__meta.activityNames,journey_confirmed:!!row.__journeyConfirmed,acknowledged_missing_activity:!!row.__meta.acknowledgedMissingActivity}));
 const {data,error}=await supabase.rpc('save_vdv_factory',{briefing_items:vdvSaveItems('briefing',content.briefing),movimento_items:vdvSaveItems('movimento',content.movimento),documents,warnings});
 if(error)throw error;const result=data as {rows:Record<string,unknown>[];briefing:Record<string,unknown>[];movimento:Record<string,unknown>[]};
 return {rows:result.rows.map(toBriefing),content:{briefing:result.briefing.map(r=>fromDb(r,'briefing')),movimento:result.movimento.map(r=>fromDb(r,'movimento'))}};
}
