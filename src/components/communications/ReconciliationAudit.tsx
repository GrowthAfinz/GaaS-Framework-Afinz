import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ArrowDownWideNarrow,
  Clock,
  GitBranch,
  HelpCircle,
  Link2Off,
  Loader2,
  RotateCcw,
  Repeat,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import type { CatalogEntry, ReconciledRow } from '../../hooks/useReconciliation';
import { describeError, unlinkActivity } from '../../services/communicationService';
import { TemplateSuggestionModal } from './TemplateSuggestionModal';
import { TemplateIdChips } from './TemplateIdChips';
import { parseSeqParts } from '../../utils/taxonomy';

interface Props {
  rows: ReconciledRow[];
  catalog: CatalogEntry[];
  onChanged: () => void;
}

const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: n >= 100000 ? 0 : 1 })}k` : String(Math.round(n));
type AuditSort = 'risk' | 'recent' | 'moment' | 'base' | 'exec';

const HELP_CARDS = [
  {
    icon: HelpCircle,
    title: 'Para que serve',
    body: 'Conferir tudo que já foi ligado entre activity_name e template_id antes de usar a performance como verdade.',
  },
  {
    icon: Target,
    title: 'Quando usar',
    body: 'Quando marketing trouxer dúvida de peça, reuso, semana, jornada ou quando um disparo parecer ligado ao template errado.',
  },
  {
    icon: RotateCcw,
    title: 'O que fazer',
    body: 'Use Trocar para apontar outro template ou Desvincular para devolver o disparo à fila de reconciliação.',
  },
];

export const ReconciliationAudit: React.FC<Props> = ({ rows, catalog, onChanged }) => {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReconciledRow | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [sortBy, setSortBy] = useState<AuditSort>('risk');
  const [canalSel, setCanalSel] = useState('todos');
  const [segmentoSel, setSegmentoSel] = useState('todos');
  const [subgrupoSel, setSubgrupoSel] = useState('todos');
  const [semanaSel, setSemanaSel] = useState('todos');
  const [disparoSel, setDisparoSel] = useState('todos');
  const [diagnosticoSel, setDiagnosticoSel] = useState('todos');

  const stats = useMemo(() => {
    const missingTemplate = rows.filter((r) => !r.template).length;
    const outsideFilter = rows.filter((r) => r.template && !r.template.inCurrentFilter).length;
    const uniqueTemplates = new Set(rows.map((r) => r.templateId)).size;
    const totalExecutions = rows.reduce((sum, r) => sum + r.exec, 0);
    return { missingTemplate, outsideFilter, uniqueTemplates, totalExecutions };
  }, [rows]);

  const options = useMemo(() => ({
    canais: Array.from(new Set(rows.map((r) => r.canalLabel))).sort(),
    segmentos: Array.from(new Set(rows.map((r) => r.segmentoLabel).filter((v) => v !== '—'))).sort(),
    subgrupos: Array.from(new Set(rows.map((r) => r.subgrupoLabel).filter((v) => v !== '—'))).sort(),
    semanas: Array.from(new Set(rows.map((r) => parseSeqParts(r.parsed.seq ?? r.name)?.week).filter((v): v is number => v != null))).sort((a, b) => a - b),
    disparos: Array.from(new Set(rows.map((r) => parseSeqParts(r.parsed.seq ?? r.name)?.dispatch).filter((v): v is number => v != null))).sort((a, b) => a - b),
  }), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...rows]
      .filter((r) => {
        const moment = parseSeqParts(r.parsed.seq ?? r.name);
        if (canalSel !== 'todos' && r.canalLabel !== canalSel) return false;
        if (segmentoSel !== 'todos' && r.segmentoLabel !== segmentoSel) return false;
        if (subgrupoSel !== 'todos' && r.subgrupoLabel !== subgrupoSel) return false;
        if (semanaSel !== 'todos' && String(moment?.week ?? '') !== semanaSel) return false;
        if (disparoSel !== 'todos' && String(moment?.dispatch ?? '') !== disparoSel) return false;
        if (diagnosticoSel === 'sem_peca' && (r.template?.hasAsset ?? false)) return false;
        if (diagnosticoSel === 'fora' && (!r.template || r.template.inCurrentFilter)) return false;
        if (diagnosticoSel === 'ok' && (!r.template?.hasAsset || !r.template.inCurrentFilter)) return false;
        return !q || r.name.toLowerCase().includes(q) || r.templateId.toLowerCase().includes(q) || r.jornada.toLowerCase().includes(q) || r.canalLabel.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'recent') return (b.latestDate ?? '').localeCompare(a.latestDate ?? '');
        if (sortBy === 'base') return b.base - a.base;
        if (sortBy === 'exec') return b.exec - a.exec;
        if (sortBy === 'moment') {
          const am = parseSeqParts(a.parsed.seq ?? a.name), bm = parseSeqParts(b.parsed.seq ?? b.name);
          const av = am ? (am.week ?? 999) * 1000 + am.dispatch : Number.MAX_SAFE_INTEGER;
          const bv = bm ? (bm.week ?? 999) * 1000 + bm.dispatch : Number.MAX_SAFE_INTEGER;
          return av - bv;
        }
        const risk = (r: ReconciledRow) => !r.template ? 3 : !r.template.hasAsset ? 2 : !r.template.inCurrentFilter ? 1 : 0;
        return risk(b) - risk(a) || (b.latestDate ?? '').localeCompare(a.latestDate ?? '');
      });
  }, [query, rows, sortBy, canalSel, segmentoSel, subgrupoSel, semanaSel, disparoSel, diagnosticoSel]);

  const runUnlink = async (row: ReconciledRow) => {
    setBusy(row.uid);
    setError(null);
    try {
      await unlinkActivity(row.name);
      onChanged();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="flex items-center gap-2 font-bold text-slate-900">
                <CheckCircle2 size={18} className="text-emerald-500" /> Auditoria de vínculos
              </h3>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {rows.length} vínculos no recorte
              </span>
              <button
                onClick={() => setShowHelp((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                <HelpCircle size={12} /> Como usar
                <ChevronDown size={12} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <p className="mt-1 max-w-3xl text-xs text-slate-500">
              Confira se cada <span className="font-semibold text-slate-700">activity_name</span> aponta para o
              <span className="font-semibold text-slate-700"> template_id</span> certo antes de confiar na performance.
            </p>
          </div>

          <div className="flex min-w-[320px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={15} className="text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar activity, template ou jornada..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px]">
          <span className="mr-0.5 font-semibold uppercase tracking-wide text-slate-400">Ordenar</span>
          {([
            ['risk', 'Riscos primeiro', Target],
            ['recent', 'Mais recentes', Clock],
            ['moment', 'Ordem da régua', ArrowDownWideNarrow],
            ['base', 'Volume de base', ArrowDownWideNarrow],
            ['exec', 'Execuções', Repeat],
          ] as [AuditSort, string, React.ComponentType<{ size?: number }>][]) .map(([id, label, Icon]) => (
            <button key={id} onClick={() => setSortBy(id)} className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-semibold ${sortBy === id ? 'border-cyan-300 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
              <Icon size={12} />{label}
            </button>
          ))}
          <span className="ml-3 mr-0.5 font-semibold uppercase tracking-wide text-slate-400">Filtrar envio</span>
          <select value={canalSel} onChange={(e) => setCanalSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Canal: todos</option>{options.canais.map((v) => <option key={v}>{v}</option>)}</select>
          <select value={segmentoSel} onChange={(e) => setSegmentoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Segmento: todos</option>{options.segmentos.map((v) => <option key={v}>{v}</option>)}</select>
          <select value={subgrupoSel} onChange={(e) => setSubgrupoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Subgrupo: todos</option>{options.subgrupos.map((v) => <option key={v}>{v}</option>)}</select>
          <select value={semanaSel} onChange={(e) => setSemanaSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Semana: todas</option>{options.semanas.map((v) => <option key={v} value={v}>Semana {v}</option>)}</select>
          <select value={disparoSel} onChange={(e) => setDisparoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600"><option value="todos">Disparo: todos</option>{options.disparos.map((v) => <option key={v} value={v}>Disparo {v}</option>)}</select>
          <select value={diagnosticoSel} onChange={(e) => setDiagnosticoSel(e.target.value)} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 font-semibold text-slate-600">
            <option value="todos">Diagnóstico: todos</option><option value="sem_peca">Sem peça</option><option value="fora">Fora do recorte</option><option value="ok">Prontos</option>
          </select>
        </div>

        {showHelp && (
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {HELP_CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                    <span className="rounded-lg bg-cyan-50 p-1.5 text-cyan-700"><Icon size={14} /></span>
                    {item.title}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.body}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 grid gap-2 text-xs md:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Revisados</span>
            <b className="mt-1 block text-lg text-slate-900">{rows.length}</b>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Templates únicos</span>
            <b className="mt-1 block text-lg text-slate-900">{stats.uniqueTemplates}</b>
          </div>
          <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
            <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Execuções cobertas</span>
            <b className="mt-1 block text-lg text-slate-900">{stats.totalExecutions}</b>
          </div>
          <div className={`rounded-xl border px-3 py-2 ${stats.missingTemplate ? 'border-red-200 bg-red-50' : stats.outsideFilter ? 'border-cyan-200 bg-cyan-50' : 'border-emerald-100 bg-emerald-50'}`}>
            <span className={`block text-[10px] font-bold uppercase tracking-wide ${stats.missingTemplate ? 'text-red-600' : stats.outsideFilter ? 'text-cyan-700' : 'text-emerald-600'}`}>Diagnóstico</span>
            <b className={`mt-1 block text-lg ${stats.missingTemplate ? 'text-red-700' : stats.outsideFilter ? 'text-cyan-800' : 'text-emerald-700'}`}>
              {stats.missingTemplate || stats.outsideFilter}
            </b>
            <span className={`text-[11px] ${stats.missingTemplate ? 'text-red-700' : stats.outsideFilter ? 'text-cyan-800' : 'text-emerald-700'}`}>
              {stats.missingTemplate ? 'template_id não cadastrado' : stats.outsideFilter ? 'fora dos filtros atuais' : 'vínculos resolvidos'}
            </span>
          </div>
        </div>
      </section>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
          Nenhum vínculo reconciliado encontrado neste recorte. Ajuste os filtros globais ou revise a fila de reconciliação.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((row) => (
            <div key={row.uid} className="rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-cyan-200">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">reconciliado</span>
                <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{row.canalLabel}</span>
                <div className="min-w-0 flex-1">
                  <code className="block truncate font-mono text-xs font-semibold text-slate-800">{row.name}</code>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] text-slate-400"><GitBranch size={11} /> {row.jornada}</div>
                </div>
                <div className="hidden shrink-0 gap-3.5 text-[11px] tabular-nums text-slate-500 sm:flex">
                  <span><b className="text-slate-800">{fmtK(row.base)}</b> base</span>
                  <span><b className="text-slate-800">{row.exec}</b> exec</span>
                  <span className="text-slate-400">{row.latestDate?.slice(0, 10)}</span>
                </div>
                <div className="hidden w-[300px] shrink-0 md:block">
                  <TemplateIdChips id={row.templateId} showId />
                  <div className="mt-1 flex flex-wrap gap-1">
                    {!row.template && <span className="inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">template_id não cadastrado</span>}
                    {row.template && !row.template.inCurrentFilter && <span className="inline-block rounded bg-cyan-50 px-1.5 py-0.5 text-[10px] font-bold text-cyan-700">fora dos filtros atuais</span>}
                    {row.template && !row.template.hasAsset && <span className="inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">sem peça</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setEditing(row)}
                    title="Trocar o template_id vinculado a esta activity_name."
                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-white px-3 py-2 text-xs font-bold text-cyan-700 hover:bg-cyan-50"
                  >
                    <Sparkles size={13} /> Trocar
                  </button>
                  <button
                    onClick={() => runUnlink(row)}
                    disabled={busy === row.uid}
                    title="Remove o template_id deste activity_name e devolve o disparo para a fila."
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {busy === row.uid ? <Loader2 size={13} className="animate-spin" /> : <Link2Off size={13} />} Desvincular
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TemplateSuggestionModal
          row={editing}
          catalog={catalog}
          currentTemplateId={editing.templateId}
          onClose={() => setEditing(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
};
