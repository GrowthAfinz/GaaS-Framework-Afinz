import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronDown,Check,Search} from 'lucide-react';
import type {CountOption} from '../../../modules/sfmc-package/journeyCatalog';
export function JourneyCountSelect({label,value,onChange,options,total,allLabel='Todos',disabled=false,wide=false}:{label:string;value:string;onChange:(value:string)=>void;options:CountOption[];total:number;allLabel?:string;disabled?:boolean;wide?:boolean}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),input=useRef<HTMLInputElement>(null);
 const popup=useRef<HTMLDivElement>(null),[shift,setShift]=useState(0);
 const listId=React.useId(),selected=options.find(o=>o.value===value),display=value?(selected?.label||value):allLabel;
 const items=[{value:'',label:allLabel,count:total},...options].filter(o=>!query||o.label.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
 const displayedCount=selected?.count??(value?0:total);
 useLayoutEffect(()=>{if(!open||!popup.current||!root.current)return;const anchor=root.current.getBoundingClientRect(),box=popup.current.getBoundingClientRect(),ratio=anchor.width/(root.current.offsetWidth||anchor.width)||1;setShift(Math.max(16-anchor.left,Math.min(0,window.innerWidth-16-anchor.left-box.width))/ratio);},[open,wide]);
 const close=()=>{setOpen(false);setQuery('');};
 useEffect(()=>{if(!open)return;input.current?.focus();const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))close();};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open]);
 useEffect(()=>{if(disabled)close();},[disabled]);
 const choose=(v:string)=>{onChange(v);close();trigger.current?.focus();};
 const move=(key:string)=>{const els=[...(root.current?.querySelectorAll<HTMLButtonElement>('[role=option]')||[])];if(!els.length)return;const at=els.indexOf(document.activeElement as HTMLButtonElement);els[key==='Home'?0:key==='End'?els.length-1:(at+(key==='ArrowDown'?1:-1)+els.length)%els.length]?.focus();};
 return <div ref={root} className="relative min-w-0" onBlur={e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))close();}} onKeyDown={e=>{if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();close();trigger.current?.focus();}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&open){e.preventDefault();move(e.key);}}}>
 <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
 <button ref={trigger} type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={open?listId:undefined} disabled={disabled} onClick={()=>setOpen(v=>!v)} className={`flex min-h-[42px] w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600 disabled:bg-slate-100 disabled:text-slate-400 ${value?'border-cyan-200 bg-cyan-50/50 text-slate-800':'border-slate-200 bg-white text-slate-600'}`} title={display}>
 <span className="min-w-0 flex-1 truncate">{display}</span><span aria-label={`${displayedCount} jornadas`} className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-600">{displayedCount}</span><ChevronDown size={13} className="shrink-0"/></button>
 {open&&<div ref={popup} style={{left:shift}} className={`absolute left-0 top-full z-[75] mt-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ${wide?'w-[min(620px,calc(100vw-40px))]':'w-[max(100%,250px)] max-w-[calc(100vw-40px)]'}`}>
 <div className="mb-1 flex items-center gap-2 rounded-lg bg-slate-50 px-2"><Search size={13} className="text-slate-400"/><input ref={input} aria-label={`Buscar ${label}`} value={query} onChange={e=>setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-xs outline-none" placeholder="Buscar…"/></div>
 <div role="listbox" aria-label={label} id={listId} className="max-h-64 overflow-y-auto">{items.map(o=><button type="button" role="option" tabIndex={-1} aria-selected={value===o.value} key={o.value} onClick={()=>choose(o.value)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left text-xs text-slate-700 hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none"><span className="min-w-0 flex-1 break-words">{o.label}</span><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] tabular-nums">{o.count}</span>{value===o.value&&<Check size={13} className="text-cyan-700"/>}</button>)}{!items.length&&<p className="p-3 text-xs text-slate-500">Nenhuma opção neste recorte.</p>}</div></div>}
 </div>;
}
