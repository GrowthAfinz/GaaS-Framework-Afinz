/**
 * ObjectiveBudgetCard Component
 *
 * Displays aggregated budget metrics for an objective (e.g., B2C, Branding)
 * Shows: Planejado, Realizado, Projeção, Ritmo
 * Expandable to show campaign details
 */

import React from 'react';
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { ObjectiveBudget, BudgetStatus, formatPaceStatus } from '../types/budget';

interface ObjectiveBudgetCardProps {
  objective: ObjectiveBudget;
  status: BudgetStatus;
  campaignsCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercentage = (value: number) => `${Math.round(value)}%`;

export const ObjectiveBudgetCard: React.FC<ObjectiveBudgetCardProps> = ({
  objective,
  status,
  campaignsCount,
  isExpanded,
  onToggleExpand,
  onEdit,
}) => {
  const percentUsed = objective.totalBudget > 0 ? (status.cumulativeActual / objective.totalBudget) * 100 : 0;
  const statusDisplay = formatPaceStatus(status.status);

  // Progress bar color based on pacing
  let progressColor = 'bg-emerald-500'; // ontrack
  if (status.status === 'overspending' || status.status === 'atrisk') progressColor = 'bg-red-500';
  if (status.status === 'underspending') progressColor = 'bg-amber-500';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="p-6 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between"
        onClick={onToggleExpand}
      >
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800 mb-1">{objective.objective.toUpperCase()}</h3>
          <p className="text-sm text-slate-500">{campaignsCount} campanhas</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-sm font-medium ${statusDisplay.color}`}>{statusDisplay.label}</div>
            <div className="text-xs text-slate-400">{status.paceIndex.toFixed(2)}x ritmo</div>
          </div>

          {isExpanded ? (
            <ChevronUp size={24} className="text-slate-400" />
          ) : (
            <ChevronDown size={24} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-300`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>R$ 0</span>
          <span className="font-medium text-slate-700">{formatPercentage(percentUsed)}</span>
          <span>{formatCurrency(objective.totalBudget)}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="px-6 pb-6 grid grid-cols-4 gap-3">
        {/* Planejado */}
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Planejado</p>
          <p className="text-lg font-bold text-slate-800">{formatCurrency(objective.totalBudget)}</p>
        </div>

        {/* Realizado */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Realizado</p>
          <p className="text-lg font-bold text-blue-600">{formatCurrency(status.cumulativeActual)}</p>
          <p className="text-xs text-slate-400 mt-1">{formatPercentage(percentUsed)}</p>
        </div>

        {/* Projeção */}
        <div
          className={`p-3 rounded-lg ${
            status.status === 'overspending'
              ? 'bg-red-50'
              : status.status === 'underspending'
                ? 'bg-amber-50'
                : 'bg-slate-50'
          }`}
        >
          <p className="text-xs text-slate-500 mb-1">Projeção</p>
          <p
            className={`text-lg font-bold ${
              status.status === 'overspending'
                ? 'text-red-600'
                : status.status === 'underspending'
                  ? 'text-amber-600'
                  : 'text-slate-800'
            }`}
          >
            {formatCurrency(status.projectionFull)}
          </p>
        </div>

        {/* Ritmo */}
        <div className="bg-slate-50 p-3 rounded-lg flex flex-col justify-between">
          <p className="text-xs text-slate-500">Ritmo</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold text-slate-800">{status.paceIndex.toFixed(2)}x</p>
            {status.status === 'overspending' && <TrendingUp size={16} className="text-red-500" />}
            {status.status === 'underspending' && <TrendingDown size={16} className="text-amber-500" />}
            {status.status === 'ontrack' && <CheckCircle size={16} className="text-emerald-500" />}
          </div>
        </div>
      </div>

      {/* Divider if expandable */}
      {isExpanded && <div className="h-px bg-slate-200" />}

      {/* Metadata footer */}
      <div className="px-6 py-3 bg-slate-50 text-xs text-slate-500 flex justify-between">
        <span>Taxa diária: {formatCurrency(status.dailyProjected)}</span>
        <span>Dias restantes: {Math.max(0, 30 - new Date().getDate())}</span>
      </div>
    </div>
  );
};
