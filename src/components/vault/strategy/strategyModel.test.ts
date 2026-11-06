import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {initialStrategy,moveBlock,exportStrategy} from './strategyModel';
describe('strategy pilot document',()=>{
 it('imports the real Visa source without losing SQL, Mermaid or expanded technical contracts',()=>{
  const content=readFileSync(new URL('../../../../docs/wiki-vault/05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md',import.meta.url),'utf8');
  const doc=initialStrategy({title:'Estratégia Pool de Ofertas Visa',content_markdown:content});
  const exported=exportStrategy(doc);
  expect(doc.blocks[0].type).toBe('tasks');expect(doc.blocks.filter(b=>b.type==='markdown')).toHaveLength(10);
  expect(exported.match(/```mermaid/g)).toHaveLength(3);
  expect(exported.match(/```sql/g)?.length).toBe(content.match(/```sql/g)?.length);
  expect(exported).toContain(':::details');expect(exported).toContain('[[DE-VDV_APTOS]]');
  expect(exported).not.toContain('tags: [');expect(exported).toContain('SQL não testado');
 });
 it('does not split headings inside code fences and keeps block IDs stable when moving',()=>{
  const doc=initialStrategy({title:'Teste',content_markdown:'# Teste\n\nResumo\n\n## A\n```sql\n## literal\n```\n## B\nTexto'});
  expect(doc.blocks.filter(b=>b.type==='markdown')).toHaveLength(2);
  const moved=moveBlock(doc,doc.blocks[1].id,1);expect(moved.blocks[2].id).toBe(doc.blocks[1].id);expect(doc.blocks[1].title).toBe('A');
 });
});
