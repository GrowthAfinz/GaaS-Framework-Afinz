import Papa from "papaparse";
import { z } from "zod";

export const VDV_BRIEFING_COLUMNS =
  "ID,TIPO,VERSAO,ATIVA,INICIO,FIM,MARCA,GRUPO,LOGO,FOTO,ALT,PREFIXO,VALOR,SUFIXO,COMPLEMENTO,COR,RESGATE,CUPOM,LINK,CONDICOES,HERO,HERO_IMG,HERO_ALT,HERO_LINK,NOME_CARTAO,TEMA,ASSUNTO,PREHEADER,ASSUNTO_V2,PREHEADER_V2,SAUDACAO,SAUDACAO_SEM_NOME,INTRO,CARTAO_PADRAO,CTA,TITULO_CONDICOES,RODAPE_CONDICOES,COR_FUNDO,COR_TEXTO,COR_TITULO,COR_TEMA".split(
    ",",
  );
export const VDV_MOVIMENTO_COLUMNS =
  "VERSAO,GRUPO,CELULA,POSICAO,OFERTA_ID,ATIVA".split(",");
export type VdvBriefingRow = Record<string, string>;
export type VdvMovimentoRow = Record<string, string>;
export type VdvSample = {
  FIRST_NAME: string;
  CD_GRUPO: string;
  DS_CELULA_TESTE: string;
  ID_VERSAO_OFERTAS: string;
  NM_PARCEIRO: string;
  NM_CARTAO: string;
};
export type VdvIssue = {
  table: "briefing" | "movimento";
  row: number;
  field: string;
  severity: "error" | "warning";
  message: string;
};
export type VdvPreview = {
  vars: Record<string, string>;
  diagnostics: string[];
  skipped: boolean;
  heroUsed: string;
  cellUsed: string;
  cards: { id: string; marca: string; position: number }[];
};
const active = (r: Record<string, string>) => r.ATIVA.toLowerCase() === "true";
const same = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
const proper = (s: string) =>
  s
    .toLocaleLowerCase("pt-BR")
    .replace(
      /(^|\s)(\S)/g,
      (_, a: string, b: string) => a + b.toLocaleUpperCase("pt-BR"),
    );
export const vdvToday = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
export const vdvValidOffer = (r: VdvBriefingRow, today: string) =>
  r.TIPO === "OFERTA" &&
  active(r) &&
  (!r.INICIO || r.INICIO <= today) &&
  (!r.FIM || today <= r.FIM) &&
  !!r.LINK.trim() &&
  !!r.VALOR.trim();
function parse(source: string, columns: string[]) {
  const result = Papa.parse<string[]>(source.replace(/^\uFEFF/, ""), {
    skipEmptyLines: true,
  });
  if (result.errors.length)
    throw new Error(result.errors.map((e) => e.message).join("; "));
  const [header, ...rows] = result.data;
  if (JSON.stringify(header) !== JSON.stringify(columns))
    throw new Error("Colunas CSV fora do contrato: " + columns.join(","));
  return rows.map((values, i) => {
    if (values.length !== columns.length)
      throw new Error(`Linha ${i + 2}: quantidade de colunas inválida.`);
    return Object.fromEntries(columns.map((c, k) => [c, values[k]]));
  });
}
function csv(rows: Record<string, string>[], columns: string[]) {
  return (
    Papa.unparse(
      {
        fields: columns,
        data: rows.map((r) =>
          columns.map((c) =>
            c === "ATIVA" ? (active(r) ? "True" : "False") : (r[c] ?? ""),
          ),
        ),
      },
      { newline: "\r\n", quotes: false },
    ) + "\r\n"
  );
}
export const parseVdvBriefingCsv = (s: string): VdvBriefingRow[] =>
  parse(s, VDV_BRIEFING_COLUMNS);
export const parseVdvMovimentoCsv = (s: string): VdvMovimentoRow[] =>
  parse(s, VDV_MOVIMENTO_COLUMNS);
export const exportVdvBriefingCsv = (r: VdvBriefingRow[]) =>
  csv(r, VDV_BRIEFING_COLUMNS);
export const exportVdvMovimentoCsv = (r: VdvMovimentoRow[]) =>
  csv(r, VDV_MOVIMENTO_COLUMNS);
