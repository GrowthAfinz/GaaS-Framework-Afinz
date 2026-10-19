import { describe, it, expect } from "vitest";
import {
  groupActivityPerformance,
  observedRatio,
  recordedCac,
  uniqueExecutions,
} from "./activityPerformance";
import type { FrameworkActivity } from "./communicationOrchestrator";
const row = (id: string, extra: Partial<FrameworkActivity> = {}) =>
  ({
    id,
    jornada: "JOR_AQS_B2C_WEEK1",
    "Activity name / Taxonomia": "exact_activity",
    Canal: "E-mail",
    BU: "B2C",
    template_id: null,
    "Base Total": 100,
    "Base Acionável": 90,
    "Cartões Gerados": 2,
    "Custo Total Campanha": 10,
    ...extra,
  }) as FrameworkActivity;
describe("activity based performance", () => {
  it("keeps identity and totals stable when content becomes identified", () => {
    const a = row("1"),
      b = row("2", { template_id: "piece" });
    expect(groupActivityPerformance([a, b])).toHaveLength(1);
    expect(groupActivityPerformance([a, b])[0].pending).toBe(1);
    expect(
      groupActivityPerformance([{ ...a, template_id: "piece" }, b]),
    ).toHaveLength(1);
    expect(recordedCac([a, b])).toBe(5);
  });
  it("does not collapse the same name across journey, BU or channel", () => {
    expect(
      groupActivityPerformance([
        row("1"),
        row("2", { jornada: "another" }),
        row("3", { BU: "Plurix" }),
        row("4", { Canal: "SMS" }),
      ]),
    ).toHaveLength(4);
  });
  it("counts each execution once and preserves zero versus missing", () => {
    const a = row("1");
    expect(uniqueExecutions([a, a])).toHaveLength(1);
    expect(
      observedRatio(
        [row("1", { "Cartões Gerados": 0 })],
        "Cartões Gerados",
        "Base Acionável",
      ),
    ).toBe(0);
    expect(
      observedRatio(
        [a, row("2", { "Cartões Gerados": null })],
        "Cartões Gerados",
        "Base Acionável",
      ),
    ).toBeNull();
    expect(
      recordedCac([a, row("2", { "Custo Total Campanha": null })]),
    ).toBeNull();
  });
});
