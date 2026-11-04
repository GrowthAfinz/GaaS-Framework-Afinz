import JSZip from "jszip";
import {
  CellValue,
  InsurancePacket,
  METRICS,
  WorkbookSource,
} from "./insuranceCore";
import { sha256 } from "./insuranceParser";

const NS = {
  sheet: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  c: "http://schemas.openxmlformats.org/drawingml/2006/chart",
};
const parse = (text: string) => {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length)
    throw new Error("INVALID_OFFICE_XML");
  return doc;
};
const replacePart = (zip: JSZip, name: string, text: string) =>
  zip.file(name, text, {
    createFolders: false,
    date: zip.file(name)?.date || new Date("2000-01-01T00:00:00Z"),
  });
const xml = (doc: Document) => new XMLSerializer().serializeToString(doc);
const children = (node: Element | Document, ns: string, name: string) =>
  Array.from(node.getElementsByTagNameNS(ns, name));
const valueText = (v: number | null, percent = false) =>
  v === null
    ? "n.d."
    : v.toLocaleString("pt-BR", {
        maximumFractionDigits: percent ? 1 : 0,
        minimumFractionDigits: percent ? 1 : 0,
      });
export async function inspectReferencePptx(bytes: ArrayBuffer) {
  const zip = await JSZip.loadAsync(bytes),
    result: { key: string; slide: number; text: string }[] = [];
  for (const part of Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort(
      (a, b) =>
        Number(a.match(/slide(\d+)/)![1]) - Number(b.match(/slide(\d+)/)![1]),
    )) {
    const doc = parse(await zip.file(part)!.async("string"));
    for (const shape of children(doc, NS.p, "sp")) {
      const id = children(shape, NS.p, "cNvPr")[0]?.getAttribute("id"),
        text = children(shape, NS.a, "t")
          .map((t) => t.textContent || "")
          .join("");
      if (id && text)
        result.push({
          key: part + "#" + id,
          slide: Number(part.match(/slide(\d+)/)![1]),
          text,
        });
    }
  }
  return result;
}

export function snapshotCells(
  packet: InsurancePacket,
): WorkbookSource["sheets"] {
  const source = packet.sources.find((s) => s.sheets["Resumo Comitê"]);
  if (!source) throw new Error("INSURANCE_SOURCE_MISSING");
  const sheets = structuredClone(source.sheets);
  for (const metric of packet.metrics) {
    const base = Number(
      Object.keys(METRICS).find((r) => METRICS[Number(r)][0] === metric.code),
    );
    if (!base) continue;
    const col =
      metric.period === "window_total"
        ? "K"
        : ["D", "E", "F", "G", "H", "I", "J"].find((c) =>
            String(sheets["Resumo Comitê"][c + "5"]?.value).startsWith(
              metric.period,
            ),
          );
    if (!col) continue;
    const address = col + (base + (metric.product === "residencial" ? 30 : 0));
    const old = sheets["Resumo Comitê"][address];
    sheets["Resumo Comitê"][address] = {
      ...old,
      value:
        metric.value === null && typeof old?.value === "string"
          ? old.value
          : metric.value,
    };
  }
  const summary = sheets["Resumo Comitê"];
  for (const [product, offset] of [
    ["mulher", 0],
    ["residencial", 9],
  ] as const)
    for (const col of ["D", "E", "F", "G", "H", "I", "J", "K"]) {
      const period =
        col === "K"
          ? "window_total"
          : String(summary[col + "5"]?.value).slice(0, 7);
      const find = (code: string) =>
        packet.metrics.find(
          (m) =>
            m.product === product && m.period === period && m.code === code,
        )?.value ?? null;
      [
        "source_activated_count",
        "contracts_per_activated",
        "sessions",
        "registrations_per_session",
        "registrations_digital",
        "contracts_per_registration_digital",
        "contracts_digital",
      ].forEach((code, i) => {
        const key = col + (114 + offset + i),
          old = summary[key],
          v = find(code);
        summary[key] = {
          ...old,
          value: v === null && typeof old?.value === "string" ? old.value : v,
        };
      });
      const row = product === "mulher" ? 102 : 107,
        digital = find("contracts_digital"),
        total = find("company_new_sales");
      for (const [r, v] of [
        [row, digital],
        [row + 1, digital === null || total === null ? null : total - digital],
        [row + 2, find("digital_sales_share")],
      ] as const)
        summary[col + r] = { ...summary[col + r], value: v };
    }
  return sheets;
}

