import React from 'react';
import { Activity } from '../types/framework';
import { ActivityRow } from './ActivityRow';
import { formatDateDisplay } from '../utils/formatters';

interface HoverCardProps {
  date: Date;
  activities: Activity[];
  x: number;
  y: number;
  onClose?: () => void;
}

export const HoverCard: React.FC<HoverCardProps> = ({ date, activities, x, y, onClose }) => {
  // Limitar posição para não sair da tela
  const maxX = Math.max(10, Math.min(x, window.innerWidth - 650));
  const maxY = Math.max(10, Math.min(y, window.innerHeight - 550));

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${maxX}px`,
        top: `${maxY}px`
      }}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4 max-w-2xl max-h-96 overflow-y-auto pointer-events-auto"
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="mb-3 pb-3 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-100 text-lg">{formatDateDisplay(date)}</h3>
          <p className="text-xs text-slate-400">Total: {activities.length} atividades</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition text-xl font-bold"
            title="Fechar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Activities List - mostrar todas */}
      <div className="space-y-2">
        {activities.map((activity, idx) => (
          <ActivityRow key={idx} activity={activity} index={idx} />
        ))}
      </div>
      </div>
    </div>
  );
};
