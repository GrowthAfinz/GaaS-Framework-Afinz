import {
  InsurancePacket,
  InsuranceMetric,
  numeric,
  ratio,
  sumKnown,
} from "./insuranceCore";

export const INSURANCE_PRODUCTS = ["mulher", "residencial"];
export const productName = (product: string) =>
  product === "mulher" ? "Mulher" : "Residencial";
export const channelName = (channel: string) =>
  ({ email: "E-mail", whatsapp: "WhatsApp", sms: "SMS" })[channel] || channel;
export const formatInsuranceNumber = (value: number | null) =>
  value === null ? "—" : value.toLocaleString("pt-BR");
export const formatInsuranceMoney = (value: number | null) =>
  value === null
    ? "—"
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const formatInsuranceRate = (value: number | null) =>
  value === null
    ? "—"
    : (value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";
export function insuranceValue(
  packet: InsurancePacket,
  product: string,
  period: string,
  code: string,
) {
  return sumKnown(
    (product === "all" ? INSURANCE_PRODUCTS : [product]).map(
      (p) =>
        packet.metrics.find(
          (m) => m.product === p && m.period === period && m.code === code,
        )?.value ?? null,
    ),
  );
}
export function insuranceMonthRows(
  packet: InsurancePacket,
  product: string,
  period: string,
) {
  const months = [
    ...new Set(
      packet.metrics.map((m) => m.period).filter((p) => p !== "window_total"),
    ),
  ].sort();
  const partial = packet.issues.some((i) => /parcial/i.test(i.message));
  return months
    .filter((m) => period === "window_total" || period === m)
    .map((month) => {
      const registrations = insuranceValue(
        packet,
        product,
        month,
        "registrations_digital",
      );
      const contracts = insuranceValue(
        packet,
        product,
        month,
        "contracts_digital",
      );
      const cost = insuranceValue(packet, product, month, "digital_cost");
      return {
        key: month,
        label: month.slice(5) + "/" + month.slice(0, 4),
        registrations,
        contracts,
        cost,
        costPerContract: ratio(cost, contracts),
        rate: ratio(contracts, registrations),
        partial: partial && month === months[months.length - 1],
      };
    });
}
export function insuranceMoM(
  current: number | null,
  previous: number | null,
  month: string,
  previousMonth: string,
  partial = false,
) {
  const previousDate = new Date(previousMonth + "-01T00:00:00Z");
  previousDate.setUTCMonth(previousDate.getUTCMonth() + 1);
  return partial ||
    previousDate.toISOString().slice(0, 7) !== month ||
    current === null ||
    previous === null ||
    previous === 0
    ? null
    : (current - previous) / previous;
}
export function insuranceDispatchRows(packet: InsurancePacket, period: string) {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const d of packet.dispatches) {
    const date = String(d.date || "").slice(0, 10);
    if (
      date < packet.periodStart ||
      date > packet.periodEnd ||
      (period !== "window_total" && !date.startsWith(period))
    )
      continue;
    const key = date + ":" + d.block;
    groups.set(key, [...(groups.get(key) || []), d]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => {
      const total = (field: string) =>
        sumKnown(rows.map((r) => numeric(r[field])));
      const sent = total("sent"),
        delivered = total("delivered");
      return {
        key,
        date: String(rows[0].date).slice(0, 10),
        channel: String(rows[0].block),
        count: rows.length,
        sent,
        delivered,
        registrations: total("lp_registrations"),
        cost: total("communication_cost"),
        deliveryRate: ratio(delivered, sent),
        contracts: null as number | null,
        alerts: rows.filter(
          (r) =>
            numeric(r.sent) === null ||
            numeric(r.communication_cost) === null ||
            (numeric(r.delivered) !== null &&
              numeric(r.sent) !== null &&
              Number(r.delivered) > Number(r.sent)) ||
            (numeric(r.communication_cost) !== null &&
              Number(r.communication_cost) < 0),
        ).length,
        tests: rows.filter((r) => r.test === true).length,
      };
    });
}

export function insuranceScorecard(
  metrics: InsuranceMetric[],
  product: string,
  period: string,
) {
  const products = product === "all" ? INSURANCE_PRODUCTS : [product];
  const total = (code: string) =>
    sumKnown(
      products.map(
        (p) =>
          metrics.find(
            (m) => m.product === p && m.period === period && m.code === code,
          )?.value ?? null,
      ),
    );
  const contracts = total("contracts_digital"),
    registrations = total("registrations_digital"),
    spend = total("digital_cost");
  return {
    contracts,
    registrations,
    spend,
    costPerContract: ratio(spend, contracts),
  };
}

export function accumulateInsuranceDispatchRows(
  rows: ReturnType<typeof insuranceDispatchRows>,
) {
  const previous = new Map<string, (typeof rows)[number]>();
  return rows.map((row) => {
    const before = previous.get(row.channel);
    const accumulated = { ...row };
    for (const key of ["sent", "delivered", "registrations", "cost"] as const)
      accumulated[key] = before ? sumKnown([before[key], row[key]]) : row[key];
    accumulated.deliveryRate = ratio(accumulated.delivered, accumulated.sent);
    previous.set(row.channel, accumulated);
    return accumulated;
  });
}