/** Edit OOXML parts in place, preserving unsupported Excel extensions and original formulas. */
export async function renderReferenceXlsx(
  template: ArrayBuffer,
  packet: InsurancePacket,
  source: WorkbookSource,
): Promise<Blob> {
  if ((await sha256(template)) !== source.sha256)
    throw new Error("SOURCE_HASH_MISMATCH");
  const zip = await JSZip.loadAsync(template);
  const workbook = parse(await zip.file("xl/workbook.xml")!.async("string"));
  const date1904 = ["1", "true"].includes(
    children(workbook, NS.sheet, "workbookPr")[0]?.getAttribute("date1904") ||
      "",
  );
  const rels = parse(
    await zip.file("xl/_rels/workbook.xml.rels")!.async("string"),
  );
  const relMap = new Map(
    Array.from(rels.documentElement.childNodes)
      .filter((n): n is Element => n.nodeType === 1)
      .map((e) => [e.getAttribute("Id"), e.getAttribute("Target")!]),
  );
  const values = source.sheets["Resumo Comitê"]
    ? snapshotCells(packet)
    : source.sheets;
  for (const s of children(workbook, NS.sheet, "sheet")) {
    const name = s.getAttribute("name")!;
    if (!values[name])
      throw new Error(`TEMPLATE_VERSION_MISMATCH: aba ${name}`);
    const rid = s.getAttribute("r:id");
    const target = relMap.get(rid)!;
    const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
    const part = zip.file(path);
    if (!part) throw new Error("MISSING_WORKSHEET_PART");
    const doc = parse(await part.async("string"));
    const existing = new Map(
      children(doc, NS.sheet, "c").map((c) => [c.getAttribute("r")!, c]),
    );
    for (const [address, cell] of Object.entries(values[name])) {
      const c = existing.get(address);
      if (!c) throw new Error(`TEMPLATE_VERSION_MISMATCH: ${name}!${address}`);
      const originalFormula = children(c, NS.sheet, "f")[0];
      // Shared/array formulas may be expanded by the reader. The exact source hash above validates identity; original <f> nodes are never rewritten.

      for (const child of Array.from(c.childNodes) as Element[])
        if (child.localName === "v" || child.localName === "is")
          c.removeChild(child);
      let v = cell.value;
      if (
        cell.data_type === "d" &&
        typeof v === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(v)
      )
        v =
          Date.parse(v + "T00:00:00Z") / 86400000 +
          25569 -
          (date1904 ? 1462 : 0);
      if (v === null) {
        c.removeAttribute("t");
        continue;
      }
      if (cell.data_type === "e") {
        c.setAttribute("t", "e");
        const value = doc.createElementNS(NS.sheet, "v");
        value.textContent = String(v);
        c.appendChild(value);
      } else if (typeof v === "string" && originalFormula) {
        c.setAttribute("t", "str");
        const value = doc.createElementNS(NS.sheet, "v");
        value.textContent = v;
        c.appendChild(value);
      } else if (typeof v === "string") {
        c.setAttribute("t", "inlineStr");
        const is = doc.createElementNS(NS.sheet, "is");
        const text = doc.createElementNS(NS.sheet, "t");
        text.textContent = v;
        is.appendChild(text);
        c.appendChild(is);
      } else {
        if (typeof v === "boolean") c.setAttribute("t", "b");
        else c.removeAttribute("t");
        const value = doc.createElementNS(NS.sheet, "v");
        value.textContent = String(typeof v === "boolean" ? Number(v) : v);
        c.appendChild(value);
      }
    }
    replacePart(zip, path, xml(doc));
  }
  const calc = children(workbook, NS.sheet, "calcPr")[0];
  if (calc) {
    calc.setAttribute("fullCalcOnLoad", "1");
    calc.setAttribute("forceFullCalc", "1");
  }
  replacePart(zip, "xl/workbook.xml", xml(workbook));
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function rangeValues(
  formula: string,
  sheets: WorkbookSource["sheets"],
): CellValue[] | null {
  const match = formula.match(
    /^'?([^']+?)'?!(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?$/,
  );
  if (!match || !sheets[match[1]]) return null;
  const start = match[2].replace(/\$/g, ""),
    end = (match[3] || match[2]).replace(/\$/g, "");
  const a = start.match(/^([A-Z]+)(\d+)$/)!,
    b = end.match(/^([A-Z]+)(\d+)$/)!;
  const index = (s: string) =>
    [...s].reduce((v, c) => v * 26 + c.charCodeAt(0) - 64, 0);
  const column = (n: number) => {
    let s = "";
    for (; n > 0; n = Math.floor((n - 1) / 26))
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  };
  const result: CellValue[] = [];
  for (let r = Number(a[2]); r <= Number(b[2]); r++)
    for (let c = index(a[1]); c <= index(b[1]); c++)
      result.push(sheets[match[1]][column(c) + r]?.value ?? null);
  return result;
}

