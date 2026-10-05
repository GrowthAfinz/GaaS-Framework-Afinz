import { useEffect, useState } from 'react';
import { appendRetrospective, fetchRetrospectives } from './resultsService';
import { ResultRetrospective, ResultsDomain, ResultsScope } from './results.types';
type Draft={observation:string;interpretation:string;learning:string;next_action:string;evidence:string};
const empty:Draft={observation:'',interpretation:'',learning:'',next_action:'',evidence:''};
export function ResultRetrospectivePanel({domain,scope,month,canWrite,sourceSnapshot}:{domain:ResultsDomain;scope:ResultsScope;month:string;canWrite:boolean;sourceSnapshot:Record<string,unknown>}){
  const [history,setHistory]=useState<ResultRetrospective[]>([]),[draft,setDraft]=useState<Draft>(empty);
  const [loading,setLoading]=useState(true),[editing,setEditing]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{let cancelled=false;setLoading(true);setError('');
    fetchRetrospectives(domain,scope,month).then(rows=>{if(!cancelled)setHistory(rows);}).catch(e=>{if(!cancelled)setError(e.message);}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[domain,scope,month,retry]);
  const latest=history[0];
  const edit=()=>{setDraft(latest?{observation:latest.observation,interpretation:latest.interpretation,learning:latest.learning,next_action:latest.next_action,evidence:latest.evidence}:empty);setEditing(true);};
  const save=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError('');
    try{await appendRetrospective(domain,scope,month,latest?.revision||0,draft,sourceSnapshot);setEditing(false);setRetry(r=>r+1);}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar.');}
    finally{setSaving(false);}
  };
  const labels:Record<keyof Draft,string>={observation:'O que mudou?',interpretation:'O que pode explicar a mudança? Separe fatos de hipóteses.',learning:'Aprendizado registrado — o que ainda precisa de validação?',next_action:'Próxima ação, responsável, prazo e como verificar',evidence:'Evidências e referências'};
  const hints:Record<keyof Draft,string>={observation:'Compare com o mês anterior no mesmo recorte. O que aumentou, caiu ou ficou estável?',interpretation:'Qual contexto foi comprovado? Que explicações ainda são hipóteses?',learning:'O que a evidência permite afirmar e qual verificação falta?',next_action:'Defina ação, responsável, prazo e critério para verificar o resultado.',evidence:'Inclua links de notas, comunicações, campanhas e resultados que sustentam a leitura.'};
  return <section id="resultados-retrospectiva" className="rounded-2xl border border-cyan-100 bg-white p-5" aria-label="Retrospectiva mensal">
    <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-slate-900">Retrospectiva · {month}</h3>{latest&&<span className="text-xs text-slate-500">v{latest.revision}</span>}</div>
    <p className="mt-2 text-xs text-slate-500">Interpretar → decidir → verificar. Este registro operacional não equivale a aprendizado validado pelo loop.</p>
    {loading?<p role="status" className="mt-4 text-sm text-slate-500">Carregando retrospectiva…</p>:editing?<form onSubmit={e=>void save(e)} className="mt-4 space-y-3">
      {(Object.keys(labels) as (keyof Draft)[]).map(key=><label key={key} className="block text-xs font-semibold text-slate-600">{labels[key]}<textarea required={key!=='interpretation'} minLength={3} maxLength={8000} rows={3} placeholder={hints[key]} value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm font-normal focus:outline-cyan-600"/></label>)}
      <div className="flex gap-2"><button disabled={saving} className="rounded-lg bg-cyan-800 px-4 py-2 text-sm font-bold text-white">{saving?'Salvando…':'Salvar nova versão'}</button><button type="button" disabled={saving} onClick={()=>setEditing(false)} className="text-sm text-slate-600">Cancelar</button></div>
    </form>:latest?<div className="mt-4 space-y-3">{(Object.keys(labels) as (keyof Draft)[]).map(key=><div key={key}><h4 className="text-xs font-bold text-slate-500">{labels[key]}</h4><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{latest[key]||'Não registrado'}</p></div>)}<p className="text-xs text-slate-400">Registrada em {new Date(latest.created_at).toLocaleString('pt-BR')}</p></div>:<p className="mt-4 text-sm text-slate-600">Ainda não há retrospectiva deste mês e recorte. A evolução acima é a evidência inicial; interpretação e decisão precisam ser registradas.</p>}
    {error&&<p role="alert" className="mt-3 text-sm text-red-700">{error} <button type="button" onClick={()=>setRetry(r=>r+1)} className="underline">Recarregar versões</button></p>}
    {!loading&&!editing&&canWrite&&!error&&<button type="button" onClick={edit} className="mt-4 rounded-lg border border-cyan-200 px-3 py-2 text-sm font-semibold text-cyan-800">{latest?'Revisar retrospectiva':'Registrar retrospectiva'}</button>}
    {history.length>1&&<details className="mt-4"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Histórico de versões · últimas {history.length}</summary>{history.slice(1).map(item=><div key={item.id} className="mt-3 border-t pt-3 text-xs text-slate-600"><strong>v{item.revision} · {new Date(item.created_at).toLocaleString('pt-BR')}</strong><p className="mt-1 whitespace-pre-wrap">{item.observation}</p><p className="mt-1 whitespace-pre-wrap">Aprendizado: {item.learning}</p><p className="mt-1 whitespace-pre-wrap">Próxima ação: {item.next_action}</p></div>)}</details>}
  </section>;
}

