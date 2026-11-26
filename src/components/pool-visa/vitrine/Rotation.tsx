import React, { useState } from 'react';
import { DATA, GROUP_LABEL, LATEST, benefit, br, daysUntil, isoDate, toPositions, versionDate, versionsOf, type Snapshot } from './model';

const newOffers = [
  ['DECOLAR_VISAVOONAC', 'Decolar', 'R$ 120 OFF em voos nacionais acima de R$ 1.200', '31/12'],
  ['DECOLAR_VISAVOOINT', 'Decolar', 'R$ 400 OFF em voos internacionais acima de R$ 4.000', '31/12'],
  ['DECOLAR_VISAHOTELNAC', 'Decolar', 'R$ 120 OFF em hotéis nacionais acima de R$ 1.200', '31/12'],
  ['DECOLAR_VISAHOTELINT', 'Decolar', 'R$ 320 OFF em hotéis internacionais acima de R$ 3.200', '31/12'],
  ['DECOLAR_VISAPACOTENAC', 'Decolar', 'R$ 400 OFF em pacotes nacionais acima de R$ 4.000', '31/12'],
  ['DECOLAR_VISAPACOTEINT', 'Decolar', 'R$ 750 OFF em pacotes internacionais acima de R$ 7.500', '31/12'],
  ['DOMINOSPIZZA_40PIZZA', 'Domino’s Pizza', '40% OFF em pizzas médias e grandes', '30/11'],
  ['ASSISTCARD_3', 'Assist Card', '20% OFF em seguro viagem com Visa', '31/12'],
  ['CONNECTCARPF', 'Connect Car - PF', 'Até 14 meses grátis na tag', '31/12'],
  ['IPLACE_VISA', 'iPlace', 'R$ 30 OFF acima de R$ 199', '30/11'],
  ['PACCO_VISA', 'PACCO', '10% OFF acima de R$ 300', '10/12'],
  ['UNIDAS', 'Unidas', 'Até 22% OFF em reservas', '13/12'],
  ['VXCASE_VISABLACKVX', 'VXCASE', '10% OFF + cashback triplo', '29/11'],
  ['ZARPOVIAGENS_VAIDEVISA', 'Zarpo Viagens', 'R$ 1.000 OFF em pacotes', '03/12'],
  ['ARAMIS_VISA20', 'Aramis', 'Até 60% OFF + 20% extra em itens selecionados', '30/11', 'MODA'],
  ['CA_VAIDEVISA', 'C&A', '50% OFF na 2ª peça selecionada', '02/12', 'MODA'],
  ['AVON_VISA20', 'Avon', 'Até 70% OFF + 20% extra', '30/11', 'SAUDE_BELEZA'],
  ['NATURA_VISANF', 'Natura', '25% OFF em produtos selecionados', '30/11', 'SAUDE_BELEZA'],
  ['PAGUEMENOS_VISA20', 'Pague Menos', 'R$ 20 OFF acima de R$ 250', '30/11', 'SAUDE_BELEZA'],
];

// Ordem operacional informada na planilha. Os números ausentes são preservados.
const queueByGroup: Record<string, string[]> = {
  MODA: ['1 OQVESTIR', '2 RIACHUELO', '3 SHOP2GETHER', '4 DECATHLON', '5 ARAMIS_VISA20 30/11', '6 CA_VAIDEVISA 02/12', '7 PUMA', '8 NIKE 30/11', '9 HERING 30/11', '10 ZATTINI', '11 LACOSTE', '12 GOCASE'],
  SAUDE_BELEZA: ['1 OCEANE', '2 LOCCITANE_BRESIL 30/11', '3 JEQUITI', '4 OBOTICARIO', '5 GRANADO', '6 BELEZANAWEB', '7 SEPHORA 30/11', '8 DROGARIASP_25', '10 DROGARIASP_40_V2', '11 PAGUEMENOS_VISA20 30/11', '12 OBOTICARIO_VAIDEVISA 30/11', '13 AVON_VISA20 30/11', '14 NATURA_VISANF 30/11', '15 OBOTICARIO_VAIDEVISA10 30/11'],
  FAMILIA_PRESENTES: ['1 MONTECARLO', '2 LEGO', '3 GIULIANAFLORES 30/11', '4 EVINO 30/11', '5 GIULIANAFLORES_VAIDEVISA15 30/11', '6 EVINO_2_V2 30/11', '7 EVINO_VAIDEVISA50'],
  GENERICO: ['1 RENTCARS', '2 MOTOROLA', '3 PETZ', '4 KARSTEN', '5 KITCHENAID', '6 MOVIDA -', '7 ARNO', '8 COBASI 30/11', '9 SAMSCLUB -', '10 HOTEISCOM', '11 SEARA 30/11', '12 POLISHOP', '13 SEMPARAR -', '14 ALURA 31/12/2027', '16 SEARA_VISAKIT15 30/11', '17 SEMPARAR_2', '21 ZARPOVIAGENS_VAIDEVISA 03/12', '22 UNIDAS 13/12', '23 MOVIDA_VAIDEVISANOV26 30/11', '25 IPLACE_VISA 30/11', '26 DECOLAR_VISAVOONAC', '27 DECOLAR_VISAVOOINT', '28 DECOLAR_VISAHOTELNAC', '29 DECOLAR_VISAHOTELINT', '30 DECOLAR_VISAPACOTENAC', '31 DECOLAR_VISAPACOTEINT', '33 VXCASE_VISABLACKVX 29/11', '34 DOMINOSPIZZA_40PIZZA 30/11', '35 PACCO_VISA 10/12', '36 SAMSCLUB_2 30/11', '39 ASSISTCARD_3', '44 CONNECTCARPF'],
};

