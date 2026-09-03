import type { BriefingColumn, BriefingRow } from '../domain/briefing';

export interface AnchorBlockSpec {
  id: string;
  /** Colunas do briefing candidatas a "assinatura" do bloco, em ordem de prioridade. */
  signatureColumns: BriefingColumn[];
}

// Fallback caso o SET do template não seja parseável (renames raros de variável).
const FALLBACK_COLUMN_TO_VAR: Record<string, string> = {
  HEADER: 'Header',
  TITULO_COPY_1_AZUL: 'TituloCopy1',
  COPY_1_PRETO: 'Copy1Preto',
  TITULO_CTA_1: 'TituloCTA1',
  BANNER_1_CORPO: 'Banner1Corpo',
  TITULO_COPY_2: 'TituloCopy2',
  COPY_2_PRETO: 'Copy2Preto',
  TITULO_CTA_2: 'TituloCTA2',
  BANNER_2_CORPO: 'Banner2Corpo',
  BANNER_3_CORPO: 'Banner3Corpo',
  NOTA_LEGAL: 'NotaLegal',
  RODAPE: 'Rodape',
};

// Lê os `SET @Var = Field(@Row, "COLUNA")` do próprio template para não depender
// de nomes fixos de variável; começa do fallback e sobrescreve com o que achar.
const buildColumnToVar = (source: string): Record<string, string> => {
  const map: Record<string, string> = { ...FALLBACK_COLUMN_TO_VAR };
  for (const match of source.matchAll(/SET\s+@(\w+)\s*=\s*(?:Trim\s*\(\s*)?Field\s*\(\s*@\w+\s*,\s*["']([^"']+)["']\s*\)/gi)) {
    map[match[2].trim().toUpperCase()] = match[1];
  }
  return map;
};

const isFilled = (value: string | undefined): boolean => typeof value === 'string' && value.trim() !== '';

const sentinel = (id: string) =>
  `<span data-eb-block="${id}" style="display:inline-block;width:0;height:0;max-height:0;overflow:hidden;font-size:0;line-height:0" aria-hidden="true"></span>`;

/**
 * Insere um marcador invisível (`<span data-eb-block>`) no início da região de
 * cada bloco, ANTES do render. A prévia localiza cada bloco por esse marcador em
 * vez de procurar o texto renderizado — o que era frágil: um título que repete o
 * pré-cabeçalho, cópia duplicada entre blocos ou um campo só com AMPscript
 * faziam a âncora cair no elemento errado (ex.: o pré-cabeçalho `display:none` no
 * topo do body), invertendo a ordem dos pinos.
 *
 * O marcador é injetado logo após a guarda `%%[ IF ... @Var ... ]%%` do bloco (e
 * depois de eventuais `<tr>/<td>` de abertura, para não ser expulso da tabela
 * pelo parser). Assim ele só aparece quando o bloco de fato renderiza.
 */
export function injectBlockAnchors(source: string, row: BriefingRow, blocks: AnchorBlockSpec[]): string {
  if (!source || source.includes('data-eb-block=')) return source;
  const columnToVar = buildColumnToVar(source);
  let out = source;
  for (const block of blocks) {
    const column = block.signatureColumns.find((col) => isFilled(row[col]));
    if (!column) continue;
    const varName = columnToVar[column.toUpperCase()];
    if (!varName) continue;
    // guarda do bloco + <tr>/<td> de abertura opcionais (grupo 2), para injetar
    // o marcador já dentro da célula e não antes da <table>.
    const guard = new RegExp(
      `(%%\\[\\s*IF\\b[^\\]]*@${varName}\\b[^\\]]*\\]%%)(\\s*(?:<tr\\b[^>]*>)?\\s*(?:<td\\b[^>]*>)?)`,
      'i',
    );
    if (!guard.test(out)) continue;
    out = out.replace(guard, `$1$2${sentinel(block.id)}`);
  }
  return out;
}
