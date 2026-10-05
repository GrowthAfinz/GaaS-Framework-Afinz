import React from 'react';
import { CalendarDays, CheckCircle2, CircleOff, ExternalLink, Lock } from 'lucide-react';
import type { PoolOffer, PoolOfferOfDay } from '../domain/topoPlurixV10';

interface Props {
  offer: PoolOfferOfDay | null;
  offers: PoolOffer[];
  signatureKey: string;
  signatureLabel: string;
  date: string;
  onDateChange: (date: string) => void;
  buttonLink: string;
  onManage: () => void;
}

const brDate = (iso: string) => { const [y, m, d] = iso.split('-'); return d && m && y ? `${d}/${m}/${y}` : iso; };
const upper = (value: string) => value.trim().toLocaleUpperCase('pt-BR');

/**
 * Bloco 3 do template V10 no editor. Não tem campos no briefing: o conteúdo vem do pool
 * de ofertas da rede, e o bloco só aparece quando há oferta vigente na data do envio.
 */
export const PoolOfferEditorCard: React.FC<Props> = ({ offer, offers, signatureKey, signatureLabel, date, onDateChange, buttonLink, onManage }) => {
  const partnerOffers = offers.filter((item) => item.active && upper(item.partnerName) === upper(signatureKey));
  const nextDates = [...new Set(partnerOffers.map((item) => item.startDate))].filter((day) => day > date).sort().slice(0, 3);
  return (
    <div className="space-y-3">
      <p className="flex items-start gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-[11px] leading-4 text-slate-600">
        <Lock size={12} className="mt-px shrink-0"/>
        <span>Bloco <b>opcional e automático</b>: não tem campo para preencher. Ele aparece quando a rede de quem recebe tem oferta vigente no pool no dia do envio, e some quando não tem. Os textos e o botão são fixos no template V10.</span>
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Data de envio simulada
          <input type="date" value={date} onChange={(event) => onDateChange(event.target.value || new Date().toISOString().slice(0, 10))} className="mt-1 block h-9 rounded-lg border border-slate-200 px-2.5 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-cyan-400"/>
        </label>
        <button type="button" onClick={onManage} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-cyan-300 hover:text-cyan-800"><ExternalLink size={13}/>Gerenciar pool</button>
      </div>
      {offer ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-emerald-800"><CheckCircle2 size={14}/>Aparece neste e-mail para {signatureLabel} em {brDate(date)}</p>
          <div className="flex items-center gap-3">
            {offer.imageUrl && <img src={offer.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover"/>}
            <div className="min-w-0 text-xs text-slate-700">
              <div className="font-bold text-slate-900">{offer.productName}</div>
              <div className="mt-0.5">a partir de <b className="text-slate-900">R$ {offer.priceText}</b> · presente em {offer.regions} {offer.regions === 1 ? 'região' : 'regiões'}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Oferta {offer.offerRef}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="flex items-center gap-1.5 font-bold text-slate-700"><CircleOff size={14}/>Não aparece para {signatureLabel} em {brDate(date)}</p>
          <p className="mt-1 leading-4">
            {partnerOffers.length
              ? <>A rede tem ofertas no pool, mas nenhuma vigente nesse dia.{nextDates.length > 0 && <> Próximas datas com oferta: {nextDates.map((day) => <button key={day} type="button" onClick={() => onDateChange(day)} className="mx-0.5 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 font-bold text-cyan-800 hover:underline"><CalendarDays size={11}/>{brDate(day)}</button>)}</>}</>
              : 'Esta rede ainda não tem ofertas no pool. O e-mail sai normalmente, só sem o bloco.'}
          </p>
        </div>
      )}
      <dl className="grid gap-2 text-[11px] leading-4 text-slate-600 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 p-2"><dt className="font-bold uppercase tracking-wide text-slate-400">Título (fixo)</dt><dd>E tem mais: toda semana tem oferta exclusiva para quem tem o cartão +amigo</dd></div>
        <div className="rounded-lg border border-slate-100 p-2"><dt className="font-bold uppercase tracking-wide text-slate-400">Botão (fixo)</dt><dd>PEDIR MEU CARTÃO +AMIGO · usa o link do botão principal</dd><dd className="truncate text-slate-400" title={buttonLink}>{buttonLink || 'sem link no botão principal: o botão do bloco não aparece'}</dd></div>
        <div className="rounded-lg border border-slate-100 p-2 sm:col-span-2"><dt className="font-bold uppercase tracking-wide text-slate-400">Aviso e texto legal (fixos)</dt><dd>“pagando com o cartão +amigo, em cidades e regiões participantes. Acompanhe as ofertas da semana.” e o texto legal genérico do pool (pendente de validação do jurídico).</dd></div>
      </dl>
    </div>
  );
};
