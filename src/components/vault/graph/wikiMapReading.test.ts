import {describe,it,expect} from 'vitest';
import {initialMapLayers,mapCategoryLayers,noteOpening} from './wikiMapReading';
import {MAP_GROUPS} from './wikiGraph';

describe('map category selection',()=>{
 it('selects only one group, including a second click on the same category',()=>{
   const selected=mapCategoryLayers('res');
   expect(Object.entries(selected).filter(([,visible])=>visible).map(([key])=>key)).toEqual(['res']);
   expect(mapCategoryLayers('res')).toEqual(selected);
   expect(Object.entries(mapCategoryLayers('crm')).filter(([,visible])=>visible).map(([key])=>key)).toEqual(['crm']);
 });
 it('restores all categories explicitly and migrates old mixed visibility settings',()=>{
   expect(Object.values(mapCategoryLayers(null)).every(Boolean)).toBe(true);
   expect(initialMapLayers('',{res:true,crm:true})).toEqual(mapCategoryLayers(null));
   expect(initialMapLayers('',{res:true})).toEqual(mapCategoryLayers('res'));
   expect(initialMapLayers(MAP_GROUPS.find(g=>g.key==='crm')!.topic,{res:true})).toEqual(mapCategoryLayers('crm'));
 });
});
describe('note opening',()=>{
 it('shows the actual opening without frontmatter or a repeated title',()=>{
   expect(noteOpening('---\r\ntitle: "Nota"\r\nsecret: metadata\r\n---\r\n# Nota\r\n\r\n## Definição\r\n\r\nO **público** usa [[Plurix|+amigo]] e [a Wiki](https://example.com).')).toBe('Definição\n\nO público usa +amigo e a Wiki.');
 });
 it('limits long notes at a word boundary and handles empty notes',()=>{
   const text='Uma nota com contexto de aquisição e resultados. '.repeat(30);
   expect(noteOpening(text).length).toBeLessThanOrEqual(561);
   expect(noteOpening(text)).toMatch(/…$/);
   expect(noteOpening('# Sem conteúdo')).toBe('');
   expect(noteOpening('')).toBe('');
 });
});
