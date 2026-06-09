import React, { useState } from 'react';
import {
  ArrowLeft, Pencil, Save, Loader2, CheckCircle2, AlertCircle,
  Calendar, Hash, Tag, Package, TrendingUp, DollarSign, BarChart2, Send,
} from 'lucide-react';
import { ActivityRow, ActivityStatus } from '../../../types/activity';
import { activityService } from '../../../services/activityService';

// ── Design tokens ──────────────────────────────────────────────────────────────
const TEAL = '#00C6CC';
const TEAL_DARK = '#00A3A8';
const FONT = "Calibri, 'Trebuchet MS', sans-serif";

// ── Field metadata (single source for render + save) ─────────────────────────────
type Kind = 'text' | 'number' | 'currency' | 'percent' | 'date' | 'time' | 'integer';
interface FieldDef {
  col: string;
  label: string;
  kind: Kind;
  mono?: boolean;
  options?: string[];
}

const F_IDENT: FieldDef[] = [
  { col: 'Activity name / Taxonomia', label: 'Activity Name', kind: 'text', mono: true },
  { col: 'BU', label: 'BU', kind: 'text', options: ['B2C', 'B2B2C', 'Plurix', 'Seguros'] },
  { col: 'Canal', label: 'Canal', kind: 'text', options: ['E-mail', 'SMS', 'WhatsApp', 'Push'] },
  { col: 'Data de Disparo', label: 'Data de Disparo', kind: 'date' },
  { col: 'Data Fim', label: 'Data Fim', kind: 'date' },
  { col: 'jornada', label: 'Jornada', kind: 'text' },
  { col: 'Safra', label: 'Safra', kind: 'text' },
  { col: 'Ordem de disparo', label: 'Ordem de Disparo', kind: 'integer' },
  { col: 'Horário de Disparo', label: 'Horário', kind: 'time' },
];
const F_PRODUTO: FieldDef[] = [
  { col: 'Produto', label: 'Produto', kind: 'text' },
  { col: 'Oferta', label: 'Oferta', kind: 'text' },
  { col: 'Promocional', label: 'Promocional', kind: 'text' },
  { col: 'Oferta 2', label: 'Oferta 2', kind: 'text' },
  { col: 'Promocional 2', label: 'Promo 2', kind: 'text' },
  { col: 'SIGLA_Oferta', label: 'Sigla Oferta', kind: 'text' },
];
const F_SEGMENTACAO: FieldDef[] = [
  { col: 'Segmento', label: 'Segmento', kind: 'text' },
  { col: 'SIGLA_Segmento', label: 'Sigla Segmento', kind: 'text' },
  { col: 'Parceiro', label: 'Parceiro', kind: 'text' },
  { col: 'SIGLA_Parceiro', label: 'Sigla Parceiro', kind: 'text' },
  { col: 'Subgrupos', label: 'Subgrupos', kind: 'text' },
  { col: 'Etapa de aquisição', label: 'Etapa de Aquisição', kind: 'text' },
  { col: 'Perfil de Crédito', label: 'Perfil de Crédito', kind: 'text' },
];
const F_VOLUME: FieldDef[] = [
  { col: 'Base Total', label: 'Base Total', kind: 'number' },
  { col: 'Base Acionável', label: 'Base Acionável', kind: 'number' },
  { col: 'Abertura', label: 'Aberturas', kind: 'integer' },
  { col: 'Cliques', label: 'Cliques', kind: 'integer' },
  { col: '% Otimização de base', label: '% Otimização', kind: 'percent' },
];
const F_FINANCEIRO: FieldDef[] = [
  { col: 'Custo Unitário Oferta', label: 'C.U. Oferta', kind: 'currency' },
  { col: 'Custo Total da Oferta', label: 'Total Oferta', kind: 'currency' },
  { col: 'Custo unitário do canal', label: 'C.U. Canal', kind: 'currency' },
  { col: 'Custo total canal', label: 'Total Canal', kind: 'currency' },
  { col: 'Custo Total Campanha', label: 'Total Campanha', kind: 'currency' },
  { col: 'CAC', label: 'CAC', kind: 'currency' },
];
const F_TAXAS: FieldDef[] = [
  { col: 'Taxa de Entrega', label: 'Taxa de Entrega', kind: 'percent' },
  { col: 'Taxa de Abertura', label: 'Taxa de Abertura', kind: 'percent' },
  { col: 'Taxa de Clique', label: 'Taxa de Clique', kind: 'percent' },
  { col: 'Taxa de Proposta', label: 'Taxa de Proposta', kind: 'percent' },
  { col: 'Taxa de Aprovação', label: 'Taxa de Aprovação', kind: 'percent' },
  { col: 'Taxa de Finalização', label: 'Taxa de Finalização', kind: 'percent' },
  { col: 'Taxa de Conversão', label: 'Taxa de Conversão', kind: 'percent' },
];
const F_RESULTADOS: FieldDef[] = [
  { col: 'Propostas', label: 'Propostas', kind: 'number' },
  { col: 'Aprovados', label: 'Aprovados', kind: 'number' },
  { col: 'Cartões Gerados', label: 'Cartões Gerados', kind: 'number' },
  { col: 'Emissões Independentes', label: 'Emissões Indep.', kind: 'number' },
  { col: 'Emissões Assistidas', label: 'Emissões Assist.', kind: 'number' },
];
const ALL_FIELDS: FieldDef[] = [
  ...F_IDENT, ...F_PRODUTO, ...F_SEGMENTACAO, ...F_VOLUME, ...F_FINANCEIRO, ...F_TAXAS, ...F_RESULTADOS,
];

