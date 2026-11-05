import {describe,it,expect} from 'vitest';
import {createVdvEdition,materializeVdvTemplate,ensureVdvTemplate,projectVdvEditorial,factoryFamilyOrder} from './factoryEmail';
import {VDV_BRIEFING_CSV} from '../fixtures/vdvBF26V1.csv';
import {parseVdvBriefingCsv} from './vaiDeVisa';
import {toBriefing} from '../services/workspaceService';
import {exportableRow} from './workspace';
import {vdvSaveItems} from '../services/vaiDeVisaService';
describe('Documento editorial nativo Visa',()=>{
 it('preserva contexto no round-trip pelo mesmo loader dos briefings',()=>{const rows=createVdvEdition('BF26_V1','Black Friday');expect(rows).toHaveLength(2);for(const row of rows){const restored=toBriefing({id:row.__id,briefing_data:exportableRow(row),partner:row.__meta.partner,segment:row.__meta.segment,week_key:row.__meta.weekKey,campaign_group_id:row.__meta.campaignGroupId,template_slot_id:row.__meta.templateSlotId,status:'draft',version:1});expect(restored.__editor).toEqual(row.__editor);expect(restored.__meta.templateSlotId).toBe('builtin-vdv-pool');}});
 it('tem uma fonte canônica para os dois toques e conserva alterações de fonte',()=>{const [slot]=ensureVdvTemplate([]);expect(ensureVdvTemplate([slot])).toHaveLength(1);const custom=slot.source+'<!-- revisão manual -->';expect(materializeVdvTemplate(custom,'V2')).toContain('SET @VersaoEmail = "V2"');expect(materializeVdvTemplate(custom,'V2')).toContain('revisão manual');});
 it('projeta envelope e respeita herança V2',()=>{const b=parseVdvBriefingCsv(VDV_BRIEFING_CSV);const [a,c]=createVdvEdition('BF26_V1','Black Friday');expect(projectVdvEditorial(a,b).ASSUNTO).toBe(b[0].ASSUNTO);expect(projectVdvEditorial(c,b).ASSUNTO).toBe(b[0].ASSUNTO);b[0].ASSUNTO_V2='Assunto V2';expect(projectVdvEditorial(c,b).ASSUNTO).toBe('Assunto V2');});
 it('ordena frentes e só envia linhas novas/editadas com versão esperada',()=>{expect(['Rentabilização','Ciclo de Vida','Aquisição'].sort((a,b)=>factoryFamilyOrder(a)-factoryFamilyOrder(b))).toEqual(['Aquisição','Ciclo de Vida','Rentabilização']);const b=parseVdvBriefingCsv(VDV_BRIEFING_CSV);expect(vdvSaveItems('briefing',[{...b[0],__version:'3'}])).toEqual([]);const items=vdvSaveItems('briefing',[{...b[0],__version:'3',__dirty:'true',__source:'import'}]);expect(items[0].expected_version).toBe(3);expect(items[0].source).toBe('import');});
});
