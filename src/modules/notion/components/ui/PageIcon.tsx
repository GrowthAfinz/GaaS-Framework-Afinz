import React from 'react';

/**
 * Ícone de página, igual em todo lugar (árvore, título, busca, lixeira, janela da Tarefa).
 * Ícone é opcional: página sem ícone mostra só o espaço reservado, nunca um ícone automático.
 */
export function PageIcon({ icon, className = '', placeholder = true }: { icon?: string | null; className?: string; placeholder?: boolean }) {
  const value = (icon || '').trim();
  if (value) return <span className={className} aria-hidden="true">{value}</span>;
  return placeholder ? <span className={className} aria-hidden="true" /> : null;
}
