import { strToU8, zipSync } from 'fflate';
import contentBlocksPy from '../../../../scripts/email-factory/content_blocks.py?raw';
import validarInputPy from '../../../../scripts/email-factory/validar_input.py?raw';
import montarPreviaPy from '../../../../scripts/email-factory/montar_previa.py?raw';
import { renderDynamicEmail } from '../ampscript/renderer';
import { BRIEFING_COLUMNS, type BriefingColumn, type BriefingRow } from '../domain/briefing';
import { parseContentBlocks, type ContentBlock } from '../domain/contentBlocks';
import {
  EMAIL_INPUT_CONTRACT, NETWORK_PLACE, emailInputJsonSchema, isGovernedField, prepareEmailInput, productFacts,
  type EmailInput,
} from '../domain/emailInput';
import type { EmailStrategy, ProductContext, ProductGuardrail } from '../domain/management';
import { PLURIX_SIGNATURES, type EmailAsset, type EmailTemplateSlot, type RulerStrategy, type WorkspaceBriefing } from '../domain/workspace';
import exampleInput from '../fixtures/input_gaas_emails_v2_topo_20261015.json';
import { sanitizeAiPackText } from './aiContextMarkdown';

/**
 * Pacote "Prompt e IA": uma skill no padrão Agent Skills (SKILL.md + references/ + assets/ +
 * scripts/) que deixa qualquer IA autossuficiente para escrever, conferir e mostrar a prévia
 * fiel dos e-mails, sem acesso ao banco. Tudo é montado a partir do código e dos dados do
 * GaaS no momento da exportação, para nunca desatualizar.
 */
export const AI_PACK_SCHEMA_VERSION = 2;

/** Campos que identificam a linha ou são datas: não são texto da IA nem viram marcador. */
const STRUCTURAL_FIELDS: readonly BriefingColumn[] = ['DT_INICIO', 'TP_CAMPANHA', 'SEQUENCIA', 'NM_PRODUTO_INTERNO'];
export const EDITORIAL_FIELDS = BRIEFING_COLUMNS.filter((field) => !isGovernedField(field) && !STRUCTURAL_FIELDS.includes(field));
export const GOVERNED_FIELDS = BRIEFING_COLUMNS.filter((field) => isGovernedField(field));
const SAMPLE_NAME = 'VANIA';

export type PackFileKind = 'md' | 'json' | 'py' | 'html' | 'txt' | 'image';
/** Imagem leva `bytes` (binário) e `content` vazio; o resto é texto. */
export interface PackFile { path: string; content: string; kind: PackFileKind; role: string; bytes?: Uint8Array }
export interface PackEmailSummary {
  sequence: string; weekKey: string; status: string; networks: number; subject: string;
  headerTitle: string; greeting: string; blockTypes: string[] | null; isNext?: boolean;
}
export interface PackRulerSummary {
  key: string; slug: string; partner: string; segment: string; tpCampanha: string; templateSlotId: string;
  templateName: string; emails: PackEmailSummary[]; updatedAt?: string;
}
export interface SkillPackContext {
  briefings: WorkspaceBriefing[];
  emailStrategies: EmailStrategy[];
  rulers: RulerStrategy[];
  productContexts: ProductContext[];
  productGuardrails: ProductGuardrail[];
  assets: EmailAsset[];
  templates: EmailTemplateSlot[];
}
export interface SkillPackOptions {
  rulerKeys: string[];
  /** Esqueletos de prévia das 6 redes (padrão) ou só da primeira, para um pacote leve. */
  previewNetworks: 'all' | 'first';
  includeTemplateSource: boolean;
  generatedAt: string;
}
export interface SkillPack { skillName: string; files: PackFile[]; rulers: PackRulerSummary[]; warnings: string[] }

const rulerKey = (partner: string, segment: string) => `${partner}|${segment}`;
const slugify = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'regua';
const sequenceNumber = (value: string) => Number(value.replace(/\D/g, '')) || 0;
const weekNumber = (value: string) => Number(value.replace(/\D/g, '')) || 1;
const cell = (value: unknown) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim() || ' ';
const fence = (lang: string, body: string) => `\`\`\`${lang}\n${body}\n\`\`\``;
const networkOrder = (network: string) => { const i = PLURIX_SIGNATURES.findIndex((s) => s.key === network); return i < 0 ? 99 : i; };

function rulerRows(briefings: WorkspaceBriefing[], key: string) {
  return briefings
    .filter((row) => row.__meta.status !== 'archived' && rulerKey(row.__meta.partner, row.__meta.segment) === key)
    .sort((a, b) => sequenceNumber(a.SEQUENCIA) - sequenceNumber(b.SEQUENCIA) || networkOrder(a.NM_PRODUTO_INTERNO) - networkOrder(b.NM_PRODUTO_INTERNO));
}

/** Rede de referência para o texto compartilhado: a primeira assinatura que existe no e-mail. */
const referenceRow = (rows: WorkspaceBriefing[]) => [...rows].sort((a, b) => networkOrder(a.NM_PRODUTO_INTERNO) - networkOrder(b.NM_PRODUTO_INTERNO))[0];
/** "no Amigão" volta a ser {no_mercado}, para a IA escrever um texto só para as 6 redes. */
const toPlaceMarker = (value: string, network: string) => {
  const place = NETWORK_PLACE[network];
  return place && place !== 'no seu supermercado' ? value.split(place).join('{no_mercado}') : value;
};

function nextWeekKey(rows: WorkspaceBriefing[]) {
  const last = rows.reduce((max, row) => Math.max(max, weekNumber(row.__meta.weekKey ?? '')), 1);
  const perWeek = new Set(rows.filter((row) => weekNumber(row.__meta.weekKey ?? '') === last).map((row) => row.SEQUENCIA)).size;
  const firstWeek = new Set(rows.filter((row) => weekNumber(row.__meta.weekKey ?? '') === 1).map((row) => row.SEQUENCIA)).size || 2;
  return `Semana ${perWeek >= firstWeek ? last + 1 : last}`;
}

