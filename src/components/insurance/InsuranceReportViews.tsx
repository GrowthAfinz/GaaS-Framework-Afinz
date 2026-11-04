import { useState } from "react";
import { ReportDataTable } from "../relatorio/ReportDataTable";
import { ReportTimeSeriesChart } from "../relatorio/ReportTimeSeriesChart";
import {
  ReportDailyModeControl,
  ReportMonthRangeControl,
  type ReportView,
} from "../relatorio/ReportWorkspace";
import { InsurancePacket, sumKnown } from "./insuranceCore";
import {
  INSURANCE_PRODUCTS,
  insuranceValue,
  insuranceMonthRows,
  insuranceMoM,
  insuranceDispatchRows,
  accumulateInsuranceDispatchRows,
  productName,
  channelName,
  formatInsuranceMoney as brl,
  formatInsuranceNumber as number,
  formatInsuranceRate as percent,
} from "./insuranceReportModel";

const metricButton = (active: boolean) =>
  `rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`;
const noteStyle =
  "rounded-xl border border-cyan-100 bg-cyan-50/60 px-5 py-3 text-xs leading-relaxed text-slate-600";

function InsuranceMonthly({
  packet,
  product,
  period,
}: {
  packet: InsurancePacket;
  product: string;
  period: string;
}) {
  const [metric, setMetric] = useState("contracts_digital");
  const [range, setRange] = useState<number | undefined>(undefined);
  const options = [
    ["contracts_digital", "Contratações"],
    ["registrations_digital", "Cadastros"],
    ["digital_cost", "Investimento"],
    ["cost_per_contract", "Custo/Contratação"],
  ];
  const products = product === "all" ? INSURANCE_PRODUCTS : [product];
  const availableRows = insuranceMonthRows(packet, product, period);
  const rows =
    period === "window_total" && range
      ? availableRows.slice(-range)
      : availableRows;
  const data = rows.map((row) => ({
    month: row.label,
    ...Object.fromEntries(
      products.map((p) => [
        productName(p),
        insuranceValue(packet, p, row.key, metric),
      ]),
    ),
  }));
  const costData = rows.map((row) => ({
    month: row.label,
    "Mensageria CRM": insuranceValue(packet, product, row.key, "crm_cost"),
    "Mídia segmentada": insuranceValue(packet, product, row.key, "media_spend"),
  }));
  const allRows = insuranceMonthRows(packet, product, "window_total");
  const valueWithDelta = (
    row: (typeof rows)[number],
    key: "registrations" | "contracts" | "cost" | "costPerContract",
  ) => {
    const index = allRows.findIndex((r) => r.key === row.key);
    const prev = allRows[index - 1];
    const delta = prev
      ? insuranceMoM(
          row[key],
          prev[key],
          row.key,
          prev.key,
          row.partial || prev.partial,
        )
      : null;
    const good =
      delta !== null && (key === "costPerContract" ? delta <= 0 : delta >= 0);
    return (
      <span className="inline-flex items-center gap-2">
        {key === "cost" || key === "costPerContract"
          ? brl(row[key])
          : number(row[key])}
        {delta !== null && (
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] ${good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
          >
            {delta > 0 ? "+" : ""}
            {percent(delta)}
          </span>
        )}
      </span>
    );
  };
  return (
    <div className="space-y-6">
      <ReportMonthRangeControl
        active={period === "window_total" ? range : undefined}
        onChange={setRange}
        caption={`${rows.length} meses com fonte no recorte; o seletor de período mantém prioridade`}
      />
      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
        <ReportTimeSeriesChart
          title="Evolução mensal por produto"
          kicker="Produtos por mês"
          data={data}
          xKey="month"
          series={products.map(productName)}
          stackable={metric !== "cost_per_contract"}
          formatValue={metric.includes("cost") ? brl : number}
          controls={
            <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5">
              {options.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  aria-pressed={metric === key}
                  className={metricButton(metric === key)}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
        <ReportTimeSeriesChart
          title="Evolução mensal do investimento"
          kicker="Canais de investimento por mês"
          data={costData}
          xKey="month"
          series={["Mensageria CRM", "Mídia segmentada"]}
          formatValue={brl}
        />
      </div>
      <ReportDataTable
        title="Resultados mês a mês"
        kicker="Consolidado mensal"
        rows={rows}
        rowKey={(r) => r.key}
        firstLabel="Mês"
        firstValue={(r) => r.label + (r.partial ? " · parcial" : "")}
        csvName="seguros-mensal.csv"
        columns={[
          {
            key: "registrations",
            label: "Cadastros na LP",
            render: (r) => valueWithDelta(r, "registrations"),
            csv: (r) => r.registrations,
          },
          {
            key: "contracts",
            label: "Contratações",
            render: (r) => valueWithDelta(r, "contracts"),
            csv: (r) => r.contracts,
          },
          {
            key: "rate",
            label: "% Contratação/Cadastro",
            render: (r) => percent(r.rate),
            csv: (r) => r.rate,
          },
          {
            key: "costPerContract",
            label: "Custo/Contratação",
            render: (r) => valueWithDelta(r, "costPerContract"),
            csv: (r) => r.costPerContract,
          },
          {
            key: "cost",
            label: "Custo total",
            render: (r) => valueWithDelta(r, "cost"),
            csv: (r) => r.cost,
          },
        ]}
      />
      <p className={noteStyle}>
        Variação contra o mês anterior apenas entre meses consecutivos com
        valores disponíveis, base anterior diferente de zero e sem indicação de
        parcialidade. A razão contratação/cadastro é mensal, não uma conversão
        de coorte.
      </p>
    </div>
  );
}

function InsuranceDaily({
  packet,
  product,
  period,
  anomalies = false,
}: {
  packet: InsurancePacket;
  product: string;
  period: string;
  anomalies?: boolean;
}) {
  const [metric, setMetric] = useState("sent");
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const [accumulated, setAccumulated] = useState(false);
  const sourceRows = insuranceDispatchRows(packet, period);
  const raw =
    accumulated && !anomalies
      ? accumulateInsuranceDispatchRows(sourceRows)
      : sourceRows;
  if (product !== "all")
    return (
      <div className={noteStyle}>
        A base diária de disparos não tem produto governado. Selecione “Mulher e
        Residencial” para consultar a operação CRM sem atribuir disparos a um
        seguro por semelhança de nome. O resultado mensal por produto continua
        disponível na aba Mensal.
      </div>
    );
  const rows = onlyAlerts
    ? raw.filter((r) => r.alerts > 0 || r.tests > 0)
    : raw;
  const channels = [...new Set(raw.map((r) => r.channel))];
  const days = [...new Set(raw.map((r) => r.date))];
  const field = anomalies ? "alerts" : metric;
  const data = days.map((day) => ({
    day: day.slice(8) + "/" + day.slice(5, 7),
    ...Object.fromEntries(
      channels.map((c) => [
        channelName(c),
        raw.find((r) => r.date === day && r.channel === c)?.[field as "sent"] ??
          null,
      ]),
    ),
  }));
  return (
    <div className="space-y-6">
      {!anomalies && (
        <div className="flex justify-end">
          <ReportDailyModeControl
            accumulated={accumulated}
            onChange={setAccumulated}
          />
        </div>
      )}
      <div className={noteStyle}>
        O diário acompanha disparos, entrega, custo de mensageria e cadastros
        registrados no bloco CRM. Contratações confirmadas estão disponíveis
        apenas por mês na fonte atual: não são distribuídas entre dias, canais
        ou disparos. Dias sem registro permanecem ausentes, sem preenchimento
        com zero.
      </div>
      <div
        className={anomalies ? "" : "grid grid-cols-1 gap-6 2xl:grid-cols-2"}
      >
        <ReportTimeSeriesChart
          title={
            anomalies
              ? "Alertas na operação por dia"
              : accumulated
                ? "Evolução diária acumulada por canal"
                : "Evolução diária por canal"
          }
          kicker={anomalies ? "Evolução e anomalias" : "Canais por dia"}
          data={data}
          xKey="day"
          series={channels.map(channelName)}
          formatValue={!anomalies && metric === "cost" ? brl : number}
          labelPrefix="Dia"
          controls={
            anomalies ? (
              <button
                type="button"
                aria-pressed={onlyAlerts}
                onClick={() => setOnlyAlerts(!onlyAlerts)}
                className={metricButton(onlyAlerts)}
              >
                Somente registros com alerta ou candidato a teste
              </button>
            ) : (
              <div className="flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5">
                {[
                  ["sent", "Base enviada"],
                  ["delivered", "Base entregue"],
                  ["registrations", "Cadastros CRM"],
                  ["cost", "Custo CRM"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={metric === key}
                    onClick={() => setMetric(key)}
                    className={metricButton(metric === key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )
          }
        />
        {!anomalies && (
          <ReportTimeSeriesChart
            title={
              accumulated
                ? "Cadastros CRM acumulados por canal"
                : "Cadastros na LP por canal CRM"
            }
            kicker="Cadastros por dia · fonte CRM"
            data={days.map((day) => ({
              day: day.slice(8) + "/" + day.slice(5, 7),
              ...Object.fromEntries(
                channels.map((c) => [
                  channelName(c),
                  raw.find((r) => r.date === day && r.channel === c)
                    ?.registrations ?? null,
                ]),
              ),
            }))}
            xKey="day"
            series={channels.map(channelName)}
            formatValue={number}
            labelPrefix="Dia"
          />
        )}
      </div>
      <ReportDataTable
        title={
          anomalies
            ? "Ocorrências para revisão"
            : accumulated
              ? "Resultados acumulados por dia"
              : "Resultados dia a dia"
        }
        kicker="Operação CRM · sem atribuição individual de vendas"
        rows={rows}
        rowKey={(r) => r.key}
        firstLabel="Dia / Canal"
        firstValue={(r) => `${r.date} · ${channelName(r.channel)}`}
        csvName={anomalies ? "seguros-anomalias.csv" : "seguros-diario.csv"}
        columns={[
          {
            key: "sent",
            label: "Base enviada",
            render: (r) => number(r.sent),
            csv: (r) => r.sent,
          },
          {
            key: "delivered",
            label: "Base entregue",
            render: (r) => number(r.delivered),
            csv: (r) => r.delivered,
          },
          {
            key: "deliveryRate",
            label: "% Entrega",
            render: (r) => percent(r.deliveryRate),
            csv: (r) => r.deliveryRate,
          },
          {
            key: "registrations",
            label: "Cadastros CRM",
            render: (r) => number(r.registrations),
            csv: (r) => r.registrations,
          },
          {
            key: "contracts",
            label: "Contratações confirmadas",
            render: () => (
              <span title="Fonte disponível apenas por mês">—</span>
            ),
            csv: () => null,
          },
          {
            key: "cost",
            label: "Custo CRM",
            render: (r) => brl(r.cost),
            csv: (r) => r.cost,
          },
          ...(anomalies
            ? [
                {
                  key: "alerts",
                  label: "Registros com alerta",
                  render: (r: (typeof rows)[number]) => number(r.alerts),
                  csv: (r: (typeof rows)[number]) => r.alerts,
                },
                {
                  key: "tests",
                  label: "Candidatos a teste",
                  render: (r: (typeof rows)[number]) => number(r.tests),
                  csv: (r: (typeof rows)[number]) => r.tests,
                },
              ]
            : []),
        ]}
      />
      {anomalies && (
        <p className={noteStyle}>
          Alertas verificáveis: base enviada ou custo ausente, entregue maior
          que enviado, custo negativo. “Teste” no nome é somente candidato para
          revisão; os registros continuam incluídos. Quebras de tracking e
          ressalvas de fonte estão em Relatórios → Fontes e revisão. Não há
          diagnóstico causal automático.
        </p>
      )}
    </div>
  );
}

function InsuranceOverview({
  packet,
  product,
  period,
}: {
  packet: InsurancePacket;
  product: string;
  period: string;
}) {
  const products = product === "all" ? INSURANCE_PRODUCTS : [product];
  const rows = products.map((p) => ({
    product: productName(p),
    registrations: insuranceValue(packet, p, period, "registrations_digital"),
    contracts: insuranceValue(packet, p, period, "contracts_digital"),
    cost: insuranceValue(packet, p, period, "digital_cost"),
    unitCost: insuranceValue(packet, p, period, "cost_per_contract"),
  }));
  const dispatches = insuranceDispatchRows(packet, period);
  const channels = [...new Set(dispatches.map((r) => r.channel))].map(
    (channel) => {
      const rs = dispatches.filter((r) => r.channel === channel);
      return {
        channel: channelName(channel),
        sent: sumKnown(rs.map((r) => r.sent)),
        delivered: sumKnown(rs.map((r) => r.delivered)),
        registrations: sumKnown(rs.map((r) => r.registrations)),
        cost: sumKnown(rs.map((r) => r.cost)),
      };
    },
  );
  return (
    <div className="space-y-8">
      <ReportDataTable
        title="Performance por produto"
        kicker="Contratação do seguro · confirmação pós formulário LP"
        rows={rows}
        firstLabel="Produto"
        firstValue={(r) => r.product}
        rowKey={(r) => r.product}
        csvName="seguros-produtos.csv"
        columns={[
          {
            key: "registrations",
            label: "Cadastros na LP",
            render: (r) => number(r.registrations),
            csv: (r) => r.registrations,
          },
          {
            key: "contracts",
            label: "Contratações",
            render: (r) => number(r.contracts),
            csv: (r) => r.contracts,
          },
          {
            key: "unitCost",
            label: "Custo/Contratação",
            render: (r) => brl(r.unitCost),
            csv: (r) => r.unitCost,
          },
          {
            key: "cost",
            label: "Custo total digital",
            render: (r) => brl(r.cost),
            csv: (r) => r.cost,
          },
        ]}
      />
      {product === "all" ? (
        <ReportDataTable
          title="Performance canais"
          kicker="Mensageria CRM · universo independente do total digital"
          rows={channels}
          firstLabel="Canal"
          firstValue={(r) => r.channel}
          rowKey={(r) => r.channel}
          csvName="seguros-canais.csv"
          columns={[
            {
              key: "sent",
              label: "Base enviada",
              render: (r) => number(r.sent),
              csv: (r) => r.sent,
            },
            {
              key: "delivered",
              label: "Base entregue",
              render: (r) => number(r.delivered),
              csv: (r) => r.delivered,
            },
            {
              key: "registrations",
              label: "Cadastros CRM",
              render: (r) => number(r.registrations),
              csv: (r) => r.registrations,
            },
            {
              key: "cost",
              label: "Custo CRM",
              render: (r) => brl(r.cost),
              csv: (r) => r.cost,
            },
          ]}
        />
      ) : (
        <p className={noteStyle}>
          A distribuição dos disparos CRM por produto depende de um vínculo de
          produto aprovado. Sem esse vínculo, os canais não são atribuídos ao
          produto selecionado.
        </p>
      )}
      <p className={noteStyle}>
        Cadastro é uma etapa intermediária, não uma contratação. O XLSX informa
        contratações agregadas; a auditoria da confirmação individual após o
        formulário depende de uma fonte com identificador, data e status da
        contratação. As populações CRM, LP e companhia não são somadas entre si.
      </p>
    </div>
  );
}

function InsuranceEvolution(props: {
  packet: InsurancePacket;
  product: string;
  period: string;
}) {
  const [mode, setMode] = useState<"performance" | "anomalies">("performance");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Evolução e anomalias
          </h2>
          <p className="text-xs text-slate-500">
            Operação CRM diária e ocorrências verificáveis para revisão.
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {(
            [
              ["performance", "Performance"],
              ["anomalies", "Anomalias"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${mode === key ? (key === "anomalies" ? "bg-red-600 text-white" : "bg-slate-900 text-white") : "text-slate-600 hover:bg-slate-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <InsuranceDaily key={mode} {...props} anomalies={mode === "anomalies"} />
    </div>
  );
}

export function InsuranceReportViews({
  mode,
  packet,
  product,
  period,
}: {
  mode: ReportView;
  packet: InsurancePacket;
  product: string;
  period: string;
}) {
  if (mode === "performance")
    return (
      <InsuranceOverview packet={packet} product={product} period={period} />
    );
  if (mode === "monthly")
    return (
      <InsuranceMonthly packet={packet} product={product} period={period} />
    );
  if (mode === "journey")
    return (
      <InsuranceEvolution packet={packet} product={product} period={period} />
    );
  if (mode === "daily")
    return (
      <InsuranceDaily
        key={mode}
        packet={packet}
        product={product}
        period={period}
      />
    );
  return null;
}
