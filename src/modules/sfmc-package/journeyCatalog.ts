import type {JourneyDirectoryItem,JourneyScopeMessage,MessageMeta} from './journeyV2';
import {ALL_AUDIENCES,PENDING_FRONT,PENDING_SEGMENT,UNKNOWN_AUDIENCE,messageFacets,messageContextKeys,matchesContext,executionMatchesContext,parseJourneyContext,canonicalAudience} from './journeyV2';
import {facetsFromRecords,facetNorm,matchesFacets,type FacetKey,type FacetFilters} from '../../utils/contentPerformanceModel';
import type {FrameworkActivity} from '../../utils/communicationOrchestrator';
import {versionsForJourney} from './journeyNavigation';
import {saoPauloDay} from '../../utils/saoPauloPeriod';
export type HistoryContext=FrameworkActivity & {last_activity_at?:string|null;period_records?:number;has_linked?:boolean;has_unlinked?:boolean};
export interface CatalogFilters {context:string;segment:string;facets:FacetFilters;search:string;status:string;onlyActive:boolean}
export interface CatalogScope {bus:string[];global:Record<string,any>}
export interface CatalogRow {name:string;versions:JourneyDirectoryItem[];latest:JourneyDirectoryItem;lastActivity:string|null;groups:string[];groupDates:Record<string,string|null>}
export const EMPTY_CATALOG_FILTERS:CatalogFilters={context:'',segment:'',facets:{},search:'',status:'all',onlyActive:false};
const normJourney=(v:string)=>v.trim().toUpperCase().replace(/^JOR_AQUISICAO_/,'JOR_AQS_');
export const dateLabel=(v:string|null|undefined)=>v?saoPauloDay(v).split('-').reverse().join('/'):'Sem atividade registrada';
const equal=(key:string,a:string,b:string)=>facetNorm(key==='parceiro'?canonicalAudience(a):a)===facetNorm(key==='parceiro'?canonicalAudience(b):b);
function globalMatches(f:ReturnType<typeof messageFacets>,name:string,scope:CatalogScope){
 if(!scope.bus.length||f.frente.length&&!f.frente.some(v=>scope.bus.includes(v)))return false;
 for(const [key,values] of [['canal',scope.global.canais],['segmento',scope.global.segmentos],['parceiro',scope.global.parceiros],['subgrupo',scope.global.subgrupos]] as [FacetKey,string[]][])
  if(values?.length&&!values.some(v=>f[key].some(a=>equal(key,a,v))))return false;
 return !scope.global.jornadas?.length||scope.global.jornadas.some((n:string)=>normJourney(n)===normJourney(name));
}
export function recordInCatalogScope(r:FrameworkActivity,m:JourneyScopeMessage,filters:CatalogFilters,scope:CatalogScope){
 const f=facetsFromRecords([r]);f.momento=messageFacets(m).momento;
 return scope.bus.includes(r.BU||'')&&globalMatches(f,r.jornada||m.journey_name||'',scope)&&executionMatchesContext(r,filters.context,filters.segment)&&matchesFacets(f,filters.facets);
}
function history(m:JourneyScopeMessage,filters:CatalogFilters,scope:CatalogScope):HistoryContext[]{
 return (m.contexts||[]).filter(r=>recordInCatalogScope(r,m,filters,scope)) as HistoryContext[];
}
export function catalogMessageMatches(m:JourneyScopeMessage,name:string,filters:CatalogFilters,scope:CatalogScope){
 if(m.contexts.length>1)return m.contexts.some(r=>catalogMessageMatches({...m,contexts:[r]},name,filters,scope));
 const f=messageFacets(m);
 if(!globalMatches(f,name,scope)||!matchesContext(m,filters.context,filters.segment)||!matchesFacets(f,filters.facets))return false;
 if(filters.search&&!([name,m.activity_name,m.observed_template_id].join(' ').toLocaleLowerCase('pt-BR').includes(filters.search.trim().toLocaleLowerCase('pt-BR'))))return false;
 const rows=history(m,filters,scope);
 if(filters.onlyActive&&!rows.some(r=>Number(r.period_records)>0))return false;
 if(filters.status==='no_id'&&m.observed_template_id)return false;
 if(filters.status==='linked'&&!rows.some(r=>r.has_linked))return false;
 if(filters.status==='unlinked'&&!rows.some(r=>r.has_unlinked))return false;
 return true;
}
export const scopeMessages=(j:JourneyDirectoryItem):JourneyScopeMessage[]=>
 (j.messages.length?j.messages:[{channel:'',observed_template_id:null,catalog:null,review_context:null,contexts:[]}]).map(m=>({...m,journey_name:j.journey_name}));
