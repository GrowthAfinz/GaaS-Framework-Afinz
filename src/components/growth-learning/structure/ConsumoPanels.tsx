import type React from 'react';
import { TONE_COLOR, fmtPct, fmtVol, status, type Metrics } from './consumoModel';

/** Cabeçalho de painel no board do Consumo. A faixa colorida vira bloco no minimapa (data-mini). */
export function PanelHead({ icon, title, sub, acc, right }: { icon: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; acc: string; right?: React.ReactNode }) {
  return (
    <div className="czb-ph" data-mini={acc}>
      <span className="czb-ic" style={{ ['--acc' as string]: acc }}>{icon}</span>
      <h3>{title}</h3>
      {sub && <span className="czb-q">{sub}</span>}
      {right && <span className="czb-r">{right}</span>}
    </div>
  );
}

/** Barra de dados (estilo Excel): projeção como parte do contrato; vermelha quando passa de 100%. */
export function ProjCell({ x }: { x: Metrics }) {
  const r = x.tot ? x.proj / x.tot : null;
  return (
    <span className="czb-db" title={`Ritmo dos últimos 30 dias: ${fmtVol(x.r30)}`}>
      <span className="v">{fmtVol(x.proj)}</span>
      {r != null && <span className="t"><i style={{ width: `${Math.min(1, r) * 100}%`, background: r > 1 ? '#ef4444' : '#94a3b8' }} /></span>}
      {r != null && <b className={r > 1 ? 'neg' : ''}>{fmtPct(r)}</b>}
    </span>
  );
}

/** Saldo com o conjunto de ícones: ▲ sobra (verde), ▼ falta (vermelho). */
export function SaldoCell({ v }: { v: number | null }) {
  if (v == null) return null;
  return <span className={`czb-sal${v < 0 ? ' neg' : ''}`}>{v < 0 ? '▼ −' : '▲ '}{fmtVol(Math.abs(v))}</span>;
}

/** Os números do topo, na mesma ordem das colunas da tabela. */
export function KpiStrip({ x, endLabel, expLabel, lastLabel, stamp }: { x: Metrics; endLabel: string; expLabel: string; lastLabel: string; stamp: React.ReactNode }) {
  const share = x.tot ? x.proj / x.tot : null;
  const k = (label: string, value: React.ReactNode, note: React.ReactNode) => <div className="czb-kpi"><small>{label}</small><b>{value}</b><span>{note}</span></div>;
  return (
    <div className="czb-kpis cz-num">
      {k('Contrato 12M', fmtVol(x.tot), 'contrato inteiro')}
      {k(`Projeção ${endLabel}`, fmtVol(x.proj), share != null ? `${fmtPct(share)} do contrato, no ritmo de 30d` : 'no ritmo de 30d')}
      {k(expLabel, fmtVol(x.exp), `o contrato previa até ${lastLabel}`)}
      {k('Consumido', fmtVol(x.real), `envios reais até ${lastLabel}`)}
      {k('Uso', x.uso == null ? 'sem' : <span style={{ color: TONE_COLOR[status(x)[0]] }}>{fmtPct(x.uso)}</span>, 'consumido ÷ esperado')}
      {k('Saldo', <SaldoCell v={x.saldo} />, 'contrato − projeção')}
      <div className="czb-kpi"><small>Situação</small><div style={{ marginTop: 6 }}>{stamp}</div><span>{x.saldo != null && x.tot ? (x.saldo >= 0 ? `sobra ${fmtPct(x.saldo / x.tot)} do contrato em ${endLabel}` : `falta ${fmtVol(-x.saldo)} em ${endLabel}`) : ''}</span></div>
    </div>
  );
}

const niceMax = (v: number) => { if (v <= 0) return 1; const p = 10 ** Math.floor(Math.log10(v)); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 5 ? 5 : 10) * p; };
const ticks = (max: number) => [0, 0.2, 0.4, 0.6, 0.8, 1].map(f => f * max);
/** Rótulo curto em cima da coluna: só o número em milhões (o eixo já diz a unidade). */
const short = (v: number) => (v >= 1e6 ? (v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : fmtVol(v));

/** Colunas agrupadas (Excel): contrato do mês ao lado do enviado; projeção hachurada a partir de hoje. */
export function MonthColumns({ labels, plan, real, proj, nowIdx, nowFrac, color, width }: {
  labels: string[]; plan: number[]; real: (number | null)[]; proj: (number | null)[]; nowIdx: number; nowFrac: number; color: string; width: number;
}) {
  const W = width, H = 236, L = 50, B = 26, T = 18;
  const max = niceMax(Math.max(...plan, ...labels.map((_, i) => (real[i] || 0) + (proj[i] || 0))) * 1.08);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const step = (W - L - 6) / labels.length, bw = Math.max(6, Math.min(18, step / 2 - 4));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="czb-svg">
      <defs><pattern id="czb-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="#f1f5f9" /><line x1="0" y1="0" x2="0" y2="5" stroke="#94a3b8" strokeWidth="1.6" /></pattern></defs>
      {ticks(max).map(v => <g key={v}><line x1={L} x2={W - 4} y1={y(v)} y2={y(v)} stroke="#eef2f6" /><text x={L - 8} y={y(v) + 4} textAnchor="end" className="ax">{v ? fmtVol(v) : '0'}</text></g>)}
      {labels.map((m, i) => {
        const cx = L + step * i + step / 2, x1 = cx - bw - 2, x2 = cx + 2, r = real[i] || 0, p = proj[i] || 0;
        return (
          <g key={m}>
            <rect x={x1} y={y(plan[i])} width={bw} height={y(0) - y(plan[i])} fill="#dbe3ec" rx="2"><title>{`${m} · contrato do mês: ${fmtVol(plan[i])}`}</title></rect>
            {r > 0 && <rect x={x2} y={y(r)} width={bw} height={y(0) - y(r)} fill={color} rx="2"><title>{`${m} · enviado: ${fmtVol(r)}${plan[i] ? ` (${fmtPct(r / plan[i])} do contrato do mês)` : ''}`}</title></rect>}
            {p > 0 && <rect x={x2} y={y(r + p)} width={bw} height={y(r) - y(r + p)} fill="url(#czb-hatch)" stroke="#64748b" strokeDasharray="2 2"><title>{`${m} · projeção no ritmo de 30d: ${fmtVol(p)}`}</title></rect>}
            {r > 0 && i < nowIdx && <text x={x2 + bw / 2} y={y(r) - 5} textAnchor="middle" className="lbl">{short(r)}</text>}
            <text x={cx} y={H - 8} textAnchor="middle" className={`ax${i === nowIdx ? ' now' : ''}`}>{m}</text>
          </g>
        );
      })}
      {nowIdx >= 0 && (() => { const xh = L + step * (nowIdx + nowFrac); return <g><line x1={xh} x2={xh} y1={T - 8} y2={y(0)} stroke="#0f172a" strokeDasharray="3 3" /><text x={xh + 4} y={T - 1} className="lbl">hoje</text></g>; })()}
    </svg>
  );
}

