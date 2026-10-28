/** Release 8 observation engine. Pure: no database, clock, network or feed writes. */
export const ENGINE_VERSION = '8.1.0';
export interface Operation {
  operation_id: string; front: string; domain: string;
  scope: Record<string, string>; lifecycle: 'candidata' | 'confirmada' | 'aposentada';
  valid_from: string; valid_to: string | null; regime_start: string | null;
}
export interface Rule {
  rule_id: string; front: string; family: 'T1' | 'T2' | 'T5' | 'T6'; metric: string;
  enabled: boolean; mode: 'observacao' | 'ativo'; version: number;
  valid_from: string; valid_to: string | null;
  params: Record<string, string | number | boolean>;
}
export interface MonthlyAggregate {
  month: string; bu: string; segment: string; partner: string; dispatches: number;
  cards: string | null; cost: string | null; missing_cards: number; missing_cost: number;
  unproven_execution: number;
}
export type EvaluationState = 'triggered' | 'no_deviation_detected' | 'open_period' |
  'no_activity' | 'insufficient_sample' | 'missing_data' | 'incomplete_coverage' |
  'invalid_denominator' | 'incomparable_scope' | 'out_of_scope';
export interface Evaluation {
  operation_id: string; family: string; metric: string; period: string; rule_id: string;
  rule_version: number; mode: string; state: EvaluationState; reason: string;
  eligible_months: string[]; excluded: {month: string; reason: string}[];
  current: number | null; median: number | null; minimum: number | null; maximum: number | null;
  relative_deviation: number | null; materiality: number | null;
  direction: 'up' | 'down' | null; assessment: 'favorable' | 'unfavorable' | null;
  paths: string[]; exact: Record<string, string>; feed_eligible: boolean;
}

// Exact rational arithmetic: comparisons never use display rounding or floating epsilon.
type Q = {n: bigint; d: bigint};
function q(n: bigint, d = 1n): Q {
  if (d === 0n) throw new Error('Zero denominator');
  if (d < 0n) { n = -n; d = -d; }
  let a = n < 0n ? -n : n, b = d;
  while (b) { const t = a % b; a = b; b = t; }
  return {n: n / a, d: d / a};
}
function dec(v: string | number): Q {
  const s = String(v);
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(s);
  if (!m) throw new Error(`Invalid finite decimal: ${s}`);
  const digits = (m[2] + (m[3] ?? '')); const exponent = Number(m[4] ?? 0) - (m[3]?.length ?? 0);
  if (Math.abs(exponent) > 100) throw new Error('Decimal exponent out of range');
  const n = BigInt(digits) * (m[1] ? -1n : 1n);
  return exponent >= 0 ? q(n * 10n ** BigInt(exponent)) : q(n, 10n ** BigInt(-exponent));
}
const add = (a: Q, b: Q) => q(a.n*b.d+b.n*a.d,a.d*b.d);
const sub = (a: Q, b: Q) => q(a.n*b.d-b.n*a.d,a.d*b.d);
const mul = (a: Q, b: Q) => q(a.n*b.n,a.d*b.d);
const div = (a: Q, b: Q) => q(a.n*b.d,a.d*b.n);
const abs = (a: Q) => q(a.n < 0n ? -a.n : a.n,a.d);
const cmp = (a: Q, b: Q) => a.n*b.d < b.n*a.d ? -1 : a.n*b.d > b.n*a.d ? 1 : 0;
const number = (a: Q) => Number(a.n)/Number(a.d);
const fraction = (a: Q) => `${a.n}/${a.d}`;
function median(values: Q[]): Q {
  const s = [...values].sort(cmp), i = Math.floor(s.length/2);
  return s.length % 2 ? s[i] : div(add(s[i-1],s[i]),q(2n));
}
function day(v: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10) !== v) throw new Error(`Invalid ISO day: ${v}`);
  return v;
}
function month(v: string): string {
  if (!/^\d{4}-\d{2}$/.test(v)) throw new Error(`Invalid month: ${v}`);
  return day(v+'-01');
}
function previousMonths(period: string, size: number): string[] {
  const d = new Date(month(period));
  return Array.from({length: size}, (_,i) => new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-size+i,1)).toISOString().slice(0,10));
}
function parameter(rule: Rule, key: string): Q {
  const v = rule.params[key];
  if (typeof v !== 'number' && typeof v !== 'string') throw new Error(`Missing parameter ${key}`);
  const x = dec(v); if (x.n < 0n) throw new Error(`Negative parameter ${key}`); return x;
}
function integerParameter(rule: Rule, key: string): number {
  const x = parameter(rule,key); if (x.d !== 1n || x.n < 1n || x.n > 120n) throw new Error(`Invalid count ${key}`);
  return Number(x.n);
}
export function selectRule(rules: Rule[], family: Rule['family'], front: string, evaluationDay: string, metric?: string): Rule {
  day(evaluationDay);
  const matches = rules.filter(r => r.enabled && r.family === family && r.front === front && (!metric || r.metric === metric) && r.valid_from <= evaluationDay && (!r.valid_to || evaluationDay < r.valid_to));
  if (matches.length !== 1) throw new Error(`Expected one applicable ${family}/${front} rule; got ${matches.length}`);
  return matches[0];
}

