import type { VaultNoteSummary } from './vaultTypes';
type CatalogNote=Pick<VaultNoteSummary,'title'|'tags'>;
export type CatalogRoute={front:string;group:string;segment:string;query:string};
export const EMPTY_CATALOG:CatalogRoute={front:'',group:'',segment:'',query:''};
export const tagValue=(note:CatalogNote,key:string)=>note.tags.find(tag=>tag.startsWith(key+':'))?.slice(key.length+1)||'';
const meaningful=(value:string)=>Boolean(value&&!['N/A','NA','Não informado'].includes(value));
export const catalogLabel=(value:string)=>value==='__general__'?'Assuntos gerais':value.replace(/_/g,' ');
export function subjectGroup(note:CatalogNote){
 const partner=tagValue(note,'parceiro'),bu=tagValue(note,'bu'),front=tagValue(note,'dominio');
 if(bu==='Institucional'||partner==='Institucional')return {key:'audience:Institucional',label:'Institucional',kind:'Público institucional'};
 if(meaningful(partner)&&partner!=='Proprietaria')return {key:'partner:'+partner,label:catalogLabel(partner),kind:'Parceiro'};
 if(bu==='B2C'||partner==='Proprietaria'||front==='Originação B2C')return {key:'audience:B2C',label:'B2C',kind:'Operação própria ou BU B2C sem parceiro informado'};
 if(meaningful(bu))return {key:'unit:'+bu,label:'BU '+catalogLabel(bu),kind:'BU · parceiro não informado na nota'};
 if(front==='Mídia paga'&&/\binstitucional\b/i.test(note.title))return {key:'audience:Institucional',label:'Institucional',kind:'Identificação explícita no nome da campanha; confirmar enquadramento'};
 if(front==='Mídia paga'&&/\[B2C\]/i.test(note.title))return {key:'audience:B2C',label:'B2C',kind:'Público indicado no nome da campanha; confirmar enquadramento'};
 return {key:'unclassified',label:'Sem parceiro ou público definido',kind:'Classificação não informada nas notas'};
}
export function subjectSegment(note:CatalogNote){const value=tagValue(note,'segmento');return meaningful(value)?value:'__general__';}
export function subjectRoute(note:CatalogNote):CatalogRoute{return {front:tagValue(note,'dominio'),group:subjectGroup(note).key,segment:subjectSegment(note),query:''};}
export function readCatalogRoute(search:string):CatalogRoute {const p=new URLSearchParams(search);return {front:p.get('wiki_front')||'',group:p.get('wiki_group')||'',segment:p.get('wiki_segment')||'',query:p.get('wiki_catalog_q')||''};}
export function writeCatalogRoute(params:URLSearchParams,route:CatalogRoute){for(const [key,value] of Object.entries({wiki_front:route.front,wiki_group:route.group,wiki_segment:route.segment,wiki_catalog_q:route.query})){if(value)params.set(key,value);else params.delete(key);}return params;}
export function catalogSelection(notes:VaultNoteSummary[],filters:Record<string,unknown>,route:CatalogRoute){
 const candidates=notes.filter(note=>note.tags.includes('growth-assunto')&&['dominio','parceiro','segmento','bu'].every(key=>!filters[key]||note.tags.includes(key+':'+filters[key])));
 const front=typeof filters.dominio==='string'?filters.dominio:route.front;
 const frontRows=candidates.filter(note=>!front||tagValue(note,'dominio')===front);
 const group=filters.parceiro&&frontRows.length?subjectGroup(frontRows[0]).key:route.group;
 const segment=typeof filters.segmento==='string'?filters.segmento:route.segment;
 const selected=frontRows.filter(note=>(!group||subjectGroup(note).key===group)&&(!segment||subjectSegment(note)===segment));
 return {candidates,frontRows,selected,route:{...route,front,group,segment}};
}
export function catalogGroupLabel(key:string){return key==='unclassified'?'Sem parceiro ou público definido':(key.startsWith('unit:')?'BU ':'')+catalogLabel(key.split(':').slice(1).join(':'));}
