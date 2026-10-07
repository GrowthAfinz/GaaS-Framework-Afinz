import { expect,it } from 'vitest';
import { reconcileMessage } from './reconcile';
import type { PackageMessage } from './types';
import type { CommunicationTemplate } from '../../types/communication';
const m={utm:{af_sub3:'b2c_Test_D1'},is_optout:false,content:{channel:'WhatsApp',meta_template_name:'Meta'}} as unknown as PackageMessage;
const c=[{template_id:'b2c_Test_D1',channel:'WhatsApp',title:'Meta'}] as CommunicationTemplate[];
it('usa ID com caixa exata; nunca cai no título se outro ID veio no link',()=>{
 expect(reconcileMessage(m,c).status).toBe('ID exato');
 expect(reconcileMessage({...m,utm:{af_sub3:'B2C_TEST_D1'}},c).status).toBe('Novo template');
});
it('exclui opt-out e bloqueia canal incompatível e título ambíguo',()=>{
 expect(reconcileMessage({...m,is_optout:true},c).eligible).toBe(false);
 expect(reconcileMessage(m,[{...c[0],channel:'SMS'}]).eligible).toBe(false);
 expect(reconcileMessage({...m,utm:{}},[...c,{...c[0],template_id:'other'}]).status).toBe('Título ambíguo');
});