export function evaluatePerformance(op: Operation, rule: Rule, period: string, asOf: string, rows: MonthlyAggregate[]): Evaluation {
  const first = month(period); day(asOf);
  if (!rule.enabled || !['T1','T2'].includes(rule.family) || rule.front !== op.front || rule.valid_from > asOf || (rule.valid_to && asOf >= rule.valid_to)) throw new Error('Inapplicable performance rule');
  const out: Evaluation = {operation_id:op.operation_id,family:rule.family,metric:rule.metric,period,
    rule_id:rule.rule_id,rule_version:rule.version,mode:rule.mode,state:'no_deviation_detected',reason:'',
    eligible_months:[],excluded:[],current:null,median:null,minimum:null,maximum:null,relative_deviation:null,
    materiality:null,direction:null,assessment:null,paths:[],exact:{},feed_eligible:false};
  const stop = (state: EvaluationState, reason: string) => Object.assign(out,{state,reason});
  if (op.front !== 'crm_aquisicao' || op.domain !== 'CRM' || op.lifecycle === 'aposentada' || !op.scope.partner || op.scope.partner === 'N/A') return stop('out_of_scope','CRM scope/lifecycle is not eligible');
  if (period >= asOf.slice(0,7)) return stop('open_period','Target month has not closed');
  if (first < op.valid_from || (op.valid_to && first >= op.valid_to) || (op.regime_start && first < op.regime_start)) return stop('incomparable_scope','Outside operation regime/validity');
  const selected = rows.filter(r => r.bu === op.scope.bu && r.segment === op.scope.segment && r.partner === op.scope.partner);
  const byMonth = new Map<string,MonthlyAggregate>();
  for (const r of selected) { day(r.month); if (byMonth.has(r.month)) throw new Error('Duplicate monthly grain'); byMonth.set(r.month,r); }
  const current = byMonth.get(first);
  if (!current || current.dispatches === 0) return stop('no_activity','No proven execution in target month');
  const quality = (r: MonthlyAggregate): EvaluationState | null => {
    if (r.unproven_execution || r.missing_cards || (rule.family === 'T2' && r.missing_cost)) return 'incomplete_coverage';
    if (r.cards === null || (rule.family === 'T2' && r.cost === null)) return 'missing_data';
    if (dec(r.cards).n < 0n || (rule.family === 'T2' && dec(r.cost!).n < 0n)) return 'incomparable_scope';
    return null;
  };
  const bad = quality(current); if (bad) return stop(bad,'Target aggregate contains unknown or invalid inputs');
  const cards = dec(current.cards!);
  if (rule.family === 'T2' && cards.n === 0n) return stop('invalid_denominator','CAC cannot divide by zero cards');
  const minimumCards = rule.family === 'T2' ? parameter(rule,'minimum_cards') : q(0n);
  if (rule.family === 'T2' && minimumCards.n === 0n) throw new Error('CAC minimum_cards must be positive');
  if (cmp(cards,minimumCards) < 0) return stop('insufficient_sample','Target cards below configured minimum');
  const value = (r: MonthlyAggregate) => rule.family === 'T1' ? dec(r.cards!) : div(dec(r.cost!),dec(r.cards!));
  const target = value(current); out.current = number(target); out.exact.current = fraction(target);
  const history: Q[] = [];
  let coverageIssue = false;
  for (const m of previousMonths(period,integerParameter(rule,'window_months'))) {
    if (m < op.valid_from.slice(0,7)+'-01' || (op.regime_start && m < op.regime_start) || (op.valid_to && m >= op.valid_to)) {out.excluded.push({month:m,reason:'outside_regime_or_validity'});continue;}
    const r = byMonth.get(m);
    if (!r || r.dispatches === 0) {out.excluded.push({month:m,reason:'no_activity'});continue;}
    const issue = quality(r);
    if (issue) {coverageIssue = true;out.excluded.push({month:m,reason:issue});continue;}
    if (rule.family === 'T2' && cmp(dec(r.cards!),minimumCards) < 0) {out.excluded.push({month:m,reason:'below_minimum_cards'});continue;}
    history.push(value(r));out.eligible_months.push(m);
  }
  if (coverageIssue) return stop('incomplete_coverage','Historical inputs are incomplete; exclusions do not certify completeness');
  if (history.length < integerParameter(rule,'minimum_months')) return stop('insufficient_sample','Not enough eligible months inside calendar window');
  const sorted = [...history].sort(cmp), med = median(history), low = sorted[0], high = sorted[sorted.length-1];
  const delta = sub(target,med), relative = med.n ? div(abs(delta),abs(med)) : null;
  const materiality = rule.family === 'T1' ? abs(delta) : abs(mul(delta,cards));
  Object.assign(out,{median:number(med),minimum:number(low),maximum:number(high),relative_deviation:relative ? number(relative):null,materiality:number(materiality)});
  Object.assign(out.exact,{median:fraction(med),minimum:fraction(low),maximum:fraction(high),materiality:fraction(materiality)});
  if (relative) out.exact.relative_deviation = fraction(relative);
  if (cmp(target,low) < 0 || cmp(target,high) > 0) out.paths.push('outside_range');
  if (relative && cmp(relative,parameter(rule,'relative_threshold')) >= 0 && cmp(materiality,parameter(rule,'materiality')) >= 0) out.paths.push('median_with_materiality');
  if (out.paths.length) {
    out.direction = cmp(target,med) < 0 ? 'down':'up';
    out.assessment = (rule.family === 'T1' ? out.direction === 'up' : out.direction === 'down') ? 'favorable':'unfavorable';
    // This module intentionally never emits feed writes, even for active rules.
    return stop('triggered','Observation only; no candidate/feed side effects');
  }
  return stop('no_deviation_detected',med.n ? 'No configured path passed':'Median is zero; relative path is undefined');
}

