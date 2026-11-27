import { describe, expect, it } from 'vitest';
import { creditBasesDatabase, withPartnerOptions } from './creditBases';

describe('withPartnerOptions', () => {
  it('usa os parceiros da Visão Daily e guarda a opção antiga que não bate', () => {
    const db = creditBasesDatabase('db_credit_bases_x');
    db.properties = db.properties.map(p => (p.id === 'prop_partner' ? { ...p, options: [{ id: 'o1', name: 'parceiro a', color: 'red' }, { id: 'o2', name: 'Antigo', color: 'pink' }] } : p));
    const out = withPartnerOptions(db, [{ key: 'pa', name: 'Parceiro A', color: 'blue' }, { key: 'pb', name: 'Parceiro B', color: 'green', archived: true }]);
    expect(out.properties.find(p => p.id === 'prop_partner')?.options).toEqual([
      { id: 'pa', name: 'Parceiro A', color: 'blue' },
      { id: 'o2', name: 'Antigo', color: 'pink' },
    ]);
  });
  it('não mexe em base que não é de Bases de Crédito', () => {
    const db = { ...creditBasesDatabase('db_outra'), id: 'db_outra' };
    expect(withPartnerOptions(db, [{ key: 'pa', name: 'Parceiro A', color: 'blue' }])).toBe(db);
  });
});
