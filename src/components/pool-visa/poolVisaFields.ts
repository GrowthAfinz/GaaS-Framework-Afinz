import type { ReportFieldDef, ReportFieldProfile } from '../relatorio/ReportColumnEditor';
import type { CoveredSum, PoolAggregate, PoolDimensionKey } from './poolVisaModel';

export const POOL_LAYER_LABELS: Record<string, string> = {
  common: 'Comum',
  sfmc: 'Comunicação · SFMC',
  ga4: 'LP · GA4',
  vitrine: 'Vitrine · SFMC',
  safra: 'Safra · SFMC',
  negocio: 'Resultado de negócio',
};

const SFMC = 'rentabilizacao_activities';
const SFMC_GRAIN = 'disparo × dia';
const GA4_PENDING = 'GA4 ainda não integrado ao GaaS. A leitura existe na análise do GA4, mas a carga diária não foi construída.';
const VITRINE_PENDING = 'Histórico da vitrine por rodada ainda não está no GaaS. As extrações da DE mostram rodadas alteradas depois de usadas.';
const SAFRA_PENDING = 'A célula existe só na safra (VDV_FUNIL), sem vínculo com o envio real. Não dá para cruzar com enviados.';

type MetricFormat = 'number' | 'percent' | 'currency';

export interface PoolMetricField extends ReportFieldDef {
  kind: 'metric';
  format: MetricFormat;
  value: (row: PoolAggregate) => number | null;
  coverage?: (row: PoolAggregate) => CoveredSum;
}
export interface PoolDimensionField extends ReportFieldDef {
  kind: 'dimension';
  dimension?: PoolDimensionKey;
}
export type PoolField = PoolMetricField | PoolDimensionField;

const dim = (key: string, label: string, category: string, definition: string, dimension?: PoolDimensionKey, extra: Partial<Omit<ReportFieldDef, 'key' | 'kind'>> = {}): PoolDimensionField => ({
  key, label, kind: 'dimension', category, layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, definition,
  availability: { state: 'available' }, dimension, ...extra,
});

const pending = (key: string, label: string, kind: 'dimension' | 'metric', layer: string, category: string, definition: string, note: string): PoolField =>
  kind === 'metric'
    ? { key, label, kind, layer, category, source: POOL_LAYER_LABELS[layer], grain: 'a definir', definition, format: 'number', value: () => null, availability: { state: 'unavailable', note } }
    : { key, label, kind, layer, category, source: POOL_LAYER_LABELS[layer], grain: 'a definir', definition, availability: { state: 'unavailable', note } };

