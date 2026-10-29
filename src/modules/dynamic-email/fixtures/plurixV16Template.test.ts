import {describe,it,expect} from 'vitest';
import {PLURIX_V15_TEMPLATE} from './plurixV15Template';
import {PLURIX_V16_TEMPLATE} from './plurixV16Template';
import {renderDynamicEmail} from '../ampscript/renderer';
import {emptyBriefingRow} from '../domain/briefing';
import {plurixEnvelope} from '../domain/sfmcEnvelope';
import {readFileSync} from 'node:fs';
describe('V16: fundos preenchidos na composicao da V15',()=>{
 it('preserva preparo CRM, links e assets da V15',()=>{
  expect(readFileSync('supabase/migrations/20261029141052_plurix_v16_opaque_backgrounds.sql','utf8').replace(/\r\n/g,'\n').split('$v16$')[1]).toBe(PLURIX_V16_TEMPLATE);
  const normalized=PLURIX_V16_TEMPLATE.split('@PLXV16Inicializado').join('@PLXV15Inicializado').replace('/* PLURIX V16 CRM:','/* PLURIX V15 CRM:');
  expect(normalized.split('<!DOCTYPE html>')[0]).toBe(PLURIX_V15_TEMPLATE.split('<!DOCTYPE html>')[0]);
  const links=(s:string)=>[...s.matchAll(/(?:href|src)="([^"]*)"/g)].map(m=>m[1]);expect(links(normalized)).toEqual(links(PLURIX_V15_TEMPLATE));
  expect(plurixEnvelope(PLURIX_V16_TEMPLATE)?.version).toBe('V16');
 });
 it('continua usando header imagem e corpo HTML com nome da investida',()=>{
  for(let seq=1;seq<=8;seq++)for(const limit of ['', '3500']){
   const row=Object.assign(emptyBriefingRow(),{HEADER:'https://example.com/hero.png',HEADER_TITULO:'Arte aprovada',COPY_1_PRETO:'<b>Compras no %%=v(@NomeInvestida)=%%</b>',MENSAGEM_LIMITE:'{{nome}}, R$ {{limite}}.',SEQUENCIA:`E-mail ${seq}`});
   const r=renderDynamicEmail(PLURIX_V16_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:'AMIGAO',SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'});
   expect(r.diagnostics).toEqual([]);expect(r.html).toContain('src="https://example.com/hero.png"');expect(r.html).toContain('<b>Compras no Amigão</b>');expect(r.html.includes('3.500,00')).toBe(Boolean(limit));
  }
 });
});
