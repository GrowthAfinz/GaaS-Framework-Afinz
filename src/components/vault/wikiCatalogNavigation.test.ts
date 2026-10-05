import {describe,it,expect} from 'vitest';
import {catalogSelection,EMPTY_CATALOG,readCatalogRoute,subjectGroup,subjectRoute,writeCatalogRoute} from './wikiCatalogNavigation';
import type {VaultNoteSummary} from './vaultTypes';
const note=(id:string,tags:string[],title=id)=>({id,title,tags:['growth-assunto',...tags]} as VaultNoteSummary);
const own=note('own',['dominio:CRM Aquisição','bu:B2C','parceiro:Proprietaria','segmento:Negados']);
const serasa=note('serasa',['dominio:CRM Aquisição','bu:B2C','parceiro:Serasa','segmento:Abandonados']);
const bb=note('bb',['dominio:CRM Aquisição','bu:B2B2C','parceiro:Bem Barato','segmento:Recencia_de_Compra']);
const rows=[own,serasa,bb,note('media',['dominio:Mídia paga'])];
describe('Wiki catalog hierarchy',()=>{
 it('keeps named partners separate from own B2C and unnamed units',()=>{
  expect(subjectGroup(serasa).key).toBe('partner:Serasa');expect(subjectGroup(own).key).toBe('audience:B2C');
  expect(subjectGroup(note('unknown',['bu:Plurix','parceiro:N/A'])).key).toBe('unit:Plurix');
  expect(subjectGroup(note('unknown',[])).key).toBe('unclassified');
 });
 it('identifies institutional and B2C only from declared metadata or explicit media markers',()=>{
  expect(subjectGroup(note('institution',['bu:Institucional'])).key).toBe('audience:Institucional');
  expect(subjectGroup(note('media',['dominio:Mídia paga'],'[MARCA] Institucional')).key).toBe('audience:Institucional');
  expect(subjectGroup(note('media',['dominio:Mídia paga'],'[TMP] [B2C] Cartão')).key).toBe('audience:B2C');
  expect(subjectGroup(note('other',[],'Cartão institucional')).key).toBe('unclassified');
  expect(subjectGroup(note('media',['dominio:Mídia paga','parceiro:Bem Barato'],'[B2C] Institucional')).key).toBe('partner:Bem Barato');
 });
 it('selects exactly the front, partner/public and segment without leaking other partners',()=>{
  const selected=catalogSelection(rows,{}, {...EMPTY_CATALOG,front:'CRM Aquisição',group:'partner:Serasa',segment:'Abandonados'});
  expect(selected.selected.map(n=>n.id)).toEqual(['serasa']);
  expect(catalogSelection(rows,{}, {...EMPTY_CATALOG,front:'CRM Aquisição',group:'partner:missing'}).selected).toEqual([]);
 });
 it('restores all hierarchy levels and search from a shareable URL without dropping the result month',()=>{
  const route={front:'CRM Aquisição',group:'partner:Bem Barato',segment:'Recencia_de_Compra',query:'compra'};
  const params=writeCatalogRoute(new URLSearchParams('result_month=2026-09&item=root'),route);
  expect(readCatalogRoute('?'+params)).toEqual(route);expect(params.get('result_month')).toBe('2026-09');
  writeCatalogRoute(params,EMPTY_CATALOG);expect(params.has('wiki_group')).toBe(false);expect(params.has('wiki_segment')).toBe(false);
 });
 it('derives the destination path from the note rather than inheriting another partner',()=>{
  expect(subjectRoute(bb)).toEqual({front:'CRM Aquisição',group:'partner:Bem Barato',segment:'Recencia_de_Compra',query:''});
  expect(subjectRoute(note('generic',['dominio:Copa e Visa'])).segment).toBe('__general__');
 });
 it('respects canonical partner and segment hub filters',()=>{
  const selection=catalogSelection(rows,{parceiro:'Serasa'},{...EMPTY_CATALOG,front:'CRM Aquisição'});
  expect(selection.route.group).toBe('partner:Serasa');expect(selection.selected.map(n=>n.id)).toEqual(['serasa']);
  expect(catalogSelection(rows,{segmento:'Negados'},{...EMPTY_CATALOG,front:'CRM Aquisição',group:'audience:B2C'}).selected.map(n=>n.id)).toEqual(['own']);
 });
});
