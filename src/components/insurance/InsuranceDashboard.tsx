import { InsuranceMetric, ratio, sumKnown } from "./insuranceCore";
import { ShieldCheck, ClipboardList, Wallet, Target } from "lucide-react";

const money = (value: number | null) =>
  value === null
    ? "—"
    : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const count = (value: number | null) =>
  value === null ? "—" : value.toLocaleString("pt-BR");
const productLabel = (product: string) =>
  product === "mulher" ? "Mulher" : "Residencial";

export function insuranceScorecard(
  metrics: InsuranceMetric[],
  product: string,
  period: string,
) {
  const products = product === "all" ? ["mulher", "residencial"] : [product];
  const total = (code: string) =>
    sumKnown(
      products.map(
        (p) =>
          metrics.find(
            (m) => m.product === p && m.period === period && m.code === code,
          )?.value ?? null,
      ),
    );
  const contracts = total("contracts_digital");
  const registrations = total("registrations_digital");
  const spend = total("digital_cost");
  return {
    contracts,
    registrations,
    spend,
    costPerContract: ratio(spend, contracts),
  };
}

export function InsuranceDashboard({
  metrics,
  product,
  period,
}: {
  metrics: InsuranceMetric[];
  product: string;
  period: string;
}) {
  const score = insuranceScorecard(metrics, product, period);
  const products = product === "all" ? ["mulher", "residencial"] : [product];
  const at = (p: string, code: string, month = period) =>
    metrics.find(
      (m) => m.product === p && m.code === code && m.period === month,
    )?.value ?? null;
  const months = [
    ...new Set(
      metrics.filter((m) => m.period !== "window_total").map((m) => m.period),
    ),
  ].sort();
  const visibleMonths =
    period === "window_total" ? months : months.filter((m) => m === period);
  const trend = visibleMonths.map((month) => ({
    month,
    values: products.map((p) => ({
      product: p,
      value: at(p, "contracts_digital", month),
    })),
  }));
  const max = Math.max(
    1,
    ...trend.flatMap((m) => m.values.map((v) => v.value ?? 0)),
  );
  const cards = [
    {
      title: "Contratações de seguro",
      value: count(score.contracts),
      detail: "Resultado final informado pela fonte",
      icon: ShieldCheck,
      accent: true,
    },
    {
      title: "Cadastros na LP",
      value: count(score.registrations),
      detail: "Preenchimento do formulário",
      icon: ClipboardList,
    },
    {
      title: "Investimento digital",
      value: money(score.spend),
      detail: "Mensageria CRM + mídia segmentada",
      icon: Wallet,
    },
    {
      title: "Custo por contratação",
      value: money(score.costPerContract),
      detail: "Investimento ÷ contratações",
      icon: Target,
    },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon, accent }) => (
          <article
            key={title}
            className={`rounded-2xl border p-5 shadow-sm ${accent ? "border-cyan-200 bg-cyan-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-600">{title}</h2>
              <Icon className="text-cyan-600" size={20} />
            </div>
            <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
              {value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-label="Jornada de contratação do seguro"
        >
          <h2 className="font-bold text-slate-900">Da LP à contratação</h2>
          <p className="mt-1 text-xs text-slate-500">
            Volumes agregados por mês de lançamento; não representam uma coorte
            sequencial.
          </p>
          <div className="mt-5 space-y-5">
            {products.map((p) => (
              <div key={p}>
                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                  {productLabel(p)}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    ["sessions", "Sessões na LP"],
                    ["registrations_digital", "Cadastro enviado"],
                    ["contracts_digital", "Contratação do seguro"],
                  ].map(([code, label], i) => (
                    <div
                      key={code}
                      className={`rounded-xl border p-3 ${i === 2 ? "border-cyan-200 bg-cyan-50" : "border-slate-100 bg-slate-50"}`}
                    >
                      <p className="text-xs text-slate-500">
                        {i + 1}. {label}
                      </p>
                      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
                        {count(at(p, code))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            A conversão final é a confirmação após o formulário da LP. Os XLSX
            atuais informam contratações agregadas; não contêm o evento
            individual necessário para auditar essa confirmação. Cadastro não é
            contabilizado como contratação. Sessões podem ter cobertura menor
            por quebra de tracking.
          </p>
        </section>
        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          aria-label="Evolução das contratações de seguro"
        >
          <h2 className="font-bold text-slate-900">
            Evolução das contratações
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Contratações digitais por produto e mês. Meses parciais permanecem
            sujeitos às ressalvas da fonte.
          </p>
          <div className="mt-4 flex gap-4 text-xs text-slate-600">
            {products.map((p) => (
              <span key={p} className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${p === "mulher" ? "bg-cyan-500" : "bg-orange-400"}`}
                />
                {productLabel(p)}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {trend.map(({ month, values }) => (
              <div key={month}>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  {month.slice(5)}/{month.slice(0, 4)}
                </p>
                {values.map(({ product: p, value }) => (
                  <div
                    key={p}
                    className="mb-1 flex items-center gap-3"
                    aria-label={`${productLabel(p)}, ${month}: ${count(value)}`}
                  >
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${p === "mulher" ? "bg-cyan-500" : "bg-orange-400"}`}
                        style={{
                          width: `${value === null ? 0 : (value / max) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-14 text-right text-xs font-semibold tabular-nums text-slate-700">
                      {count(value)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
