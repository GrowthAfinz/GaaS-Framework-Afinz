import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DetailsPaneData } from '../../../types/explorer';
import { TreeNodeIcon } from '../tree/TreeNodeIcon';
import { PerformanceCard } from './PerformanceCard';
import { ChannelDistribution } from './ChannelDistribution';
import { TopOffersTable } from './TopOffersTable';

interface DetailsPaneProps {
  data: DetailsPaneData | null;
  onClose: () => void;
  onViewAll: () => void;
}

type DetailsTab = 'mix' | 'funil' | 'base';

const fmtNum = (value: number): string => {
  if (!value) return '—';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
};

const fmtPct = (value: number): string => value ? `${value.toFixed(1)}%` : '—';

const CompactMetric: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 min-w-0">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
    <p className="text-sm font-bold text-slate-700 font-mono tabular-nums mt-1">{value}</p>
    {sub && <p className="text-[10px] text-slate-500 truncate mt-0.5">{sub}</p>}
  </div>
);

const IGNORED_DIM = new Set(['', 'n/a', 'na', 'n/a / padrão', '-', '--', 'sem', 'null', 'undefined']);
const IdentityChip: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => {
  const v = value === undefined || value === null ? '' : String(value).trim();
  if (IGNORED_DIM.has(v.toLowerCase())) return null;
  return (
    <div className="flex flex-col gap-0.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 min-w-0">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-semibold text-slate-700 truncate" title={v}>{v}</span>
    </div>
  );
};

// Diagnóstico automático: identifica a etapa de maior perda no funil do recorte.
const BottleneckInsight: React.FC<{ data: DetailsPaneData }> = ({ data }) => {
  const sum = (pick: (a: typeof data.activities[number]) => number) =>
    data.activities.reduce((acc, a) => acc + (Number(pick(a)) || 0), 0);

  const enviado = sum((a) => a['Base Total'] ?? 0);
  const entregue = sum((a) => a['Base Acionável'] ?? 0);
  const propostas = sum((a) => a['Propostas'] ?? 0);
  const aprovados = sum((a) => a['Aprovados'] ?? 0);
  const cartoes = sum((a) => a['Cartões Gerados'] ?? 0);

  const stages = [
    { nome: 'Entrega', taxa: enviado > 0 ? entregue / enviado : null, dica: 'Revise qualidade/higienização da base.' },
    { nome: 'Proposta', taxa: entregue > 0 ? propostas / entregue : null, dica: 'Teste oferta/criativo e timing do disparo.' },
    { nome: 'Aprovação', taxa: propostas > 0 ? aprovados / propostas : null, dica: 'Avalie perfil de crédito do público.' },
    { nome: 'Finalização', taxa: aprovados > 0 ? cartoes / aprovados : null, dica: 'Reduza fricção na ativação do cartão.' },
  ].filter((s): s is { nome: string; taxa: number; dica: string } => s.taxa !== null);

  if (stages.length === 0) return null;
  const worst = stages.reduce((min, s) => (s.taxa < min.taxa ? s : min), stages[0]);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Maior gargalo</p>
      <p className="text-sm font-bold text-amber-800 mt-0.5">
        {worst.nome} · {(worst.taxa * 100).toFixed(1)}%
      </p>
      <p className="text-[11px] text-amber-700 mt-0.5">{worst.dica}</p>
    </div>
  );
};

