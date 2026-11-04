import * as XLSX from "xlsx";
import {
  WorkbookSource,
  SourceCell,
  buildPacket,
  validatePacket,
} from "./insuranceCore";

export async function sha256(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return [
    ...new Uint8Array(
      await crypto.subtle.digest("SHA-256", input as BufferSource),
    ),
  ]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
export async function parseWorkbook(file: File): Promise<WorkbookSource> {
  if (file.size > 30 * 1024 * 1024) throw new Error("Arquivo excede 30 MB.");
  const bytes = await file.arrayBuffer();
  const workbook = XLSX.read(bytes, {
    type: "array",
    cellDates: true,
    cellFormula: true,
  });
  const sheets: WorkbookSource["sheets"] = {};
  for (const name of workbook.SheetNames) {
    const cells: Record<string, SourceCell> = {};
    for (const [address, cell] of Object.entries(workbook.Sheets[name])) {
      if (address.startsWith("!")) continue;
      const v = cell.v;
      cells[address] = {
        value:
          cell.t === "e"
            ? cell.w || "#ERROR!"
            : v instanceof Date
              ? v.toISOString().slice(0, 10)
              : typeof v === "number" ||
                  typeof v === "string" ||
                  typeof v === "boolean"
                ? v
                : null,
        data_type: cell.t,
        ...(cell.f ? { formula: cell.f } : {}),
      };
    }
    sheets[name] = cells;
  }
  return { name: file.name, sha256: await sha256(bytes), sheets };
}
export async function parseInsuranceFiles(files: File[]) {
  const packet = buildPacket(await Promise.all(files.map(parseWorkbook)));
  validatePacket(packet);
  return packet;
}
