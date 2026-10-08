// Modelo das três visões de Performance por conteúdo. Funções puras (testáveis sem Supabase).
//
// Unidades (nunca misturar contagens):
//  1. Com template vinculado  → TEMPLATE com ≥1 execução vinculada no período (usos no detalhe).
//  2. Disparos sem template    → GRUPO de execuções do mesmo contexto (jornada normalizada + Activity Name
//                                + canal + BU/parceiro/segmento/subgrupo/oferta/promocional), IDs preservados.
//  3. Comunicações aprovadas   → IDENTIDADE do template (versões e ocorrências no detalhe).
// Métricas só existem para execuções. Peça sem execução no período não recebe zero, score nem posição.

import type {CommunicationTemplate} from '../types/communication';
import type {ActivityRow} from '../types/activity';
import type {TemplateContent} from '../modules/sfmc-package/types';
import type {FrameworkActivity} from './communicationOrchestrator';
import type {OrphanRow} from '../hooks/useReconciliation';
import type {ProposalRow} from '../services/communicationProposalService';
import {channelUnitCost} from './inferChannel';
import {canalToId,parseSeq,segmentoKey,segmentoKeyFromTemplateId,segmentoLabelCanon} from './taxonomy';
import {saoPauloDay} from './saoPauloPeriod';
import {candidateTemplateIds} from './executionLinkEligibility';

// ── Performance por template (visão 1) ──────────────────────────────────────
export interface TemplateTimelinePoint {
 date:string;label:string;executions:number;baseEnviada:number;aberturas:number;cliques:number;cartoes:number;propostas:number;
 custoTotal:number;custoEfetivo:number;ctr:number;taxaAbertura:number;taxaConversao:number;cacEfetivo:number;activities:ActivityRow[];
}
/** Performance agregada de um template (soma das execuções vinculadas no período). */
export interface TemplatePerformance {
 template:CommunicationTemplate;activityNames:string[];timeline:TemplateTimelinePoint[];executions:number;baseEnviada:number;
 entregas:number;temEntrega:boolean;aberturas:number;cliques:number;cartoes:number;propostas:number;custoTotal:number;
 ctr:number;taxaConversao:number;cac:number;custoCanalEstimado:number;cacEstimado:number;custoEfetivo:number;cacEfetivo:number;custoEstimado:boolean;
 /** Execuções com ao menos um resultado registrado (abertura, clique, proposta ou cartão). 0 = ainda sem resultado: sem score. */
 resultsMeasured:number;
}
export interface PerformancePrevTotals {executions:number;baseEnviada:number;aberturas:number;cliques:number;cartoes:number}

type Row=Record<string,unknown>;
const num=(v:unknown)=>{if(v==null||v==='')return 0;const n=Number(v);return Number.isFinite(n)?n:0;};
const has=(v:unknown)=>v!=null&&v!==''&&Number.isFinite(Number(v));
const cards=(r:Row)=>r['Cartões Gerados']??r['CartÃµes Gerados'];
const RESULT_KEYS=['Abertura','Cliques','Propostas','Cartões Gerados'];
const deliveredVolume=(base:number,rawRate:unknown)=>{if(!has(rawRate))return 0;const rate=Number(rawRate)>1?Number(rawRate)/100:Number(rawRate);return Math.round(base*Math.max(0,Math.min(rate,1)));};
const dayKey=(v:unknown)=>v?saoPauloDay(String(v)):'sem-data';

function emptyPoint(date:string):TemplateTimelinePoint {
 return {date,label:date==='sem-data'?'s/d':`${date.slice(8,10)}/${date.slice(5,7)}`,executions:0,baseEnviada:0,aberturas:0,cliques:0,cartoes:0,propostas:0,custoTotal:0,custoEfetivo:0,ctr:0,taxaAbertura:0,taxaConversao:0,cacEfetivo:0,activities:[]};
}

