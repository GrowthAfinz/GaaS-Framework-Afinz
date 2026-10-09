import type { JourneyGraph, JourneyNode, PackageMessage } from './types';
import { normalizeJourney } from './parsePackage';
import type { FrameworkActivity } from '../../utils/communicationOrchestrator';
import { canalToId } from '../../utils/taxonomy';
export const JOURNEY_CHANNELS:Record<string,string>={EMAILV2:'E-mail',SMSSYNC:'SMS',WHATSAPPACTIVITY:'WhatsApp',PUSHNOTIFICATIONACTIVITY:'Push'};
export interface FlowTiming { days:number|null; windows:number|null; path:string[] }
export interface FlowNode extends JourneyNode { col:number;row:number;number?:number;timings:FlowTiming[];pathsLimited?:boolean }
export interface FlowEdge { from:string;to:string;label:string }
export interface FlowLayout { nodes:FlowNode[];edges:FlowEdge[];width:number;height:number }
const duration=(value:unknown):number|null=>value===null||value===undefined||value===''||!Number.isFinite(Number(value))||Number(value)<0?null:Number(value);
/** Tree grid extended to DAG joins. One positioned occurrence per activity key. */
export function layoutJourney(graph:JourneyGraph,compact=false):FlowLayout {
 const by=new Map(graph.nodes.map(n=>[n.key,n]));if(by.size!==graph.nodes.length)throw Error('Chaves de atividade duplicadas no pack.');
 const edges:FlowEdge[]=[],all=[...graph.nodes];
 for(const n of graph.nodes){const outcomes=n.outcomes.length?n.outcomes:[{next:null,key:'exit',label:''}];outcomes.forEach((o,i)=>{const to=o.next||`${n.key}:exit:${i}`;if(!o.next)all.push({key:to,type:'EXIT',name:'Saída',configuration:{},outcomes:[]});else if(!by.has(to))throw Error('Conexão para atividade não exportada: '+to);edges.push({from:n.key,to,label:outcomes.length>1?o.label:''});});}
 const incoming=new Map<string,FlowEdge[]>(),outgoing=new Map<string,FlowEdge[]>();for(const e of edges){incoming.set(e.to,[...(incoming.get(e.to)||[]),e]);outgoing.set(e.from,[...(outgoing.get(e.from)||[]),e]);}
 const remaining=new Map(all.map(n=>[n.key,incoming.get(n.key)?.length||0]));const roots=all.filter(n=>!remaining.get(n.key)).map(n=>n.key),queue=[...roots],order:string[]=[];
 for(let i=0;i<queue.length;i++){const k=queue[i];order.push(k);for(const e of outgoing.get(k)||[]){remaining.set(e.to,remaining.get(e.to)!-1);if(remaining.get(e.to)===0)queue.push(e.to);}}
 if(order.length!==all.length)throw Error('Grafo cíclico: desenho em grade indisponível para esta configuração.');
 let leaf=0;const baseRows=new Map<string,number>();const visit=(key:string,row:number)=>{if(baseRows.has(key)){leaf=Math.max(leaf,row+1);return;}baseRows.set(key,row);const children=outgoing.get(key)||[];if(!children.length)leaf=Math.max(leaf,row+1);children.forEach((e,i)=>visit(e.to,i===0?row:leaf));};roots.forEach(k=>visit(k,leaf));
 const positioned=new Map<string,FlowNode>(),occupied=new Set<string>();const allBy=new Map(all.map(n=>[n.key,n]));
 for(const key of order){const n=allBy.get(key)!,parents=incoming.get(key)||[];const col=parents.length?Math.max(...parents.map(e=>positioned.get(e.from)!.col))+1:0;let row=Math.max(baseRows.get(key)||0,...parents.map(e=>positioned.get(e.from)!.row));while(occupied.has(col+':'+row))row++;occupied.add(col+':'+row);
  let timings:FlowTiming[]=[];let limited=false;
  for(const e of parents){const parent=positioned.get(e.from)!,c=parent.configuration;limited ||= !!parent.pathsLimited;for(const t of parent.timings){let days=t.days,windows=t.windows;const unit={DAYS:1,HOURS:1/24,MINUTES:1/1440}[String(c.waitUnit).toUpperCase() as 'DAYS'];
   if(parent.type==='WAIT'){const wait=duration(c.waitDuration);days=days!==null&&unit!==undefined&&wait!==null&&!c.waitEndDateAttributeExpression?days+wait*unit:null;}
   else if((/WAIT/.test(parent.type)&&parent.type!=='STOWAIT')||parent.type==='PATHOPTIMIZER')days=null;
   if(parent.type==='STOWAIT'){const window=duration(c.params?.slidingWindowHours);windows=windows!==null&&window!==null?windows+window:null;}
   timings.push({days,windows,path:e.label?[...t.path,parent.name+': '+e.label]:t.path});}}
  if(!parents.length)timings=[{days:0,windows:0,path:[]}];
  timings=[...new Map(timings.map(t=>[JSON.stringify(t),t])).values()];if(timings.length>256){timings=timings.slice(0,256).map(t=>({...t,days:null,windows:null}));limited=true;}
  positioned.set(key,{...n,col,row,timings,pathsLimited:limited});
 }
 const nodes=[...positioned.values()];nodes.filter(n=>JOURNEY_CHANNELS[n.type]).sort((a,b)=>a.row-b.row||a.col-b.col).forEach((n,i)=>n.number=i+1);
 return {nodes,edges,width:Math.max(1000,310+(Math.max(...nodes.map(n=>n.col),0)+1)*180),height:Math.max(440,140+(Math.max(...nodes.map(n=>n.row),0)+1)*(compact?115:190))};
}
export function nominalDay(node:FlowNode):string {if(node.pathsLimited||node.timings.some(t=>t.days===null))return 'Dia variável';const days=[...new Set(node.timings.map(t=>Number(t.days!.toFixed(2))))].sort((a,b)=>a-b);return days.length===1?'Dia '+days[0]:'Dias '+days[0]+'–'+days[days.length-1];}
/** Period rows come from the existing reconciliation hook. Never link by template suggestion. */
export function occurrenceExecutions(message:PackageMessage,messages:PackageMessage[],rows:FrameworkActivity[],allTemplate=false,confirmedIds:string[]=[]):FrameworkActivity[] {
 const same=(a:PackageMessage)=>a.activity_name===message.activity_name&&canalToId(a.content.channel)===canalToId(message.content.channel);
 const exact=rows.filter(r=>normalizeJourney(r.jornada||'')===normalizeJourney(message.journey_name)&&r['Activity name / Taxonomia']?.trim()===message.activity_name&&canalToId(r.Canal)===canalToId(message.content.channel)&&!!r.template_id);
 if(!allTemplate&&messages.filter(same).length>1)return [];
 if(!allTemplate)return [...new Map(exact.map(r=>[r.id,r])).values()];
 const ids=new Set([...exact.map(r=>r.template_id),...confirmedIds]);return [...new Map(rows.filter(r=>ids.has(r.template_id)&&canalToId(r.Canal)===canalToId(message.content.channel)).map(r=>[r.id,r])).values()];
}
