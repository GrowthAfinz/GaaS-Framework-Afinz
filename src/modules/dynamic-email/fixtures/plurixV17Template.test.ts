import {describe,it,expect} from 'vitest';
import {PLURIX_V16_TEMPLATE} from './plurixV16Template';
import {PLURIX_V17_TEMPLATE} from './plurixV17Template';
import {renderDynamicEmail} from '../ampscript/renderer';
import {emptyBriefingRow} from '../domain/briefing';
import {plurixEnvelope} from '../domain/sfmcEnvelope';
import {readFileSync,readdirSync} from 'node:fs';

describe('V17: audiencia COMUNICACAO_PLX, restante igual a V16',()=>{
 it('exporta a mesma fonte publicada pela migration',()=>{
  const migration=readdirSync('supabase/migrations').find(f=>f.endsWith('_plurix_v17_comunicacao_plx_audience.sql'))!;
  expect(readFileSync('supabase/migrations/'+migration,'utf8').replace(/\r\n/g,'\n').split('$v17$')[1]).toBe(PLURIX_V17_TEMPLATE);
 });
 it('altera apenas a DE, os tres campos de audiencia e o identificador de versao',()=>{
  const restored=PLURIX_V17_TEMPLATE.split('@PLXV17Inicializado').join('@PLXV16Inicializado')
   .replace('/* PLURIX V17 CRM:','/* PLURIX V16 CRM:')
   .replace('Audiencia: COMUNICACAO_PLX (FIRST_NAME, LIMITE_CRD, INVESTIDA).','Audiencia: TB_CAMPANHA_AQUISICAO (PRI_NOME, LIMITE, PRODUTO).')
   .replace('SET @DE_AUDIENCIA = "COMUNICACAO_PLX"','SET @DE_AUDIENCIA = "TB_CAMPANHA_AQUISICAO"')
   .replace('Field(@AudRow, "FIRST_NAME")','Field(@AudRow, "PRI_NOME")')
   .replace('Field(@AudRow, "LIMITE_CRD")','Field(@AudRow, "LIMITE")')
   .replace('Field(@AudRow, "INVESTIDA")','Field(@AudRow, "PRODUTO")');
  expect(restored).toBe(PLURIX_V16_TEMPLATE);
  expect(PLURIX_V17_TEMPLATE.slice(PLURIX_V17_TEMPLATE.indexOf('<!DOCTYPE html>'))).toBe(PLURIX_V16_TEMPLATE.slice(PLURIX_V16_TEMPLATE.indexOf('<!DOCTYPE html>')));
  expect(PLURIX_V17_TEMPLATE).not.toContain('TB_CAMPANHA_AQUISICAO');
 });
 it('mantem CPF textual, cardinalidade e sequencia do estado, sem usar TIPO ou SEQUENCIA da audiencia',()=>{
  expect(PLURIX_V17_TEMPLATE).toContain('SET @AudRows = LookupRows(@DE_AUDIENCIA, "CPF", @Chave)');
  expect(PLURIX_V17_TEMPLATE).toContain('IF RowCount(@AudRows) != 1 THEN');
  expect(PLURIX_V17_TEMPLATE).toContain('AttributeValue("_subscriberkey")');
  expect(PLURIX_V17_TEMPLATE).toContain('SET @DE_ESTADO = "ESTADO_SEQUENCIA_CRM"');
  expect(PLURIX_V17_TEMPLATE).toContain('SET @Sequencia = Trim(Field(@EstadoRow, "SEQUENCIA"))');
  expect(PLURIX_V17_TEMPLATE).not.toMatch(/Field\(@AudRow, "(?:TIPO|SEQUENCIA)"\)/);
  expect(PLURIX_V17_TEMPLATE).not.toMatch(/\b(?:InsertDE|UpdateDE|UpsertDE)\s*\(/i);
  expect(plurixEnvelope(PLURIX_V17_TEMPLATE)?.version).toBe('V17');
  expect(plurixEnvelope(PLURIX_V17_TEMPLATE)?.preheader).toContain('SET @DE_AUDIENCIA = "COMUNICACAO_PLX"');
 });
 it('preserva a mesma renderizacao nas seis redes e oito sequencias, com e sem limite',()=>{
  for(const product of ['Amigao','Boa','Avenida','Compre Mais','Parana','Superpao'])for(let sequence=1;sequence<=8;sequence++)for(const limit of ['', '3000']){
   const row=Object.assign(emptyBriefingRow(),{SEQUENCIA:`E-mail ${sequence}`,HEADER:'https://example.com/hero.png',HEADER_TITULO:'Titulo aprovado',COPY_1_PRETO:'Compras no supermercado %%=v(@NomeInvestida)=%%.',TITULO_COPY_1_AZUL:'Olá, %%=v(@FirstName)=%%!',MENSAGEM_LIMITE:'{{nome}}, R$ {{limite}}.'});
   const subscriber={CPF:'00000000000',PRI_NOME:'MARIA',LIMITE:limit,PRODUTO:product,SEQUENCIA:row.SEQUENCIA,TP_CAMPANHA:'CRM'};
   const old=renderDynamicEmail(PLURIX_V16_TEMPLATE,row,subscriber);const next=renderDynamicEmail(PLURIX_V17_TEMPLATE,row,subscriber);
   expect(next.diagnostics).toEqual([]);expect(next.html).toBe(old.html);expect(next.html).toContain('src="https://example.com/hero.png"');
  }
 });
});
