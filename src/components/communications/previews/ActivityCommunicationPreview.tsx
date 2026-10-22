import React, { useEffect, useId, useState } from 'react';
import { ChevronDown, ChevronUp, Image, Loader2, RefreshCw } from 'lucide-react';
import type { ActivityCommunicationContext } from '../../../utils/activityCommunicationContext';
import { communicationContextKey } from '../../../utils/activityCommunicationContext';
import type { PreviewResolution } from '../../../utils/communicationVisualResolution';
import { readActivityPreview } from '../../../services/activityPreviewService';
import { ChannelPreview } from '../performance/ChannelPreview';
import { useAppStore } from '../../../store/useAppStore';

const OpenCatalog: React.FC<{ context: ActivityCommunicationContext }> = ({ context }) => (
  <button type="button" className="mt-2 text-xs font-semibold text-cyan-700 underline" onClick={() => {
    const store = useAppStore.getState();
    store.setCommunicationLinkTarget({
      journey: context.journey, activity: context.activityName, channel: context.channel,
      ids: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(context.executionId) ? [context.executionId] : [],
      returnTab: store.viewSettings.abaAtual,
    });
    store.setTab('comunicacoes-cadastro');
  }}>Abrir cadastro e templates</button>
);

/** Expanding is the only action that loads content. A new execution resets state. */
export const ActivityCommunicationPreview: React.FC<{ context: ActivityCommunicationContext }> = ({ context }) => (
  <PreviewSection key={communicationContextKey(context)} context={context} />
);

const PreviewSection: React.FC<{ context: ActivityCommunicationContext }> = ({ context }) => {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white text-left">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-700">
        <span className="flex min-w-0 items-center gap-2"><Image size={15} className="shrink-0" aria-hidden="true" />Comunicação vinculada</span>
        <span className="flex shrink-0 items-center gap-1 text-cyan-700">{open ? 'Recolher' : 'Ver comunicação'}{open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
      </button>
      <div className="px-3 pb-3 text-xs text-slate-500">
        {context.templateId ? <p className="break-all font-mono">{context.templateId}</p> : <p>Sem template vinculado a este disparo.</p>}
      </div>
      {open && <div id={id} className="border-t border-slate-100 p-3">
        <p className="break-all font-mono text-xs text-slate-700">{context.activityName}</p>
        <p className="mt-1 break-words text-xs text-slate-500">{[context.date, context.channel, context.journey].filter(Boolean).join(' · ')}</p>
        {context.templateId && context.channel
          ? <SelectedPreview context={context} />
          : <div className="mt-3 text-xs text-slate-600"><p>{context.templateId ? 'Canal não informado; a prévia não pode ser resolvida.' : 'Revise o vínculo em Comunicações → Cadastro e templates.'}</p><OpenCatalog context={context} /></div>}
      </div>}
    </section>
  );
};

const SelectedPreview: React.FC<{ context: ActivityCommunicationContext }> = ({ context }) => {
  const [resolution, setResolution] = useState<PreviewResolution | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setResolution(null);
    setError(false);
    readActivityPreview(context.templateId!, context.channel).then(result => {
      if (active) setResolution(result);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [context.templateId, context.channel, revision]);
  useEffect(() => {
    const changed = () => setRevision(v => v + 1);
    window.addEventListener('sfmc-package-changed', changed);
    return () => window.removeEventListener('sfmc-package-changed', changed);
  }, []);
  const retry = <button type="button" onClick={() => setRevision(v => v + 1)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 underline"><RefreshCw size={12} />{error ? 'Tentar novamente' : 'Atualizar prévia'}</button>;
  if (error) return <div role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">Não foi possível carregar a comunicação.{retry}</div>;
  if (!resolution) return <p role="status" className="mt-3 flex items-center gap-2 text-xs text-slate-500"><Loader2 size={14} className="animate-spin" />Carregando comunicação…</p>;
  return <div className="mt-3 space-y-2">
    <p className="text-xs font-semibold text-slate-700">Arte atual cadastrada</p>
    <p className="text-xs leading-relaxed text-slate-500">A prévia atual não comprova a versão enviada na data deste disparo.</p>
    <div className="max-w-full overflow-x-auto">
      <ChannelPreview key={revision} res={resolution} width={260} height={340} title={[context.activityName, context.date].filter(Boolean).join(' · ')} />
    </div>
    {resolution.kind === 'none' && <div className="text-xs text-slate-600"><p>Revise o conteúdo em Comunicações → Cadastro e templates.</p><OpenCatalog context={context} /></div>}
    {retry}
  </div>;
};
