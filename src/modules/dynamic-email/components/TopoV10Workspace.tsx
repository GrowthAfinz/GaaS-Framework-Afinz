import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, CalendarDays, Download, ImageOff, Plus, RotateCcw, Save, Store, Upload } from 'lucide-react';
import {
  DEFAULT_HEADER_COLORS,
  exportHeaderVariantsCsv,
  exportPartnerAssetsCsv,
  HEADER_SUBTITLE_MAX,
  HEADER_TITLE_MAX,
  parsePoolOffersCsv,
  selectPoolOfferOfDay,
  validateHeaderVariant,
  type HeaderVariant,
  type PartnerHeaderAsset,
  type PoolOffer,
} from '../domain/topoPlurixV10';
import { importPoolOffers, savePartnerHeaderLogo, saveHeaderVariant } from '../services/topoV10Service';
import type { SignatureSetting } from '../domain/workspace';

/** Redes que comunicam só como +amigo durante a transição de marca: sem logo próprio no header. */
const NO_LOGO_SIGNATURES = new Set(['COMPRE MAIS', 'SUPERPAO']);

function downloadCsv(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const emptyVariant = (): HeaderVariant => ({
  code: 'HDR_', label: '', title: '', subtitle: '', cardImageUrl: '', ...DEFAULT_HEADER_COLORS, status: 'active', version: 1,
});

const todayIso = () => new Date().toISOString().slice(0, 10);
const brDate = (iso: string) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

interface Props {
  variants: HeaderVariant[];
  onVariantsChange: (variants: HeaderVariant[]) => void;
  assets: PartnerHeaderAsset[];
  onAssetsChange: (assets: PartnerHeaderAsset[]) => void;
  offers: PoolOffer[];
  onOffersChange: (offers: PoolOffer[]) => void;
  signatureSettings: SignatureSetting[];
  onAnnounce: (message: string) => void;
}

export const TopoV10Workspace: React.FC<Props> = ({ variants, onVariantsChange, assets, onAssetsChange, offers, onOffersChange, signatureSettings, onAnnounce }) => (
  <div className="mx-auto max-w-[1400px] space-y-5 p-5">
    <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm leading-6 text-slate-700">
      <b className="text-slate-900">Dados do template PLURIX V10.</b> Estes cadastros não entram no CSV do briefing: viram duas DEs próprias no SFMC
      (<code className="rounded bg-white px-1">TB_HEADER_VARIACOES</code> e <code className="rounded bg-white px-1">TB_REDE_ASSETS</code>), e a prévia da Fábrica usa os mesmos dados.
      O pool de ofertas é só uma cópia do export da <code className="rounded bg-white px-1">DE_POOL_OFERTAS_PLURIX</code> para a prévia mostrar o bloco 3 como ele vai sair.
    </section>
    <HeaderVariantsPanel variants={variants} onChange={onVariantsChange} onAnnounce={onAnnounce}/>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <PartnerLogosPanel assets={assets} onChange={onAssetsChange} signatureSettings={signatureSettings} onAnnounce={onAnnounce}/>
      <PoolOffersPanel offers={offers} onChange={onOffersChange} signatureSettings={signatureSettings} onAnnounce={onAnnounce}/>
    </div>
  </div>
);

// ------------------------------------------------------------------ headers

const HeaderPreview: React.FC<{ variant: HeaderVariant; logoUrl?: string }> = ({ variant, logoUrl }) => (
  <div className="flex min-h-[150px] overflow-hidden rounded-xl" style={{ backgroundColor: variant.backgroundColor }}>
    <div className="flex w-[56%] flex-col justify-center gap-2 px-5 py-5">
      <div className="text-[22px] font-bold leading-tight" style={{ color: variant.titleColor }}>{variant.title || 'Título do header'}</div>
      {variant.subtitle && <div className="text-sm leading-snug" style={{ color: variant.subtitleColor }}>{variant.subtitle}</div>}
      {logoUrl && <img src={logoUrl} alt="" className="mt-1 h-3.5 w-auto self-start"/>}
    </div>
    <div className="flex w-[44%] items-end justify-center pr-4 pt-3">
      {variant.cardImageUrl ? <img src={variant.cardImageUrl} alt="" className="max-h-[140px] w-auto"/> : <div className="mb-6 flex items-center gap-1.5 rounded-lg border border-white/40 px-3 py-2 text-xs text-white/80"><ImageOff size={14}/>sem imagem do cartão</div>}
    </div>
  </div>
);

const Counter: React.FC<{ value: string; max: number }> = ({ value, max }) => (
  <span className={`text-[10px] font-bold ${value.length > max ? 'text-red-600' : 'text-slate-400'}`}>{value.length}/{max}</span>
);

const TextInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; hint?: React.ReactNode; disabled?: boolean; type?: string }> = ({ label, value, onChange, hint, disabled, type = 'text' }) => (
  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
    <span className="flex items-center justify-between gap-2">{label}{hint}</span>
    <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:bg-slate-100 disabled:text-slate-500"/>
  </label>
);