/** Agrega execuções vinculadas por template_id. Inclui execuções ainda sem resultado (sem score). */
export function buildTemplatePerformance(records:FrameworkActivity[],templates:CommunicationTemplate[]):TemplatePerformance[] {
 const byId=new Map(templates.map(t=>[t.template_id,t]));
 const acc=new Map<string,{p:TemplatePerformance;names:Set<string>;timeline:Map<string,TemplateTimelinePoint>}>();
 for(const rec of records){
  const r=rec as unknown as Row;const id=rec.template_id;if(!id)continue;
  const template=byId.get(id);if(!template)continue;
  let a=acc.get(id);
  if(!a){a={p:{template,activityNames:[],timeline:[],executions:0,baseEnviada:0,entregas:0,temEntrega:false,aberturas:0,cliques:0,cartoes:0,propostas:0,custoTotal:0,ctr:0,taxaConversao:0,cac:0,custoCanalEstimado:0,cacEstimado:0,custoEfetivo:0,cacEfetivo:0,custoEstimado:false,resultsMeasured:0},names:new Set(),timeline:new Map()};acc.set(id,a);}
  const p=a.p;const base=num(r['Base Total']);const custo=num(r['Custo Total Campanha']);
  const ab=num(r.Abertura),cl=num(r.Cliques),ca=num(cards(r)),pr=num(r.Propostas);
  p.executions+=1;p.baseEnviada+=base;p.entregas+=deliveredVolume(base,r['Taxa de Entrega']);p.temEntrega||=has(r['Taxa de Entrega']);
  p.aberturas+=ab;p.cliques+=cl;p.cartoes+=ca;p.propostas+=pr;p.custoTotal+=custo;
  if(RESULT_KEYS.some(k=>has(k==='Cartões Gerados'?cards(r):r[k])))p.resultsMeasured+=1;
  if(rec['Activity name / Taxonomia'])a.names.add(rec['Activity name / Taxonomia']);
  const key=dayKey(r['Data de Disparo']);const d=a.timeline.get(key)??emptyPoint(key);
  d.executions+=1;d.baseEnviada+=base;d.aberturas+=ab;d.cliques+=cl;d.cartoes+=ca;d.propostas+=pr;d.custoTotal+=custo;
  d.custoEfetivo+=custo>0?custo:base*channelUnitCost(template.channel);d.activities.push(rec as unknown as ActivityRow);a.timeline.set(key,d);
 }
 const out:TemplatePerformance[]=[];
 for(const {p,names,timeline} of acc.values()){
  p.activityNames=[...names];
  p.ctr=p.baseEnviada>0?p.cliques/p.baseEnviada:0;p.taxaConversao=p.baseEnviada>0?p.cartoes/p.baseEnviada:0;
  p.cac=p.cartoes>0?p.custoTotal/p.cartoes:0;p.custoCanalEstimado=p.baseEnviada*channelUnitCost(p.template.channel);
  p.cacEstimado=p.cartoes>0?p.custoCanalEstimado/p.cartoes:0;p.custoEstimado=p.custoTotal<=0;
  p.custoEfetivo=p.custoEstimado?p.custoCanalEstimado:p.custoTotal;p.cacEfetivo=p.cartoes>0?p.custoEfetivo/p.cartoes:0;
  p.timeline=[...timeline.values()].map(x=>({...x,ctr:x.baseEnviada>0?x.cliques/x.baseEnviada:0,taxaAbertura:x.baseEnviada>0?x.aberturas/x.baseEnviada:0,taxaConversao:x.baseEnviada>0?x.cartoes/x.baseEnviada:0,cacEfetivo:x.cartoes>0?x.custoEfetivo/x.cartoes:0})).sort((x,y)=>x.date.localeCompare(y.date));
  out.push(p);
 }
 return out.sort((a,b)=>b.cartoes-a.cartoes||a.template.template_id.localeCompare(b.template.template_id));
}

export function previousTotals(records:Row[]):PerformancePrevTotals|null {
 const t={executions:0,baseEnviada:0,aberturas:0,cliques:0,cartoes:0};
 for(const r of records){t.executions+=1;t.baseEnviada+=num(r['Base Total']);t.aberturas+=num(r.Abertura);t.cliques+=num(r.Cliques);t.cartoes+=num(cards(r));}
 return t.executions?t:null;
}

// ── Métricas com cobertura (visão 2): ausente não vira zero ─────────────────
export interface CoveredValue {value:number|null;covered:number;total:number}
export function sumCovered(records:FrameworkActivity[],key:string):CoveredValue {
 const rows=records as unknown as Row[];
 const vals=rows.map(r=>key==='Cartões Gerados'?cards(r):r[key]).filter(has).map(Number);
 return {value:vals.length?vals.reduce((s,v)=>s+v,0):null,covered:vals.length,total:rows.length};
}
export interface ExecutionMetrics {executions:number;base:CoveredValue;aberturas:CoveredValue;cliques:CoveredValue;propostas:CoveredValue;cartoes:CoveredValue;first:string|null;latest:string|null}
export function executionMetrics(records:FrameworkActivity[]):ExecutionMetrics {
 const days=records.map(r=>r['Data de Disparo']).filter((d):d is string=>!!d).map(d=>saoPauloDay(d)).sort();
 return {executions:records.length,base:sumCovered(records,'Base Total'),aberturas:sumCovered(records,'Abertura'),cliques:sumCovered(records,'Cliques'),
  propostas:sumCovered(records,'Propostas'),cartoes:sumCovered(records,'Cartões Gerados'),first:days[0]??null,latest:days[days.length-1]??null};
}

