import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, BarChart3, FileImage } from 'lucide-react';
import { useTemplatePerformance, type TemplatePerformance } from '../../hooks/useTemplatePerformance';
import { getSignedUrl } from '../../services/communicationService';
import { isEmailChannel } from '../../utils/inferChannel';

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const int = (v: number) => v.toLocaleString('pt-BR');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-sm font-semibold text-slate-700 tabular-nums">{value}</p>
  </div>
);

const TemplatePreview: React.FC<{ item: TemplatePerformance }> = ({ item }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const path = item.template.original_path;
  const email = isEmailChannel(item.template.channel);

  useEffect(() => {
    let active = true;
    if (!path) return;
    getSignedUrl(path).then((u) => { if (active) setUrl(u); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [path]);

  if (!path || failed) {
    return (
      <div className="flex h-40 items-center justify-center bg-slate-50 text-slate-300">
        <FileImage size={28} />
      </div>
    );
  }
  if (!url) {
    return (
      <div className="flex h-40 items-center justify-center bg-slate-50 text-slate-300">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }
  return email ? (
    <iframe title={`Preview ${item.template.template_id}`} sandbox="" src={url} className="h-40 w-full bg-white" />
  ) : (
    <div className="flex h-40 items-center justify-center overflow-hidden bg-slate-50">
      <img src={url} alt={item.template.template_id} className="max-h-full max-w-full object-contain" />
    </div>
  );
};

export const TemplatePerformanceGrid: React.FC = () => {
  const { data, loading, error } = useTemplatePerformance();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 size={18} className="animate-spin" /> Calculando performance…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <AlertCircle size={16} /> {error}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <BarChart3 size={32} className="text-slate-300" />
        <p className="max-w-md text-sm text-slate-400">
          A performance por template aparece conforme os disparos cadastrados acumulam resultado.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <div key={item.template.template_id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <TemplatePreview item={item} />
          <div className="border-t border-slate-100 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-mono text-xs font-semibold text-slate-700" title={item.template.template_id}>
                {item.template.template_id}
              </p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {item.template.channel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-400">
              {item.activityNames.length} activity_name{item.activityNames.length === 1 ? '' : 's'} · {int(item.executions)} execuções
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Metric label="Base enviada" value={int(item.baseEnviada)} />
              <Metric label="CTR" value={pct(item.ctr)} />
              <Metric label="Cartões" value={int(item.cartoes)} />
              <Metric label="Conversão" value={pct(item.taxaConversao)} />
              <Metric label="Propostas" value={int(item.propostas)} />
              <Metric label="CAC" value={item.cac > 0 ? brl(item.cac) : '—'} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
