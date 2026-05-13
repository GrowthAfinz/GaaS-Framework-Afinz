
import React from 'react';
import { Mail, MessageCircle, MessageSquare, Bell, Smartphone, Globe, Megaphone } from 'lucide-react';
import { Activity } from '../types/framework';
import { formatPercentage, formatCurrency, formatNumber } from '../utils/formatters';

interface ActivityRowProps {
  activity: Activity;
  index?: number;
}

const BU_COLORS: { [key: string]: string } = {
  B2C: 'text-blue-300',
  B2B2C: 'text-emerald-300',
  Plurix: 'text-purple-300',
  Seguros: 'text-orange-300'
};

export const ActivityRow: React.FC<ActivityRowProps> = ({ activity, index }) => {
  const CanalIcon = () => {
    const c = (activity.canal || '').toUpperCase();
    if (c.includes('EMAIL')) return <Mail className='w-4 h-4' />;
    if (c.includes('WPP') || c.includes('WHATS')) return <MessageCircle className='w-4 h-4' />;
    if (c.includes('SMS')) return <MessageSquare className='w-4 h-4' />;
    if (c.includes('PUSH')) return <Bell className='w-4 h-4' />;
    if (c.includes('APP')) return <Smartphone className='w-4 h-4' />;
    if (c.includes('WEB') || c.includes('SITE')) return <Globe className='w-4 h-4' />;
    return <Megaphone className='w-4 h-4' />;
  };
  return (
    <div className="bg-slate-800 rounded p-2.5 space-y-1.5 text-xs border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-600">
        <p className="font-mono font-bold text-slate-300 truncate flex-1" title={activity.id}>
          {activity.id}
        </p>
        {index !== undefined && <span className="text-amber-400 font-bold">#{index + 1}</span>}
      </div>

      {/* Context Row */}
      <div className="text-slate-400">
        <span className="text-slate-500"><CanalIcon /></span> {activity.canal} •
        <span className={`${BU_COLORS[activity.bu]} font-semibold`}> {activity.bu}</span> •
        {activity.segmento}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 gap-1.5 text-slate-400">
        <div>
          <span className="text-slate-500">📊</span> Entrega: <span className={activity.kpis.taxaEntrega === null ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>{formatPercentage(activity.kpis.taxaEntrega)}</span>
        </div>
        <div>
          <span className="text-slate-500">👁️</span> Abertura: <span className={activity.kpis.taxaAbertura === null ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>{formatPercentage(activity.kpis.taxaAbertura)}</span>
        </div>
        <div>
          <span className="text-slate-500">🎯</span> Proposta: <span className={activity.kpis.taxaPropostas === null ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>{formatPercentage(activity.kpis.taxaPropostas)}</span>
        </div>
        <div>
          <span className="text-slate-500">💳</span> Cartões: <span className={activity.kpis.cartoes === null ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>{formatNumber(activity.kpis.cartoes)}</span>
        </div>
        <div>
          <span className="text-slate-500">💰</span> CAC: <span className={activity.kpis.cac === null ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>{formatCurrency(activity.kpis.cac)}</span>
        </div>
        <div>
          <span className="text-slate-500">💵</span> Custo: <span className={activity.kpis.custoTotal === null ? 'text-slate-500 italic' : 'text-slate-200 font-semibold'}>{formatCurrency(activity.kpis.custoTotal)}</span>
        </div>
      </div>
    </div>
  );
};




