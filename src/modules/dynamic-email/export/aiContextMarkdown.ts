import { BRIEFING_COLUMNS, type BriefingColumn } from '../domain/briefing';
import type {
  EmailAsset, EmailFactorySegment, EmailTemplateSlot, LegalText, RulerStrategy,
  SignatureSetting, WorkspaceBriefing,
} from '../domain/workspace';
import type {
  EmailStrategy, ExternalReviewRun, ExternalSuggestion, ProductContext, ProductGuardrail,
} from '../domain/management';

export const AI_CONTEXT_SCHEMA_VERSION = 1;

export type AiContextScope = { kind: 'all' } | { kind: 'partner'; partner: string };

export type AiContextMarkdownInput = {
  generatedAt: string;
  scope: AiContextScope;
  briefings: WorkspaceBriefing[];
  emailStrategies: EmailStrategy[];
  rulers: RulerStrategy[];
  segments: EmailFactorySegment[];
  productContexts: ProductContext[];
  productGuardrails: ProductGuardrail[];
  assets: EmailAsset[];
  legalTexts: LegalText[];
  templates: EmailTemplateSlot[];
  signatureSettings: SignatureSetting[];
  reviewRuns: ExternalReviewRun[];
  reviewSuggestions: ExternalSuggestion[];
  /** Inclui o AMPscript integral dos templates do escopo. Pesa ~15–25 KB por template. */
  includeTemplateSource?: boolean;
};

export type AiContextMarkdownResult = {
  filename: string;
  content: string;
  bytes: number;
  estimatedTokens: number;
  redactions: number;
  includedTemplateSource: boolean;
  omittedSections: string[];
};

// ---------------------------------------------------------------- sanitização

/** Padrões que nunca podem sair no pacote, mesmo vindos de texto livre. */
const REDACTION_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, replacement: '[CPF REMOVIDO]' },
  { pattern: /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/g, replacement: '[E-MAIL REMOVIDO]' },
  { pattern: /\bey[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g, replacement: '[TOKEN REMOVIDO]' },
  { pattern: /\bAuthorization\s*:\s*\S+(?:\s+\S+)?/gi, replacement: '[CREDENCIAL REMOVIDA]' },
  { pattern: /\bBearer\s+\S+/gi, replacement: '[CREDENCIAL REMOVIDA]' },
  { pattern: /\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY|anon_key|VITE_SUPABASE_ANON_KEY)\b\S*/gi, replacement: '[CREDENCIAL REMOVIDA]' },
  { pattern: /\b\d{8,11}\b(?=\s*(?:cpf|CPF))/g, replacement: '[CPF REMOVIDO]' },
];

let redactionCount = 0;

/** Sanitiza e escapa. Toda string vinda do banco passa por aqui. */
const clean = (value: unknown): string => {
  if (value == null) return '';
  let text = String(value);
  for (const { pattern, replacement } of REDACTION_RULES) {
    text = text.replace(pattern, () => { redactionCount += 1; return replacement; });
  }
  return text.replace(/\r\n/g, '\n').trim();
};

/** Célula de tabela: sem pipe cru, sem quebra de linha. */
const cell = (value: unknown): string => {
  const text = clean(value).replace(/\|/g, '\\|').replace(/\n+/g, ' · ');
  return text || '—';
};

