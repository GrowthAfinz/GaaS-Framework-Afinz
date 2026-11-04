// Local renderer: no network, database, credentials or publication.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve, basename } from "node:path";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

export async function loadInsuranceRuntime() {
  globalThis.DOMParser = DOMParser;
  globalThis.XMLSerializer = XMLSerializer;
  mkdirSync("node_modules/.cache", { recursive: true });
  for (const name of ["insuranceParser", "insuranceOffice"])
    await build({
      entryPoints: [`src/components/insurance/${name}.ts`],
      bundle: true,
      platform: "node",
      format: "esm",
      packages: "external",
      outfile: `node_modules/.cache/${name}.mjs`,
    });
  return {
    parser: await import(
      pathToFileURL(resolve("node_modules/.cache/insuranceParser.mjs"))
    ),
    office: await import(
      pathToFileURL(resolve("node_modules/.cache/insuranceOffice.mjs"))
    ),
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve("scripts/insurance-export.mjs")
) {
  const args = process.argv.slice(2),
    out = args.indexOf("--out"),
    ppt = args.indexOf("--pptx");
  if (out < 0 || !args[out + 1])
    throw new Error(
      "Uso: node scripts/insurance-export.mjs <seguros.xlsx> [radar.xlsx] --pptx <comite.pptx> --out <pasta-local>",
    );
  const input = args.filter(
    (v, i) =>
      !v.startsWith("--") && i !== out + 1 && (ppt < 0 || i !== ppt + 1),
  );
  const files = input.map(
    (path) => new File([readFileSync(path)], basename(path)),
  );
  const { parser, office } = await loadInsuranceRuntime();
  const packet = await parser.parseInsuranceFiles(files);
  const template =
    ppt >= 0
      ? new File([readFileSync(args[ppt + 1])], basename(args[ppt + 1]))
      : undefined;
  const blob = await office.createReviewPackage(packet, files, template);
  mkdirSync(args[out + 1], { recursive: true });
  writeFileSync(
    resolve(args[out + 1], "insurance-snapshot.json"),
    JSON.stringify(packet, null, 2),
  );
  writeFileSync(
    resolve(args[out + 1], "Seguros_pacote_para_revisao.zip"),
    Buffer.from(await blob.arrayBuffer()),
  );
  console.log(
    JSON.stringify({
      status: "review_required",
      sources: files.length,
      metrics: packet.metrics.length,
      dispatches: packet.dispatches.length,
      issues: packet.issues.length,
    }),
  );
}
