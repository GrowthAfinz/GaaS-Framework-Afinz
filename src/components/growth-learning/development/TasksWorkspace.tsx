import React,{useEffect,useState} from 'react';
import {GrowthInvestigations} from '../investigations/GrowthInvestigations';
import {DevelopmentBacklog} from './DevelopmentBacklog';
export function readTaskView(search:string):'development'|'investigations'{const p=new URLSearchParams(search);return p.has('dev_task')?'development':p.get('task_view')==='investigations'||p.has('item')?'investigations':'development';}
export function TasksWorkspace({initialMonth}:{initialMonth:string}){
 const [view,setView]=useState(()=>readTaskView(location.search));
 useEffect(()=>{const sync=()=>setView(readTaskView(location.search));window.addEventListener('popstate',sync);return()=>window.removeEventListener('popstate',sync);},[]);
 const select=(next:'development'|'investigations')=>{const p=new URLSearchParams(location.search);p.set('task_view',next);p.delete('item');p.delete('dev_task');window.history.pushState({},'',location.pathname+'?'+p+location.hash);window.dispatchEvent(new PopStateEvent('popstate'));};
 return <div className="space-y-4"><nav aria-label="Tipos de tarefas" className="flex flex-wrap gap-2">{([['development','Desenvolvimento do GaaS'],['investigations','Investigações CRM']] as const).map(([k,v])=><button key={k} type="button" aria-pressed={view===k} onClick={()=>select(k)} className={'rounded-lg border px-4 py-2 text-sm font-semibold '+(view===k?'border-cyan-700 bg-cyan-50 text-cyan-900':'border-slate-200 bg-white text-slate-600')}>{v}</button>)}</nav>{view==='development'?<DevelopmentBacklog/>:<GrowthInvestigations initialMonth={initialMonth}/>}</div>;
}
