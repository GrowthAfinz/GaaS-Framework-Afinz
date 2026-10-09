import {describe,it,expect} from 'vitest';
import {resolveCommunicationVisual,resolvePreview} from './communicationVisualResolution';
import type {CommunicationTemplate} from '../types/communication';
const asset=(id:string,channel='E-mail',path:string|null='email.html')=>({template_id:id,channel,original_path:path} as CommunicationTemplate);
describe('visual evidence resolution',()=>{
 it('keeps the selected approved version tied to its unambiguous observed visual origin',()=>{const origin={snapshot_id:'S',occurrence_key:'O'};const r=resolvePreview({channel:'E-mail',catalog:[asset('T')],templateId:'T',contents:new Map([['T',[{is_current:true,visual_origin:origin,payload:{channel:'E-mail',email_html:'<img src="">'}} as any]]])});expect(r.kind).toBe('pack_current');expect(r.visualOrigin).toEqual(origin);});
 it('uses the identified catalog HTML when the pack HTML has a missing image',()=>{const r=resolvePreview({channel:'E-mail',catalog:[asset('T')],templateId:'T',packContent:{channel:'E-mail',email_html:'<img src="">'} as any});expect(r.kind).toBe('catalog_html');expect(r.label).toBe('Catálogo');});
 it('retains partial evidence explicitly if no complete catalog exists',()=>{const r=resolvePreview({channel:'E-mail',catalog:[],packContent:{channel:'E-mail',email_html:'<img src="">'} as any});expect(r.kind).toBe('pack_message');expect(r.label).toContain('incompleta');});
 it('prefers the exact original ID without changing the proposal',()=>{const r=resolveCommunicationVisual([asset('original'),asset('proposed')],'E-mail','original','proposed');expect(r.template?.template_id).toBe('original');expect(r.sourceLabel).toContain('original no link');});
 it('labels proposed catalog evidence when original is unavailable',()=>{expect(resolveCommunicationVisual([asset('proposed')],'E-mail','original','proposed').sourceLabel).toContain('candidata');});
 it('does not borrow a different dispatch, channel, case or empty asset',()=>{expect(resolveCommunicationVisual([asset('D2'),asset('D3','SMS'),asset('d3'),asset('proposed','E-mail',null)],'E-mail','D3','proposed').template).toBeUndefined();});
});
