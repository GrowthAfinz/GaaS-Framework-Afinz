import {describe,it,expect} from 'vitest';
import {resolvePoolLanding,parsePoolSelectionCsv} from './poolLanding';
import {VDV_SAMPLES,type VdvBriefingRow} from './vaiDeVisa';
const theme={ID:'T',TIPO:'TEMA',VERSAO:'BF26_V1',ATIVA:'True',TEMA:'Black Afinz',INICIO:'',FIM:''} as VdvBriefingRow;
const offers=Array.from({length:5},(_,i)=>({ID:'O'+i,TIPO:'OFERTA',VERSAO:'',ATIVA:'True',MARCA:'Marca '+i,FOTO:'https://example.invalid/foto.png',LINK:'https://example.invalid/oferta',VALOR:'10%',RESGATE:i===1?'PAGAR_COM_VISA':'CUPOM',CUPOM:'CUPOM',FIM:i===0?'2026-11-08':'2026-11-30',INICIO:'',CONDICOES:'<script>bad()</script>'} as VdvBriefingRow));
const selection=offers.map((o,i)=>({VERSAO:'BF26_V1_20261109',VERSAO_TEMA:'BF26_V1',GRUPO:'MODA',CELULA:'TODAS',POSICAO:String(i+1),OFERTA_ID:o.ID,ATIVA:'True'}));
const args={briefing:[theme,...offers],selection,sample:VDV_SAMPLES[0].sample,round:'BF26_V1_20261109',today:'2026-11-09'};
describe('Pool landing content',()=>{
 it('resolves theme separately, expires offers, compacts reserves and escapes content without analytics or identifiers',()=>{
  const r=resolvePoolLanding(args);
  expect(r.themeVersion).toBe('BF26_V1');expect(r.cards.map(c=>c.ID)).toEqual(['O1','O2','O3']);
  expect(r.html).not.toContain('<script>');expect(r.html).not.toContain('gtag');expect(r.html).not.toContain('SubscriberKey');
  expect(r.html).toContain('Pague com Visa');expect(r.html).toContain('Asset da LP pendente');
 });
 it('keeps old rounds stable, uses generic for comparison and blocks controls',()=>{
  expect(resolvePoolLanding({...args,round:'unknown'}).cards).toHaveLength(0);
  expect(resolvePoolLanding({...args,sample:{...args.sample,DS_CELULA_TESTE:'SEG-B'}}).cards).toHaveLength(0);
  expect(resolvePoolLanding({...args,sample:{...args.sample,DS_CELULA_TESTE:'SEG-C'}}).cards).toHaveLength(0);
 });
 it('rejects ambiguous or malformed nine-column selection imports',()=>{
  const header='VERSAO,GRUPO,CELULA,POSICAO,OFERTA_ID,ATIVA,MOTIVO,DT_RODADA,VERSAO_TEMA';
  const row='R,MODA,TODAS,1,O,True,GRUPO,2026-11-09,T';
  expect(parsePoolSelectionCsv(header+'\n'+row)).toHaveLength(1);
  expect(()=>parsePoolSelectionCsv(header+'\n'+row+'\n'+row)).toThrow();
  expect(()=>parsePoolSelectionCsv(header+'\n'+row.replace(',1,',',7,'))).toThrow();
 });
});