// ── Format / parse helpers ───────────────────────────────────────────────────────
const isEmpty = (v: unknown) => v == null || v === '' || (typeof v === 'number' && isNaN(v));

function displayValue(kind: Kind, v: unknown): string {
  if (isEmpty(v)) return '—';
  switch (kind) {
    case 'text': return String(v);
    case 'date': return String(v).slice(0, 10);
    case 'time': return String(v);
    case 'integer':
    case 'number': return Number(v).toLocaleString('pt-BR');
    case 'currency': return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    case 'percent': return `${(Number(v) * 100).toFixed(2)}%`;
    default: return String(v);
  }
}

// Valor inicial do input (string) a partir do valor cru armazenado.
function editString(kind: Kind, v: unknown): string {
  if (isEmpty(v)) return '';
  switch (kind) {
    case 'date': return String(v).slice(0, 10);
    case 'percent': return String(Number((Number(v) * 100).toFixed(6)));
    case 'time': return String(v);
    default: return String(v);
  }
}

// Converte a string do input para o valor que vai ao Supabase.
function parseForSave(kind: Kind, raw: string | undefined): string | number | null {
  const s = (raw ?? '').trim();
  if (s === '') return null;
  switch (kind) {
    case 'text':
    case 'time':
      return s;
    case 'date': {
      const d = new Date(`${s}T00:00:00`);
      return Number.isFinite(d.getTime()) ? d.toISOString() : null;
    }
    case 'integer': {
      const n = Number(s.replace(',', '.'));
      return Number.isFinite(n) ? Math.round(n) : null;
    }
    case 'number':
    case 'currency': {
      const n = Number(s.replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    }
    case 'percent': {
      const n = Number(s.replace(',', '.'));
      return Number.isFinite(n) ? n / 100 : null;
    }
    default:
      return s;
  }
}

// ── Chip ───────────────────────────────────────────────────────────────────────
interface ChipColors { bg: string; text: string; border: string }
const STATUS_CHIP: Record<string, ChipColors> = {
  Rascunho: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
  Scheduled: { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  Enviado: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  Realizado: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
};
const BU_CHIP: Record<string, ChipColors> = {
  B2C: { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  B2B2C: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  Plurix: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
};
const DEFAULT_CHIP: ChipColors = { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' };

const Chip: React.FC<{ label: string; colors?: ChipColors }> = ({ label, colors = DEFAULT_CHIP }) => (
  <span style={{
    fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '999px',
    background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
    fontFamily: FONT, whiteSpace: 'nowrap',
  }}>{label}</span>
);

// ── Input style ──────────────────────────────────────────────────────────────────
const inputStyle = (mono?: boolean): React.CSSProperties => ({
  fontSize: '11px',
  fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : FONT,
  color: '#1E293B', background: '#FFFFFF',
  border: `1px solid ${TEAL}50`, borderRadius: '6px',
  padding: '4px 8px', outline: 'none', width: '100%',
  transition: 'border-color 0.15s, box-shadow 0.15s',
});
const onFocusTeal = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = TEAL;
  e.currentTarget.style.boxShadow = `0 0 0 3px ${TEAL}20`;
};
const onBlurTeal = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
  e.currentTarget.style.borderColor = `${TEAL}50`;
  e.currentTarget.style.boxShadow = 'none';
};

// ── Field (data-driven) ──────────────────────────────────────────────────────────
interface FieldProps {
  def: FieldDef;
  editing: boolean;
  rawValue: unknown;
  draftValue: string;
  onChange: (v: string) => void;
}

const Field: React.FC<FieldProps> = ({ def, editing, rawValue, draftValue, onChange }) => {
  const display = displayValue(def.kind, rawValue);
  const hasValue = display !== '—';
  const htmlType =
    def.kind === 'date' ? 'date'
    : def.kind === 'time' ? 'text'
    : (def.kind === 'number' || def.kind === 'currency' || def.kind === 'percent' || def.kind === 'integer') ? 'number'
    : 'text';
  const step = def.kind === 'integer' ? '1' : (def.kind === 'currency' || def.kind === 'percent') ? 'any' : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#94A3B8', fontFamily: FONT,
      }}>
        {def.label}{def.kind === 'percent' && editing ? ' (%)' : ''}
      </span>
      {editing ? (
        def.options ? (
          <select
            value={draftValue}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle(def.mono), cursor: 'pointer', appearance: 'auto' }}
            onFocus={onFocusTeal}
            onBlur={onBlurTeal}
          >
            <option value="">—</option>
            {(def.options.includes(draftValue) || !draftValue ? def.options : [draftValue, ...def.options]).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        ) : (
          <input
            type={htmlType}
            step={step}
            value={draftValue}
            placeholder={def.kind === 'time' ? 'HH:MM:SS' : ''}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle(def.mono)}
            onFocus={onFocusTeal}
            onBlur={onBlurTeal}
          />
        )
      ) : (
        <span style={{
          fontSize: '12px',
          fontFamily: def.mono ? 'ui-monospace, SFMono-Regular, monospace' : FONT,
          color: hasValue ? '#1E293B' : '#CBD5E1',
          fontStyle: hasValue ? 'normal' : 'italic',
          lineHeight: 1.4, wordBreak: def.mono ? 'break-all' : 'normal',
        }}>
          {display}
        </span>
      )}
    </div>
  );
};

