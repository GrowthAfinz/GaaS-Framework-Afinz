import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/input_gaas_emails_v2_topo_20261015.json';
import expected from '../fixtures/emailInputV2Expected.json';
import plurix from '../fixtures/plurixV2TopoEmails5To8.json';
import { parseContentBlocks, renderContentBlocks, type ContentBlock } from './contentBlocks';

describe('leitura dos blocos a partir do HTML', () => {
  it.each(['E-mail 3', 'E-mail 4'] as const)('%s volta para os mesmos blocos do arquivo', (sequence) => {
    const html = expected[sequence].COPY_2_PRETO;
    const blocks = parseContentBlocks(html);
    expect(blocks).not.toBeNull();
    expect(renderContentBlocks(blocks!)).toBe(html);
    expect(blocks).toEqual(fixture.emails.find((e) => e.sequence === sequence)!.secondBlock);
  });

  it('cobre os tipos do catálogo, inclusive texto com caracteres escapados', () => {
    const blocks: ContentBlock[] = [
      { type: 'lead', text: 'Com o <b>cartão</b>:' },
      { type: 'stat_tiles', items: [{ number: '+5%', label: 'OFF & mais' }, { number: '40 dias', label: 'para pagar' }] },
      { type: 'steps', items: [{ title: 'Peça', text: 'No app & no site' }] },
      { type: 'check_list', items: ['<b>Visa</b> no mundo'] },
      { type: 'benefits_panel', items: ['<b>5%</b> de desconto', 'Mais prazo'] },
      { type: 'benefit_grid', items: [{ title: 'A & B', text: '<b>x</b>' }, { title: 'C', text: 'y' }] },
      { type: 'closing', text: 'Peça já!' },
    ];
    expect(parseContentBlocks(renderContentBlocks(blocks))).toEqual(blocks);
  });

  it('converte os benefícios do e-mail 7 preservando os passos e o fechamento', () => {
    const email = plurix.emails.find((item) => item.number === 7)!;
    const [steps, intro, closing] = parseContentBlocks(email.patch.COPY_2_PRETO)!;
    if (intro.type !== 'lead') throw new Error('Introdução esperada');
    const [text, ...items] = intro.text.split('<br>');
    const blocks: ContentBlock[] = [steps, { type: 'lead', text }, { type: 'benefits_panel', items }, closing];
    const html = renderContentBlocks(blocks);
    expect(items).toHaveLength(4);
    expect(html.length).toBeLessThanOrEqual(4000);
    expect(parseContentBlocks(html)).toEqual(blocks);
  });

  it('HTML feito à mão ou legado volta null', () => {
    expect(parseContentBlocks('<p>Texto livre</p>')).toBeNull();
    expect(parseContentBlocks('')).toBeNull();
  });
});
