import {describe,it,expect} from 'vitest';
import {opaqueEmailBackgrounds} from './opaqueEmailBackgrounds';
describe('Fundos opacos sem redesenhar o email',()=>{
 it('preenche tabela e texto com branco e conserva HTML e variaveis',()=>{
  const html='<table><tr><td><p style="margin:0">Olá %%=v(@NomeInvestida)=%%!</p></td></tr></table>';
  const fixed=opaqueEmailBackgrounds(html);
  expect(fixed).toContain('<table style="background-color:#ffffff;" bgcolor="#ffffff">');
  expect(fixed).toContain('<p style="margin:0;background-color:#ffffff;">Olá %%=v(@NomeInvestida)=%%!</p>');
  expect(opaqueEmailBackgrounds(fixed)).toBe(fixed);
 });
 it('mantem o tom herdado dentro de cards e respeita fundos amarelos/azuis',()=>{
  const fixed=opaqueEmailBackgrounds('<td bgcolor="#F4F5FB"><p>Texto</p><div style="background-color:#E7A921;"><p>Check</p></div></td><td style="background-color:#2C3490;"><p>CTA</p></td>');
  expect(fixed).toContain('<p style="background-color:#F4F5FB;">Texto</p>');
  expect(fixed).toContain('<p style="background-color:#E7A921;">Check</p>');
  expect(fixed).toContain('<p style="background-color:#2C3490;">CTA</p>');
 });
 it('substitui transparencia de fundo e preserva transparencia intencional de texto',()=>{
  const fixed=opaqueEmailBackgrounds('<div style="background-color: transparent;opacity:0;color:transparent;"><p>Preheader</p></div>');
  expect(fixed).not.toContain('background-color: transparent');expect(fixed).toContain('opacity:0;color:transparent;');
 });
});
