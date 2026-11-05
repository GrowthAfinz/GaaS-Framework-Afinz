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
