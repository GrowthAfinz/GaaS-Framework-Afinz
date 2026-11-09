import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {initialStrategy,moveBlock,exportStrategy,replaceStrategyDetail} from './strategyModel';
describe('strategy pilot document',()=>{
 it('imports the real Visa source without losing SQL, Mermaid or expanded technical contracts',()=>{
  const content=readFileSync(new URL('../../../../docs/wiki-vault/05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md',import.meta.url),'utf8');
  const doc=initialStrategy({title:'Estratégia Pool de Ofertas Visa',content_markdown:content,relative_path:'05-Estrategia/Estrategia-Pool-de-Ofertas-Visa.md'});
  const exported=exportStrategy(doc);
  expect(doc.blocks[0].type).toBe('tasks');expect(doc.blocks.filter(b=>b.type==='markdown')).toHaveLength(13);
  expect(exported.match(/```mermaid/g)).toHaveLength(3);
  expect(exported.match(/```sql/g)?.length).toBe(content.match(/```sql/g)?.length);
  expect(exported).toContain(':::details');expect(exported).toContain('[[DE-VDV_APTOS]]');
  expect(exported).not.toContain('tags: [');expect(exported).toContain('ULTIMO_ACESSO');
  expect(exported).toContain('ID_POLITICA_CANAL');expect(exported).toContain('aplicação manual no SFMC pendente');
 });
 it('does not split headings inside code fences and keeps block IDs stable when moving',()=>{
  const doc=initialStrategy({title:'Teste',content_markdown:'# Teste\n\nResumo\n\n## A\n```sql\n## literal\n```\n## B\nTexto'});
  expect(doc.blocks.filter(b=>b.type==='markdown')).toHaveLength(2);
  const moved=moveBlock(doc,doc.blocks[0].id,1);expect(moved.blocks[1].id).toBe(doc.blocks[0].id);expect(doc.blocks[0].title).toBe('A');
 });
});

it('imports insurance topics and diagrams without adding the Visa checklist',()=>{
 const content=readFileSync(new URL('../../../../docs/wiki-vault/05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md',import.meta.url),'utf8');
 const doc=initialStrategy({title:'Estratégia de Segmentação de Seguros',content_markdown:content,relative_path:'05-Estrategia/Estrategia-de-Segmentacao-de-Seguros.md'});
 expect(doc.blocks.some(b=>b.type==='tasks')).toBe(false);
 expect(exportStrategy(doc).match(/```mermaid/g)).toHaveLength(3);
 expect(exportStrategy(doc).match(/```sql/g)).toHaveLength(3);
 expect(exportStrategy(doc)).toContain('SEGUROS_DEVICE_CPF');
 expect(doc.blocks.some(b=>b.title.includes('Fichas técnicas das Data Extensions'))).toBe(true);
 expect(exportStrategy(doc)).not.toMatch(/seguros-(percurso|sfmc)-v[23]\.svg/);
});

it('edits one fiche without changing adjacent SQL, links or the enclosing section',()=>{
 const before='Introdução\n:::details DE A\n[[Fonte]]\n```sql\nSELECT 1;\n```\n:::\n:::details DE B\nOutro conteúdo\n:::';
 const lines=before.split('\n');
 const changed=replaceStrategyDetail(before,{start:1,end:6,original:lines.slice(1,7).join('\n')},'DE A revisada','[[Fonte]]\n```sql\nSELECT 2;\n```');
 expect(changed).toContain(':::details DE A revisada');
 expect(changed).toContain('SELECT 2;');
 expect(changed.slice(changed.indexOf(':::details DE B'))).toBe(before.slice(before.indexOf(':::details DE B')));
 expect(changed.startsWith('Introdução\n')).toBe(true);
 expect(()=>replaceStrategyDetail(changed,{start:1,end:6,original:lines.slice(1,7).join('\n')},'Stale','lost')).toThrow('strategy_detail_changed');
});
it('rejects a malformed or unclosed detail anchor',()=>{
 expect(()=>replaceStrategyDetail(':::details A\ntexto',{start:0,end:1,original:':::details A\ntexto'},'A','novo')).toThrow();
});
