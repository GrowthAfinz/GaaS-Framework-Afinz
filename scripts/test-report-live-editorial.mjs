import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyRuler } from '../supabase/functions/_shared/report-live-editorial.ts';

const row = (month, value, overrides = {}) => ({
  mes: `${month}-01`,
  parceiro: 'Proprietaria',
  cartoes: value,
  cartoes_min_6m: 100,
  cartoes_max_6m: 900,
  cac: value / 10,
  cac_min_6m: 15,
  cac_max_6m: 62,
  tx_finalizacao: value / 1000,
  tx_final_min_6m: 0.125,
  tx_final_max_6m: 0.596,
  meses_observados: 6,
  cac_meses_validos_6m: 6,
  tx_final_meses_validos_6m: 6,
  mes_fechado: true,
  regime_serie: 'regime_unico',
  ...overrides,
});

const stableSeries = [
  row('2026-03', 200),
  row('2026-04', 300),
  row('2026-05', 400),
  row('2026-06', 500),
  row('2026-07', 600),
];

test('the seven ruler branches are deterministic and closed', () => {
  const cases = [
    [row('2026-08', 500, { meses_observados: 1 }), 'serie_insuficiente'],
    [row('2026-08', 500, { meses_observados: 2 }), 'amostra_insuficiente'],
    [row('2026-08', 500, { meses_observados: 6, cac_meses_validos_6m: 3 }), 'amostra_insuficiente'],
    [row('2026-08', 50), 'abaixo_da_faixa'],
    [row('2026-08', 500), 'dentro_da_faixa'],
    [row('2026-08', 950), 'acima_da_faixa'],
  ];
  for (const [current, expected] of cases) {
    assert.equal(buildMonthlyRuler(current, [...stableSeries, current], current.cac === 50 ? 'cac' : 'cartoes').verdict, expected);
  }
  const pre = row('2026-01', 300, { regime_serie: 'serasa_pre_2026_02', parceiro: 'Serasa' });
  const post = [2, 3, 4, 5, 6].map((month) => row(`2026-0${month}`, 300 + month, {
    parceiro: 'Serasa',
    regime_serie: 'serasa_pos_2026_02',
    meses_observados: month - 2,
    cac_meses_validos_6m: month - 2,
    limitacao_medicao: 'Mudanca de definicao em 2026-02.',
  }));
  const current = post.at(-1);
  current.meses_observados = 4;
  current.cac_meses_validos_6m = 4;
  const regime = buildMonthlyRuler(current, [pre, ...post], 'cac');
  assert.equal(regime.verdict, 'regime_incomparavel');
  assert.equal(regime.showBounds, false);
  assert.ok(regime.series.every((item) => item.regime_serie === 'serasa_pos_2026_02'));
});

test('thin samples never plot unsupported borders', () => {
  const current = row('2026-08', 500, { cac_meses_validos_6m: 3 });
  const ruler = buildMonthlyRuler(current, [...stableSeries, current], 'cac');
  assert.equal(ruler.showChart, true);
  assert.equal(ruler.showBounds, false);
  assert.equal(ruler.verdict, 'amostra_insuficiente');
});

test('September appears in the series but never compares while open', () => {
  const august = row('2026-08', 912);
  const september = row('2026-09', 103, { mes_fechado: false, dias_cobertos: 11 });
  const ruler = buildMonthlyRuler(september, [...stableSeries.slice(1), august, september], 'cartoes');
  assert.equal(ruler.series.at(-1).mes, '2026-09-01');
  assert.equal(ruler.currentMonthOpen, true);
  assert.equal(ruler.verdict, null);
  assert.equal(ruler.deltaText, '');
  assert.equal(ruler.verdictText, 'mês aberto · sem comparação');
});

test('rates use percentage points and volumes use relative percent', () => {
  const july = row('2026-07', 500, { tx_finalizacao: 0.5 });
  const august = row('2026-08', 600, { tx_finalizacao: 0.586 });
  const sample = [...stableSeries.slice(0, 4), july, august];
  assert.match(buildMonthlyRuler(august, sample, 'tx_finalizacao').deltaText, /8,6 p\.p\./);
  assert.match(buildMonthlyRuler(august, sample, 'cartoes').deltaText, /20,0%/);
});
