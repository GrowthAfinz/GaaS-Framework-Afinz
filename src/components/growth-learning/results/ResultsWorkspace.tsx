import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, RefreshCw, TrendingUp } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../../../context/AuthContext';
import { useUserRole } from '../../../context/UserRoleContext';
import { supabase } from '../../../services/supabaseClient';
import { openGrowthBetSourceContext, openGrowthLearningSection, openGrowthLearningSectionItem, GrowthBetSourceContext } from '../growthLearningNavigation';
import { RelatedGrowthBets } from '../bets/RelatedGrowthBets';
import { fetchResultsSnapshot } from './resultsService';
import { cleanScope, comparisonWindow, duplicateIds, historyMonths, lastClosedDay, matchesScope, metricDelta, readResultsRoute, resultsSearch, summarize } from './results.logic';
import { EMPTY_SCOPE, ResultRow, ResultsDomain, ResultsScope, ResultsSnapshot } from './results.types';
import { matchesWikiAnalytics, WikiAnalytics, wikiResultsSearch } from '../../vault/wikiAnalytics';
import { ResultRetrospectivePanel } from './ResultRetrospectivePanel';

const META = {
  crm:{title:'CRM Aquisição',primary:'Cartões registrados',secondary:'Propostas',ratio:'Cartões / propostas',question:'Como a produção evoluiu neste segmento e parceiro?',note:'03-Dimensoes/Segmentos.md'},
  renta:{title:'Rentabilização e seguros',primary:'Cliques registrados',secondary:'Base acionável registrada',ratio:'Cliques / base acionável',question:'Como execução e engajamento evoluíram? Venda, uso e receita exigem eventos próprios.',note:'09-Inteligencia-IA/Dossie-Mestre-Operacao-CRM-Midia.md'},
  media:{title:'Mídia paga',primary:'Cliques reportados',secondary:'Impressões',ratio:'CTR recalculado',question:'Como investimento, tráfego e composição evoluíram nesta campanha?',note:'04-Operacao/Mídia-Analytics.md'},
  b2c:{title:'Originação B2C',primary:'Emissões',secondary:'Propostas',ratio:'Emissões / propostas',question:'Como a originação evoluiu e qual foi a contribuição de Serasa?',note:'02-Entidades-Dados/b2c_daily_metrics.md'},
};
const fmt=(v:number|null)=>v===null?'Indisponível':v.toLocaleString('pt-BR',{maximumFractionDigits:2});
const money=(v:number|null)=>v===null?'Indisponível':v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const input='rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-cyan-600';
const TYPE_LABELS:Record<string,string>={total:'Total B2C',serasa_api:'Serasa API',crm:'CRM registrado'};
const dateLabel=(v:string)=>v.slice(0,10).split('-').reverse().join('/');
export function ResultsWorkspace({embedded}:{embedded?:WikiAnalytics & {noteId:string}}){
  const {user}=useAuth();const {isPlurixAnalyst}=useUserRole();
  const [route,setRoute]=useState(()=>readResultsRoute(window.location.search));
  const [snapshot,setSnapshot]=useState<ResultsSnapshot|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [refresh,setRefresh]=useState(0),[noteError,setNoteError]=useState('');
  const [trendMetric,setTrendMetric]=useState<'primary'|'secondary'|'spend'|'ratio'>('primary');
  const request=useRef(0);
  const domain:ResultsDomain=embedded?.domain || (isPlurixAnalyst&&route.domain==='b2c'?'crm':route.domain);
  useEffect(()=>setTrendMetric('primary'),[domain]);
  const scope=useMemo(()=>cleanScope(domain,{...(route.domain===domain?route.scope:EMPTY_SCOPE),...(embedded?.scope||{}),...(domain==='b2c'?{type:embedded?.scope.type||route.scope.type||'total'}:{}),...(isPlurixAnalyst&&domain==='crm'?{bu:'Plurix'}:{})}),[domain,route.scope,isPlurixAnalyst,embedded]);
  useEffect(()=>{const sync=()=>setRoute(readResultsRoute(window.location.search));window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
  useEffect(()=>{
    const id=++request.current;setSnapshot(null);setError('');setLoading(true);
    if(!user){setLoading(false);return;}
    fetchResultsSnapshot(domain,user.id,refresh>0).then(data=>{if(id===request.current)setSnapshot(data);})
      .catch(e=>{if(id===request.current)setError(e.message||'Falha ao carregar os resultados.');})
      .finally(()=>{if(id===request.current)setLoading(false);});
    return()=>{request.current++;};
  },[domain,user?.id,refresh]);
  const closed=lastClosedDay();
  const sourceRows=useMemo(()=>snapshot?.rows.filter(r=>r.date && r.date<=closed && (!embedded || matchesWikiAnalytics(r,embedded)))||[],[snapshot,closed,embedded]);
  const months=useMemo(()=>[...new Set(sourceRows.map(r=>r.date.slice(0,7)))].sort().reverse(),[sourceRows]);
  const month=(route.domain===domain?route.month:'')||months[0]||closed.slice(0,7);
  const duplicates=useMemo(()=>duplicateIds(snapshot?.rows.filter(r=>r.date<=closed)||[]),[snapshot,closed]);
  const rows=useMemo(()=>sourceRows.filter(r=>matchesScope(r,scope)),[sourceRows,scope]);
  const sourceLast=rows.reduce((last,r)=>r.date>last?r.date:last,'');
  const windowCut=comparisonWindow(month,sourceLast||closed);
  const current=rows.filter(r=>r.date.startsWith(month)&&r.date<=windowCut.end);
  const previous=rows.filter(r=>r.date.startsWith(windowCut.previous)&&r.date<=windowCut.previousEnd);
  const summary=summarize(current,duplicates),prior=summarize(previous,duplicates);
  const monthly=useMemo(()=>historyMonths(rows.map(r=>r.date.slice(0,7)).sort()[0]||month,month).map(m=>{
    const s=summarize(rows.filter(r=>r.date.startsWith(m)),duplicates);
    return {month:m,primary:s.primary,secondary:s.secondary,spend:s.spend,ratio:s.ratio,days:s.days,excluded:s.excluded};
  }),[rows,duplicates,month]);
  const navigate=(nextDomain:ResultsDomain,nextMonth=month,nextScope=scope)=>{
    const finalScope=cleanScope(nextDomain,{...nextScope,...(embedded?.scope||{})});
    const next=embedded?wikiResultsSearch(embedded.noteId,nextDomain,nextMonth,finalScope,window.location.search):resultsSearch(nextDomain,nextMonth,finalScope,window.location.search);
    window.history.pushState({},'',window.location.pathname+next);window.dispatchEvent(new PopStateEvent('popstate'));
  };
  const setFilter=(key:keyof ResultsScope,value:string)=>navigate(domain,month,{...scope,[key]:value});
  const fields: {key:keyof ResultsScope;label:string}[]=domain==='crm'||domain==='renta'?[{key:'bu',label:'BU'},{key:'segment',label:'Segmento'},{key:'partner',label:'Parceiro canônico'},{key:'channel',label:'Canal'},{key:'stage',label:'Etapa'},{key:'subgroup',label:'Subgrupo'},{key:'journey',label:'Jornada'},{key:'safra',label:'Safra'}]
    :domain==='media'?[{key:'channel',label:'Plataforma'},{key:'campaign',label:'Campanha'},{key:'objective',label:'Objetivo de plataforma'},{key:'grain',label:'Nível'}]:[{key:'type',label:'Recorte de originação'}];
  const effectiveScope=domain==='b2c'&&!scope.type?{...scope,type:'total'}:scope;
  // B2C total and Serasa are nested populations, never additive.
  const b2cRows=domain==='b2c'&&effectiveScope.type!==scope.type?sourceRows.filter(r=>matchesScope(r,effectiveScope)):rows;
  const effectiveCurrent=domain==='b2c'?b2cRows.filter(r=>r.date.startsWith(month)&&r.date<=windowCut.end):current;
  const effectivePrevious=domain==='b2c'?b2cRows.filter(r=>r.date.startsWith(windowCut.previous)&&r.date<=windowCut.previousEnd):previous;
  const active=domain==='b2c'?summarize(effectiveCurrent,duplicates):summary;
  const previousSummary=domain==='b2c'?summarize(effectivePrevious,duplicates):prior;
  const chart=domain==='b2c'?monthly.map(point=>({...point,...summarize(b2cRows.filter(r=>r.date.startsWith(point.month)),duplicates)})):monthly;
  const drillField:keyof ResultsScope=domain==='crm'||domain==='renta'?(scope.segment?'partner':'segment'):domain==='media'?'campaign':'type';
  const groups=[...new Set((domain==='b2c'?sourceRows.filter(r=>r.date.startsWith(month)&&r.date<=windowCut.end):current).map(r=>r[drillField]))].map(value=>{
    const subset=(domain==='b2c'?sourceRows.filter(r=>r.date.startsWith(month)&&r.date<=windowCut.end):current).filter(r=>r[drillField]===value);
    return {value,label:!value?'Não informado':drillField==='campaign'?subset[0]?.campaignLabel||value:value,summary:summarize(subset,duplicates)};
  }).sort((a,b)=>(b.summary.primary||0)-(a.summary.primary||0));
  const meta=META[domain];
  const trendLabel=trendMetric==='primary'?meta.primary:trendMetric==='secondary'?meta.secondary:trendMetric==='spend'?'Custo registrado':meta.ratio;
  const daily=[...new Set(effectiveCurrent.map(r=>r.date))].sort().map(date=>({date,...summarize(effectiveCurrent.filter(r=>r.date===date),duplicates)}));
  const context:GrowthBetSourceContext={
    front:domain==='crm'||domain==='renta'?'crm_acquisition':domain==='media'?'paid_media':'b2c_origin',sourceSurface:'results_dossier',
    sourceRoute:embedded?'wiki:'+embedded.noteId:'results:'+domain,periodStart:month+'-01',periodEnd:windowCut.cut?windowCut.end:month+'-01',
    filters:effectiveScope,entityKey:JSON.stringify(effectiveScope),metricName:meta.primary,title:meta.title+' · '+(scope.segment||scope.campaign||scope.type||'Panorama'),
    verificationView:embedded?wikiResultsSearch(embedded.noteId,domain,month,effectiveScope):resultsSearch(domain,month,effectiveScope),visualRef:'monthly-evolution',
  };
  const openNote=async()=>{
    setNoteError('');
    const {data,error}=await supabase.from('gaas_vault_notes').select('id').eq('relative_path',meta.note).is('deleted_at',null).maybeSingle();
    if(error||!data){setNoteError('A definição ainda não tem nota vinculada. Consulte a busca da Wiki.');return;}
    openGrowthLearningSectionItem('vault',data.id);
  };
  if(loading)return <div role="status" className="animate-pulse rounded-2xl border bg-white p-8 text-slate-500">Carregando o histórico completo de {META[domain].title}…</div>;
  return <div className="space-y-5" data-results-workspace>
    <header className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-cyan-700">Resultados · evolução e aprendizado</p><h2 className="mt-1 text-2xl font-bold text-slate-950">{meta.title}</h2><p className="mt-2 text-sm text-slate-600">{meta.question}</p></div>
        <div className="flex gap-2"><button type="button" onClick={()=>void openNote()} className={input}><BookOpen size={14} className="mr-1 inline"/>Definição na Wiki</button><button type="button" onClick={()=>setRefresh(r=>r+1)} className={input} aria-label="Atualizar resultados"><RefreshCw size={15}/></button></div></div>
      {!embedded && <nav aria-label="Domínio de resultados" className="mt-4 flex flex-wrap gap-2">{(['crm','renta','media','b2c'] as ResultsDomain[]).filter(d=>!isPlurixAnalyst||d!=='b2c').map(d=><button key={d} type="button" onClick={()=>navigate(d,'',EMPTY_SCOPE)} aria-current={d===domain?'page':undefined} className={d===domain?'rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white':input}>{META[d].title}</button>)}</nav>}
      <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-xs font-semibold text-slate-600">Mês<select aria-label="Mês de resultados" className={'mt-1 block '+input} value={month} onChange={e=>navigate(domain,e.target.value)}>{[...new Set([month,...months])].sort().reverse().map(m=><option key={m}>{m}</option>)}</select></label>
        {fields.map(({key,label})=><label key={key} className="text-xs font-semibold text-slate-600">{label}<select aria-label={label} disabled={Boolean(embedded?.scope[key]) || isPlurixAnalyst&&key==='bu'} className={'mt-1 block max-w-[300px] '+input} value={effectiveScope[key]||''} onChange={e=>setFilter(key,e.target.value)}>
          {key!=='type'&&<option value="">Todos</option>}{[...new Set(sourceRows.map(r=>r[key as keyof ResultRow]) as string[])].filter(Boolean).sort().map(v=><option key={v} value={v}>{key==='campaign'?sourceRows.find(r=>r.campaign===v)?.campaignLabel||v:key==='type'?TYPE_LABELS[v]||v:v}</option>)}</select></label>)}
        <button className={input} type="button" onClick={()=>navigate(domain,month,EMPTY_SCOPE)}>Limpar filtros</button></div>
      {noteError&&<p role="status" className="mt-3 text-sm text-amber-800">{noteError}</p>}
    </header>
    {error?<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error} <button onClick={()=>setRefresh(r=>r+1)} className="underline">Tentar novamente</button></div>:!sourceRows.length?<div className="rounded-xl border bg-white p-6">Esta fonte ainda não tem resultados em dias fechados.</div>:<>
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" aria-label="Cobertura e limites">
        <strong>{!sourceLast?'Recorte sem observações':sourceLast<closed?'Última observação do recorte anterior ao dia fechado':'Último dia fechado presente'}{sourceLast?' · '+dateLabel(sourceLast):''}</strong>
        <p className="mt-1">Recorte {month} · {active.days} dias com registros · {active.rows} linhas · {active.usable} usadas · {active.excluded} em chaves repetidas excluídas preventivamente.</p>
        <p className="mt-1">{windowCut.cut? `Comparação com ${windowCut.previous} até o dia ${Math.min(windowCut.cut,31)}${windowCut.partial?' · mês parcial':''}.`:'Sem dados comparáveis neste mês.'} Dias sem linha não comprovam produção zero.</p>
        <p className="mt-1">{domain==='renta'?'Cliques e base são registros de execução, sem comprovar venda, uso, desbloqueio ou receita. Custos somente registrados.':domain==='crm'?'Custos são registrados, sem tarifas estimadas. As somas não são resultados oficiais certificados; propostas e cartões podem ter cobertura diferente.':domain==='media'?'Conversões de plataforma não equivalem a cartões. CTR usa apenas linhas com cliques e impressões compatíveis; alcance/frequência e CPA aguardam homologação. Dias com níveis sobrepostos ficam sem medidas somadas até conciliação.':'Serasa já integra o total. CRM só está registrado separadamente em maio/2026; não somar tipos. Razão diária não comprova conversão de uma mesma coorte.'}</p>
      </section>
      {!active.rows&&<p role="status" className="rounded-xl border bg-white p-5">Sem observações para este mês e recorte. Escolha outro mês ou remova filtros; os valores permanecem indisponíveis.</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[{label:meta.primary,value:active.primary,prev:previousSummary.primary,known:active.primaryKnown},{label:meta.secondary,value:active.secondary,prev:previousSummary.secondary,known:active.secondaryKnown},
          {label:meta.ratio,value:active.ratio,prev:previousSummary.ratio,known:active.ratioRows},{label:domain==='b2c'?'Dias com dados':'Custo registrado',value:domain==='b2c'?(active.rows?active.days:null):active.spend,prev:domain==='b2c'?(previousSummary.rows?previousSummary.days:null):previousSummary.spend,known:domain==='b2c'?active.rows:active.spendKnown}].map((k,i)=><article key={k.label} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{k.label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{i===3&&domain!=='b2c'?money(k.value):fmt(k.value)}{i===2&&k.value!==null?'%':''}</p><p className="mt-2 text-xs text-slate-600">{metricDelta(k.value,k.prev)}</p><p className="mt-1 text-xs text-slate-400">{k.known}/{active.usable} linhas com a medida · comparações descritivas</p></article>)}
      </div>
      <section className="rounded-2xl border bg-white p-5" aria-label="Evolução mensal"><div className="flex items-center gap-2"><TrendingUp size={18} className="text-cyan-700"/><h3 className="font-bold text-slate-900">Evolução mensal · {trendLabel}</h3></div><label className="mt-3 block text-xs font-semibold text-slate-600">Medida da evolução<select aria-label="Medida da evolução" value={trendMetric} onChange={e=>setTrendMetric(e.target.value as typeof trendMetric)} className={'ml-2 '+input}><option value="primary">{meta.primary}</option><option value="secondary">{meta.secondary}</option><option value="ratio">{meta.ratio}</option>{domain!=='b2c'&&<option value="spend">Custo registrado</option>}</select></label><p className="mt-1 text-xs text-slate-500">Meses observados até {month}; o mês recente pode ser parcial. Lacunas não são preenchidas com zero. Passe pela série e selecione o mês no filtro para abrir a retrospectiva.</p>
        <div className="mt-4 h-64 min-w-0"><ResponsiveContainer width="100%" height="100%"><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="month" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Line type="monotone" dataKey={trendMetric} name={trendLabel} isAnimationActive={false} stroke="#0891b2" strokeWidth={2} dot={{r:3}} connectNulls={false}/></LineChart></ResponsiveContainer></div>
        <details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-cyan-800">Ver valores e cobertura mês a mês</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="p-2">Mês</th><th>{meta.primary}</th><th>{meta.secondary}</th><th>Dias</th><th>Excluídas</th></tr></thead><tbody>{chart.map(point=><tr key={point.month} className="border-b"><td className="p-2"><button type="button" className="font-semibold text-cyan-800 underline" onClick={()=>navigate(domain,point.month)}>{point.month}</button></td><td>{fmt(point.primary)}</td><td>{fmt(point.secondary)}</td><td>{point.days}</td><td>{point.excluded}</td></tr>)}</tbody></table></div></details>
      </section>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-white p-5"><h3 className="font-bold text-slate-900">{domain==='crm'||domain==='renta'?(scope.segment?'Parceiros neste segmento':'Segmentos no recorte'):domain==='media'?'Campanhas no recorte':'Componentes da originação'}</h3>
          {domain==='b2c'&&<p className="mt-2 text-xs text-slate-500">Total e Serasa são populações sobrepostas. Esta tabela serve à comparação, não à soma.</p>}
          <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="p-2">Recorte</th><th>{meta.primary}</th><th>Cobertura</th></tr></thead><tbody>{groups.map(g=><tr key={g.value} className="border-b"><td className="max-w-[280px] p-2"><button type="button" disabled={!g.value} onClick={()=>setFilter(drillField,g.value)} className="text-left font-semibold text-cyan-800 hover:underline">{domain==='b2c'?TYPE_LABELS[g.label]||g.label:g.label} <ArrowRight size={12} className="inline"/></button></td><td>{fmt(g.summary.primary)}</td><td className="text-xs text-slate-500">{g.summary.primaryKnown}/{g.summary.usable}</td></tr>)}</tbody></table></div>
        </section>
        <ResultRetrospectivePanel key={domain+month+JSON.stringify(effectiveScope)} domain={domain} scope={effectiveScope} month={month} canWrite={Boolean(user)} sourceSnapshot={{source:snapshot?.source,wiki_note_id:embedded?.noteId,operation_id:embedded?.scope.operation_id,fixed_scope:embedded?.scope,selection_rules:embedded?.anyOf,fetched_at:snapshot?.fetchedAt,cutoff:windowCut.end,summary:active,previous:previousSummary}}/>
      </div>
      <details className="rounded-2xl border bg-white p-5"><summary className="cursor-pointer font-bold text-slate-900">Detalhe diário do recorte · {daily.length} dias</summary><p className="mt-2 text-xs text-slate-500">Somente dias observados. As mesmas exclusões e regras da evolução mensal se aplicam.</p><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="p-2">Dia</th><th>{meta.primary}</th><th>{meta.secondary}</th><th>{meta.ratio}</th>{domain!=='b2c'&&<th>Custo registrado</th>}<th>Linhas usadas</th></tr></thead><tbody>{daily.map(d=><tr key={d.date} className="border-b"><td className="p-2">{dateLabel(d.date)}</td><td>{fmt(d.primary)}</td><td>{fmt(d.secondary)}</td><td>{fmt(d.ratio)}{d.ratio!==null?'%':''}</td>{domain!=='b2c'&&<td>{money(d.spend)}</td>}<td>{d.usable}/{d.rows}</td></tr>)}</tbody></table></div></details>
      <section className="rounded-xl border bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-bold text-slate-900">Da leitura à próxima verificação</h3><p className="mt-1 text-sm text-slate-500">{domain==='renta'?'Registre a próxima verificação na retrospectiva e acompanhe sua evolução mensal.':'Crie uma aposta com o período e os filtros deste dossiê. A retrospectiva permanece uma interpretação até a verificação pelo loop.'}</p></div>{domain!=='renta' && <button type="button" disabled={!active.usable||!windowCut.cut} onClick={()=>openGrowthBetSourceContext(context)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Criar aposta deste recorte</button>}</div>{domain!=='renta' && <RelatedGrowthBets context={context}/>}<button type="button" onClick={()=>openGrowthLearningSection('memory')} className="mt-3 text-sm font-semibold text-cyan-800">Consultar memória validada</button></section>
      <details className="rounded-xl border bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Fonte e contrato de leitura</summary><p className="mt-2 text-xs text-slate-500">Fonte: {snapshot?.source} · {snapshot?.rows.length} linhas lidas com paginação completa · atualização {snapshot?.fetchedAt}. Leitura autenticada, sem dados operacionais no bundle público. Chaves CRM repetidas são detectadas antes dos filtros; exclusão preventiva não corrige nem apaga registros. Taxas usam numerador e denominador pareados. No domínio mídia, nomes com alias único usam identidade canônica; sem alias único permanecem explícitos como nome de origem. Retrospectivas têm versões independentes das atualizações da fonte.</p></details>
    </>}
  </div>;
}

