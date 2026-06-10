import React from 'react';
import { zToPValue } from './StatsEngine';

function detectSRM(nVariante: number, nControle: number): boolean {
  const total = nVariante + nControle;
  if (total < 100) return false; // Not enough sample to reliably trigger SRM
  
  const expected = total / 2.0;
  const chi2 = (Math.pow(nControle - expected, 2.0) / expected) + (Math.pow(nVariante - expected, 2.0) / expected);
  
  // Z = sqrt(chi2) for 1 degree of freedom
  const zSrm = Math.sqrt(chi2);
  const pValue = zToPValue(zSrm);
  
  // SRM threshold at p < 0.001
  return pValue < 0.001;
}

export function SRMAlert({ nVariante, nControle }: { nVariante: number; nControle: number }) {
  if (!detectSRM(nVariante, nControle)) return null;

  const total = nVariante + nControle;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3.5 shadow-sm">
      <span className="text-red-500 font-bold text-base leading-none">⚠</span>
      <div>
        <p className="text-xs font-bold text-red-800">Sample Ratio Mismatch (SRM) Detectado</p>
        <p className="text-[11px] text-red-700/90 mt-1 leading-snug">
          Há um forte desequilíbrio estatístico na divisão dos grupos. 
          Divisão esperada: 50/50 ({Math.round(total / 2).toLocaleString('pt-BR')} cada). 
          Observado: {Math.round(nControle / total * 100)}% controle e {Math.round(nVariante / total * 100)}% variante. 
          Verifique se há bugs de split no Salesforce Marketing Cloud (SFMC) antes de interpretar os resultados.
        </p>
      </div>
    </div>
  );
}