/** Bloco de código: fence dimensionada para não ser fechada por conteúdo interno. */
const fence = (body: string, lang = ''): string => {
  const runs: string[] = clean(body).match(/`+/g) ?? [];
  const longest = runs.reduce((max, run) => Math.max(max, run.length), 0);
  const ticks = '`'.repeat(Math.max(3, longest + 1));
  return `${ticks}${lang}\n${clean(body)}\n${ticks}`;
};

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : `${value.slice(0, max)}\n[…truncado em ${max} caracteres…]`;

// ------------------------------------------------------- contrato das colunas

type ColumnDoc = { friendly: string; block: string; html: boolean; personalization: boolean; emptyWhen: string };

/** Documentação por coluna. A LISTA vem de BRIEFING_COLUMNS — aqui só o significado. */
const COLUMN_DOCS: Record<BriefingColumn, ColumnDoc> = {
  DT_INICIO: { friendly: 'Início da vigência', block: 'Vigência', html: false, personalization: false, emptyWhen: 'nunca — sem vigência o AMPscript aborta' },
  DT_FIM: { friendly: 'Fim da vigência', block: 'Vigência', html: false, personalization: false, emptyWhen: 'nunca' },
  UTM_CAMPANHA: { friendly: 'Código da campanha (UTM)', block: 'Identificação', html: false, personalization: false, emptyWhen: 'nunca — quebra a atribuição' },
  TP_CAMPANHA: { friendly: 'Tipo de campanha', block: 'Chave composta', html: false, personalization: false, emptyWhen: 'nunca' },
  SEQUENCIA: { friendly: 'Sequência do e-mail', block: 'Chave composta', html: false, personalization: false, emptyWhen: 'nunca' },
  ASSUNTO: { friendly: 'Assunto', block: 'Caixa de entrada', html: false, personalization: true, emptyWhen: 'nunca' },
  PRE_CABECALHO: { friendly: 'Pré-cabeçalho', block: 'Caixa de entrada', html: false, personalization: true, emptyWhen: 'pode — o bloco some' },
  HEADER: { friendly: 'Imagem de topo', block: 'Cabeçalho visual', html: false, personalization: false, emptyWhen: 'pode — o bloco some' },
  CARTAO_NM_COMERCIAL: { friendly: 'Nome comercial do cartão', block: 'Identificação', html: false, personalization: false, emptyWhen: 'pode' },
  NM_PRODUTO_INTERNO: { friendly: 'Produto interno', block: 'Chave composta', html: false, personalization: false, emptyWhen: 'nunca' },
  TITULO_COPY_1_AZUL: { friendly: 'Título do bloco principal', block: 'Bloco principal', html: true, personalization: true, emptyWhen: 'pode' },
  COR_COPY_1: { friendly: 'Cor do título 1', block: 'Bloco principal', html: false, personalization: false, emptyWhen: 'não — vira cor vazia no CSS' },
  TAMANHO_DA_FONTE_TITULO_COPY_1: { friendly: 'Tamanho do título 1 (px)', block: 'Bloco principal', html: false, personalization: false, emptyWhen: 'não' },
  TITULO_CTA_1: { friendly: 'Rótulo do CTA 1', block: 'Bloco principal', html: false, personalization: false, emptyWhen: 'pode — some junto com LINK_CTA_1' },
  LINK_CTA_1: { friendly: 'Destino do CTA 1', block: 'Bloco principal', html: false, personalization: false, emptyWhen: 'pode — mas sem ele o CTA não renderiza' },
  COPY_1_PRETO: { friendly: 'Texto do bloco principal', block: 'Bloco principal', html: true, personalization: true, emptyWhen: 'pode' },
  COR_COPY_PRETO_1: { friendly: 'Cor do texto 1', block: 'Bloco principal', html: false, personalization: false, emptyWhen: 'não' },
  TAMANHO_DA_FONTE_TITULO_COPY_PRETO_1: { friendly: 'Tamanho do texto 1 (px)', block: 'Bloco principal', html: false, personalization: false, emptyWhen: 'não' },
  TITULO_COPY_2: { friendly: 'Título do segundo bloco', block: 'Segundo bloco', html: true, personalization: true, emptyWhen: 'pode' },
  COR_TITULO_COPY_2: { friendly: 'Cor do título 2', block: 'Segundo bloco', html: false, personalization: false, emptyWhen: 'não' },
  TAMANHO_DA_FONTE_TITULO_COPY_2: { friendly: 'Tamanho do título 2 (px)', block: 'Segundo bloco', html: false, personalization: false, emptyWhen: 'não' },
  COPY_2_PRETO: { friendly: 'Texto do segundo bloco', block: 'Segundo bloco', html: true, personalization: true, emptyWhen: 'pode' },
  COR_COPY_2: { friendly: 'Cor do texto 2', block: 'Segundo bloco', html: false, personalization: false, emptyWhen: 'não' },
  TAMANHO_DA_FONTE_COPY_2: { friendly: 'Tamanho do texto 2 (px)', block: 'Segundo bloco', html: false, personalization: false, emptyWhen: 'não' },
  TITULO_CTA_2: { friendly: 'Rótulo do CTA 2', block: 'Segundo bloco', html: false, personalization: false, emptyWhen: 'pode' },
  LINK_CTA_2: { friendly: 'Destino do CTA 2', block: 'Segundo bloco', html: false, personalization: false, emptyWhen: 'pode' },
  BANNER_1_CORPO: { friendly: 'Banner 1', block: 'Corpo', html: false, personalization: false, emptyWhen: 'pode' },
  LINK_BANNER_1_CORPO: { friendly: 'Destino do banner 1', block: 'Corpo', html: false, personalization: false, emptyWhen: 'pode — banner fica sem link' },
  BANNER_2_CORPO: { friendly: 'Banner 2', block: 'Corpo', html: false, personalization: false, emptyWhen: 'pode' },
  LINK_BANNER_2_CORPO: { friendly: 'Destino do banner 2', block: 'Corpo', html: false, personalization: false, emptyWhen: 'pode' },
  BANNER_3_CORPO: { friendly: 'Banner de encerramento', block: 'Encerramento', html: false, personalization: false, emptyWhen: 'pode' },
  LINK_BANNER_3_CORPO: { friendly: 'Destino do banner 3', block: 'Encerramento', html: false, personalization: false, emptyWhen: 'pode' },
  NOTA_LEGAL: { friendly: 'Nota legal', block: 'Informações legais', html: true, personalization: false, emptyWhen: 'só com override explícito' },
  COR_NOTA_LEGAL: { friendly: 'Cor da nota legal', block: 'Informações legais', html: false, personalization: false, emptyWhen: 'não' },
  TAMANHO_DA_FONTE_NOTA_LEGAL: { friendly: 'Tamanho da nota legal (px)', block: 'Informações legais', html: false, personalization: false, emptyWhen: 'não' },
  RODAPE: { friendly: 'Rodapé complementar', block: 'Rodapé', html: true, personalization: false, emptyWhen: 'pode' },
};

const COMPOSITE_KEY: BriefingColumn[] = ['NM_PRODUTO_INTERNO', 'TP_CAMPANHA', 'SEQUENCIA'];

// -------------------------------------------------------------------- helpers

const weekOrder = (value: string): number => {
  const digits = value.match(/\d+/);
  return digits ? Number(digits[0]) : Number.MAX_SAFE_INTEGER;
};

const sequenceOrder = (value: string | undefined): number => {
  const digits = (value ?? '').match(/\d+/);
  return digits ? Number(digits[0]) : Number.MAX_SAFE_INTEGER;
};

const byText = (a: string, b: string) => a.localeCompare(b, 'pt-BR');

const slugify = (value: string): string => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

const inScope = (partner: string | undefined, scope: AiContextScope): boolean =>
  scope.kind === 'all' || (partner ?? '') === scope.partner;

// ------------------------------------------------------------- manual estável

const stableManual = (): string => {
  const columnRows = BRIEFING_COLUMNS.map((column, index) => {
    const doc = COLUMN_DOCS[column];
    return `| ${index + 1} | \`${column}\` | ${doc.friendly} | ${doc.block} | ${doc.html ? 'sim' : 'não'} | ${doc.personalization ? 'sim' : 'não'} | ${COMPOSITE_KEY.includes(column) ? '**sim**' : 'não'} | ${doc.emptyWhen} |`;
  }).join('\n');

  return `## 0. Como usar este arquivo com uma IA

Anexe este \`.md\` à conversa e diga o objetivo. Exemplos:

- "Use o contexto anexado para criar uma nova régua de aquisição para o parceiro X."
- "Revise o Plano de Comunicação desta régua e proponha alterações por e-mail."
- "Compare este AMPscript com o template do escopo e identifique regressões."
- "Gere as linhas novas do CSV para o SFMC sem sobrescrever campanhas existentes."

### Prompt inicial reutilizável

${fence(`Você está trabalhando com a Fábrica de E-mails Afinz descrita neste arquivo.

Antes de propor mudanças:
1. identifique parceiro, produto, jornada, segmento, semana e e-mail;
2. diferencie fatos do sistema, inferências e informações ausentes;
3. preserve o contrato das 36 colunas do SFMC;
4. preserve conteúdo, assets, links, tracking, legal e condicionais fora do pedido;
5. não invente benefícios, condições, preços, limites, tarifas ou aprovação;
6. não considere um e-mail certificado sem evidência de Test Send no SFMC;
7. apresente mudanças propostas, riscos, campos afetados e como validar.

Se faltar informação que mude materialmente o resultado, aponte a pendência
antes de gerar a versão final.`)}

## 1. O que é a Fábrica de E-mails

Módulo do GaaS onde uma régua de e-mails é redigida, revisada e preparada para o
Salesforce Marketing Cloud. Três camadas:

- **Briefing** — contrato técnico de 36 colunas. É o que vira linha de CSV e o que o
  AMPscript lê. Uma linha = um e-mail.
- **Plano de Comunicação** — camada estratégica: papel do e-mail na régua, objetivo,
  objeção, prova, estratégia de CTA. Orienta a redação; não vai para o SFMC.
- **Template** — um HTML/AMPscript compartilhado que renderiza os campos do briefing.
  Vários e-mails usam o mesmo template.

**Fronteira GaaS ↔ SFMC:** a Fábrica prepara conteúdo e código e simula a
renderização localmente. Ela **não publica e-mail, não cria Data Extension e não
ativa jornada** no SFMC. Três estados diferentes, nunca equivalentes:

| Estado | Significa |
|---|---|
| pronto no GaaS | briefing completo e prévia local sem erro |
| pronto para Test Send | exportado e importado na DE, aguardando envio de teste |
| certificado no SFMC | Test Send aprovado, com evidência |

## 2. Mapa das abas

| Aba | Para quê | Cuidado |
|---|---|---|
| E-mails | Editar o briefing campo a campo, com prévia ao lado | Campos compartilhados propagam para as assinaturas do mesmo grupo |
| Plano de Comunicação | Camada estratégica por e-mail e por produto | Exportável em XLSX; não entra no CSV |
| Revisões | Ler análises e sugestões registradas por uma IA autorizada | A tela não executa IA; ela mostra o que foi registrado |
| Biblioteca de ativos | Governar imagens por parceiro, produto, slot e status | Slot novo exige mexer na DE **e** no template |
| Template-fonte | Ver, duplicar e editar o AMPscript | Tornar principal afeta todos os briefings sem template próprio |

## 3. Hierarquia operacional

Dois modos de navegação sobre os mesmos dados:

${fence(`Por parceiro:  Parceiro → Segmento → Semana → E-mail → Assinaturas
Por jornada:   Família → Tipo de jornada → Parceiro → Segmento → Semana → E-mail`)}

- **Parceiro** é a relação comercial (ex.: a rede varejista). **Produto** é o cartão
  comunicado. **Assinatura** é a bandeira mostrada ao destinatário. Em Plurix,
  \`Plurix\` é o parceiro e Amigão/Boa/Avenida/Compre Mais/Paraná/Superpão são
  assinaturas — não são parceiros.
- **Jornada ≠ segmento.** Jornada é o momento (Topo de Funil, Welcome);
  segmento é o público.
- **Semana** é cadência editorial; **sequência** (\`SEQUENCIA\`) é chave técnica.
  Renumerar semana não renumera sequência, e trocar sequência muda a chave composta.

## 4. Entidades

| Entidade | Significado | Relação |
|---|---|---|
| Parceiro | Relação comercial ou ecossistema | Possui uma ou mais réguas |
| Produto | Produto financeiro comunicado | Tem benefícios e guardrails próprios |
| Assinatura | Marca apresentada ao destinatário | Varia dentro do mesmo parceiro |
| Família de jornada | Agrupamento macro | Aquisição, Ciclo de Vida, Rentabilização |
| Tipo de jornada | Momento operacional | Topo de Funil, Welcome, Reativação |
| Segmento | Público da comunicação | Não confundir com jornada |
| Semana | Cadência editorial | Agrupa e-mails |
| E-mail | Unidade editorial | Tem uma ou mais variantes por assinatura |
| Briefing | Contrato técnico de 36 colunas | Alimenta CSV e template |
| Plano de Comunicação | Direção estratégica | Orienta criação e revisão |
| Template | HTML/AMPscript compartilhado | Renderiza os campos do briefing |

## 5. Fluxos operacionais

### Criar uma régua
Selecionar frente → parceiro → família e tipo de jornada → segmento → template →
quantidade e função dos e-mails → salvar como rascunho → completar briefing e Plano →
revisar assets, links, legal e personalização → preparar Test Send.

### Criar uma semana
Identificar a régua, definir a função da nova semana, **não reaproveitar sequência
técnica sem revisar a chave composta**, preencher o primeiro e-mail e validar a
continuidade narrativa com as semanas anteriores.

### Criar ou duplicar um e-mail
Duplicar reaproveita estrutura e campos compartilhados. **Revisar obrigatoriamente:**
assunto, pré-cabeçalho, vigência, \`UTM_CAMPANHA\`, \`SEQUENCIA\`, todos os links
(inclusive \`af_sub2\`/\`af_sub3\`), assets, nota legal e o papel no Plano de Comunicação.

### Adaptar uma régua para outro parceiro
**Preservável:** arco narrativo, papéis por e-mail, cadência, objeções trabalhadas.
**Obrigatoriamente substituído:** identidade visual, assinatura, assets, links e
tracking, produto, condições, benefícios, nota legal e nomenclatura técnica.

> Trocar o nome do parceiro no texto **não é** adaptar uma régua. Se o produto ou a
> proposta de valor mudam, a copy inteira precisa ser reescrita.

## 6. Contrato das 36 colunas

Ordem oficial. Esta tabela é gerada a partir de \`BRIEFING_COLUMNS\` no código — se
divergir do CSV, o código é a verdade.

| # | Coluna | Nome amigável | Bloco | HTML | Personalização | Chave composta | Pode ficar vazio? |
|---|---|---|---|---|---|---|---|
${columnRows}

Quando não houver dado real, use marcadores explícitos em vez de inventar:
\`%%VALOR_A_CONFIRMAR%%\`, \`%%LINK_A_CONFIRMAR%%\`, \`%%BENEFICIO_APROVADO%%\`.

## 7. Chave composta e Data Extensions

${fence(`PRODUTO      (audiência)  =  NM_PRODUTO_INTERNO  (briefing)
TP_CAMPANHA  (audiência)  =  TP_CAMPANHA         (briefing)
SEQUENCIA    (audiência)  =  SEQUENCIA           (briefing)`)}

- \`TB_CAMPANHA_AQUISICAO\` — **audiência** (quem recebe). CPF não é único: a mesma
  pessoa tem uma linha por campanha.
- \`TB_BRIEFING_CAMPANHA_AQUISICAO\` — **conteúdo** (o que é enviado). Uma linha = um e-mail.

O AMPscript resolve com \`LookupOrderedRows(..., "DT_INICIO DESC", ...)\`, valida com
\`RowCount\` e lê com \`Row\`/\`Field\`. Falhas explícitas:

| Sintoma | Causa |
|---|---|
| \`RaiseError("Dados de briefing da campanha não encontrados.")\` | chave composta não bate caractere a caractere (maiúscula e acento contam) |
| \`RaiseError("Campanha fora do prazo de vigência.")\` | \`DT_INICIO\`/\`DT_FIM\` não cobrem hoje |
| E-mail errado chegando | duplicidade de chave — o desempate por \`DT_INICIO DESC\` é acidente, não regra |
| CSV correto e nada dispara | **a jornada tem filtro de entrada próprio**, independente da chave. Não bloqueia Test Send, bloqueia o disparo automático |

## 8. Importação e exportação CSV

- exatamente 36 colunas, lidas **por nome**, nunca por posição;
- delimitador vírgula, sem BOM, CRLF, \`QUOTE_MINIMAL\`;
- marcar "Respeitar as aspas duplas como qualificadores de texto" — a caixa **some a
  cada importação** e sem ela qualquer vírgula dentro de campo derruba o arquivo inteiro;
- datas em \`MM/DD/AAAA HH:mm:ss\` (o wizard valida como inglês dos EUA, mesmo a DE
  exportando em DD/MM);
- **nenhuma quebra de linha física dentro de campo** — usar \`<br>\`;
- arquivo incremental para "Adicionar e Atualizar"; arquivo completo só em overwrite
  explícito e confirmado.

**Antes de exportar:** placeholders resolvidos (\`PEGAR NA BASE\`, \`CRIAR\` sobem sem
erro e quebram o lookup depois), personalização no formato correto, chave composta
conferida contra o briefing atual, links com tracking certo.

## 9. Plano de Comunicação

| Campo | O que preencher |
|---|---|
| Papel na régua | função deste e-mail dentro do arco (abrir, ampliar, recuperar, encerrar) |
| Objetivo do e-mail | o que ele precisa provocar |
| Objeção trabalhada | a resistência que este e-mail ataca |
| Mensagem-chave | a frase que sobra se o leitor esquecer o resto |
| Proposta de valor | a troca oferecida |
| Benefício principal / complementares | o que sustenta a promessa |
| Prova | o que torna a promessa crível |
| Ação esperada | o que o CTA pede |
| Estratégia de CTAs | por que os CTAs estão onde estão |
| Hierarquia visual | ordem de leitura pretendida |

Exportável em XLSX por produto. A reescrita por LLM é feita fora da tela e gravada por
agente autorizado no Supabase, preservando o histórico de versões.

## 10. Limitações do renderer local — leia antes de escrever AMPscript

A prévia do GaaS usa um interpretador **AMPscript-lite**, não o SFMC. Ele suporta
\`IF/ELSE/ENDIF\`, \`SET\`, \`Field\`, \`Row\`, \`RowCount\`, \`v()\`, \`TreatAsContent()\`,
\`RedirectTo()\` e \`LookupOrderedRows\`.

**Não suportado — recusado com diagnóstico:** \`FOR\`, \`WHILE\`,
\`ContentBlockByKey\`, \`HTTPGet\`/\`HTTPPost\`, \`InsertDE\`, \`UpdateDE\`, \`<script>\`.

> **\`ELSEIF\` é a armadilha mais cara.** É AMPscript válido no SFMC, mas o renderer
> local **não o interpreta e não o denuncia** — o bloco fica como \`%%[...]%%\` residual
> na prévia. Use blocos \`IF ... ENDIF\` independentes e mutuamente exclusivos, que
> funcionam nos dois ambientes.

Outros pontos:
- a prévia resolve tokens; texto que só existe dentro de \`%%=...=%%\` some da prévia;
- imagem com \`[PENDENTE MKT]\` vira placeholder ou é omitida, conforme a opção da tela;
- **a prévia local nunca substitui o Test Send.**

## 11. Defeitos recorrentes já observados nas réguas de origem

Achados reais em HTMLs recebidos de agência/analista. Verifique todos antes de importar:

1. **Merge field de Journey no lugar da personalização do motor.** Já apareceu
   \`%%FIRST_NAME%%\`, \`%%first_name%%\` e \`%%PRI_NOME%%\` — os três vazam texto literal
   aqui. O único formato válido é \`%%=v(@FirstName)=%%\` dentro de \`TreatAsContent\`.
2. **Tracking apontando para a semana errada** no meio da régua (\`af_sub2\`/\`af_sub3\`
   de outra semana). Conferir e-mail a e-mail, não por amostragem.
3. **Arte de topo clicável sem campo governado.** O contrato não tem slot de link para
   o header; um link fixo no template vira tracking fora de governança.
4. **Mais CTAs do que slots.** O contrato tem dois. Um terceiro CTA precisa de decisão
   explícita — repetir um existente em outra posição, ou abrir campo novo (DE + template).

## 12. Processo seguro de alteração de AMPscript

1. identificar a fonte canônica (nem sempre é a versão de número maior);
2. inventariar blocos, variáveis, lookups, condicionais, links, legal e fallbacks;
3. planejar a **menor** alteração que resolve;
4. ao mover um bloco, mover **junto a condição AMPscript inteira**;
5. renderizar **todas** as sequências afetadas, não só a que motivou a mudança;
6. comparar canônica × candidata: imagens, títulos, CTAs, banners, legal, rodapé, mobile;
7. rodar testes e auditoria;
8. não promover a principal com regressão conhecida;
9. encaminhar para Test Send.

## 13. Estratégia de CTAs

Mais de um CTA **não** é problema por si só — repetir a ação principal em pontos
diferentes costuma aumentar clique. As regras são: cada CTA tem função intencional;
em aquisição o destino prioritário é o app ou a solicitação; link intermediário não
pode desviar do objetivo sem justificativa; e **link, tracking, alias e destino são
validados em cada ocorrência**, não uma vez só.

## 14. Estados e prontidão

Quatro eixos independentes: **técnico**, **editorial**, **visual** e **certificação**.

\`blocked\` · \`needs_review\` · \`ready_for_test_send\` · \`sfmc_certified\`

\`sfmc_certified\` exige evidência de Test Send aprovado. Nenhum outro sinal — prévia
local, build verde, deploy publicado, dado gravado no Supabase — substitui isso.

## 15. Regras que a IA nunca deve violar

- Não inventar benefício, preço, desconto, tarifa, limite ou aprovação.
- Não transformar dado ausente em zero nem em fato confirmado.
- Não confundir parceiro, produto e assinatura; nem segmento com jornada.
- Não alterar campanha fora do escopo pedido.
- Não remover asset, CTA, bloco ou texto legal silenciosamente.
- Não duplicar chave composta.
- Não gerar CSV com quantidade ou ordem de colunas incorreta.
- Não expor CPF, e-mail de cliente, token ou credencial.
- Não tratar prévia local como equivalente ao SFMC.
- Não tratar \`ready\` como \`sfmc_certified\`.
- Não reescrever o documento inteiro quando um patch localizado resolve.
- Não promover template principal com regressão conhecida.
- **Não tratar este arquivo como eterno** — respeite a data do snapshot e confirme
  vigência antes de agir sobre condições comerciais.

## 16. Formato esperado das respostas

${fence(`Objetivo entendido
Contexto utilizado
Fatos confirmados
Informações ausentes
Mudanças propostas
Campos e registros afetados
Conteúdo ou código final
O que foi preservado
Riscos e guardrails
Como validar
Status de prontidão`)}

Para mudança em AMPscript, acrescentar: fonte canônica, sequências renderizadas,
matriz de regressão, compatibilidade, resultado esperado na prévia e pendência de
Test Send.`;
};

// -------------------------------------------------------------- fotografia

const emailSection = (
  briefings: WorkspaceBriefing[],
  strategies: EmailStrategy[],
  templates: EmailTemplateSlot[],
): string => {
  const groups = new Map<string, WorkspaceBriefing[]>();
  for (const row of briefings) {
    const key = row.__meta.campaignGroupId || row.__id;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const ordered = [...groups.entries()].sort(([, a], [, b]) => {
    const first = a[0];
    const second = b[0];
    return byText(first.__meta.partner, second.__meta.partner)
      || byText(first.__meta.segment, second.__meta.segment)
      || weekOrder(first.__meta.weekKey) - weekOrder(second.__meta.weekKey)
      || sequenceOrder(first.SEQUENCIA) - sequenceOrder(second.SEQUENCIA);
  });

  return ordered.map(([groupId, rows]) => {
    const lead = rows[0];
    const strategy = strategies.find((item) => item.campaignGroupId === groupId);
    const template = templates.find((item) => item.id === lead.__meta.templateSlotId);
    const signatures = rows.map((row) => row.__meta.subgroup || row.NM_PRODUTO_INTERNO).filter(Boolean);

    const planRows = strategy ? [
      ['Papel na régua', strategy.roleInRuler],
      ['Objetivo', strategy.emailObjective],
      ['Mensagem-chave', strategy.keyMessage],
      ['Proposta de valor', strategy.valueProposition],
      ['Benefício principal', strategy.primaryBenefit],
      ['Objeção trabalhada', strategy.objectionAddressed],
      ['Prova', strategy.proof],
      ['Ação esperada', strategy.expectedAction],
      ['Estratégia de CTAs', strategy.ctaStrategy],
      ['Hierarquia visual', strategy.visualHierarchyStrategy],
      ['Status', `técnico ${strategy.technicalStatus} · editorial ${strategy.editorialStatus} · visual ${strategy.visualStatus} · certificação ${strategy.certificationStatus}`],
    ].filter(([, value]) => clean(value)) : [];

    const briefingRows = BRIEFING_COLUMNS
      .filter((column) => clean(lead[column]))
      .map((column) => `| \`${column}\` | ${cell(truncate(clean(lead[column]), 600))} |`)
      .join('\n');

    // `null` marca linha condicional ausente; string vazia é separador intencional.
    return ([
      `### ${cell(lead.__meta.partner)} · ${cell(lead.__meta.segment)} · ${cell(lead.__meta.weekKey)} · ${cell(lead.SEQUENCIA)}`,
      '',
      `- **Assunto:** ${cell(lead.ASSUNTO)}`,
      `- **Pré-cabeçalho:** ${cell(lead.PRE_CABECALHO)}`,
      strategy?.functionalName ? `- **Nome funcional:** ${cell(strategy.functionalName)}` : null,
      `- **Template:** ${template ? `\`${cell(template.id)}\` (${cell(template.name)})` : 'herda o principal'}`,
      `- **Status do briefing:** ${cell(lead.__meta.status)} · versão ${lead.__meta.version}`,
      signatures.length > 1 ? `- **Assinaturas:** ${signatures.map((item) => cell(item)).join(', ')} (${rows.length} variantes)` : null,
      '',
      planRows.length ? `**Plano de Comunicação**\n\n| Campo | Conteúdo |\n|---|---|\n${planRows.map(([label, value]) => `| ${label} | ${cell(value)} |`).join('\n')}` : '_Plano de Comunicação ainda não preenchido._',
      '',
      `<details><summary>Briefing (${BRIEFING_COLUMNS.filter((column) => clean(lead[column])).length} de 36 campos preenchidos)</summary>\n\n| Coluna | Valor |\n|---|---|\n${briefingRows}\n\n</details>`,
    ].filter((line) => line !== null) as string[]).join('\n');
  }).join('\n\n');
};

// ------------------------------------------------------------------ gerador

export function buildAiContextMarkdown(input: AiContextMarkdownInput): AiContextMarkdownResult {
  redactionCount = 0;
  const omitted: string[] = [];
  const scopeLabel = input.scope.kind === 'all' ? 'Fábrica inteira' : input.scope.partner;

  const briefings = input.briefings
    .filter((row) => row.__meta.status !== 'archived' && inScope(row.__meta.partner, input.scope));
  const groupIds = new Set(briefings.map((row) => row.__meta.campaignGroupId || row.__id));
  const strategies = input.emailStrategies.filter((item) => groupIds.has(item.campaignGroupId) || inScope(item.partner, input.scope));
  const rulers = input.rulers.filter((item) => inScope(item.partner, input.scope));
  const segments = input.segments.filter((item) => inScope(item.partner, input.scope));
  const assets = input.assets.filter((item) => item.status !== 'archived' && inScope(item.partner, input.scope));
  const legalTexts = input.legalTexts.filter((item) => item.status !== 'archived' && inScope(item.partner, input.scope));
  const signatures = input.signatureSettings.filter((item) => inScope(item.partner, input.scope));

  // Templates do escopo — não o principal global, que pode ser de outro parceiro.
  const usedTemplateIds = new Set(briefings.map((row) => row.__meta.templateSlotId).filter(Boolean) as string[]);
  for (const ruler of rulers) if (ruler.templateSlotId) usedTemplateIds.add(ruler.templateSlotId);
  const templates = input.templates
    .filter((item) => input.scope.kind === 'all' || usedTemplateIds.has(item.id) || item.isPrincipal)
    .sort((a, b) => Number(b.isPrincipal) - Number(a.isPrincipal) || byText(a.name, b.name));

  const products = new Set(briefings.map((row) => row.NM_PRODUTO_INTERNO).filter(Boolean));
  const contexts = input.productContexts.filter((item) => input.scope.kind === 'all' || inScope(item.partner, input.scope) || products.has(item.product));
  const contextIds = new Set(contexts.map((item) => item.id));
  const guardrails = input.productGuardrails.filter((item) => contextIds.has(item.productContextId));

  const sections: string[] = [stableManual()];

  sections.push(`---

# Fotografia atual — ${cell(scopeLabel)}

> Tudo abaixo é **estado no momento do download**, não regra estrutural.
> Gerado em ${cell(new Date(input.generatedAt).toLocaleString('pt-BR'))}.

## 17. Resumo do escopo

| Item | Quantidade |
|---|---|
| E-mails editoriais | ${groupIds.size} |
| Variantes (linhas de briefing) | ${briefings.length} |
| Réguas | ${rulers.length} |
| Segmentos | ${segments.length} |
| Semanas | ${new Set(briefings.map((row) => row.__meta.weekKey).filter(Boolean)).size} |
| Parceiros | ${new Set(briefings.map((row) => row.__meta.partner).filter(Boolean)).size} |
| Produtos | ${products.size} |
| Templates | ${templates.length} |
| Assets | ${assets.length} |
| Planos de Comunicação preenchidos | ${strategies.filter((item) => clean(item.roleInRuler)).length} de ${groupIds.size} |`);

  if (rulers.length) {
    sections.push(`## 18. Réguas e hierarquia de jornada

${rulers.sort((a, b) => byText(a.partner, b.partner) || byText(a.name ?? '', b.name ?? '')).map((ruler) => [
      `### ${cell(ruler.name ?? `${ruler.partner} · ${ruler.segment}`)}`,
      '',
      `| Campo | Conteúdo |`,
      `|---|---|`,
      `| Parceiro · Produto · Segmento | ${cell(ruler.partner)} · ${cell(ruler.product)} · ${cell(ruler.segment)} |`,
      `| Jornada | ${cell(ruler.journeyFamily)} → ${cell(ruler.journeyType)} |`,
      `| Estágio | ${cell(ruler.journeyStage)} |`,
      `| Objetivo | ${cell(ruler.objective)} |`,
      `| Audiência | ${cell(ruler.audience)} |`,
      `| Transformação narrativa | ${cell(ruler.narrativeTransformation)} |`,
      `| Objeções | ${ruler.objections.length ? ruler.objections.map((item) => cell(item)).join(' · ') : '—'} |`,
      `| Intensidade comercial | ${cell(ruler.commercialIntensity)} |`,
      `| Critério de sucesso | ${cell(ruler.successCriteria)} |`,
      `| Template | ${cell(ruler.templateSlotId)} |`,
      `| Status editorial | ${cell(ruler.editorialStatus)} |`,
    ].join('\n')).join('\n\n')}`);
  } else omitted.push('18. Réguas (nenhuma régua governada no escopo)');

  if (segments.length) {
    sections.push(`## 18b. Segmentos

| Nome técnico | Exibição | Frente | Parceiro | Origem | Governança |
|---|---|---|---|---|---|
${segments.sort((a, b) => byText(a.displayName, b.displayName)).map((item) => `| \`${cell(item.technicalName)}\` | ${cell(item.displayName)} | ${cell(item.businessFront)} | ${cell(item.partner)} | ${cell(item.origin)} | ${cell(item.governanceStatus)} |`).join('\n')}`);
  }

  if (briefings.length) {
    sections.push(`## 19. E-mails do escopo\n\n${emailSection(briefings, strategies, templates)}`);
  } else omitted.push('19. E-mails (escopo sem briefing ativo)');

  if (assets.length) {
    sections.push(`## 20. Biblioteca de ativos

Inventário sem binário. A URL é pública do servidor de imagens da Afinz.

| Nome | Slot | Parceiro | Produto | Status | Tags | URL |
|---|---|---|---|---|---|---|
${assets.sort((a, b) => byText(a.name, b.name)).map((item) => `| ${cell(item.name)} | ${cell(item.slot)} | ${cell(item.partner)} | ${cell(item.product)} | ${cell(item.status)} | ${item.tags.length ? item.tags.map((tag) => cell(tag)).join(', ') : '—'} | ${cell(item.externalUrl)} |`).join('\n')}

> Slot novo não nasce só adicionando coluna no CSV: exige campo na Data Extension
> **e** bloco condicional no template.`);
  } else omitted.push('20. Ativos (nenhum ativo no escopo)');

  if (templates.length) {
    sections.push(`## 21. Templates

| ID | Nome | Papel no escopo | Versão | Campos usados | Atualizado |
|---|---|---|---|---|---|
${templates.map((item) => {
      const used = BRIEFING_COLUMNS.filter((column) => item.source.includes(`"${column}"`));
      // O principal é global: num escopo de parceiro ele pode ser de outro parceiro,
      // e só vale como fallback de briefing sem template próprio.
      const role = usedTemplateIds.has(item.id)
        ? 'usado neste escopo'
        : item.isPrincipal ? '**principal global** — fallback, pode ser de outro parceiro' : 'disponível';
      return `| \`${cell(item.id)}\` | ${cell(item.name)} | ${role} | ${item.version} | ${used.length} de 36 | ${cell(item.updatedAt)} |`;
    }).join('\n')}

${templates.map((item) => {
      const used = BRIEFING_COLUMNS.filter((column) => item.source.includes(`"${column}"`));
      const unused = BRIEFING_COLUMNS.filter((column) => !used.includes(column));
      return `**\`${cell(item.id)}\`** — campos não lidos por este template: ${unused.length ? unused.map((column) => `\`${column}\``).join(', ') : 'nenhum'}.`;
    }).join('\n\n')}

${input.includeTemplateSource
      ? templates.map((item) => `<details><summary>AMPscript de <code>${cell(item.id)}</code> (${item.source.length} bytes)</summary>\n\n${fence(item.source, 'html')}\n\n</details>`).join('\n\n')
      : '_O AMPscript integral não foi incluído neste download. Marque a opção "incluir código dos templates" se a IA precisar editar o HTML._'}`);
  } else omitted.push('21. Templates (nenhum template no escopo)');

  if (contexts.length) {
    sections.push(`## 22. Contexto de produto e guardrails

${contexts.sort((a, b) => byText(a.product, b.product)).map((context) => {
      const rules = guardrails.filter((item) => item.productContextId === context.id && item.status !== 'archived');
      return [
        `### ${cell(context.product)}${context.partner ? ` · ${cell(context.partner)}` : ''}`,
        '',
        `| Campo | Conteúdo |`,
        `|---|---|`,
        `| Proposta de valor | ${cell(context.valueProposition)} |`,
        `| Diferenciais | ${context.differentiators.length ? context.differentiators.map((item) => cell(item)).join(' · ') : '—'} |`,
        `| Público elegível | ${cell(context.eligibleAudience)} |`,
        `| Tom de voz | ${cell(context.toneOfVoice)} |`,
        `| Contexto de marca | ${cell(context.brandContext)} |`,
        `| Fonte · vigência | ${cell(context.provenance)} · ${cell(context.validFrom)} a ${cell(context.validTo)} |`,
        '',
        rules.length
          ? `| Tipo | Título | Regra | Severidade | Citação | Categoria | Valor | Confiança |\n|---|---|---|---|---|---|---|---|\n${rules.map((item) => `| ${cell(item.guardrailType)} | ${cell(item.title)} | ${cell(truncate(clean(item.ruleText), 300))} | ${cell(item.severity)} | ${cell(item.allowedStatus)} | ${cell(item.category)} | ${cell(item.valueExact)} | ${item.confidence == null ? '—' : `${Math.round(item.confidence * 100)}%`} |`).join('\n')}`
          : '_Sem guardrails cadastrados para este produto._',
      ].join('\n');
    }).join('\n\n')}

> Distinga sempre benefício **do clube**, benefício **do cartão**, capacidade **da
> bandeira** e **campanha promocional temporária**. Guardrail \`hard_block\` ou
> \`blocked\` não é sugestão: é proibição.`);
  } else omitted.push('22. Contexto de produto (nenhum produto governado no escopo)');

  if (legalTexts.length) {
    sections.push(`## 23. Textos legais governados

| Nome | Parceiro | Tipo de campanha | Status | Texto |
|---|---|---|---|---|
${legalTexts.sort((a, b) => byText(a.name, b.name)).map((item) => `| ${cell(item.name)} | ${cell(item.partner)} | ${cell(item.campaignType)} | ${cell(item.status)} | ${cell(truncate(clean(item.legalText), 400))} |`).join('\n')}`);
  } else omitted.push('23. Textos legais (nenhum texto legal governado)');

  if (signatures.length) {
    sections.push(`## 24. Assinaturas

| Parceiro | Chave | Rótulo | Status |
|---|---|---|---|
${signatures.sort((a, b) => byText(a.partner, b.partner) || byText(a.signatureKey, b.signatureKey)).map((item) => `| ${cell(item.partner)} | \`${cell(item.signatureKey)}\` | ${cell(item.signatureLabel)} | ${cell(item.status)} |`).join('\n')}`);
  }

  if (input.reviewSuggestions.length) {
    sections.push(`## 25. Sugestões externas pendentes