export function summarizeRulers(context: Pick<SkillPackContext, 'briefings' | 'templates'>): PackRulerSummary[] {
  const keys = [...new Set(context.briefings.filter((r) => r.__meta.status !== 'archived' && r.__meta.segment).map((r) => rulerKey(r.__meta.partner, r.__meta.segment)))];
  return keys.map((key) => {
    const rows = rulerRows(context.briefings, key);
    const [partner, segment] = key.split('|');
    const sequences = [...new Set(rows.map((r) => r.SEQUENCIA))];
    const templateSlotId = rows[0]?.__meta.templateSlotId ?? '';
    return {
      key, slug: slugify(segment), partner, segment, tpCampanha: rows[0]?.TP_CAMPANHA ?? '', templateSlotId,
      templateName: context.templates.find((t) => t.id === templateSlotId)?.name ?? templateSlotId,
      updatedAt: rows.map((r) => r.__meta.savedAt ?? '').sort().pop() || undefined,
      emails: sequences.map((sequence) => {
        const group = rows.filter((r) => r.SEQUENCIA === sequence);
        const ref = referenceRow(group);
        const statuses = [...new Set(group.map((r) => r.__meta.status))];
        return {
          sequence, weekKey: ref.__meta.weekKey ?? '', status: statuses.length === 1 ? statuses[0] : statuses.join(' / '),
          networks: group.length, subject: ref.ASSUNTO, headerTitle: ref.HEADER_TITULO, greeting: ref.MENSAGEM_LIMITE,
          blockTypes: parseContentBlocks(ref.COPY_2_PRETO)?.map((b) => b.type) ?? null,
        };
      }),
    };
  }).sort((a, b) => a.partner.localeCompare(b.partner, 'pt-BR') || a.segment.localeCompare(b.segment, 'pt-BR'));
}

/** Estado atual da régua escrito no próprio contrato de entrada: a IA parte dele para ajustar. */
export function currentStateInput(rows: WorkspaceBriefing[], summary: PackRulerSummary, generatedAt: string): EmailInput {
  const sequences = [...new Set(rows.map((r) => r.SEQUENCIA))];
  const emails = sequences.map((sequence) => {
    const group = rows.filter((r) => r.SEQUENCIA === sequence);
    const ref = referenceRow(group);
    const fields: EmailInput['emails'][number]['fields'] = {};
    const networkOverrides: NonNullable<EmailInput['emails'][number]['networkOverrides']> = {};
    for (const field of EDITORIAL_FIELDS) {
      if (field === 'COPY_2_PRETO') continue;
      const shared = toPlaceMarker(ref[field], ref.NM_PRODUTO_INTERNO);
      if (shared) fields[field] = { value: shared, origin: 'governed', source: `GaaS ${sequence} / ${ref.NM_PRODUTO_INTERNO}` };
      for (const row of group) {
        const expected = shared.split('{no_mercado}').join(NETWORK_PLACE[row.NM_PRODUTO_INTERNO] ?? '');
        if (row[field] !== expected) {
          networkOverrides[row.NM_PRODUTO_INTERNO] ??= {};
          networkOverrides[row.NM_PRODUTO_INTERNO][field] = { value: row[field], origin: 'governed', source: `GaaS ${sequence} / ${row.NM_PRODUTO_INTERNO}` };
        }
      }
    }
    const blocks = parseContentBlocks(toPlaceMarker(ref.COPY_2_PRETO, ref.NM_PRODUTO_INTERNO)) as ContentBlock[] | null;
    return {
      sequence, weekKey: ref.__meta.weekKey || 'Semana 1', fields,
      ...(blocks ? { secondBlock: blocks } : {}),
      ...(Object.keys(networkOverrides).length ? { networkOverrides } : {}),
      factsUsed: [],
    };
  });
  return {
    contract: EMAIL_INPUT_CONTRACT, status: 'draft',
    generatedBy: { tool: 'outro', model: 'GaaS (estado atual da régua)', generatedAt },
    source: { kind: 'conversa' },
    ruler: { segment: summary.segment, partner: summary.partner, tpCampanha: summary.tpCampanha, templateSlotId: summary.templateSlotId },
    emails,
    pendencies: [],
  } as EmailInput;
}

/** Campos de imagem: vazios mudam o layout (a imagem some e o segundo bloco ocupa a largura toda). */
export const IMAGE_FIELDS: readonly BriefingColumn[] = ['HEADER', 'HEADER_IMAGEM_CARTAO', 'BANNER_1_CORPO', 'BANNER_2_CORPO'];
/**
 * Texto sempre vira marcador. Imagem só quando já está preenchida: o esqueleto mantém o layout
 * do e-mail real, e o script avisa quando a IA preenche uma imagem que hoje está vazia.
 */
export const skeletonTokens = (row: BriefingRow) => EDITORIAL_FIELDS.filter((field) => !IMAGE_FIELDS.includes(field) || (row[field] ?? '').trim());

function skeletonFor(template: EmailTemplateSlot, row: BriefingRow, withName: boolean) {
  const tokenized = { ...row };
  for (const field of skeletonTokens(row)) tokenized[field] = `@@${field}@@`;
  return renderDynamicEmail(template.source, tokenized, {
    CPF: '00000000000', PRI_NOME: withName ? SAMPLE_NAME : '', LIMITE: '3500', PRODUTO: row.NM_PRODUTO_INTERNO,
    SEQUENCIA: row.SEQUENCIA, TP_CAMPANHA: row.TP_CAMPANHA,
  }, { pendingAssets: 'hidden' });
}

const editorialValues = (row: BriefingRow) => Object.fromEntries(EDITORIAL_FIELDS.map((field) => [field, row[field] ?? '']));

// ------------------------------------------------------------------ textos da skill

