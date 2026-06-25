import React, { useEffect, useMemo, useState } from 'react';
import { X, Link2, Plus, UploadCloud, Loader2, AlertCircle } from 'lucide-react';
import type { CommunicationTemplate } from '../../types/communication';
import { COMMUNICATION_CHANNELS, isEmailChannel } from '../../utils/inferChannel';
import { normalizeTemplateId, isValidTemplateId } from '../../utils/templateId';
import { saveCommunication, describeError } from '../../services/communicationService';

export interface DispatchSelection {
  activityName: string;
  jornada: string;
  channel: string;
  slotId?: string | null;
  date?: string | null;
}

interface Props {
  selection: DispatchSelection;
  templates: CommunicationTemplate[];
  onClose: () => void;
  onSaved: () => void;
}

type Mode = 'new' | 'existing';

export const CommunicationUploadModal: React.FC<Props> = ({ selection, templates, onClose, onSaved }) => {
  const [mode, setMode] = useState<Mode>('existing');
  const [channel, setChannel] = useState<string>(selection.channel || 'E-mail');
  const [existingId, setExistingId] = useState<string>('');
  const [rawId, setRawId] = useState<string>('');
  const [title, setTitle] = useState<string>('');

  // email
  const [html, setHtml] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [preheader, setPreheader] = useState<string>('');

  // outros canais
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmail = isEmailChannel(channel);

  // Se não há templates, força modo "novo".
  useEffect(() => {
    if (templates.length === 0) setMode('new');
  }, [templates.length]);

  const imageUrl = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : null), [imageFile]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  const normalizedId = mode === 'new' ? normalizeTemplateId(rawId) : existingId;
  const idLooksValid = mode === 'new' ? (rawId.trim().length > 0 && isValidTemplateId(normalizedId)) : !!existingId;

  const canSave = useMemo(() => {
    if (!idLooksValid || saving) return false;
    if (mode === 'existing') return true;
    return isEmail ? html.trim().length > 0 : !!imageFile;
  }, [idLooksValid, saving, mode, isEmail, html, imageFile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveCommunication({
        mode,
        rawTemplateId: mode === 'new' ? rawId : existingId,
        channel,
        activityName: selection.activityName,
        slotId: selection.slotId ?? null,
        title: title || null,
        email: isEmail && mode === 'new' ? { html, subject, preheader } : null,
        imageFile: !isEmail && mode === 'new' ? imageFile : null,
      });
      onSaved();
    } catch (err) {
      console.error('[saveCommunication] falhou:', err);
      setError(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-800">Cadastrar peça</h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {selection.jornada} · <span className="font-mono text-xs">{selection.activityName}</span>
              {selection.date ? ` · ${selection.date}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Canal */}
          <div className="mb-5">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Canal</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
            >
              {COMMUNICATION_CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <p className="mt-1 text-xs text-slate-400">Inferido da taxonomia — ajuste se estiver errado.</p>
          </div>

          {/* template_id: existente vs novo */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">template_id</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('existing')}
                disabled={templates.length === 0}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'existing' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50',
                  templates.length === 0 ? 'cursor-not-allowed opacity-50' : '',
                ].join(' ')}
              >
                <Link2 size={15} /> Vincular existente
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  mode === 'new' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                <Plus size={15} /> Criar novo
              </button>
            </div>

            {mode === 'existing' ? (
              <select
                value={existingId}
                onChange={(e) => setExistingId(e.target.value)}
                className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Selecione um template…</option>
                {templates.map((t) => (
                  <option key={t.template_id} value={t.template_id}>
                    {t.template_id}{t.title && t.title !== t.template_id ? ` — ${t.title}` : ''} ({t.channel})
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-3 space-y-2">
                <input
                  value={rawId}
                  onChange={(e) => setRawId(e.target.value)}
                  placeholder="Cole o id da planilha (ex.: B2C_EMAIL_COPA_BSP_001)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                />
                {rawId.trim() && (
                  <p className={`text-xs ${idLooksValid ? 'text-slate-400' : 'text-red-500'}`}>
                    Será gravado como: <span className="font-mono font-semibold">{normalizedId}</span>
                    {!idLooksValid && ' — formato inválido (3-80 chars A-Z 0-9 _ -)'}
                  </p>
                )}
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título (opcional)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Conteúdo (somente ao criar novo) */}
          {mode === 'new' && (
            <div className="mb-2">
              {isEmail ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Assunto"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                    />
                    <input
                      value={preheader}
                      onChange={(e) => setPreheader(e.target.value)}
                      placeholder="Pré-cabeçalho"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-cyan-500 focus:outline-none"
                    />
                    <textarea
                      value={html}
                      onChange={(e) => setHtml(e.target.value)}
                      placeholder="Cole o HTML do e-mail aqui…"
                      rows={12}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-700 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</span>
                    <div className="h-[320px] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {html.trim() ? (
                        <iframe
                          title="Preview do e-mail"
                          sandbox=""
                          srcDoc={html}
                          className="h-full w-full bg-white"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          O preview aparece ao colar o HTML
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-cyan-400 hover:text-cyan-500">
                    <UploadCloud size={28} />
                    <span className="text-sm">Clique para enviar imagem/print</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    />
                    {imageFile && <span className="px-4 text-center text-xs text-slate-500">{imageFile.name}</span>}
                  </label>
                  <div>
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</span>
                    <div className="flex h-[200px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-sm text-slate-400">Sem imagem</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
