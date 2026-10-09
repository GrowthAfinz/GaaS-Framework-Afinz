import type {JourneyGraph,PackageMessage} from './types';
import type {CommunicationTemplate} from '../../types/communication';
import type {FrameworkActivity} from '../../utils/communicationOrchestrator';
import {emptyFacets,facetsFromRecords,tagsFor,canonFacet,type ScopeFacets,type FacetKey} from '../../utils/contentPerformanceModel';
import {parseSeq,formatSeq,canalToId} from '../../utils/taxonomy';
import type {FlowLayout} from './journeyFlow';
export interface MessageMeta {
 snapshot_id:string; occurrence_key:string; activity_key:string; activity_name:string; channel:string;
 asset_id:string|null;asset_name:string|null;observed_template_id:string|null;is_optout:boolean;
 content_fingerprint:string;alerts:string[];paths:PackageMessage['paths'];tracking:PackageMessage['utm'];link_url:string|null;
 preview_hint:{text:string|null;banner:string|null;subject:string|null;has_html:boolean};
 catalog:CommunicationTemplate|null;contexts:FrameworkActivity[];review_context:Record<string,unknown>|null;
}
export interface JourneyIndexItem {id:string;import_id:string;reference:string;journey_name:string;journey_version:number;created_at:string;messages:MessageMeta[]}
export interface JourneyManifest extends Omit<JourneyIndexItem,'messages'>{graph:JourneyGraph;renditions?:Record<string,{full_path:string;thumbnail_path:string;content_fingerprint:string;width:number;height:number;warnings:string[];source:string}>}
export interface JourneyReuse {snapshot_id:string;occurrence_key:string;activity_key:string;journey_name:string;journey_version:number;activity_name:string;channel:string;asset_name:string|null;observed_template_id:string|null;evidence:'exact_content'|'template_id'|'shared_asset'}
export function messageFacets(m:MessageMeta):ScopeFacets {
 const f=facetsFromRecords(m.contexts||[]);
 const catalog=m.catalog||({template_id:m.observed_template_id||'',channel:m.channel,metadata:{}} as CommunicationTemplate);
 const enriched={...catalog,metadata:{...catalog.metadata,resolved_context:m.review_context||catalog.metadata?.resolved_context}};
 for(const tag of tagsFor(enriched,[]))if(!f[tag.key].length)f[tag.key]=[tag.value];
 const ctx=m.review_context;
 if(ctx){for(const [key,source] of [['frente','front'],['parceiro','partner'],['segmento','segment'],['subgrupo','subgroup'],['oferta','offer'],['promocional','campaign']] as [FacetKey,string][]){if(!f[key].length&&ctx[source])f[key]=[canonFacet(key,ctx[source])];}}
 if(ctx?.order){const seq=parseSeq(String(ctx.order));if(seq)f.momento=[formatSeq(seq)];}f.canal=[canonFacet('canal',m.channel)];return f;
}
export function contextKey(f:ScopeFacets):string[]{
 const fronts=f.frente.length?f.frente:['Sem classificação'];const partners=f.parceiro.length?f.parceiro:['Origem não informada'];
 return fronts.flatMap(front=>partners.map(partner=>JSON.stringify([front,partner])));
}
export function contextLabel(key:string){const [front,partner]=JSON.parse(key) as string[];return partner==='Origem não informada'?front:`${front} · ${partner}`;}
export function matchesContext(m:MessageMeta,context:string,segment:string){const f=messageFacets(m);return (!context||contextKey(f).includes(context))&&(!segment||f.segmento.includes(segment));}
export function manifestMessages(ms:MessageMeta[]):PackageMessage[]{return ms.map(m=>({activity_name:m.activity_name,activity_key:m.activity_key,content:{channel:m.channel}} as PackageMessage));}
export function graphPoint(n:{col:number;row:number},compact:boolean){return {x:300+n.col*180,y:70+n.row*(compact?115:190)};}
export function fitViewport(layout:FlowLayout,width:number,height:number,compact:boolean){
 if(width<=0||height<=0)return {scale:1,x:0,y:0};
 const maxX=Math.max(210,...layout.nodes.map(n=>graphPoint(n,compact).x+80));
 const maxY=Math.max(350,...layout.nodes.map(n=>graphPoint(n,compact).y+(n.number&&!compact?130:70)));
 const scale=Math.min(2,Math.max(.08,Math.min((width-48)/(maxX+24),(height-48)/(maxY+24))));
 return {scale,x:(width-(maxX+24)*scale)/2,y:(height-(maxY+24)*scale)/2};
}
export function relatedPath(layout:FlowLayout,key:string):Set<string>{
 const seen=new Set<string>([key]);const walk=(k:string,up:boolean)=>{for(const e of layout.edges){if((up?e.to:e.from)!==k)continue;const next=up?e.from:e.to;if(seen.has(next))continue;seen.add(next);walk(next,up);}};walk(key,true);walk(key,false);return seen;
}
