import React, { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from 'lucide-react';
import type { ActivityTaxonomy, EmailTemplateSlot } from '../domain/workspace';

export type RulerEmailDraft = { functionalName: string; role: string; weekKey: string };
export type CreateRulerConfig = {
  businessFront: 'acquisition' | 'monetization';
  bu: string;
  partner: string;
  adaptationPartners: string[];
  rulerName: string;
  rulerFamily: string;
  objective: string;
  segmentMode: 'existing' | 'draft';
  segment: string;
  segmentAlias: string;
  audienceDescription: string;
  templateSlotId: string;
  emails: RulerEmailDraft[];
};

const FRONT_LABEL = { acquisition: 'Aquisição', monetization: 'Rentabilização' } as const;
const LIFECYCLE_SUGGESTIONS = ['Cliente novo', 'Sem primeira compra', 'Em ativação', 'Cliente ativo', 'Baixo engajamento', 'Cliente inativo', 'Em reativação'];
const INPUT = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100';
const INITIAL_EMAILS: RulerEmailDraft[] = [
  { functionalName: 'Boas-vindas', role: 'Apresentar o relacionamento e a proposta de valor', weekKey: 'Momento 1' },
  { functionalName: 'Benefícios principais', role: 'Demonstrar utilidade para o cliente', weekKey: 'Momento 2' },
  { functionalName: 'Incentivo ao uso', role: 'Estimular o comportamento esperado', weekKey: 'Momento 3' },
];

export const CreateRulerDialog = ({ taxonomy, templates, defaultPartner, onClose, onCreate }: {
  taxonomy: ActivityTaxonomy[];
  templates: EmailTemplateSlot[];
  defaultPartner: string;
  onClose: () => void;
  onCreate: (config: CreateRulerConfig) => Promise<void> | void;
}) => {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [businessFront, setBusinessFront] = useState<CreateRulerConfig['businessFront']>('monetization');
  const scoped = useMemo(() => taxonomy.filter((item) => item.businessFront === businessFront), [businessFront, taxonomy]);
  const partners = useMemo(() => [...new Set(scoped.map((item) => item.partner).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [scoped]);
  const [partner, setPartner] = useState(defaultPartner);
  const [bu, setBu] = useState('');
  const [rulerName, setRulerName] = useState('Ciclo de Vida — Ativação');
  const [rulerFamily, setRulerFamily] = useState('Ciclo de Vida');
  const [objective, setObjective] = useState('');
  const [segmentMode, setSegmentMode] = useState<CreateRulerConfig['segmentMode']>('draft');
  const [segment, setSegment] = useState('Cliente novo');
  const [segmentAlias, setSegmentAlias] = useState('Cliente novo');
  const [audienceDescription, setAudienceDescription] = useState('');
  const [adaptationPartners, setAdaptationPartners] = useState<string[]>([]);
  const [templateSlotId, setTemplateSlotId] = useState(templates.find((item) => item.isPrincipal)?.id ?? templates[0]?.id ?? '');
  const [emails, setEmails] = useState<RulerEmailDraft[]>(INITIAL_EMAILS);
  const sourceRows = useMemo(() => scoped.filter((item) => !partner || item.partner === partner), [partner, scoped]);
  const existingSegments = useMemo(() => [...new Set(sourceRows.map((item) => item.segment).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [sourceRows]);
  const canContinue = step === 0 ? Boolean(partner.trim() && rulerName.trim() && rulerFamily.trim()) : step === 1 ? Boolean(segment.trim() && (segmentMode === 'existing' || segmentAlias.trim())) : step === 2 ? Boolean(emails.length && emails.every((item) => item.functionalName.trim() && item.weekKey.trim())) : true;
  const allPartners = [...new Set([partner, ...adaptationPartners].filter(Boolean))];
  const totalBriefings = allPartners.length * emails.length;
  const updateEmail = (index: number, patch: Partial<RulerEmailDraft>) => setEmails((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const submit = async () => {
    setSaving(true);
    try { await onCreate({ businessFront, bu: bu.trim(), partner: partner.trim(), adaptationPartners, rulerName: rulerName.trim(), rulerFamily: rulerFamily.trim(), objective: objective.trim(), segmentMode, segment: segment.trim(), segmentAlias: segmentAlias.trim(), audienceDescription: audienceDescription.trim(), templateSlotId, emails }); }
    finally { setSaving(false); }
  };
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4" role="dialog" aria-modal="true" aria-labelledby="create-ruler-title">
    <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4"><div><h2 id="create-ruler-title" className="text-lg font-bold text-slate-950">Criar régua de e-mails</h2><p className="mt-1 text-xs text-slate-500">Estruture a régua e gere os briefings como rascunho. A execução da jornada continua no SFMC.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fechar"><X size={18}/></button></header>
      <nav className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 px-6" aria-label="Etapas da criação">{['Contexto', 'Segmento', 'Estrutura', 'Revisão'].map((label, index) => <button type="button" key={label} onClick={() => index < step && setStep(index)} className={`border-b-2 px-2 py-3 text-xs font-bold ${step === index ? 'border-cyan-600 text-cyan-900' : index < step ? 'border-transparent text-emerald-700' : 'border-transparent text-slate-400'}`}>{index < step && <Check className="mr-1 inline" size={13}/>} {index + 1}. {label}</button>)}</nav>
      <div className="min-h-0 flex-1 overflow-auto p-6">
        {step === 0 && <div className="grid gap-4 md:grid-cols-2"><Field label="Frente"><select value={businessFront} onChange={(event) => { const value = event.target.value as CreateRulerConfig['businessFront']; setBusinessFront(value); setPartner(''); setSegment(''); }} className={INPUT}><option value="acquisition">Aquisição</option><option value="monetization">Rentabilização</option></select><small>{businessFront === 'acquisition' ? 'Taxonomia consultada em activities.' : 'Taxonomia consultada em rentabilizacao_activities.'}</small></Field><Field label="Parceiro"><select value={partner} onChange={(event) => setPartner(event.target.value)} className={INPUT}><option value="">Selecione</option>{partners.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="BU"><input value={bu} onChange={(event) => setBu(event.target.value)} className={INPUT} placeholder="Ex.: Plurix"/></Field><Field label="Família"><input value={rulerFamily} onChange={(event) => setRulerFamily(event.target.value)} className={INPUT} placeholder="Ex.: Ciclo de Vida"/></Field><Field label="Nome da régua"><input value={rulerName} onChange={(event) => setRulerName(event.target.value)} className={INPUT}/></Field><Field label="Objetivo de comunicação"><textarea value={objective} onChange={(event) => setObjective(event.target.value)} className={`${INPUT} min-h-20`} placeholder="O que esta régua precisa comunicar ou estimular?"/></Field></div>}
        {step === 1 && <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2"><ModeCard active={segmentMode === 'existing'} title="Selecionar existente" description={`Usa a taxonomia observada em ${businessFront === 'acquisition' ? 'activities' : 'rentabilizacao_activities'}.`} onClick={() => { setSegmentMode('existing'); setSegment(existingSegments[0] ?? ''); }}/><ModeCard active={segmentMode === 'draft'} title="Propor novo segmento" description="Cria um rascunho governado sem escrever na tabela operacional." onClick={() => setSegmentMode('draft')}/></div>{segmentMode === 'existing' ? <Field label="Segmento técnico"><select value={segment} onChange={(event) => { setSegment(event.target.value); setSegmentAlias(event.target.value); }} className={INPUT}><option value="">Selecione</option>{existingSegments.map((item) => <option key={item}>{item}</option>)}</select>{!existingSegments.length && <small>Não há segmentos de e-mail observados para este parceiro e frente.</small>}</Field> : <div className="grid gap-4 md:grid-cols-2"><Field label="Nome proposto"><input list="lifecycle-segments" value={segment} onChange={(event) => setSegment(event.target.value)} className={INPUT}/><datalist id="lifecycle-segments">{LIFECYCLE_SUGGESTIONS.map((item) => <option key={item} value={item}/>)}</datalist></Field><Field label="Alias visual"><input value={segmentAlias} onChange={(event) => setSegmentAlias(event.target.value)} className={INPUT}/></Field><Field label="Descrição do público"><textarea value={audienceDescription} onChange={(event) => setAudienceDescription(event.target.value)} className={`${INPUT} min-h-24`} placeholder="Descreva o público sem criar regras de Journey Builder."/></Field><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><b>Será criado como rascunho de taxonomia.</b><p>Não será incluído em activities nem em rentabilizacao_activities. A operação poderá vinculá-lo futuramente a uma taxonomia observada.</p></div></div>}</div>}
        {step === 2 && <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2"><Field label="Template dinâmico"><select value={templateSlotId} onChange={(event) => setTemplateSlotId(event.target.value)} className={INPUT}>{templates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Adaptações adicionais"><div className="max-h-28 overflow-auto rounded-xl border border-slate-200 p-2">{partners.filter((item) => item !== partner).map((item) => <label key={item} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50"><input type="checkbox" checked={adaptationPartners.includes(item)} onChange={() => setAdaptationPartners((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} className="accent-cyan-700"/>{item}</label>)}</div></Field></div><div><div className="mb-2 flex items-center justify-between"><div><b className="text-sm text-slate-900">E-mails da régua</b><p className="text-xs text-slate-500">Nomes funcionais são diferentes de assunto e pré-cabeçalho.</p></div><button type="button" onClick={() => setEmails((current) => [...current, { functionalName: `E-mail ${current.length + 1}`, role: '', weekKey: `Momento ${current.length + 1}` }])} className="inline-flex items-center gap-1 rounded-lg border border-cyan-200 px-3 py-2 text-xs font-bold text-cyan-800"><Plus size={14}/>Adicionar</button></div><div className="space-y-2">{emails.map((email, index) => <div key={index} className="grid items-center gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-[44px_1fr_1.5fr_140px_36px]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold">{index + 1}</span><input value={email.functionalName} onChange={(event) => updateEmail(index, { functionalName: event.target.value })} className={INPUT} aria-label={`Nome funcional do e-mail ${index + 1}`}/><input value={email.role} onChange={(event) => updateEmail(index, { role: event.target.value })} className={INPUT} placeholder="Papel na régua" aria-label={`Papel do e-mail ${index + 1}`}/><input value={email.weekKey} onChange={(event) => updateEmail(index, { weekKey: event.target.value })} className={INPUT} aria-label={`Momento do e-mail ${index + 1}`}/><button type="button" disabled={emails.length === 1} onClick={() => setEmails((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30" aria-label={`Remover e-mail ${index + 1}`}><Trash2 size={15}/></button></div>)}</div></div></div>}
        {step === 3 && <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-xl border border-slate-200 p-4"><h3 className="font-bold text-slate-950">{rulerName}</h3><p className="mt-1 text-xs text-slate-500">{FRONT_LABEL[businessFront]} · {rulerFamily} · {segmentAlias || segment}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><Summary label="Parceiro mestre" value={partner}/><Summary label="Segmento" value={`${segment}${segmentMode === 'draft' ? ' (rascunho)' : ''}`}/><Summary label="Template" value={templates.find((item) => item.id === templateSlotId)?.name ?? 'Não selecionado'}/><Summary label="Adaptações" value={adaptationPartners.length ? adaptationPartners.join(', ') : 'Nenhuma'}/></dl>{objective && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700">{objective}</p>}</section><section className="rounded-xl border border-cyan-200 bg-cyan-50 p-4"><h3 className="font-bold text-cyan-950">Registros que serão gerados</h3><div className="mt-3 grid grid-cols-2 gap-3"><Metric value={emails.length} label="estratégias de e-mail"/><Metric value={allPartners.length} label="parceiros"/><Metric value={totalBriefings} label="briefings em rascunho"/><Metric value={segmentMode === 'draft' ? 1 : 0} label="segmento proposto"/></div><p className="mt-4 text-xs leading-5 text-cyan-950">Nada será publicado no SFMC. O Revisor mostrará a régua imediatamente para completar conteúdo, assets e certificação.</p></section><section className="lg:col-span-2"><h3 className="mb-2 text-sm font-bold text-slate-900">Sequência</h3><ol className="grid gap-2 md:grid-cols-2">{emails.map((email, index) => <li key={index} className="rounded-xl border border-slate-200 p-3"><b className="text-xs text-slate-900">{index + 1}. {email.functionalName}</b><p className="mt-1 text-[11px] text-slate-500">{email.weekKey} · {email.role || 'Papel a completar'}</p></li>)}</ol></section></div>}
      </div>
      <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4"><button type="button" onClick={() => step ? setStep(step - 1) : onClose()} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"><ChevronLeft size={14}/>{step ? 'Voltar' : 'Cancelar'}</button>{step < 3 ? <button type="button" disabled={!canContinue} onClick={() => setStep(step + 1)} className="inline-flex items-center gap-1 rounded-lg bg-[#07595b] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Continuar<ChevronRight size={14}/></button> : <button type="button" disabled={saving} onClick={() => void submit()} className="rounded-lg bg-[#07595b] px-5 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Criando…' : `Criar ${totalBriefings} briefings`}</button>}</footer>
    </div>
  </div>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block text-xs font-semibold text-slate-700"><span className="mb-1 block">{label}</span>{children}</label>;
const ModeCard = ({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) => <button type="button" onClick={onClick} className={`rounded-xl border p-4 text-left ${active ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-500' : 'border-slate-200 hover:border-cyan-300'}`}><b className="text-sm text-slate-900">{title}</b><p className="mt-1 text-xs leading-5 text-slate-500">{description}</p></button>;
const Summary = ({ label, value }: { label: string; value: string }) => <div><dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-0.5 font-semibold text-slate-800">{value || '—'}</dd></div>;
const Metric = ({ value, label }: { value: number; label: string }) => <div className="rounded-lg bg-white p-3"><b className="block text-xl text-cyan-950">{value}</b><span className="text-[10px] font-bold uppercase text-cyan-700">{label}</span></div>;