export const DetailsPane: React.FC<DetailsPaneProps> = ({ data, onClose, onViewAll }) => {
  const [activeTab, setActiveTab] = useState<DetailsTab>('mix');

  if (!data) {
    return (
      <div className="bg-slate-50 rounded-xl p-5 flex items-center justify-center h-full border border-dashed border-slate-300">
        <div className="text-center text-slate-500">
          <p className="text-sm font-medium">Selecione um item no Explorador de disparos</p>
          <p className="text-xs mt-1">para ver a análise</p>
        </div>
      </div>
    );
  }

  const {
    node,
    period,
    channelDistribution,
    topOffers,
    topPromocionais,
    topParceiros,
    topSubgrupos,
    topPerfisCredito,
    topEtapasAquisicao,
    topOrdensDisparo,
    funnelSummary,
    baseSummary
  } = data;

  const offerItems = topOffers.map((o) => ({ label: o.oferta, cartoes: o.cartoes }));
  const promoItems = topPromocionais.map((p) => ({ label: p.promocional, cartoes: p.cartoes }));
  const dimensionSections = [
    { title: 'Top Parceiros', items: topParceiros },
    { title: 'Top Subgrupos', items: topSubgrupos },
    { title: 'Perfil Crédito', items: topPerfisCredito },
    { title: 'Etapa Aquisição', items: topEtapasAquisicao },
    { title: 'Ordem Disparo', items: topOrdensDisparo },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <TreeNodeIcon type={node.type} label={node.label} color={node.color} size={16} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate">{node.label}</p>
          <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase mt-0.5">{period}</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Fechar painel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4">
        {node.type === 'disparo' && data.activities[0] && (() => {
          const a = data.activities[0];
          return (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Identificação</p>
              <div className="grid grid-cols-2 gap-1.5">
                <IdentityChip label="BU" value={a.BU} />
                <IdentityChip label="Canal" value={a.Canal} />
                <IdentityChip label="Segmento" value={a.Segmento} />
                <IdentityChip label="Jornada" value={a.jornada} />
                <IdentityChip label="Parceiro" value={a.Parceiro} />
                <IdentityChip label="Subgrupo" value={a.Subgrupos} />
                <IdentityChip label="Oferta" value={a.Oferta} />
                <IdentityChip label="Promocional" value={a.Promocional} />
                <IdentityChip label="Produto" value={a.Produto} />
                <IdentityChip label="Perfil Crédito" value={a['Perfil de Crédito']} />
                <IdentityChip label="Etapa Funil" value={a['Etapa de aquisição']} />
                <IdentityChip label="Safra" value={a.Safra} />
                <IdentityChip label="Ordem" value={a['Ordem de disparo']} />
              </div>
              <div className="border-t border-slate-100 mt-1" />
            </div>
          );
        })()}
        <PerformanceCard metrics={node.metrics} count={node.count} prevMetrics={data.prevMetrics} />
        <div className="border-t border-slate-100" />
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
          {([
            ['mix', 'Mix'],
            ['funil', 'Funil'],
            ['base', 'Base']
          ] as [DetailsTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-2 py-1.5 text-[11px] font-bold transition-colors ${
                activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'mix' && (
          <div className="flex flex-col gap-4">
            <ChannelDistribution items={channelDistribution} />
            <div className="border-t border-slate-100" />
            <TopOffersTable title="Top Ofertas" items={offerItems} />
            <div className="border-t border-slate-100" />
            <TopOffersTable title="Top Promocionais" items={promoItems} />
            {dimensionSections.map((section) => (
              <React.Fragment key={section.title}>
                <div className="border-t border-slate-100" />
                <TopOffersTable title={section.title} items={section.items} />
              </React.Fragment>
            ))}
          </div>
        )}

        {activeTab === 'funil' && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Funil</p>
            <div className="grid grid-cols-2 gap-2">
              <CompactMetric label="Propostas" value={fmtNum(funnelSummary.propostas)} />
              <CompactMetric label="Aprovados" value={fmtNum(funnelSummary.aprovados)} />
              <CompactMetric label="Cartões" value={fmtNum(funnelSummary.cartoes)} />
              <CompactMetric label="Aprovação" value={fmtPct(funnelSummary.taxaAprovacao)} sub="aprovados / propostas" />
              <CompactMetric label="Finalização" value={fmtPct(funnelSummary.taxaFinalizacao)} sub="cartões / aprovados" />
              <CompactMetric label="Conversão" value={fmtPct(node.metrics.taxaConversao)} sub="conversão do recorte" />
            </div>
            <BottleneckInsight data={data} />
          </div>
        )}

        {activeTab === 'base' && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Base</p>
            <div className="grid grid-cols-2 gap-2">
              <CompactMetric label="Base Total" value={fmtNum(baseSummary.baseTotal)} />
              <CompactMetric label="Acionável" value={fmtNum(baseSummary.baseAcionavel)} />
              <CompactMetric label="% Acionável" value={fmtPct(baseSummary.taxaAcionavel)} />
              <CompactMetric label="Otimização" value={fmtPct(baseSummary.otimBaseMedia)} sub="média do recorte" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
