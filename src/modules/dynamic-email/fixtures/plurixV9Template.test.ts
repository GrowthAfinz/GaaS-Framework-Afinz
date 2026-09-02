import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PLURIX_V8_TEMPLATE } from './plurixV8Template';
import { PLURIX_V9_TEMPLATE } from './plurixV9Template';

describe('PLURIX V9 sequence-aware hierarchy', () => {
  it('adds one explicit E-mail 2 visual branch', () => {
    expect(PLURIX_V9_TEMPLATE.match(/IF @Sequencia == "E-mail 2" THEN/g)).toHaveLength(1);
    expect(PLURIX_V9_TEMPLATE).toContain('Peça agora seu cartão +amigo');
    expect(PLURIX_V9_TEMPLATE).toContain('max-width:480px; margin:0 auto; padding:18px 20px');
    expect(PLURIX_V9_TEMPLATE).toContain('alt="Cartões +amigo"');
  });

  it('preserves V8 recovery, tracking, governed slots and footer policy', () => {
    const invariants = [
      'LookupOrderedRows("TB_BRIEFING_CAMPANHA_AQUISICAO",1',
      'TreatAsContent(@TituloCopy1)', 'TreatAsContent(@TituloCopy2)',
      'v(@Banner1Corpo)', 'v(@Banner2Corpo)', 'v(@Banner3Corpo)',
      '<custom name="opencounter" type="tracking"/>', '%%Member_Busname%%',
    ];
    invariants.forEach((invariant) => {
      expect(PLURIX_V8_TEMPLATE).toContain(invariant);
      expect(PLURIX_V9_TEMPLATE).toContain(invariant);
    });
    expect(PLURIX_V9_TEMPLATE).not.toContain('TreatAsContent(@Rodape)');
  });

  it('keeps both CTA fields available in every intended branch', () => {
    expect(PLURIX_V9_TEMPLATE.match(/RedirectTo\(TreatAsContent\(@LinkCTA1\)\)/g)).toHaveLength(2);
    expect(PLURIX_V9_TEMPLATE.match(/RedirectTo\(TreatAsContent\(@LinkCTA2\)\)/g)).toHaveLength(3);
  });

  it('keeps migration source byte-for-byte aligned with frontend source', () => {
    const migration = readFileSync(resolve(process.cwd(), 'supabase/migrations/20260902165400_create_plurix_v9_template.sql'), 'utf8');
    expect(migration).toContain(`$plurix_v9$${PLURIX_V9_TEMPLATE}$plurix_v9$`);
  });
});
