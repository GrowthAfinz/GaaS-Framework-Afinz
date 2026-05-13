import { useCallback } from 'react';
import { CalendarData } from '../types/framework';
import { downloadCSV, Row } from '../utils/exporters';

const br = (n: number | null | undefined) =>
  n === null || n === undefined ? null : Number(n);

export const useExport = () => {
  // Consolidado por Jornada
  const exportJourneyCSV = useCallback((data: CalendarData, filename: string) => {
    const map: { [jornada: string]: any } = {};
    Object.values(data).forEach(acts => {
      acts.forEach(a => {
        const jorn = a.jornada || 'Sem Jornada';
        if (!map[jorn]) {
          map[jorn] = {
            Jornada: jorn,
            BU: new Set<string>(),
            Parceiros: new Set<string>(),
            Canais: new Set<string>(),
            Segmentos: new Set<string>(),
            BaseEnviada: 0,
            BaseEntregue: 0,
            Propostas: 0,
            Aprovados: 0,
            Emissoes: 0,
            CustoTotal: 0,
          };
        }
        const m = map[jorn];
        m.BU.add(a.bu);
        if (a.parceiro) m.Parceiros.add(a.parceiro);
        if (a.canal) m.Canais.add(a.canal);
        if (a.segmento) m.Segmentos.add(a.segmento);
        m.BaseEnviada += br(a.kpis.baseEnviada) || 0;
        m.BaseEntregue += br(a.kpis.baseEntregue) || 0;
        m.Propostas += br(a.kpis.propostas) || 0;
        m.Aprovados += br(a.kpis.aprovados) || 0;
        m.Emissoes += br(a.kpis.emissoes) || 0;
        m.CustoTotal += br(a.kpis.custoTotal) || 0;
      });
    });

    const rows: Row[] = Object.values(map).map((m: any) => {
      const percEntrega = m.BaseEnviada > 0 ? (m.BaseEntregue / m.BaseEnviada) * 100 : 0;
      const percPropostas = m.BaseEntregue > 0 ? (m.Propostas / m.BaseEntregue) * 100 : 0;
      const percAprovados = m.Propostas > 0 ? (m.Aprovados / m.Propostas) * 100 : 0;
      const percFinalizacao = m.Propostas > 0 ? (m.Emissoes / m.Propostas) * 100 : 0;
      const percConvBase = m.BaseEntregue > 0 ? (m.Emissoes / m.BaseEntregue) * 100 : 0;
      const cac = m.Emissoes > 0 ? m.CustoTotal / m.Emissoes : 0;
      return {
        Jornada: m.Jornada,
        BU: Array.from(m.BU).join('|'),
        Parceiros: Array.from(m.Parceiros).join('|'),
        Canais: Array.from(m.Canais).join('|'),
        Segmentos: Array.from(m.Segmentos).join('|'),
        'Base enviada': m.BaseEnviada,
        'Base entregue': m.BaseEntregue,
        '% Entrega': percEntrega.toFixed(2),
        Propostas: m.Propostas,
        '% Proposta': percPropostas.toFixed(2),
        Aprovados: m.Aprovados,
        '% Aprovação': percAprovados.toFixed(2),
        Emissões: m.Emissoes,
        '% Finalização': percFinalizacao.toFixed(2),
        '% Conv. da Base': percConvBase.toFixed(2),
        'Custo Total': m.CustoTotal.toFixed(2),
        'CAC': cac.toFixed(2),
      } as Row;
    });

    downloadCSV(filename, rows);
  }, []);

  // Visão por disparo (Activity)
  const exportActivityCSV = useCallback((data: CalendarData, filename: string) => {
    const rows: Row[] = [];
    Object.entries(data).forEach(([dateKey, acts]) => {
      acts.forEach(a => {
        const cac = a.kpis.emissoes && a.kpis.emissoes > 0 && a.kpis.custoTotal ? a.kpis.custoTotal / a.kpis.emissoes : null;
        const dataDisparoFormatada = a.dataDisparo instanceof Date
          ? a.dataDisparo.toLocaleDateString('pt-BR')
          : dateKey;
        rows.push({
          'Data Disparo': dataDisparoFormatada,
          BU: a.bu,
          Canal: a.canal,
          Segmento: a.segmento,
          Jornada: a.jornada,
          Parceiro: a.parceiro,
          'Activity name': a.id,
          'Ordem disparo': a.ordemDisparo ?? '',
          Oferta: a.oferta ?? '',
          'Base enviada': a.kpis.baseEnviada ?? '',
          'Base entregue': a.kpis.baseEntregue ?? '',
          '% Entrega': a.kpis.taxaEntrega !== null && a.kpis.taxaEntrega !== undefined ? (a.kpis.taxaEntrega * 100).toFixed(2) : '',
          Propostas: a.kpis.propostas ?? '',
          '% Proposta': a.kpis.taxaPropostas !== null && a.kpis.taxaPropostas !== undefined ? (a.kpis.taxaPropostas * 100).toFixed(2) : '',
          Aprovados: a.kpis.aprovados ?? '',
          '% Aprovação': a.kpis.taxaAprovacao !== null && a.kpis.taxaAprovacao !== undefined ? (a.kpis.taxaAprovacao * 100).toFixed(2) : '',
          Emissões: a.kpis.emissoes ?? '',
          '% Finalização': a.kpis.taxaFinalizacao !== null && a.kpis.taxaFinalizacao !== undefined ? (a.kpis.taxaFinalizacao * 100).toFixed(2) : '',
          '% Conv. Base': a.kpis.taxaConversao !== null && a.kpis.taxaConversao !== undefined ? (a.kpis.taxaConversao * 100).toFixed(2) : '',
          'Custo Total': a.kpis.custoTotal ?? '',
          CAC: cac !== null ? cac.toFixed(2) : '',
        });
      });
    });
    downloadCSV(filename, rows);
  }, []);

  return { exportJourneyCSV, exportActivityCSV };
};