function skillMd(skillName: string, summaries: PackRulerSummary[], context: SkillPackContext, generatedAt: string) {
  const partners = [...new Set(summaries.map((s) => s.partner))];
  const segments = summaries.map((s) => s.segment);
  const description = `Escreve e ajusta e-mails de aquisição da Fábrica de E-mails do GaaS${partners.length ? ` (${partners.join(', ')})` : ''}, mostra a prévia fiel no template real e entrega o arquivo JSON input_gaas_emails (por segmento e data) para importar no GaaS. Use quando pedirem para criar, revisar ou mudar e-mails de régua${segments.length ? ` (${segments.slice(0, 4).join(', ')})` : ''}, mandarem a aba Briefing Fábrica ou um briefing, ou pedirem o JSON de importação da Fábrica.`.slice(0, 1024);
  const tone = context.productContexts.find((p) => p.status === 'active' && partners.includes(p.partner ?? ''))?.toneOfVoice;
  const rulerLines = summaries.map((s) => `- \`references/regua-${s.slug}.md\`: ${s.partner} · ${s.segment} (${s.emails.length} e-mails, ${s.templateName}). Estado atual no formato do contrato: \`assets/reguas/${s.slug}.json\`.`);
  return `---
name: ${skillName}
description: ${description.replace(/\n/g, ' ').replace(/[<>]/g, '')}
---

# Fábrica de E-mails do GaaS: criação com IA

Pacote exportado do GaaS (Fábrica de E-mails, aba Prompt e IA) em ${generatedAt.slice(0, 10)}, versão ${AI_PACK_SCHEMA_VERSION}.
Tudo o que você precisa está nesta pasta. Você não tem acesso ao banco nem ao SFMC: o GaaS valida e grava.

## Seu papel

Você é redator(a) e diretor(a) de arte de e-mails de aquisição de cartão. Escreve em português do Brasil,
mostra a prévia, ajusta com o analista de marketing e só entrega o arquivo final depois do "aprovado".
${tone ? `Tom de voz do produto: ${tone}` : ''}

## Fluxo (siga na ordem)

1. **Entenda o pedido.** Leia \`references/produto.md\` e a régua em \`references/regua-<segmento>.md\`.
   Se vier a aba Briefing Fábrica ou uma planilha, leia por rótulo (coluna "Onde fica"), não por posição,
   e pule as linhas automáticas.
2. **Pergunte antes de escrever** quando faltar algo que muda o e-mail: qual e-mail da régua, o benefício
   principal, o papel do e-mail. No máximo três perguntas, objetivas.
3. **Escreva** os campos editoriais seguindo \`references/escrita.md\` e monte o segundo bloco com o
   catálogo de \`references/blocos.md\`. Para ajustar e-mail que já existe, parta de
   \`assets/reguas/<segmento>.json\`: é o estado atual da régua no mesmo formato do contrato.
4. **Salve** o rascunho como \`input_gaas_emails_<segmento>_<AAAAMMDD>.json\`, no formato de
   \`assets/contrato.schema.json\` (exemplo completo em \`assets/exemplo_input.json\`, explicação em
   \`references/contrato.md\`). Mande só os e-mails que mudam.
5. **Confira**: \`python scripts/validar_input.py <arquivo>\`. Corrija todo BLOQUEIA antes de seguir.
6. **Mostre a prévia em dois PNGs**: \`python scripts/montar_previa.py <arquivo>\` gera
   \`previa/quadro_celular.png\` e \`previa/quadro_desktop.png\`, com todos os e-mails da régua lado a lado
   (os que o arquivo não mexe aparecem como estão hoje, rotulados "pronto (atual)"; o novo vem com borda
   tracejada). Mostre as duas imagens e, junto, uma lista curta do que mudou e do que depende do analista.
   O PNG precisa do Playwright: se faltar, rode \`pip install playwright\` e
   \`python -m playwright install chromium\`. Sem como instalar, entregue os dois \`quadro_*.html\`.
   Opções: \`--rede BOA\`, \`--sem-nome\` (pessoa sem nome na base), \`--todas\` (um par por rede).
   As imagens dos e-mails já estão em \`assets/imagens/\` (o sandbox não acessa a internet): use só imagens
   da régua ou da biblioteca listada em \`references/regua-<segmento>.md\`; URL de fora aparece quebrada.
7. **Ajuste** até o analista escrever "aprovado". Só então entregue o JSON final para download.
8. **Explique a importação**: GaaS > Fábrica de E-mails > Prompt e IA > Importar. O GaaS valida de novo,
   completa os campos governados, mostra a prévia e grava como rascunho com histórico.

Sem execução de código: siga a lista de conferência de \`references/escrita.md\`, descreva a prévia bloco a
bloco e avise que a prévia fiel aparece na importação do GaaS.

## Regras que nunca mudam

- Nenhum benefício, número, prazo ou condição fora de \`references/produto.md\`. Na dúvida, registre em
  \`pendencies\` em vez de escrever.
- Pré-aprovação é sujeita a análise de crédito: nunca "aprovado", "garantido" ou "sem análise".
- Nunca cite Compre Mais nem Superpão (transição de marca). Para falar do supermercado da pessoa, escreva
  \`{no_mercado}\`: o GaaS troca por "no Amigão", "no Avenida", "no Boa", "no Paraná" ou "no seu supermercado".
- Nome da pessoa só como \`%%=v(@FirstName)=%%\` (ou \`PRI_NOME\`). Nunca no assunto.
- No texto, só \`<b>\` e \`<br>\`. Nada de HTML de layout: o segundo bloco vai como dados em \`secondBlock\`.
- Não preencha campos governados (links, UTM, assinatura, nota legal, rodapé, logo, cores, tamanhos,
  datas). O GaaS preenche e descarta o que vier no arquivo.
- A saudação da faixa de limite muda a cada e-mail da régua.
- Todo elemento visual é simétrico: grade com número par de itens, 2 ou 3 números em destaque, títulos de
  cartão com tamanhos parecidos.
- Sem travessão nos textos. Status do arquivo sempre "draft".

## Arquivos

- \`references/produto.md\`: ficha do produto, benefícios que podem ser citados e como.
- \`references/escrita.md\`: cada campo editorial, limites, faixa de limite, botões e conferência final.
- \`references/blocos.md\`: catálogo do segundo bloco com exemplos reais e regras visuais.
- \`references/contrato.md\`: o arquivo JSON campo a campo.
${rulerLines.join('\n')}
- \`assets/contrato.schema.json\`, \`assets/exemplo_input.json\`: contrato e exemplo válido.
- \`assets/previa/\`: esqueletos do template real, um por e-mail e rede, usados por \`montar_previa.py\`.
- \`scripts/content_blocks.py\`: o mesmo gerador de blocos do GaaS (saída idêntica).
- \`scripts/validar_input.py\`, \`scripts/montar_previa.py\`: conferência e os dois quadros de prévia.
`;
}

