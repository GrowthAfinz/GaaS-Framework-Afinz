import { describe, it, expect } from "vitest";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { VDV_BRIEFING_CSV, VDV_MOVIMENTO_CSV } from "../fixtures/vdvBF26V1.csv";
import {
  VDV_V1_TEMPLATE,
  VDV_V2_TEMPLATE,
} from "../fixtures/vaiDeVisaV5Template";
import {
  parseVdvBriefingCsv,
  parseVdvMovimentoCsv,
  exportVdvBriefingCsv,
  exportVdvMovimentoCsv,
  validateVdv,
  resolveVdvPreview,
  VDV_SAMPLES,
  detectVdvTemplate,
} from "./vaiDeVisa";
import { emptyBriefingRow } from "./briefing";
import { renderDynamicEmail } from "../ampscript/renderer";
import { vdvEnvelope } from "./sfmcEnvelope";
import { prepareSfmcExport } from "./sfmcExport";
const briefing = () => parseVdvBriefingCsv(VDV_BRIEFING_CSV);
const movimento = () => parseVdvMovimentoCsv(VDV_MOVIMENTO_CSV);
const resolve = (
  b = briefing(),
  m = movimento(),
  sample = VDV_SAMPLES[0].sample,
  touch: "V1" | "V2" = "V1",
) =>
  resolveVdvPreview({
    briefing: b,
    movimento: m,
    sample,
    versaoEmail: touch,
    today: "2026-11-05",
  });
const render = (source: string, vars: Record<string, string>) =>
  renderDynamicEmail(
    source,
    emptyBriefingRow(),
    {
      CPF: "00000000000",
      PRI_NOME: "ANA",
      LIMITE: "",
      PRODUTO: "",
      SEQUENCIA: "",
      TP_CAMPANHA: "",
    },
    { vars },
  );
