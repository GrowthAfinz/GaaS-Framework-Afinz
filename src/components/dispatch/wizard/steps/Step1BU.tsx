import React from 'react';
import type { WizardBU } from '../types';

interface Step1BUProps {
  onSelect: (bu: WizardBU) => void;
}

const BUS = [
  { id: 'B2C' as const, label: 'B2C', color: 'bg-blue-500 hover:bg-blue-600' },
  { id: 'B2B2C' as const, label: 'B2B2C', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { id: 'Plurix' as const, label: 'Plurix', color: 'bg-purple-500 hover:bg-purple-600' },
  { id: 'Seguros' as const, label: 'Seguros', color: 'bg-orange-500 hover:bg-orange-600' },
];

export const Step1BU: React.FC<Step1BUProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-slate-800">Selecione a Unidade de Negócio</h2>
        <p className="text-xs text-slate-500 mt-1">Escolha a BU para sua jornada</p>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        {BUS.map((bu, index) => (
          <button
            key={bu.id}
            onClick={() => onSelect(bu.id)}
            style={{
              animation: `slideIn 0.4s cubic-bezier(0.4,0,0.2,1) forwards`,
              animationDelay: `${index * 80}ms`,
            }}
            className={`
              p-8 rounded-xl font-bold text-white text-sm transition-all
              ${bu.color} shadow-lg hover:shadow-xl transform hover:scale-105
            `}
          >
            {bu.label}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
