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
    expect(operation.steps.map(s=>s.id)).toEqual(['Q_VDV_02_MAPA','Q_VDV_03_CRUZAMENTO','Q_VDV_04_SAFRA','Q_VDV_08_POOL','Q_VDV_05_APTOS','Q_VDV_06_FUNIL']);
    expect(operation.steps[2].currentSql[0]).toContain("UNION ALL");
    expect(operation.steps[1].proposalSql[0]).toContain('ULTIMO_ACESSO');
    const html = renderToStaticMarkup(<PoolOperationPlan rulers={[]} />);
    expect(html).toContain("Banco Afinz");
    expect(html).toContain("inferência documental");
    expect(html).toContain("MID a confirmar");
    expect(html).toContain("Delta proposto");
    expect(html).toContain("não testado no SFMC");
    expect(html).toContain("wiki_path=07-Evolucao");
    expect(html).toContain('100.000 por rodada');
    expect(html).toContain('sem envio automático');
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