function produtoMd(context: SkillPackContext, partners: string[]) {
  const sections = partners.map((partner) => {
    const facts = productFacts(context.productContexts, context.productGuardrails, partner);
    if (!facts.products.length) return `## ${partner}\n\nSem ficha de produto ativa no GaaS. Não cite benefícios: registre a lacuna em \`pendencies\`.\n`;
    return facts.products.map((product) => {
      const rails = facts.guardrails.filter((g) => g.productContextId === product.id);
      return `## ${product.product} (${partner})

**Proposta de valor:** ${product.valueProposition ?? 'sem registro'}

**Público:** ${product.eligibleAudience ?? 'sem registro'}

**Tom de voz:** ${product.toneOfVoice ?? 'sem registro'}

**Marca e redes:** ${product.brandContext ?? 'sem registro'}

### Diferenciais

${product.differentiators.map((d) => `- ${d}`).join('\n') || '- sem registro'}

### Benefícios e regras de citação

"Pode": cite como está. "Cuidado": cite seguindo a regra. "Checar": não cite sem confirmar com o analista.
"Não": nunca cite.

| Tipo | Benefício ou regra | Como citar | Citação | Valor exato | Severidade |
|---|---|---|---|---|---|
${rails.map((g) => `| ${cell(g.guardrailType)} | ${cell(g.title)} | ${cell(g.ruleText)} | ${cell(g.citationStatus ?? (g.allowedStatus === 'blocked' ? 'nao' : 'pode'))} | ${cell(g.valueExact)} | ${cell(g.severity)} |`).join('\n')}
`;
    }).join('\n');
  });
  return `# Ficha do produto

Fonte: Plano de Comunicação do GaaS (ficha de produto e guardrails ativos). É a única fonte de fatos:
todo número, prazo, percentual ou benefício do e-mail precisa estar aqui. \`validar_input.py\` confere
com o mesmo texto que o GaaS usa na importação.

${sections.join('\n')}`;
}

function escritaMd(sample: WorkspaceBriefing | undefined) {
  const roles: Partial<Record<BriefingColumn, string>> = {
    ASSUNTO: 'Assunto. Até ~50 caracteres, sem nome da pessoa; vale para as 6 redes.',
    PRE_CABECALHO: 'Texto de pré-visualização na caixa de entrada. Até ~90 caracteres; complementa o assunto.',
    HEADER_TITULO: 'Título do header dinâmico (V13). Até 34 caracteres para caber em uma linha.',
    HEADER_SUBTITULO: 'Subtítulo do header dinâmico. Até 60 caracteres.',
    HEADER_IMAGEM_CARTAO: 'Imagem do cartão no header (URL da biblioteca de ativos; veja a régua).',
    HEADER: 'Header por imagem dos templates antigos. Deixe como está no V13.',
    MENSAGEM_LIMITE: 'Faixa de limite pré-aprovado. Formato "Abertura, {{nome}}: ... {{limite}} ...". Até 300.',
    TITULO_COPY_1_AZUL: 'Título do primeiro bloco (azul).',
    COPY_1_PRETO: 'Texto principal do primeiro bloco. Aceita <b>, <br>, %%=v(@FirstName)=%% e {no_mercado}.',
    TITULO_CTA_1: 'Botão do primeiro bloco. Caixa alta, começa com verbo.',
    TITULO_COPY_2: 'Título do segundo bloco. Uma ideia, até ~50 caracteres, sem negrito interno.',
    COPY_2_PRETO: 'Gerado pelo GaaS a partir de secondBlock. Não envie.',
    TITULO_CTA_2: 'Botão do segundo bloco. Caixa alta, começa com verbo.',
    BANNER_1_CORPO: 'Imagem do corpo 1 (URL da biblioteca). Texto escrito em imagem vai para o bloco onde faz sentido.',
    BANNER_2_CORPO: 'Imagem do corpo 2 (URL da biblioteca).',
  };
  const editorial = EDITORIAL_FIELDS.map((field) => `| \`${field}\` | ${cell(roles[field] ?? 'Campo de texto do template.')} | ${cell(sample?.[field]?.slice(0, 140))} |`);
  return `# Escrita: campos, limites e conferência

## Campos que você escreve

O exemplo é o texto atual do primeiro e-mail da régua exportada, na primeira rede.

| Campo | Para que serve e limite | Exemplo atual |
|---|---|---|
${editorial.join('\n')}

Mande no arquivo só os campos que mudam. Em e-mail novo, o que você não mandar vem do e-mail anterior da
mesma rede (imagens, títulos), então mande tudo o que for diferente.

## Campos que você nunca preenche

${GOVERNED_FIELDS.map((f) => `\`${f}\``).join(', ')}.

O GaaS preenche a partir dos rascunhos da régua: e-mail existente mantém os dele; e-mail novo herda do
e-mail anterior da mesma rede e troca o código do e-mail no link (S{semana}D{dia}) e na UTM (_EMAIL{n}_).
Se o arquivo trouxer algum desses campos, o valor é descartado com aviso.

## Supermercado e redes

