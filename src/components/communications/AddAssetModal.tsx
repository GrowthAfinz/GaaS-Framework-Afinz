import React, { useEffect, useMemo, useState } from 'react';
import { X, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import { addAssetToTemplate, describeError } from '../../services/communicationService';
import { isEmailChannel } from '../../utils/inferChannel';
import type { CatalogTemplate } from '../../hooks/useTemplateCatalog';
import { ActivityLinkManager } from './ActivityLinkManager';

interface Props {
  template: CatalogTemplate;
  onClose: () => void;
  onSaved: () => void;
}

function htmlToSuggestionText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Adiciona o asset (HTML/imagem) a um template DRAFT ja mapeado pela governanca. */
export const AddAssetModal: React.FC<Props> = ({ template, onClose, onSaved }) => {
  const isEmail = isEmailChannel(template.channel);
  const [html, setHtml] = useState('');
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const suggestionContentText = useMemo(() => (
    isEmail ? [subject, preheader, htmlToSuggestionText(html)].filter(Boolean).join(' ') : ''
  ), [html, isEmail, preheader, subject]);

  const canSave = !saving && (isEmail ? html.trim().length > 0 : !!imageFile);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await addAssetToTemplate({
        templateId: template.template_id,
        channel: template.channel,
        email: isEmail ? { html, subject, preheader } : null,
        imageFile: !isEmail ? imageFile : null,
      });
      onSaved();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Adicionar peça</h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              <span className="font-mono text-xs">{template.template_id}</span> · {template.channel}
              {template.campanha ? ` · ${template.campanha}` : ''}{template.semana ? ` · ${template.semana}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isEmail ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none" />
                <input value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="Pré-cabeçalho"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none" />
                <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder="Cole o HTML do e-mail aqui…" rows={12}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs focus:border-cyan-500 focus:outline-none" />
              </div>
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</span>
                <div className="h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {html.trim() ? <iframe title="Preview" sandbox="" srcDoc={html} className="h-full w-full bg-white" />
                    : <div className="flex h-full items-center justify-center text-sm text-slate-400">O preview aparece ao colar o HTML</div>}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-cyan-400 hover:text-cyan-500">
                <UploadCloud size={28} /><span className="text-sm">Clique para enviar imagem/print</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
                {imageFile && <span className="px-4 text-center text-xs text-slate-500">{imageFile.name}</span>}
              </label>
              <div>
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</span>
                <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {imageUrl ? <img src={imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" /> : <span className="text-sm text-slate-400">Sem imagem</span>}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 border-t border-slate-100 pt-4">
            <ActivityLinkManager template={template} contentText={suggestionContentText} />
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
          <button onClick={handleSave} disabled={!canSave}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">
            {saving && <Loader2 size={15} className="animate-spin" />} Salvar peça
          </button>
        </div>
      </div>
    </div>
  );
};
