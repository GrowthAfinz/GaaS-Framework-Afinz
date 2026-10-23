import { supabase } from "../../../services/supabaseClient";
import { latestVaultSync } from "../vaultService";
import type { VaultGraphLink } from "./wikiGraph";

async function assertIdle() {
  const { count, error } = await supabase
    .from("gaas_vault_sync_runs")
    .select("id", { count: "exact", head: true })
    .eq("vault_key", "afinz-crm-midia")
    .eq("status", "running");
  if (error) throw error;
  if (count)
    throw new Error(
      "A Wiki está sendo sincronizada. Aguarde a conclusão e atualize o mapa.",
    );
}
export async function fetchWikiGraphLinks(): Promise<VaultGraphLink[]> {
  await assertIdle();
  const before = await latestVaultSync();
  const links: VaultGraphLink[] = [];
  let expected: number | null = null;
  for (let offset = 0; ; ) {
    const { data, error, count } = await supabase
      .from("gaas_vault_links")
      .select(
        "source_note_id,target_note_id",
        offset === 0 ? { count: "exact" } : {},
      )
      .not("target_note_id", "is", null)
      .order("id")
      .range(offset, offset + 999);
    if (error) throw error;
    if (offset === 0) expected = count;
    const page = (data || []) as VaultGraphLink[];
    links.push(...page);
    if (!page.length || (expected !== null && links.length >= expected)) break;
    offset += page.length;
  }
  await assertIdle();
  const after = await latestVaultSync();
  if (
    expected === null ||
    links.length !== expected ||
    before?.id !== after?.id
  )
    throw new Error(
      "Os vínculos mudaram durante a leitura. Atualize para carregar o mapa completo.",
    );
  return links;
}