// ── Momento declarado na peça (contrato da régua; mesmo critério do orquestrador) ──
export function templateMomentLabel(id:string|null|undefined,segmentHint?:string|null):string|null {
 if(!id)return null;
 const seq=parseSeq(id);if(!seq)return null;
 const sd=seq.match(/^S(\d+)D0*(\d+)$/i),d=seq.match(/^D0*(\d+)$/i);
 if(sd)return `Semana ${sd[1]} · Disparo ${sd[2]}`;
 if(!d)return seq;
 const segment=segmentoKey(segmentHint)??segmentoKeyFromTemplateId(id);
 if(/DispD\d+/i.test(id)||segment==='negados'||segment==='crm'||canalToId(id)==='email'||/_email_/i.test(id))return `Disparo ${d[1]}`;
 return `Índice D${d[1]} (não comprovado)`;
}

/** Momento da EXECUÇÃO (curadoria/Activity Name do motor), rotulado pelo tipo e não pelo texto legado "Dia n". */
export function executionMomentLabel(m:{kind:string;week?:number|null;dispatch?:number|null;label:string;source:string;enabled?:boolean}):string {
 if(m.source==='manual')return m.label;
 if(m.kind==='semana_disparo'&&m.dispatch)return `Semana ${m.week??1} · Disparo ${m.dispatch}`;
 if(m.kind==='disparo'&&m.dispatch)return `Disparo ${m.dispatch}`;
 return m.label;
}
/** Compara posição (semana/disparo) da execução e da peça; null quando algum lado não declara posição. */
export function momentsDiffer(m:{kind:string;week?:number|null;dispatch?:number|null},pieceId:string|null|undefined):boolean|null {
 if(!pieceId||m.kind==='pontual'||!m.dispatch)return null;
 const seq=parseSeq(pieceId);if(!seq)return null;
 const sd=seq.match(/^S(\d+)D0*(\d+)$/i),d=seq.match(/^D0*(\d+)$/i);
 const week=sd?Number(sd[1]):null,dispatch=sd?Number(sd[2]):d?Number(d[1]):null;
 if(dispatch==null)return null;
 return dispatch!==m.dispatch||(week!=null&&m.week!=null&&week!==m.week);
}

// ── Facetas e filtros comuns às três visões ────────────────────────────────
export const FACET_KEYS=['frente','parceiro','canal','segmento','subgrupo','oferta','promocional','momento'] as const;
export type FacetKey=typeof FACET_KEYS[number];
export type ScopeFacets=Record<FacetKey,string[]>;
export const FACET_LABEL:Record<FacetKey,string>={frente:'Frente / público',parceiro:'Parceiro',canal:'Canal',segmento:'Segmento',subgrupo:'Subgrupo',oferta:'Oferta',promocional:'Promocional',momento:'Momento'};
export const facetNorm=(v:string)=>v.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const clean=(v:unknown)=>{const s=String(v??'').trim();return /^(n\/a|na|none|null|—|-|não identificado)$/i.test(s)?'':s;};
export function canonFacet(key:FacetKey,raw:unknown):string {
 const v=clean(raw);if(!v)return '';
 if(key==='segmento'){const k=segmentoKey(v);return k?segmentoLabelCanon(k):v;}
 if(key==='subgrupo')return v.replace(/^Abandonados\s+/i,'').replace(/^diario$/i,'Diário');
 if(key==='oferta'||key==='promocional'){const n=facetNorm(v);return n==='padrao'?'Padrão':n==='vibe'?'Vibe':n==='copa'?'Copa':v;}
 if(key==='canal'){const id=canalToId(v);return id==='email'?'E-mail':id==='wpp'?'WhatsApp':id==='sms'?'SMS':id==='push'?'Push':v;}
 return v;
}
const uniq=(key:FacetKey,vals:unknown[])=>[...new Map(vals.map(v=>canonFacet(key,v)).filter(Boolean).map(v=>[facetNorm(v),v])).values()];
export function emptyFacets():ScopeFacets {return {frente:[],parceiro:[],canal:[],segmento:[],subgrupo:[],oferta:[],promocional:[],momento:[]};}
export function facetsFromRecords(records:FrameworkActivity[],momento:(string|null)[]=[]):ScopeFacets {
 return {frente:uniq('frente',records.map(r=>r.BU)),parceiro:uniq('parceiro',records.map(r=>r.parceiro_canonico||r.Parceiro)),canal:uniq('canal',records.map(r=>r.Canal)),
  segmento:uniq('segmento',records.map(r=>r.Segmento)),subgrupo:uniq('subgrupo',records.map(r=>r.Subgrupos)),oferta:uniq('oferta',records.map(r=>r.Oferta)),
  promocional:uniq('promocional',records.map(r=>r.Promocional)),momento:uniq('momento',momento)};
}
export type FacetFilters=Partial<Record<FacetKey,string>>;
/** 'all'/vazio não filtra. Valor comparado de forma canônica (caixa/acento). */
export function matchesFacets(f:ScopeFacets,filters:FacetFilters):boolean {
 return FACET_KEYS.every(k=>{const want=filters[k];if(!want||want==='all')return true;return f[k].some(v=>facetNorm(v)===facetNorm(want));});
}
export function facetOptions(items:ScopeFacets[],key:FacetKey):{value:string;count:number}[] {
 const m=new Map<string,{value:string;count:number}>();
 for(const f of items)for(const v of f[key]){const n=facetNorm(v);const cur=m.get(n)??{value:v,count:0};cur.count+=1;m.set(n,cur);}
 return [...m.values()].sort((a,b)=>a.value.localeCompare(b.value,'pt-BR'));
}
export const searchMatches=(text:string,query:string)=>{const q=query.trim().toLowerCase();return !q||text.toLowerCase().includes(q);};

