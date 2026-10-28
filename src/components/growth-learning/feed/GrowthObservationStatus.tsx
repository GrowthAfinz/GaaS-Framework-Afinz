import { openGrowthLearningSection } from '../growthLearningNavigation';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '../../../services/supabaseClient';
import {observationHealth,observationStateLabel,type ObservationRun,type ObservationJob} from './growthObservation.logic';

interface State {enabled:boolean;role:string;run:ObservationRun|null;job:ObservationJob|null}
const names:Record<string,string>={'CRM-92fbd40403':'Plurix · Negados','CRM-a695575900':'Proprietária · Aprovados não convertidos'};
const sources:Record<string,string>={'activities':'CRM','paid_media_metrics:meta':'Mídia Meta','paid_media_metrics:google':'Mídia Google',
  'b2c_daily_metrics':'Originação B2C','app_afinz_funnel_daily_raw':'Funil do app','serasa_bi_daily_funnel':'Funil Serasa'};
export function GrowthObservationStatus({period}:{period:string}){
  const [state,setState]=useState<State|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
  const generation=useRef(0);
  const load=useCallback(async()=>{
    const token=++generation.current;
    try{
      const [setting,member,run,job]=await Promise.all([
        supabase.from('growth_trigger_runtime_settings').select('observation_enabled').eq('id','pilot').maybeSingle(),
        supabase.from('report_live_memberships').select('role,active').maybeSingle(),
        supabase.from('growth_trigger_observation_runs').select('id,completed_at,evaluation_as_of,data_read_at,output').eq('period',period+'-01').order('completed_at',{ascending:false}).limit(1).maybeSingle(),
        supabase.from('growth_trigger_observation_jobs').select('state,revision,processed_revision,changed_at,last_error,finished_at').eq('period',period+'-01').maybeSingle(),
      ]);
      if([setting,member,run,job].some(r=>r.error)||!setting.data||!member.data?.active)throw new Error('unavailable');
      if(token!==generation.current)return;
      setState({enabled:setting.data.observation_enabled,role:member.data.role,run:run.data as ObservationRun|null,job:job.data as ObservationJob|null});setError(null);
    }catch{if(token===generation.current){setState(null);setError('O monitor do piloto não está disponível para seu acesso. Tente atualizar novamente.');}}
  },[period]);
  useEffect(()=>{setState(null);setError(null);void load();const id=window.setInterval(()=>void load(),30000);return()=>{generation.current++;window.clearInterval(id);};},[load]);
  const rerun=async()=>{
    setBusy(true);setError(null);
    try{const result=await supabase.functions.invoke('growth-trigger-observer',{body:{mode:'run',period}});if(result.error||result.data?.error)throw new Error('unavailable');await load();}
    catch{setError('Não foi possível reavaliar agora. A execução automática e os resultados anteriores podem ser consultados após atualizar.');}
    finally{setBusy(false);}
  };
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const health=state?observationHealth(state.enabled,state.run,state.job,today):'Carregando observação';
  return <details aria-label="Piloto de gatilhos" className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-slate-600">Diagnóstico do piloto de gatilhos · {period}</summary>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <div><h3 className="text-sm font-bold text-slate-900">Piloto de gatilhos · {period}</h3>
        <p className="mt-1 text-xs text-slate-600">{error&&!state?'Monitor indisponível':health} · modo observação</p></div>
      <div className="flex gap-2"><button type="button" onClick={()=>void load()} className="rounded-lg border bg-white px-3 py-2 text-xs">Atualizar</button>
        {state&&['analyst','publisher','admin'].includes(state.role)&&<button type="button" onClick={()=>void rerun()} disabled={busy||!state.enabled} className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-white disabled:opacity-50">{busy?'Avaliando…':'Reavaliar observação'}</button>}</div>
    </div>
    <p className="mt-2 text-xs text-slate-600">Observações determinísticas dos dois recortes. A análise é feita por agente na fila de tarefas; apostas exigem decisão humana.</p>
    {error&&<p role="status" className="mt-2 text-xs text-amber-800">{error}</p>}
    {state?.run&&<details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-slate-700">Ver avaliações e frescor</summary>
      <p className="my-2 text-xs text-slate-500">Dados consultados em {new Date(state.run.data_read_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}. Período avaliado: {period}.</p>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Operação</th><th className="p-2">Métrica</th><th className="p-2">Resultado</th><th className="p-2">Valor / mediana</th></tr></thead>
        <tbody>{state.run.output.performance.map(row=><tr key={row.operation_id+row.family} className="border-t border-slate-200"><td className="p-2">{names[row.operation_id]??row.operation_id}</td><td className="p-2">{row.family==='T1'?'Cartões':'CAC'}</td><td className="p-2">{observationStateLabel(row.state)}</td><td className="p-2">{row.current===null?'—':row.current.toLocaleString('pt-BR',{maximumFractionDigits:2})} / {row.median===null?'—':row.median.toLocaleString('pt-BR',{maximumFractionDigits:2})}</td></tr>)}</tbody></table></div>
      <ul className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">{state.run.output.freshness.map(row=><li key={row.source}>{sources[row.source]??row.source}: {row.latest??'sem data observada'} · {row.state==='triggered'?'atraso acima da tolerância':observationStateLabel(row.state)}</li>)}</ul>
      <p className="mt-2 text-xs text-slate-500">Revisão do certificado: {state.run.output.revision_status==='verified_partner_grain'?'verificada no grão de parceiro':'snapshot não verificável nesta execução'}.</p>
    </details>}
    <button className="mt-3 text-sm text-cyan-800 underline" onClick={()=>openGrowthLearningSection('investigations')}>Abrir fila de tarefas</button>
  </details>;
}
