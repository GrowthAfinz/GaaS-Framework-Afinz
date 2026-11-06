import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect } from "vitest";
import { StrategyWorkspace } from "./DynamicEmailWorkspace";
import { VDV_SAMPLES } from "../domain/vaiDeVisa";
it("pede uma frente antes de mostrar os parceiros e mantém as três frentes visíveis", () => {
  const html = renderToStaticMarkup(
    <StrategyWorkspace
      rulers={[]}
      vdvData={{ briefing: [], movimento: [] }}
      vdvSample={VDV_SAMPLES[0].sample}
      onVdvSample={() => {}}
      today="2026-11-05"
      onDate={() => {}}
      strategies={[]}
      contexts={[]}
      guardrails={[]}
      rows={[]}
      syncState="Teste"
      onRefresh={() => {}}
      onSaved={() => {}}
      onSavedContext={() => {}}
      onSavedGuardrail={() => {}}
    />,
  );
  expect(html).toContain("Selecione uma frente");
  expect(html).toContain("Aquisição");
  expect(html).toContain("Ciclo de Vida");
  expect(html).toContain("Rentabilização");
  expect(html).not.toContain("Ficha de Produto");
  expect(html).not.toContain("Buscar no plano");
});