const idSchema = z.string().regex(/^[A-Z0-9_]{3,60}$/);
const dateSchema = z.iso.date();
const urlSchema = z.url().refine((v) => v.startsWith("https://"));
export function validateVdv({
  briefing,
  movimento,
  today = vdvToday(),
}: {
  briefing: VdvBriefingRow[];
  movimento: VdvMovimentoRow[];
  today?: string;
}): VdvIssue[] {
  const issues: VdvIssue[] = [];
  const ids = new Set<string>();
  const themes = new Set<string>();
  const heroes = new Set<string>();
  const keys = new Set<string>();
  const add = (
    table: VdvIssue["table"],
    row: number,
    field: string,
    message: string,
    severity: VdvIssue["severity"] = "error",
  ) => issues.push({ table, row: row + 2, field, message, severity });
  briefing.forEach((r, i) => {
    const err = (f: string, m: string) => add("briefing", i, f, m);
    const warn = (f: string, m: string) => add("briefing", i, f, m, "warning");
    if (!idSchema.safeParse(r.ID).success) err("ID", "ID inválido.");
    if (ids.has(r.ID)) err("ID", "ID duplicado.");
    ids.add(r.ID);
    if (!["OFERTA", "TEMA", "HERO"].includes(r.TIPO))
      err("TIPO", "Tipo inválido.");
    if (!/^(true|false)$/i.test(r.ATIVA)) err("ATIVA", "Use True ou False.");
    for (const f of ["INICIO", "FIM"])
      if (r[f] && !dateSchema.safeParse(r[f]).success)
        err(f, "Data inválida; use AAAA-MM-DD.");
    if (r.INICIO && r.FIM && r.INICIO > r.FIM)
      err("FIM", "Fim anterior ao início.");
    for (const f of ["LOGO", "FOTO", "LINK", "HERO_IMG", "HERO_LINK"])
      if (r[f] && !urlSchema.safeParse(r[f]).success)
        err(f, "URL deve usar https://.");
    for (const f of ["COR", "COR_FUNDO", "COR_TEXTO", "COR_TITULO", "COR_TEMA"])
      if (r[f] && !/^#[0-9a-f]{6}$/i.test(r[f])) err(f, "Cor inválida.");
    const required =
      r.TIPO === "OFERTA"
        ? ["MARCA", "VALOR", "LINK", "RESGATE"]
        : r.TIPO === "TEMA"
          ? ["VERSAO", "TEMA", "ASSUNTO"]
          : ["VERSAO", "HERO", "HERO_IMG"];
    for (const f of required) if (!r[f]?.trim()) err(f, "Campo obrigatório.");
    if (r.TIPO === "OFERTA") {
      if (r.VERSAO) err("VERSAO", "Catálogo de ofertas não tem versão.");
      if (!["CUPOM", "PAGAR_COM_VISA", "LINK"].includes(r.RESGATE))
        err("RESGATE", "Resgate inválido.");
      if (r.RESGATE === "CUPOM" && !r.CUPOM.trim())
        err("CUPOM", "Cupom obrigatório.");
      for (const f of ["LOGO", "FOTO"])
        if (!r[f]) warn(f, `Falta ${f.toLowerCase()}.`);
      if (!active(r)) warn("ATIVA", "Oferta inativa.");
      if (
        r.FIM &&
        r.FIM >= today &&
        r.FIM <=
          new Date(new Date(today + "T12:00:00Z").getTime() + 7 * 86400000)
            .toISOString()
            .slice(0, 10)
      )
        warn("FIM", "Oferta vence em até 7 dias.");
    }
    if (r.TIPO === "TEMA" && active(r)) {
      if (themes.has(r.VERSAO))
        err("VERSAO", "Mais de um TEMA ativo por versão.");
      themes.add(r.VERSAO);
    }
    if (r.TIPO === "HERO") {
      const key = r.VERSAO + "|" + r.HERO.toUpperCase();
      if (heroes.has(key)) err("HERO", "HERO duplicado por versão.");
      heroes.add(key);
    }
    for (const f of [
      "ASSUNTO",
      "PREHEADER",
      "ASSUNTO_V2",
      "PREHEADER_V2",
      "INTRO",
      "SAUDACAO",
    ])
      for (const token of r[f]?.match(/\{[^}]+\}/g) ?? [])
        if (
          !(
            f === "SAUDACAO" ? ["{NOME}"] : ["{NOME}", "{TEMA}", "{CARTAO}"]
          ).includes(token)
        )
          warn(f, `Token desconhecido: ${token}.`);
  });
  movimento.forEach((r, i) => {
    const err = (f: string, m: string) => add("movimento", i, f, m);
    const key = [r.VERSAO, r.GRUPO, r.CELULA, r.POSICAO].join("|");
    for (const f of ["VERSAO", "GRUPO", "CELULA", "OFERTA_ID"])
      if (!r[f]?.trim()) err(f, "Campo obrigatório.");
    if (!/^[A-Z0-9_-]+$/.test(r.CELULA))
      err("CELULA", "Código de célula inválido.");
    if (!/^[1-6]$/.test(r.POSICAO)) err("POSICAO", "Posição entre 1 e 6.");
    if (!/^(true|false)$/i.test(r.ATIVA)) err("ATIVA", "Use True ou False.");
    if (keys.has(key)) err("POSICAO", "Chave de movimento duplicada.");
    keys.add(key);
    const offer = briefing.find(
      (b) => b.ID === r.OFERTA_ID && b.TIPO === "OFERTA",
    );
    if (!offer) err("OFERTA_ID", "Oferta não existe no catálogo.");
    else if (!vdvValidOffer(offer, today))
      add(
        "movimento",
        i,
        "OFERTA_ID",
        "Oferta inválida será pulada.",
        "warning",
      );
  });
  for (const version of new Set(
    briefing.filter((r) => r.TIPO !== "OFERTA").map((r) => r.VERSAO),
  )) {
    for (const hero of ["V1", "V2"])
      if (
        !briefing.some(
          (r) =>
            r.TIPO === "HERO" &&
            r.VERSAO === version &&
            r.HERO === hero &&
            active(r),
        )
      )
        add("briefing", 0, "HERO", `${version} sem hero ${hero}.`, "warning");
  }
  for (const key of new Set(
    movimento.map((r) => [r.VERSAO, r.GRUPO, r.CELULA].join("|")),
  )) {
    const rows = movimento.filter(
      (r) => [r.VERSAO, r.GRUPO, r.CELULA].join("|") === key && active(r),
    );
    const offers = rows
      .map((r) => briefing.find((b) => b.ID === r.OFERTA_ID))
      .filter((r): r is VdvBriefingRow => !!r && vdvValidOffer(r, today))
      .slice(0, 3);
    if (offers.length < 3)
      add(
        "movimento",
        0,
        "GRUPO",
        `${key}: ${offers.length}/3 ofertas válidas.`,
        "warning",
      );
    if (new Set(offers.map((r) => r.MARCA.toUpperCase())).size < offers.length)
      add("movimento", 0, "OFERTA_ID", `${key}: marca repetida.`, "warning");
  }
  return issues;
}
export function detectVdvTemplate(
  source: string,
): { versaoEmail: "V1" | "V2" } | null {
  return source.includes("@VDVInicializado")
    ? {
        versaoEmail: /SET\s+@VersaoEmail\s*=\s*"V2"/i.test(source)
          ? "V2"
          : "V1",
      }
    : null;
}
export function resolveVdvPreview({
  briefing,
  movimento,
  sample,
  versaoEmail,
  today,
}: {
  briefing: VdvBriefingRow[];
  movimento: VdvMovimentoRow[];
  sample: VdvSample;
  versaoEmail: "V1" | "V2";
  today: string;
}): VdvPreview {
  const vars: Record<string, string> = {};
  const result: VdvPreview = {
    vars,
    diagnostics: [],
    skipped: false,
    heroUsed: "Sem hero",
    cellUsed: "",
    cards: [],
  };
  const version = sample.ID_VERSAO_OFERTAS.trim() || "BF26_V1";
  const group =
    ["SEG-B", "GEN-A"].includes(sample.DS_CELULA_TESTE.trim()) ||
    !sample.CD_GRUPO.trim()
      ? "GENERICO"
      : sample.CD_GRUPO.trim();
  const fields =
    "VersaoEmail Versao GrupoVitrine NmTema Assunto PreHeader SaudacaoFinal Intro NomeCartao CtaCard TitCond RodCond LinkMaisOfertas CorFundo CorTexto CorTitulo CorTema Hero AltHero LinkHero N".split(
      " ",
    );
  fields.forEach((f) => (vars[f] = ""));
  const suffixes =
    "Marca Logo Foto Alt Pref Valor Suf Compl Cor Resg Cupom Url Nota Validade Alias".split(
      " ",
    );
  for (let k = 1; k <= 4; k++)
    suffixes.forEach((s) => (vars[`S${k}${s}`] = ""));
  Object.assign(vars, {
    VersaoEmail: versaoEmail,
    Versao: version,
    GrupoVitrine: group,
    N: "0",
  });
  const theme = briefing.find(
    (r) => r.TIPO === "TEMA" && same(r.VERSAO, version) && active(r),
  );
  if (!theme) {
    result.skipped = true;
    result.diagnostics.push(`VDV sem tema para a versão ${version}`);
    return result;
  }
  const partner = sample.NM_PARCEIRO.trim().toUpperCase();
  let hero = partner
    ? briefing.find(
        (r) =>
          r.TIPO === "HERO" &&
          same(r.VERSAO, version) &&
          same(r.HERO, partner) &&
          active(r),
      )
    : undefined;
  const partnerHero = !!hero;
  hero ??= briefing.find(
    (r) =>
      r.TIPO === "HERO" &&
      same(r.VERSAO, version) &&
      r.HERO === (partner ? "V2" : versaoEmail) &&
      active(r),
  );
  const name = proper(sample.FIRST_NAME.trim().split(" ")[0]);
  const card =
    (partnerHero && hero?.NOME_CARTAO) ||
    (sample.NM_CARTAO.trim()
      ? "cartão " + proper(sample.NM_CARTAO.trim())
      : theme.CARTAO_PADRAO || "cartão Afinz Visa");
  const tokens = (s: string, html = false) =>
    s
      .split("{CARTAO}")
      .join(card)
      .split("{TEMA}")
      .join(
        html
          ? `<b style="color:${theme.COR_TEMA || "#D3FF00"};">${theme.TEMA}</b>`
          : theme.TEMA,
      )
      .split("{NOME}")
      .join(name);
  Object.assign(vars, {
    NmTema: theme.TEMA,
    Assunto: tokens(
      (versaoEmail === "V2" && theme.ASSUNTO_V2) ||
        theme.ASSUNTO ||
        "Ofertas do seu {CARTAO}",
    ),
    PreHeader: tokens(
      (versaoEmail === "V2" && theme.PREHEADER_V2) || theme.PREHEADER,
    ),
    SaudacaoFinal:
      name && theme.SAUDACAO
        ? theme.SAUDACAO.split("{NOME}").join(name)
        : theme.SAUDACAO_SEM_NOME || "Olá!",
    Intro: tokens(theme.INTRO, true),
    NomeCartao: card,
    CtaCard: theme.CTA || "Aproveitar oferta",
    TitCond: theme.TITULO_CONDICOES || "Condições das ofertas",
    RodCond: theme.RODAPE_CONDICOES,
    LinkMaisOfertas: theme.LINK || "",
    CorFundo: theme.COR_FUNDO || "#000000",
    CorTexto: theme.COR_TEXTO || "#FFFFFF",
    CorTitulo: theme.COR_TITULO || "#00C6CC",
    CorTema: theme.COR_TEMA || "#D3FF00",
    Hero: hero?.HERO_IMG || "",
    AltHero: hero?.HERO_ALT || theme.TEMA,
    LinkHero: hero?.HERO_LINK || "",
  });
  result.heroUsed = hero
    ? partnerHero
      ? "parceiro " + hero.HERO
      : "institucional " + hero.HERO
    : "Sem hero";
  const select = (cell: string) =>
    movimento
      .filter(
        (r) =>
          same(r.VERSAO, version) &&
          same(r.GRUPO, group) &&
          same(r.CELULA, cell) &&
          active(r),
      )
      .sort((a, b) => Number(a.POSICAO) - Number(b.POSICAO))
      .slice(0, 6);
  let rows = select(sample.DS_CELULA_TESTE.trim());
  result.cellUsed = sample.DS_CELULA_TESTE.trim();
  if (!rows.length) {
    rows = select("TODAS");
    result.cellUsed = "TODAS";
  }
  for (const m of rows) {
    if (result.cards.length === 3) break;
    const offer = briefing.find(
      (r) => same(r.ID, m.OFERTA_ID) && vdvValidOffer(r, today),
    );
    if (!offer) continue;
    result.cards.push({
      id: offer.ID,
      marca: offer.MARCA,
      position: Number(m.POSICAO),
    });
    const k = result.cards.length;
    const map: Record<string, string> = {
      Marca: "MARCA",
      Logo: "LOGO",
      Foto: "FOTO",
      Alt: "ALT",
      Pref: "PREFIXO",
      Valor: "VALOR",
      Suf: "SUFIXO",
      Compl: "COMPLEMENTO",
      Cor: "COR",
      Resg: "RESGATE",
      Cupom: "CUPOM",
      Url: "LINK",
      Nota: "CONDICOES",
    };
    Object.entries(map).forEach(([s, f]) => (vars[`S${k}${s}`] = offer[f]));
    vars[`S${k}Alt`] ||= "Oferta " + offer.MARCA;
    vars[`S${k}Cor`] ||= "#00C6CC";
    vars[`S${k}Validade`] = offer.FIM
      ? offer.FIM.split("-").reverse().join("/")
      : "";
    vars[`S${k}Alias`] =
      `VDV_${version}_${versaoEmail}_${group}_P${k}_${offer.ID}`;
  }
  vars.N = String(result.cards.length);
  if (!result.cards.length) {
    result.skipped = true;
    result.diagnostics.push(
      `VDV: nenhuma oferta vigente em ${version} / ${group}`,
    );
  }
  return result;
}
export const VDV_SAMPLES: {
  label: string;
  sample: VdvSample;
  today?: string;
}[] = [
  {
    label: "Moda SEG-A · B2C",
    sample: {
      FIRST_NAME: "ANA EXEMPLO",
      CD_GRUPO: "MODA",
      DS_CELULA_TESTE: "SEG-A",
      ID_VERSAO_OFERTAS: "BF26_V1",
      NM_PARCEIRO: "",
      NM_CARTAO: "",
    },
  },
  {
    label: "Saúde e Beleza SEG-B",
    sample: {
      FIRST_NAME: "BRUNO EXEMPLO",
      CD_GRUPO: "SAUDE_BELEZA",
      DS_CELULA_TESTE: "SEG-B",
      ID_VERSAO_OFERTAS: "BF26_V1",
      NM_PARCEIRO: "",
      NM_CARTAO: "",
    },
  },
  {
    label: "Família · SIPOLATTI",
    sample: {
      FIRST_NAME: "CARLA EXEMPLO",
      CD_GRUPO: "FAMILIA_PRESENTES",
      DS_CELULA_TESTE: "SEG-A",
      ID_VERSAO_OFERTAS: "BF26_V1",
      NM_PARCEIRO: "SIPOLATTI",
      NM_CARTAO: "BASE FICTICIA",
    },
  },
  {
    label: "Parceiro sem hero",
    sample: {
      FIRST_NAME: "DAVI EXEMPLO",
      CD_GRUPO: "MODA",
      DS_CELULA_TESTE: "SEG-A",
      ID_VERSAO_OFERTAS: "BF26_V1",
      NM_PARCEIRO: "PARCEIRO FICTICIO",
      NM_CARTAO: "EXEMPLO VISA",
    },
  },
  {
    label: "GEN-A sem nome",
    sample: {
      FIRST_NAME: "",
      CD_GRUPO: "MODA",
      DS_CELULA_TESTE: "GEN-A",
      ID_VERSAO_OFERTAS: "BF26_V1",
      NM_PARCEIRO: "",
      NM_CARTAO: "",
    },
  },
  {
    label: "Ofertas vencidas",
    today: "2026-12-01",
    sample: {
      FIRST_NAME: "ELISA EXEMPLO",
      CD_GRUPO: "MODA",
      DS_CELULA_TESTE: "SEG-A",
      ID_VERSAO_OFERTAS: "BF26_V1",
      NM_PARCEIRO: "",
      NM_CARTAO: "",
    },
  },
];