// ── Section ────────────────────────────────────────────────────────────────────
interface SectionProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  accentColor?: string;
  cols?: number;
  style?: React.CSSProperties;
}
const Section: React.FC<SectionProps> = ({ icon: Icon, title, children, accentColor = '#94A3B8', cols = 2, style }) => (
  <div style={{ background: '#FAFAFA', border: '1px solid #F1F5F9', borderRadius: '12px', padding: '12px 14px', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '6px', background: `${accentColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={12} style={{ color: accentColor }} />
      </div>
      <span style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#64748B', fontFamily: FONT,
      }}>{title}</span>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '10px 18px' }}>
      {children}
    </div>
  </div>
);

// ── KPI Card ───────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{ label: string; value: string; icon?: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #F1F5F9', borderRadius: '10px',
    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '3px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {Icon && <Icon size={10} style={{ color: '#94A3B8' }} />}
      <span style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#94A3B8', fontFamily: FONT,
      }}>{label}</span>
    </div>
    <span style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', fontFamily: FONT, lineHeight: 1.1 }}>{value}</span>
  </div>
);

// ── Funnel Bar ─────────────────────────────────────────────────────────────────
const FunnelBar: React.FC<{ label: string; value: number | null | undefined }> = ({ label, value }) => {
  const hasValue = value != null && !isNaN(value);
  const pct = hasValue ? Math.min(value! * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#64748B', fontFamily: FONT }}>{label}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: hasValue ? '#1E293B' : '#CBD5E1', fontFamily: FONT }}>
          {hasValue ? `${(value! * 100).toFixed(2)}%` : '—'}
        </span>
      </div>
      <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: '999px',
          background: pct > 0 ? `linear-gradient(90deg, ${TEAL}, ${TEAL_DARK})` : 'transparent',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────────────────────
export interface DisparoDetailModalProps {
  activity: ActivityRow;
  onClose: () => void;
  onSaved?: (updated: ActivityRow) => void;
}

const fmtBRL = (val: unknown) => (isEmpty(val) ? '—' : Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
const fmtInt = (val: unknown) => (isEmpty(val) ? '—' : Number(val).toLocaleString('pt-BR'));

export const DisparoDetailModal: React.FC<DisparoDetailModalProps> = ({ activity, onClose, onSaved }) => {
  const buildDraft = (): Record<string, string> => {
    const d: Record<string, string> = {};
    for (const def of ALL_FIELDS) d[def.col] = editString(def.kind, (activity as unknown as Record<string, unknown>)[def.col]);
    d['status'] = (activity.status as string) ?? '';
    return d;
  };

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(buildDraft);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const setField = (col: string, val: string) => setDraft((prev) => ({ ...prev, [col]: val }));

  const startEdit = () => { setDraft(buildDraft()); setEditMode(true); };
  const cancelEdit = () => { setDraft(buildDraft()); setEditMode(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const def of ALL_FIELDS) {
        payload[def.col] = parseForSave(def.kind, draft[def.col]);
      }
      payload['status'] = draft['status'] || null;

      const updated = await activityService.updateActivity(activity.id, payload as Partial<ActivityRow>);
      setToast({ type: 'success', msg: 'Disparo atualizado com sucesso!' });
      setTimeout(() => { setToast(null); setEditMode(false); onSaved?.(updated); }, 1500);
    } catch (err) {
      setToast({ type: 'error', msg: (err as Error).message ?? 'Erro ao salvar' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const a = activity;
  const buColors = BU_CHIP[a.BU] ?? DEFAULT_CHIP;
  const statusColors = STATUS_CHIP[(draft['status'] || a.status) as string] ?? DEFAULT_CHIP;

  const renderFields = (defs: FieldDef[]) =>
    defs.map((def) => (
      <Field
        key={def.col}
        def={def}
        editing={editMode}
        rawValue={(a as unknown as Record<string, unknown>)[def.col]}
        draftValue={draft[def.col] ?? ''}
        onChange={(v) => setField(def.col, v)}
      />
    ));

  return (
    <>
      <style>{`
        @keyframes afinz-page-in { from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: translateX(0); } }
        .afinz-modal-scroll::-webkit-scrollbar { width: 4px; }
        .afinz-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .afinz-modal-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 999px; }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
        background: '#FFFFFF', fontFamily: FONT,
        animation: 'afinz-page-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)', overflow: 'hidden',
      }}>

        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 28px',
          borderBottom: '1px solid #F1F5F9', borderLeft: `4px solid ${TEAL}`, background: '#FFFFFF', flexShrink: 0,
        }}>
          <button
            onClick={onClose} title="Voltar"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
              fontSize: '12px', fontWeight: 600, color: '#475569', background: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT, flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${TEAL}12`; e.currentTarget.style.color = TEAL_DARK; e.currentTarget.style.borderColor = `${TEAL}40`; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            <ArrowLeft size={13} /> Voltar
          </button>

          <div style={{
            width: '30px', height: '30px', borderRadius: '9px', background: `${TEAL}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Send size={13} style={{ color: TEAL }} />
          </div>

          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', flexShrink: 0 }}>
              <Chip label={a.BU ?? 'BU'} colors={buColors} />
              {a.Canal && <Chip label={a.Canal} colors={{ bg: `${TEAL}12`, text: TEAL_DARK, border: `${TEAL}35` }} />}
              {editMode ? (
                <select
                  value={draft['status'] ?? ''}
                  onChange={(e) => setField('status', e.target.value)}
                  style={{
                    fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '999px',
                    background: statusColors.bg, color: statusColors.text, border: `1px solid ${statusColors.border}`,
                    fontFamily: FONT, cursor: 'pointer', outline: 'none', appearance: 'none',
                  }}
                >
                  {(['Rascunho', 'Scheduled', 'Enviado', 'Realizado'] as ActivityStatus[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              ) : (
                a.status && <Chip label={a.status} colors={statusColors} />
              )}
            </div>
            <p style={{
              fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '12px',
              fontWeight: 600, color: '#1E293B', lineHeight: 1.4, margin: 0, wordBreak: 'break-all',
            }}>
              {a['Activity name / Taxonomia'] || a.id}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {editMode ? (
              <>
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: '5px 13px', fontSize: '12px', fontWeight: 500, color: '#64748B',
                    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
                >Cancelar</button>
                <button
                  onClick={handleSave} disabled={saving}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 14px',
                    fontSize: '12px', fontWeight: 700, color: '#FFFFFF', background: saving ? '#94A3B8' : TEAL,
                    border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = TEAL_DARK; }}
                  onMouseLeave={e => { if (!saving) e.currentTarget.style.background = TEAL; }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Salvar
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 13px',
                  fontSize: '12px', fontWeight: 500, color: '#64748B', background: '#F8FAFC',
                  border: '1px solid #E2E8F0', borderRadius: '8px', cursor: 'pointer', fontFamily: FONT,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${TEAL}12`; e.currentTarget.style.color = TEAL_DARK; e.currentTarget.style.borderColor = `${TEAL}40`; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
        </div>

        {/* ── Toast ─────────────────────────────────────────────────── */}
        {toast && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px',
            fontSize: '12px', fontWeight: 500, fontFamily: FONT,
            borderLeft: `4px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
            background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toast.type === 'success' ? '#059669' : '#DC2626', flexShrink: 0,
          }}>
            {toast.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {toast.msg}
          </div>
        )}

        {/* ── KPI Row ───────────────────────────────────────────────── */}
        <div style={{ padding: '12px 28px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', flexShrink: 0 }}>
          <KpiCard label="Cartões Gerados" value={fmtInt(a['Cartões Gerados'])} icon={BarChart2} />
          <KpiCard label="CAC" value={fmtBRL(a.CAC)} icon={DollarSign} />
          <KpiCard label="Base Total" value={fmtInt(a['Base Total'])} icon={Hash} />
          <KpiCard label="Custo Total" value={fmtBRL(a['Custo Total Campanha'])} icon={DollarSign} />
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div
          className="afinz-modal-scroll"
          style={{
            flex: 1, minHeight: 0, padding: '12px 28px 20px',
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', overflow: 'auto',
          }}
        >
          {/* Coluna 1 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Section icon={Calendar} title="Identificação & Agendamento" accentColor="#3B82F6">
              {renderFields(F_IDENT)}
            </Section>
            <Section icon={Package} title="Produto & Ofertas" accentColor="#F59E0B">
              {renderFields(F_PRODUTO)}
            </Section>
          </div>

          {/* Coluna 2 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Section icon={Tag} title="Segmentação" accentColor="#8B5CF6">
              {renderFields(F_SEGMENTACAO)}
            </Section>
            <Section icon={Hash} title="Volume & Base" accentColor="#64748B">
              {renderFields(F_VOLUME)}
            </Section>
            <Section icon={DollarSign} title="Financeiro" accentColor="#EF4444">
              {renderFields(F_FINANCEIRO)}
            </Section>
          </div>

          {/* Coluna 3 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>
            <div style={{ background: '#FAFAFA', border: '1px solid #F1F5F9', borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '6px', background: `${TEAL}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <TrendingUp size={12} style={{ color: TEAL }} />
                </div>
                <span style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#64748B', fontFamily: FONT,
                }}>Taxas de Funil</span>
              </div>
              {editMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px' }}>
                  {renderFields(F_TAXAS)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {F_TAXAS.map((def) => (
                    <FunnelBar key={def.col} label={def.label} value={a[def.col as keyof ActivityRow] as number | null | undefined} />
                  ))}
                </div>
              )}
            </div>

            <Section icon={BarChart2} title="Resultados" accentColor="#10B981" cols={2}>
              {renderFields(F_RESULTADOS)}
            </Section>
          </div>
        </div>
      </div>
    </>
  );
};
