import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { PoolOperationPlan } from "./PoolOperationPlan";
import operation from "../fixtures/visaOperation.json";
import { PoolAudienceControls } from "./PoolAudienceControls";
import { VDV_SAMPLES, parseVdvMovimentoCsv } from "../domain/vaiDeVisa";
import { VDV_MOVIMENTO_CSV } from "../fixtures/vdvBF26V1.csv";
describe("Referência operacional do Pool", () => {
  it("separa versão em operação de SQL proposto e mantém decisões abertas navegáveis", () => {
    const running = operation.steps
      .filter((s) => s.status === "rodando")
      .map((s) => s.number);
    expect(running).toEqual(["02", "03", "04", "06"]);
    expect(operation.steps.find((s) => s.number === "08")?.status).toBe(
      "proposta",
    );
    expect(
      operation.steps.find((s) => s.number === "04")?.currentSql[0],
    ).toContain("UNION ALL");
    expect(
      operation.steps.find((s) => s.number === "04")?.proposalSql[0],
    ).toContain("t.SAFRA");
    const html = renderToStaticMarkup(<PoolOperationPlan rulers={[]} />);
    expect(html).toContain("Banco Afinz");
    expect(html).toContain("inferência forte");
    expect(html).toContain("MID a confirmar");
    expect(html).toContain("SQL proposto");
    expect(html).toContain("não testado no SFMC");
    expect(html).toContain("wiki_path=07-Evolucao");
    expect(operation.decisions.map((d) => d.number)).toEqual([
      21, 22, 23, 24, 25, 26, 27, 28, 29,
    ]);
  });
  it("identifica vitrine genérica sem reclassificar o comprador e exclui controle das opções", () => {
    const html = renderToStaticMarkup(
      <PoolAudienceControls
        movimento={parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV)}
        version="BF26_V1"
        sample={{ ...VDV_SAMPLES[0].sample, DS_CELULA_TESTE: "SEG-B" }}
        onChange={() => {}}
        today="2026-11-05"
        onDate={() => {}}
      />,
    );
    expect(html).toContain("Moda");
    expect(html).toContain("Genérica");
    expect(html).toContain('value="SEG-B" selected');
    expect(html).not.toContain('value="SEG-C"');
  });
});
