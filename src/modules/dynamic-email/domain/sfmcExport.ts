import { exportBriefingCsv, type BriefingRow } from './briefing';

export type SfmcExportOptions = { campaignType: string; requireDynamicHeader: boolean };

/** Apply only the operator's export choices; never invent missing creative content. */
export function prepareSfmcExport(rows: BriefingRow[], options: SfmcExportOptions): BriefingRow[] {
  const prepared = rows.map(row => ({ ...row, TP_CAMPANHA: options.campaignType.trim() || row.TP_CAMPANHA }));
  const keys = new Set<string>();
  for (const row of prepared) {
    const key = JSON.stringify([row.NM_PRODUTO_INTERNO, row.TP_CAMPANHA, row.SEQUENCIA]);
    if (keys.has(key)) throw new Error(`Chave SFMC duplicada após definir a campanha: ${row.NM_PRODUTO_INTERNO} / ${row.TP_CAMPANHA} / ${row.SEQUENCIA}. Exporte uma régua por vez.`);
    keys.add(key);
    if (options.requireDynamicHeader && (!row.HEADER_TITULO?.trim() || !row.HEADER_IMAGEM_CARTAO?.trim())) {
      throw new Error(`Header V13 incompleto: ${row.NM_PRODUTO_INTERNO} / ${row.SEQUENCIA}. Preencha título e imagem do cartão no briefing antes de exportar.`);
    }
  }
  return prepared;
}

export function buildSfmcExport(rows: BriefingRow[], options: SfmcExportOptions): string {
  return exportBriefingCsv(prepareSfmcExport(rows, options));
}
