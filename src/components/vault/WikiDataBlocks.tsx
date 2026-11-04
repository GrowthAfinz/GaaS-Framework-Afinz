import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { readNoteDataBlocks, readNoteDataIndex } from '../report-data/reportDataService';
import { formatReportMetric, REPORT_METRIC_LABELS, reportProductLabel, type NoteDataBinding, type NoteDataBlock } from '../report-data/reportDataContract';

/** Mounted once by the Wiki. The index avoids a data RPC for every unrelated note. */
export function useWikiDataIndex() {
  const { user } = useAuth();
  const [index, setIndex] = useState<{ userId: string; bindings: NoteDataBinding[] } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setIndex(null); setError('');
    if (!user) return;
    const load = () => readNoteDataIndex().then(bindings => { if (active) { setIndex({ userId: user.id, bindings }); setError(''); } }).catch(e => { if (active) setError(e.message); });
    void load();
    window.addEventListener('focus', load);
    return () => { active = false; window.removeEventListener('focus', load); };
  }, [user?.id]);
  return { bindings: index?.userId === user?.id ? index?.bindings || [] : [], error };
}

export function WikiDataBlocks({ noteId, bindings }: { noteId: string; bindings: NoteDataBinding[] }) {
  const [blocks, setBlocks] = useState<NoteDataBlock[] | null>(null), [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () => readNoteDataBlocks(noteId).then(next => { if (active) { setBlocks(next); setError(''); } }).catch(e => { if (active) setError(e.message); });
    void load(); window.addEventListener('focus', load);
    return () => { active = false; window.removeEventListener('focus', load); };
  }, [noteId]);
  return <section className="my-6 space-y-5 border-t py-5" aria-label="Dados governados deste assunto">
    {error && <p role="alert" className="text-sm text-rose-700">Não foi possível consultar os dados deste assunto. {error}</p>}
    {!blocks && !error && <p role="status" className="text-sm text-slate-500">Consultando resultados…</p>}
    {(blocks || bindings.map(binding => ({ binding, data: null }))).map(({ binding, data }) => <article key={binding.id}>
      <h3 className="font-semibold">{binding.label}</h3>
      {data ? <>
        <p className="mt-2 text-xs text-slate-500">{data.snapshot.period_start} a {data.snapshot.period_end} · versão certificada{data.snapshot.certified_at ? ` em ${new Date(data.snapshot.certified_at).toLocaleDateString('pt-BR')}` : ''}</p>
        {data.metrics.length ? <div className="overflow-x-auto"><table className="mt-3 w-full text-sm"><thead><tr><th className="p-2 text-left">Produto</th><th className="p-2 text-left">Indicador</th><th className="p-2 text-left">Período</th><th className="p-2 text-right">Valor</th></tr></thead><tbody>{data.metrics.map(m => <tr key={[m.product, m.period, m.code, m.source].join('|')} className="border-t"><td className="p-2">{reportProductLabel(m.product)}</td><td className="p-2">{REPORT_METRIC_LABELS[m.code] || m.code}</td><td className="p-2">{m.period === 'window_total' ? 'Janela completa' : m.period}</td><td className="p-2 text-right tabular-nums">{formatReportMetric(m)}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm">Não há indicadores disponíveis para este recorte.</p>}
        {!!data.issues.length && <details className="mt-3 text-xs"><summary>Qualidade e limites da leitura</summary><ul className="mt-2 list-disc pl-4">{data.issues.map((issue, n) => <li key={n}>{issue.message}</li>)}</ul></details>}
        <details className="mt-3 text-xs text-slate-500"><summary>Fonte e versão</summary><p className="mt-2 break-all">Snapshot {data.snapshot.id} · {data.snapshot.hash} · contrato {data.query_contract}/{data.query_version}</p></details>
        <p className="mt-3 text-xs text-slate-500">Este bloco acompanha os dados certificados. Conclusões e decisões da nota mantêm seu histórico e revisão editorial.</p>
      </> : blocks && <p className="mt-2 text-sm text-slate-500">Sem versão certificada disponível para este acompanhamento.</p>}
    </article>)}
  </section>;
}
