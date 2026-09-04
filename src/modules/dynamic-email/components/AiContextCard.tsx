import { useMemo, useState } from 'react';
import { Download, Info, Loader2 } from 'lucide-react';
import { buildAiContextMarkdown, type AiContextMarkdownInput, type AiContextScope } from '../export/aiContextMarkdown';

const ALL = '__all__';

type Props = Omit<AiContextMarkdownInput, 'generatedAt' | 'scope' | 'includeTemplateSource'> & {
  /** Parceiro em foco na navegação, usado como escopo padrão. */
  defaultPartner?: string;
};

const formatBytes = (bytes: number) => bytes >= 1_048_576
  ? `${(bytes / 1_048_576).toFixed(1)} MB`
  : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/**
 * Baixa um pacote Markdown com o manual da Fábrica e a fotografia do escopo em
 * tela, para o analista anexar numa conversa com uma IA. Gerado no navegador,
 * de forma determinística, a partir do mesmo estado exibido — sem nova leitura
 * do Supabase e sem chamar LLM no download.
 */
export const AiContextCard = (props: Props) => {
  const { defaultPartner, ...datasets } = props;

  const partners = useMemo(() => [...new Set(datasets.briefings
    .filter((row) => row.__meta.status !== 'archived')
    .map((row) => row.__meta.partner)
    .filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [datasets.briefings]);

  const [partner, setPartner] = useState(() => (defaultPartner && partners.includes(defaultPartner)) ? defaultPartner : partners[0] ?? ALL);
  const [includeTemplateSource, setIncludeTemplateSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const scope: AiContextScope = partner === ALL ? { kind: 'all' } : { kind: 'partner', partner };

  // Estimativa exibida antes do clique: gera o documento em memória e descarta.
  const preview = useMemo(() => {
    try {
      return buildAiContextMarkdown({ ...datasets, generatedAt: new Date().toISOString(), scope, includeTemplateSource });
    } catch {
      return null;
    }
  }, [datasets, includeTemplateSource, partner]);

  const heavy = (preview?.estimatedTokens ?? 0) > 60_000;

  const download = () => {
    setBusy(true);
    setError('');
    try {
      const pack = buildAiContextMarkdown({ ...datasets, generatedAt: new Date().toISOString(), scope, includeTemplateSource });
      const url = URL.createObjectURL(new Blob([pack.content], { type: 'text/markdown;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = pack.filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => { URL.revokeObjectURL(url); anchor.remove(); }, 0);
      setStatus(`${pack.filename} · ${formatBytes(pack.bytes)} · ~${pack.estimatedTokens.toLocaleString('pt-BR')} tokens · ${pack.includedTemplateSource ? 'com' : 'sem'} código dos templates${pack.redactions ? ` · ${pack.redactions} trecho(s) sensível(is) removido(s)` : ''} · ${new Date().toLocaleString('pt-BR')}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o contexto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-cyan-200 bg-cyan-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <b className="text-xs text-cyan-950">Contexto para trabalhar com IA</b>
        <span className="group/info relative shrink-0" tabIndex={0} aria-label="O arquivo não contém dados pessoais nem credenciais.">
          <Info size={14} className="text-cyan-700"/>
          <span className="pointer-events-none absolute right-0 top-5 z-30 hidden w-56 rounded-lg border border-slate-200 bg-white p-2 text-[10px] font-medium text-slate-600 shadow-lg group-hover/info:block group-focus/info:block">
            Não contém dados pessoais nem credenciais. Reúne a documentação operacional e uma fotografia do conteúdo disponível no momento do download.
          </span>
        </span>
      </div>
      <p className="mt-1 text-[11px] text-cyan-900">
        Baixe um pacote com a estrutura da Fábrica, as regras do SFMC, o contexto das réguas e
        instruções para criar, revisar ou adaptar e-mails com uma IA.
      </p>

      <label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-cyan-800">
        Escopo
        <select
          value={partner}
          onChange={(event) => setPartner(event.target.value)}
          className="mt-1 w-full rounded-lg border border-cyan-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {partners.map((item) => <option key={item} value={item}>{item}</option>)}
          <option value={ALL}>Fábrica inteira</option>
        </select>
      </label>

      <label className="mt-2 flex items-start gap-2 text-[11px] text-cyan-900">
        <input
          type="checkbox"
          checked={includeTemplateSource}
          onChange={(event) => setIncludeTemplateSource(event.target.checked)}
          className="mt-0.5"
        />
        <span>Incluir o AMPscript dos templates (necessário só se a IA for editar o HTML)</span>
      </label>

      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#07595b] px-3 py-2 text-xs font-bold text-white outline-none transition hover:bg-[#064446] focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin"/> : <Download size={14}/>}
        Baixar contexto para IA (.md)
      </button>

      {preview && (
        <p className={`mt-1.5 text-[10px] ${heavy ? 'font-bold text-amber-700' : 'text-cyan-800'}`}>
          {formatBytes(preview.bytes)} · ~{preview.estimatedTokens.toLocaleString('pt-BR')} tokens
          {heavy ? ' — pode ser truncado por algumas IAs; prefira um parceiro por vez.' : ' — cabe na conversa de uma IA.'}
        </p>
      )}

      <p aria-live="polite" className="mt-1 text-[10px] text-cyan-900">{status}</p>
      {error && <p role="alert" className="mt-1 text-[10px] font-bold text-red-700">{error}</p>}
    </div>
  );
};
