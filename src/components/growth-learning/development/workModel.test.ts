import {describe,it,expect} from 'vitest';
import {newWork,matchesWorkspace,readWorkView,safeWorkUrl,chooseInitiative,prepareInitiativeBrief} from './workModel';
describe('workspaces and legacy links',()=>{
 it('preserves old task and investigation routes and supports four spaces',()=>{
  expect(readWorkView('')).toBe('overview');expect(readWorkView('?dev_task=existing')).toBe('sdd');
  expect(readWorkView('?item=existing')).toBe('investigations');expect(readWorkView('?task_space=cross_sell')).toBe('cross_sell');
  expect(readWorkView('?task_space=unknown')).toBe('overview');
 });
 it('relates one item to multiple views without changing ownership',()=>{
  const t={...newWork('monetization'),related_workspaces:['cross_sell' as const]};
  expect(matchesWorkspace(t,'monetization')).toBe(true);expect(matchesWorkspace(t,'cross_sell')).toBe(true);expect(matchesWorkspace(t,'acquisition')).toBe(false);expect(t.workspace).toBe('monetization');
 });
 it('links exact Wiki paths and rejects executable protocols',()=>{
  expect(safeWorkUrl('10-Resultados/Iniciativas/Visa.md')).toContain('wiki_path=');
  expect(safeWorkUrl('javascript:alert(1)')).toBeNull();expect(safeWorkUrl('https://example.com')).toBe('https://example.com');
 });
});

it('selects initiatives only within the active front and prepares explicit agent activation',()=>{
 const initiatives=[{id:'visa',title:'Vai de Visa',workspace:'monetization' as const,description:'Objetivo',source_note:'Teste.md',revision:1},{id:'loop',title:'Loop de Memória',workspace:'sdd' as const,description:'Objetivo',source_note:null,revision:1}];
 expect(chooseInitiative(initiatives,'sdd','visa')?.id).toBe('loop');expect(chooseInitiative(initiatives,'cross_sell',null)).toBeNull();
 expect(prepareInitiativeBrief(initiatives[0],[])).toContain('comando explícito');expect(prepareInitiativeBrief(initiatives[0],[])).toContain('sem aprovação do conteúdo exato');
});
