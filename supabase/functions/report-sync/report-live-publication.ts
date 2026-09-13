/** Publication protocol. Effects must be replayable under the same job ID. */
export const PUBLICATION_PHASES = [
  'backup', 'sheets', 'verify_sheets', 'slides', 'narrative', 'verify_slides', 'pdf', 'activate', 'commit', 'done',
] as const;
export type PublicationPhase = typeof PUBLICATION_PHASES[number];
export type PublicationReceipt = Record<string, unknown>;
export interface PublicationJob {
  id: string;
  phase: PublicationPhase;
  receipts: Partial<Record<PublicationPhase, PublicationReceipt>>;
}
export interface PublicationPorts {
  // Must reject stale ownership; called before effect and before checkpoint.
  assertOwnership(job: PublicationJob): Promise<void>;
  effect(phase: Exclude<PublicationPhase, 'done'>, job: PublicationJob): Promise<PublicationReceipt>;
  checkpoint(job: PublicationJob, next: PublicationPhase, receipt: PublicationReceipt): Promise<void>;
}

/** Run exactly one effect. A failed effect/checkpoint never advances the phase. */
export async function advancePublication(job: PublicationJob, ports: PublicationPorts) {
  if (job.phase === 'done') return { idle: true };
  const index = PUBLICATION_PHASES.indexOf(job.phase);
  if (index < 0) throw new Error('Etapa de publicação desconhecida.');
  for (const prerequisite of PUBLICATION_PHASES.slice(0, index)) {
    if (job.receipts[prerequisite]?.verified !== true) {
      throw new Error(`Etapa anterior não confirmada: ${prerequisite}`);
    }
  }
  await ports.assertOwnership(job);
  const completedPhase = job.phase;
  const receipt = await ports.effect(completedPhase, job);
  if (receipt.verified !== true) throw new Error(`Etapa não verificada: ${job.phase}`);
  await ports.assertOwnership(job);
  const next = PUBLICATION_PHASES[index + 1];
  await ports.checkpoint(job, next, receipt);
  return { completed_phase: completedPhase, next_phase: next };
}

export interface CellDifference {
  row: number;
  column: number;
  expected: unknown;
  actual: unknown;
}

const blank = (value: unknown) => value == null || value === '';
const normalizeCell = (value: unknown) => blank(value) ? null : value;

/** Sheets omits trailing empty cells/rows. Only blanks are normalized: never 0,
 * false, numeric strings, or formulas. Read using UNFORMATTED_VALUE. */
export function compareSheetValues(expected: unknown[][], actual: unknown[][], sampleLimit = 20) {
  let mismatchCount = 0;
  const differences: CellDifference[] = [];
  for (let r = 0; r < Math.max(expected.length, actual.length); r++) {
    const left = expected[r] ?? [], right = actual[r] ?? [];
    for (let c = 0; c < Math.max(left.length, right.length); c++) {
      const a = normalizeCell(left[c]), b = normalizeCell(right[c]);
      if (Object.is(a, b)) continue;
      mismatchCount++;
      if (differences.length < sampleLimit) differences.push({row:r+1,column:c+1,expected:a,actual:b});
    }
  }
  return { verified: mismatchCount === 0, mismatchCount, differences };
}

export function quoteSheetTitle(title: string): string {
  return `'${title.replace(/'/g, "''")}'`;
}

/** Only the identified generation may receive narrative and chart mutations. */
export function publicationSlides<T extends { objectId?: string }>(slides: T[], releaseKey: string): T[] {
  if (!/^[a-z0-9_]+$/.test(releaseKey)) throw new Error('Identidade de geração inválida.');
  const selected = slides.filter(slide => slide.objectId?.startsWith(`rlv2s_${releaseKey}_`));
  if (!selected.length) throw new Error('Geração da publicação não encontrada no deck.');
  return selected;
}