export const POOL_FIELDS: PoolField[] = [
  dim('date', 'Data do disparo', 'Tempo', 'Data de disparo gravada na fonte.', 'date', { layer: 'common', grain: 'dia' }),
  dim('month', 'Mês', 'Tempo', 'Mês da data de disparo.', 'month', { layer: 'common', grain: 'mês' }),
  dim('bu', 'BU', 'Estratégia', 'Afinz para a jornada JOR_RENT_POOL_OFERTAS_VDV (gravada como B2C) e Plurix para JOR_RENT_POOL_OFERTAS_VDV_PLURIX.', 'bu'),
  dim('channel', 'Canal', 'Estratégia', 'Canal do disparo informado no SFMC.', 'channel'),
  dim('journey', 'Jornada', 'Estratégia', 'Nome da jornada no SFMC.', 'journey'),
  dim('activityName', 'Activity name', 'Estratégia', 'Taxonomia do disparo.', 'activityName'),
  dim('touch', 'Toque', 'Estratégia', 'Número lido do token dispN do activity name. O mesmo toque pode aparecer em mais de um dia.', 'touch', { availability: { state: 'derived', note: 'Lido do nome da atividade.' } }),
  dim('kind', 'Tipo de linha', 'Estratégia', 'Disparo do Pool ou resposta de opt-out do WhatsApp (token optout no nome).', 'kind', { availability: { state: 'derived', note: 'Lido do nome da atividade.' } }),
  dim('audience', 'Público (WhatsApp)', 'Estratégia', 'Institucional (inst) ou Parceiro (parc), lido do nome das peças de WhatsApp. Ausente nos outros canais.', 'audience', { availability: { state: 'derived', note: 'Só WhatsApp; lido do nome.' } }),
  dim('pieceGroup', 'Grupo da peça (WhatsApp)', 'Estratégia', 'Vitrine da peça enviada (moda, beleza, presentes, geral = Genérico), lida do nome. Não é o grupo da pessoa na safra.', 'pieceGroup', { availability: { state: 'derived', note: 'Só WhatsApp; lido do nome.' } }),
  pending('cell', 'Célula do teste', 'dimension', 'safra', 'Experimento', 'SEG-A, SEG-B, SEG-C, GEN-A ou GEN-C, definida na safra.', SAFRA_PENDING),
  pending('safraGroup', 'Grupo na safra', 'dimension', 'safra', 'Experimento', 'Grupo de afinidade da pessoa, congelado na entrada da safra.', SAFRA_PENDING),
  pending('round', 'Rodada da vitrine', 'dimension', 'vitrine', 'Vitrine', 'VERSAO da VDV_POOL_OFERTAS_GRUPO_POSICAO.', VITRINE_PENDING),
  pending('position', 'Posição na vitrine', 'dimension', 'vitrine', 'Vitrine', 'Posição 1 a 6 da oferta na rodada; 1 a 3 principais.', VITRINE_PENDING),
  pending('brand', 'Marca da oferta', 'dimension', 'ga4', 'LP e ofertas', 'Parâmetro marca do evento clique_oferta.', GA4_PENDING),
  pending('offerId', 'ID da oferta', 'dimension', 'ga4', 'LP e ofertas', 'Parâmetro oferta_id do evento clique_oferta.', GA4_PENDING),
  pending('sourceMedium', 'Origem / mídia da sessão', 'dimension', 'ga4', 'LP e ofertas', 'sessionSourceMedium do GA4. O WhatsApp hoje chega como direto, sem UTM.', GA4_PENDING),
  {
    key: 'dispatches', label: 'Linhas de disparo', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'number',
    definition: 'Quantidade de linhas atividade × dia no recorte.', availability: { state: 'available' }, value: (r) => r.dispatches,
  },
  {
    key: 'sent', label: 'Enviados', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'number',
    definition: 'Soma de Base Total (base enviada).', availability: { state: 'available' }, value: (r) => r.sent.value, coverage: (r) => r.sent,
  },
  {
    key: 'delivered', label: 'Entregues', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'number',
    definition: 'Soma de Base Acionável (base entregue).', availability: { state: 'available' }, value: (r) => r.delivered.value, coverage: (r) => r.delivered,
  },
  {
    key: 'deliveryRate', label: '% Entrega', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'percent',
    definition: 'Entregues ÷ Enviados, recalculado depois de agrupar.', availability: { state: 'derived' }, value: (r) => r.deliveryRate,
  },
  {
    key: 'opens', label: 'Aberturas / leituras', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'number',
    definition: 'Soma de Abertura. No e-mail é abertura; no WhatsApp é leitura; o SMS não informa.', availability: { state: 'available' }, value: (r) => r.opens.value, coverage: (r) => r.opens,
  },
  {
    key: 'openRate', label: '% Abertura / leitura', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'percent',
    definition: 'Aberturas ÷ Entregues, só nas linhas que informam abertura.', availability: { state: 'derived' }, value: (r) => r.openRate,
  },
  {
    key: 'clicks', label: 'Cliques na comunicação', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'number',
    definition: 'Soma de Cliques registrados pelo SFMC na mensagem. Não é clique na LP nem na oferta.', availability: { state: 'available' }, value: (r) => r.clicks.value, coverage: (r) => r.clicks,
  },
  {
    key: 'ctrDelivered', label: 'CTR sobre entregues', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'percent',
    definition: 'Cliques ÷ Entregues, só nas linhas que informam clique.', availability: { state: 'derived' }, value: (r) => r.ctrDelivered,
  },
  {
    key: 'ctor', label: 'CTOR', kind: 'metric', category: 'Comunicação', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'percent',
    definition: 'Cliques ÷ Aberturas, só nas linhas que informam os dois.', availability: { state: 'derived' }, value: (r) => r.ctor,
  },
  { key: 'channelCost', label: 'Custo do canal', kind: 'metric', category: 'Custo', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'currency',
    definition: 'Custo registrado ou estimado pela tarifa vigente × base acionável.', availability: { state: 'derived' }, value: (r) => r.channelCost.value, coverage: (r) => r.channelCost, },
  { key: 'messageCpc', label: 'CPC da mensagem', kind: 'metric', category: 'Custo', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'currency',
    definition: 'Custo dividido por cliques SFMC nas linhas com ambos os indicadores.', availability: { state: 'derived' }, value: (r) => r.messageCpc, },
  { key: 'costPerThousand', label: 'Custo por mil acionados', kind: 'metric', category: 'Custo', layer: 'sfmc', source: SFMC, grain: SFMC_GRAIN, format: 'currency',
    definition: 'Custo × 1.000 dividido pela base acionável das mesmas linhas.', availability: { state: 'derived' }, value: (r) => r.costPerThousand, },
  pending('lpSessions', 'Sessões na LP', 'metric', 'ga4', 'LP e ofertas', 'Sessões com page_view em /black afinz.', GA4_PENDING),
  pending('offerClicks', 'Cliques em ofertas', 'metric', 'ga4', 'LP e ofertas', 'Eventos clique_oferta na LP. Contagem de eventos, não de pessoas.', GA4_PENDING),
  pending('visaSiteClicks', 'Cliques no site Visa', 'metric', 'ga4', 'LP e ofertas', 'Eventos clique_site_visa na LP.', GA4_PENDING),
  pending('cellPopulation', 'População alocada', 'metric', 'safra', 'Experimento', 'CPFs na safra por grupo e célula, inclusive controles.', SAFRA_PENDING),
  pending('purchases', 'Compras na oferta', 'metric', 'negocio', 'Resultado', 'Compra no estabelecimento ou categoria da oferta, conforme medição da IN.', 'Fonte de compras ainda não conciliada com o GaaS.'),
];

