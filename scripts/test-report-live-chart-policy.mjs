import test from "node:test";
import assert from "node:assert/strict";
import { usableNumericSeries } from "../supabase/functions/_shared/report-live-chart-policy.ts";

test("a chart is not created for a header-only or entirely blank series", () => {
  assert.deepEqual(usableNumericSeries([["campaign", "result"]], [1]), []);
  assert.deepEqual(usableNumericSeries([["campaign", "result"], ["A", ""], ["B", null]], [1]), []);
});

test("zero and formatted numeric values remain valid chart observations", () => {
  const values = [["name", "zero", "currency", "percent"], ["A", 0, "R$ 1.234,50", "0,0%"]];
  assert.deepEqual(usableNumericSeries(values, [1, 2, 3]), [1, 2, 3]);
});
