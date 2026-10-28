import {describe,it,expect} from 'vitest';
import {PLURIX_INVESTIDA_NAMES,plurixInvestidaName,personalizeInvestidaCopy} from './plurixInvestida';
describe('Nome tratado da investida V15',()=>{
 it('normaliza codigos e preserva nomes comerciais e acentos',()=>{
  for(const [key,name] of Object.entries(PLURIX_INVESTIDA_NAMES))expect(plurixInvestidaName(' '+key.toLowerCase()+' ')).toBe(name);
  expect(plurixInvestidaName('AMIGÃO')).toBe('Amigão');expect(plurixInvestidaName('PARANÁ')).toBe('Paraná');expect(plurixInvestidaName('Superpão')).toBe('Superpão');expect(plurixInvestidaName('COMPRE   MAIS')).toBe('Compre Mais');expect(plurixInvestidaName('DESCONHECIDA')).toBe('');
 });
 it('muda a referencia preservando HTML, pontuacao e preposicoes',()=>{
  expect(personalizeInvestidaCopy('<b>dentro e fora do Supermercado</b>?','AMIGAO')).toBe('<b>dentro e fora do %%=v(@NomeInvestida)=%%</b>?');
  for(const [product,name] of Object.entries(PLURIX_INVESTIDA_NAMES)){
   for(const reference of ['no seu supermercado','no supermercado','no '+name])expect(personalizeInvestidaCopy('Compras '+reference+'.',product)).toBe('Compras no %%=v(@NomeInvestida)=%%.');
  }
  const ready='Compras no %%=v(@NomeInvestida)=%%.';expect(personalizeInvestidaCopy(ready,'BOA')).toBe(ready);
  expect(personalizeInvestidaCopy('Beneficios em varios mercados.','BOA')).toBe('Beneficios em varios mercados.');
 });
});