export const POOL_FIELD_BY_KEY = new Map(POOL_FIELDS.map((f) => [f.key, f]));

export const POOL_DEFAULT_COLUMNS = ['date', 'bu', 'channel', 'touch', 'sent', 'delivered', 'deliveryRate', 'opens', 'clicks', 'channelCost', 'messageCpc'];

export const POOL_PROFILES: ReportFieldProfile[] = [
  { key: 'operacao', label: 'Operação', description: 'O que saiu, quando e por qual canal.', fields: POOL_DEFAULT_COLUMNS },
  { key: 'engajamento', label: 'Engajamento', description: 'Aberturas, cliques e taxas com cobertura.', fields: ['bu', 'channel', 'sent', 'delivered', 'opens', 'openRate', 'clicks', 'ctrDelivered', 'ctor'] },
  { key: 'pecas', label: 'Peças WhatsApp', description: 'Público e grupo da peça lidos do nome.', fields: ['date', 'audience', 'pieceGroup', 'kind', 'delivered', 'opens', 'openRate'] },
  { key: 'atividades', label: 'Por atividade', description: 'Uma linha por activity name e dia.', fields: ['date', 'bu', 'channel', 'activityName', 'kind', 'sent', 'delivered', 'opens', 'clicks'] },
  { key: 'lp', label: 'LP e ofertas', description: 'Sessões e cliques por marca e oferta.', fields: ['date', 'brand', 'offerId', 'lpSessions', 'offerClicks'], disabledReason: GA4_PENDING },
  { key: 'jornada', label: 'Jornada completa', description: 'Comunicação, LP e resultado lado a lado.', fields: [], disabledReason: 'Depende do GA4 e da fonte de compras, além de uma chave comum entre as camadas.' },
];

export function formatPoolMetric(value: number | null, format: MetricFormat): string {
  if (value === null) return '—';
  if (format === 'currency') return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (format === 'percent') return `${(value * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%`;
  return value.toLocaleString('pt-BR');
}
