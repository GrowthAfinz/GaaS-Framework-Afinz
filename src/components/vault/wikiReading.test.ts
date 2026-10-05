import {expect,it} from 'vitest';
import {wikiReading} from './wikiReading';
it('preserves source text, heading offsets and technical records without treating fenced headings as sections',()=>{
 const input='# Nota\n\n## O que este assunto representa\nRecuperar proposta.\n\n## Escopo\n**O que precisa ser validado:** Confirmar entrada.\n\n## Registro de descoberta\n```json\n{"id":"A"}\n## não é uma seção\n```\n';
 const reading=wikiReading(input);
 expect(reading.summary).toBe('Recuperar proposta.');expect(reading.pending).toBe('Confirmar entrada.');
 expect(reading.sections.filter(section=>section.technical)).toHaveLength(1);
 expect(reading.sections[reading.sections.length-1]?.content).toContain('## não é uma seção');
 expect(reading.sections.map(section=>section.content).join('\n').trim()).toBe(input.replace('# Nota\n','').trim());
});
