export const REPORT_LIVE_DESIGN_VERSION = "2.2-editorial-profiles-outcomes";
export const REPORT_LIVE_SPEC_VERSION = "3.1";

export const AFINZ_LIGHT = {
  canvas: "#F7F9FA",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF3F4",
  text: "#111827",
  textMuted: "#667085",
  border: "#D9E2E5",
  cyan: "#00C6CC",
  lime: "#D3FF00",
  blue: "#3B82F6",
  green: "#10B981",
  purple: "#A855F7",
  amber: "#F59E0B",
  red: "#DC2626",
} as const;

export type SlideArchetype =
  | "cover_contract"
  | "executive_takeaway"
  | "quality_gate"
  | "scorecard"
  | "time_series_pacing"
  | "router_ranking"
  | "driver_scatter"
  | "funnel"
  | "heatmap"
  | "analytical_table"
  | "action_queue"
  | "technical_annex";

export interface SlideGeometry {
  visual: { x: number; y: number; width: number; height: number };
  narrative: { x: number; y: number; width: number; height: number };
}

/** Canvas 720 x 405 pt, com 28 pt de margem e rodapé a partir de y=371. */
export function layoutGeometryFor(
  archetype: SlideArchetype,
  hasRulers = false,
): SlideGeometry {
  if (hasRulers) {
    return {
      visual: { x: 28, y: 184, width: 438, height: 158 },
      narrative: { x: 480, y: 100, width: 212, height: 255 },
    };
  }
  if (archetype === "cover_contract") {
    return {
      visual: { x: 28, y: 100, width: 664, height: 145 },
      narrative: { x: 28, y: 255, width: 664, height: 100 },
    };
  }
  if (archetype === "executive_takeaway") {
    return {
      visual: { x: 28, y: 100, width: 250, height: 255 },
      narrative: { x: 288, y: 100, width: 404, height: 255 },
    };
  }
  if (archetype === "quality_gate") {
    return {
      visual: { x: 28, y: 100, width: 664, height: 190 },
      narrative: { x: 28, y: 300, width: 664, height: 55 },
    };
  }
  if (archetype === "time_series_pacing" || archetype === "heatmap" || archetype === "technical_annex") {
    return {
      visual: { x: 28, y: 100, width: 500, height: 255 },
      narrative: { x: 540, y: 100, width: 152, height: 255 },
    };
  }
  if (archetype === "funnel") {
    return {
      visual: { x: 28, y: 100, width: 470, height: 255 },
      narrative: { x: 510, y: 100, width: 182, height: 255 },
    };
  }
  if (archetype === "action_queue") {
    return {
      visual: { x: 28, y: 100, width: 664, height: 175 },
      narrative: { x: 28, y: 285, width: 664, height: 70 },
    };
  }
  return {
    visual: { x: 28, y: 100, width: 438, height: 255 },
    narrative: { x: 480, y: 100, width: 212, height: 255 },
  };
}

export function archetypeFor(slideCode: string): SlideArchetype {
  if (slideCode === "C0") return "cover_contract";
  if (slideCode === "C1") return "executive_takeaway";
  if (["C2", "M6", "B3", "K-QLT"].includes(slideCode)) return "quality_gate";
  if (["C3", "P1"].includes(slideCode)) return "scorecard";
  if (["C4", "M1", "B2"].includes(slideCode)) return "time_series_pacing";
  if (["C5", "M2", "M3"].includes(slideCode)) return "router_ranking";
  if (slideCode === "C6") return "driver_scatter";
  if (["P4", "M4", "B1"].includes(slideCode)) return "funnel";
  if (["P3", "A1"].includes(slideCode)) return "heatmap";
  if (["C8", "P7", "M7"].includes(slideCode)) return "action_queue";
  if (slideCode.startsWith("A")) return "technical_annex";
  return "analytical_table";
}

export function accentFor(section: string): string {
  if (section === "media") return AFINZ_LIGHT.blue;
  if (section === "partner") return AFINZ_LIGHT.green;
  if (section === "b2c") return AFINZ_LIGHT.cyan;
  if (section === "annex") return AFINZ_LIGHT.purple;
  return AFINZ_LIGHT.cyan;
}

export function minimumBodySize(section: string): number {
  return section === "annex" ? 9 : 11;
}

function safeObjectPart(value: string, maxLength: number): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maxLength);
}

async function shortDigest(value: string, length: number): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

/**
 * Google Slides object ids must be stable for a release, short, and collision
 * resistant. Human-readable truncation is deliberately not used: partner names
 * and long slide instance ids frequently share the same prefix.
 */
export async function reportLiveReleaseKey(runId: string): Promise<string> {
  const readable = safeObjectPart(runId, 8) || "release";
  return `${readable}_${await shortDigest(runId, 8)}`;
}

export async function stableReportLiveObjectId(
  prefix: string,
  releaseKey: string,
  logicalId: string,
): Promise<string> {
  const safePrefix = safeObjectPart(prefix, 8) || "rlv2";
  const safeRelease = safeObjectPart(releaseKey, 20) || "release";
  const digest = await shortDigest(`${safePrefix}\u0000${releaseKey}\u0000${logicalId}`, 18);
  return `${safePrefix}_${safeRelease}_${digest}`.slice(0, 50);
}