| Campo | Sugestão | Justificativa | Confiança | Status |
|---|---|---|---|---|
${input.reviewSuggestions.map((item) => `| ${cell(item.fieldName)} | ${cell(truncate(clean(String(item.suggestedValue ?? '')), 200))} | ${cell(truncate(clean(item.justification), 200))} | ${item.confidence == null ? '—' : `${Math.round(item.confidence * 100)}%`} | ${cell(item.status)} |`).join('\n')}`);
  } else omitted.push('25. Sugestões externas (nenhuma registrada)');

  if (omitted.length) {
    sections.push(`## Seções omitidas neste snapshot\n\nSem dado no escopo — ausência de registro, não ausência da capacidade:\n\n${omitted.map((item) => `- ${item}`).join('\n')}`);
  }

  sections.push(`---

**Este pacote não certifica envio.** Prévia local, build, dado no Supabase e deploy
público não substituem o **Test Send no SFMC**, que é o único a validar lookup real,
AMPscript, SubscriberKey, personalização, assunto, pré-cabeçalho, Profile Center,
endereço físico, tracking e renderização no cliente de e-mail.`);

  const body = sections.join('\n\n');
  const bytes = new TextEncoder().encode(body).length;
  const estimatedTokens = Math.round(bytes / 4);

  const frontmatter = [
    '---',
    'document_type: gaas_email_factory_context',
    `schema_version: ${AI_CONTEXT_SCHEMA_VERSION}`,
    `generated_at: ${input.generatedAt}`,
    `scope: ${input.scope.kind === 'all' ? 'full_factory' : `partner:${input.scope.partner}`}`,
    'contains_pii: false',
    `redactions: ${redactionCount}`,
    `includes_template_source: ${Boolean(input.includeTemplateSource)}`,
    `estimated_tokens: ${estimatedTokens}`,
    'sfmc_certification_required: true',
    '---',
    '',
    `# Contexto da Fábrica de E-mails Afinz — ${scopeLabel}`,
    '',
  ].join('\n');

  const content = `${frontmatter}${body}\n`;
  const scopeSlug = input.scope.kind === 'all' ? '' : `_${slugify(input.scope.partner)}`;
  const day = input.generatedAt.slice(0, 10);

  return {
    filename: `Contexto_Fabrica_de_Emails_Afinz${scopeSlug}_${day}.md`,
    content,
    bytes: new TextEncoder().encode(content).length,
    estimatedTokens,
    redactions: redactionCount,
    includedTemplateSource: Boolean(input.includeTemplateSource),
    omittedSections: omitted,
  };
}
