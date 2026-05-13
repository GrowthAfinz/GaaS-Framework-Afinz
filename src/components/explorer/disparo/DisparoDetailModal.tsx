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

// ── Helpers ────────────────────────────────────────────────────────────────────
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

// ── Chip ───────────────────────────────────────────────────────────────────────
interface ChipColors { bg: string; text: string; border: string }

const STATUS_CHIP: Record<string, ChipColors> = {
  Rascunho:  { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' },
  Scheduled: { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  Enviado:   { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  Realizado: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
};
const BU_CHIP: Record<string, ChipColors> = {
  B2C:    { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE' },
  B2B2C:  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
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

// ── Field ──────────────────────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  editable?: boolean;
  editValue?: string;
  onEdit?: (v: string) => void;
  type?: 'text' | 'date' | 'number';
}

const Field: React.FC<FieldProps> = ({ label, value, mono, editable, editValue, onEdit, type = 'text' }) => {
  const hasValue = value != null && value !== '' && value !== '—';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#94A3B8', fontFamily: FONT,
      }}>{label}</span>
      {editable && onEdit != null ? (
        <input
          type={type}
          value={editValue ?? ''}
          onChange={(e) => onEdit(e.target.value)}
          style={{
            fontSize: '11px',
            fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : FONT,
            color: '#1E293B', background: '#FFFFFF',
            border: `1px solid ${TEAL}50`, borderRadius: '6px',
            padding: '4px 8px', outline: 'none', width: '100%',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = TEAL; e.currentTarget.style.boxShadow = `0 0 0 3px ${TEAL}20`; }}
          onBlur={e => { e.currentTarget.style.borderColor = `${TEAL}50`; e.currentTarget.style.boxShadow = 'none'; }}
        />
      ) : (
        <span style={{
          fontSize: '12px',
          fontFamily: mono ? 'ui-monospace, SFMono-Regular, monospace' : FONT,
          color: hasValue ? '#1E293B' : '#CBD5E1',
          fontStyle: hasValue ? 'normal' : 'italic',
          lineHeight: 1.4,
        }}>
          {value ?? '—'}
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
  <div style={{
    background: '#FAFAFA', border: '1px solid #F1F5F9',
    borderRadius: '12px', padding: '12px 14px', ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
      <div style={{
        width: '22px', height: '22px', borderRadius: '6px',
        background: `${accentColor}18`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
interface KpiCardProps { label: string; value: string; icon?: React.ElementType }

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon: Icon }) => (
  <div style={{
    background: '#FFFFFF', border: '1px solid #F1F5F9',
    borderRadius: '10px', padding: '12px 14px',
    display: 'flex', flexDirection: 'column', gap: '3px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {Icon && <Icon size={10} style={{ color: '#94A3B8' }} />}
      <span style={{
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#94A3B8', fontFamily: FONT,
      }}>{label}</span>
    </div>
    <span style={{
      fontSize: '20px', fontWeight: 700, color: '#1E293B',
      fontFamily: FONT, lineHeight: 1.1,
    }}>{value}</span>
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

export const DisparoDetailModal: React.FC<DisparoDetailModalProps> = ({ activity, onClose, onSaved }) => {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Partial<ActivityRow>>({ ...activity });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const set = <K extends keyof ActivityRow>(key: K, val: ActivityRow[K]) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

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
  const buColors = BU_CHIP[a.BU] ?? DEFAULT_CHIP;
  const statusColors = STATUS_CHIP[a.status as string] ?? DEFAULT_CHIP;

  return (
    <>
      <style>{`
        @keyframes afinz-page-in {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .afinz-modal-scroll::-webkit-scrollbar { width: 4px; }
        .afinz-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .afinz-modal-scroll::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 999px; }
      `}</style>

      {/* Full-page overlay — preenche toda a tela, desliza da direita */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          background: '#FFFFFF', fontFamily: FONT,
          animation: 'afinz-page-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          overflow: 'hidden',
        }}
      >

          {/* ── Header ────────────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '12px 28px', borderBottom: '1px solid #F1F5F9',
            borderLeft: `4px solid ${TEAL}`,
            background: '#FFFFFF', flexShrink: 0,
          }}>
            {/* Botão Voltar */}
            <button
              onClick={onClose}
              title="Voltar"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', fontSize: '12px', fontWeight: 600,
                color: '#475569', background: '#F8FAFC',
                border: '1px solid #E2E8F0', borderRadius: '8px',
                cursor: 'pointer', fontFamily: FONT, flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${TEAL}12`; e.currentTarget.style.color = TEAL_DARK; e.currentTarget.style.borderColor = `${TEAL}40`; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <ArrowLeft size={13} /> Voltar
            </button>

            <div style={{
              width: '30px', height: '30px', borderRadius: '9px',
              background: `${TEAL}15`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Send size={13} style={{ color: TEAL }} />
            </div>

            {/* Title */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', flexShrink: 0 }}>
                <Chip label={a.BU ?? 'BU'} colors={buColors} />
                {a.Canal && <Chip label={a.Canal} colors={{ bg: `${TEAL}12`, text: TEAL_DARK, border: `${TEAL}35` }} />}
                {editMode ? (
                  <select
                    value={draft.status ?? a.status ?? ''}
                    onChange={(e) => set('status', e.target.value as ActivityStatus)}
                    style={{
                      fontSize: '10px', fontWeight: 600, padding: '2px 9px',
                      borderRadius: '999px', background: statusColors.bg,
                      color: statusColors.text, border: `1px solid ${statusColors.border}`,
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
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: '12px', fontWeight: 600, color: '#1E293B',
                lineHeight: 1.4, margin: 0, wordBreak: 'break-all',
              }}>
                {a['Activity name / Taxonomia'] || a.id}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {editMode ? (
                <>
                  <button
                    onClick={() => { setEditMode(false); setDraft({ ...activity }); }}
                    style={{
                      padding: '5px 13px', fontSize: '12px', fontWeight: 500, color: '#64748B',
                      background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
                      cursor: 'pointer', fontFamily: FONT,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F1F5F9')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#F8FAFC')}
                  >Cancelar</button>
                  <button
                    onClick={handleSave} disabled={saving}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 14px', fontSize: '12px', fontWeight: 700,
                      color: '#FFFFFF', background: saving ? '#94A3B8' : TEAL,
                      border: 'none', borderRadius: '8px',
                      cursor: saving ? 'not-allowed' : 'pointer', fontFamily: FONT,
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
                  onClick={() => setEditMode(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 13px', fontSize: '12px', fontWeight: 500, color: '#64748B',
                    background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px',
                    cursor: 'pointer', fontFamily: FONT,
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
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 24px', fontSize: '12px', fontWeight: 500, fontFamily: FONT,
              borderLeft: `4px solid ${toast.type === 'success' ? '#10B981' : '#EF4444'}`,
              background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: toast.type === 'success' ? '#059669' : '#DC2626', flexShrink: 0,
            }}>
              {toast.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {toast.msg}
            </div>
          )}

          {/* ── KPI Row ───────────────────────────────────────────────── */}
          <div style={{
            padding: '12px 28px 0',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px', flexShrink: 0,
          }}>
            <KpiCard label="Cartões Gerados" value={fmt(a['Cartões Gerados'])} icon={BarChart2} />
            <KpiCard label="CAC"             value={fmtBRL(a.CAC)}             icon={DollarSign} />
            <KpiCard label="Base Total"      value={fmt(a['Base Total'])}      icon={Hash} />
            <KpiCard label="Custo Total"     value={fmtBRL(a['Custo Total Campanha'])} icon={DollarSign} />
          </div>

          {/* ── Body — 3 colunas preenchendo toda a página ──────────── */}
          <div
            className="afinz-modal-scroll"
            style={{
              flex: 1, minHeight: 0,
              padding: '12px 28px 20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              overflow: 'auto',
            }}
          >

            {/* ── Coluna 1: Identificação + Produto & Ofertas ─────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Section icon={Calendar} title="Identificação & Agendamento" accentColor="#3B82F6">
                <Field
                  label="Data de Disparo" value={a['Data de Disparo']?.slice(0, 10)}
                  editable={editMode} editValue={draft['Data de Disparo']?.toString().slice(0, 10)}
                  onEdit={(v) => set('Data de Disparo', v)} type="date"
                />
                <Field
                  label="Data Fim" value={a['Data Fim']?.slice(0, 10)}
                  editable={editMode} editValue={draft['Data Fim']?.toString().slice(0, 10)}
                  onEdit={(v) => set('Data Fim', v)} type="date"
                />
                <Field label="Jornada" value={a.jornada} />
                <Field label="Safra" value={a.Safra} />
                <Field label="Ordem de Disparo" value={a['Ordem de disparo'] ?? '—'} />
                <Field
                  label="Horário" value={a['Horário de Disparo']}
                  editable={editMode} editValue={draft['Horário de Disparo'] ?? ''}
                  onEdit={(v) => set('Horário de Disparo', v)}
                />
              </Section>

              <Section icon={Package} title="Produto & Ofertas" accentColor="#F59E0B">
                <Field
                  label="Produto" value={a.Produto}
                  editable={editMode} editValue={draft.Produto ?? ''}
                  onEdit={(v) => set('Produto', v)}
                />
                <Field
                  label="Oferta" value={a.Oferta}
                  editable={editMode} editValue={draft.Oferta ?? ''}
                  onEdit={(v) => set('Oferta', v)}
                />
                <Field
                  label="Promocional" value={a.Promocional}
                  editable={editMode} editValue={draft.Promocional ?? ''}
                  onEdit={(v) => set('Promocional', v)}
                />
                <Field
                  label="Oferta 2" value={a['Oferta 2']}
                  editable={editMode} editValue={draft['Oferta 2'] ?? ''}
                  onEdit={(v) => set('Oferta 2', v)}
                />
                <Field
                  label="Promo 2" value={a['Promocional 2']}
                  editable={editMode} editValue={draft['Promocional 2'] ?? ''}
                  onEdit={(v) => set('Promocional 2', v)}
                />
              </Section>
            </div>

            {/* ── Coluna 2: Segmentação + Volume & Base ─────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Section icon={Tag} title="Segmentação" accentColor="#8B5CF6">
                <Field label="Segmento" value={a.Segmento} />
                <Field
                  label="Parceiro" value={a.Parceiro}
                  editable={editMode} editValue={draft.Parceiro ?? ''}
                  onEdit={(v) => set('Parceiro', v)}
                />
                <Field label="Subgrupos" value={a.Subgrupos} />
                <Field label="Etapa de Aquisição" value={a['Etapa de aquisição']} />
                <Field label="Perfil de Crédito" value={a['Perfil de Crédito']} />
              </Section>

              <Section icon={Hash} title="Volume & Base" accentColor="#64748B">
                <Field label="Base Total"      value={fmt(a['Base Total'])} />
                <Field label="Base Acionável"  value={fmt(a['Base Acionável'])} />
                <Field label="% Otimização"    value={fmtPct(a['% Otimização de base'])} />
                <Field label="C.U. Oferta"     value={fmtBRL(a['Custo Unitário Oferta'])} />
                <Field label="C.U. Canal"      value={fmtBRL(a['Custo unitário do canal'])} />
              </Section>
            </div>

            {/* ── Coluna 3: Funil + Resultados / Financeiro ──────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0 }}>

              {/* Taxas de Funil — coluna única */}
              <div style={{
                background: '#FAFAFA', border: '1px solid #F1F5F9',
                borderRadius: '12px', padding: '12px 14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: `${TEAL}15`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <TrendingUp size={12} style={{ color: TEAL }} />
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#64748B', fontFamily: FONT,
                  }}>Taxas de Funil</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <FunnelBar label="Taxa de Entrega"     value={a['Taxa de Entrega']} />
                  <FunnelBar label="Taxa de Abertura"    value={a['Taxa de Abertura']} />
                  <FunnelBar label="Taxa de Clique"      value={a['Taxa de Clique']} />
                  <FunnelBar label="Taxa de Proposta"    value={a['Taxa de Proposta']} />
                  <FunnelBar label="Taxa de Aprovação"   value={a['Taxa de Aprovação']} />
                  <FunnelBar label="Taxa de Finalização" value={a['Taxa de Finalização']} />
                  <FunnelBar label="Taxa de Conversão"   value={a['Taxa de Conversão']} />
                </div>
              </div>

              {/* Resultados e Financeiro — lado a lado */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '10px', flex: 1, minHeight: 0,
              }}>
                <Section icon={BarChart2} title="Resultados" accentColor="#10B981" cols={1}>
                  <Field label="Propostas"        value={fmt(a.Propostas)} />
                  <Field label="Aprovados"        value={fmt(a.Aprovados)} />
                  <Field label="Cartões Gerados"  value={fmt(a['Cartões Gerados'])} />
                  <Field label="Emissões Indep."  value={fmt(a['Emissões Independentes'])} />
                  <Field label="Emissões Assist." value={fmt(a['Emissões Assistidas'])} />
                </Section>
                <Section icon={DollarSign} title="Financeiro" accentColor="#EF4444" cols={1}>
                  <Field label="C.U. Oferta"        value={fmtBRL(a['Custo Unitário Oferta'])} />
                  <Field label="Total Oferta"        value={fmtBRL(a['Custo Total da Oferta'])} />
                  <Field label="C.U. Canal"          value={fmtBRL(a['Custo unitário do canal'])} />
                  <Field label="Total Canal"         value={fmtBRL(a['Custo total canal'])} />
                  <Field label="Total Campanha"      value={fmtBRL(a['Custo Total Campanha'])} />
                  <Field label="CAC"                 value={fmtBRL(a.CAC)} />
                </Section>
              </div>
            </div>

          </div>
      </div>
    </>
  );
};
