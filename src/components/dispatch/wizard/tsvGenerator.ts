import { generateSafra, CUSTO_UNITARIO_CANAL, CUSTO_UNITARIO_OFERTA } from '../../../constants/frameworkFields';
import type { WizardState, DispatchRow } from './types';

const fmt = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtBRL = (n: number) => `R$ ${fmt(n)}`;
const fmtPct = (n: number) => `${fmt(n)}%`;

/**
 * Gera linhas TSV na ordem exata do Excel do framework.
 * Cada DispatchRow do wizard gera uma linha.
 * Campos sem dados reais recebem valores padrão neutros (sem formulas Excel).
 */
export function generateTSV(state: WizardState): string {
  const HEADERS = [
    'Disparado?',
    'Jornada',
    'Activity name / Taxonomia',
    'Canal',
    'Data de Disparo',
    'Data Fim',
    'Safra',
    'BU',
    'Parceiro',
    'SIGLA',
    'Segmento',
    'SIGLA',
    'Subgrupos',
    'Base Total',
    'Base Acionável',
    '% Otimização de base',
    'Etapa de aquisição',
    'Ordem de disparo',
    'Perfil de Crédito',
    'Produto',
    'Oferta',
    'Promocional',
    'SIGLA',
    'Oferta 2',
    'Promocional 2',
    'Custo Unitário Oferta',
    'Custo Total da Oferta',
    'Custo unitário do canal',
    'Custo total canal',
    'Taxa de Entrega',
    'Abertura',
    'Taxa de Abertura',
    'Cliques',
    'Taxa de Clique',
    'Taxa de Proposta',
    'Taxa de Aprovação',
    'Taxa de Finalização',
    'Taxa de Conversão',
    'Custo Total Campanha',
    'CAC',
    'Cartões Gerados',
    'Aprovados',
    'Propostas',
    'Emissões Independentes',
    'Emissões Assistidas',
  ];

  const rows = state.dispatches.map((d: DispatchRow) => {
    const safra = generateSafra(d.dataInicio);

    const cuUnitarioCanal = d.canal ? (CUSTO_UNITARIO_CANAL[d.canal] ?? 0) : 0;
    const cuUnitarioOferta = state.oferta ? (CUSTO_UNITARIO_OFERTA[state.oferta] ?? 0) : 0;

    const baseAcionavel = state.baseAcionavel > 0 ? state.baseAcionavel : state.baseTotal;
    const custoTotalCanal = baseAcionavel > 0 ? baseAcionavel * cuUnitarioCanal : 0;
    const custoTotalOferta = baseAcionavel > 0 ? baseAcionavel * cuUnitarioOferta : 0;
    const custoTotalCampanha = custoTotalCanal + custoTotalOferta;

    const otimizacaoBase =
      state.baseTotal > 0 && baseAcionavel > 0
        ? fmtPct((baseAcionavel / state.baseTotal) * 100)
        : '#DIV/0!';

    const cols = [
      'Sim',                          // Disparado?
      state.jornada,                  // Jornada
      d.activityName,                 // Activity name
      d.canal,                        // Canal
      d.dataInicio,                   // Data de Disparo
      d.dataFim,                      // Data Fim
      safra,                          // Safra
      state.bu,                       // BU
      state.parceiro,                 // Parceiro
      'N/A',                          // SIGLA
      state.segmento,                 // Segmento
      'N/A',                          // SIGLA
      state.subgrupo,                 // Subgrupos
      state.baseTotal > 0 ? String(state.baseTotal) : '',        // Base Total
      baseAcionavel > 0 ? String(baseAcionavel) : '',             // Base Acionável
      otimizacaoBase,                 // % Otimização de base
      state.etapaAquisicao,           // Etapa de aquisição
      String(d.ordem),                // Ordem de disparo
      state.perfilCredito,            // Perfil de Crédito
      state.produto,                  // Produto
      state.oferta,                   // Oferta
      state.promocional,              // Promocional
      'N/A',                          // SIGLA
      state.oferta2,                  // Oferta 2
      state.promo2,                   // Promocional 2
      cuUnitarioOferta > 0 ? fmtBRL(cuUnitarioOferta) : 'R$ 0,00', // Custo Unitário Oferta
      custoTotalOferta > 0 ? fmtBRL(custoTotalOferta) : 'R$ 0,00', // Custo Total da Oferta
      fmtBRL(cuUnitarioCanal),        // Custo unitário do canal
      custoTotalCanal > 0 ? fmtBRL(custoTotalCanal) : 'R$ 0,00',   // Custo total canal
      fmtPct(0),                      // Taxa de Entrega
      '0',                            // Abertura
      fmtPct(0),                      // Taxa de Abertura
      '0',                            // Cliques
      fmtPct(0),                      // Taxa de Clique
      fmtPct(0),                      // Taxa de Proposta
      fmtPct(0),                      // Taxa de Aprovação
      fmtPct(0),                      // Taxa de Finalização
      fmtPct(0),                      // Taxa de Conversão
      custoTotalCampanha > 0 ? fmtBRL(custoTotalCampanha) : 'R$ 0,00', // Custo Total Campanha
      'R$ 0,00',                      // CAC
      '(aguardando)',                 // Cartões Gerados
      '0',                            // Aprovados
      '0',                            // Propostas
      '0',                            // Emissões Independentes
      '0',                            // Emissões Assistidas
    ];

    return cols.join('\t');
  });

  return [HEADERS.join('\t'), ...rows].join('\n');
}
