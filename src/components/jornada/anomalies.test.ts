import { describe, expect, it } from 'vitest';
import type { Activity } from '../../types/framework';
import { anomalyFlags, matchesAnomaly } from './anomalies';

const activity = (patch: { canal?: string; status?: string; raw?: Record<string, unknown>; kpis?: Record<string, unknown> } = {}): Activity => ({
  id: 'a', dataDisparo: new Date('2026-10-10T12:00:00'), canal: patch.canal ?? 'WhatsApp', bu: 'B2C', segmento: 'Abandonados', parceiro: 'Afinz', jornada: 'j',
  status: (patch.status ?? 'Realizado') as Activity['status'],
  raw: { 'Disparado?': 'Sim', 'Cartões Gerados': 12, ...(patch.raw || {}) } as unknown as Activity['raw'],
  kpis: { baseEnviada: 1000, baseEntregue: 950, aberturas: 300, taxaAbertura: 0.3, cartoes: 12, ...(patch.kpis || {}) } as unknown as Activity['kpis'],
});

describe('anomalias com dados do Supabase', () => {
  it('disparo normal não tem anomalia', () => {
    expect(Object.values(anomalyFlags(activity())).some(Boolean)).toBe(false);
  });
  it('pendente quando ainda não há resultado de cartões', () => {
    expect(anomalyFlags(activity({ raw: { 'Cartões Gerados': null } })).pending).toBe(true);
    expect(anomalyFlags(activity({ status: 'Enviado' })).pending).toBe(true);
    expect(anomalyFlags(activity({ raw: { 'Cartões Gerados': 'Aguardando retorno' } })).pending).toBe(true);
  });
  it('sem envio e sem entrega pelas bases', () => {
    expect(anomalyFlags(activity({ kpis: { baseEnviada: 0, baseEntregue: 0 } })).no_sent).toBe(true);
    const f = anomalyFlags(activity({ kpis: { baseEntregue: 0 } }));
    expect(f.no_delivered).toBe(true);
    expect(f.no_sent).toBe(false);
  });
  it('sem abertura só em canal que mede abertura', () => {
    expect(anomalyFlags(activity({ kpis: { aberturas: 0, taxaAbertura: 0 } })).no_open).toBe(true);
    expect(anomalyFlags(activity({ canal: 'SMS', kpis: { aberturas: null, taxaAbertura: null } })).no_open).toBe(false);
  });
  it('disparo não realizado não vira anomalia', () => {
    expect(Object.values(anomalyFlags(activity({ status: 'Rascunho', raw: { 'Disparado?': 'Não', 'Cartões Gerados': null } }))).some(Boolean)).toBe(false);
  });
  it('filtro vazio aceita qualquer anomalia; com filtro, só o tipo escolhido', () => {
    const a = activity({ kpis: { aberturas: 0, taxaAbertura: 0 } });
    expect(matchesAnomaly(a, [])).toBe(true);
    expect(matchesAnomaly(a, ['no_open'])).toBe(true);
    expect(matchesAnomaly(a, ['pending'])).toBe(false);
  });
});