// ── Estado de aprovação (visão 3) ─────────────────────────────────────────
// Contrato atual: aprovação humana do pack grava versões em communication_template_contents
// (o template nasce como 'draft'); cadastro com peça no catálogo marca status 'active'.
// Proposta 'ready'/'review' não é aprovação; 'applied' não comprova envio real.
export type ApprovalState='pack_approved'|'catalog_active'|'catalog_paused'|'draft'|'inactive';
export const APPROVAL_LABEL:Record<ApprovalState,string>={
 pack_approved:'Versão aprovada na revisão do pack',catalog_active:'Cadastro ativo no catálogo',catalog_paused:'Cadastro pausado no catálogo',
 draft:'Rascunho · sem aprovação',inactive:'Inativo no catálogo',
};
export function approvalState(t:CommunicationTemplate,versions:TemplateContent[]):ApprovalState {
 if(t.status==='archived'||t.status==='superseded')return 'inactive';
 if(versions.length)return 'pack_approved';
 if(t.status==='active')return 'catalog_active';
 if(t.status==='paused')return 'catalog_paused';
 return 'draft';
}
export const isApprovedState=(s:ApprovalState)=>s==='pack_approved'||s==='catalog_active'||s==='catalog_paused';

export interface SourcedTag {key:FacetKey;value:string;source:string}
export interface LibraryItem {
 template:CommunicationTemplate;state:ApprovalState;approved:boolean;
 versions:TemplateContent[];currentVersion:TemplateContent|null;
 assetNames:string[];observedIds:string[];
 periodExecutions:FrameworkActivity[];
 historyUses:number;firstUse:string|null;lastUse:string|null;
 compatibleOrphans:OrphanRow[];tags:SourcedTag[];facets:ScopeFacets;searchText:string;
}