const copyByOffer: Record<string, string> = {
  LACOSTE: '5% OFF na Lacoste',
  NIKE: '5% OFF na Nike',
  DROGARIASP_40_V2: 'Até R$ 40 OFF em compras acima de R$ 500',
  OBOTICARIO_VAIDEVISA: 'Frete grátis + mimo em compras acima de R$ 99',
  OBOTICARIO_VAIDEVISA10: '10% OFF acima de R$ 149',
  GIULIANAFLORES_VAIDEVISA15: '15% OFF na Giuliana Flores',
  EVINO_2_V2: '10% OFF acima de R$ 150',
  EVINO_VAIDEVISA50: 'R$ 50 OFF acima de R$ 350',
  MOVIDA_VAIDEVISANOV26: 'Até 14% OFF em reservas na Movida',
  SAMSCLUB_2: 'Desconto na associação · percentual a confirmar',
  SEARA_VISAKIT15: '15% OFF em kits Seara',
  SEMPARAR_2: 'Tag por R$ 39,90 + 12 mensalidades grátis',
};

const variants: Record<string, string> = {
  DROGARIASP_40_V2: 'DROGARIASP_25', OBOTICARIO_VAIDEVISA: 'OBOTICARIO', OBOTICARIO_VAIDEVISA10: 'OBOTICARIO',
  GIULIANAFLORES_VAIDEVISA15: 'GIULIANAFLORES', EVINO_2: 'EVINO', EVINO_VAIDEVISA50: 'EVINO',
  MOVIDA_VAIDEVISANOV26: 'MOVIDA', SAMSCLUB_2: 'SAMSCLUB', SEARA_VISAKIT15: 'SEARA', SEMPARAR_2: 'SEMPARAR',
};
const logoIds: Record<string, string> = {
  ARAMIS_VISA20: 'e361289a-551d-4389-999a-9eced4bd8c60',
  RENTCARS: 'b682e177-284d-400a-9d0b-88a38ac0ecd5',
  OQVESTIR: '3214dc4f-a3fe-40d2-bc3a-b2ea78b94428',
  SHOP2GETHER: 'c6b43cf5-b73c-4a5d-a837-12c85c49ccb8',
  SAMSCLUB: '5d486c79-2075-4227-bb5a-4dbe16613f35',
  HOTEISCOM: '1d9b3323-0c14-4606-8b55-e19519374c85',
  SEARA: '10e84409-5de7-47e3-a646-954d5c80d52d',
  POLISHOP: '3333764f-cd68-4008-885c-da1c4ff99265',
  SEMPARAR: '560164a2-d8c0-4ffe-ab24-ce9eb22634e4',
  DECOLAR: '9631dac1-807c-4b9d-bddd-85eb652e28e6',
  CA_VAIDEVISA: '0c4bf82c-8986-4820-8aa3-ed7641eaf118',
  AVON_VISA20: '71f72767-5343-4861-aacf-7d3088313bb9',
  NATURA_VISANF: 'a0fe06b0-908d-4f46-ac1c-d3ddb23d3fb4',
  PAGUEMENOS_VISA20: 'f3f9096a-a288-4d06-93c5-d7c8d6b18110',
  ZARPOVIAGENS_VAIDEVISA: 'a94b1173-7018-473d-a81c-b5d1ab8affaf',
  UNIDAS: '83c1d55d-46f1-456b-9d05-c8c55828542c',
  IPLACE_VISA: '9648605c-9340-4ac8-a9cf-661d8c07c6b0',
  VXCASE_VISABLACKVX: '62310ddc-06c5-4c81-9b49-0a14cc47f24c',
  DOMINOSPIZZA_40PIZZA: 'b065cac3-22b9-4f5f-b6b2-cdfcb08838e6',
  PACCO_VISA: '6aebc62d-631a-4e66-869d-f13814e76780',
  ASSISTCARD_3: '165b03e4-00b2-465e-accd-3512ee1c988b',
  CONNECTCARPF: '03d17157-531f-49b6-a77f-f6962ceb5077',
};

