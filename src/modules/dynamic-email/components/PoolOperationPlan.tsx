import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import operation from "../fixtures/visaOperation.json";
import type { RulerStrategy } from "../domain/workspace";
const wikiHref = (path: string) =>
  `?view=learning&section=vault&wiki_path=${encodeURIComponent(path)}`;
function Source({
  path,
  label = "Abrir fonte na Wiki",
}: {
  path: string;
  label?: string;
}) {
  return (
    <a
      href={wikiHref(path)}
      target="_blank"
      rel="noreferrer"
      className="text-[10px] font-semibold text-cyan-800 hover:underline"
    >
      {label}
    </a>
  );
}
function Markdown({ text }: { text: string }) {
  const linked = text.replace(/\[\[([^\]]+)\]\]/g, (_, raw: string) => {
    const [target, label] = raw.replace(/\\\|/g, "|").split("|");
    return `[${label || target}](${wikiHref(target)})`;
  });
  return (
    <div className="space-y-2 text-xs leading-5 text-slate-600">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-cyan-800 hover:underline"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-slate-200 bg-slate-50 p-2 text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-slate-200 p-2 align-top">
              {children}
            </td>
          ),
          ul: ({ children }) => (
            <ul className="list-disc space-y-1 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal space-y-1 pl-4">{children}</ol>
          ),
        }}
      >
        {linked}
      </ReactMarkdown>
    </div>
  );
}
export function PoolOperationPlan({ rulers }: { rulers: RulerStrategy[] }) {
  const ruler = rulers.find(
    (r) => r.partner === "Afinz Visa" && r.businessFront === "monetization",
  );
  return (
    <details className="rounded-xl border border-slate-200 bg-white">
      <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-800">
        Estratégia da régua e operação no SFMC{" "}
        <span className="ml-2 text-[10px] font-normal text-slate-400">
          Públicos · rotação · automações · SQLs
        </span>
      </summary>
      <div className="space-y-3 border-t border-slate-100 p-3 text-xs leading-5 text-slate-600">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-3">
            <b className="text-slate-900">Objetivo da régua</b>
            <p>
              {ruler?.objective ??
                "Aumentar o uso do cartão Afinz Visa com ofertas dos parceiros da bandeira."}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {ruler
                ? `Estado editorial: ${ruler.editorialStatus}`
                : "Cadastro editorial aguarda aprovação e aplicação da migration."}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <b className="text-slate-900">BU do SFMC: Banco Afinz</b>
            <p>
              BU pai, inferência forte. MID a confirmar. Públicos de negócio B2C
              e B2B2C na fase 1; Plurix previsto para fase 2.
            </p>
            <details className="mt-1">
              <summary className="cursor-pointer text-[10px] font-semibold text-cyan-800">
                Evidência e localização
              </summary>
              <Markdown text={operation.buEvidence} />
              <Source path={operation.source} />
            </details>
          </div>
        </div>
        {ruler && (
          <details className="rounded-lg border border-slate-200 p-2">
            <summary className="cursor-pointer font-bold text-slate-800">
              Intenção editorial da régua
            </summary>
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                ["Público", ruler.audience],
                ["Transformação narrativa", ruler.narrativeTransformation],
                ["Objeções", ruler.objections.join(" · ")],
                ["Intensidade comercial", ruler.commercialIntensity],
                ["Critério de sucesso", ruler.successCriteria],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-bold text-slate-400">
                    {label}
                  </dt>
                  <dd>{value || "A definir"}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        <details className="rounded-lg border border-slate-200 p-2">
          <summary className="cursor-pointer font-bold text-slate-800">
            Grupos de compradores e células do teste
          </summary>
          <p className="mt-2">
            Estratégia completa: Moda, Saúde e Beleza, Eletrodomésticos,
            Eletrônicos, Brinquedos, Viagem, Pet e Genérico. Recorte atual:
            MODA, SAUDE_BELEZA, FAMILIA_PRESENTES (afinidade de Brinquedos) e
            GENERICO.
          </p>
          <p>
            SEG-A: 45% recebe afinidade; SEG-B: 45% recebe genérico; SEG-C: 10%
            sem envio. Genérico: GEN-A 90% recebe e GEN-C 10% fica sem envio.
            Grupo e célula são congelados por safra.
          </p>
          <p>
            A versão rodando classifica por compras, gasto e prioridade. A
            proposta da Q04 adiciona prioridade para FAMILIA_PRESENTES e safra
            dinâmica; ainda não foi testada.
          </p>
          <p className="mt-1">
            Resultado: compra na oferta/categoria até 30 dias e SEG-A menos
            SEG-B dentro do grupo. Abertura e clique são diagnósticos.
          </p>
          <Source path="02-Entidades-Dados/SFMC/DE-VDV_APTOS.md" />
        </details>
        <details className="rounded-lg border border-slate-200 p-2">
          <summary className="cursor-pointer font-bold text-slate-800">
            Rotação das ofertas · decisões e regra proposta
          </summary>
          <div className="mt-2 space-y-3">
            <Markdown text={operation.rotationDecisions} />
            <div className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-900">
              Cadência e rotação por grupo são decisões registradas. A automação
              DISPARO e seus SQLs ainda são proposta. Divisão 2 do grupo + 1
              descoberta permanece aberta.
            </div>
            <Markdown text={operation.rotationRule} />
            <Markdown text={operation.rotationLimits} />
            <Source path={operation.rotationSource} />
          </div>
        </details>
        <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3">
          <b className="text-cyan-950">Fluxo documentado</b>
          <p>PREPARAÇÃO: 02 → 03 → 04 → 06 rodando. Import 01 a incluir.</p>
          <p>
            DISPARO, proposta: preparação → 05 → 08 → 09 → 10 → 06 → envio, duas
            vezes por semana, dias a definir. Substitui a antiga CONGELAR.
          </p>
          <p className="mt-1 text-[10px]">
            A prévia usa a vitrine carregada na Fábrica. Não recalcula nem
            comprova a rotação automática do SFMC.
          </p>
        </div>
        {operation.steps.map((step) => (
          <details key={step.id} className="rounded-lg border border-slate-200">
            <summary className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2">
              <span className="font-bold text-slate-800">
                {step.number} · {step.title}
                <span className="ml-2 text-[10px] font-normal text-slate-400">
                  {step.id}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${step.status === "rodando" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}
              >
                {step.status === "proposta"
                  ? "Proposta · não testado"
                  : step.status === "rodando"
                    ? "Rodando · versão documentada"
                    : "A incluir"}
              </span>
            </summary>
            <div className="space-y-2 border-t border-slate-100 p-3">
              <p>
                <b>Destino:</b> {step.target} · <b>Ação:</b> {step.action}
              </p>
              <p>{step.description}</p>
              {step.currentSql.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-[11px] font-bold text-cyan-800">
                    SQL da versão documentada e conferências
                  </summary>
                  {step.currentSql.map((sql, i) => (
                    <pre
                      key={i}
                      className="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-4 text-slate-100"
                    >
                      {sql}
                    </pre>
                  ))}
                </details>
              )}
              {step.proposalSql.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-[11px] font-bold text-amber-800">
                    SQL proposto · não testado no SFMC
                  </summary>
                  {step.proposalSql.map((sql, i) => (
                    <pre
                      key={i}
                      className="mt-2 max-h-80 overflow-auto rounded-lg bg-slate-950 p-3 text-[10px] leading-4 text-slate-100"
                    >
                      {sql}
                    </pre>
                  ))}
                  <Source path={step.proposalSource} />
                </details>
              )}
              <Source path={step.source.split(";")[0]} />
            </div>
          </details>
        ))}
        <details className="rounded-lg border border-slate-200 p-2">
          <summary className="cursor-pointer font-bold text-slate-800">
            Pré-requisitos e ordem de implantação proposta
          </summary>
          <div className="mt-2 space-y-3">
            <Markdown text={operation.requirements} />
            <Markdown text={operation.execution} />
            <Source path={operation.source} />
          </div>
        </details>
        <details className="rounded-lg border border-amber-200 bg-amber-50 p-2">
          <summary className="cursor-pointer font-bold text-amber-900">
            Decisões abertas · itens 21 a 29
          </summary>
          <ol className="mt-2 space-y-2">
            {operation.decisions.map((d) => (
              <li key={d.number}>
                <b>{d.number}.</b> <Markdown text={d.text} />
                <Source path={d.source} label="Consultar decisão na Wiki" />
              </li>
            ))}
          </ol>
        </details>
        <div className="flex flex-wrap gap-3">
          <Source
            path="02-Entidades-Dados/SFMC/MOC-SFMC-DEs-e-Automations.md"
            label="Mapa das DEs e automações"
          />
          <Source
            path="04-Operacao/Plano-de-Comunicacao-Pool-Vai-de-Visa.md"
            label="Fonte do plano editorial"
          />
        </div>
        <p className="text-[10px] text-slate-400">
          Referência documental em {operation.sourceDate}, sem consulta em tempo
          real ao tenant. Nenhum SQL é executado pelo GaaS. Plano, Ficha e
          regras propostos continuam rascunhos para revisão.
        </p>
      </div>
    </details>
  );
}
