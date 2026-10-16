import { z } from "zod";
import {
  BRIEFING_COLUMNS,
  emptyBriefingRow,
  type BriefingColumn,
} from "./briefing";
import { renderContentBlocks, validateBlockText } from "./contentBlocks";
import { validateLimitMessage } from "./limitMessage";
import { PLURIX_SIGNATURES, type WorkspaceBriefing } from "./workspace";
import type { ProductContext, ProductGuardrail } from "./management";
import {
  importPayloadSchema,
  importKeyFor,
  type ExpandedImportRow,
  type ImportProblem,
} from "./xlsxImport";

export const EMAIL_INPUT_CONTRACT = "gaas-emails-input/1";
const text = z.string().max(4000);
const item = z.object({ title: text, text });
export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("lead"), text }),
  z.object({ type: z.literal("closing"), text }),
  z.object({
    type: z.literal("benefit_grid"),
    items: z
      .array(item)
      .min(2)
      .refine(
        (items) => items.length % 2 === 0,
        "A grade exige um número par de itens.",
      ),
  }),
  z.object({ type: z.literal("steps"), items: z.array(item).min(1) }),
  z.object({ type: z.literal("check_list"), items: z.array(text).min(1) }),
  z.object({
    type: z.literal("stat_tiles"),
    items: z
      .array(z.object({ number: text, label: text }))
      .min(2)
      .max(3),
  }),
]);
// O contrato XLSX continua sendo a fonte da proveniência e das pendências.
const legacyTouch = importPayloadSchema.shape.touches.element;
const inputFields = z.record(z.string(), legacyTouch.shape.shared.valueType);
export const emailInputSchema = z.object({
  contract: z.literal(EMAIL_INPUT_CONTRACT),
  status: z.literal("draft"),
  generatedBy: z.object({
    tool: z.enum(["claude", "chatgpt", "outro"]),
    model: z.string().min(1),
    generatedAt: z.iso.datetime({ offset: true }),
  }),
  source: z.object({
    kind: z.enum(["conversa", "planilha"]),
    file: z.string().optional(),
    sha256: z
      .string()
      .regex(/^[0-9a-f]{64}$/)
      .optional(),
  }),
  ruler: z.object({
    segment: z.string().min(1),
    partner: z.string().min(1),
    tpCampanha: z.string().min(1),
    templateSlotId: z.string().min(1),
  }),
  emails: z
    .array(
      z.object({
        sequence: z.string().regex(/^E-mail [1-9]\d*$/),
        weekKey: z.string().regex(/^Semana [1-9]\d*$/),
        fields: inputFields,
        /** Opcional em e-mail que já existe: ausente, o GaaS mantém o segundo bloco atual. */
        secondBlock: z.array(contentBlockSchema).min(1).optional(),
        networkOverrides: z.record(z.string(), inputFields).optional(),
        factsUsed: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  pendencies: importPayloadSchema.shape.pendencies,
});
export type EmailInput = z.infer<typeof emailInputSchema>;
export const emailInputJsonSchema = () =>
  z.toJSONSchema(emailInputSchema, { unrepresentable: "any" });
export const isGovernedField = (field: string) =>
  /^(LINK_|COR_|TAMANHO_)/.test(field) ||
  [
    "UTM_CAMPANHA",
    "BANNER_3_CORPO",
    "NOTA_LEGAL",
    "RODAPE",
    "HEADER_LOGO",
    "CARTAO_NM_COMERCIAL",
    "DT_FIM",
    "template_slot_id",
  ].includes(field);
/** Condicional que derruba a venda numa chamada (assunto, header, botões...). */
const HEDGES = /\bse (?:for )?aprovad|\bcaso (?:seja )?aprovad|sujeit[oa] a|\bmediante\b|\bpode ser que\b/i;
export const NETWORK_PLACE: Record<string, string> = {
  AMIGAO: "no Amigão",
  AVENIDA: "no Avenida",
  BOA: "no Boa",
  PARANA: "no Paraná",
  "COMPRE MAIS": "no seu supermercado",
  SUPERPAO: "no seu supermercado",
};
export const normalizeFactText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const normalize = normalizeFactText;
/** Abertura da faixa de limite ("Boa notícia", "Ainda dá tempo"): não se repete na régua. */
export const limitOpening = (message: string) => normalize(message.split(",")[0] ?? "");
/**
 * Texto da ficha de produto e dos guardrails liberados, normalizado. Todo fato citado
 * (factsUsed, números com % ou "dias") precisa aparecer aqui. O pacote exportado leva
 * o mesmo texto, para a IA conferir antes de entregar.
 */
export function productFacts(products: ProductContext[], allGuardrails: ProductGuardrail[], partner: string) {
  const activeProducts = products.filter(
    (p) => p.status === "active" && (!p.partner || p.partner === partner),
  );
  const guardrails = allGuardrails.filter(
    (g) => g.status === "active" && activeProducts.some((p) => p.id === g.productContextId),
  );
  const corpus = normalize(
    activeProducts
      .map((p) => [p.valueProposition, ...p.differentiators, p.brandContext].join(" "))
      .join(" ") +
      " " +
      guardrails
        .filter((g) => g.allowedStatus !== "blocked" && g.guardrailType !== "prohibited" && g.citationStatus !== "nao")
        .map((g) => [g.title, g.ruleText, g.valueExact].join(" "))
        .join(" "),
  );
  return { corpus, guardrails, products: activeProducts };
}
const sequenceNumber = (s: string) => Number(s.replace("E-mail ", ""));
/** O dia é a posição do e-mail na semana (duas mensagens/semana na V2). */
export function inheritEmailCode(
  value: string,
  sequence: number,
  week: number,
  day = ((sequence - 1) % 2) + 1,
): string {
  return value
    .replace(/S\d+D\d+/g, `S${week}D${String(day).padStart(2, "0")}`)
    .replace(/_EMAIL\d+_/g, `_EMAIL${sequence}_`);
}
export interface EmailInputContext {
  briefings: WorkspaceBriefing[];
  products: ProductContext[];
  guardrails: ProductGuardrail[];
}
export interface EmailInputResult {
  payload?: EmailInput;
  rows: ExpandedImportRow[];
  problems: ImportProblem[];
  filled: Array<{ where: string; field: string; source: string }>;
}
export function prepareEmailInput(
  input: unknown,
  context: EmailInputContext,
): EmailInputResult {
  const parsed = emailInputSchema.safeParse(input);
  if (!parsed.success)
    return {
      rows: [],
      filled: [],
      problems: parsed.error.issues.map((issue) => ({
        severity: "error",
        where: issue.path.join("."),
        message: issue.message,
      })),
    };
  const payload = parsed.data;
  const problems: ImportProblem[] = [];
  const rows: ExpandedImportRow[] = [];
  const filled: EmailInputResult["filled"] = [];
  const current = context.briefings.filter(
    (row) =>
      row.__meta.partner === payload.ruler.partner &&
      row.__meta.segment === payload.ruler.segment &&
      row.__meta.status !== "archived",
  );
  if (!current.length)
    problems.push({
      severity: "error",
      where: "ruler",
      message:
        "A régua precisa existir no GaaS para fornecer os campos governados.",
    });
  if (
    current.some(
      (row) =>
        row.TP_CAMPANHA !== payload.ruler.tpCampanha ||
        row.__meta.templateSlotId !== payload.ruler.templateSlotId,
    )
  )
    problems.push({
      severity: "error",
      where: "ruler",
      message: "Campanha ou template não coincide com a régua do GaaS.",
    });
  const { corpus: allowed, guardrails } = productFacts(context.products, context.guardrails, payload.ruler.partner);
  const seen = new Set<string>();
  const emails = [...payload.emails].sort(
    (a, b) => sequenceNumber(a.sequence) - sequenceNumber(b.sequence),
  );
  for (const email of emails) {
    const n = sequenceNumber(email.sequence);
    const week = Number(email.weekKey.replace("Semana ", ""));
    let second = "";
    try {
      second = email.secondBlock ? renderContentBlocks(email.secondBlock) : "";
    } catch (error) {
      problems.push({
        severity: "error",
        where: `${email.sequence}.secondBlock`,
        message: String(error),
      });
    }
    if (
      emails.some(
        (other) => other !== email && other.sequence === email.sequence,
      )
    )
      problems.push({
        severity: "error",
        where: email.sequence,
        message: "Sequência duplicada.",
      });
    for (const network of Object.keys(email.networkOverrides ?? {}))
      if (!PLURIX_SIGNATURES.some((s) => s.key === network))
        problems.push({
          severity: "error",
          where: `${email.sequence}.${network}`,
          message: "Rede desconhecida.",
        });
    const before = emails.find((e) => sequenceNumber(e.sequence) === n - 1);
    if (
      before &&
      before.secondBlock &&
      email.secondBlock &&
      before.secondBlock.map((b) => b.type).join("|") ===
        email.secondBlock.map((b) => b.type).join("|")
    )
      problems.push({
        severity: "warning",
        where: email.sequence,
        message: "Segundo bloco repete o formato do e-mail anterior.",
      });
    const earlierInWeek = new Set([
      ...current.filter(r => r.__meta.weekKey === email.weekKey && sequenceNumber(r.SEQUENCIA) < n).map(r => r.SEQUENCIA),
      ...emails.filter(e => e.weekKey === email.weekKey && sequenceNumber(e.sequence) < n).map(e => e.sequence),
    ]);
    const day = earlierInWeek.size + 1;
    for (const { key: network } of PLURIX_SIGNATURES) {
      const where = `${email.sequence}.${network}`;
      const existing = current.find(
        (row) =>
          row.SEQUENCIA === email.sequence &&
          row.NM_PRODUTO_INTERNO === network,
      );
      const predecessor =
        rows.find(
          (row) =>
            row.sequence === `E-mail ${n - 1}` && row.network === network,
        )?.row ??
        current.find(
          (row) =>
            row.SEQUENCIA === `E-mail ${n - 1}` &&
            row.NM_PRODUTO_INTERNO === network,
        );
      // E-mail que já existe parte dele mesmo (links e assinatura aprovados não mudam);
      // e-mail novo parte do E-mail N-1 da mesma rede e troca o código do e-mail.
      const base = existing ?? predecessor;
      if (!base) {
        problems.push({
          severity: "error",
          where,
          message:
            "Não há rascunho do e-mail anterior nesta rede para herdar os campos governados.",
        });
        continue;
      }
      const row = {
        ...emptyBriefingRow(),
        ...base,
        __id: existing?.__id ?? crypto.randomUUID(),
      };
      const provenance: ExpandedImportRow["provenance"] = {};
      const fields = { ...email.fields, ...email.networkOverrides?.[network] };
      for (const [field, data] of Object.entries(fields)) {
        if (!data) continue;
        if (isGovernedField(field) || field === "COPY_2_PRETO") {
          problems.push({
            severity: "warning",
            where: `${where}.${field}`,
            message:
              "Valor enviado descartado; preenchimento governado pelo GaaS.",
          });
          continue;
        }
        if (!(BRIEFING_COLUMNS as readonly string[]).includes(field)) {
          problems.push({
            severity: "error",
            where: `${where}.${field}`,
            message: "Campo editorial desconhecido.",
          });
          continue;
        }
        if (field === "TP_CAMPANHA" && data.value !== payload.ruler.tpCampanha)
          problems.push({
            severity: "error",
            where: `${where}.${field}`,
            message: "TP_CAMPANHA diverge da régua.",
          });
        const value = data.value
          .replace(/%%PRI_NOME%%|\bPRI_NOME\b/g, "%%=v(@FirstName)=%%")
          .split("{no_mercado}")
          .join(NETWORK_PLACE[network]);
        try {
          validateBlockText(value);
        } catch (error) {
          problems.push({
            severity: "error",
            where: `${where}.${field}`,
            message: String(error),
          });
        }
        if (
          /%%INVESTIDA%%/i.test(value) ||
          /compre\s*mais|super\s*pao/.test(normalize(value))
        )
          problems.push({
            severity: "error",
            where: `${where}.${field}`,
            message: "Nome de rede proibido ou marcador INVESTIDA no conteúdo.",
          });
        if (/%%/.test(value.split("%%=v(@FirstName)=%%").join("")))
          problems.push({
            severity: "error",
            where: `${where}.${field}`,
            message: "Personalização não permitida.",
          });
        row[field as BriefingColumn] = value;
        provenance[field as BriefingColumn] = {
          origin: data.origin,
          source: data.source,
          justification: data.justification,
        };
      }
      if (email.secondBlock) {
        provenance.COPY_2_PRETO = {origin:'inferred',source:'JSON secondBlock',justification:'HTML gerado pelo catálogo governado de blocos do GaaS.'};
        row.COPY_2_PRETO = second
          .split("{no_mercado}")
          .join(NETWORK_PLACE[network]);
      } else if (!existing) {
        problems.push({
          severity: "error",
          where: `${where}.secondBlock`,
          message: "E-mail novo precisa do segundo bloco (secondBlock).",
        });
      }
      if (
        /compre\s*mais|super\s*pao/.test(normalize(row.COPY_2_PRETO)) ||
        row.COPY_2_PRETO.includes("%%INVESTIDA%%")
      )
        problems.push({
          severity: "error",
          where: `${where}.secondBlock`,
          message: "Nome de rede proibido no segundo bloco.",
        });
      if (Array.from(row.COPY_2_PRETO).length > 4000)
        problems.push({
          severity: "error",
          where: `${where}.COPY_2_PRETO`,
          message: "Bloco renderizado excede 4000 caracteres.",
        });
      row.TP_CAMPANHA = payload.ruler.tpCampanha;
      row.SEQUENCIA = email.sequence;
      row.NM_PRODUTO_INTERNO = network;
      // Links, UTM, assinatura e textos legais: o e-mail existente mantém os dele; o novo herda
      // do E-mail N-1 trocando S{semana}D{dia} e _EMAIL{n}_. Cores e tamanhos seguem o padrão
      // visual da régua (E-mail N-1) quando ele existe.
      for (const field of BRIEFING_COLUMNS.filter(isGovernedField)) {
        const style = /^(COR_|TAMANHO_)/.test(field);
        const from = style ? predecessor ?? base : base;
        row[field] = !existing && /^(LINK_|UTM_CAMPANHA)/.test(field) ? inheritEmailCode(from[field], n, week, day) : from[field];
        provenance[field] = { origin: "governed", source: `GaaS ${from.__id}` };
        filled.push({ where, field, source: from === existing ? `mantido de ${email.sequence} / ${network}` : `herdado de ${from.SEQUENCIA} / ${network}` });
      }
      for (const [field, max] of [
        ["ASSUNTO", 50],
        ["PRE_CABECALHO", 90],
        ["HEADER_TITULO", 34],
        ["HEADER_SUBTITULO", 60],
      ] as const)
        if (Array.from(row[field]).length > max)
          problems.push({
            // Tamanho é risco de layout (quebra de linha), não erro técnico: o analista decide.
            severity: "warning",
            where: `${where}.${field}`,
            message: `Passa de ${max} caracteres (${Array.from(row[field]).length}); confira a quebra na prévia.`,
          });
      if (/FirstName|\{\{nome\}\}|PRI_NOME/i.test(row.ASSUNTO))
        problems.push({
          severity: "error",
          where: `${where}.ASSUNTO`,
          message: "Assunto não pode conter o nome da pessoa.",
        });
      for (const field of ["ASSUNTO", "PRE_CABECALHO", "HEADER_TITULO", "HEADER_SUBTITULO", "MENSAGEM_LIMITE", "TITULO_COPY_1_AZUL", "TITULO_COPY_2", "TITULO_CTA_1", "TITULO_CTA_2"] as const)
        if (fields[field] && HEDGES.test(row[field] ?? ""))
          problems.push({
            severity: "warning",
            where: `${where}.${field}`,
            message: 'Chamada hesitante ("se aprovado", "sujeito a"): a condição vai uma vez no corpo; a nota legal já cobre.',
          });
      if (!/FirstName|\{\{nome\}\}|PRI_NOME/i.test(row.ASSUNTO) && /amig[aã]o|avenida|paran[aá]|compre mais|superp[aã]o/i.test(row.ASSUNTO))
        problems.push({
          severity: "warning",
          where: `${where}.ASSUNTO`,
          message: "Assunto cita a rede; o mesmo assunto vale para as 6 assinaturas.",
        });
      for (const field of ["TITULO_CTA_1", "TITULO_CTA_2"] as const)
        if (
          row[field] &&
          (row[field] !== row[field].toLocaleUpperCase("pt-BR") ||
            !/^(PEÇA|PEDIR|SOLICITE|SOLICITAR|CONFIRA|CONFERIR|APROVEITE|APROVEITAR|CONHEÇA|CONHECER|ACESSE|ACESSAR|DESCUBRA|DESCOBRIR|VEJA|COMECE|SAIBA|QUERO|FAÇA|BAIXE|ATIVE)\b/u.test(
              row[field],
            ))
        )
          problems.push({
            severity: "error",
            where: `${where}.${field}`,
            message: "Botão deve começar com verbo e estar em caixa alta.",
          });
      if (
        row.MENSAGEM_LIMITE &&
        !/^[^,:]+, \{\{nome\}\}: .+/.test(row.MENSAGEM_LIMITE)
      )
        problems.push({
          severity: "error",
          where: `${where}.MENSAGEM_LIMITE`,
          message: "Use Abertura, {{nome}}: …",
        });
      for (const issue of validateLimitMessage(row.MENSAGEM_LIMITE))
        problems.push({
          severity: issue.code === "limit-promise" ? "error" : issue.severity,
          where: `${where}.MENSAGEM_LIMITE`,
          message: issue.message,
        });
      // A saudação ("Boa notícia", "Ainda dá tempo"...) muda a cada e-mail da régua.
      const opening = limitOpening(row.MENSAGEM_LIMITE);
      if (
        opening &&
        (current.some(
          (other) =>
            other.SEQUENCIA !== email.sequence &&
            !emails.some((e) => e.sequence === other.SEQUENCIA) &&
            limitOpening(other.MENSAGEM_LIMITE) === opening,
        ) ||
          emails.some(
            (other) =>
              other !== email &&
              limitOpening(other.fields.MENSAGEM_LIMITE?.value ?? "") === opening,
          ))
      )
        problems.push({
          severity: "error",
          where: `${where}.MENSAGEM_LIMITE`,
          message: "Saudação da faixa já usada em outro e-mail da régua.",
        });
      const supplied = normalize(
        Object.entries(fields)
          .filter(([field]) => !isGovernedField(field))
          .map(([, data]) => data?.value ?? "")
          .join(" ") +
          " " +
          JSON.stringify(email.secondBlock),
      );
      const facts = new Set([
        ...email.factsUsed,
        ...(supplied.match(/\d+(?:[.,]\d+)?\s*(?:%|dias\b)/g) ?? []),
      ]);
      for (const fact of facts)
        if (!allowed.includes(normalize(fact)))
          problems.push({
            severity: "error",
            where: `${where}.factsUsed`,
            message: `Fato sem respaldo na ficha de produto: ${fact}`,
          });
      for (const g of guardrails.filter(
        (g) =>
          g.allowedStatus === "blocked" || g.guardrailType === "prohibited",
      ))
        if (g.valueExact && supplied.includes(normalize(g.valueExact)))
          problems.push({
            severity: "error",
            where,
            message: `Guardrail: ${g.title}`,
          });
      const importKey = importKeyFor(
        payload.ruler.segment,
        email.sequence,
        network,
      );
      if (seen.has(importKey)) continue;
      seen.add(importKey);
      rows.push({
        importKey,
        sequence: email.sequence,
        weekKey: email.weekKey,
        network,
        row,
        provenance,
      });
    }
  }
  for (const p of payload.pendencies)
    problems.push({
      severity: p.severity === "blocker" ? "error" : "warning",
      where: `${p.scope}.${p.field ?? ""}`,
      message: p.message,
    });
  return { payload, rows, problems, filled };
}
