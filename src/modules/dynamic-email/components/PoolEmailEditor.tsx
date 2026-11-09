import React, { useState } from "react";
import type { WorkspaceBriefing, EmailAsset } from "../domain/workspace";
import type { VdvData } from "./VaiDeVisaWorkspace";
import { VdvSampleControls } from "./VaiDeVisaWorkspace";
import {
  parseVdvBriefingCsv,
  parseVdvMovimentoCsv,
  vdvValidOffer,
  type VdvPreview,
  type VdvSample,
} from "../domain/vaiDeVisa";
import { poolGroups, poolGroupLabel } from "../domain/poolCreation";
import { PoolAudienceControls } from "./PoolAudienceControls";
import { PoolLandingPreview } from './PoolLandingPreview';
const input =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400";
const btn =
  "rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:border-cyan-300 disabled:opacity-30";
const labels: Record<string, string> = {
  ASSUNTO: "Assunto",
  PREHEADER: "Pré-cabeçalho",
  ASSUNTO_V2: "Assunto deste toque",
  PREHEADER_V2: "Pré-cabeçalho deste toque",
  SAUDACAO: "Saudação com nome",
  SAUDACAO_SEM_NOME: "Saudação sem nome",
  INTRO: "Texto de abertura",
  CARTAO_PADRAO: "Nome padrão do cartão",
  CTA: "Texto dos botões",
  TITULO_CONDICOES: "Título das condições",
  RODAPE_CONDICOES: "Rodapé de condições",
  INICIO: "Início",
  FIM: "Fim",
  HERO_IMG: "Imagem do hero",
  HERO_ALT: "Descrição da imagem",
  HERO_LINK: "Link do hero",
  NOME_CARTAO: "Nome do cartão no hero",
  COR_FUNDO: "Cor de fundo",
  COR_TEXTO: "Cor do texto",
  COR_TITULO: "Cor do título",
  COR_TEMA: "Cor do tema",
};
function Section({
  id,
  title,
  children,
  open = false,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details
      id={"eb-" + id}
      open={open}
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <summary className="cursor-pointer bg-slate-50/80 px-3 py-2 text-xs font-bold text-slate-800">
        {title}
      </summary>
      <div className="space-y-2 border-t border-slate-100 p-3">{children}</div>
    </details>
  );
}
export function PoolEmailEditor({
  row,
  data,
  onChange,
  sample,
  onSample,
  today,
  onDate,
  preview,
  onContext,
  onDuplicate,
  onAnnounce,
  assets,
  onLibrary,
  onReview,
}: {
  row: WorkspaceBriefing;
  data: VdvData;
  onChange: (data: VdvData) => void;
  sample: VdvSample;
  onSample: (s: VdvSample) => void;
  today: string;
  onDate: (d: string) => void;
  preview: VdvPreview;
  onContext: (s: string) => void;
  onDuplicate: () => void;
  onAnnounce: (s: string) => void;
  assets: EmailAsset[];
  onLibrary: () => void;
  onReview: () => void;
}) {
  const ctx = row.__editor!;
  const groups = poolGroups(data.movimento, ctx.contentVersion);
  const [editGroup, setEditGroup] = useState(() =>
    ["SEG-B", "GEN-A"].includes(sample.DS_CELULA_TESTE)
      ? "GENERICO"
      : sample.CD_GRUPO,
  );
  const [editCell, setEditCell] = useState("");
  const [heroId, setHeroId] = useState("");
  const group = groups.includes(editGroup) ? editGroup : (groups[0] ?? "");
  const cells = [
    ...new Set(
      data.movimento
        .filter((m) => m.VERSAO === ctx.contentVersion && m.GRUPO === group)
        .map((m) => m.CELULA),
    ),
  ];
  const cell = cells.includes(editCell) ? editCell : (cells[0] ?? "");
  const movement = data.movimento
    .map((r, index) => ({ r, index }))
    .filter(
      ({ r }) =>
        r.VERSAO === ctx.contentVersion &&
        r.GRUPO === group &&
        r.CELULA === cell,
    )
    .sort((a, b) => +a.r.POSICAO - +b.r.POSICAO);
  const theme = data.briefing.find(
    (r) =>
      r.TIPO === "TEMA" &&
      r.VERSAO === ctx.contentVersion &&
      r.ATIVA.toLowerCase() === "true",
  );
  const heroes = data.briefing.filter(
    (r) => r.TIPO === "HERO" && r.VERSAO === ctx.contentVersion,
  );
  const hero =
    heroes.find((r) => r.ID === heroId) ??
    heroes.find((r) => r.HERO === ctx.touch) ??
    heroes[0];
  const offers = data.briefing.filter((r) => r.TIPO === "OFERTA");
  const update = (
    table: keyof VdvData,
    index: number,
    key: string,
    value: string,
  ) =>
    onChange({
      ...data,
      [table]: data[table].map((r, i) =>
        i === index
          ? { ...r, [key]: value, __dirty: "true", __source: "gaas" }
          : r,
      ),
    });
  const field = (index: number, key: string) => {
    const r = data.briefing[index];
    return (
      <label
        key={key}
        className="block text-[10px] font-semibold text-slate-500"
      >
        {labels[key] ?? key}
        {key.endsWith("_V2") && !r[key] && (
          <span className="ml-2 text-cyan-700">Herda do E-mail 1</span>
        )}
        {["INTRO", "RODAPE_CONDICOES"].includes(key) ? (
          <textarea
            aria-label={labels[key]}
            rows={3}
            className={input}
            value={r[key]}
            onChange={(e) => update("briefing", index, key, e.target.value)}
          />
        ) : (
          <input
            aria-label={labels[key] ?? key}
            type={["INICIO", "FIM"].includes(key) ? "date" : "text"}
            className={input}
            value={r[key]}
            onChange={(e) => update("briefing", index, key, e.target.value)}
          />
        )}
      </label>
    );
  };
  const importCsv = async (table: keyof VdvData, file: File) => {
    try {
      const rows = (
        table === "briefing" ? parseVdvBriefingCsv : parseVdvMovimentoCsv
      )(await file.text());
      const key = (r: Record<string, string>) =>
        table === "briefing"
          ? r.ID
          : [r.VERSAO, r.GRUPO, r.CELULA, r.POSICAO].join("|");
      const incoming = rows.map((r) => ({
        ...r,
        __version:
          data[table].find((old) => key(old) === key(r))?.__version ?? "",
        __source: "import",
        __dirty: "true",
      }));
      onChange({
        ...data,
        [table]: [
          ...data[table].filter(
            (r) => !incoming.some((n) => key(n) === key(r)),
          ),
          ...incoming,
        ],
      });
      onAnnounce(
        `${rows.length} linhas importadas para revisão. Use Salvar briefing.`,
      );
    } catch (e) {
      onAnnounce(String(e));
    }
  };
  return (
    <div className="space-y-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">
          {ctx.campaignName}
          <span className="ml-2 text-[10px] font-normal text-slate-400">
            {ctx.contentVersion} · {ctx.touch}
          </span>
        </span>
        <button type="button" className={btn} onClick={onReview}>
          Comparar grupos e toques
        </button>
      </div>
      <PoolAudienceControls
        movimento={data.movimento}
        version={ctx.contentVersion}
        sample={sample}
        onChange={onSample}
        today={today}
        onDate={onDate}
      />
      <PoolLandingPreview data={data} sample={sample} today={today} version={ctx.contentVersion}/>
      {!theme && (
        <p role="alert" className="text-xs text-red-700">
          Tema ativo não encontrado. Importe o conteúdo da campanha.
        </p>
      )}
      {theme && (
        <Section id="vdv-envelope" title="Mensagem do toque" open>
          <p className="text-[10px] text-slate-500">
            {ctx.touch === "V2"
              ? "Campos vazios herdam o E-mail 1. Preencha para diferenciar este toque."
              : "Envelope compartilhado; o E-mail 2 pode sobrescrever assunto e pré-cabeçalho."}
          </p>
          {(ctx.touch === "V2"
            ? ["ASSUNTO_V2", "PREHEADER_V2"]
            : ["ASSUNTO", "PREHEADER"]
          ).map((f) => field(data.briefing.indexOf(theme), f))}
        </Section>
      )}
      {theme && (
        <Section id="vdv-intro" title="Saudação e abertura">
          <p className="text-[10px] text-cyan-800">
            Compartilhado pelos dois toques desta versão.
          </p>
          {["SAUDACAO", "SAUDACAO_SEM_NOME", "INTRO", "CARTAO_PADRAO"].map(
            (f) => field(data.briefing.indexOf(theme), f),
          )}
          <details>
            <summary className="cursor-pointer text-[11px] font-bold text-slate-500">
              Cores do tema
            </summary>
            <div className="grid grid-cols-2 gap-2">
              {["COR_FUNDO", "COR_TEXTO", "COR_TITULO", "COR_TEMA"].map((f) =>
                field(data.briefing.indexOf(theme), f),
              )}
            </div>
          </details>
        </Section>
      )}
      <Section
        id="vdv-offers"
        title={`Vitrine · ${poolGroupLabel(group)}`}
        open
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500">
            Até 3 ofertas válidas. Posições seguintes são reservas.
          </p>
          <button type="button" className={btn} onClick={onLibrary}>
            Abrir catálogo
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] font-semibold text-slate-500">
            Editar vitrine
            <select
              aria-label="Editar grupo da vitrine"
              className={input}
              value={group}
              onChange={(e) => {
                setEditGroup(e.target.value);
                setEditCell("");
              }}
            >
              {groups.map((g) => (
                <option key={g} value={g}>
                  {poolGroupLabel(g)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-semibold text-slate-500">
            Aplicação
            <select
              aria-label="Editar célula da vitrine"
              className={input}
              value={cell}
              onChange={(e) => setEditCell(e.target.value)}
            >
              {cells.map((c) => (
                <option key={c} value={c}>
                  {c === "TODAS" ? "Todas as células" : c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[10px] text-cyan-800">
          Vitrine carregada, compartilhada pelos dois toques. Editar aqui não
          troca o público da prévia. A rotação automática no SFMC ainda é
          proposta; esta composição vale até a DISPARO entrar em operação.
        </p>
        {movement.map(({ r, index }, order, all) => {
          const offer = offers.find((o) => o.ID === r.OFERTA_ID);
          return (
            <div
              key={r.POSICAO}
              className="rounded-lg border border-slate-200 p-2.5"
            >
              <div className="flex justify-between gap-2">
                <div className="flex items-center gap-2">
                  {offer?.LOGO && (
                    <img
                      src={offer.LOGO}
                      alt=""
                      className="h-7 w-10 object-contain"
                    />
                  )}
                  <div>
                    <b className="text-xs text-slate-800">
                      {+r.POSICAO > 3 ? "Reserva" : "Oferta"} {r.POSICAO} ·{" "}
                      {offer?.MARCA ?? r.OFERTA_ID}
                    </b>
                    <p className="text-[10px] text-slate-500">
                      {offer
                        ? [offer.PREFIXO, offer.VALOR, offer.SUFIXO]
                            .filter(Boolean)
                            .join(" ")
                        : "Não encontrada"}{" "}
                      ·{" "}
                      {offer && vdvValidOffer(offer, today)
                        ? "válida na data"
                        : "será pulada"}
                    </p>
                  </div>
                </div>
                <label className="whitespace-nowrap text-[10px] text-slate-500">
                  <input
                    type="checkbox"
                    checked={r.ATIVA.toLowerCase() === "true"}
                    onChange={(e) =>
                      update(
                        "movimento",
                        index,
                        "ATIVA",
                        e.target.checked ? "True" : "False",
                      )
                    }
                    className="mr-1"
                  />
                  Ativa
                </label>
              </div>
              <label className="mt-1 block text-[10px] text-slate-500">
                Selecionar oferta
                <select
                  aria-label={`Oferta da posição ${r.POSICAO}`}
                  className={input}
                  value={r.OFERTA_ID}
                  onChange={(e) =>
                    update("movimento", index, "OFERTA_ID", e.target.value)
                  }
                >
                  {!offer && (
                    <option value={r.OFERTA_ID}>
                      {r.OFERTA_ID} · não encontrada
                    </option>
                  )}
                  {offers.map((o) => (
                    <option key={o.ID} value={o.ID}>
                      {o.MARCA} · {o.VALOR} {o.SUFIXO}
                      {vdvValidOffer(o, today) ? "" : " · indisponível"}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2 flex gap-1">
                {[-1, 1].map((delta) => (
                  <button
                    type="button"
                    key={delta}
                    className={btn}
                    disabled={!all[order + delta]}
                    onClick={() => {
                      const other = all[order + delta];
                      onChange({
                        ...data,
                        movimento: data.movimento.map((m, i) =>
                          i === index
                            ? {
                                ...m,
                                OFERTA_ID: other.r.OFERTA_ID,
                                ATIVA: other.r.ATIVA,
                                __dirty: "true",
                                __source: "gaas",
                              }
                            : i === other.index
                              ? {
                                  ...m,
                                  OFERTA_ID: r.OFERTA_ID,
                                  ATIVA: r.ATIVA,
                                  __dirty: "true",
                                  __source: "gaas",
                                }
                              : m,
                        ),
                      });
                    }}
                  >
                    {delta < 0 ? "Subir" : "Descer"}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <p className="text-[10px] text-slate-500">
          Na prévia:{" "}
          {preview.cards.map((c) => c.marca).join(" · ") ||
            "sem ofertas válidas"}
          . {preview.diagnostics.join(" ")}
        </p>
      </Section>
      <Section id="vdv-hero" title="Identidade visual e heros">
        <p className="text-[10px] text-slate-500">
          B2C: persona no primeiro toque, cartão no segundo. Parceiro com arte
          usa sua identidade nos dois; sem arte, usa cartão.
        </p>
        <label className="text-[10px] font-semibold text-slate-500">
          Editar identidade
          <select
            aria-label="Editar identidade visual"
            className={input}
            value={hero?.ID ?? ""}
            onChange={(e) => setHeroId(e.target.value)}
          >
            {heroes.map((h) => (
              <option key={h.ID} value={h.ID}>
                {h.HERO}
              </option>
            ))}
          </select>
        </label>
        {hero && (
          <>
            {hero.HERO_IMG && (
              <img
                src={hero.HERO_IMG}
                alt={hero.HERO_ALT}
                className="max-h-24 w-full rounded-lg bg-slate-50 object-contain"
              />
            )}
            <label className="text-[10px] font-semibold text-slate-500">
              Imagem salva
              <select
                aria-label="Imagem salva para hero"
                className={input}
                value=""
                onChange={(e) => {
                  const a = assets.find((a) => a.id === e.target.value);
                  if (a)
                    onChange({
                      ...data,
                      briefing: data.briefing.map((r) =>
                        r.ID === hero.ID
                          ? {
                              ...r,
                              HERO_IMG: a.externalUrl,
                              HERO_ALT: a.altText || r.HERO_ALT,
                              __dirty: "true",
                              __source: "gaas",
                            }
                          : r,
                      ),
                    });
                }}
              >
                <option value="">Selecionar na Biblioteca…</option>
                {assets
                  .filter((a) => a.status !== "archived")
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
              </select>
            </label>
            {["HERO_IMG", "HERO_ALT", "HERO_LINK", "NOME_CARTAO"].map((f) =>
              field(data.briefing.indexOf(hero), f),
            )}
            <label className="text-xs text-slate-600">
              <input
                type="checkbox"
                checked={hero.ATIVA.toLowerCase() === "true"}
                onChange={(e) =>
                  update(
                    "briefing",
                    data.briefing.indexOf(hero),
                    "ATIVA",
                    e.target.checked ? "True" : "False",
                  )
                }
                className="mr-1"
              />
              Identidade ativa
            </label>
          </>
        )}
      </Section>
      {theme && (
        <Section id="vdv-conditions" title="Botões, vigência e condições">
          <p className="text-[10px] text-cyan-800">
            Compartilhado pelos dois toques.
          </p>
          {["CTA", "TITULO_CONDICOES", "RODAPE_CONDICOES", "INICIO", "FIM"].map(
            (f) => field(data.briefing.indexOf(theme), f),
          )}
        </Section>
      )}
      <Section id="vdv-sample" title="Identidade da amostra e diagnóstico">
        <VdvSampleControls
          sample={sample}
          onChange={onSample}
          today={today}
          onDateChange={onDate}
          preview={preview}
        />
      </Section>
      <Section id="vdv-context" title="Configuração e importação">
        <label className="text-[10px] font-semibold text-slate-500">
          Nome da campanha
          <input
            aria-label="Campanha Visa"
            className={input}
            value={ctx.campaignName}
            onChange={(e) => onContext(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={onDuplicate}>
            Duplicar campanha
          </button>
          {(["briefing", "movimento"] as const).map((table) => (
            <label key={table} className={`${btn} cursor-pointer`}>
              Importar {table === "briefing" ? "conteúdo" : "vitrine"}
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0])
                    void importCsv(table, e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}
