import { useState, type ReactNode } from "react";
import { Download } from "lucide-react";

export interface ReportTableColumn<T> {
  key: string;
  label: string;
  render: (row: T, index: number) => ReactNode;
  csv?: (row: T) => string | number | null;
}
export function ReportDataTable<T>({
  title,
  kicker,
  rows,
  columns,
  rowKey,
  firstLabel,
  firstValue,
  csvName,
  minWidth = 900,
}: {
  title: string;
  kicker: string;
  rows: T[];
  columns: ReportTableColumn<T>[];
  rowKey: (row: T, index: number) => string;
  firstLabel: string;
  firstValue: (row: T) => ReactNode;
  csvName?: string;
  minWidth?: number;
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const visible = columns.filter((c) => !hidden.includes(c.key));
  const exportCsv = () => {
    const escape = (v: unknown) =>
      '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const text =
      "\ufeff" +
      [
        [firstLabel, ...visible.map((c) => c.label)],
        ...rows.map((r) => [
          String(firstValue(r) ?? ""),
          ...visible.map((c) => c.csv?.(r) ?? ""),
        ]),
      ]
        .map((r) => r.map(escape).join(";"))
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = csvName || "relatorio.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section
      className="rounded-xl border border-slate-200 bg-white shadow-sm"
      data-report-component="results-table"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {kicker}
          </p>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
        {csvName && (
          <div className="flex items-center gap-3 text-xs">
            <details className="relative">
              <summary className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2">
                Colunas {visible.length}
              </summary>
              <div className="absolute right-0 z-20 min-w-52 rounded-xl border bg-white p-3 shadow-lg">
                {columns.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={!hidden.includes(c.key)}
                      onChange={() =>
                        setHidden((h) =>
                          h.includes(c.key)
                            ? h.filter((k) => k !== c.key)
                            : [...h, c.key],
                        )
                      }
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            </details>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <Download size={13} />
              Exportar CSV
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth }}>
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="sticky left-0 z-10 bg-slate-900 px-4 py-3 text-left font-semibold">
                {firstLabel}
              </th>
              {visible.map((c) => (
                <th
                  key={c.key}
                  className="whitespace-nowrap px-4 py-3 text-right font-semibold"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={rowKey(r, i)}
                className={`border-t border-slate-100 ${i % 2 ? "bg-slate-50" : "bg-white"}`}
              >
                <td
                  className={`sticky left-0 z-10 whitespace-nowrap px-4 py-3 font-bold text-slate-900 ${i % 2 ? "bg-slate-50" : "bg-white"}`}
                >
                  {firstValue(r)}
                </td>
                {visible.map((c) => (
                  <td
                    key={c.key}
                    className="whitespace-nowrap px-4 py-3 text-right font-mono text-[13px] font-semibold tabular-nums text-slate-800"
                  >
                    {c.render(r, i)}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td
                  colSpan={visible.length + 1}
                  className="p-8 text-center text-slate-500"
                >
                  Nenhum dado disponível para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
