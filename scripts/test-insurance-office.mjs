import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { loadInsuranceRuntime } from "./insurance-export.mjs";
const directory = process.env.INSURANCE_FIXTURE_DIR;
const sheetNS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const readXml = (bytes) =>
  new DOMParser().parseFromString(bytes, "application/xml");
const formulas = (doc) =>
  Array.from(doc.getElementsByTagNameNS(sheetNS, "c"))
    .filter((c) => c.getElementsByTagNameNS(sheetNS, "f").length)
    .map((c) => {
      const f = c.getElementsByTagNameNS(sheetNS, "f")[0];
      return [
        c.getAttribute("r"),
        f.textContent,
        Array.from(f.attributes)
          .map((a) => [a.name, a.value])
          .sort(),
      ];
    });
test(
  "real templates preserve formulas, charts, media and workbook styles; exports repeat identically",
  { skip: !directory, timeout: 120000 },
  async () => {
    const { parser, office } = await loadInsuranceRuntime();
    const names = [
      "Performance_Geral_Seguros (1).xlsx",
      "Radar_Portfolio_Afinz_Comite_Gestao_2026 1.xlsx",
    ];
    const files = names.map(
      (name) => new File([readFileSync(join(directory, name))], name),
    );
    const packet = await parser.parseInsuranceFiles(files);
    assert.equal(packet.dispatches.length, 718);
    assert.equal(packet.coverage.tests, 2);
    assert.equal(packet.coverage.sheets, 21);
    for (let i = 0; i < files.length; i++) {
      const original = await files[i].arrayBuffer(),
        blob = await office.renderReferenceXlsx(
          original,
          packet,
          packet.sources[i],
        );
      const a = await JSZip.loadAsync(original),
        b = await JSZip.loadAsync(await blob.arrayBuffer());
      assert.deepEqual(
        Object.keys(a.files).sort(),
        Object.keys(b.files).sort(),
      );
      for (const name of Object.keys(a.files).filter((n) => !a.files[n].dir)) {
        if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
          assert.deepEqual(
            formulas(readXml(await a.file(name).async("string"))),
            formulas(readXml(await b.file(name).async("string"))),
            `formulas ${name}`,
          );
        } else if (name !== "xl/workbook.xml")
          assert.deepEqual(
            await a.file(name).async("uint8array"),
            await b.file(name).async("uint8array"),
            `preserved part ${name}`,
          );
      }
      const repeated = await office.renderReferenceXlsx(
        original,
        packet,
        packet.sources[i],
      );
      assert.deepEqual(
        Buffer.from(await blob.arrayBuffer()),
        Buffer.from(await repeated.arrayBuffer()),
      );
    }
    const pptx = readFileSync(
      join(directory, "Comite_Gestao_de_Portfolio_30102026.pptx"),
    );
    const a = await JSZip.loadAsync(pptx),
      blob = await office.renderReferencePptx(pptx, packet),
      b = await JSZip.loadAsync(await blob.arrayBuffer());
    assert.deepEqual(Object.keys(a.files).sort(), Object.keys(b.files).sort());
    for (const name of Object.keys(a.files).filter(
      (n) =>
        !a.files[n].dir &&
        !/^ppt\/slides\/slide(8|9)\.xml$/.test(n) &&
        !/^ppt\/charts\/chart[1-4]\.xml$/.test(n),
    ))
      assert.deepEqual(
        await a.file(name).async("uint8array"),
        await b.file(name).async("uint8array"),
        name,
      );
    const slide = await b.file("ppt/slides/slide9.xml").async("string");
    assert.ok(slide.includes("0,07%"));
    assert.ok(slide.includes("338"));
    const repeated = await office.renderReferencePptx(pptx, packet);
    assert.deepEqual(
      Buffer.from(await blob.arrayBuffer()),
      Buffer.from(await repeated.arrayBuffer()),
    );
  },
);
test(
  "export rejects template/source identity mismatches",
  { skip: !directory },
  async () => {
    const { parser, office } = await loadInsuranceRuntime();
    const file = new File(
      [readFileSync(join(directory, "Performance_Geral_Seguros (1).xlsx"))],
      "source.xlsx",
    );
    const packet = await parser.parseInsuranceFiles([file]);
    await assert.rejects(
      office.renderReferenceXlsx(await file.arrayBuffer(), packet, {
        ...packet.sources[0],
        sha256: "0".repeat(64),
      }),
      /SOURCE_HASH_MISMATCH/,
    );
  },
);