export function evaluateFreshness(rule: Rule, latest: string | null, asOf: string, expected: boolean | null = null) {
  if (rule.family !== 'T5' || !rule.enabled) throw new Error('Inapplicable freshness rule');
  day(asOf); const tolerance = number(parameter(rule,'tolerance_days'));
  if (!Number.isInteger(tolerance)) throw new Error('Tolerance must be calendar days');
  if (expected === false) return {state:'out_of_scope',latest,days:null,tolerance,limitation:'Source partition not expected'};
  if (!latest) return {state:'missing_data',latest:null,days:null,tolerance,limitation:'No observed source date'};
  day(latest); const days = (Date.parse(asOf)-Date.parse(latest))/86400000;
  if (days < 0) return {state:'incomparable_scope',latest,days:null,tolerance,limitation:'Future source date'};
  return {state:days > tolerance ? 'triggered':'no_deviation_detected',latest,days,tolerance,
    limitation:expected === null ? 'No governed arrival calendar; lag is observed, stoppage is not proven':''};
}

export function evaluateRevision(rule: Rule, input: {
  certified: string | null; current: string | null; hashVerified: boolean; comparableScope: boolean;
  currentComplete: boolean; snapshotId: string; scopeKey: string; period: string;
}) {
  if (rule.family !== 'T6' || !rule.enabled) throw new Error('Inapplicable revision rule');
  const identity = {snapshot_id:input.snapshotId,scope_key:input.scopeKey,period:input.period,rule_id:rule.rule_id};
  if (!input.hashVerified || !input.comparableScope) return {...identity,state:'incomparable_scope',delta:null,relative:null};
  if (!input.currentComplete || input.certified === null || input.current === null) return {...identity,state:'missing_data',delta:null,relative:null};
  const certified=dec(input.certified),current=dec(input.current);
  if (certified.n < 0n || current.n < 0n) return {...identity,state:'incomparable_scope',delta:null,relative:null};
  const delta=sub(current,certified),relative=certified.n ? div(abs(delta),abs(certified)):null;
  const triggered=cmp(abs(delta),parameter(rule,'absolute_threshold')) >= 0 || Boolean(relative && cmp(relative,parameter(rule,'relative_threshold')) >= 0);
  return {...identity,state:triggered?'triggered':'no_deviation_detected',delta:number(delta),relative:relative?number(relative):null,
    exact_delta:fraction(delta),exact_relative:relative?fraction(relative):null};
}