- \`{no_mercado}\` vira "no Amigão", "no Avenida", "no Boa", "no Paraná"; Compre Mais e Superpão recebem
  "no seu supermercado" porque estão em transição de marca e não podem ser citadas.
- Não use \`%%INVESTIDA%%\`: ele traz o código da rede em caixa alta e sem acento.
- Texto diferente por rede vai em \`networkOverrides\` (raro; prefira um texto só com \`{no_mercado}\`).

## Faixa de limite (MENSAGEM_LIMITE)

- Formato "Abertura, {{nome}}: você tem R$ {{limite}} de limite pré-aprovado ...". Só {{nome}} e {{limite}}.
- A abertura muda a cada e-mail, acompanhando a régua ("Boa notícia", "Seu cartão está mais perto",
  "Ainda dá tempo"...). Veja na régua as aberturas já usadas.
- Sem nome na base, o template tira ", {{nome}}" e a frase vira "Boa notícia: ...". Não comece com {{nome}}
  e não use palavra genérica no lugar do nome ("cliente").
- Nunca prometa aprovação: pré-aprovação segue sujeita a análise de crédito.

## Texto

- Só \`<b>\` e \`<br>\`, sem atributos, negrito sempre fechado, sem quebra de linha crua.
- Até 4000 caracteres por campo, contando o HTML que o segundo bloco gera.
- Reorganize sem mudar o sentido: pode quebrar parágrafo em itens, encurtar título, tirar repetição.
- Botões em caixa alta começando com verbo: PEÇA, PEDIR, SOLICITE, CONFIRA, APROVEITE, CONHEÇA, ACESSE,
  DESCUBRA, VEJA, COMECE, SAIBA, QUERO, FAÇA, BAIXE, ATIVE.
- Sem travessão. Frases curtas, concretas, do dia a dia de quem compra no mercado.

## Conferência final (mesmo sem rodar código)

1. Todo número, prazo e benefício está na ficha? Os fatos estão em \`factsUsed\`?
2. Assunto sem nome e com até ~50 caracteres? Header com até 34?
3. Faixa no formato certo e com abertura nova?
4. Nenhuma marca proibida, nenhum campo governado, nenhuma tag fora de <b> e <br>?
5. Segundo bloco simétrico e com formato diferente do e-mail anterior?
6. Status "draft" e \`ruler\` igual ao do pacote?
`;
}

function blocosMd() {
  const examples: Record<string, ContentBlock> = {
    lead: { type: 'lead', text: 'Com o <b>cartão de crédito +amigo</b>, você conta com:' },
    benefit_grid: (exampleInput.emails.find((e) => e.sequence === 'E-mail 4')?.secondBlock?.find((b) => b.type === 'benefit_grid') ?? { type: 'benefit_grid', items: [] }) as ContentBlock,
    stat_tiles: { type: 'stat_tiles', items: [{ number: '+5%', label: 'OFF em produtos selecionados' }, { number: '40 dias', label: 'para pagar' }, { number: '70%', label: 'OFF em consultas e exames' }] },
    check_list: (exampleInput.emails.find((e) => e.sequence === 'E-mail 3')?.secondBlock?.find((b) => b.type === 'check_list') ?? { type: 'check_list', items: [] }) as ContentBlock,
    steps: { type: 'steps', items: [{ title: 'Peça pelo app', text: 'Leva poucos minutos.' }, { title: 'Aguarde a análise', text: 'Você recebe a resposta no app.' }, { title: 'Use o cartão virtual', text: 'Se aprovado, ele aparece no app na hora.' }] },
    closing: { type: 'closing', text: 'Peça seu cartão +amigo e aproveite!' },
  };
  return `# Segundo bloco: catálogo

O segundo bloco (\`COPY_2_PRETO\`) é montado pelo GaaS a partir de \`secondBlock\`, uma lista de blocos.
Você manda dados; o HTML sai sempre igual, com tabelas que funcionam no Outlook e empilham no celular.
\`scripts/content_blocks.py\` gera exatamente o mesmo HTML do GaaS.

| Conteúdo | Bloco | Regra |
|---|---|---|
| Frase que apresenta o bloco | \`lead\` | Centralizada. Aceita <b>. |
| 2 a 6 benefícios com título e explicação | \`benefit_grid\` | Número par de itens. Título até ~26 caracteres, sem HTML; explicação aceita <b>. |
| 2 ou 3 benefícios que são números | \`stat_tiles\` | 2 ou 3 itens; legendas com comprimento parecido. Sem HTML. |
| Lista curta de vantagens | \`check_list\` | Itens alinhados à esquerda, aceitam <b>. |
| Como pedir, passo a passo | \`steps\` | O GaaS numera. Sem HTML. |
| Chamada antes do botão | \`closing\` | Curta, em destaque. |

## Regras visuais

- Varie o formato em relação ao e-mail anterior da régua (o GaaS avisa quando repete).
- Tudo simétrico: cartões e quadros lado a lado têm a mesma altura porque são células da mesma linha;
  mantenha textos paralelos com tamanhos parecidos para não sobrar espaço vazio.
- Lista centralizada não funciona: itens sempre alinhados à esquerda, em grade ou lista.
- Sem emoji e sem imagem de ícone: o selo é HTML (círculo amarelo com check ou número).
- Paleta fixa do bloco: azul #2C3490, amarelo #E7A921, fundo #F4F5FB, borda #E1E3F2, texto #4A4F6A.

## Exemplos (formato do arquivo)

${Object.entries(examples).map(([name, block]) => `### ${name}\n\n${fence('json', JSON.stringify(block, null, 2))}`).join('\n\n')}
`;
}

function contratoMd() {
  return `# Contrato do arquivo: ${EMAIL_INPUT_CONTRACT}

Nome do arquivo: \`input_gaas_emails_<segmento>_<AAAAMMDD>.json\`. Esquema completo em
\`assets/contrato.schema.json\`; exemplo válido em \`assets/exemplo_input.json\`.

- \`contract\`: sempre "${EMAIL_INPUT_CONTRACT}". \`status\`: sempre "draft".
- \`generatedBy\`: \`tool\` ("claude", "chatgpt" ou "outro"), \`model\` (nome do modelo) e \`generatedAt\` (ISO-8601 com fuso).
- \`source\`: \`kind\` "conversa" ou "planilha"; \`file\` com o nome da planilha, quando houver.
- \`ruler\`: copie de \`assets/reguas/<segmento>.json\` (segment, partner, tpCampanha, templateSlotId).
- \`emails[]\`: um item por e-mail que muda.
  - \`sequence\` ("E-mail N") e \`weekKey\` ("Semana N"). E-mail novo usa o próximo número da régua.
  - \`fields\`: campo -> \`{ "value", "origin", "source", "justification"? }\`. \`origin\`: "ia" (escrito por você
    na conversa), "xlsx" (copiado da planilha; \`source\` = "Aba!Célula"), "inferred" (regra aplicada; exige
    \`justification\`) ou "missing" (valor que falta; \`value\` vazio).
  - \`secondBlock\`: lista de blocos (\`references/blocos.md\`). Obrigatório em e-mail novo; ausente em e-mail
    existente, o GaaS mantém o segundo bloco atual.
  - \`networkOverrides\`: rede -> campos, só quando uma rede precisa de texto próprio.
  - \`factsUsed\`: todo fato citado ("40 dias", "5%", "Visa"). Cada um precisa estar na ficha do produto.
- \`pendencies[]\`: o que depende do analista. \`severity\` "blocker" ou "review", \`scope\` (ex.: "E-mail 4"),
  \`field\` opcional e \`message\`.

A importação no GaaS separa o resultado em **Bloqueia** (não grava) e **Revisar** (o analista decide),
mostra a prévia de cada e-mail em cada rede e a diferença campo a campo para o que já existe.
Tudo entra como rascunho, com histórico de versões.
`;
}

