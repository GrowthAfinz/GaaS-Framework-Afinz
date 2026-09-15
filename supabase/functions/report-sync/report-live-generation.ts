/**
 * Generation identities for the live Google workbook and deck.
 *
 * A publication writes into its own hidden Sheets namespace and creates skipped
 * Slides. Activation is a small, replayable visibility change after every
 * generated object has been verified.
 */

export interface SheetGenerationEntry {
  logical_title: string;
  physical_title: string;
  row_count: number;
  column_count: number;
}

export interface GeneratedSlide {
  objectId?: string;
  slideProperties?: { isSkipped?: boolean };
}

export interface PublishedGeneration {
  publication_id: string;
  run_id: string;
  release_key: string;
  status: string;
  publication_version: number;
}

const MANAGED_SLIDE_PREFIXES = ["rlv1s_", "rlv2s_", "v4sld_"] as const;

async function digest(value: string, length = 10): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const result = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(result)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

function safeTitlePart(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\[\]:*?/\\]/g, "_")
    .replace(/[^A-Za-z0-9_. -]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[_ .]+|[_ .]+$/g, "");
}

export async function generationSheetTitle(
  releaseKey: string,
  logicalTitle: string,
): Promise<string> {
  if (!/^[a-z0-9_]+$/.test(releaseKey)) {
    throw new Error("Identidade de geração inválida.");
  }
  const suffix = await digest(`${releaseKey}\u0000${logicalTitle}`);
  const prefix = `g_${releaseKey.slice(0, 20)}_`;
  const available = 100 - prefix.length - suffix.length - 1;
  const readable = (safeTitlePart(logicalTitle) || "view").slice(0, Math.max(1, available));
  return `${prefix}${readable}_${suffix}`;
}

export function exactGridSize(rows: unknown[][]) {
  return {
    rowCount: Math.max(1, rows.length),
    columnCount: Math.max(1, rows.reduce((maximum, row) => Math.max(maximum, row.length), 0)),
  };
}

export async function buildSheetGeneration(
  releaseKey: string,
  tables: Record<string, unknown[][]>,
) {
  const physicalTables: Record<string, unknown[][]> = {};
  const titleMap: Record<string, string> = {};
  const entries: SheetGenerationEntry[] = [];
  for (const [logicalTitle, rows] of Object.entries(tables)) {
    const physicalTitle = await generationSheetTitle(releaseKey, logicalTitle);
    if (physicalTables[physicalTitle]) {
      throw new Error(`Colisão de aba física para ${logicalTitle}.`);
    }
    const grid = exactGridSize(rows);
    physicalTables[physicalTitle] = rows;
    titleMap[logicalTitle] = physicalTitle;
    entries.push({
      logical_title: logicalTitle,
      physical_title: physicalTitle,
      row_count: grid.rowCount,
      column_count: grid.columnCount,
    });
  }
  return { physicalTables, titleMap, entries };
}

export function isManagedGeneratedSlide(objectId: string): boolean {
  return MANAGED_SLIDE_PREFIXES.some((prefix) => objectId.startsWith(prefix));
}

export function releaseSlidePrefix(releaseKey: string): string {
  if (!/^[a-z0-9_]+$/.test(releaseKey)) {
    throw new Error("Identidade de geração inválida.");
  }
  return `rlv2s_${releaseKey}_`;
}

/**
 * Retenção conservadora: mantém o ponteiro vivo e as N gerações publicadas mais
 * recentes. Só gera plano de exclusão para releases conhecidas e já
 * superseded/rolled_back; artefatos imutáveis no Storage e banco não entram no
 * plano.
 */
export function buildGenerationRetentionPlan(
  publications: PublishedGeneration[],
  currentPublicationId: string,
  keepGenerations = 2,
) {
  const keepCount = Math.max(2, Math.floor(keepGenerations));
  const ordered = [...publications].sort((a, b) => b.publication_version - a.publication_version);
  const retained = new Set<string>();
  const current = ordered.find((item) => item.publication_id === currentPublicationId);
  if (current?.release_key) retained.add(current.release_key);
  for (const item of ordered) {
    if (!item.release_key) continue;
    if (retained.size >= keepCount) break;
    retained.add(item.release_key);
  }
  const deletable = ordered.filter((item) =>
    item.release_key &&
    !retained.has(item.release_key) &&
    ["superseded", "rolled_back"].includes(item.status)
  );
  return {
    retained_release_keys: [...retained],
    deletable,
    immutable_artifacts_preserved: true,
  };
}

