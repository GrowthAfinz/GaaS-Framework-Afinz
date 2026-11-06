import React, { useState } from "react";
import type { VdvData } from "./VaiDeVisaWorkspace";
import type { EmailAsset } from "../domain/workspace";
import { vdvValidOffer } from "../domain/vaiDeVisa";
import { poolGroupLabel, newPoolOffer } from "../domain/poolCreation";

const fieldStyle =
  "mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
const fields: Record<string, string> = {
  MARCA: "Marca",
  GRUPO: "Grupo da oferta",
  VALOR: "Valor do benefício",
  PREFIXO: "Prefixo",
  SUFIXO: "Sufixo",
  COMPLEMENTO: "Complemento",
  RESGATE: "Forma de resgate",
  CUPOM: "Cupom",
  LINK: "Link da oferta",
  LOGO: "URL do logo",
  FOTO: "URL da foto",
  ALT: "Descrição da imagem",
  INICIO: "Início",
  FIM: "Fim",
  CONDICOES: "Condições",
};
export function PoolOfferLibrary({
  data,
  onChange,
  onSave,
  saving,
  today,
  message,
  assets = [],
}: {
  data: VdvData;
  onChange: (data: VdvData) => void;
  onSave: () => void;
  saving: boolean;
  today: string;
  message: string;
  assets?: EmailAsset[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [onlyUsed, setOnlyUsed] = useState(false);
  const offers = data.briefing.filter((r) => r.TIPO === "OFERTA");
  const filtered = offers.filter(
    (r) =>
      `${r.MARCA} ${r.ID} ${r.GRUPO}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.toLocaleLowerCase("pt-BR")) &&
      (!onlyUsed ||
        data.movimento.some(
          (m) => m.OFERTA_ID === r.ID && m.ATIVA.toLowerCase() === "true",
        )),
  );
  const offer = offers.find((r) => r.ID === selected);
  const uses = offer
    ? data.movimento.filter((m) => m.OFERTA_ID === offer.ID)
    : [];
  const update = (key: string, value: string) =>
    offer &&
    onChange({
      ...data,
      briefing: data.briefing.map((r) =>
        r.ID === offer.ID
          ? { ...r, [key]: value, __dirty: "true", __source: "gaas" }
          : r,
      ),
    });
  return (
    <fieldset
      disabled={saving}
      className="mt-3 rounded-xl border border-slate-200 bg-white p-3"
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Catálogo de ofertas Visa
          </h2>
          <p className="text-[11px] text-slate-500">
            Conteúdo compartilhado. A vitrine de cada campanha é composta no
            editor.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const offer = newPoolOffer();
              onChange({ ...data, briefing: [...data.briefing, offer] });
              setSelected(offer.ID);
              setQuery("");
              setOnlyUsed(false);
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-cyan-900"
          >
            Nova oferta
          </button>
          <button
            type="button"
            disabled={saving || !offers.some((r) => r.__dirty === "true")}
            onClick={onSave}
            className="rounded-lg bg-[#07595b] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            {saving ? "Salvando…" : "Salvar catálogo"}
          </button>
        </div>
      </header>
      {message && (
        <p role="status" className="mt-2 text-xs text-cyan-900">
          {message}
        </p>
      )}
      <div className="my-3 flex flex-wrap items-center gap-3">
        <input
          aria-label="Buscar ofertas Visa"
          placeholder="Buscar marca, oferta ou grupo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 min-w-56 rounded-lg border border-slate-200 px-3 text-xs"
        />
        <label className="text-xs text-slate-600">
          <input
            type="checkbox"
            checked={onlyUsed}
            onChange={(e) => setOnlyUsed(e.target.checked)}
            className="mr-1"
          />
          Usadas em vitrines ativas
        </label>
        <span className="text-[11px] text-slate-500">
          {filtered.length} de {offers.length} ofertas
        </span>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)]">
        <div className="grid max-h-[650px] content-start gap-2 overflow-auto sm:grid-cols-2">
          {filtered.map((r) => (
            <button
              type="button"
              key={r.ID}
              aria-pressed={selected === r.ID}
              onClick={() => setSelected(r.ID)}
              className={`rounded-xl border p-3 text-left ${selected === r.ID ? "border-cyan-400 bg-cyan-50" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <div className="flex items-center gap-2">
                {r.LOGO && (
                  <img
                    src={r.LOGO}
                    alt=""
                    className="h-8 w-14 object-contain"
                  />
                )}
                <b className="text-xs text-slate-900">{r.MARCA}</b>
              </div>
              <p className="mt-1 text-sm font-bold text-cyan-900">
                {[r.PREFIXO, r.VALOR, r.SUFIXO].filter(Boolean).join(" ")}
              </p>
              <p className="text-[10px] text-slate-500">
                {vdvValidOffer(r, today)
                  ? "Válida na data simulada"
                  : "Indisponível na data simulada"}{" "}
                · {data.movimento.filter((m) => m.OFERTA_ID === r.ID).length}{" "}
                posições
              </p>
            </button>
          ))}
        </div>
        {offer ? (
          <div className="rounded-xl border border-slate-200 p-3">
            <h3 className="text-sm font-bold">{offer.MARCA}</h3>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-slate-500">{offer.ID}</p>
              {!offer.__version && (
                <button
                  type="button"
                  disabled={uses.length > 0}
                  title={
                    uses.length
                      ? "Remova a oferta das vitrines antes de descartar."
                      : "Descartar somente este rascunho local"
                  }
                  onClick={() => {
                    onChange({
                      ...data,
                      briefing: data.briefing.filter((r) => r.ID !== offer.ID),
                    });
                    setSelected("");
                  }}
                  className="text-[10px] font-bold text-slate-500 disabled:opacity-40"
                >
                  Descartar rascunho
                </button>
              )}
            </div>
            <div className="my-2 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
              <b>Usos da oferta</b>
              <p>
                {uses.length
                  ? uses
                      .map(
                        (m) =>
                          `${m.VERSAO} · ${poolGroupLabel(m.GRUPO)} · ${m.CELULA} · P${m.POSICAO}${m.ATIVA.toLowerCase() === "true" ? "" : " · inativa"}`,
                      )
                      .join(" / ")
                  : "Sem vínculo em vitrines."}
              </p>
              <p className="mt-1">
                A gravação compartilhada versiona os e-mails Visa e pode exigir
                nova conferência, inclusive em outras campanhas.
              </p>
            </div>
            <label className="text-xs">
              <input
                type="checkbox"
                checked={offer.ATIVA.toLowerCase() === "true"}
                onChange={(e) =>
                  update("ATIVA", e.target.checked ? "True" : "False")
                }
                className="mr-2"
              />
              Oferta ativa
            </label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {Object.entries(fields).map(([key, label]) => (
                <label
                  key={key}
                  className={`text-[10px] font-semibold text-slate-500 ${key === "CONDICOES" ? "sm:col-span-2" : ""}`}
                >
                  {label}
                  {["LOGO", "FOTO"].includes(key) && assets.length > 0 && (
                    <select
                      aria-label={`Imagem salva para ${label}`}
                      className={fieldStyle}
                      value=""
                      onChange={(e) => {
                        const asset = assets.find(
                          (a) => a.id === e.target.value,
                        );
                        if (asset) update(key, asset.externalUrl);
                      }}
                    >
                      <option value="">Selecionar imagem da Biblioteca…</option>
                      {assets
                        .filter((a) => a.status !== "archived")
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  )}
                  {key === "CONDICOES" ? (
                    <textarea
                      aria-label={label}
                      rows={3}
                      className={fieldStyle}
                      value={offer[key]}
                      onChange={(e) => update(key, e.target.value)}
                    />
                  ) : key === "RESGATE" ? (
                    <select
                      aria-label={label}
                      className={fieldStyle}
                      value={offer[key]}
                      onChange={(e) => update(key, e.target.value)}
                    >
                      {["CUPOM", "PAGAR_COM_VISA", "LINK"].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      aria-label={label}
                      type={["INICIO", "FIM"].includes(key) ? "date" : "text"}
                      className={fieldStyle}
                      value={offer[key]}
                      onChange={(e) => update(key, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-xs text-slate-500">
            Selecione uma oferta para revisar conteúdo e usos.
          </div>
        )}
      </div>
    </fieldset>
  );
}
