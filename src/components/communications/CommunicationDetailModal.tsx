import React, { useEffect, useState } from 'react';
import { X, Loader2, FileImage, Pencil, Check, Settings2, Trash2, AlertCircle } from 'lucide-react';
import type { TemplatePerformance } from '../../hooks/useTemplatePerformance';
import { getSignedUrl, renameTemplate, deleteTemplateAsset, describeError } from '../../services/communicationService';
import { isEmailChannel } from '../../utils/inferChannel';
import { normalizeTemplateId, isValidTemplateId } from '../../utils/templateId';
import { ActivityLinkManager } from './ActivityLinkManager';

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;
const int = (v: number) => v.toLocaleString('pt-BR');
const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  item: TemplatePerformance;
  onClose: () => void;
  /** Chamado após mudanças (vínculo, rename) para o pai recarregar. */
  onChanged?: () => void;
}

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="text-base font-semibold text-slate-700 tabular-nums">{value}</p>
    {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
  </div>
);

export const CommunicationDetailModal: React.FC<Props> = ({ item, onClose, onChanged }) => {
  const { template } = item;
  const email = isEmailChannel(template.channel);
  const [html, setHtml] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // Rename do template_id (PK, FK ON UPDATE CASCADE)
  const [renaming, setRenaming] = useState(false);
  const [newId, setNewId] = useState(template.template_id);
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleRename = async () => {
    const next = normalizeTemplateId(newId);
    if (next === template.template_id) { setRenaming(false); return; }
    if (!isValidTemplateId(next)) { setRenameError('Formato inválido (3-80 chars A-Za-z 0-9 _ -).'); return; }
    setRenameBusy(true);
    setRenameError(null);
    try {
      await renameTemplate(template.template_id, next);
      onChanged?.();
      onClose();
    } catch (err) {
      setRenameError(describeError(err));
    } finally {
      setRenameBusy(false);
    }
  };

  const handleDeleteAsset = async () => {
    const confirmed = window.confirm('Excluir o asset deste template? O template e os vínculos continuam, mas ele volta para "sem asset".');
    if (!confirmed) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteTemplateAsset(template);
      onChanged?.();
      onClose();
    } catch (err) {
      setDeleteError(describeError(err));
    } finally {
      setDeleteBusy(false);
    }
  };

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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {renaming ? (
                <div className="flex items-center gap-1">
                  <input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    autoFocus
                    className="w-72 rounded-lg border border-cyan-400 px-2 py-1 font-mono text-sm text-slate-700 focus:outline-none"
                  />
                  <button onClick={handleRename} disabled={renameBusy}
                    className="rounded-md bg-cyan-600 p-1.5 text-white hover:bg-cyan-500 disabled:opacity-50" title="Salvar id">
                    {renameBusy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button onClick={() => { setRenaming(false); setNewId(template.template_id); setRenameError(null); }}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" title="Cancelar"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <h3 className="truncate font-mono text-lg font-bold text-slate-800">{template.template_id}</h3>
                  <button onClick={() => setRenaming(true)} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-cyan-600" title="Renomear template_id">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setEditing((v) => !v)} className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-cyan-600" title="Editar template">
                    <Settings2 size={14} />
                  </button>
                </>
              )}
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{template.channel}</span>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">{template.status}</span>
            </div>
            {renameError && <p className="mt-1 text-xs text-red-500">{renameError}</p>}
            {editing && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <button
                  onClick={handleDeleteAsset}
                  disabled={deleteBusy || !template.original_path}
                  className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  title={template.original_path ? 'Excluir asset do template' : 'Este template já está sem asset'}
                >
                  {deleteBusy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  Excluir asset
                </button>
                <span className="text-xs text-slate-400">Remove o HTML/imagem e mantém template_id, vínculos e histórico.</span>
              </div>
            )}
            {deleteError && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}
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

            <div className="mt-5 border-t border-slate-100 pt-4">
              <ActivityLinkManager template={template} onChanged={onChanged} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
