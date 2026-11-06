import { describe, it, expect } from "vitest";
import { createVdvEdition } from "./factoryEmail";
import { emptyBriefingRow } from "./briefing";
import { withMeta } from "./workspace";
import {
  poolGroups,
  poolComparison,
  strategyFront,
  strategyScope,
  newPoolOffer,
} from "./poolCreation";
import {
  parseVdvBriefingCsv,
  parseVdvMovimentoCsv,
  VDV_SAMPLES,
  VDV_BRIEFING_COLUMNS,
} from "./vaiDeVisa";
import { VDV_BRIEFING_CSV, VDV_MOVIMENTO_CSV } from "../fixtures/vdvBF26V1.csv";
import type { EmailStrategy } from "./management";
const data = {
  briefing: parseVdvBriefingCsv(VDV_BRIEFING_CSV),
  movimento: parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV),
};
it("cria oferta inativa com identificador único e conserva as 41 colunas do contrato", () => {
  const a = newPoolOffer(),
    b = newPoolOffer();
  expect(a.ID).not.toBe(b.ID);
  expect(a.ID).toMatch(/^[A-Z0-9_]{3,60}$/);
  expect(a.ATIVA).toBe("False");
  expect(a.TIPO).toBe("OFERTA");
  expect(a.__dirty).toBe("true");
  expect(
    VDV_BRIEFING_COLUMNS.every((column) => typeof a[column] === "string"),
  ).toBe(true);
});
const base: EmailStrategy = {
  id: "plan",
  campaignGroupId: "group",
  partner: "Afinz Visa",
  segment: "Pool de Ofertas Visa",
  weekKey: "Black Friday",
  secondaryBenefits: [],
  technicalStatus: "draft",
  editorialStatus: "draft",
  visualStatus: "draft",
  certificationStatus: "not_tested",
  fieldProvenance: {},
  version: 1,
  updatedByType: "system",
  updateSource: "system",
};
describe("Plano e criação por grupo do Pool", () => {
  it("distingue a edição da campanha de uma semana sem alterar Aquisição", () => {
    const [row] = createVdvEdition("BF26_V1", "Black Friday");
    const plan = { ...base, campaignGroupId: row.__meta.campaignGroupId };
    expect(strategyScope(plan, [row])).toEqual({
      kind: "campaign",
      label: "Black Friday",
      key: "BF26_V1",
    });
    const legacy = withMeta(emptyBriefingRow(), {
      partner: "Dia",
      campaignGroupId: "group",
      weekKey: "Semana 2",
    });
    expect(strategyScope({ ...base, weekKey: "Semana 2" }, [legacy])).toEqual({
      kind: "week",
      label: "Semana 2",
      key: "Semana 2",
    });
    expect(strategyFront(base)).toBe("acquisition");
    expect(strategyFront({ ...base, businessFront: "monetization" })).toBe(
      "monetization",
    );
  });
  it("lista apenas vitrines da versão e não confunde reservas com grupos", () => {
    expect(poolGroups(data.movimento, "BF26_V1")).toEqual([
      "FAMILIA_PRESENTES",
      "MODA",
      "SAUDE_BELEZA",
      "GENERICO",
    ]);
    expect(poolGroups(data.movimento, "NATAL26_V1")).toEqual([]);
  });
  it("compara envelope V2 com herança, hero e cards efetivamente resolvidos", () => {
    const [, row] = createVdvEdition("BF26_V1", "Black Friday");
    const pairs = poolComparison(
      base,
      row,
      data,
      VDV_SAMPLES[0].sample,
      "2026-11-05",
    );
    expect(pairs).toHaveLength(5);
    expect(pairs[0].executed).toContain("Ofertas");
    expect(pairs[2].executed).toContain("Puma");
    expect(pairs[3].executed).toContain("https://");
    expect(pairs[4].executed).toContain("institucional V2");
    const changed = {
      ...data,
      briefing: data.briefing.map((r) =>
        r.TIPO === "TEMA" ? { ...r, ASSUNTO_V2: "Envelope próprio" } : r,
      ),
    };
    expect(
      poolComparison(base, row, changed, VDV_SAMPLES[0].sample, "2026-11-05")[0]
        .executed,
    ).toBe("Envelope próprio");
  });
  it("SEG-B resolve genérico e vencimento remove as ofertas da comparação", () => {
    const [row] = createVdvEdition("BF26_V1", "Black Friday");
    const sample = { ...VDV_SAMPLES[0].sample, DS_CELULA_TESTE: "SEG-B" };
    const generic = poolComparison(base, row, data, sample, "2026-11-05");
    expect(generic[2].executed).toContain("Movida");
    expect(generic[2].executed).not.toContain("Decathlon");
    const expired = {
      ...data,
      briefing: data.briefing.map((r) =>
        r.TIPO === "OFERTA" ? { ...r, FIM: "2026-10-31" } : r,
      ),
    };
    expect(
      poolComparison(base, row, expired, sample, "2026-11-05")[3].executed,
    ).toBe("");
    expect(
      poolComparison(base, row, expired, sample, "2026-11-05")[4].executed,
    ).toContain("nenhuma oferta vigente");
  });
});
