import type {JourneyGraph,PackageMessage} from './types';
import type {CommunicationTemplate} from '../../types/communication';
import type {FrameworkActivity} from '../../utils/communicationOrchestrator';
import {emptyFacets,facetsFromRecords,tagsFor,canonFacet,facetNorm,type ScopeFacets,type FacetKey} from '../../utils/contentPerformanceModel';
import {parseSeq,formatSeq,canalToId} from '../../utils/taxonomy';
import type {FlowLayout} from './journeyFlow';
export interface MessageMeta {
 journey_name?:string; snapshot_id:string; occurrence_key:string; activity_key:string; activity_name:string; channel:string;
 asset_id:string|null;asset_name:string|null;observed_template_id:string|null;is_optout:boolean;
 content_fingerprint:string;alerts:string[];paths:PackageMessage['paths'];tracking:PackageMessage['utm'];link_url:string|null;
 preview_hint:{text:string|null;banner:string|null;subject:string|null;has_html:boolean};
 catalog:CommunicationTemplate|null;contexts:FrameworkActivity[];review_context:Record<string,unknown>|null;
}
export interface JourneyIndexItem {id:string;import_id:string;reference:string;journey_name:string;journey_version:number;created_at:string;messages:MessageMeta[]}
export interface JourneyManifest extends Omit<JourneyIndexItem,'messages'>{graph:JourneyGraph;renditions?:Record<string,{full_path:string;thumbnail_path:string;content_fingerprint:string;width:number;height:number;warnings:string[];source:string}>}
export interface JourneyReuse {snapshot_id:string;occurrence_key:string;activity_key:string;journey_name:string;journey_version:number;activity_name:string;channel:string;asset_name:string|null;observed_template_id:string|null;evidence:'exact_content'|'template_id'|'shared_asset'}
export type JourneyScopeMessage=Pick<MessageMeta,'contexts'|'catalog'|'review_context'|'channel'|'observed_template_id'|'journey_name'>;
export interface JourneyDirectoryItem extends Omit<JourneyIndexItem,'messages'>{messages:JourneyScopeMessage[]}
export function messageFacets(m:JourneyScopeMessage):ScopeFacets {
 const f=facetsFromRecords(m.contexts||[]);
 const catalog=m.catalog||({template_id:m.observed_template_id||'',channel:m.channel,metadata:{}} as CommunicationTemplate);
 const enriched={...catalog,metadata:{...catalog.metadata,resolved_context:m.review_context||catalog.metadata?.resolved_context}};
 for(const tag of tagsFor(enriched,[]))if(!f[tag.key].length)f[tag.key]=[tag.value];
 const ctx=m.review_context;
 if(ctx){for(const [key,source] of [['frente','front'],['parceiro','partner'],['segmento','segment'],['subgrupo','subgroup'],['oferta','offer'],['promocional','campaign']] as [FacetKey,string][]){if(!f[key].length&&ctx[source])f[key]=[canonFacet(key,ctx[source])];}}
 if(ctx?.order){const seq=parseSeq(String(ctx.order));if(seq)f.momento=[formatSeq(seq)];}f.canal=[canonFacet('canal',m.channel)];return navigationFacets(m,f);
}
export const ALL_AUDIENCES='__all__';
export const PENDING_FRONT='Classificação pendente';
export const PENDING_SEGMENT='Segmento não identificado';
export const UNKNOWN_AUDIENCE='Público não identificado';
export function canonicalAudience(value:unknown):string {
 const raw=String(value??'').trim(),key=facetNorm(raw);
 if(!raw||['na','none','null','naoidentificado','origemnaoinformada'].includes(key)||raw==='—'||raw==='-')return '';
 if(['proprietaria','propria','propri','institucional','interno','interna'].includes(key))return 'Institucional';
 return ({bembarato:'Bem Barato',dia:'Dia',serasa:'Serasa',acordocerto:'Acordo Certo',bompracredito:'Bom Pra Crédito'} as Record<string,string>)[key]||raw.replace(/_/g,' ');
}
function canonicalFront(value:string){const key=facetNorm(value);return ({b2c:'B2C',b2b2c:'B2B2C',plurix:'Plurix',plx:'Plurix',plu:'Plurix',seguros:'Seguros'} as Record<string,string>)[key]||value;}
/** Pack identity is a fallback for navigation, never evidence of a historical delivery. */
export function packClassification(name=''):{front:string;partner:string;segment:string}{
 const tokens=name.toUpperCase().split('_');
 const pos=tokens[0]==='JOR'&&['AQS','AQUISICAO'].includes(tokens[1])?2:-1;
 const token=pos<0?'':tokens[pos],front=({B2C:'B2C',B2B2C:'B2B2C',PLURIX:'Plurix',PLX:'Plurix',PLU:'Plurix',BB:'B2B2C',DIA:'B2B2C'} as Record<string,string>)[token]||'';
 const partner=front==='Plurix'?'N/A':token==='BB'||(token==='B2B2C'&&tokens[pos+1]==='BB')?'Bem Barato':token==='DIA'||(token==='B2B2C'&&tokens[pos+1]==='DIA')?'Dia':front==='B2C'&&tokens[pos+1]==='PROPRI'?'Institucional':'';
 const segment=/(?:^|_)(ABD|CARRINHO(?:21D)?)(?:_|$)/.test(name.toUpperCase())?'Abandonados':/(?:^|_)NGD(?:_|$)/.test(name.toUpperCase())?'Negados':/(?:^|_)ANC(?:_|$)/.test(name.toUpperCase())?'Aprovados não convertidos':/(?:^|_)CRM(?:_|$)/.test(name.toUpperCase())?'CRM':/(?:^|_)(BP|BSP)(?:_|$)/.test(name.toUpperCase())?'Base proprietária':'';
 return {front,partner,segment:segment?canonFacet('segmento',segment):''};
}
function navigationFacets(m:JourneyScopeMessage,f:ScopeFacets):ScopeFacets {
 const pack=packClassification(m.journey_name);
 f.frente=[...new Set(f.frente.map(canonicalFront))];
 const review=(m.review_context||m.catalog?.metadata?.resolved_context) as Record<string,unknown>|undefined;
 const explicitFront=facetsFromRecords(m.contexts||[]).frente.length||review?.front;
 if(!explicitFront&&pack.front)f.frente=[pack.front];
 if(!f.segmento.length&&pack.segment)f.segmento=[pack.segment];
 const reviewed=canonicalAudience(review?.partner);
 // A reviewed message can target Serasa inside a pack whose historical rows say Proprietaria.
 // That changes message navigation only; its executions are still filtered from their own fields.
 f.parceiro=reviewed?[reviewed]:[...new Set(f.parceiro.map(canonicalAudience).filter(Boolean))];
 if(!f.parceiro.length){const id=m.observed_template_id||'';
 const token=/(?:^|_)(srsa|serasa|ecred)(?:_|$)/i.test(id)?'Serasa':/(?:^|_)(inst|institucional|aint|propri)(?:_|$)/i.test(id)?'Institucional':'';
 if(token||pack.partner)f.parceiro=[token||pack.partner];}
 if(f.frente.length===1&&f.frente[0]==='Plurix')f.parceiro=['N/A'];
 return f;
}
export function parseJourneyContext(key:string):{front:string;audience:string}{
 try{const pair=JSON.parse(key);if(!Array.isArray(pair)||pair.length!==2)return {front:'',audience:''};
 return {front:pair[0]==='Sem classificação'?PENDING_FRONT:canonicalFront(String(pair[0])),audience:pair[1]===ALL_AUDIENCES?ALL_AUDIENCES:canonicalAudience(pair[1])||UNKNOWN_AUDIENCE};}catch{return {front:'',audience:''};}
}
export function contextKey(f:ScopeFacets):string[]{
 const fronts=f.frente.length?f.frente:[PENDING_FRONT];
 return fronts.flatMap(front=>(front==='Plurix'?['N/A']:f.parceiro.length?f.parceiro:[UNKNOWN_AUDIENCE]).map(partner=>JSON.stringify([front,partner])));
}
/** Preserve observed BU/partner pairs; do not invent a Cartesian product across historical rows. */
export function messageContextKeys(m:JourneyScopeMessage):string[]{
 return [...new Set((m.contexts?.length?m.contexts.map(r=>({...m,contexts:[r]})):[m]).flatMap(row=>contextKey(messageFacets(row))))];
}
export function needsClassification(m:JourneyScopeMessage){const f=messageFacets(m);return !f.frente.length||!f.segmento.length||(f.frente.some(v=>v!=='Plurix')&&!f.parceiro.length);}
export function contextLabel(key:string){const {front,audience}=parseJourneyContext(key);return front===PENDING_FRONT?PENDING_FRONT:`${front} · ${front==='Plurix'?'N/A':audience===ALL_AUDIENCES?(front==='B2C'?'Todos os públicos':'Todos os parceiros'):audience}`;}
function matchesSegment(f:ScopeFacets,segment:string){return !segment||(segment===PENDING_SEGMENT||segment==='Sem classificação'?!f.segmento.length:f.segmento.some(v=>facetNorm(v)===facetNorm(canonFacet('segmento',segment))));}
export function matchesContext(m:JourneyScopeMessage,context:string,segment:string){
 const f=messageFacets(m),want=parseJourneyContext(context);
 const match=!context||(want.front===PENDING_FRONT?needsClassification(m):messageContextKeys(m).some(key=>{const pair=parseJourneyContext(key);return pair.front===want.front&&(want.front==='Plurix'||want.audience===ALL_AUDIENCES||pair.audience===want.audience);}));
 return match&&matchesSegment(f,segment);
}
/** Historical results never inherit the selected message's review or pack-based fallback. */
export function executionMatchesContext(r:FrameworkActivity,context:string,segment:string){
 const f=facetsFromRecords([r]),want=parseJourneyContext(context);
 if(!matchesSegment(f,segment))return false;
 if(!context||want.front===PENDING_FRONT)return true;
 if(!f.frente.map(canonicalFront).includes(want.front))return false;
 return want.front==='Plurix'||want.audience===ALL_AUDIENCES||(want.audience===UNKNOWN_AUDIENCE?!f.parceiro.length:f.parceiro.map(canonicalAudience).includes(want.audience));
}
export function classificationSources(m:JourneyScopeMessage):string[]{
 const sources:string[]=[];const raw=facetsFromRecords(m.contexts||[]),pack=packClassification(m.journey_name);
 if(m.review_context||m.catalog?.metadata?.resolved_context)sources.push('Revisão do pack');
 if(m.contexts?.length)sources.push('Classificação dos disparos históricos');
 if(m.observed_template_id)sources.push('Template ID / catálogo');
 if((!raw.frente.length&&pack.front)||(!raw.segmento.length&&pack.segment)||(!raw.parceiro.length&&pack.partner))sources.push('Identificação no nome da jornada');
 return sources.length?sources:['Classificação pendente'];
}
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
