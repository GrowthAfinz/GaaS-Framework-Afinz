import { describe, expect, it } from 'vitest';
import payload from '../fixtures/plurixV2TopoEmails5To8.json';
import { renderContentBlocks, type ContentBlock } from './contentBlocks';

describe('Plurix V2 marketing briefings 5-8', () => {
  it('covers weeks 3 and 4 without replacing the existing emails', () => {
    expect(payload.emails.map(e => e.number)).toEqual([5, 6, 7, 8]);
    expect(payload.emails.map(e => [e.week, e.day])).toEqual([[3, 1], [3, 2], [4, 1], [4, 2]]);
    expect(payload.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('uses the same governed renderer for the marketing text in the banner slot', () => {
    for (const email of payload.emails) {
      expect(renderContentBlocks(email.secondBlock as ContentBlock[])).toBe(email.patch.COPY_2_PRETO);
      expect(email.patch.BANNER_1_CORPO).toBe('');
      expect(email.patch.BANNER_2_CORPO).toBe('');
      expect(email.patch.HEADER).toBe('');
      expect(email.patch.HEADER_IMAGEM_CARTAO).toMatch(/^https:\/\//);
      expect(email.patch.HEADER_TITULO.length).toBeLessThanOrEqual(34);
      for (const value of Object.values(email.patch)) {
        expect(value).not.toMatch(/Ver com Pablo|PRI_NOME|\r|\n/);
        expect(value.length).toBeLessThanOrEqual(4000);
      }
    }
  });

  it('inherits links, legal copy and network assets instead of accepting CSV examples', () => {
    for (const email of payload.emails) {
      const keys = Object.keys(email.patch);
      expect(keys.some(k => k.startsWith('LINK_') || k.startsWith('COR_') || k.startsWith('TAMANHO_'))).toBe(false);
      expect(keys).not.toContain('UTM_CAMPANHA');
      expect(keys).not.toContain('NOTA_LEGAL');
      expect(keys).not.toContain('BANNER_3_CORPO');
      expect(keys).not.toContain('MENSAGEM_LIMITE');
    }
    expect(payload.emails[3].patch.ASSUNTO).not.toMatch(/ÚLTIMA CHANCE/);
  });

  it('keeps the four application steps out of the headline', () => {
    const email = payload.emails.find(e => e.number === 7)!;
    expect(email.patch.TITULO_COPY_2).toBe('Veja como solicitar');
    expect(email.secondBlock[0].type).toBe('steps');
    expect(email.secondBlock[0].items).toHaveLength(4);
    expect(email.patch.COPY_2_PRETO).toContain('Se aprovado, comece usando o cartão virtual disponibilizado no app.');
  });
});
