import {describe,it,expect} from 'vitest';
import {resolveCommunicationVisual} from './communicationVisualResolution';
import type {CommunicationTemplate} from '../types/communication';
const asset=(id:string,channel='E-mail',path:string|null='email.html')=>({template_id:id,channel,original_path:path} as CommunicationTemplate);
describe('visual evidence resolution',()=>{
 it('prefers the exact original ID without changing the proposal',()=>{const r=resolveCommunicationVisual([asset('original'),asset('proposed')],'E-mail','original','proposed');expect(r.template?.template_id).toBe('original');expect(r.sourceLabel).toContain('original no link');});
 it('labels proposed catalog evidence when original is unavailable',()=>{expect(resolveCommunicationVisual([asset('proposed')],'E-mail','original','proposed').sourceLabel).toContain('candidata');});
 it('does not borrow a different dispatch, channel, case or empty asset',()=>{expect(resolveCommunicationVisual([asset('D2'),asset('D3','SMS'),asset('d3'),asset('proposed','E-mail',null)],'E-mail','D3','proposed').template).toBeUndefined();});
});
