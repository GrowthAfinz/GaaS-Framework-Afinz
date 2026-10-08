import type {ProposalRow} from '../services/communicationProposalService';
import type {FrameworkActivity} from './communicationOrchestrator';
import {orchestrateCommunication} from './communicationOrchestrator';
import type {CatalogEntry} from '../hooks/useReconciliation';
import {normalizeJourney} from '../modules/sfmc-package/parsePackage';
import {canalToId,parseSeq,segmentoKey} from './taxonomy';
import {allowsRepescagemReuse} from './communicationReuse';

const norm=(s:unknown)=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const executionContextKey=(a:FrameworkActivity)=>JSON.stringify([normalizeJourney(a.jornada||''),a['Activity name / Taxonomia'],canalToId(a.Canal),a.BU,a.parceiro_canonico||a.Parceiro,a.Segmento,a.Subgrupos,a.Oferta,a.Promocional]);
export interface ExecutionMatchEvidence {
  source:'pack'|'history'|'none'; ids:string[]; observedIds:string[]; conflicts:string[]; reasons:string[];
  proposal?:ProposalRow; reusedJourneys:number; versions:number;
}
export function executionTemplateEvidence(a:FrameworkActivity,proposals:ProposalRow[],history:FrameworkActivity[],catalog:CatalogEntry[]):ExecutionMatchEvidence {
  const packs=proposals.filter(p=>!p.message.payload.is_optout&&p.status!=='rejected'&&p.message.decision!=='rejected'
    &&normalizeJourney(p.message.payload.journey_name)===normalizeJourney(a.jornada||'')
    &&p.message.payload.activity_name===a['Activity name / Taxonomia']
    &&canalToId(p.message.payload.content.channel)===canalToId(a.Canal));
  const observedIds=[...new Set(packs.map(p=>p.message.payload.utm.af_sub3).filter((v):v is string=>!!v))];
  const conflicts:string[]=[];
  if(packs.length){
    const governed=packs.filter(p=>['c','af_sub1','af_sub2','af_sub3'].every(k=>p.message.payload.utm[k]));
    const ids=[...new Set(governed.map(p=>p.proposed_template_id||p.message.payload.utm.af_sub3!))];
    const versions=new Set(proposals.filter(p=>!p.message.payload.is_optout&&p.status!=='rejected'&&canalToId(p.message.payload.content.channel)===canalToId(a.Canal)&&observedIds.includes(p.message.payload.utm.af_sub3||'')).map(p=>JSON.stringify(p.message.payload.content))).size;
    if(governed.length!==packs.length)conflicts.push('Há ocorrência sem parametrização completa; revisar cobertura do pack.');
    if(observedIds.length>1||ids.length>1)conflicts.push('IDs concorrentes para a mesma jornada / atividade / canal.');
    if(versions>1)conflicts.push('Mais de uma versão de conteúdo; confirmar a vigência histórica.');
    for(const p of governed){
      const projection=orchestrateCommunication(p,[a],[],catalog);
      conflicts.push(...projection.conflicts);
      const missingContext=['front','partner','channel','segment','offer','campaign'].filter(key=>projection.fields[key].value==='Não identificado');
      if(missingContext.length)conflicts.push('Contexto incompleto para lote: '+missingContext.map(key=>projection.fields[key].label).join(', '));
      if(p.proposed_template_id!==p.message.payload.utm.af_sub3&&p.status!=='applied'&&!p.reviewed_by)conflicts.push('ID proposto difere do link e ainda não foi revisado.');
    }
    if(ids.some(id=>!catalog.some(t=>t.id===id)))conflicts.push('Aprovar o cadastro da peça antes de vincular execuções.');
    return {source:'pack',ids,observedIds,conflicts:[...new Set(conflicts)],reasons:['Correspondência de jornada, atividade e canal no pack',...(allowsRepescagemReuse(a['Activity name / Taxonomia'],a.Segmento)?['Upgrade menor: reuso de Repescagem permitido']:[])],proposal:governed[0]||packs[0],reusedJourneys:0,versions};
  }
  const compatible=history.filter(h=>h.template_id&&canalToId(h.Canal)===canalToId(a.Canal)
    &&['BU','Subgrupos','Oferta','Promocional'].every(k=>norm(a[k as keyof FrameworkActivity])&&norm(a[k as keyof FrameworkActivity])===norm(h[k as keyof FrameworkActivity]))
    &&norm(a.parceiro_canonico||a.Parceiro)&&norm(a.parceiro_canonico||a.Parceiro)===norm(h.parceiro_canonico||h.Parceiro)
    &&(segmentoKey(a.Segmento)===segmentoKey(h.Segmento)||(allowsRepescagemReuse(a['Activity name / Taxonomia'],a.Segmento)&&segmentoKey(h.Segmento)==='negados')));
  const ids=[...new Set(compatible.map(h=>h.template_id!))];
  const seq=parseSeq(a['Activity name / Taxonomia']);
  const momentIds=seq?ids.filter(id=>parseSeq(id)===seq):ids;
  return {source:momentIds.length?'history':'none',ids:momentIds,observedIds:[],conflicts:momentIds.length?['Reuso histórico é sugestão: confirmar peça e período antes de vincular.']:[],reasons:['Contexto histórico compatível; índice da peça comparado separadamente'],reusedJourneys:new Set(compatible.filter(h=>momentIds.includes(h.template_id!)).map(h=>h.jornada)).size,versions:0};
}