export function plannedQueue(group: string) {
  return (queueByGroup[group] ?? []).map(entry => {
    const [order, code, date = '31/12'] = entry.split(' ');
    const id = 'NOV26_' + code;
    const brand = newOffers.find(item => item[0] === code)?.[1] ?? LATEST.get(id)?.MARCA ?? LATEST.get('NOV26_' + variants[code])?.MARCA ?? code;
    return { id, brand, order: Number(order), code, date: date === '-' ? '' : date.length === 5 ? date + '/2026' : date };
  });
}

const input = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
export function Rotation({ onOpen, fixedGroup: group, reference: after, source: snapshot, clicks, coverage }: {
  onOpen: (id: string) => void;
  fixedGroup: string;
  reference: string;
  source: Snapshot;
  clicks: Map<string, number>;
  coverage: string;
}) {
  const versions = versionsOf(snapshot);
  const referenceIndex = versions.indexOf(after);
  const [before, setBefore] = useState(versions[Math.max(0, referenceIndex - 1)] ?? after);
  const all = toPositions(snapshot);
  const positions = (version: string, key: string) => all.filter(p => p.versao === version && p.grupo === key).sort((a,b) => a.posicao-b.posicao);
  const round = (v: string) => br(versionDate(v));
  const offerName = (id: string) => LATEST.get(id)?.MARCA || id;
  const selected = new Map(positions(after, group).map(p => [p.ofertaId, p.posicao]));
  const recorded = DATA.positions
    .filter(item => item.fileDate <= snapshot.fileDate)
    .flatMap(toPositions)
    .filter(p => p.grupo === group && p.dtRodada <= versionDate(after))
    .sort((a, b) => b.dtRodada.localeCompare(a.dtRodada));
  const queue = plannedQueue(group);
  const plannedIds = new Set(queue.map(({ code }) => 'NOV26_' + code));
  const pastOnly = [...new Set(recorded.map(p => p.ofertaId))].filter(id => !plannedIds.has(id));

  return <div className="space-y-4">
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <div><h2 className="text-lg font-bold">Fila de ofertas</h2><p className="text-xs text-slate-600">{GROUP_LABEL[group]} · {queue.length} ofertas na planilha</p></div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">Ordem planejada · sem agenda de entrada</span>
      </header>
      <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-slate-50 text-xs text-slate-700"><tr>{['Posição', 'Oferta', 'Validade na planilha', 'Última seleção SFMC', 'Cliques na LP'].map(label => <th scope="col" className="px-4 py-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{queue.map(({ order, code, date }, index) => {
          const id = 'NOV26_' + code;
          const row = LATEST.get(id);
          const candidate = newOffers.find(item => item[0] === code);
          const last = recorded.find(p => p.ofertaId === id);
          const position = selected.get(id);
          const baseCode = variants[code] ?? code;
          const base = LATEST.get('NOV26_' + baseCode);
          const logoId = logoIds[baseCode] ?? (code.startsWith('DECOLAR_') ? logoIds.DECOLAR : '');
          const logo = logoId
            ? 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/' + logoId + '.png'
            : row?.LOGO || base?.LOGO;
          const name = candidate?.[1] || row?.MARCA || base?.MARCA || code;
          const copy = copyByOffer[code] || candidate?.[2] || (row ? [benefit(row), row.COMPLEMENTO?.replace(/^'(?=\+)/, '')].filter(Boolean).join(' ') : id);
          const invalid = date === '31/11/2026';
          const remaining = invalid ? null : daysUntil(isoDate(date));
          const boundary = order > 3 && queue[index - 1]?.order === 3;
          return <React.Fragment key={id}>
            {boundary && <tr className="border-y border-cyan-100 bg-cyan-50"><th scope="rowgroup" colSpan={5} className="px-4 py-2 text-xs font-semibold text-cyan-900">Demais posições da fila</th></tr>}
            <tr className={`border-b border-slate-100 hover:bg-slate-50 ${order <= 3 ? 'bg-cyan-50/30' : ''}`}>
              <td className="px-4 py-2"><span className={`inline-flex min-w-9 justify-center rounded-lg px-2 py-1 font-semibold tabular-nums ${order <= 3 ? 'bg-cyan-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{order}ª</span></td>
              <td className="px-4 py-2"><div className="flex items-center gap-3 text-left">
                {logo && <img src={logo} alt="" loading="lazy" className="h-9 w-9 rounded-lg border border-slate-100 object-contain" />}
                <span><strong className="text-slate-900">{row ? <button className="hover:underline" onClick={() => onOpen(id)}>{name}</button> : name}</strong><small className="block text-slate-600">{copy}</small>{code === 'ARAMIS_VISA20' && <small className="block text-amber-900">Validade corrigida para 30/11</small>}</span>
              </div></td>
              <td className="px-4 py-2"><span className={invalid || remaining !== null && remaining <= 5 ? 'rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-900' : 'text-slate-600'}>{invalid ? 'Data inválida · ' + date : date || 'Sem data'}</span>
                {remaining !== null && remaining < 0 && <small className="block text-amber-900">Vencida</small>}</td>
              <td className="px-4 py-2 text-slate-700">{last ? `${br(last.dtRodada)} · ${last.posicao}ª` : '—'}
                {position !== undefined && <small className="block font-medium text-cyan-800">{position <= 3 ? 'Na seleção de referência' : 'Reserva na referência'}</small>}</td>
              <td className="px-4 py-2 font-semibold tabular-nums">{clicks.get(id) ?? '—'}</td>
            </tr>
          </React.Fragment>;
        })}</tbody>
      </table></div>
      <footer className="px-5 py-3 text-xs text-slate-600">{coverage} · cliques acumulados por oferta · — indica ausência de registro.</footer>
      {pastOnly.length > 0 && <details className="border-t border-slate-100 px-5 py-3"><summary className="cursor-pointer text-sm font-semibold">Seleções anteriores fora da fila ({pastOnly.length})</summary>
        <ul className="mt-2 divide-y divide-slate-100">{pastOnly.map(id => <li key={id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
          <button onClick={() => onOpen(id)} className="text-cyan-800">{offerName(id)}</button>
          <span>{br(recorded.find(p => p.ofertaId === id)!.dtRodada)} · {clicks.get(id) ?? '—'} cliques</span>
        </li>)}</ul>
      </details>}
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold">Comparação de posições</h2>
      <p className="mt-1 text-xs text-slate-600">Referência de {round(after)} · extração de {br(snapshot.fileDate)}</p>
      <div className="my-4 flex flex-wrap gap-3">
        <label className="text-xs">Comparar com <select className={input} value={before} onChange={e=>setBefore(e.target.value)}>{versions.map(v=><option key={v} value={v}>{round(v)}</option>)}</select></label>
      </div>
      <details><summary className="cursor-pointer text-sm font-bold text-cyan-800">Comparar posições entre seleções</summary><div className="mt-3">{[group].map(g=>{
        const a=positions(before,g), b=positions(after,g);
        const row=(n:number)=>{
          const left=a.find(p=>p.posicao===n), right=b.find(p=>p.posicao===n);
          const previous=right && a.find(p=>p.ofertaId===right.ofertaId);
          return <div key={n} className="grid grid-cols-3 gap-2 border-t border-slate-100 p-2 text-sm">
            <span>{n}ª posição</span>
            {left ? <button className="text-left text-cyan-800" onClick={()=>onOpen(left.ofertaId)}>{offerName(left.ofertaId)}</button> : <span>—</span>}
            {right ? <button className="text-left text-cyan-800" onClick={()=>onOpen(right.ofertaId)}>{offerName(right.ofertaId)}{before!==after && <small className="block text-slate-500">{previous ? previous.posicao===n ? 'Mesma posição' : `Veio da ${previous.posicao}ª posição` : 'Entrou na seleção'}</small>}</button> : <span>—</span>}
          </div>;
        };
        return <article key={g} className="rounded-xl border border-slate-200 p-3">
          <h3 className="mb-2 font-bold">{GROUP_LABEL[g]}</h3>
          <div className="grid grid-cols-3 gap-2 p-2 text-xs font-bold text-slate-600"><span>Ordem</span><span>{round(before)}</span><span>{round(after)}</span></div>
          {[1,2,3].map(row)}
          {[...a,...b].some(p=>p.posicao>3) && <details><summary className="cursor-pointer p-2 text-xs text-cyan-800">Reservas</summary>{[4,5,6].map(row)}</details>}
        </article>;
      })}</div></details>
    </section>
  </div>;
}
