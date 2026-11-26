import { describe, expect, it } from 'vitest';
import { buildFeed, stems, suggestSub } from './taskActivity';

const subs = [
  { id: 's1', title: 'Receber DEVICE atual e normalizar modelos para o piloto', status: 'backlog' },
  { id: 's2', title: 'Conferir público de Celular · Mensal', status: 'backlog' },
  { id: 's3', title: 'Revisar comunicações e configurar jornada de Celular · Mensal', status: 'backlog' },
  { id: 's4', title: 'Conferir primeira execução real de Celular · Mensal', status: 'concluida' },
];

describe('sugestão de Sub Tarefa a partir do registro da Daily', () => {
  it('casa palavras com a mesma raiz e sem acento', () => {
    expect([...stems('Revisões nas comunicações')]).toEqual(['revis', 'comun']);
    expect(suggestSub('Seguro Celular | Revisões nas comunicações (2 anos da nota fiscal)', subs)?.id).toBe('s3');
    expect(suggestSub('Classificação de público / segmentação para Base do Seguros Celular', subs)?.id).toBe('s2');
  });
  it('não sugere com uma palavra só nem Sub Tarefa fechada', () => {
    expect(suggestSub('Classificação de Device', subs)).toBeNull();
    expect(suggestSub('primeira execução real conferida', subs)).toBeNull();
  });
});

describe('linha do tempo do card', () => {
  it('junta registros, comentários e histórico do mais novo para o mais antigo, sem repetir registro', () => {
    const e = (id: string, day: string, body: string, work_ids: string[] = []) => ({ id, day, body, project_id: 'p', work_ids, revision: 1, responsible_id: null });
    const feed = buildFeed({
      ids: ['t', 's3'], subs,
      entries: [e('a', '2026-11-26', 'disparo mês 1'), e('b', '2026-11-17', 'Revisões nas comunicações', ['s3']), e('a', '2026-11-26', 'disparo mês 1')],
      comments: [{ id: 'c', author_id: 'u', body: 'ok', created_at: '2026-11-20T10:00:00Z' }],
      history: [{ id: 'h', created_at: '2026-11-18T09:00:00Z', text: 'criada' }],
    });
    expect(feed.map(f => f.kind)).toEqual(['daily', 'comment', 'history', 'daily']);
    const linked = feed[3];
    expect(linked.kind === 'daily' && linked.linkedTo).toEqual(['s3']);
    expect(linked.kind === 'daily' && linked.suggestion).toBeNull();
  });
});
