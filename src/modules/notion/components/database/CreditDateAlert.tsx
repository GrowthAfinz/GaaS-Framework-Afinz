import React from 'react';
import type { DatabaseRow, NotionDatabase } from '../../types/notion';
import { isCreditBases } from '../../gaas/creditBases';

export function CreditDateAlert({ database, row, propertyId }: {
  database: NotionDatabase; row: DatabaseRow; propertyId: string;
}) {
  if (!isCreditBases(database.id) || (propertyId !== 'prop_expiry' && propertyId !== 'prop_deadline')) return null;
  const value = row.properties[propertyId];
  const status = database.properties.find(p => p.id === 'prop_status')?.options;
  const available = status?.find(option => option.id === 'available')?.name;
  const released = Boolean(available && row.properties.prop_status === available);
  let label = '';
  let overdue = false;
  if (propertyId === 'prop_expiry' && !value && released &&
    database.properties.some(p => p.id === propertyId)) label = 'Validade pendente';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    const days = (Date.parse(value) - Date.parse(currentDate)) / 86_400_000;
    if (propertyId === 'prop_expiry' && days <= 7) {
      overdue = days < 0;
      label = overdue ? 'Vencida' : 'Vence em breve';
    }
    if (propertyId === 'prop_deadline' && days < 0 && !released) {
      overdue = true;
      label = 'Prazo atrasado';
    }
  }
  return label ? <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${overdue ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>
    {label}
  </span> : null;
}
