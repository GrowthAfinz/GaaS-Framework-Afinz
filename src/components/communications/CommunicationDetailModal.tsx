import React, { useEffect, useState } from 'react';
import { X, Loader2, FileImage, Info } from 'lucide-react';
import type { TemplatePerformance } from '../../hooks/useTemplatePerformance';
import { getSignedUrl } from '../../services/communicationService';
import { isEmailChannel } from '../../utils/inferChannel';

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const int = (v: number) => v.toLocaleString('pt-BR');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  item: TemplatePerformance;
  onClose: () => void;
}

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-base font-semibold text-slate-700 tabular-nums">{value}</p>
    {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
  </div>
);

export const CommunicationDetailModal: React.FC<Props> = ({ item, onClose }) => {
  const { template } = item;
  const email = isEmailChannel(template.channel);
  const [html, setHtml] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const subject = typeof template.metadata?.subject === 'string' ? template.metadata.subject : '';
  const preheader = typeof template.metadata?.preheader === 'string' ? template.metadata.preheader : '';
  const estimado = item.custoEstimado;

  useEffect(() => {
    let active = true;
    const path = template.original_path;
    if (!path) { setFailed(true); return; }
    getSignedUrl(path)
      .then(async (u) => {
        if (!active) return;
        if (email) {
          const text = await fetch(u).then((r) => r.text());
          if (active) setHtml(text);
        } else {
          setImgUrl(u);
        }
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [template.original_path, email]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-mono text-lg font-bold text-slate-800">{template.template_id}</h3>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{template.channel}</span>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">{template.status}</span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {template.title && template.title !== template.template_id ? `${template.title} · ` : ''}
              {item.activityNames.length} activity_name{item.activityNames.length === 1 ? '' : 's'} · {int(item.executions)} execuções
              {template.version_label ? ` · ${template.version_label}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-5">
          {/* Preview (e-mail completo / imagem) */}
          <div className="flex flex-col border-b border-slate-200 md:col-span-3 md:border-b-0 md:border-r">
            <div className="bg-slate-100 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Peça {email ? '(e-mail completo)' : ''}
            </div>
            <div className="min-h-[300px] flex-1 overflow-auto bg-slate-50">
              {failed ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-slate-300">
                  <FileImage size={32} /> <span className="text-sm">Preview indisponível</span>
                </div>
              ) : email ? (
                html === null ? (
                  <div className="flex h-full min-h-[300px] items-center justify-center text-slate-300">
                    <Loader2 size={22} className="animate-spin" />
                  </div>
                ) : (
                  <iframe title={`Preview ${template.template_id}`} sandbox="" srcDoc={html} className="h-[60vh] w-full bg-white" />
                )
              ) : imgUrl ? (
                <div className="flex items-center justify-center p-4">
                  <img src={imgUrl} alt={template.template_id} className="max-w-full" />
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] items-center justify-center text-slate-300">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Detalhes + métricas */}
          <div className="overflow-y-auto p-5 md:col-span-2">
            {email && (
              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Assunto</p>
                  <p className="text-sm text-slate-700">{subject || <span className="text-slate-300">—</span>}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Pré-cabeçalho</p>
                  <p className="text-sm text-slate-700">{preheader || <span className="text-slate-300">—</span>}</p>
                </div>
              </div>
            )}

            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Métricas somadas</p>
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Base enviada" value={int(item.baseEnviada)} />
              <Stat label="Cliques" value={int(item.cliques)} />
              <Stat label="CTR" value={pct(item.ctr)} />
              <Stat label="Conversão" value={pct(item.taxaConversao)} />
              <Stat label="Cartões" value={int(item.cartoes)} />
              <Stat label="Propostas" value={int(item.propostas)} />
              <Stat
                label={estimado ? 'Gasto estimado' : 'Gasto'}
                value={item.custoEfetivo > 0 ? `${estimado ? '~' : ''}${brl(item.custoEfetivo)}` : '—'}
                hint={estimado ? 'base × custo de canal' : 'Custo Total Campanha'}
              />
              <Stat
                label={estimado ? 'CAC estimado' : 'CAC'}
                value={item.cacEfetivo > 0 ? `${estimado ? '~' : ''}${brl(item.cacEfetivo)}` : '—'}
                hint="gasto / cartões"
              />
            </div>

            {estimado && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  Gasto e CAC <strong>estimados</strong>: os disparos vinculados não têm <em>Custo Total Campanha</em> preenchido,
                  então o valor usa só o custo unitário do canal ({item.template.channel}) e <strong>ignora o custo de oferta</strong>.
                  Quando o custo real for extraído para as activities, os valores reais passam a aparecer automaticamente.
                </span>
              </div>
            )}

            <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Activity names ({item.activityNames.length})
            </p>
            <ul className="space-y-1">
              {item.activityNames.map((name) => (
                <li key={name} className="truncate rounded bg-slate-50 px-2 py-1 font-mono text-xs text-slate-600" title={name}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