describe("Vai de Visa · até 3 ofertas", () => {
  it("importa 89 + 16 linhas, sem erros de contrato", () => {
    expect(briefing()).toHaveLength(89);
    expect(movimento()).toHaveLength(16);
    expect(
      validateVdv({
        briefing: briefing(),
        movimento: movimento(),
        today: "2026-11-05",
      }).filter((x) => x.severity === "error"),
    ).toEqual([]);
  });
  it("CSV preserva emoji, acento, conteúdo e ordem", () => {
    for (const [s, parse, exp] of [
      [VDV_BRIEFING_CSV, parseVdvBriefingCsv, exportVdvBriefingCsv],
      [VDV_MOVIMENTO_CSV, parseVdvMovimentoCsv, exportVdvMovimentoCsv],
    ] as const) {
      expect(exp(parse(s)).replace(/\r\n/g, "\n").trimEnd()).toBe(
        s.replace(/\r\n/g, "\n").trimEnd(),
      );
    }
    expect(exportVdvBriefingCsv(briefing())).toContain("💳💙");
  });
  for (const [touch, source] of [
    ["V1", VDV_V1_TEMPLATE],
    ["V2", VDV_V2_TEMPLATE],
  ] as const)
    for (const [i, s] of VDV_SAMPLES.entries())
      it(`${touch}: ${s.label}`, () => {
        const p = resolveVdvPreview({
          briefing: briefing(),
          movimento: movimento(),
          sample: s.sample,
          versaoEmail: touch,
          today: s.today ?? "2026-11-05",
        });
        expect(p.skipped).toBe(i === 5);
        if (p.skipped) {
          expect(p.diagnostics.length).toBeGreaterThan(0);
          return;
        }
        const r = render(source, p.vars);
        expect(r.diagnostics).toEqual([]);
        expect(r.html).not.toContain("%%");
        expect(p.cards).toHaveLength(3);
        if (i === 0)
          expect(p.cards.map((c) => c.id)).toEqual([
            "NOV26_PUMA",
            "NOV26_RIACHUELO",
            "NOV26_DECATHLON",
          ]);
        if (i === 1)
          expect(p.cards.map((c) => c.id)).toEqual([
            "NOV26_MOVIDA",
            "NOV26_ALURA",
            "NOV26_OCEANE",
          ]);
        if (i === 2)
          expect(p.vars.Hero).toBe(
            briefing().find((b) => b.HERO === "SIPOLATTI")!.HERO_IMG,
          );
        if (i === 3)
          expect(p.vars.Hero).toBe(
            briefing().find((b) => b.HERO === "V2")!.HERO_IMG,
          );
        mkdirSync("artifacts/vai-de-visa/previews", { recursive: true });
        writeFileSync(
          `artifacts/vai-de-visa/previews/${touch}-sample-${i + 1}.html`,
          r.html,
        );
      });
  it("pula oferta vencida e usa a reserva da posição 5", () => {
    const b = briefing();
    b.find((r) => r.ID === "NOV26_RIACHUELO")!.FIM = "2026-11-04";
    const m = movimento();
    m.push({ ...m[0], POSICAO: "5", OFERTA_ID: "NOV26_ALURA" });
    b.find((r) => r.ID === "NOV26_DECATHLON")!.ATIVA = "False";
    const p = resolve(b, m);
    expect(p.cards.map((c) => c.position)).toEqual([1, 4, 5]);
  });
  it("célula específica precede TODAS e inválidas não acionam outro fallback", () => {
    const m = movimento();
    m.push({ ...m[0], CELULA: "SEG-A", OFERTA_ID: "NOV26_ALURA" });
    expect(resolve(briefing(), m).cards.map((c) => c.id)).toEqual([
      "NOV26_ALURA",
    ]);
    const b = briefing();
    b.find((r) => r.ID === "NOV26_ALURA")!.ATIVA = "False";
    expect(resolve(b, m).skipped).toBe(true);
  });
  it("nome do cartão respeita as três prioridades; V2 resolve assunto e pré-cabeçalho", () => {
    const b = briefing();
    const sample = { ...VDV_SAMPLES[2].sample };
    const hero = b.find((r) => r.HERO === "SIPOLATTI")!;
    hero.NOME_CARTAO = "cartão parceiro";
    expect(resolve(b, movimento(), sample).vars.NomeCartao).toBe(
      "cartão parceiro",
    );
    hero.NOME_CARTAO = "";
    expect(resolve(b, movimento(), sample).vars.NomeCartao).toBe(
      "cartão Base Ficticia",
    );
    sample.NM_CARTAO = "";
    expect(resolve(b, movimento(), sample).vars.NomeCartao).toBe(
      "cartão Afinz Visa",
    );
    const t = b.find((r) => r.TIPO === "TEMA")!;
    t.ASSUNTO_V2 = "Oi {NOME}";
    t.PREHEADER_V2 = "Seu {CARTAO}";
    expect(resolve(b, movimento(), sample, "V2").vars.Assunto).toBe("Oi Carla");
    expect(resolve(b, movimento(), sample, "V2").vars.PreHeader).toBe(
      "Seu cartão Afinz Visa",
    );
  });
  it("renders resgates, logo vazio, 1/2/3 cards e mobile em coluna", () => {
    const b = briefing();
    const offer = b.find((r) => r.ID === "NOV26_PUMA")!;
    offer.RESGATE = "PAGAR_COM_VISA";
    offer.LOGO = "";
    for (const n of [1, 2, 3]) {
      const p = resolve(
        b,
        movimento().filter((r) => r.GRUPO !== "MODA" || +r.POSICAO <= n),
      );
      const r = render(VDV_V1_TEMPLATE, p.vars);
      expect(r.diagnostics).toEqual([]);
      expect(r.html).toContain("Pague com Visa");
      expect(r.html).toContain("Puma");
      expect(r.html).toContain(
        ".vdv-card { display:block !important; width:100% !important;",
      );
      expect(p.vars.N).toBe(String(n));
    }
  });
  it("detecta fonte, deriva envelope e mantém AMPscript exportável sem ELSEIF", () => {
    for (const [source, touch] of [
      [VDV_V1_TEMPLATE, "V1"],
      [VDV_V2_TEMPLATE, "V2"],
    ] as const) {
      expect(detectVdvTemplate(source)?.versaoEmail).toBe(touch);
      expect(source).not.toMatch(/\bELSEIF\b|RedirectTo\(@/i);
      expect(source).toContain("IF @N < 3 THEN");
      expect(vdvEnvelope(source)?.preheader).toBe(
        source.match(/^(%%\[[\s\S]*?\]%%)/)![1] +
          "%%=TreatAsContent(@PreHeader)=%%",
      );
    }
  });
  it("bloqueia CSV de aquisição para slots VDV", () => {
    const row = Object.assign(emptyBriefingRow(), {
      __meta: { templateSlotId: "builtin-vdv-v1" },
    });
    expect(() =>
      prepareSfmcExport([row], {
        campaignType: "",
        requireDynamicHeader: false,
      }),
    ).toThrow("E-mail Vai de Visa");
  });
  const cases: [string, string, string][] = [
    ["ID", "a", "ID"],
    ["TIPO", "INVALIDO", "TIPO"],
    ["ATIVA", "", "ATIVA"],
    ["INICIO", "2026-02-30", "INICIO"],
    ["LINK", "http://x.com", "LINK"],
    ["COR", "#ZZZZZZ", "COR"],
    ["MARCA", "", "MARCA"],
    ["VALOR", "", "VALOR"],
    ["RESGATE", "INVALIDO", "RESGATE"],
    ["VERSAO", "BF", "VERSAO"],
  ];
  for (const [field, value, expected] of cases)
    it(`valida ${field}`, () => {
      const b = briefing();
      b.find((r) => r.TIPO === "OFERTA")![field] = value;
      expect(
        validateVdv({ briefing: b, movimento: movimento() }).some(
          (i) => i.field === expected && i.severity === "error",
        ),
      ).toBe(true);
    });
  it("valida datas invertidas, cupom, tema/hero duplicados e PK/referência do movimento", () => {
    const b = briefing();
    const o = b.find((r) => r.TIPO === "OFERTA")!;
    o.INICIO = "2026-12-01";
    o.FIM = "2026-11-01";
    o.RESGATE = "CUPOM";
    o.CUPOM = "";
    b.push({ ...b[0], ID: "TEMA_DUPLICADO" });
    b.push({ ...b.find((r) => r.TIPO === "HERO")!, ID: "HERO_DUPLICADO" });
    const m = movimento();
    m.push({ ...m[0] });
    m[1].POSICAO = "7";
    m[2].OFERTA_ID = "INEXISTENTE";
    const issues = validateVdv({ briefing: b, movimento: m });
    for (const f of ["FIM", "CUPOM", "VERSAO", "HERO", "POSICAO", "OFERTA_ID"])
      expect(issues.some((i) => i.field === f && i.severity === "error")).toBe(
        true,
      );
  });
});

describe("Contrato complementar VDV", () => {
  it("valida campos dos tipos, ID duplicado, headers e referências inválidas", () => {
    for (const [type, field] of [
      ["TEMA", "VERSAO"],
      ["TEMA", "TEMA"],
      ["TEMA", "ASSUNTO"],
      ["HERO", "VERSAO"],
      ["HERO", "HERO"],
      ["HERO", "HERO_IMG"],
    ] as const) {
      const b = briefing();
      b.find((r) => r.TIPO === type)![field] = "";
      expect(
        validateVdv({ briefing: b, movimento: movimento() }).some(
          (i) => i.field === field && i.severity === "error",
        ),
      ).toBe(true);
    }
    const b = briefing();
    b.push({ ...b[0] });
    expect(
      validateVdv({ briefing: b, movimento: movimento() }).some(
        (i) => i.field === "ID" && i.severity === "error",
      ),
    ).toBe(true);
    expect(() => parseVdvMovimentoCsv("VERSAO,ATIVA\nBF26_V1,True")).toThrow(
      "Colunas",
    );
    const m = movimento();
    m[0].CELULA = "célula inválida";
    expect(
      validateVdv({ briefing: briefing(), movimento: m }).some(
        (i) => i.field === "CELULA" && i.severity === "error",
      ),
    ).toBe(true);
  });
  it("avisos não bloqueiam salvar; inclui prontidão, tokens e vencimento", () => {
    const b = briefing();
    const t = b.find((r) => r.TIPO === "TEMA")!;
    t.INTRO = "{XYZ}";
    const o = b.find((r) => r.ID === "NOV26_PUMA")!;
    o.FIM = "2026-11-10";
    o.LOGO = "";
    b.find((r) => r.ID === "NOV26_RIACHUELO")!.MARCA = o.MARCA;
    const issues = validateVdv({
      briefing: b,
      movimento: movimento(),
      today: "2026-11-05",
    });
    expect(issues.filter((i) => i.severity === "error")).toEqual([]);
    for (const text of [
      "Token desconhecido",
      "7 dias",
      "marca repetida",
      "Falta logo",
    ])
      expect(issues.some((i) => i.message.includes(text))).toBe(true);
  });
  it("vars contém exatamente o contrato, inclusive slot 4 vazio", () => {
    const p = resolve();
    const names =
      "VersaoEmail Versao GrupoVitrine NmTema Assunto PreHeader SaudacaoFinal Intro NomeCartao CtaCard TitCond RodCond LinkMaisOfertas AvisoLegal CorFundo CorTexto CorTitulo CorTema Hero AltHero LinkHero N".split(
        " ",
      );
    for (let k = 1; k <= 4; k++)
      for (const s of "Marca Logo Foto Alt Pref Valor Suf Compl Cor Resg Cupom Url Nota Validade Alias".split(
        " ",
      ))
        names.push(`S${k}${s}`);
    expect(Object.keys(p.vars).sort()).toEqual(names.sort());
    expect(p.vars.S4Marca).toBe("");
  });
  it("fontes da migration coincidem com os fixtures e {NOME} funciona na abertura", () => {
    const sql = readFileSync(
      "supabase/migrations/20261105211607_dynamic_email_vai_de_visa.sql",
      "utf8",
    );
    expect(sql.replace(/\r\n/g,"\n").split("$vdv$")[1]).toBe(VDV_V1_TEMPLATE);
    expect(sql.replace(/\r\n/g,"\n").split("$vdv$")[3]).toBe(VDV_V2_TEMPLATE);
    const b = briefing();
    b[0].INTRO = "Oi {NOME}, {CARTAO}";
    expect(resolve(b).vars.Intro).toBe("Oi Ana, cartão Afinz Visa");
    expect(VDV_V1_TEMPLATE).toContain('"{NOME}", @FirstName)');
  });
});
