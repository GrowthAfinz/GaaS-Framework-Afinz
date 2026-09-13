import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSheetGeneration,
  buildIsolatedExportPlan,
  buildSlideActivationRequests,
  buildSlideVisibilityRestoreRequests,
  exactGridSize,
  generationSheetTitle,
  isManagedGeneratedSlide,
  verifySlideActivation,
} from "../supabase/functions/report-sync/report-live-generation.ts";

test("generation sheet names are deterministic, safe and collision resistant", async () => {
  const release = "9bb55892_abcdef12";
  const long = "VIEW_" + "MESMO_PREFIXO_".repeat(20) + "FINAL_A";
  const first = await generationSheetTitle(release, long);
  const repeated = await generationSheetTitle(release, long);
  const second = await generationSheetTitle(release, long.replace("FINAL_A", "FINAL_B"));
  assert.equal(first, repeated);
  assert.notEqual(first, second);
  assert.ok(first.length <= 100);
  assert.doesNotMatch(first, /[\[\]:*?/\\]/);
});

test("sheet generation maps logical contracts to exact hidden-grid dimensions", async () => {
  const tables = { "VIEW/A": [["a", "b"], [1, 2]], EMPTY: [] };
  const generation = await buildSheetGeneration("release_1234", tables);
  assert.equal(Object.keys(generation.physicalTables).length, 2);
  assert.deepEqual(generation.physicalTables[generation.titleMap["VIEW/A"]], tables["VIEW/A"]);
  assert.deepEqual(exactGridSize(tables["VIEW/A"]), { rowCount: 2, columnCount: 2 });
  assert.deepEqual(exactGridSize([]), { rowCount: 1, columnCount: 1 });
});

test("activation changes only generated slides and is replayable", () => {
  const slides = [
    { objectId: "manual_cover", slideProperties: { isSkipped: false } },
    { objectId: "v4sld_old", slideProperties: { isSkipped: false } },
    { objectId: "rlv2s_old_abc", slideProperties: { isSkipped: false } },
    { objectId: "rlv2s_new_key_a", slideProperties: { isSkipped: true } },
    { objectId: "rlv2s_new_key_b", slideProperties: { isSkipped: true } },
  ];
  assert.equal(isManagedGeneratedSlide("v4sld_old"), true);
  const activation = buildSlideActivationRequests(slides, "new_key");
  assert.equal(activation.requests.length, 4);
  assert.equal(activation.targetIds.length, 2);
  assert.ok(!JSON.stringify(activation.requests).includes("manual_cover"));

  const active = slides.map((slide) => ({
    ...slide,
    slideProperties: {
      isSkipped: !String(slide.objectId).startsWith("rlv2s_new_key_") && isManagedGeneratedSlide(String(slide.objectId)),
    },
  }));
  assert.equal(buildSlideActivationRequests(active, "new_key").requests.length, 0);
  assert.equal(verifySlideActivation(active, "new_key").verified, true);
});

test("activation rejects a missing generation", () => {
  assert.throws(
    () => buildSlideActivationRequests([{ objectId: "rlv2s_old_a" }], "new_key"),
    /não encontrada/,
  );
});

test("visibility restoration returns the exact prior generated set", () => {
  const slides = [
    { objectId: "manual", slideProperties: { isSkipped: false } },
    { objectId: "v4sld_old", slideProperties: { isSkipped: true } },
    { objectId: "rlv2s_new_key_a", slideProperties: { isSkipped: false } },
  ];
  const requests = buildSlideVisibilityRestoreRequests(slides, ["v4sld_old"]);
  assert.equal(requests.length, 2);
  assert.ok(!JSON.stringify(requests).includes("manual"));
  assert.deepEqual(requests.map((request) => request.updateSlideProperties.slideProperties.isSkipped), [false, true]);
});

test("isolated PDF keeps only the requested generation", () => {
  const plan = buildIsolatedExportPlan([
    { objectId: "manual_cover" },
    { objectId: "v4sld_old" },
    { objectId: "rlv2s_old_key_a" },
    { objectId: "rlv2s_new_key_a", slideProperties: { isSkipped: true } },
    { objectId: "rlv2s_new_key_b", slideProperties: { isSkipped: true } },
  ], "new_key");
  assert.deepEqual(plan.targetIds, ["rlv2s_new_key_a", "rlv2s_new_key_b"]);
  assert.deepEqual(plan.deleteIds, ["manual_cover", "v4sld_old", "rlv2s_old_key_a"]);
  assert.throws(() => buildIsolatedExportPlan([{ objectId: "rlv2s_old_a" }], "new_key"), /não encontrada/);
});
