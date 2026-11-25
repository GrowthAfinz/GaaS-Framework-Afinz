import { expect, it } from 'vitest';
import { validateBlockText } from '../domain/contentBlocks';
import { visualCopyHtml } from './VisualCopyInput';

it('abre a copy legada do Plurix em modo visual e reconhece a variável da rede', () => {
  const copy = 'Na hora de fazer as compras, <b>cada desconto conta!</b><br>No supermercado %%=v(@NomeInvestida)=%%.';
  expect(visualCopyHtml(copy)).toContain('<b>cada desconto conta!</b><br>');
  expect(visualCopyHtml(copy)).toContain('data-copy-variable="NomeInvestida"');
  expect(() => validateBlockText(copy)).not.toThrow();
});

it('mantém expressões personalizadas fora do editor visual', () => {
  const copy = 'Olá, %%=v(@VariavelCustomizada)=%%.';
  expect(visualCopyHtml(copy)).toBeNull();
  expect(() => validateBlockText(copy)).toThrow();
});
