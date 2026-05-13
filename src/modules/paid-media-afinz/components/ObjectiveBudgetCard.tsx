/**
 * ObjectiveBudgetCard Component
 *
 * Displays aggregated budget metrics for a single objective (e.g., B2C, Branding)
 * Computes its own per-objective status from objective.realizedSpend / projectedSpend
 * Expandable to show campaign details
 */

import React from 'react';
import {
  ChevronDown, ChevronUp, TrendingDown, TrendingUp,
  CheckCircle, Edit2, Plus,
} from 'lucide-react';
import { ObjectiveBudget, formatPaceStatus, getPaceStatus, getObjectiveLabel } from '../types/budget';
import { getDate, getDaysInMonth } from 'date-fns';

interface ObjectiveBudgetCardProps {
  objective: ObjectiveBudget;
  campaignsCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: () => void;
  onAddCampaign?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const ObjectiveBudgetCard: React.FC<ObjectiveBudgetCardProps> = ({
  objective,
  campaignsCount,
  isExpanded,
  onToggleExpand,
  onEdit,
  onAddCampaign,
}) => {
  // Per-objective metrics — computed from objective data, not global status
  const realizedSpend = objective.realizedSpend || 0;
  const projectedSpend = objective.projectedSpend || 0;
  const totalBudget = objective.totalBudget;
  const paceIndex = totalBudget > 0 ? projectedSpend / totalBudget : 0;
  const localStatus = getPaceStatus(paceIndex);
  const statusDisplay = formatPaceStatus(localStatus);

  const daysPassed = getDate(new Date());
  const daysInMonth = getDaysInMonth(new Date());
  const daysRemaining = Math.max(0, daysInMonth - daysPassed);
  const dailyProjected = totalBudget / daysInMonth;
  const percentUsed = totalBudget > 0 ? Math.min((realizedSpend / totalBudget) * 100, 100) : 0;

  // Orçamento ideal por dia para atingir a meta com o saldo restante
  const budgetRemaining = Math.max(0, totalBudget - realizedSpend);
  const idealDailyToGoal = daysRemaining > 0 ? budgetRemaining / daysRemaining : 0;

  // Progress bar color
  let progressColor = 'bg-emerald-500';
  if (localStatus === 'overspending' || localStatus === 'atrisk') progressColor = 'bg-red-500';
  else if (localStatus === 'underspending') progressColor = 'bg-amber-500';
  else if (localStatus === 'severe') progressColor = 'bg-slate-400';

  const projectionDiff = projectedSpend - totalBudget;
  const label = getObjectiveLabel(objective.objective);
  const channelLabel = objective.channel === 'meta' ? ' · Meta' : objective.channel === 'google' ? ' · Google' : '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 flex items-center gap-3">
        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-3 text-left min-w-0"
        >
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              {label}
              <span className="text-xs font-normal text-slate-400 ml-1">{channelLabel}</span>
            </h3>
            <p className="text-sm text-slate-400 mt-0.5">
              {campaignsCount} {campaignsCount === 1 ? 'campanha' : 'campanhas'}
            </p>
          </div>
        </button>

        {/* Status badge */}
        <div className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${statusDisplay.color}`}>
          {statusDisplay.label} · {paceIndex.toFixed(2)}x
        </div>

        {/* Action buttons */}
        {onAddCampaign && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddCampaign(); }}
            title="Adicionar Campanha"
            className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus size={17} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Editar Orçamento"
            className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Edit2 size={15} />
          </button>
        )}
        <button
          onClick={onToggleExpand}
          className="shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          {isExpanded
            ? <ChevronUp size={18} className="text-slate-400" />
            : <ChevronDown size={18} className="text-slate-400" />
          }
        </button>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────── */}
      <div className="px-6 pb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>R$ 0</span>
          <span className="font-medium text-slate-700">{Math.round(percentUsed)}% realizado</span>
          <span>{formatCurrency(totalBudget)}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-300`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="px-6 pb-5 grid grid-cols-4 gap-3">
        {/* Planejado */}
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Planejado</p>
          <p className="text-base font-bold text-slate-800">{formatCurrency(totalBudget)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatCurrency(dailyProjected)}/dia</p>
        </div>

        {/* Realizado */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Realizado</p>
          <p className="text-base font-bold text-blue-600">{formatCurrency(realizedSpend)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{Math.round(percentUsed)}% do planejado</p>
        </div>

        {/* Projeção */}
        <div
          className={`p-3 rounded-lg ${
            localStatus === 'overspending' ? 'bg-red-50'
            : localStatus === 'underspending' ? 'bg-amber-50'
            : 'bg-slate-50'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">Projeção</p>
          <p
            className={`text-base font-bold ${
              localStatus === 'overspending' ? 'text-red-600'
              : localStatus === 'underspending' ? 'text-amber-600'
              : 'text-slate-800'
            }`}
          >
            {formatCurrency(projectedSpend)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {projectionDiff > 0
              ? `+${formatCurrency(projectionDiff)} acima`
              : projectionDiff < 0
                ? `-${formatCurrency(Math.abs(projectionDiff))} abaixo`
                : 'exato'
            }
          </p>
        </div>

        {/* Ritmo */}
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Ritmo</p>
          <div className="flex items-center gap-1">
            <p className="text-base font-bold text-slate-800">{paceIndex.toFixed(2)}x</p>
            {localStatus === 'overspending' && <TrendingUp size={14} className="text-red-500" />}
            {localStatus === 'underspending' && <TrendingDown size={14} className="text-amber-500" />}
            {localStatus === 'ontrack' && <CheckCircle size={14} className="text-emerald-500" />}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{daysRemaining} dias restantes</p>
          {daysRemaining > 0 && idealDailyToGoal > 0 && (
            <p className="text-xs font-semibold text-blue-600 mt-1">
              {formatCurrency(idealDailyToGoal)}/dia p/ meta
            </p>
          )}
          {daysRemaining > 0 && idealDailyToGoal === 0 && realizedSpend >= totalBudget && (
            <p className="text-xs font-semibold text-emerald-600 mt-1">Meta atingida ✓</p>
          )}
        </div>
      </div>

      {isExpanded && <div className="h-px bg-slate-100" />}
    </div>
  );
};
