export type DataState =
  | "observed"
  | "zero_observed"
  | "missing"
  | "not_applicable";
export type CellValue = string | number | boolean | null;
export interface SourceCell {
  value: CellValue;
  formula?: string;
  data_type?: string;
}
export interface WorkbookSource {
  name: string;
  sha256: string;
  storage_path?: string;
  sheets: Record<string, Record<string, SourceCell>>;
}
export interface InsuranceMetric {
  product: string;
  code: string;
  period: string;
  value: number | null;
  state: DataState;
  source: string;
  unit: string;
}
export interface InsuranceIssue {
  code: string;
  severity: "warning" | "blocking";
  message: string;
  source: string;
}
export interface InsurancePacket {
  version: "insurance/1";
  sources: WorkbookSource[];
  metrics: InsuranceMetric[];
  issues: InsuranceIssue[];
  periodStart: string;
  periodEnd: string;
  dispatches: Record<string, unknown>[];
  records: Record<string, unknown>[];
  editorial: Record<string, string>;
  coverage: Record<string, number>;
  portfolio?: {
    code: string;
    label: string;
    period: string;
    value: number | null;
    state: DataState;
    unit: string;
    aggregation: string;
    source: string;
  }[];
}
export const METRICS: Record<number, [string, string]> = {
  9: ["source_activated_count", "count"],
  10: ["registrations_activated", "count"],
  11: ["contracts_activated", "count"],
  12: ["sessions", "count"],
  13: ["registrations_digital", "count"],
  14: ["contracts_digital", "count"],
  16: ["registration_per_activated", "ratio"],
  17: ["contracts_per_registration_activated", "ratio"],
  18: ["contracts_per_activated", "ratio"],
  19: ["registrations_per_session", "ratio"],
  21: ["company_new_sales", "count"],
  22: ["digital_sales_share", "ratio"],
  24: ["crm_cost", "BRL"],
  25: ["media_spend", "BRL"],
  26: ["digital_cost", "BRL"],
  27: ["cost_per_registration", "BRL"],
  28: ["cost_per_contract", "BRL"],
  30: ["registrations_crm_origin", "count"],
  31: ["registrations_media_origin", "count"],
  32: ["crm_registration_share", "ratio"],
  33: ["crm_cost_per_registration", "BRL"],
  34: ["media_cost_per_registration", "BRL"],
};
export const numeric = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
export const state = (v: number | null): DataState =>
  v === null ? "missing" : v === 0 ? "zero_observed" : "observed";
