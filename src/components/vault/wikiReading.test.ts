import {expect,it} from 'vitest';
import {wikiReading,wikiNoteNavigationParams} from './wikiReading';
it('preserves source text, heading offsets and technical records without treating fenced headings as sections',()=>{
 const input='# Nota\n\n## O que este assunto representa\nRecuperar proposta.\n\n## Escopo\n**O que precisa ser validado:** Confirmar entrada.\n\n## Registro de descoberta\n```json\n{"id":"A"}\n## não é uma seção\n```\n';
 const reading=wikiReading(input);
 expect(reading.summary).toBe('Recuperar proposta.');expect(reading.pending).toBe('Confirmar entrada.');
 expect(reading.sections.filter(section=>section.technical)).toHaveLength(1);
 expect(reading.sections[reading.sections.length-1]?.content).toContain('## não é uma seção');
 expect(reading.sections.map(section=>section.content).join('\n').trim()).toBe(input.replace('# Nota\n','').trim());
});

it('projects scope labels and journey drill targets while retaining the original source',()=>{
 const input='## Escopo, mecanismo e elegibilidade\n| Campo | Contexto observado |\n|---|---|\n| segment | Base_Proprietaria |\n| channels | ["SMS", "WhatsApp"] |\n| subgroups | ["N/A"] |\n\n## Campanhas e variantes observadas\n| Agrupamento | Jornada | Safra | Etapa | Subgrupo | Linhas |\n|---|---|---|---|---|---|\n| CAMP-123 | JOR_AQS_B2C_TESTE | 09/26 | Reativacao | Diario | 12 |';
 const result=wikiReading(input);
 expect(result.scopeFields).toEqual([{key:'segment',label:'Público',values:['Base Proprietaria']},{key:'channels',label:'Canais',values:['SMS','WhatsApp']}]);
 expect(result.journeys[0]).toEqual({id:'CAMP-123',journey:'JOR_AQS_B2C_TESTE',safra:'09/26',stage:'Reativacao',subgroup:'Diario',rows:'12'});
 expect(result.sections.map(section=>section.content).join('\n')).toBe(input);
});
it('keeps analytical month across notes while discarding scope from the previous note',()=>{
 const params=wikiNoteNavigationParams('?item=old&result_month=2026-09&result_domain=crm&result_partner=Serasa&result_journey=JOR_TEST&result_operation_id=old&wiki_front=CRM');
 expect(params.get('result_month')).toBe('2026-09');expect(params.get('result_domain')).toBe('crm');
 expect(params.has('result_partner')).toBe(false);expect(params.has('result_journey')).toBe(false);expect(params.has('result_operation_id')).toBe(false);expect(params.has('wiki_front')).toBe(false);
});
