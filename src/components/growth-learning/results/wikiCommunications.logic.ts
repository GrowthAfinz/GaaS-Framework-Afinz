import type { CommunicationTemplate } from '../../../types/communication';
import type { ResultRow, ResultsScope } from './results.types';
export type Slot={id:string;journey_name:string;activity_name:string;channel:string;current_template_id:string|null;lifecycle_status:string};
export type FactoryAsset={id:string;name:string;external_url:string;alt_text:string;slot:string;bu:string|null;partner:string|null;segment:string|null;subgroup:string|null;product:string|null;status:string;version:number};
export type Piece={id:string;title:string;channel:string;reason:string;template?:CommunicationTemplate;asset?:FactoryAsset;rows:ResultRow[]};
export const templateId=(row:ResultRow)=>row.dimensions?.template?.trim()||'';
export function safeAssetUrl(value:string):string|null {try {const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}}
export function linkedPieces(rows:ResultRow[],templates:CommunicationTemplate[]):Piece[]{
 return [...new Set(rows.map(templateId).filter(Boolean))].map(id=>{const template=templates.find(t=>t.template_id===id);return {id:'template:'+id,title:template?.title||id,channel:template?.channel||rows.find(r=>templateId(r)===id)?.channel||'',reason:'Vínculo registrado na execução',template,rows:rows.filter(r=>templateId(r)===id)};});
}
// A slot describes current configuration, never evidence of a historical send.
export function configuredPieces(rows:ResultRow[],slots:Slot[],templates:CommunicationTemplate[]):Piece[]{
 const matching=slots.filter(s=>s.current_template_id&&s.lifecycle_status==='active'&&rows.some(r=>r.title===s.activity_name&&r.journey===s.journey_name&&r.channel===s.channel));
 return [...new Set(matching.map(s=>s.current_template_id!))].map(id=>({id:'template:'+id,title:templates.find(t=>t.template_id===id)?.title||id,channel:templates.find(t=>t.template_id===id)?.channel||'',reason:'Configuração atual de uma execução deste recorte; envio não comprovado',template:templates.find(t=>t.template_id===id),rows:[]}));
}
export function assetReferences(assets:FactoryAsset[],scope:ResultsScope,rows:ResultRow[]):Piece[]{
 if(scope.channel&&scope.channel!=='E-mail')return [];
 const known=(key:'bu'|'partner'|'segment'|'subgroup'|'product')=>key==='product'?[...new Set(rows.map(r=>r.dimensions?.product||'').filter(Boolean))]:scope[key]?[scope[key]!]:[...new Set(rows.map(r=>r[key]||'').filter(Boolean))];
 return assets.filter(a=>a.status==='ready').flatMap(a=>{
  const dimensions=['bu','partner','segment','subgroup','product'] as const;
  const matches=dimensions.filter(k=>a[k]&&known(k).includes(a[k]!));
  const conflicts=dimensions.filter(k=>a[k]&&known(k).length&&!known(k).includes(a[k]!));
  // Require an explicit partner or audience match; a blank is not a wildcard.
  if(!matches.some(k=>k==='partner'||k==='segment')||conflicts.some(k=>k==='bu'||k==='partner'))return [];
  const labels={bu:'BU',partner:'parceiro',segment:'público',subgroup:'subgrupo',product:'produto'};
  const missing=dimensions.filter(k=>(known(k).length&&!a[k])||(a[k]&&!known(k).length));
  const reason=conflicts.length?'Referência do mesmo parceiro; validar '+conflicts.map(k=>labels[k]).join(', '):missing.length?'Referência cadastrada; confirmar '+missing.map(k=>labels[k]).join(', '):'Dimensões cadastradas correspondem ao recorte; uso não comprovado';
  return [{id:'asset:'+a.id,title:a.name,channel:'E-mail',reason,asset:a,rows:[]}];
 });
}
export function journeySteps(rows:ResultRow[]){
 const groups=new Map<string,{key:string;journey:string;stage:string;subgroup:string;safra:string;order:number|null;template:string;rows:ResultRow[]}>();
 for(const row of rows){const raw=row.dimensions?.order||'';const order=/^\d+$/.test(raw)&&Number(raw)>0?Number(raw):null;const key=JSON.stringify([row.journey,row.stage,row.subgroup,row.safra,raw,templateId(row),row.channel]);const group=groups.get(key)||{key,journey:row.journey||'Jornada não informada',stage:row.stage||'Etapa não informada',subgroup:row.subgroup||'',safra:row.safra||'',order,template:templateId(row),rows:[]};group.rows.push(row);groups.set(key,group);}
 return [...groups.values()].sort((a,b)=>a.journey.localeCompare(b.journey)||a.stage.localeCompare(b.stage)||(a.order??Infinity)-(b.order??Infinity)||a.rows[0].date.localeCompare(b.rows[0].date));
}