function tagsFor(t:CommunicationTemplate,history:FrameworkActivity[]):SourcedTag[] {
 const tags:SourcedTag[]=[];const seen=new Set<FacetKey>();
 const add=(key:FacetKey,values:unknown[],source:string)=>{if(seen.has(key))return;const vals=uniq(key,values);if(!vals.length)return;seen.add(key);vals.forEach(value=>tags.push({key,value,source}));};
 const meta=(t.metadata??{}) as Record<string,unknown>;
 const ctx=(meta.resolved_context??{}) as Record<string,unknown>;
 const id=t.template_id;
 const ctxCampaign=clean(ctx.campaign);
 // 1) activities vinculadas (fonte de verdade da execução) 2) revisão do pack 3) planilha de governança 4) gramática do ID
 if(history.length){const f=facetsFromRecords(history);(['frente','parceiro','segmento','subgrupo','oferta','promocional'] as FacetKey[]).forEach(k=>add(k,f[k],'Activities vinculadas'));}
 add('parceiro',[ctx.partner],'Revisão do pack');add('segmento',[ctx.segment],'Revisão do pack');add('subgrupo',[ctx.subgroup],'Revisão do pack');
 if(/vibe/i.test(ctxCampaign))add('oferta',[ctxCampaign],'Revisão do pack');else add('promocional',[ctxCampaign],'Revisão do pack');
 add('segmento',[meta.segmento_af_sub1],'Planilha de governança (af_sub1)');
 const idFront=/^b2c_/i.test(id)?'B2C':/^(?:plx|plurix)_/i.test(id)?'Plurix':/^(?:b2b2c|dia|bb)_/i.test(id)?'B2B2C':null;
 add('frente',[idFront],'Template ID');
 const seg=segmentoKeyFromTemplateId(id);add('segmento',[seg?segmentoLabelCanon(seg):null],'Template ID');
 add('subgrupo',[/_(?:car21)_|(?:^|_)21d(?:_|$)/i.test(id)?'D-21 A D>7':/_carsab_|(?:^|_)sab(?:_|$)/i.test(id)?'D-7':null],'Template ID');
 add('oferta',[/(?:^|_)vibe(?:_|$)/i.test(id)?'Vibe':null],'Template ID');
 add('promocional',[/(?:^|_)copa(?:_|$)/i.test(id)?'Copa':null],'Template ID');
 add('canal',[t.channel],'Catálogo');
 const moment=templateMomentLabel(id,tags.find(x=>x.key==='segmento')?.value);if(moment)add('momento',[moment],'Template ID');
 return tags;
}

export function buildApprovedLibrary(input:{
 catalog:CommunicationTemplate[];contents:Map<string,TemplateContent[]>|null;proposals:ProposalRow[];
 periodLinked:FrameworkActivity[];historyLinked:FrameworkActivity[];orphans:OrphanRow[];
}):LibraryItem[] {
 const {catalog,contents,proposals,periodLinked,historyLinked,orphans}=input;
 const group=(rows:FrameworkActivity[])=>{const m=new Map<string,FrameworkActivity[]>();for(const r of rows){if(!r.template_id)continue;const l=m.get(r.template_id)??[];l.push(r);m.set(r.template_id,l);}return m;};
 const period=group(periodLinked),history=group(historyLinked);
 return catalog.map(t=>{
  const id=t.template_id;const versions=contents?.get(id)??[];const state=approvalState(t,versions);
  const hist=history.get(id)??[];const days=hist.map(r=>r['Data de Disparo']).filter((d):d is string=>!!d).map(d=>saoPauloDay(d)).sort();
  // Nome original da peça: só de ocorrências cujo af_sub3 observado é este ID (caixa exata) ou aprovadas para ele.
  const occ=proposals.filter(p=>p.message.payload.utm.af_sub3===id||(p.status==='applied'&&p.proposed_template_id===id));
  const assetNames=[...new Set(occ.map(p=>p.message.payload.asset_name).filter((v):v is string=>!!v))];
  const observedIds=[...new Set(occ.map(p=>p.message.payload.utm.af_sub3).filter((v):v is string=>!!v))];
  const tags=tagsFor(t,hist);
  const facets=emptyFacets();for(const tag of tags)facets[tag.key].push(tag.value);
  const compatibleOrphans=orphans.filter(o=>candidateTemplateIds(o).includes(id));
  return {template:t,state,approved:isApprovedState(state),versions,currentVersion:versions.find(v=>v.is_current)??null,assetNames,observedIds,
   periodExecutions:period.get(id)??[],historyUses:hist.length,firstUse:days[0]??null,lastUse:days[days.length-1]??null,compatibleOrphans,tags,facets,
   searchText:[id,t.title,...assetNames,...observedIds,...hist.map(r=>r.jornada),...hist.map(r=>r['Activity name / Taxonomia'])].filter(Boolean).join(' ')};
 });
}

/** Contagens da biblioteca: aprovadas sempre; rascunhos/inativos só entram quando incluídos. */
export function libraryCounts(items:LibraryItem[]) {
 return {approved:items.filter(i=>i.approved).length,withExecution:items.filter(i=>i.approved&&i.periodExecutions.length>0).length,
  drafts:items.filter(i=>i.state==='draft').length,inactive:items.filter(i=>i.state==='inactive').length};
}
export function libraryVisible(items:LibraryItem[],includeDrafts:boolean):LibraryItem[] {
 return items.filter(i=>i.approved||(includeDrafts&&(i.state==='draft'||i.state==='inactive')));
}
