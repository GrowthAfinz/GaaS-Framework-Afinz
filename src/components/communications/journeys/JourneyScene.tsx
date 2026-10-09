import React,{memo,useEffect,useState} from 'react';
import {Mail,MessageCircle,MessageSquare,Bell,Clock,GitBranch,LogOut,FilePen,Lightbulb,HelpCircle} from 'lucide-react';
import type {JourneyManifest,MessageMeta} from '../../../modules/sfmc-package/journeyV2';
import {graphPoint,messageFacets} from '../../../modules/sfmc-package/journeyV2';
import {nominalDay,type FlowLayout,type FlowNode} from '../../../modules/sfmc-package/journeyFlow';
import {imageAssetPath} from '../../../utils/communicationVisualResolution';
import {canalToId} from '../../../utils/taxonomy';
import {cachedSignedUrl} from '../../../services/templateContentIndex';
const icons:Record<string,typeof Mail>={EMAILV2:Mail,SMSSYNC:MessageSquare,WHATSAPPACTIVITY:MessageCircle,PUSHNOTIFICATIONACTIVITY:Bell,STOWAIT:Lightbulb,EXIT:LogOut,UPDATECONTACTDATA:FilePen,ENGAGEMENTDECISION:GitBranch,MULTICRITERIADECISION:HelpCircle,RANDOMSPLIT:GitBranch};
export const SceneNode=memo(function SceneNode({n,m,compact,highlight,muted,visible,preparedImage,renditionPath,onOpen}:{preparedImage?:string;renditionPath?:string;n:FlowNode;m?:MessageMeta;compact:boolean;highlight:boolean;muted:boolean;visible:boolean;onOpen:(key:string)=>void}){
 const p=graphPoint(n,compact),wait=/WAIT/.test(n.type),diamond=wait||/DECISION|SPLIT|OPTIMIZER/.test(n.type);
 const Icon=icons[n.type]||(wait?Clock:HelpCircle),color=n.type==='STOWAIT'?'#172554':n.type==='EXIT'?'#84cc16':diamond?'#f59e0b':'#2dd4bf';
 const [image,setImage]=useState<string|null>(null);
 const path=renditionPath||(m?.catalog&&canalToId(m.channel)===canalToId(m.catalog.channel)?imageAssetPath(m.catalog):null);
 const banner=m?.preview_hint.banner;
 useEffect(()=>{let alive=true;setImage(null);if(!visible||compact||!m)return;const load=import('../../../services/journeyRenditions').then(async r=>{const cached=await r.cachedRendition(m);return cached?.url||(path?await cachedSignedUrl(path):banner||null);}).catch(()=>path?cachedSignedUrl(path):banner||null);load.then(v=>{if(alive)setImage(v);}).catch(()=>{});const ready=(e:Event)=>{if((e as CustomEvent).detail?.fingerprint===m.content_fingerprint)import('../../../services/journeyRenditions').then(r=>r.cachedRendition(m)).then(r=>{if(alive&&r)setImage(r.url)}).catch(()=>{});};window.addEventListener('journey-preview-ready',ready);return()=>{alive=false;window.removeEventListener('journey-preview-ready',ready);};},[visible,compact,path,banner,m?.occurrence_key]);
 const moment=m?messageFacets(m).momento[0]:null;
 const label=m?(moment||m.channel):n.type==='EXIT'?nominalDay(n).replace(/^Dia /,'Sai no dia '):n.type==='STOWAIT'?'Einstein STO':n.name.replace(/\s+afz_.*$/i,'');
 const title=m?`${n.number} · ${m.activity_name}`:n.name;
 return <g transform={`translate(${p.x},${p.y})`} opacity={muted?.27:1} data-communication={m?.activity_key}>
 {highlight&&<rect x={-72} y={-38} width={144} height={m&&!compact?168:98} rx={12} fill="#ecfeff" stroke="#0891b2"/>}
 {m&&<text y={-34} textAnchor="middle" fontSize={11} fill="#0e7490">{nominalDay(n)}</text>}
 <g role={m?'button':undefined} tabIndex={m?0:undefined} aria-label={m?`Abrir comunicação ${n.number}: ${m.activity_name}`:undefined} style={{cursor:m?'pointer':'default'}} onClick={m?()=>onOpen(m.activity_key):undefined} onKeyDown={m?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen(m.activity_key);}}:undefined}>
 <title>{title}</title>
 {n.type==='EXIT'?<circle r={21} fill={color}/>:<rect x={-20} y={-20} width={40} height={40} rx={diamond?3:8} fill={color} transform={diamond?'rotate(45)':undefined}/>}
 <Icon x={-11} y={-11} width={22} height={22} color="white"/>
 {n.number&&<><circle cx={25} cy={-25} r={10} fill="#042f2e" stroke="white" strokeWidth={2}/><text x={25} y={-21.5} fontSize={10} textAnchor="middle" fill="white">{n.number}</text></>}
 {m&&m.alerts.some(a=>!a.startsWith('Mesmo af_sub3'))&&<text x={23} y={27} fontSize={14} fill="#b45309">!</text>}
 </g>
 <text y={43} textAnchor="middle" fontSize={11} fill="#334155"><title>{title}</title>{[label.slice(0,23),label.slice(23,46)].filter(Boolean).map((s,i)=><tspan key={i} x={0} dy={i?14:0}>{s}{i===1&&label.length>46?'…':''}</tspan>)}</text>
 {n.type==='STOWAIT'&&<text y={74} textAnchor="middle" fontSize={10} fill="#1e3a8a">até +{n.configuration.params?.slidingWindowHours??'?'}h</text>}
 {!compact&&m&&visible&&<g role="button" tabIndex={0} aria-label={`Ver prévia ${n.number}`} style={{cursor:'pointer'}} onClick={()=>onOpen(m.activity_key)} onKeyDown={e=>{if(e.key==='Enter')onOpen(m.activity_key);}} transform="translate(-24,70)">
 <rect width={48} height={64} rx={5} fill="#fff" stroke="#cbd5e1"/>
 {(preparedImage||image)?<image href={preparedImage||image} x={2} y={2} width={44} height={60} preserveAspectRatio="xMidYMin meet"/>:<><rect x={5} y={7} width={38} height={m.channel==='E-mail'?15:5} rx={2} fill="#ccfbf1"/>{m.preview_hint.text?Array.from({length:6},(_,i)=><text key={i} x={5} y={26+i*5} fontSize={3.5} fill="#334155">{m.preview_hint.text!.slice(i*22,(i+1)*22)}</text>):<Mail x={17} y={27} width={14} height={14} color="#64748b"/>}<text x={24} y={62} fontSize={6} textAnchor="middle" fill="#64748b">{m.channel==='E-mail'?'Sem miniatura':m.channel}</text></>}
 <title>{path?'Miniatura do catálogo':banner?'Banner do pack':'Conteúdo visual disponível ao abrir'}</title></g>}
 </g>;
});
export const JourneyScene=memo(function JourneyScene({manifest,layout,messages,compact,focus,matches,bounds,images,onOpen}:{images?:Map<string,string>;manifest:JourneyManifest;layout:FlowLayout;messages:MessageMeta[];compact:boolean;focus:Set<string>;matches:Set<string>|null;bounds:{left:number;top:number;right:number;bottom:number};onOpen:(key:string)=>void}){
 const by=new Map(messages.map(m=>[m.activity_key,m])),nodes=new Map(layout.nodes.map(n=>[n.key,n]));
 const entry=manifest.graph.entry;
 return <svg data-journey-scene xmlns="http://www.w3.org/2000/svg" width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} style={{fontFamily:'Arial,sans-serif',overflow:'visible'}}>
 <rect width={layout.width} height={layout.height} fill="white"/>
 {layout.edges.map((e,i)=>{const a=graphPoint(nodes.get(e.from)!,compact),b=graphPoint(nodes.get(e.to)!,compact),active=focus.has(e.from)&&focus.has(e.to),mid=a.x+65;return <g key={i}><path d={`M${a.x+22} ${a.y}H${mid}V${b.y}H${b.x-22}`} fill="none" stroke={active?'#0891b2':'#cbdced'} strokeWidth={active?3:2}/>{e.label&&<><rect x={mid+2} y={b.y-15} width={Math.min(114,e.label.length*6+10)} height={16} rx={3} fill="#f1f5f9"/><text x={mid+6} y={b.y-3} fontSize={10} fill="#64748b"><title>{e.label}</title>{e.label.slice(0,18)}</text></>}</g>})}
 <g transform="translate(18,24)"><rect width={190} height={280} rx={8} fill="white" stroke="#cbd5e1"/><circle cx={95} cy={36} r={24} fill="#84cc16"/><FilePen x={83} y={24} width={24} height={24} color="white"/>
 <text x={95} y={82} textAnchor="middle" fontSize={11} fill="#64748b">EXTENSÃO DE DADOS</text><text x={95} y={105} textAnchor="middle" fontSize={11} fill="#334155"><title>{entry.de?.name}</title>{String(entry.de?.name||'Não vem no pack').slice(0,26)}</text>
 <text x={95} y={141} textAnchor="middle" fontSize={10} fill="#64748b">FILTRO</text><text x={95} y={162} textAnchor="middle" fontSize={10} fill="#334155"><title>{entry.trigger?.description}</title>{String(entry.trigger?.description||'Não informado').slice(0,29)}</text>
 <text x={95} y={205} textAnchor="middle" fontSize={10} fill="#64748b">AGENDAMENTO / REENTRADA</text><text x={95} y={225} textAnchor="middle" fontSize={10} fill="#334155">{entry.event?.metaData?.scheduleFlowMode==='runOnce'?'Ao publicar':'Ver configuração do pack'}</text><text x={95} y={247} textAnchor="middle" fontSize={10} fill="#334155">{entry.entryMode==='MultipleEntries'?'Reentrada permitida':entry.entryMode?'Reentrada conforme pack':'Não informado'}</text></g>
 {layout.nodes.filter(n=>n.col===0).map(n=>{const p=graphPoint(n,compact);return <path key={'entry'+n.key} d={`M208 ${p.y}H${p.x-22}`} stroke="#cbdced" strokeWidth={2}/>})}
 {layout.nodes.map(n=>{const p=graphPoint(n,compact);return <SceneNode key={n.key} n={n} m={by.get(n.key)} compact={compact} highlight={focus.has(n.key)} muted={!!matches&&!!by.get(n.key)&&!matches.has(n.key)&&!focus.has(n.key)} preparedImage={images?.get(n.key)} renditionPath={manifest.renditions?.[n.key]?.thumbnail_path} visible={p.x>bounds.left-200&&p.x<bounds.right+200&&p.y>bounds.top-200&&p.y<bounds.bottom+200} onOpen={onOpen}/>})}
 </svg>;
});
