import React, { useMemo, useState } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { TAXO, composeId, TEMPLATE_ID_RE, type DimId } from '../../utils/taxonomy';
import { createDraftTemplate, linkActivityToTemplate, describeError } from '../../services/communicationService';
import type { OrphanRow } from '../../hooks/useReconciliation';

const CANAL_LABEL: Record<string, string> = { email: 'E-mail', wpp: 'WhatsApp', push: 'Push', sms: 'SMS' };

interface Props {
  seed: OrphanRow | null;   // órfão que pré-preenche as dimensões (ou null = novo do zero)
  onClose: () => void;
  onSaved: () => void;
}

export const TemplateComposerDrawer: React.FC<Props> = ({ seed, onClose, onSaved }) => {
  const p = seed?.parsed;
  const [dims, setDims] = useState<Record<DimId, string | null>>({
    publico: p?.publico ?? null,
    canal: p?.canal ?? null,
    campanha: p?.campanha ?? null,
    segmento: p?.segmento ?? null,
    cadencia: null,
  });
  const [seq, setSeq] = useState<string | null>(p?.seq ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (dim: DimId, v: string) => setDims((d) => ({ ...d, [dim]: v }));
  const id = useMemo(() => composeId(dims, seq), [dims, seq]);
  const complete = !!(dims.publico && dims.canal && dims.campanha && dims.segmento && seq);
  const validId = TEMPLATE_ID_RE.test(id);

  const save = async () => {
    if (!complete || !validId) return;
    setSaving(true); setError(null);
    try {
      await createDraftTemplate({
        templateId: id,
        channel: CANAL_LABEL[dims.canal!] ?? 'E-mail',
        metadata: { source: 'composer', publico: dims.publico, campanha: dims.campanha, segmento: dims.segmento, seq },
      });
      if (seed) await linkActivityToTemplate(seed.name, id);
      onSaved();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  const tokens: [DimId, string][] = [['publico', 'público'], ['canal', 'canal'], ['campanha', 'campanha'], ['segmento', 'segmento']];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/45 backdrop-blur-sm" onClick={onClose}>
      <div className="flex h-full w-[560px] max-w-[94vw] animate-[cslide_.26s_ease] flex-col bg-slate-50 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-slate-400">{seed ? 'Criar template a partir do disparo' : 'Novo template'}</div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Compositor de ID</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600"><X size={16} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* ID vivo */}
          <div className="rounded-xl bg-slate-900 px-5 py-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-wide text-white/50">ID canônico</div>
            <div className="flex flex-wrap items-center gap-0.5 font-mono text-[15px]">
              {[dims.publico, dims.canal, dims.campanha, dims.segmento].map((v, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="font-bold text-white/40">_</span>}
                  <span className={`rounded-md px-2 py-1 ${v ? 'bg-cyan-500 font-bold text-white' : 'bg-white/10 italic text-white/35'}`}>
                    {v ?? ['público', 'canal', 'campanha', 'segmento'][i]}
                  </span>
                </React.Fragment>
              ))}
              <span className="font-bold text-white/40">_</span>
              <span className={`rounded-md px-2 py-1 ${seq ? 'bg-cyan-500 font-bold text-white' : 'bg-white/10 italic text-white/35'}`}>{seq ?? 'S?D??'}</span>
            </div>
            {complete && validId && <div className="mt-3 flex items-center gap-1.5 text-[11.5px] font-medium text-teal-300"><Check size={12} /> ID válido</div>}
          </div>

          {seed && (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11.5px] text-sky-700">
              Pré-preenchido a partir de <code className="font-bold">{seed.name}</code>
            </div>
          )}

          {tokens.map(([dim]) => (
            <div key={dim}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{TAXO[dim].label}</div>
              <div className="flex flex-wrap gap-1.5">
                {TAXO[dim].opts.map((o) => (
                  <button key={o.id} onClick={() => set(dim, o.id)}
                    className={`rounded-lg border-[1.5px] px-3 py-2 text-xs font-semibold transition-colors ${dims[dim] === o.id ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Cadência / disparo</div>
            <div className="flex flex-wrap gap-1.5">
              {TAXO.cadencia.opts.map((o) => (
                <button key={o.id} onClick={() => setSeq(o.id)}
                  className={`min-w-[48px] rounded-lg border-[1.5px] px-3 py-2 text-xs font-semibold transition-colors ${seq === o.id ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                  {o.id}
                </button>
              ))}
            </div>
          </div>

          {seed && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Disparo a vincular</div>
              <code className="block truncate font-mono text-xs font-semibold text-slate-700">{seed.name}</code>
            </div>
          )}

          {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{error}</div>}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-slate-200 bg-white px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button>
          <button onClick={save} disabled={!complete || !validId || saving}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-45">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {seed ? 'Criar e vincular' : 'Criar template'}
          </button>
        </div>
      </div>
    </div>
  );
};