export async function renderReferencePptx(
  template: ArrayBuffer,
  packet: InsurancePacket,
): Promise<Blob> {
  const zip = await JSZip.loadAsync(template),
    sheets = snapshotCells(packet);
  if (
    Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .length !== 21
  )
    throw new Error(
      "TEMPLATE_VERSION_MISMATCH: utilize o comitê de 30/10, com 21 slides.",
    );
  const metric = (product: string, code: string) =>
    packet.metrics.find(
      (m) =>
        m.product === product && m.code === code && m.period === "window_total",
    )?.value ?? null;
  for (const slide of [8, 9, 10])
    if (!zip.file(`ppt/slides/slide${slide}.xml`))
      throw new Error("TEMPLATE_VERSION_MISMATCH");
  const doc = parse(await zip.file("ppt/slides/slide8.xml")!.async("string"));
  for (const [shape, product, code, pct] of [
    [32, "mulher", "digital_sales_share", true],
    [33, "mulher", "cost_per_registration", false],
    [34, "mulher", "cost_per_contract", false],
    [42, "residencial", "digital_sales_share", true],
    [43, "residencial", "cost_per_registration", false],
    [44, "residencial", "cost_per_contract", false],
  ] as const) {
    const node = children(doc, NS.p, "sp").find(
      (s) =>
        children(s, NS.p, "cNvPr")[0]?.getAttribute("id") === String(shape),
    );
    const first = node && children(node, NS.a, "t")[0];
    if (!first) throw new Error(`TEMPLATE_SHAPE_MISSING:${shape}`);
    const n = metric(product, code);
    first.textContent =
      n === null
        ? "n.d."
        : pct
          ? valueText(n * 100, true) + "%"
          : "R$" + valueText(n);
  }
  replacePart(zip, "ppt/slides/slide8.xml", xml(doc));
  const tableDoc = parse(
    await zip.file("ppt/slides/slide9.xml")!.async("string"),
  );
  const frame = children(tableDoc, NS.p, "graphicFrame").find(
    (s) => children(s, NS.p, "cNvPr")[0]?.getAttribute("id") === "60",
  );
  const rows = frame && children(frame, NS.a, "tr");
  if (!rows || rows.length !== 16) throw new Error("TEMPLATE_TABLE_MISMATCH");
  for (const header of [0, 8])
    for (const [j, col] of ["D", "E", "F", "G", "H", "I", "J"].entries()) {
      const cell = children(rows[header], NS.a, "tc")[j + 1],
        runs = children(cell, NS.a, "t"),
        raw = String(sheets["Resumo Comitê"][col + "5"]?.value);
      if (runs[0]) {
        const month = new Intl.DateTimeFormat("pt-BR", {
          month: "short",
          timeZone: "UTC",
        })
          .format(new Date(raw + "T00:00:00Z"))
          .replace(/\./g, "");
        runs[0].textContent = month + "/" + raw.slice(2, 4);
        for (const run of runs.slice(1)) run.textContent = "";
      }
    }
  for (const [offset, tableOffset] of [
    [0, 0],
    [9, 8],
  ])
    for (let i = 0; i < 7; i++) {
      const cells = children(rows[tableOffset + i + 1], NS.a, "tc");
      for (const [j, col] of [
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
      ].entries()) {
        const value = sheets["Resumo Comitê"][col + (114 + offset + i)]?.value;
        const texts = children(cells[j + 1], NS.a, "t");
        if (!texts.length) throw new Error("TEMPLATE_TABLE_CELL_MISSING");
        texts[0].textContent =
          typeof value === "number"
            ? i === 1
              ? (value * 100).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) + "%"
              : [3, 5].includes(i)
                ? valueText(value * 100, true) + "%"
                : valueText(value)
            : value == null
              ? "n.d."
              : String(value);
        for (const text of texts.slice(1)) text.textContent = "";
      }
    }
  replacePart(zip, "ppt/slides/slide9.xml", xml(tableDoc));
  // Keep native chart objects and refresh caches from their original workbook references.
  for (const name of Object.keys(zip.files).filter((n) =>
    /^ppt\/charts\/chart\d+\.xml$/.test(n),
  )) {
    const chart = parse(await zip.file(name)!.async("string"));
    let changed = false;
    for (const ref of [
      ...children(chart, NS.c, "numRef"),
      ...children(chart, NS.c, "strRef"),
    ]) {
      const f = children(ref, NS.c, "f")[0]?.textContent;
      if (!f) continue;
      const values = rangeValues(f, sheets);
      if (!values) continue;
      const cache =
        children(ref, NS.c, "numCache")[0] ||
        children(ref, NS.c, "strCache")[0];
      if (!cache) continue;
      const numeric = cache.localName === "numCache";
      for (const pt of children(cache, NS.c, "pt")) cache.removeChild(pt);
      let count = children(cache, NS.c, "ptCount")[0];
      if (!count) {
        count = chart.createElementNS(NS.c, "c:ptCount");
        cache.appendChild(count);
      }
      count.setAttribute("val", String(values.length));
      values.forEach((v, i) => {
        if (v === null || (numeric && typeof v !== "number")) return;
        const pt = chart.createElementNS(NS.c, "c:pt"),
          value = chart.createElementNS(NS.c, "c:v");
        pt.setAttribute("idx", String(i));
        value.textContent = String(v);
        pt.appendChild(value);
        cache.appendChild(pt);
      });
      changed = true;
    }
    if (["ppt/charts/chart1.xml", "ppt/charts/chart2.xml"].includes(name)) {
      const product = name.endsWith("chart1.xml") ? "mulher" : "residencial";
      for (const series of children(chart, NS.c, "ser"))
        if (
          children(series, NS.c, "tx").some((tx) =>
            tx.textContent?.includes("Share digital"),
          )
        ) {
          for (const label of children(series, NS.c, "dLbl")) {
            const idx = Number(
              children(label, NS.c, "idx")[0]?.getAttribute("val"),
            );
            const month = ["D", "E", "F", "G", "H", "I", "J"][idx];
            const period = String(
              sheets["Resumo Comitê"][month + "5"]?.value,
            ).slice(0, 7);
            const value =
              packet.metrics.find(
                (m) =>
                  m.product === product &&
                  m.code === "digital_sales_share" &&
                  m.period === period,
              )?.value ?? null;
            const runs = children(label, NS.a, "t");
            if (runs[0]) {
              runs[0].textContent =
                value === null ? "n.d." : valueText(value * 100, true) + "%";
              for (const run of runs.slice(1)) run.textContent = "";
              changed = true;
            }
          }
        }
    }
    if (changed) replacePart(zip, name, xml(chart));
  }
  // Narrative is intentionally explicit: a data update must not silently retain an old conclusion.
  for (const [locator, text] of Object.entries(packet.editorial)) {
    const [part, id] = locator.split("#");
    const entry = zip.file(part);
    if (!entry || !/^ppt\/slides\/slide\d+\.xml$/.test(part))
      throw new Error("INVALID_EDITORIAL_TARGET");
    const page = parse(await entry.async("string"));
    const shape = children(page, NS.p, "sp").find(
      (s) => children(s, NS.p, "cNvPr")[0]?.getAttribute("id") === id,
    );
    if (!shape) throw new Error("EDITORIAL_SHAPE_MISSING");
    const runs = children(shape, NS.a, "t");
    if (!runs.length) throw new Error("EDITORIAL_TEXT_MISSING");
    runs[0].textContent = text;
    for (const run of runs.slice(1)) run.textContent = "";
    replacePart(zip, part, xml(page));
  }
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
    mimeType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