const ColorInput: React.FC<{ label: string; value: string; onChange: (value: string) => void }> = ({ label, value, onChange }) => (
  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}
    <span className="mt-1 flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
      <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'} onChange={(event) => onChange(event.target.value.toUpperCase())} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"/>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full text-xs font-normal normal-case tracking-normal text-slate-800 outline-none"/>
    </span>
  </label>
);

const HeaderVariantsPanel: React.FC<{ variants: HeaderVariant[]; onChange: (variants: HeaderVariant[]) => void; onAnnounce: (message: string) => void }> = ({ variants, onChange, onAnnounce }) => {
  const [selectedCode, setSelectedCode] = useState<string | null>(variants[0]?.code ?? null);
  const [draft, setDraft] = useState<HeaderVariant | null>(variants[0] ?? null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!draft && !isNew && variants[0]) { setSelectedCode(variants[0].code); setDraft({ ...variants[0] }); }
  }, [draft, isNew, variants]);
  const errors = draft ? validateHeaderVariant(draft) : [];
  const duplicate = Boolean(draft && isNew && variants.some((item) => item.code === draft.code));
  const activeCount = variants.filter((item) => item.status === 'active').length;

  const select = (variant: HeaderVariant) => { setSelectedCode(variant.code); setDraft({ ...variant }); setIsNew(false); };
  const startNew = () => { const fresh = emptyVariant(); setSelectedCode(null); setDraft(fresh); setIsNew(true); };
  const set = (patch: Partial<HeaderVariant>) => setDraft((current) => current ? { ...current, ...patch } : current);

  const persist = async (variant: HeaderVariant, message: string) => {
    setSaving(true);
    try {
      const saved = await saveHeaderVariant(variant);
      onChange([...variants.filter((item) => item.code !== saved.code), saved].sort((a, b) => a.code.localeCompare(b.code)));
      setSelectedCode(saved.code); setDraft({ ...saved }); setIsNew(false);
      onAnnounce(message);
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : 'Não foi possível salvar a variação.');
    } finally { setSaving(false); }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black text-slate-900">Headers dinâmicos</h2>
          <p className="text-xs text-slate-500">No briefing, o campo HEADER recebe o código da variação (ex.: HDR_PECA_V1). Link de imagem continua funcionando como antes.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={startNew} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-cyan-300"><Plus size={14}/>Nova variação</button>
          <button type="button" disabled={!activeCount} onClick={() => downloadCsv(`TB_HEADER_VARIACOES_${todayIso()}.csv`, exportHeaderVariantsCsv(variants))} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-xs font-bold text-white hover:bg-cyan-600 disabled:opacity-50"><Download size={14}/>CSV TB_HEADER_VARIACOES</button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="space-y-1.5">
          {variants.map((variant) => (
            <button key={variant.code} type="button" onClick={() => select(variant)} className={`w-full rounded-lg border px-3 py-2 text-left transition ${selectedCode === variant.code ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 hover:border-cyan-200'}`}>
              <div className="flex items-center justify-between gap-2"><code className="text-xs font-bold text-slate-800">{variant.code}</code>{variant.status === 'archived' && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500">arquivada</span>}</div>
              <div className="truncate text-[11px] text-slate-500">{variant.title}</div>
            </button>
          ))}
          {!variants.length && <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">Nenhuma variação cadastrada ainda.</p>}
        </div>
        {draft ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label="Código" value={draft.code} disabled={!isNew} onChange={(value) => set({ code: value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}/>
                <TextInput label="Nome interno" value={draft.label} onChange={(value) => set({ label: value })}/>
              </div>
              <TextInput label="Título" value={draft.title} onChange={(value) => set({ title: value })} hint={<Counter value={draft.title} max={HEADER_TITLE_MAX}/>}/>
              <TextInput label="Subtítulo" value={draft.subtitle} onChange={(value) => set({ subtitle: value })} hint={<Counter value={draft.subtitle} max={HEADER_SUBTITLE_MAX}/>}/>
              <TextInput label="Imagem do cartão (PNG, https://)" value={draft.cardImageUrl} onChange={(value) => set({ cardImageUrl: value.trim() })}/>
              <div className="grid gap-3 sm:grid-cols-3">
                <ColorInput label="Fundo" value={draft.backgroundColor} onChange={(value) => set({ backgroundColor: value })}/>
                <ColorInput label="Título" value={draft.titleColor} onChange={(value) => set({ titleColor: value })}/>
                <ColorInput label="Subtítulo" value={draft.subtitleColor} onChange={(value) => set({ subtitleColor: value })}/>
              </div>
              {(errors.length > 0 || duplicate) && <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{duplicate && <li>Já existe uma variação com esse código.</li>}{errors.map((error) => <li key={error}>{error}</li>)}</ul>}
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={saving || errors.length > 0 || duplicate} onClick={() => void persist({ ...draft, version: isNew ? 1 : draft.version + 1 }, `Variação ${draft.code} salva.`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"><Save size={14}/>Salvar</button>
                {!isNew && (draft.status === 'active'
                  ? <button type="button" disabled={saving} onClick={() => void persist({ ...draft, status: 'archived', version: draft.version + 1 }, `Variação ${draft.code} arquivada: sai do próximo CSV.`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-red-200 hover:text-red-700"><Archive size={14}/>Arquivar</button>
                  : <button type="button" disabled={saving} onClick={() => void persist({ ...draft, status: 'active', version: draft.version + 1 }, `Variação ${draft.code} reativada.`)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:border-cyan-300"><RotateCcw size={14}/>Reativar</button>)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Como aparece no e-mail (desktop)</p>
              <HeaderPreview variant={draft}/>
              <p className="text-[11px] leading-4 text-slate-500">No celular, texto e cartão ficam um embaixo do outro. O logo da rede vem do cadastro “Logos por rede” e muda conforme quem recebe.</p>
            </div>
          </div>
        ) : <p className="text-xs text-slate-500">Escolha uma variação ou crie uma nova.</p>}
      </div>
    </section>
  );
};

// ------------------------------------------------------------------ logos

const PartnerLogosPanel: React.FC<{ assets: PartnerHeaderAsset[]; onChange: (assets: PartnerHeaderAsset[]) => void; signatureSettings: SignatureSetting[]; onAnnounce: (message: string) => void }> = ({ assets, onChange, signatureSettings, onAnnounce }) => {
  const signatures = signatureSettings.filter((setting) => setting.partner === 'Plurix');
  const [drafts, setDrafts] = useState<Record<string, string>>(() => Object.fromEntries(assets.map((asset) => [asset.signatureKey, asset.headerLogoUrl])));
  const [savingKey, setSavingKey] = useState<string | null>(null);
  useEffect(() => {
    setDrafts((current) => ({ ...Object.fromEntries(assets.map((asset) => [asset.signatureKey, asset.headerLogoUrl])), ...Object.fromEntries(Object.entries(current).filter(([, value]) => value)) }));
  }, [assets]);
  const save = async (key: string) => {
    const value = (drafts[key] ?? '').trim();
    if (value && !/^https:\/\//i.test(value)) { onAnnounce('O logo precisa de um link https://.'); return; }
    setSavingKey(key);
    try {
      await savePartnerHeaderLogo(key, value);
      onChange([...assets.filter((asset) => asset.signatureKey !== key), { signatureKey: key, headerLogoUrl: value }]);
      onAnnounce(`Logo de ${key} salvo.`);
    } catch (error) { onAnnounce(error instanceof Error ? error.message : 'Não foi possível salvar o logo.'); }
    finally { setSavingKey(null); }
  };
  const exportable = assets.filter((asset) => asset.headerLogoUrl);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-black text-slate-900"><Store size={15}/>Logos por rede</h2>
          <p className="text-xs text-slate-500">Logo pequeno (fundo transparente) exibido no header dinâmico, ao lado do título.</p>
        </div>
        <button type="button" disabled={!exportable.length} onClick={() => downloadCsv(`TB_REDE_ASSETS_${todayIso()}.csv`, exportPartnerAssetsCsv(exportable))} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-xs font-bold text-white hover:bg-cyan-600 disabled:opacity-50"><Download size={14}/>CSV TB_REDE_ASSETS</button>
      </div>
      <div className="space-y-2">
        {signatures.map((setting) => {
          const key = setting.signatureKey;
          const blocked = NO_LOGO_SIGNATURES.has(key);
          const url = drafts[key] ?? '';
          return (
            <div key={key} className="grid items-center gap-2 rounded-lg border border-slate-100 p-2 sm:grid-cols-[110px_minmax(0,1fr)_88px_auto]">
              <span className="text-xs font-bold text-slate-800">{setting.signatureLabel}</span>
              {blocked
                ? <span className="text-[11px] text-slate-500">Sem logo: a rede está em transição de marca e aparece só como +amigo.</span>
                : <input value={url} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} placeholder="https://…/logo-rede.png" className="h-8 rounded-md border border-slate-200 px-2 text-xs outline-none focus:border-cyan-400"/>}
              <span className="flex h-8 items-center justify-center rounded-md" style={{ backgroundColor: DEFAULT_HEADER_COLORS.backgroundColor }}>{url && !blocked ? <img src={url} alt="" className="h-3.5 w-auto"/> : <span className="text-[10px] text-white/60">sem logo</span>}</span>
              {!blocked && <button type="button" disabled={savingKey === key} onClick={() => void save(key)} className="h-8 rounded-md border border-slate-200 px-2.5 text-xs font-bold text-slate-700 hover:border-cyan-300 disabled:opacity-50">Salvar</button>}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ------------------------------------------------------------------ pool

const PoolOffersPanel: React.FC<{ offers: PoolOffer[]; onChange: (offers: PoolOffer[]) => void; signatureSettings: SignatureSetting[]; onAnnounce: (message: string) => void }> = ({ offers, onChange, signatureSettings, onAnnounce }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [lastErrors, setLastErrors] = useState<string[]>([]);
  const signatures = signatureSettings.filter((setting) => setting.partner === 'Plurix');
  const days = useMemo(() => {
    const set = new Set<string>();
    offers.filter((offer) => offer.active).forEach((offer) => { set.add(offer.startDate); set.add(offer.endDate); });
    return [...set].sort().reverse().slice(0, 14);
  }, [offers]);
  const today = todayIso();
  const todayOffers = signatures.map((setting) => ({ setting, offer: selectPoolOfferOfDay(offers, setting.signatureKey, today) })).filter((item) => item.offer);

  const onFile = async (file?: File) => {
    if (!file) return;
    setImporting(true); setLastErrors([]);
    try {
      const { offers: parsed, errors } = parsePoolOffersCsv(await file.text());
      setLastErrors(errors);
      if (!parsed.length) { onAnnounce('Nenhuma oferta válida no arquivo.'); return; }
      await importPoolOffers(parsed, file.name);
      const byRef = new Map(offers.map((offer) => [offer.offerRef, offer]));
      parsed.forEach((offer) => byRef.set(offer.offerRef, offer));
      onChange([...byRef.values()]);
      onAnnounce(`${parsed.length} ofertas importadas de ${file.name}.`);
    } catch (error) { onAnnounce(error instanceof Error ? error.message : 'Não foi possível importar o arquivo.'); }
    finally { setImporting(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-black text-slate-900"><CalendarDays size={15}/>Pool de ofertas (bloco 3)</h2>
          <p className="text-xs text-slate-500">{offers.length} ofertas na cópia do GaaS · {offers.filter((offer) => offer.active).length} ativas. A escolha abaixo é a mesma que o AMPscript faz no dia do envio.</p>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(event) => void onFile(event.target.files?.[0])}/>
        <button type="button" disabled={importing} onClick={() => fileRef.current?.click()} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"><Upload size={14}/>{importing ? 'Importando…' : 'Importar export da DE'}</button>
      </div>
      {lastErrors.length > 0 && <ul className="mb-3 max-h-28 space-y-0.5 overflow-auto rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900">{lastErrors.map((error) => <li key={error}>{error}</li>)}</ul>}
      <p className={`mb-3 rounded-lg px-3 py-2 text-xs ${todayOffers.length ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-600'}`}>
        {todayOffers.length ? `Hoje (${brDate(today)}) o bloco 3 aparece para: ${todayOffers.map((item) => item.setting.signatureLabel).join(', ')}.` : `Hoje (${brDate(today)}) nenhuma rede tem oferta vigente: o bloco 3 não aparece em nenhum e-mail.`}
      </p>
      <div className="overflow-auto rounded-lg border border-slate-100">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Data</th><th className="px-3 py-2">Rede</th><th className="px-3 py-2">Oferta do dia</th><th className="px-3 py-2">A partir de</th><th className="px-3 py-2">Regiões</th></tr></thead>
          <tbody>
            {days.flatMap((day) => signatures.map((setting) => ({ day, setting, offer: selectPoolOfferOfDay(offers, setting.signatureKey, day) })).filter((item) => item.offer)).map(({ day, setting, offer }) => (
              <tr key={`${day}-${setting.signatureKey}`} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">{brDate(day)}{day === today && <span className="ml-1 rounded bg-emerald-100 px-1 text-[10px] text-emerald-800">hoje</span>}</td>
                <td className="px-3 py-2 text-slate-600">{setting.signatureLabel}</td>
                <td className="px-3 py-2"><div className="flex items-center gap-2">{offer!.imageUrl && <img src={offer!.imageUrl} alt="" className="h-8 w-8 rounded object-cover"/>}<span className="text-slate-800">{offer!.productName}</span></div></td>
                <td className="whitespace-nowrap px-3 py-2 font-bold text-slate-900">R$ {offer!.priceText}</td>
                <td className="px-3 py-2 text-slate-600">{offer!.regions}</td>
              </tr>
            ))}
            {!days.length && <tr><td colSpan={5} className="px-3 py-4 text-center text-slate-500">Importe o export da DE_POOL_OFERTAS_PLURIX para ver as ofertas.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
};
