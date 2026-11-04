import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  accumulateInsuranceDispatchRows,
  insuranceDispatchRows,
  insuranceMoM,
} from "./insuranceReportModel";
import {
  ReportWorkspaceHeader,
  REPORT_VIEWS,
} from "../relatorio/ReportWorkspace";
import { InsuranceReportViews } from "./InsuranceReportViews";
import type { InsurancePacket } from "./insuranceCore";

const packet: InsurancePacket = {
  version: "insurance/1",
  sources: [],
  metrics: [],
  issues: [],
  periodStart: "2026-04-01",
  periodEnd: "2026-10-31",
  dispatches: [],
  records: [],
  editorial: {},
  coverage: {},
};
describe("reusable report domain contract", () => {
  it("preserves the same five primary views for both reporting domains", () => {
    const labels = [
      "Overview",
      "Diário",
      "Mensal",
      "Evolução e anomalias",
      "Relatórios",
    ];
    expect(REPORT_VIEWS.map((v) => v.label)).toEqual(labels);
    for (const domain of ["Aquisição", "Seguros"]) {
      const html = renderToStaticMarkup(
        <ReportWorkspaceHeader
          title={`Relatórios | ${domain}`}
          view="performance"
          onViewChange={() => {}}
        />,
      );
      for (const label of labels) expect(html).toContain(label);
      expect((html.match(/aria-current="page"/g) || []).length).toBe(1);
    }
  });
  it("does not allocate monthly confirmed contracts across days or fill absent days with zero", () => {
    const source = {
      ...packet,
      dispatches: [
        {
          date: "2026-04-01",
          block: "email",
          sent: 100,
          delivered: 90,
          lp_registrations: 3,
          communication_cost: 10,
        },
        {
          date: "2026-04-03",
          block: "email",
          sent: 0,
          delivered: 0,
          lp_registrations: null,
          communication_cost: null,
        },
        {
          date: "2026-03-31",
          block: "email",
          sent: 900,
          delivered: 900,
          lp_registrations: 900,
          communication_cost: 900,
        },
      ],
    };
    const rows = insuranceDispatchRows(source, "2026-04");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      sent: 100,
      registrations: 3,
      contracts: null,
    });
    expect(rows[1]).toMatchObject({
      sent: 0,
      registrations: null,
      cost: null,
      contracts: null,
      alerts: 1,
    });
    expect(rows.some((r) => r.date === "2026-04-02")).toBe(false);
    const dailyHtml = renderToStaticMarkup(<InsuranceReportViews mode="daily" packet={source} product="all" period="2026-04" />);
    expect(dailyHtml).toContain('Contratações confirmadas');
    expect(dailyHtml).toContain('Acumulado');
    expect(dailyHtml).toContain('Resultados dia a dia');
    const html = renderToStaticMarkup(
      <InsuranceReportViews
        mode="daily"
        packet={source}
        product="mulher"
        period="2026-04"
      />,
    );
    expect(html).toContain("não tem produto governado");
    expect(html).not.toContain("Resultados dia a dia");
  });
  it("accumulates within channel without hiding missing measures or manufacturing contracts", () => {
    const rows = insuranceDispatchRows(
      {
        ...packet,
        dispatches: [
          {
            date: "2026-04-01",
            block: "email",
            sent: 100,
            delivered: 90,
            lp_registrations: 3,
            communication_cost: 10,
          },
          {
            date: "2026-04-03",
            block: "email",
            sent: 50,
            delivered: 40,
            lp_registrations: null,
            communication_cost: null,
          },
        ],
      },
      "2026-04",
    );
    expect(accumulateInsuranceDispatchRows(rows)[1]).toMatchObject({
      sent: 150,
      delivered: 130,
      registrations: null,
      cost: null,
      contracts: null,
    });
  });
  it("suppresses MoM for missing, zero baseline, gaps and partial months", () => {
    expect(insuranceMoM(120, 100, "2026-05", "2026-04")).toBe(0.2);
    expect(insuranceMoM(0, 100, "2026-05", "2026-04")).toBe(-1);
    expect(insuranceMoM(120, 0, "2026-05", "2026-04")).toBeNull();
    expect(insuranceMoM(null, 100, "2026-05", "2026-04")).toBeNull();
    expect(insuranceMoM(120, 100, "2026-06", "2026-04")).toBeNull();
    expect(insuranceMoM(120, 100, "2026-05", "2026-04", true)).toBeNull();
  });
});