/** Linhas do acumulado (Excel): contrato x consumido, projeção pontilhada e a sobra (ou falta) no fim. */
export function CumulativeLines({ labels, plan, real, proj, nowIdx, nowFrac, width }: {
  labels: string[]; plan: number[]; real: (number | null)[]; proj: (number | null)[]; nowIdx: number; nowFrac: number; width: number;
}) {
  const W = width, H = 236, L = 54, R = 64, B = 26, T = 16, n = labels.length;
  let acc = 0; const cp = plan.map(v => (acc += v));
  acc = 0; const cr: number[] = []; for (let i = 0; i <= nowIdx; i++) cr.push(acc += real[i] || 0);
  let pv = cr[cr.length - 1] || 0; const cj: number[] = []; for (let i = Math.max(0, nowIdx); i < n; i++) cj.push(pv += proj[i] || 0);
  const end = cj.length ? cj[cj.length - 1] : pv, total = cp[n - 1] || 0;
  const max = niceMax(Math.max(total, end) * 1.05);
  const step = (W - L - R) / Math.max(1, n - 1);
  const x = (i: number) => L + step * i, y = (v: number) => T + (H - T - B) * (1 - v / max);
  const realPts = cr.map((v, i) => [i === nowIdx ? x(i - 1 + nowFrac) : x(i), y(v)]);
  const projPts = [realPts[realPts.length - 1] || [x(0), y(0)], ...cj.map((v, k) => [x(Math.max(0, nowIdx) + k), y(v)])];
  const diff = total - end;
  const marks = [0, Math.round((n - 1) / 3), Math.round((2 * (n - 1)) / 3), n - 1];
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="czb-svg">
      <defs><marker id="czb-ar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill={diff >= 0 ? '#15803d' : '#b91c1c'} /></marker></defs>
      {ticks(max).map(v => <g key={v}><line x1={L} x2={W - R + 6} y1={y(v)} y2={y(v)} stroke="#eef2f6" /><text x={L - 8} y={y(v) + 4} textAnchor="end" className="ax">{v ? fmtVol(v) : '0'}</text></g>)}
      <polyline points={cp.map((v, i) => `${x(i)},${y(v)}`).join(' ')} fill="none" stroke="#94a3b8" strokeWidth="2.2"><title>{`Contrato acumulado: ${fmtVol(total)}`}</title></polyline>
      {projPts.length > 1 && <polyline points={projPts.map(p => p.join(',')).join(' ')} fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="5 4" />}
      {realPts.length > 0 && <polyline points={realPts.map(p => p.join(',')).join(' ')} fill="none" stroke="#1e293b" strokeWidth="2.6" />}
      {realPts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#1e293b"><title>{`${labels[i]} · consumido acumulado: ${fmtVol(cr[i])}`}</title></circle>)}
      <text x={x(n - 1) + 6} y={y(total) + 4} className="lbl" fill="#64748b">{fmtVol(total)}</text><text x={x(n - 1) + 6} y={y(total) + 16} className="ax">contrato</text>
      <text x={x(n - 1) + 6} y={y(end) + 4} className="lbl">{fmtVol(end)}</text><text x={x(n - 1) + 6} y={y(end) + 16} className="ax">projeção</text>
      {Math.abs(y(total) - y(end)) > 18 && <>
        <line x1={x(n - 1)} x2={x(n - 1)} y1={y(Math.max(total, end)) + 4} y2={y(Math.min(total, end)) - 4} stroke={diff >= 0 ? '#15803d' : '#b91c1c'} strokeWidth="1.5" markerStart="url(#czb-ar)" markerEnd="url(#czb-ar)" />
        <text x={x(n - 1) - 8} y={(y(total) + y(end)) / 2 + 4} textAnchor="end" className="lbl" fill={diff >= 0 ? '#15803d' : '#b91c1c'}>{diff >= 0 ? `sobra ${fmtVol(diff)}` : `falta ${fmtVol(-diff)}`}</text>
      </>}
      {marks.map(i => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="ax">{labels[i]}</text>)}
    </svg>
  );
}