/**
 * Build an idempotent atomic activation batch. Older generated slides become
 * skipped and the target generation becomes visible. Slides outside Report
 * Live ownership are deliberately left untouched.
 */
export function buildSlideActivationRequests(
  slides: GeneratedSlide[],
  releaseKey: string,
) {
  const targetPrefix = releaseSlidePrefix(releaseKey);
  const targetIds = slides
    .map((slide) => String(slide.objectId ?? ""))
    .filter((objectId) => objectId.startsWith(targetPrefix));
  if (!targetIds.length) throw new Error("Geração da publicação não encontrada no deck.");

  const requests: Record<string, unknown>[] = [];
  for (const slide of slides) {
    const objectId = String(slide.objectId ?? "");
    if (!isManagedGeneratedSlide(objectId)) continue;
    const shouldSkip = !objectId.startsWith(targetPrefix);
    const currentlySkipped = slide.slideProperties?.isSkipped === true;
    if (currentlySkipped === shouldSkip) continue;
    requests.push({
      updateSlideProperties: {
        objectId,
        slideProperties: { isSkipped: shouldSkip },
        fields: "isSkipped",
      },
    });
  }
  return { requests, targetIds };
}

export function verifySlideActivation(slides: GeneratedSlide[], releaseKey: string) {
  const targetPrefix = releaseSlidePrefix(releaseKey);
  const managed = slides.filter((slide) => isManagedGeneratedSlide(String(slide.objectId ?? "")));
  const target = managed.filter((slide) => String(slide.objectId ?? "").startsWith(targetPrefix));
  const visibleTargets = target.filter((slide) => slide.slideProperties?.isSkipped !== true);
  const visiblePrevious = managed.filter((slide) =>
    !String(slide.objectId ?? "").startsWith(targetPrefix) && slide.slideProperties?.isSkipped !== true
  );
  return {
    verified: target.length > 0 && visibleTargets.length === target.length && visiblePrevious.length === 0,
    target_count: target.length,
    visible_target_count: visibleTargets.length,
    visible_previous_ids: visiblePrevious.map((slide) => slide.objectId),
  };
}

export function buildSlideVisibilityRestoreRequests(
  slides: GeneratedSlide[],
  visibleIds: string[],
) {
  const visible = new Set(visibleIds);
  const requests: Record<string, unknown>[] = [];
  for (const slide of slides) {
    const objectId = String(slide.objectId ?? "");
    if (!isManagedGeneratedSlide(objectId)) continue;
    const shouldSkip = !visible.has(objectId);
    const currentlySkipped = slide.slideProperties?.isSkipped === true;
    if (currentlySkipped === shouldSkip) continue;
    requests.push({ updateSlideProperties: {
      objectId,
      slideProperties: { isSkipped: shouldSkip },
      fields: "isSkipped",
    } });
  }
  return requests;
}

/**
 * A Drive PDF export includes skipped Slides. The isolated QA artifact
 * therefore keeps the target generation only. Every other page is removed
 * from the exported PDF, including unmanaged pages, without touching the deck.
 */
export function buildIsolatedExportPlan(
  slides: GeneratedSlide[],
  releaseKey: string,
) {
  const targetPrefix = releaseSlidePrefix(releaseKey);
  const targetIds = slides
    .map((slide) => String(slide.objectId ?? ""))
    .filter((objectId) => objectId.startsWith(targetPrefix));
  if (!targetIds.length) throw new Error("Geração da publicação não encontrada no export de QA.");
  const target = new Set(targetIds);
  return {
    targetIds,
    deleteIds: slides
      .map((slide) => String(slide.objectId ?? ""))
      .filter((objectId) => objectId.length > 0 && !target.has(objectId)),
  };
}