function reguaMd(summary: PackRulerSummary, rows: WorkspaceBriefing[], context: SkillPackContext, nextSequence: string, nextWeek: string) {
  const strategy = context.rulers.find((r) => r.partner === summary.partner && r.segment === summary.segment);
  const strategies = context.emailStrategies.filter((s) => s.partner === summary.partner && s.segment === summary.segment);
  const images = context.assets.filter((a) => (!a.partner || a.partner === summary.partner) && ['header_card', 'banner_1', 'banner_2', 'header'].includes(a.slot));
  const perEmail = summary.emails.map((email) => {
    const group = rows.filter((r) => r.SEQUENCIA === email.sequence);
    const ref = referenceRow(group);
    const plan = strategies.find((s) => s.sequence === email.sequence);
    const fields = EDITORIAL_FIELDS.filter((f) => f !== 'COPY_2_PRETO' && ref[f]).map((f) => `| \`${f}\` | ${cell(toPlaceMarker(ref[f], ref.NM_PRODUTO_INTERNO))} |`);
    const planLines = plan ? [
      ['Papel na régua', plan.roleInRuler], ['Objetivo', plan.emailObjective], ['Mensagem-chave', plan.keyMessage],
      ['Benefício principal', plan.primaryBenefit], ['Benefícios secundários', plan.secondaryBenefits.join(', ')],
      ['Objeção', plan.objectionAddressed], ['Prova', plan.proof], ['Estratégia do CTA', plan.ctaStrategy],
    ].filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${v}`) : [];
    return `### ${email.sequence} · ${email.weekKey} · ${email.status}

${planLines.join('\n') || '- Sem plano de comunicação registrado para este e-mail.'}
- **Segundo bloco:** ${email.blockTypes ? email.blockTypes.join(' + ') : 'HTML legado (não está no catálogo; mande secondBlock novo se for mudar)'}

| Campo | Texto atual |
|---|---|
${fields.join('\n')}
`;
  });
  return `# Régua: ${summary.partner} · ${summary.segment}

- **Template:** ${summary.templateName} (\`${summary.templateSlotId}\`)
- **TP_CAMPANHA:** ${summary.tpCampanha}
- **Assinaturas:** ${[...new Set(rows.map((r) => r.NM_PRODUTO_INTERNO))].join(', ')}
- **Próximo e-mail, se for criar:** ${nextSequence}, ${nextWeek}
${strategy ? `
## Estratégia da régua

${[['Objetivo', strategy.objective], ['Público', strategy.audience], ['Etapa da jornada', strategy.journeyStage], ['Transformação narrativa', strategy.narrativeTransformation], ['Objeções', strategy.objections.join('; ')], ['Intensidade comercial', strategy.commercialIntensity], ['Critério de sucesso', strategy.successCriteria]].filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${v}`).join('\n')}
` : ''}
## Aberturas da faixa já usadas

${summary.emails.filter((e) => e.greeting).map((e) => `- ${e.sequence}: "${e.greeting.split(',')[0]}"`).join('\n') || '- Nenhuma.'}

## E-mails

${perEmail.join('\n')}
## Imagens disponíveis na biblioteca

${images.length ? `| Nome | Uso | URL |\n|---|---|---|\n${images.map((a) => `| ${cell(a.name)} | ${cell(a.slot)} | ${cell(a.externalUrl)} |`).join('\n')}` : 'Nenhuma imagem cadastrada para este parceiro: mantenha as imagens atuais.'}
`;
}

// ------------------------------------------------------------------ montagem

/** Nome da skill (e da pasta do zip): um parceiro só vira gaas-emails-<parceiro>. */
export const skillNameFor = (partners: string[]) => (partners.length === 1 ? `gaas-emails-${slugify(partners[0])}` : 'gaas-fabrica-emails');

export function buildSkillPack(context: SkillPackContext, options: SkillPackOptions): SkillPack {
  const warnings: string[] = [];
  const all = summarizeRulers(context);
  const summaries = all.filter((s) => options.rulerKeys.includes(s.key));
  const partners = [...new Set((summaries.length ? summaries : all).map((s) => s.partner))];
  const skillName = skillNameFor(partners);
  const root = (path: string) => `${skillName}/${path}`;
  const files: PackFile[] = [];
  const manifest: { generatedAt: string; facts: string; rulers: unknown[] } = {
    generatedAt: options.generatedAt,
    facts: partners.map((p) => productFacts(context.productContexts, context.productGuardrails, p).corpus).join(' '),
    rulers: [],
  };

  for (const summary of summaries) {
    const rows = rulerRows(context.briefings, summary.key);
    const template = context.templates.find((t) => t.id === summary.templateSlotId);
    const last = summary.emails.reduce((max, e) => Math.max(max, sequenceNumber(e.sequence)), 0);
    const nextSequence = `E-mail ${last + 1}`;
    const nextWeek = nextWeekKey(rows);
    const state = currentStateInput(rows, summary, options.generatedAt);
    files.push({ path: root(`assets/reguas/${summary.slug}.json`), kind: 'json', role: `Estado atual de ${summary.segment} no formato do contrato`, content: JSON.stringify(state, null, 2) });

    // Próximo e-mail: mesma herança da importação (links e UTM com o código novo).
    // Esqueletos saem do mesmo caminho da importação: estado atual + próximo e-mail, com a
    // herança de links, UTM e padrão visual que o GaaS aplica ao gravar.
    const probe = prepareEmailInput({
      ...state, emails: [...state.emails, { sequence: nextSequence, weekKey: nextWeek, fields: {}, secondBlock: [{ type: 'lead', text: 'x' }], factsUsed: [] }],
    }, { briefings: context.briefings, products: context.productContexts, guardrails: context.productGuardrails });
    const probed = (sequence: string, fallback: BriefingRow[]) => {
      const found = probe.rows.filter((r) => r.sequence === sequence).map((r) => r.row);
      return found.length ? found : fallback;
    };
    const nextRows = probe.rows.filter((r) => r.sequence === nextSequence).map((r) => r.row);
    const emailEntries: Array<{ sequence: string; weekKey: string; exists: boolean; status: string; greeting: string; networks: Record<string, unknown> }> = [];
    const groups = [
      ...summary.emails.map((e) => ({ sequence: e.sequence, weekKey: e.weekKey, exists: true, status: e.status, greeting: e.greeting, rows: probed(e.sequence, rows.filter((r) => r.SEQUENCIA === e.sequence)) })),
      ...(nextRows.length ? [{ sequence: nextSequence, weekKey: nextWeek, exists: false, status: 'draft', greeting: '', rows: nextRows }] : []),
    ];
    if (!template) warnings.push(`${summary.segment}: template ${summary.templateSlotId} não carregado; o pacote sai sem prévia desta régua.`);
    for (const group of groups) {
      const networks: Record<string, unknown> = {};
      const ordered = [...group.rows].sort((a, b) => networkOrder(a.NM_PRODUTO_INTERNO) - networkOrder(b.NM_PRODUTO_INTERNO));
      for (const [index, row] of ordered.entries()) {
        const skeleton: Record<string, string> = {};
        if (template && (options.previewNetworks === 'all' || index === 0)) {
          for (const [variant, withName] of [['nome', true], ['sem_nome', false]] as const) {
            const rendered = skeletonFor(template, row, withName);
            if (!rendered.html) { warnings.push(`${summary.segment} ${group.sequence} ${row.NM_PRODUTO_INTERNO}: ${rendered.diagnostics.join(' ')}`); continue; }
            const path = `assets/previa/${summary.slug}/e${sequenceNumber(group.sequence)}_${slugify(row.NM_PRODUTO_INTERNO)}_${variant}.html`;
            files.push({ path: root(path), kind: 'html', role: `Esqueleto ${group.sequence} · ${row.NM_PRODUTO_INTERNO} · ${variant === 'nome' ? 'com nome' : 'sem nome'}`, content: rendered.html });
            skeleton[variant] = path;
          }
        }
        if (Object.keys(skeleton).length) networks[row.NM_PRODUTO_INTERNO] = { skeleton, tokens: skeletonTokens(row), current: { ...editorialValues(row), ...(group.exists ? {} : { COPY_2_PRETO: '' }) } };
      }
      emailEntries.push({ sequence: group.sequence, weekKey: group.weekKey, exists: group.exists, status: group.status, greeting: group.greeting, networks });
    }
    manifest.rulers.push({
      slug: summary.slug, segment: summary.segment, partner: summary.partner, tpCampanha: summary.tpCampanha,
      templateSlotId: summary.templateSlotId,
      places: Object.fromEntries([...new Set(rows.map((r) => r.NM_PRODUTO_INTERNO))].sort((a, b) => networkOrder(a) - networkOrder(b)).map((n) => [n, NETWORK_PLACE[n] ?? 'no seu supermercado'])),
      emails: emailEntries,
    });
    files.push({ path: root(`references/regua-${summary.slug}.md`), kind: 'md', role: `Régua ${summary.segment}: estratégia, e-mails e textos atuais`, content: reguaMd(summary, rows, context, nextSequence, nextWeek) });
    if (options.includeTemplateSource && template) files.push({ path: root(`assets/template_${slugify(template.id)}.ampscript`), kind: 'txt', role: `AMPscript completo de ${template.name}`, content: template.source });
  }

  const firstRuler = summaries[0] ? rulerRows(context.briefings, summaries[0].key) : [];
  files.unshift(
    { path: root('SKILL.md'), kind: 'md', role: 'Instruções principais: papel, fluxo e regras', content: skillMd(skillName, summaries, context, options.generatedAt) },
    { path: root('references/produto.md'), kind: 'md', role: 'Ficha do produto e regras de citação', content: produtoMd(context, partners) },
    { path: root('references/escrita.md'), kind: 'md', role: 'Campos editoriais, limites e conferência', content: escritaMd(firstRuler[0]) },
    { path: root('references/blocos.md'), kind: 'md', role: 'Catálogo do segundo bloco', content: blocosMd() },
    { path: root('references/contrato.md'), kind: 'md', role: 'O arquivo JSON campo a campo', content: contratoMd() },
    { path: root('assets/contrato.schema.json'), kind: 'json', role: 'JSON Schema do contrato', content: JSON.stringify(emailInputJsonSchema(), null, 2) },
    { path: root('assets/exemplo_input.json'), kind: 'json', role: 'Exemplo válido: E-mails 3 e 4 da V2', content: JSON.stringify(exampleInput, null, 2) },
  );
  files.push(
    { path: root('assets/previa/manifesto.json'), kind: 'json', role: 'Índice dos esqueletos e textos atuais por rede', content: JSON.stringify(manifest) },
    { path: root('scripts/content_blocks.py'), kind: 'py', role: 'Gerador dos blocos (mesmo HTML do GaaS)', content: contentBlocksPy },
    { path: root('scripts/validar_input.py'), kind: 'py', role: 'Conferência do arquivo antes de entregar', content: validarInputPy },
    { path: root('scripts/montar_previa.py'), kind: 'py', role: 'Prévia fiel, desktop e celular', content: montarPreviaPy },
  );
  // Nada de dado sensível sai no pacote (CPF, e-mail, token), mesmo vindo de texto livre.
  // Travessão vindo de texto do banco (tom de voz, regras) vira vírgula: a IA copia o estilo do que lê.
  for (const file of files) if (file.kind === 'md') file.content = sanitizeAiPackText(file.content).replace(/\s*—\s*/g, ', ');
  return { skillName, files, rulers: summaries, warnings };
}

export const packBytes = (files: PackFile[]) => files.reduce((sum, f) => sum + (f.bytes?.length ?? new TextEncoder().encode(f.content).length), 0);
export const estimateTokens = (files: PackFile[]) => Math.ceil(files.filter((f) => f.kind !== 'html' && f.kind !== 'image').reduce((sum, f) => sum + f.content.length, 0) / 4);

export function zipSkillPack(pack: SkillPack): Uint8Array {
  return zipSync(Object.fromEntries(pack.files.map((f) => [f.path, f.bytes ?? strToU8(f.content)])), { level: 9 });
}

const IMAGE_URL = /https:\/\/[^\s"'()<>]+?\.(?:png|jpe?g|gif|webp)(?=["'\s)<>]|$)/gi;
/** Todas as imagens que aparecem nos esqueletos, nos textos atuais e na biblioteca do pacote. */
export function packImageUrls(pack: SkillPack): string[] {
  const urls = new Set<string>();
  for (const file of pack.files) if (file.kind !== 'image') for (const match of file.content.matchAll(IMAGE_URL)) urls.add(match[0]);
  return [...urls].sort();
}

export type FetchedImage = { contentType: string; bytes: Uint8Array };
const EXTENSION: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

/**
 * O sandbox da IA não acessa a internet: as imagens vão dentro do pacote (assets/imagens/) e o
 * manifesto aponta URL -> arquivo, para montar_previa.py embutir cada uma no HTML do quadro.
 */
export function attachImages(pack: SkillPack, images: Record<string, FetchedImage>): SkillPack {
  const root = `${pack.skillName}/`;
  const map: Record<string, string> = {};
  const files: PackFile[] = [];
  Object.entries(images).forEach(([url, image], index) => {
    const base = slugify(url.split('/').pop()?.replace(/\.[a-z]+$/i, '') ?? 'imagem').slice(0, 40);
    const path = `assets/imagens/${String(index + 1).padStart(2, '0')}-${base}.${EXTENSION[image.contentType] ?? 'png'}`;
    map[url] = path;
    files.push({ path: root + path, kind: 'image', role: `Imagem de ${new URL(url).hostname}`, content: '', bytes: image.bytes });
  });
  const manifestPath = `${root}assets/previa/manifesto.json`;
  return {
    ...pack,
    files: [
      ...pack.files.map((f) => (f.path === manifestPath ? { ...f, content: JSON.stringify({ ...JSON.parse(f.content), images: map }) } : f)),
      ...files,
    ],
  };
}

/** Instruções para colar em um Projeto do ChatGPT (limite de ~8.000 caracteres). */
export function chatGptProjectInstructions(pack: Pick<SkillPack, 'skillName'>): string {
  return `Você trabalha com a Fábrica de E-mails do GaaS. Nos arquivos deste projeto está ${pack.skillName}.zip.
1. No começo de cada conversa, descompacte o zip com o Code Interpreter e leia ${pack.skillName}/SKILL.md inteiro. Siga o fluxo e as regras dele.
2. Leia os arquivos de references/ quando o SKILL.md pedir. Não invente benefício: a única fonte é references/produto.md.
3. Para conferir e mostrar a prévia, rode python ${pack.skillName}/scripts/validar_input.py e montar_previa.py e mostre os dois PNGs (previa/quadro_celular.png e previa/quadro_desktop.png). Se o PNG não sair, ofereça os dois quadro_*.html para download.
4. Só entregue o JSON final (input_gaas_emails_<segmento>_<AAAAMMDD>.json) depois que o analista escrever "aprovado".
5. Responda em português do Brasil, com frases curtas e sem travessão.`;
}

/** Tudo em um Markdown só, para IA sem upload de pasta. Sem esqueletos HTML (pesados). */
export function markdownBundle(pack: SkillPack): string {
  const order = (f: PackFile) => (f.path.endsWith('SKILL.md') ? 0 : f.kind === 'md' ? 1 : f.kind === 'json' ? 2 : 3);
  return [...pack.files]
    .filter((f) => f.kind !== 'html' && f.kind !== 'image' && !f.path.endsWith('manifesto.json'))
    .sort((a, b) => order(a) - order(b))
    .map((f) => (f.kind === 'md' ? `<!-- arquivo: ${f.path} -->\n\n${f.content}` : `## Arquivo \`${f.path}\`\n\n${fence(f.kind === 'py' ? 'python' : f.kind === 'json' ? 'json' : '', f.content)}`))
    .join('\n\n---\n\n')
    + '\n\n> Este Markdown não traz os esqueletos de prévia. A prévia fiel acontece na importação do GaaS.\n';
}
