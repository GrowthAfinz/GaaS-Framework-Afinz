import { expect, it } from 'vitest';
import { previewText,smsSegments } from './previewModel';
import type { MessageContent } from './types';
it('preenche exemplos sem executar código ou HTML',()=>{
 const c={body_text:'Olá ${1}, limite ${2}. <script>x</script>',body_params:['%%FIRST_NAME%%','%%LIMITE_CRD%%']} as MessageContent;
 expect(previewText(c)).toBe('Olá Maria, limite 2.500. <script>x</script>');
 expect(previewText(c,true)).toContain('[FIRST_NAME]');
});
it('conta GSM-7, extensão, Unicode e emoji',()=>{
 expect(smsSegments('é'.repeat(160))).toEqual({encoding:'GSM-7',units:160,segments:1});
 expect(smsSegments('^'.repeat(81))).toEqual({encoding:'GSM-7',units:162,segments:2});
 expect(smsSegments('ã'.repeat(71))).toEqual({encoding:'UCS-2',units:71,segments:2});
 expect(smsSegments('😀'.repeat(36))).toEqual({encoding:'UCS-2',units:72,segments:2});
});

