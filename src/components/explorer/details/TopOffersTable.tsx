import React from 'react';
import { TopOfferItem } from '../../../types/explorer';

interface TopOffersTableProps {
  items: TopOfferItem[];
}

export const TopOffersTable: React.FC<TopOffersTableProps> = ({ items }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Ofertas</p>
        <p className="text-slate-500 text-xs">Sem dados de oferta</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Top Ofertas</p>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div key={item.oferta} className="flex items-center gap-2 text-xs py-1.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded px-1 -mx-1">
            <span className="text-slate-400 tabular-nums font-mono w-4 font-medium">{i + 1}.</span>
            <span className="text-slate-700 truncate flex-1 font-medium" title={item.oferta}>
              {item.oferta.length > 22 ? item.oferta.slice(0, 22) + '…' : item.oferta}
            </span>
            <span className="text-slate-800 font-bold tabular-nums">
              {item.cartoes >= 1000
                ? `${(item.cartoes / 1000).toFixed(1)}k`
                : item.cartoes}{' '}
              <span className="text-slate-500 font-normal">cartões</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