export function sumKnown(values: (number | null)[]): number | null {
  return values.length && values.every((v) => v !== null)
    ? values.reduce<number>((a, v) => a + v!, 0)
    : null;
}
export function ratio(n: number | null, d: number | null): number | null {
  return n === null || d === null || d === 0 ? null : n / d;
}
export function buildPacket(sources: WorkbookSource[]): InsurancePacket {
  const insurance = sources.find(
    (s) => s.sheets["Resumo Comitê"] && s.sheets["Base de disparos"],
  );
  if (!insurance)
    throw new Error(
      "SOURCE_LAYOUT_CHANGED: faltam Resumo Comitê e Base de disparos.",
    );
  const summary = insurance.sheets["Resumo Comitê"];
  const metrics: InsuranceMetric[] = [],
    issues: InsuranceIssue[] = [],
    records: Record<string, unknown>[] = [],
    dispatches: Record<string, unknown>[] = [];
  const months: string[] = [];
  for (const c of ["D", "E", "F", "G", "H", "I", "J"]) {
    const raw = summary[c + "5"]?.value;
    const month =
      typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)
        ? raw.slice(0, 7)
        : null;
    if (!month)
      throw new Error(`SOURCE_LAYOUT_CHANGED: competência inválida em ${c}5.`);
    months.push(month);
  }
  for (const [offset, product] of [
    [0, "mulher"],
    [30, "residencial"],
  ] as const) {
    for (const [r, [code, unit]] of Object.entries(METRICS)) {
      const row = Number(r) + offset;
      for (const [i, c] of ["D", "E", "F", "G", "H", "I", "J", "K"].entries()) {
        const cell = summary[c + row];
        const value = numeric(cell?.value);
        if (cell?.data_type === "e")
          issues.push({
            code: "SOURCE_FORMULA_ERROR",
            severity: "blocking",
            message:
              "A referência contém erro de fórmula. Corrija na origem antes de certificar.",
            source: `Resumo Comitê!${c}${row}`,
          });
        if (cell?.formula && cell.value === null)
          issues.push({
            code: "FORMULA_CACHE_MISSING",
            severity: "blocking",
            message:
              "Fórmula sem resultado armazenado; recalcule o arquivo na origem.",
            source: `Resumo Comitê!${c}${row}`,
          });
        metrics.push({
          product,
          code,
          period: i === 7 ? "window_total" : months[i],
          value,
          state: state(value),
          source: `Resumo Comitê!${c}${row}`,
          unit,
        });
      }
    }
  }
  // Derived metrics are always recomputed from compatible components, never averaged.
  const derived: Record<string, [string, string]> = {
    registration_per_activated: [
      "registrations_activated",
      "source_activated_count",
    ],
    contracts_per_registration_activated: [
      "contracts_activated",
      "registrations_activated",
    ],
    contracts_per_activated: ["contracts_activated", "source_activated_count"],
    contracts_per_registration_digital: [
      "contracts_digital",
      "registrations_digital",
    ],
    digital_sales_share: ["contracts_digital", "company_new_sales"],
    cost_per_registration: ["digital_cost", "registrations_digital"],
    cost_per_contract: ["digital_cost", "contracts_digital"],
    crm_registration_share: [
      "registrations_crm_origin",
      "registrations_digital",
    ],
    crm_cost_per_registration: ["crm_cost", "registrations_crm_origin"],
    media_cost_per_registration: ["media_spend", "registrations_media_origin"],
  };
  for (const product of ["mulher", "residencial"])
    for (const period of [...months, "window_total"]) {
      const find = (code: string) =>
        metrics.find(
          (m) =>
            m.product === product && m.period === period && m.code === code,
        );
      const cost = find("digital_cost")!;
      cost.value = sumKnown([
        find("crm_cost")!.value,
        find("media_spend")!.value,
      ]);
      cost.state = state(cost.value);
      for (const [code, [n, d]] of Object.entries(derived)) {
        const value = ratio(find(n)?.value ?? null, find(d)?.value ?? null);
        const old = find(code);
        const metric = {
          product,
          period,
          code,
          value,
          state: state(value),
          unit: code.includes("cost") ? "BRL" : "ratio",
          source: `${n}/${d}`,
        };
        if (old) Object.assign(old, { ...metric, source: old.source });
        else metrics.push(metric);
      }
      // Total sessions/registrations must cover exactly the same months.
      const covered = months.filter(
        (p) =>
          metrics.find(
            (m) =>
              m.product === product && m.period === p && m.code === "sessions",
          )?.value !== null,
      );
      const numerator =
        period === "window_total"
          ? sumKnown(
              covered.map(
                (p) =>
                  metrics.find(
                    (m) =>
                      m.product === product &&
                      m.period === p &&
                      m.code === "registrations_digital",
                  )?.value ?? null,
              ),
            )
          : (find("registrations_digital")?.value ?? null);
      const denominator =
        period === "window_total"
          ? sumKnown(
              covered.map(
                (p) =>
                  metrics.find(
                    (m) =>
                      m.product === product &&
                      m.period === p &&
                      m.code === "sessions",
                  )?.value ?? null,
              ),
            )
          : (find("sessions")?.value ?? null);
      const conversion = find("registrations_per_session")!;
      conversion.value = ratio(numerator, denominator);
      conversion.state = state(conversion.value);
      conversion.source =
        period === "window_total"
          ? `meses compatíveis: ${covered.join(", ")}`
          : "registrations_digital/sessions";
    }
  const sheet = insurance.sheets["Base de disparos"];
  for (const [block, columns] of Object.entries({
    email: ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"],
    whatsapp: ["P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y"],
    sms: ["AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK"],
  })) {
    const rows = [
      ...new Set(
        Object.keys(sheet)
          .filter(
            (k) =>
              k.startsWith(columns[2]) &&
              /^\d{4}-\d{2}-\d{2}/.test(String(sheet[k].value)),
          )
          .map((k) => Number(k.replace(/\D/g, ""))),
      ),
    ];
    for (const row of rows) {
      const get = (i: number) => sheet[columns[i] + row]?.value ?? null;
      const journey = String(get(1) ?? "");
      dispatches.push({
        block,
        row,
        date: get(2),
        journey,
        sent: numeric(get(3)),
        unit_cost: numeric(get(4)),
        communication_cost: numeric(get(5)),
        delivered: numeric(get(6)),
        opens_unique: block === "email" ? numeric(get(7)) : null,
        reads: block === "whatsapp" ? numeric(get(7)) : null,
        clicks_unique: block === "email" ? numeric(get(8)) : null,
        unsubscribes: block === "email" ? numeric(get(9)) : null,
        failed: block === "whatsapp" ? numeric(get(8)) : null,
        undelivered: block === "sms" ? numeric(get(7)) : null,
        lp_registrations: numeric(
          get(block === "email" ? 10 : block === "whatsapp" ? 9 : 8),
        ),
        test: /teste/i.test(journey),
        source: `Base de disparos!${columns[0]}${row}`,
      });
    }
  }
  for (const source of sources)
    for (const [sheetName, cells] of Object.entries(source.sheets)) {
      records.push({
        source_sha256: source.sha256,
        sheet: sheetName,
        cell_count: Object.keys(cells).length,
        formula_count: Object.values(cells).filter((c) => c.formula).length,
      });
    }
  for (const row of [90, 91, 92, 93, 94, 95, 96]) {
    const message = summary["B" + row]?.value;
    if (typeof message === "string")
      issues.push({
        code: `REFERENCE_NOTE_${row}`,
        severity: "warning",
        message,
        source: `Resumo Comitê!B${row}`,
      });
  }
  issues.push({
    code: "SOURCE_SCOPE_REVIEW",
    severity: "blocking",
    message:
      "Validar enviados versus pessoas únicas, recortes acionado/digital e possíveis duplicidades antes de certificar.",
    source: "Resumo Comitê!B9:B96",
  });
  issues.push({
    code: "CACHED_INPUTS_REVIEW",
    severity: "blocking",
    message:
      "Contagens-base são os resultados armazenados na planilha recebida; revisar fontes e fórmulas antes de certificar.",
    source: "Resumo Comitê",
  });
  const portfolio: NonNullable<InsurancePacket["portfolio"]> = [];
  const radar = sources.find((s) => s.sheets["Base Seguros"]);
  if (radar) {
    const cells = radar.sheets["Base Seguros"];
    const definitions: Record<number, [string, string, string]> = {
      5: ["policies_new", "Novos seguros registrados", "sum"],
      6: ["policies_cancelled", "Cancelamentos registrados", "sum"],
      7: [
        "policies_closing_stock",
        "Estoque final de seguros",
        "last_snapshot",
      ],
      8: [
        "policies_opening_stock",
        "Estoque inicial de seguros",
        "last_snapshot",
      ],
      9: ["portfolio_live_accounts", "Contas vivas", "last_snapshot"],
    };
    for (const [address, cell] of Object.entries(cells))
      if (
        /^[A-Z]+4$/.test(address) &&
        typeof cell.value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(cell.value)
      ) {
        const col = address.replace(/\d+/g, ""),
          period = cell.value.slice(0, 7);
        for (const [row, [code, label, aggregation]] of Object.entries(
          definitions,
        )) {
          const value = numeric(cells[col + row]?.value);
          portfolio.push({
            code,
            label,
            period,
            value,
            state: state(value),
            unit: "count",
            aggregation,
            source: `Base Seguros!${col}${row}`,
          });
        }
        const ipp = ratio(
          numeric(cells[col + "7"]?.value),
          numeric(cells[col + "9"]?.value),
        );
        portfolio.push({
          code: "insurance_ipp",
          label: "Seguros por conta viva — IPP",
          period,
          value: ipp,
          state: state(ipp),
          unit: "ratio",
          aggregation: "last_snapshot",
          source: `Base Seguros!${col}7/${col}9`,
        });
      }
  }
  return {
    version: "insurance/1",
    sources,
    metrics,
    issues,
    periodStart: months[0] + "-01",
    periodEnd: new Date(
      Date.UTC(
        Number(months[months.length - 1].slice(0, 4)),
        Number(months[months.length - 1].slice(5, 7)),
        0,
      ),
    )
      .toISOString()
      .slice(0, 10),
    dispatches,
    records,
    editorial: {},
    portfolio,
    coverage: {
      sheets: records.length,
      dispatches: dispatches.length,
      tests: dispatches.filter((d) => d.test).length,
    },
  };
}
export function validatePacket(packet: InsurancePacket): void {
  if (
    packet.version !== "insurance/1" ||
    !packet.sources.length ||
    packet.metrics.length > 10000
  )
    throw new Error("INVALID_PACKET");
  for (const m of packet.metrics)
    if (
      (m.value === null && !["missing", "not_applicable"].includes(m.state)) ||
      (m.value !== null &&
        (!Number.isFinite(m.value) || state(m.value) !== m.state))
    )
      throw new Error("INVALID_METRIC_STATE");
  if (
    new Set(packet.metrics.map((m) => [m.product, m.period, m.code].join("|")))
      .size !== packet.metrics.length
  )
    throw new Error("DUPLICATE_METRIC");
}
export function comparePackets(
  before: InsurancePacket,
  after: InsurancePacket,
) {
  const key = (m: InsuranceMetric) => [m.product, m.period, m.code].join("|");
  const a = new Map(before.metrics.map((m) => [key(m), m])),
    b = new Map(after.metrics.map((m) => [key(m), m]));
  return [...new Set([...a.keys(), ...b.keys()])].sort().flatMap((k) => {
    const old = a.get(k),
      next = b.get(k);
    return old && next && old.value === next.value && old.state === next.state
      ? []
      : [{ key: k, before: old || null, after: next || null }];
  });
}
