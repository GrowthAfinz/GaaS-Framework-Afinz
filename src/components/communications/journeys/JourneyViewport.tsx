import React,{forwardRef,useImperativeHandle,useRef,useState,useEffect,useCallback} from 'react';
import {ZoomIn,ZoomOut,Scan,LocateFixed} from 'lucide-react';
import {JourneyScene} from './JourneyScene';
import type {JourneyManifest,MessageMeta} from '../../../modules/sfmc-package/journeyV2';
import {fitViewport,graphPoint} from '../../../modules/sfmc-package/journeyV2';
import type {FlowLayout} from '../../../modules/sfmc-package/journeyFlow';
export interface ViewportHandle {svg:()=>SVGSVGElement|null;focus:(key:string)=>void;fit:()=>void}
export const JourneyViewport=forwardRef<ViewportHandle,{manifest:JourneyManifest;layout:FlowLayout;messages:MessageMeta[];compact:boolean;focus:Set<string>;matches:Set<string>|null;onOpen:(key:string)=>void}>(function JourneyViewport(props,ref){
 const outer=useRef<HTMLDivElement>(null),inner=useRef<HTMLDivElement>(null),transform=useRef({scale:.7,x:0,y:0});
 const [view,setView]=useState(transform.current),[size,setSize]=useState({w:1,h:1});
 const drag=useRef<{x:number;y:number;tx:number;ty:number;moved:boolean}|null>(null),wheelTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const paint=useCallback(()=>{const t=transform.current;if(inner.current)inner.current.style.transform=`translate(${t.x}px,${t.y}px) scale(${t.scale})`;},[]);
 const commit=useCallback(()=>{paint();setView({...transform.current});},[paint]);
 const fit=useCallback(()=>{if(!outer.current)return;transform.current=fitViewport(props.layout,outer.current.clientWidth,outer.current.clientHeight,props.compact);commit();},[props.layout,props.compact,commit]);
 useEffect(()=>{fit();},[props.manifest.id,props.compact,fit]);
 useEffect(()=>{const el=outer.current;if(!el)return;const observer=new ResizeObserver(()=>setSize({w:el.clientWidth,h:el.clientHeight}));observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>{if(wheelTimer.current)clearTimeout(wheelTimer.current);},[]);
 const zoom=(delta:number,px=size.w/2,py=size.h/2)=>{const t=transform.current,next=Math.max(.08,Math.min(2.5,t.scale*delta)),factor=next/t.scale;transform.current={scale:next,x:px-(px-t.x)*factor,y:py-(py-t.y)*factor};commit();};
 useImperativeHandle(ref,()=>({svg:()=>inner.current?.querySelector('svg[data-journey-scene]')||null,fit,focus:key=>{const n=props.layout.nodes.find(n=>n.key===key);if(!n)return;const p=graphPoint(n,props.compact),s=transform.current.scale;transform.current={scale:s,x:size.w/2-p.x*s,y:size.h/2-p.y*s};commit();}}),[fit,props.layout,props.compact,size,commit]);
 useEffect(()=>{const el=outer.current;if(!el)return;const handler=(e:WheelEvent)=>{e.preventDefault();const r=el.getBoundingClientRect(),t=transform.current;if(e.ctrlKey||e.metaKey){const next=Math.max(.08,Math.min(2.5,t.scale*(e.deltaY<0?1.1:1/1.1))),factor=next/t.scale,px=e.clientX-r.left,py=e.clientY-r.top;transform.current={scale:next,x:px-(px-t.x)*factor,y:py-(py-t.y)*factor};}else transform.current={...t,x:t.x-e.deltaX,y:t.y-e.deltaY};paint();if(wheelTimer.current)clearTimeout(wheelTimer.current);wheelTimer.current=setTimeout(commit,90);};el.addEventListener('wheel',handler,{passive:false});return()=>el.removeEventListener('wheel',handler);},[paint,commit]);
 const bounds={left:-view.x/view.scale,top:-view.y/view.scale,right:(size.w-view.x)/view.scale,bottom:(size.h-view.y)/view.scale};
 return <div className="relative min-h-0 flex-1 overflow-hidden bg-white" ref={outer} data-journey-viewport>
 <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-lg border bg-white/95 p-1 shadow-sm"><button aria-label="Diminuir zoom" onClick={()=>zoom(.8)} className="rounded p-2 hover:bg-slate-100"><ZoomOut size={16}/></button><span className="w-12 text-center text-xs">{Math.round(view.scale*100)}%</span><button aria-label="Aumentar zoom" onClick={()=>zoom(1.25)} className="rounded p-2 hover:bg-slate-100"><ZoomIn size={16}/></button><button onClick={fit} className="flex items-center gap-1 rounded px-2 py-2 text-xs hover:bg-slate-100"><Scan size={16}/>Enquadrar fluxo</button></div>
 <div className="absolute inset-0 touch-none" aria-label="Canvas da jornada" onPointerDown={e=>{if((e.target as Element).closest('[data-communication]'))return;drag.current={x:e.clientX,y:e.clientY,tx:transform.current.x,ty:transform.current.y,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}}
 onPointerMove={e=>{const d=drag.current;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(Math.abs(dx)+Math.abs(dy)>4)d.moved=true;transform.current={...transform.current,x:d.tx+dx,y:d.ty+dy};paint();}}
 onPointerUp={()=>{if(drag.current){drag.current=null;commit();}}} onPointerCancel={()=>{drag.current=null;commit();}}
>
 <div ref={inner} className="absolute left-0 top-0 origin-top-left will-change-transform"><JourneyScene {...props} bounds={bounds}/></div>
 </div>
 <div className="pointer-events-none absolute bottom-3 left-3 rounded bg-white/90 px-3 py-1 text-[11px] text-slate-500">Arraste para navegar · Ctrl + rolagem para zoom · clique para ler</div>
 </div>;
});
