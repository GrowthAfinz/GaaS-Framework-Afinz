import { EMPTY_SCOPE, ResultRow, ResultSummary, ResultsDomain, ResultsScope } from './results.types';

export function validMonth(value: string | null): string {
  return value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : '';
}
export function cleanScope(domain: ResultsDomain, value: Partial<ResultsScope>): ResultsScope {
  const scope = { ...EMPTY_SCOPE };
  const keys: (keyof ResultsScope)[] = domain === 'crm' || domain === 'renta' ? ['bu','segment','partner','channel']
    : domain === 'media' ? ['channel','campaign'] : ['type'];
  keys.forEach(key => { scope[key] = typeof value[key] === 'string' ? value[key]!.slice(0, 300) : ''; });
  const extra: (keyof ResultsScope)[] = domain==='crm'||domain==='renta' ? ['stage','subgroup','journey','safra','operation_id'] : domain==='media' ? ['objective','grain','operation_id'] : ['operation_id'];
  extra.forEach(key => { if (typeof value[key]==='string' && value[key]) scope[key]=value[key]!.slice(0,300); });
  return scope;
}
export function matchesScope(row: ResultRow, scope: ResultsScope) {
  return (Object.keys(scope) as (keyof ResultsScope)[]).every(key => key==='operation_id' || !scope[key] || row[key as keyof ResultRow] === scope[key]);
}
export function duplicateIds(rows: ResultRow[]) {
  const groups = new Map<string, ResultRow[]>();
  rows.filter(row => row.domain === 'crm' || row.domain === 'renta').forEach(row => {
    const group = groups.get(row.duplicateKey) || []; group.push(row); groups.set(row.duplicateKey, group);
  });
  return new Set([...groups.values()].filter(group => group.length > 1).flat().map(row => row.id));
}
export function summarize(rows: ResultRow[], duplicates: Set<string>): ResultSummary {
  const usable = rows.filter(row => !duplicates.has(row.id));
  const sum = (key: 'primary'|'secondary'|'spend'|'conversions') => {
    const values = usable.map(row => row[key]).filter((v): v is number => v !== null && Number.isFinite(v) && v >= 0);
    return { value: values.length ? values.reduce((a,b)=>a+b,0) : null, known: values.length };
  };
  const primary = sum('primary'), secondary = sum('secondary'), spend = sum('spend'), conversions = sum('conversions');
  const paired = usable.filter(row => row.primary !== null && row.secondary !== null && row.primary >= 0 && row.secondary >= 0
    && row.primary <= row.secondary);
  const denominator = paired.reduce((s,row)=>s+(row.secondary || 0),0);
  return { rows: rows.length, usable: usable.length, excluded: rows.length-usable.length,
    days: new Set(rows.map(row=>row.date)).size, primary: primary.value, secondary: secondary.value, spend: spend.value,
    primaryKnown: primary.known, secondaryKnown: secondary.known, spendKnown: spend.known,
    ratio: denominator > 0 ? 100*paired.reduce((s,row)=>s+(row.primary || 0),0)/denominator : null,
    ratioRows: paired.length, conversions: conversions.value, conversionsKnown: conversions.known };
}
export function previousMonth(month: string) {
  const [year, m] = month.split('-').map(Number);
  return m === 1 ? `${year-1}-12` : `${year}-${String(m-1).padStart(2,'0')}`;
}
export function historyMonths(first: string, last: string) {
  if (!validMonth(first) || !validMonth(last) || first > last) return [];
  const months: string[] = [];
  let cursor=last;
  while(cursor>=first){months.unshift(cursor);cursor=previousMonth(cursor);}
  return months;
}
export function monthDays(month: string) {
  const [year,m] = month.split('-').map(Number); return new Date(Date.UTC(year,m,0)).getUTCDate();
}
export function lastClosedDay(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year:'numeric', month:'2-digit', day:'2-digit' }).format(now);
  return new Date(Date.parse(today+'T12:00:00Z')-86400000).toISOString().slice(0,10);
}
export function comparisonWindow(month: string, lastDate: string) {
  const closed = lastClosedDay();
  const end = [month+'-'+String(monthDays(month)).padStart(2,'0'), lastDate, closed].sort()[0];
  const cut = end.startsWith(month) ? Number(end.slice(8)) : 0;
  const previous = previousMonth(month);
  return { end, cut, previous, previousEnd: previous+'-'+String(Math.min(cut,monthDays(previous))).padStart(2,'0'), partial: cut<monthDays(month) };
}
export function metricDelta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return 'Comparação indisponível';
  if (previous === 0) return current === 0 ? 'Sem variação · base anterior 0' : `+${current.toLocaleString('pt-BR')} · base anterior 0`;
  return `${current>=previous?'+':''}${((current/previous-1)*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}% · anterior ${previous.toLocaleString('pt-BR',{maximumFractionDigits:2})}`;
}
export function resultsSearch(domain: ResultsDomain, month: string, scope: ResultsScope, current='') {
  const params = new URLSearchParams(current);
  ['item','create','growth_context','wiki_q','wiki_folder','wiki_browse'].forEach(key=>params.delete(key));
  params.set('view','learning'); params.set('section','results'); params.set('result_domain',domain);
  if (month) params.set('result_month',month); else params.delete('result_month');
  for (const key of Object.keys(EMPTY_SCOPE)) {
    const value=scope[key as keyof ResultsScope]; if(value) params.set('result_'+key,value); else params.delete('result_'+key);
  }
  return '?'+params.toString();
}
export function readResultsRoute(search: string) {
  const p=new URLSearchParams(search); const raw=p.get('result_domain');
  const domain: ResultsDomain=raw==='media'||raw==='b2c'||raw==='renta'?raw:'crm';
  const values=Object.fromEntries([...Object.keys(EMPTY_SCOPE),'stage','subgroup','journey','safra','operation_id','objective','grain'].map(key=>[key,p.get('result_'+key)||'']));
  return { domain, month:validMonth(p.get('result_month')), scope:cleanScope(domain,values) };
}

