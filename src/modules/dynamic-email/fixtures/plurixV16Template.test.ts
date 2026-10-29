import {describe,it,expect} from 'vitest';
import {PLURIX_V15_TEMPLATE} from './plurixV15Template';
import {PLURIX_V16_BASE_TEMPLATE,PLURIX_V16_R2_TEMPLATE,PLURIX_V16_TEMPLATE} from './plurixV16Template';
import {renderDynamicEmail} from '../ampscript/renderer';
import {emptyBriefingRow} from '../domain/briefing';
import {plurixEnvelope} from '../domain/sfmcEnvelope';
import {readFileSync} from 'node:fs';
describe('V16: fundos preenchidos na composicao da V15',()=>{
 it('preserva preparo CRM, links e assets da V15',()=>{
  expect(readFileSync('supabase/migrations/20261029141052_plurix_v16_opaque_backgrounds.sql','utf8').replace(/\r\n/g,'\n').split('$v16$')[1]).toBe(PLURIX_V16_BASE_TEMPLATE);
  const normalized=PLURIX_V16_TEMPLATE.split('@PLXV16Inicializado').join('@PLXV15Inicializado').replace('/* PLURIX V16 CRM:','/* PLURIX V15 CRM:');
  const restored=normalized.replace('/* V16: assinatura Amigao para redes adquiridas. */','/* V15 R3: nome de exibicao da investida; PRODUTO segue como chave tecnica. */')
   .replace('ELSEIF @Produto == "COMPRE MAIS" THEN\n  SET @NomeInvestida = "Amigão"','ELSEIF @Produto == "COMPRE MAIS" THEN\n  SET @NomeInvestida = "Compre Mais"')
   .replace('ELSEIF @Produto == "SUPERPAO" THEN\n  SET @NomeInvestida = "Amigão"','ELSEIF @Produto == "SUPERPAO" THEN\n  SET @NomeInvestida = "Superpão"');
  expect(restored.split('<!DOCTYPE html>')[0]).toBe(PLURIX_V15_TEMPLATE.split('<!DOCTYPE html>')[0]);
  const links=(s:string)=>[...s.matchAll(/(?:href|src)="([^"]*)"/g)].map(m=>m[1]);expect(links(normalized).filter(url=>url!=='%%unsub_center_url%%')).toEqual(links(PLURIX_V15_TEMPLATE));
  expect(plurixEnvelope(PLURIX_V16_TEMPLATE)?.version).toBe('V16');
 });
 it('preserva os seis links rastreaveis e adiciona cancelamento independente das preferencias',()=>{
  expect(readFileSync('supabase/migrations/20261029202155_plurix_v16_table_buttons_unsubscribe.sql','utf8').replace(/\r\n/g,'\n').split('$v16r2$')[1]).toBe(PLURIX_V16_R2_TEMPLATE);
  expect((PLURIX_V16_TEMPLATE.match(/class="sfmc-button"/g)||[])).toHaveLength(6);
  expect((PLURIX_V16_TEMPLATE.match(/href="%%=RedirectTo\(TreatAsContent\(@LinkCTA[12]\)\)=%%"/g)||[])).toHaveLength(6);
  expect(PLURIX_V16_TEMPLATE).toContain('href="%%unsub_center_url%%"');
  expect(PLURIX_V16_TEMPLATE).toContain('href="%%profile_center_url%%"');
  expect(PLURIX_V16_TEMPLATE).not.toContain('<v:roundrect');
  expect(PLURIX_V16_TEMPLATE).toContain('padding:15px 26px;background-color:#2C3490');
 });
 it('continua usando header imagem e corpo HTML com nome da investida',()=>{
  for(let seq=1;seq<=8;seq++)for(const limit of ['', '3500']){
   const row=Object.assign(emptyBriefingRow(),{HEADER:'https://example.com/hero.png',HEADER_TITULO:'Arte aprovada',COPY_1_PRETO:'<b>Compras no %%=v(@NomeInvestida)=%%</b>',MENSAGEM_LIMITE:'{{nome}}, R$ {{limite}}.',SEQUENCIA:`E-mail ${seq}`});
   const r=renderDynamicEmail(PLURIX_V16_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:'AMIGAO',SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'});
   expect(r.diagnostics).toEqual([]);expect(r.html).toContain('src="https://example.com/hero.png"');expect(r.html).toContain('<b>Compras no Amigão</b>');expect(r.html.includes('3.500,00')).toBe(Boolean(limit));
  }
 });
 it('usa Amigao na comunicacao das duas adquiridas, preservando suas chaves tecnicas',()=>{
  for(const product of ['AMIGAO','COMPRE MAIS','SUPERPAO','BOA','AVENIDA','PARANA']){
   const expected=({AMIGAO:'Amigão','COMPRE MAIS':'Amigão',SUPERPAO:'Amigão',BOA:'Boa',AVENIDA:'Avenida',PARANA:'Paraná'} as Record<string,string>)[product];
   const row=Object.assign(emptyBriefingRow(),{HEADER:'https://example.com/header.png',COPY_1_PRETO:'Compras no supermercado %%=v(@NomeInvestida)=%%.',SEQUENCIA:'E-mail 1',NM_PRODUTO_INTERNO:product});
   const result=renderDynamicEmail(PLURIX_V16_TEMPLATE,row,{CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:'',PRODUTO:product,SEQUENCIA:'E-mail 1',TP_CAMPANHA:'CRM'});
   expect(result.diagnostics).toEqual([]);expect(result.html).toContain('Compras no supermercado '+expected+'.');
   expect(row.NM_PRODUTO_INTERNO).toBe(product);
  }
 });
});
