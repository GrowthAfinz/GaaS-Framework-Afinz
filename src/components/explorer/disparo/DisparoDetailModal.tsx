import React, { useState } from 'react';
import {
  X, Pencil, Save, Loader2, CheckCircle2, AlertCircle,
  Calendar, Hash, Tag, Package, TrendingUp, DollarSign, BarChart2,
} from 'lucide-react';
import { ActivityRow, ActivityStatus } from '../../../types/activity';
import { activityService } from '../../../services/activityService';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(val: number | null | undefined, decimals = 0): string {
  if (val == null || isNaN(val)) return '—';
  return val.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtPct(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return '—';
  return `${(val * 100).toFixed(2)}%`;
}

function fmtBRL(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return '—';
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_COLORS: Record<ActivityStatus, string> = {
  Rascunho:  'bg-slate-100 text-slate-600',
  Scheduled: 'bg-blue-100 text-blue-700',
  Enviado:   'bg-amber-100 text-amber-700',
  Realizado: 'bg-emerald-100 text-emerald-700',
};

const BU_COLORS: Record<string, string> = {
  B2C:   'bg-blue-100 text-blue-700',
  B2B2C: 'bg-emerald-100 text-emerald-700',
  Plurix:'bg-purple-100 text-purple-700',
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  editable?: boolean;
  editValue?: string;
  onEdit?: (v: string) => void;
  type?: 'text' | 'date' | 'number';
}

const Field: React.FC<FieldProps> = ({ label, value, mono, editable, editValue, onEdit, type = 'text' }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    {editable && onEdit != null ? (
      <input
        type={type}
        value={editValue ?? ''}
        onChange={(e) => onEdit(e.target.value)}
        className={[
          'text-xs text-slate-800 bg-white border border-slate-300 rounded px-2 py-1',
          'focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400',
          mono ? 'font-mono' : '',
        ].join(' ')}
      />
    ) : (
      <span className={['text-xs text-slate-800 leading-relaxed', mono ? 'font-mono' : '', !value || value === '—' ? 'text-slate-400 italic' : ''].join(' ')}>
        {value ?? '—'}
      </span>
    )}
  </div>
);

interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  color?: string;
}

const Section: React.FC<SectionProps> = ({ icon: Icon, title, children, color = 'text-slate-500' }) => (
  <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className={color} />
      <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{title}</h3>
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
      {children}
    </div>
  </div>
);

interface KpiBoxProps { label: string; value: string; sub?: string; accent?: boolean }
const KpiBox: React.FC<KpiBoxProps> = ({ label, value, sub, accent }) => (
  <div className={['rounded-lg p-3 flex flex-col gap-0.5 border', accent ? 'bg-cyan-50 border-cyan-100' : 'bg-white border-slate-100'].join(' ')}>
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
    <span className={['text-base font-bold leading-none', accent ? 'text-cyan-700' : 'text-slate-800'].join(' ')}>{value}</span>
    {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
  </div>
);

// ── Funnel bar ────────────────────────────────────────────────────────────────
interface FunnelBarProps { label: string; value: number | null | undefined }
const FunnelBar: React.FC<FunnelBarProps> = ({ label, value }) => {
  const pct = value != null && !isNaN(value) ? Math.min(value * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-medium text-slate-500">{label}</span>
        <span className="text-[10px] font-semibold text-slate-700">{fmtPct(value)}</span>
      </div>
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────

export interface DisparoDetailModalProps {
  activity: ActivityRow;
  onClose: () => void;
  onSaved?: (updated: ActivityRow) => void;
}

export const DisparoDetailModal: React.FC<DisparoDetailModalProps> = ({ activity, onClose, onSaved }) => {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Partial<ActivityRow>>({ ...activity });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const set = <K extends keyof ActivityRow>(key: K, val: ActivityRow[K]) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await activityService.updateActivity(activity.id, {
        status: draft.status,
        'Data de Disparo': draft['Data de Disparo'],
        'Data Fim': draft['Data Fim'],
        Parceiro: draft.Parceiro,
        Oferta: draft.Oferta,
        Promocional: draft.Promocional,
        'Oferta 2': draft['Oferta 2'],
        'Promocional 2': draft['Promocional 2'],
        Produto: draft.Produto,
        'Horário de Disparo': draft['Horário de Disparo'],
      });
      setToast({ type: 'success', msg: 'Disparo atualizado com sucesso!' });
      setTimeout(() => { setToast(null); setEditMode(false); onSaved?.(updated); }, 1800);
    } catch (err) {
      setToast({ type: 'error', msg: (err as Error).message ?? 'Erro ao salvar' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const a = activity;

  // ── layout ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 px-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${BU_COLORS[a.BU] ?? 'bg-slate-100 text-slate-600'}`}>
                {a.BU}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status as ActivityStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                {editMode ? (
                  <select
                    value={draft.status ?? a.status}
                    onChange={(e) => set('status', e.target.value as ActivityStatus)}
                    className="bg-transparent border-none outline-none text-[11px] font-semibold cursor-pointer"
                  >
                    {(['Rascunho', 'Scheduled', 'Enviado', 'Realizado'] as ActivityStatus[]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  a.status
                )}
              </span>
              {a.Canal && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {a.Canal}
                </span>
              )}
            </div>
            <p className="font-mono text-sm font-semibold text-slate-800 break-all leading-relaxed">
              {a['Activity name / Taxonomia'] || a.id}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {editMode ? (
              <>
                <button
                  onClick={() => { setEditMode(false); setDraft({ ...activity }); }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition disabled:opacity-60"
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Salvar
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
              >
                <Pencil size={12} />
                Editar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        {toast && (
          <div className={[
            'flex items-center gap-2 px-6 py-2 text-xs font-medium',
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
          ].join(' ')}>
            {toast.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {toast.msg}
          </div>
        )}

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* KPIs de destaque */}
          <div className="grid grid-cols-4 gap-3">
            <KpiBox label="Cartões" value={fmt(a['Cartões Gerados'])} accent />
            <KpiBox label="CAC" value={fmtBRL(a.CAC)} />
            <KpiBox label="Base Total" value={fmt(a['Base Total'])} />
            <KpiBox label="Custo Total" value={fmtBRL(a['Custo Total Campanha'])} />
          </div>

          {/* Grid de seções: 2 colunas */}
          <div className="grid grid-cols-2 gap-4">

            {/* Identificação / Agendamento */}
            <Section icon={Calendar} title="Identificação & Agendamento" color="text-blue-500">
              <Field
                label="Data de Disparo"
                value={a['Data de Disparo']?.slice(0, 10)}
                editable={editMode}
                editValue={draft['Data de Disparo']?.toString().slice(0, 10)}
                onEdit={(v) => set('Data de Disparo', v)}
                type="date"
              />
              <Field
                label="Data Fim"
                value={a['Data Fim']?.slice(0, 10)}
                editable={editMode}
                editValue={draft['Data Fim']?.toString().slice(0, 10)}
                onEdit={(v) => set('Data Fim', v)}
                type="date"
              />
              <Field label="Jornada" value={a.jornada} />
              <Field label="Safra" value={a.Safra} />
              <Field label="Ordem de Disparo" value={a['Ordem de disparo'] ?? '—'} />
              <Field
                label="Horário"
                value={a['Horário de Disparo']}
                editable={editMode}
                editValue={draft['Horário de Disparo'] ?? ''}
                onEdit={(v) => set('Horário de Disparo', v)}
              />
            </Section>

            {/* Segmentação */}
            <Section icon={Tag} title="Segmentação" color="text-purple-500">
              <Field label="Segmento" value={a.Segmento} />
              <Field
                label="Parceiro"
                value={a.Parceiro}
                editable={editMode}
                editValue={draft.Parceiro ?? ''}
                onEdit={(v) => set('Parceiro', v)}
              />
              <Field label="Subgrupos" value={a.Subgrupos} />
              <Field label="Etapa de Aquisição" value={a['Etapa de aquisição']} />
              <Field label="Perfil de Crédito" value={a['Perfil de Crédito']} />
            </Section>

            {/* Ofertas */}
            <Section icon={Package} title="Produto & Ofertas" color="text-amber-500">
              <Field
                label="Produto"
                value={a.Produto}
                editable={editMode}
                editValue={draft.Produto ?? ''}
                onEdit={(v) => set('Produto', v)}
              />
              <Field
                label="Oferta"
                value={a.Oferta}
                editable={editMode}
                editValue={draft.Oferta ?? ''}
                onEdit={(v) => set('Oferta', v)}
              />
              <Field
                label="Promocional"
                value={a.Promocional}
                editable={editMode}
                editValue={draft.Promocional ?? ''}
                onEdit={(v) => set('Promocional', v)}
              />
              <Field
                label="Oferta 2"
                value={a['Oferta 2']}
                editable={editMode}
                editValue={draft['Oferta 2'] ?? ''}
                onEdit={(v) => set('Oferta 2', v)}
              />
              <Field
                label="Promo 2"
                value={a['Promocional 2']}
                editable={editMode}
                editValue={draft['Promocional 2'] ?? ''}
                onEdit={(v) => set('Promocional 2', v)}
              />
            </Section>

            {/* Volume / Base */}
            <Section icon={Hash} title="Volume & Base" color="text-slate-500">
              <Field label="Base Total" value={fmt(a['Base Total'])} />
              <Field label="Base Acionável" value={fmt(a['Base Acionável'])} />
              <Field label="% Otimização" value={fmtPct(a['% Otimização de base'])} />
              <Field label="C.U. Oferta" value={fmtBRL(a['Custo Unitário Oferta'])} />
              <Field label="C.U. Canal" value={fmtBRL(a['Custo unitário do canal'])} />
            </Section>

          </div>

          {/* Taxas de Funil — seção full-width */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-cyan-500" />
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Taxas de Funil</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              <FunnelBar label="Taxa de Entrega"    value={a['Taxa de Entrega']} />
              <FunnelBar label="Taxa de Abertura"   value={a['Taxa de Abertura']} />
              <FunnelBar label="Taxa de Clique"     value={a['Taxa de Clique']} />
              <FunnelBar label="Taxa de Proposta"   value={a['Taxa de Proposta']} />
              <FunnelBar label="Taxa de Aprovação"  value={a['Taxa de Aprovação']} />
              <FunnelBar label="Taxa de Finalização" value={a['Taxa de Finalização']} />
              <FunnelBar label="Taxa de Conversão"  value={a['Taxa de Conversão']} />
            </div>
          </div>

          {/* Resultados & Financeiro */}
          <div className="grid grid-cols-2 gap-4">
            <Section icon={BarChart2} title="Resultados" color="text-emerald-500">
              <Field label="Propostas"    value={fmt(a.Propostas)} />
              <Field label="Aprovados"    value={fmt(a.Aprovados)} />
              <Field label="Cartões Gerados" value={fmt(a['Cartões Gerados'])} />
              <Field label="Emissões Indep." value={fmt(a['Emissões Independentes'])} />
              <Field label="Emissões Assist." value={fmt(a['Emissões Assistidas'])} />
            </Section>

            <Section icon={DollarSign} title="Financeiro" color="text-rose-500">
              <Field label="C.U. Oferta"       value={fmtBRL(a['Custo Unitário Oferta'])} />
              <Field label="Custo Total Oferta" value={fmtBRL(a['Custo Total da Oferta'])} />
              <Field label="C.U. Canal"        value={fmtBRL(a['Custo unitário do canal'])} />
              <Field label="Custo Total Canal"  value={fmtBRL(a['Custo total canal'])} />
              <Field label="Custo Total Camp." value={fmtBRL(a['Custo Total Campanha'])} />
              <Field label="CAC"               value={fmtBRL(a.CAC)} />
            </Section>
          </div>

        </div>
      </div>
    </div>
  );
};
