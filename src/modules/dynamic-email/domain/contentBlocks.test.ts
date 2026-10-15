import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import parity from '../fixtures/contentBlocksParity.json';
import { lead, closing, benefitGrid, statTiles, checkList, steps, renderContentBlocks, validateBlockText } from './contentBlocks';

describe('blocos de conteúdo', () => {
  it('reproduz os seis blocos do Python byte a byte', () => {
    expect(lead('Olá <b>pessoa</b><br>Confira!')).toBe(parity.lead);
    expect(closing('Peça seu cartão!')).toBe(parity.closing);
    expect(benefitGrid([{title:'Prazo & uso',text:'<b>Até 40 dias</b>'},{title:'Saúde',text:'Até 70%'}], true)).toBe(parity.benefit_grid);
    expect(statTiles([{number:'5%',label:'Desconto'},{number:'40',label:'Dias'},{number:'70%',label:'Saúde'}])).toBe(parity.stat_tiles);
    expect(checkList(['<b>Benefício</b>','Confira<br>agora'])).toBe(parity.check_list);
    expect(steps([{title:'Abra & veja',text:'Entre no app'},{title:'Peça',text:'Sujeito à análise'}])).toBe(parity.steps);
  });
  it('reproduz COPY_2_PRETO do E-mail 1 da V2 com negrito', () => {
    const html = lead('E para aproveitar benefícios em diferentes momentos da rotina, conheça algumas das vantagens de ter seu <b>cartão +amigo</b>:') + benefitGrid([
      {title:'Descontos extras no mercado',text:'<b>A partir de 5%</b> em produtos selecionados, pagando com o cartão +amigo.'},
      {title:'Mais prazo para pagar',text:'<b>Até 40 dias</b>, conforme a data da compra e o vencimento da fatura.'},
      {title:'Benefícios com Visa',text:'Acesso a promoções, descontos, sorteios e <b>benefícios exclusivos</b>.'},
      {title:'Vantagens para sua saúde',text:'<b>Até 70% de desconto</b> em consultas, exames e medicamentos pelo Programa Você Bem Saúde.'},
    ], true) + closing('Peça seu cartão +amigo e descubra essas vantagens!');
    expect(createHash('md5').update(html).digest('hex')).toBe('7b59bc419a66da57675c692d1ee2570a');
  });
  it.each(['<img src=x>', '<b onclick="x">a</b>', 'a\nb', '<b>ab', '</b>', '&#60;img src=x&#62;'])('valida texto %s', value => {
    if (value.startsWith('&#')) expect(() => validateBlockText(value)).not.toThrow();
    else expect(() => validateBlockText(value)).toThrow();
  });
  it('recusa grade ímpar, quadros inválidos e campo grande', () => {
    expect(() => benefitGrid([{title:'a',text:'b'}])).toThrow();
    expect(() => statTiles([{number:'1',label:'a'}])).toThrow();
    expect(() => renderContentBlocks([{type:'lead',text:'a'.repeat(4000)}])).toThrow();
  });
});