export async function createReviewPackage(
  packet: InsurancePacket,
  files: File[],
  pptx?: File,
  identity: { snapshot_id?: string; snapshot_hash?: string } = {},
): Promise<Blob> {
  const zip = new JSZip(),
    artifacts: Record<string, string> = {};
  const byHash = new Map(
    await Promise.all(
      files.map(
        async (file) => [await sha256(await file.arrayBuffer()), file] as const,
      ),
    ),
  );
  for (const source of packet.sources) {
    const file = byHash.get(source.sha256);
    if (!file) throw new Error("SOURCE_FILE_REQUIRED_FOR_EXPORT");
    const bytes = await file.arrayBuffer();
    const blob = await renderReferenceXlsx(bytes, packet, source);
    const data = await blob.arrayBuffer();
    zip.file(source.name, data, { date: new Date("2000-01-01T00:00:00Z") });
    artifacts[source.name] = await sha256(data);
  }
  if (pptx) {
    const blob = await renderReferencePptx(await pptx.arrayBuffer(), packet);
    const data = await blob.arrayBuffer();
    zip.file(pptx.name, data, { date: new Date("2000-01-01T00:00:00Z") });
    artifacts[pptx.name] = await sha256(data);
  }
  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        version: "insurance-package/1",
        status: "review_required",
        ...identity,
        sourceHashes: packet.sources.map((s) => s.sha256),
        artifacts,
        limitations: packet.issues,
        packet,
      },
      null,
      2,
    ),
    { date: new Date("2000-01-01T00:00:00Z") },
  );
  return zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}