export const messageVariants=(m:JourneyScopeMessage)=>m.contexts.length?m.contexts.map(r=>({...m,contexts:[r]})):[m];
const maxDate=(dates:(string|null|undefined)[])=>dates.filter((v):v is string=>!!v&&Number.isFinite(Date.parse(v))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null;
export function messageLastActivity(m:JourneyScopeMessage,filters:CatalogFilters,scope:CatalogScope){return maxDate(history(m,filters,scope).map(r=>r.last_activity_at));}
export function messageGroups(m:JourneyScopeMessage){
 const f=messageFacets(m);return messageContextKeys(m).flatMap(k=>{const {front,audience}=parseJourneyContext(k);return (f.segmento.length?f.segmento:[PENDING_SEGMENT]).map(segment=>JSON.stringify([front,front==='Plurix'?'N/A':audience,segment]));});
}
export function buildCatalog(items:JourneyDirectoryItem[],filters:CatalogFilters,scope:CatalogScope):CatalogRow[]{
 const byName=new Map<string,{j:JourneyDirectoryItem;m:JourneyScopeMessage}[]>();
 for(const j of items)for(const m of scopeMessages(j).flatMap(messageVariants))if(catalogMessageMatches(m,j.journey_name,filters,scope))byName.set(j.journey_name,[...(byName.get(j.journey_name)||[]),{j,m}]);
 const out:CatalogRow[]=[];
 for(const [name,entries] of byName){
  const versions=versionsForJourney([...new Map(entries.map(e=>[e.j.id,e.j])).values()],name),groups=[...new Set(entries.flatMap(e=>messageGroups(e.m)))];
  const groupDates:Record<string,string|null>={};
  for(const key of groups){const [front,audience,segment]=JSON.parse(key) as string[];const groupFilters={...filters,context:JSON.stringify([front,audience]),segment};
   groupDates[key]=maxDate(entries.filter(e=>messageGroups(e.m).includes(key)).map(e=>messageLastActivity(e.m,groupFilters,scope)));}
  out.push({name,versions,latest:versions[0],groups,groupDates,lastActivity:maxDate(entries.map(e=>messageLastActivity(e.m,filters,scope)))});
 }
 return out.sort(compareCatalogRows);
}
export function compareCatalogRows(a:Pick<CatalogRow,'lastActivity'|'name'>,b:Pick<CatalogRow,'lastActivity'|'name'>){return (b.lastActivity?Date.parse(b.lastActivity):-Infinity)-(a.lastActivity?Date.parse(a.lastActivity):-Infinity)||a.name.localeCompare(b.name,'pt-BR');}
export interface CountOption {value:string;label:string;count:number}
export function facetCounts(items:JourneyDirectoryItem[],key:FacetKey,filters:CatalogFilters,scope:CatalogScope):CountOption[]{
 const pair=parseJourneyContext(filters.context),relaxed:CatalogFilters={...filters,facets:{...filters.facets}};
 if(key==='frente')relaxed.context='';else if(key==='parceiro')relaxed.context=pair.front?JSON.stringify([pair.front,ALL_AUDIENCES]):'';
 else if(key==='segmento')relaxed.segment='';else delete relaxed.facets[key];
 const globalKey=({canal:'canais',segmento:'segmentos',parceiro:'parceiros',subgrupo:'subgrupos'} as Record<string,string>)[key];
 scope={...scope,global:{...scope.global,...(globalKey?{[globalKey]:[]}:{} )}};
 const sets=new Map<string,Set<string>>();
 for(const j of items)for(const m of scopeMessages(j).flatMap(messageVariants))if(catalogMessageMatches(m,j.journey_name,relaxed,scope)){
  const f=messageFacets(m);for(const v of key==='segmento'&&!f[key].length?[PENDING_SEGMENT]:f[key]){if(key==='parceiro'&&(v==='N/A'||v===UNKNOWN_AUDIENCE))continue;sets.set(v,(sets.get(v)||new Set()).add(j.journey_name));}
 }
 return [...sets].map(([value,names])=>({value,label:value,count:names.size})).sort((a,b)=>a.label.localeCompare(b.label,'pt-BR'));
}
/** Only non-operational, uniquely mapped occurrences may receive a recency pin. */
export function latestActivityPins(item:JourneyDirectoryItem|undefined,messages:MessageMeta[],filters:CatalogFilters,scope:CatalogScope):Record<string,string>{
 if(!item)return {};const candidates=scopeMessages(item).filter(m=>!m.is_optout&&catalogMessageMatches(m,item.journey_name,filters,scope)).map(m=>({m,date:messageLastActivity(m,filters,scope)}));
 const latest=maxDate(candidates.map(c=>c.date)),pins:Record<string,string>={};if(!latest)return pins;
 for(const {m,date} of candidates){if(date!==latest)continue;const same=messages.filter(v=>v.activity_name===m.activity_name&&v.channel===m.channel&&!v.is_optout);if(same.length===1)pins[same[0].activity_key]=latest;}
 return pins;
}
export const groupTitle=(key:string)=>{const [front,audience,segment]=JSON.parse(key) as string[];return {front,audience:front==='Plurix'?'N/A':audience,segment:segment===PENDING_SEGMENT?'Segmento a classificar':segment};};
