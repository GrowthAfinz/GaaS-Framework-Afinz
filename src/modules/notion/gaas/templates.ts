/** Modelos do GaaS para a galeria do módulo (no lugar dos exemplos do notion-clone). */
import type { Block, BlockType } from '../types/notion';
import type { TemplateDefinition } from '../components/layout/TemplatesModal';
import { generateId } from '../utils/id';

const cover = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`)}`;

type Spec = [BlockType, string, Partial<Block>?];
const build = (specs: Spec[]): Block[] => specs.map(([type, content, extra]) => ({ id: generateId('blk'), type, content, ...(extra || {}) }));
const section = (title: string, hint: string): Spec[] => [['heading_3', title], ['paragraph', hint]];

export const GAAS_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'gaas_spec', name: 'Spec SDD', category: 'SDD', icon: '📐', cover: cover('#0e7490', '#7c3aed'),
    description: 'Especificação no formato Spec Driven Development: problema, comportamento esperado, cenários, plano e verificação.',
    tags: ['SDD', 'Desenvolvimento'],
    createData: () => ({
      pageTitle: 'Nova spec', icon: '📐', cover: cover('#0e7490', '#7c3aed'),
      blocks: build([
        ['callout', 'Antes de executar, registre comportamento esperado, cenários e verificação.', { icon: '📌', backgroundColor: 'blue' }],
        ...section('Problema e contexto atual', 'O que acontece hoje e por que precisa mudar.'),
        ...section('Comportamento esperado', 'Como deve funcionar depois da entrega.'),
        ['heading_3', 'Cenários e critérios observáveis'], ['to_do', 'Cenário 1'], ['to_do', 'Cenário 2'],
        ...section('Fora desta entrega', 'O que fica para depois.'),
        ...section('Alternativas e decisão técnica', 'Opções consideradas e a escolhida, com o porquê.'),
        ...section('Plano de execução', 'Passos e dependências.'),
        ...section('Verificação e recuperação', 'Como confirmar que funcionou e como desfazer se der errado.'),
      ]),
    }),
  },
  {
    id: 'gaas_experimento', name: 'Experimento A/B', category: 'Testes', icon: '🧪', cover: cover('#db2777', '#7c3aed'),
    description: 'Desenho completo de teste: hipótese, população, alocação, células, métrica, janela e critério de decisão.',
    tags: ['Teste A/B', 'CRM'],
    createData: () => ({
      pageTitle: 'Novo experimento', icon: '🧪', cover: cover('#db2777', '#7c3aed'),
      blocks: build([
        ['callout', 'Encerrar exige leitura e decisão explícita, que pode ser inconclusiva. Abertura e clique não confirmam venda.', { icon: '⚖️', backgroundColor: 'purple' }],
        ...section('Hipótese', 'Se fizermos X para o público Y, esperamos Z porque...'),
        ...section('População elegível', 'Quem entra, de qual base e com quais exclusões.'),
        ...section('Unidade e regra de alocação', 'CPF, conta ou disparo; como sorteia entre as células.'),
        ...section('Células e controle', 'O que muda em cada célula; o grupo de controle sem envio.'),
        ...section('Métrica principal e denominador', 'Ex.: cartões emitidos ÷ base acionável.'),
        ...section('Métricas de proteção', 'O que não pode piorar (descadastro, reclamação, custo).'),
        ...section('Janela de leitura', 'D+7 e D+15 de acompanhamento, D+30 de leitura.'),
        ...section('Critério de decisão', 'O que precisa acontecer para escalar, ajustar ou parar.'),
        ['divider', ''],
        ...section('Leitura e conclusão', 'Preencher na leitura: resultado, limitações e decisão.'),
      ]),
    }),
  },
  {
    id: 'gaas_investigacao', name: 'Investigação', category: 'Testes', icon: '🔎', cover: cover('#ea580c', '#f59e0b'),
    description: 'Pergunta, escopo e fontes, achados, hipóteses, limitações e a próxima verificação sugerida.',
    tags: ['Análise'],
    createData: () => ({
      pageTitle: 'Nova investigação', icon: '🔎', cover: cover('#ea580c', '#f59e0b'),
      blocks: build([
        ...section('Pergunta da investigação', 'O que queremos responder.'),
        ...section('Escopo e fontes', 'Período, bases e consultas usadas.'),
        ...section('Achados e conexões', 'O que os dados mostram, com a fonte de cada número.'),
        ...section('Hipóteses a validar', 'Explicações possíveis, ainda não confirmadas.'),
        ...section('Limitações', 'Cobertura, janela e comparabilidade.'),
        ...section('Próxima verificação ou decisão sugerida', 'O passo seguinte.'),
      ]),
    }),
  },
  {
    id: 'gaas_aposta', name: 'Aposta', category: 'Testes', icon: '🎯', cover: cover('#15803d', '#0e7490'),
    description: 'Hipótese, ação, baseline, expectativa, critério de sucesso e janela. A verificação fica no fim da página.',
    tags: ['Aposta', 'Outcome'],
    createData: () => ({
      pageTitle: 'Nova aposta', icon: '🎯', cover: cover('#15803d', '#0e7490'),
      blocks: build([
        ...section('Hipótese', 'O que acreditamos que vai acontecer.'),
        ...section('Ação', 'O que vamos fazer e quando.'),
        ...section('Baseline', 'O número de hoje, com período e fonte.'),
        ...section('Expectativa', 'Quanto esperamos mover.'),
        ...section('Critério de sucesso', 'O que conta como acerto.'),
        ...section('Janela', 'Quando ler o resultado.'),
        ['divider', ''],
        ['heading_2', 'Verificação'],
        ['to_do', 'A ação foi executada como planejado'], ['to_do', 'O dado da janela está disponível e comparável'],
        ...section('Resultado e aprendizado', 'Confirmado, parcial, não confirmado ou inconclusivo, e o que reaproveitar.'),
      ]),
    }),
  },
  {
    id: 'gaas_decisao', name: 'Registro de decisão', category: 'Operação', icon: '⚖️', cover: cover('#334155', '#0e7490'),
    description: 'Decisão, contexto, alternativas, fundamento e quando revisar. Revisões viram uma nova página, sem apagar a anterior.',
    tags: ['Decisão'],
    createData: () => ({
      pageTitle: 'Nova decisão', icon: '⚖️', cover: cover('#334155', '#0e7490'),
      blocks: build([
        ...section('Decisão', 'O que foi decidido, numa frase.'),
        ...section('Contexto', 'O que levou à decisão.'),
        ...section('Alternativas consideradas', 'O que ficou de fora e por quê.'),
        ...section('Fundamento e fonte', 'Dados, nota da Wiki ou conversa que sustentam.'),
        ...section('Revisar em', 'Data ou gatilho para rever.'),
      ]),
    }),
  },
  {
    id: 'gaas_daily', name: 'Pauta da daily', category: 'Operação', icon: '📅', cover: cover('#00C6CC', '#0e7490'),
    description: 'Resultado de ontem, tópicos do dia, bloqueios e decisões para conduzir a daily.',
    tags: ['Daily'],
    createData: () => ({
      pageTitle: 'Daily', icon: '📅', cover: cover('#00C6CC', '#0e7490'),
      blocks: build([
        ['callout', 'Resultado de ontem: emissões B2C e cartões CRM (consulte a Visão Daily).', { icon: '📈', backgroundColor: 'blue' }],
        ['heading_3', 'Tópicos de hoje'], ['to_do', ''],
        ['heading_3', 'Bloqueios'], ['bulleted_list_item', ''],
        ['heading_3', 'Decisões'], ['bulleted_list_item', ''],
      ]),
    }),
  },
];
export const GAAS_TEMPLATE_CATEGORIES = ['Todos', 'SDD', 'Testes', 'Operação'];
