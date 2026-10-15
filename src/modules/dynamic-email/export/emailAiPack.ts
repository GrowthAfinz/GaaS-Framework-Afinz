import {
  buildAiContextMarkdown,
  sanitizeAiPackText,
  type AiContextMarkdownInput,
} from "./aiContextMarkdown";
import { emailInputJsonSchema } from "../domain/emailInput";
import fixture from "../fixtures/input_gaas_emails_v2_topo_20261015.json";
import { renderDynamicEmail } from "../ampscript/renderer";
import { prepareEmailInput } from "../domain/emailInput";
export const AI_PACK_SCHEMA_VERSION = 1;
export interface EmailAiPackOptions {
  scope: "skill" | "rulers" | "both";
  rulers: string[];
  includeTemplateSource: boolean;
}
export function buildEmailAiPack(
  context: Omit<AiContextMarkdownInput, "scope" | "generatedAt">,
  options: EmailAiPackOptions,
) {
  const selected = context.briefings.filter(
    (r) =>
      options.rulers.includes(`${r.__meta.partner}|${r.__meta.segment}`) &&
      r.__meta.status !== "archived",
  );
  const source = buildAiContextMarkdown({
    ...context,
    generatedAt: new Date().toISOString(),
    scope: { kind: "all" },
    briefings: options.scope === "skill" ? [] : selected,
    rulers: context.rulers.filter((r) =>
      selected.some(
        (b) => b.__meta.partner === r.partner && b.__meta.segment === r.segment,
      ),
    ),
    emailStrategies: context.emailStrategies.filter((s) =>
      selected.some((b) => b.__meta.campaignGroupId === s.campaignGroupId),
    ),
    reviewRuns: [],
    reviewSuggestions: [],
    includeTemplateSource: options.includeTemplateSource,
  });
  // Exemplo didático separado do conteúdo histórico: nenhuma alteração no banco ou fixture.
  const example = structuredClone(fixture);
  example.emails = example.emails.filter(e => e.sequence === 'E-mail 4');
  example.emails[0].fields.HEADER_TITULO.value = 'Vantagens com o cartão +amigo';
  const instructions = `# Pacote Prompt e IA · versão ${AI_PACK_SCHEMA_VERSION}

## Papel e fluxo
Você escreve e-mails de aquisição em português do Brasil para o analista de marketing.
Escreva → mostre uma prévia desktop (600px) e celular (375px) → ajuste → só depois de receber "aprovado", gere o JSON final.
Entregue input_gaas_emails_<segmento>_<AAAAMMDD>.json. Toda importação é draft.
Se não conseguir renderizar a prévia, entregue o JSON para a prévia na importação do GaaS e deixe a aprovação pendente.

## Marca e produto
Use apenas os benefícios da ficha e dos guardrails abaixo. Pré-aprovação é sujeita a análise de crédito.
Nunca cite Compre Mais nem Superpão no conteúdo. Use {no_mercado}: Amigão, Avenida, Boa e Paraná recebem o nome da rede; as duas redes em transição recebem "no seu supermercado".
Não use %%INVESTIDA%%. Nome da pessoa somente como %%=v(@FirstName)=%%. PRI_NOME será convertido.
Não invente percentuais, prazos, elegibilidade ou benefícios. Declare os fatos em factsUsed e as lacunas em pendencies.

## Campos editoriais e governados
Escreva assunto (até 50), pré-cabeçalho (até 90), header título (34), subtítulo (60), títulos, textos e CTAs em caixa alta começando com verbo.
No texto somente <b> e <br>, sem atributos. Sem quebras de linha cruas. Máximo de 4000 caracteres por campo, incluindo o HTML gerado.
MENSAGEM_LIMITE: "Abertura, {{nome}}: … {{limite}} …", com uma saudação diferente por e-mail. Nenhuma promessa de aprovação garantida.
Nunca preencha links LINK_*, UTM_CAMPANHA, assinatura BANNER_3_CORPO, NOTA_LEGAL, RODAPE, HEADER_LOGO, cores, fontes, CARTAO_NM_COMERCIAL, DT_FIM ou template_slot_id.
COPY_2_PRETO é gerado pelo GaaS a partir de secondBlock; não o envie.
O E-mail N herda os campos governados do E-mail N−1 da mesma régua e rede. O GaaS troca S{semana}D{dia} e _EMAIL{n}_; na V2 há dois e-mails por semana.

## Catálogo de blocos
- lead: abertura centralizada, {type:"lead",text:"Com o <b>cartão +amigo</b>…"}.
- benefit_grid: benefícios comparáveis em grade com número par de itens {title,text}. E-mail 4 V2 usa quatro benefícios.
- stat_tiles: 2 ou 3 números {number,label}; priorize fatos governados, sem transformar número em promessa.
- check_list: lista de textos; E-mail 3 V2 usa quatro vantagens com <b>.
- steps: passos {title,text} em ordem; o GaaS numera.
- closing: fechamento curto antes do CTA.
Varie o formato em relação ao e-mail anterior. A IA entrega dados, nunca tabelas ou HTML de layout.

## Contrato JSON Schema
As regras semânticas (grade par, fatos governados, saudações únicas e descarte de campos governados) também são verificadas na importação.
\`\`\`json
${JSON.stringify(emailInputJsonSchema(), null, 2)}
\`\`\`

## Exemplo completo: E-mail 4 da V2
Exemplo didático dentro dos limites técnicos. O header foi abreviado somente neste exemplo; o conteúdo histórico da régua continua com suas pendências editoriais.
\`\`\`json
${JSON.stringify(example, null, 2)}
\`\`\`
`;
  let kit = "";
  if (options.scope !== "rulers") {
    const prepared = prepareEmailInput(example, {
      briefings: context.briefings,
      products: context.productContexts,
      guardrails: context.productGuardrails,
    });
    const row = prepared.rows.find(
      (r) => r.sequence === "E-mail 4" && r.network === "AMIGAO",
    )?.row;
    const template = context.templates.find(
      (t) => t.id === "builtin-plurix-v13",
    );
    if (row && template) {
      const html = renderDynamicEmail(template.source, row, {
        CPF: "00000000000",
        PRI_NOME: "VANIA",
        LIMITE: "3500",
        PRODUTO: row.NM_PRODUTO_INTERNO,
        SEQUENCIA: row.SEQUENCIA,
        TP_CAMPANHA: row.TP_CAMPANHA,
      });
      kit = `\n## Kit de prévia V13\nHTML estático do E-mail 4, rede Amigão. Abra com viewport 600px e 375px. Gere as demais redes com {no_mercado} e os dados governados da régua.\n\`\`\`html\n${html.html}\n\`\`\`\n`;
    } else
      kit =
        "\n## Kit de prévia\nO banco não forneceu template V13 e rascunhos V2 suficientes para montar uma prévia fiel. Não improvise o layout; use a prévia do GaaS ao importar.\n";
  }
  const content = sanitizeAiPackText(
    (options.scope === "rulers"
      ? `# Réguas para IA · pacote ${AI_PACK_SCHEMA_VERSION}\n`
      : instructions + kit) +
      "\n## Contexto governado e réguas selecionadas\n" +
      source.content,
  );
  const bytes = new TextEncoder().encode(content).length;
  return {
    content,
    bytes,
    estimatedTokens: Math.ceil(content.length / 4),
    filename: `gaas_prompt_ia_v${AI_PACK_SCHEMA_VERSION}_${options.scope}.md`,
  };
}
