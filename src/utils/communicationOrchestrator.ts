import type {ProposalRow} from '../services/communicationProposalService';
import type {CatalogEntry} from '../hooks/useReconciliation';
import type {ActivityMomentSuggestion} from '../types/communication';
import {normalizeJourney} from '../modules/sfmc-package/parsePackage';
import {canalToId,matchTemplate,parseActivity,parseJornadaIdentity,parseSeq,partnerCode,resolveDim,segmentoKey,segmentoLabelCanon,translateTemplateId} from './taxonomy';

export interface FrameworkActivity {
 id:string;jornada:string;'Activity name / Taxonomia':string;Canal:string;BU:string|null;Parceiro:string|null;
 parceiro_canonico:string|null;parceiro_canonico_confianca:string|null;Segmento:string|null;Subgrupos:string|null;
 Oferta:string|null;Promocional:string|null;'Oferta 2':string|null;'Promocional 2':string|null;
 Produto:string|null;'Etapa de aquisição':string|null;'Perfil de Crédito':string|null;Safra:string|null;
 'Ordem de disparo':number|null;'Data de Disparo':string|null;'Horário de Disparo':string|null;
 'Base Total':number|string|null;'Base Acionável':number|string|null;template_id:string|null;
 Propostas:number|null;Aprovados:number|null;'Cartões Gerados':number|null;Cliques:number|null;
}
export interface OrchestrationSlot {id:string;journey_name:string;activity_name:string;channel:string;metadata:Record<string,unknown>}
export interface DimensionEvidence {label:string;value:string;source:string;alternatives:{value:string;source:string}[];conflict:boolean}
export interface MomentEvidence {label:string;week:number|null;dispatch:number|null;confidence:'alta'|'média'|'baixa'|'manual';source:string;reasons:string[];alternatives:string[];declared:string|null}
export interface Orchestration {
 fields:Record<string,DimensionEvidence>;activities:FrameworkActivity[];otherContexts:number;conflicts:string[];
 base:number|null;actionable:number|null;exec:number;latest:string|null;moment:MomentEvidence;
 candidates:{id:string;score:number;reasons:string[];conflicts:string[]}[];templateParts:{label:string;value:string}[];
 relatedActivities:FrameworkActivity[];
 results:{label:string;value:number|null;covered:number;total:number}[];
}
const clean=(v:unknown)=>{const s=String(v??'').trim();return /^(n\/a|não identificado|na|none|null|—)$/i.test(s)?'':s;};
const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const distinct=(v:string[])=>[...new Map(v.filter(Boolean).map(s=>[norm(s),s])).values()];
export function missingGovernanceParameters(row:ProposalRow) {return ['c','af_sub1','af_sub2','af_sub3'].filter(key=>!clean(row.message.payload.utm[key]));}
export const dispatchDay=(v:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(v));
function family(value:string){return /(?:^|_)carsab(?:_|$)|sabado/i.test(value)?'Carrinho Sábado':/car21|carrinho21d/i.test(value)?'Carrinho 21D':/(?:^|_)car(?:_|$)/i.test(value)?'Carrinho':null;}
function idPartner(id:string){if(!/_(car21|carsab)_/i.test(id))return null;return /_(srsa|srasa|sersa|serasa)_/i.test(id)?'Serasa':/_inst_/i.test(id)?'Institucional':null;}
function sequence(value:string|null){const sd=value?.match(/^S(\d+)D0*(\d+)$/i),d=value?.match(/^D0*(\d+)$/i);return sd?{week:Number(sd[1]),dispatch:Number(sd[2])}:d?{week:null,dispatch:Number(d[1])}:null;}
function sum(rows:FrameworkActivity[],column:'Base Total'|'Base Acionável') {if(!rows.length||rows.some(r=>r[column]==null||r[column]===''||!Number.isFinite(Number(r[column]))))return null;return rows.reduce((s,r)=>s+Number(r[column]),0);}

export function orchestrateCommunication(row:ProposalRow,universe:FrameworkActivity[],slots:OrchestrationSlot[],catalog:CatalogEntry[],period:{start:string;end:string}|null=null):Orchestration {
 const p=row.message.payload,context=row.resolved_context;
 const named=universe.filter(a=>a['Activity name / Taxonomia']===p.activity_name);
 const exact=named.filter(a=>normalizeJourney(a.jornada)===normalizeJourney(p.journey_name)&&canalToId(p.content.channel)!=null&&canalToId(a.Canal)===canalToId(p.content.channel));
 const selected=period?exact.filter(a=>a['Data de Disparo']&&dispatchDay(a['Data de Disparo'])>=period.start&&dispatchDay(a['Data de Disparo'])<=period.end):exact;
 const observed=(key:keyof FrameworkActivity)=>distinct(exact.map(a=>clean(a[key])));
 const jid=parseJornadaIdentity(p.journey_name), parsed=parseActivity(p.activity_name,{jornada:p.journey_name,canal:p.content.channel});
 const raw=(p.journey_name+' '+p.activity_name).toLowerCase();
 const observedIdentifier=clean(p.utm.af_sub3)||row.observed_template_id||'';
 const identifier=row.proposed_template_id||observedIdentifier;
 const tpl=catalog.find(t=>t.id===identifier),meta=tpl?.raw.metadata||{};
 const fields:Record<string,DimensionEvidence>={};
 function field(key:string,label:string,evidence:{value:unknown;source:string}[],canon=(s:string)=>norm(s)) {
  const values=evidence.map(v=>({value:clean(v.value),source:v.source})).filter(v=>v.value);
  const first=values[0];const conflict=new Set(values.map(v=>canon(v.value))).size>1;
  fields[key]={label,value:first?.value||'Não identificado',source:first?.source||'Sem evidência',alternatives:values.slice(1),conflict};
 }
 const col=(key:keyof FrameworkActivity)=>observed(key).map(value=>({value,source:'activities.'+key}));
 const analysis=(key:string)=>({value:context[key],source:row.reviewed_by?'Revisão / análise aprovada':'Análise do pack'});
 const activityPartner=/serasa|srsa|(?:^|_)srs(?:_|$)|ecred/i.test(p.activity_name)?'Serasa':/institucional|aint|vibeint|copaint/i.test(p.activity_name)?'Institucional':null;
 const segment=/(?:^|_)abd(?:_|$)/.test(raw)?'Abandonados':/(?:^|_)(?:ngd|negados)(?:_|$)/.test(raw)?'Negados':parsed.segmento?segmentoLabelCanon(parsed.segmento):null;
 const sub=/sabado|(?:^|_)sab(?:_|$)/.test(raw)?'Sábado':/21d|21dias/.test(raw)?'21D':null;
 const idFront=/^b2c_/i.test(identifier)?'B2C':/^(?:b2b2c|dia|bb|plx|plurix)_/i.test(identifier)?'B2B2C':null;
 field('front','BU',[{value:idFront,source:'af_sub3 / Template ID'},...col('BU'),{value:jid.bu?.toUpperCase(),source:'Nome da jornada'}]);
 field('origin','Origem cadastrada',[...col('Parceiro')]);
 field('partner','Parceiro / variante',[{value:idPartner(identifier),source:identifier===observedIdentifier?'af_sub3 / Template ID':'Template ID proposto (revisável)'}, {value:activityPartner,source:'Activity Name'},analysis('partner'),{value:idPartner(observedIdentifier),source:'ID originalmente observado em af_sub3'},...col('parceiro_canonico'),...col('Parceiro')],s=>partnerCode(s)||norm(s));
 field('channel','Canal',[{value:p.content.channel,source:'Mensagem no pack'},...col('Canal'),{value:tpl?.channel,source:'Catálogo'}],s=>canalToId(s)||norm(s));
 const linkSegment=clean(p.utm.af_sub1);
 field('segment','Segmento',[{value:linkSegment?segmentoLabelCanon(segmentoKey(linkSegment)):null,source:'Tracking af_sub1'}, {value:meta.segmento_af_sub1,source:'Governança do catálogo'},...col('Segmento'),analysis('segment'), {value:segment,source:'Jornada / Activity Name'},{value:tpl?.dims.segmento?segmentoLabelCanon(tpl.dims.segmento):null,source:'Template ID / catálogo'}],s=>segmentoKey(s)||norm(s));
 // Operational subgroups and configured recency are intentionally separate fields.
 const registeredSubgroups=col('Subgrupos');
 const audienceSubgroups=registeredSubgroups.filter(v=>!/^diario$/i.test(v.value));
 field('subgroup','Subgrupo',[...audienceSubgroups,{value:sub==='21D'?'21D (proposto)':null,source:'Jornada 21D; limites do público ainda não confirmados'},...registeredSubgroups]);
 field('recency','Recência / cadência',[analysis('subgroup'),{value:sub,source:'Nome da jornada'}]);
 field('family','Família',[{value:family(p.journey_name)||(family(p.activity_name)==='Carrinho'&&sub==='21D'?'Carrinho 21D':family(p.activity_name)),source:'Jornada / Activity Name e recência'},{value:family(identifier),source:'Template ID proposto'},{value:family(observedIdentifier),source:'ID originalmente observado em af_sub3'}]);
 field('offer','Oferta',[...col('Oferta'),{value:/(?:^|_)(?:padrao|pad)(?:_|$)/.test(raw)?'Padrão':null,source:'Nome da jornada'}]);
 const linkCampaign=clean(p.utm.c);
 const governedCampaign=/vibe/i.test(linkCampaign)?'Vibe':/copa/i.test(linkCampaign)?'Copa':/padrao/i.test(linkCampaign)?'Padrão':null;
 field('campaign','Campanha',[{value:governedCampaign,source:'Tracking c'},...col('Promocional'),analysis('campaign'),{value:/vibe/.test(raw)?'Vibe':/copa/.test(raw)?'Copa':null,source:'Jornada / Activity Name'}, {value:tpl?.dims.campanha,source:'Catálogo'}]);
 field('trackingCampaign','Campanha do link',[{value:p.utm.c,source:'Tracking c'}]);
 field('trackingMoment','Momento do link',[{value:p.utm.af_sub2,source:'Tracking af_sub2'}]);
 field('observedId','ID do link',[{value:observedIdentifier,source:'Tracking af_sub3'}]);
 field('product','Produto',col('Produto'));field('stage','Etapa',col('Etapa de aquisição'));field('credit','Perfil de crédito',col('Perfil de Crédito'));field('cohort','Safra',col('Safra'));
 field('offer2','Oferta 2',col('Oferta 2'));field('promo2','Promocional 2',col('Promocional 2'));
 for(const key of ['offer','offer2','campaign','promo2']){const f=fields[key];const normalized=norm(f.value);f.value=normalized==='padrao'?'Padrão':normalized==='vibe'?'Vibe':normalized==='copa'?'Copa':f.value;}
 const conflicts=Object.values(fields).filter(f=>f.conflict).map(f=>`${f.label}: ${f.value} (${f.source}) × ${f.alternatives.map(v=>v.value+' ('+v.source+')').join(' / ')}`);
 const manual=slots.find(s=>normalizeJourney(s.journey_name)===normalizeJourney(p.journey_name)&&s.activity_name===p.activity_name&&canalToId(s.channel)===canalToId(p.content.channel))?.metadata.moment_suggestion as ActivityMomentSuggestion|undefined;
 const rawNameSeq=sequence(parseSeq(p.activity_name));
 const ambiguous21=rawNameSeq?.dispatch===21&&/21d|21dias/i.test(p.journey_name);
 const nameSeq=ambiguous21?null:rawNameSeq,idSeq=sequence(parseSeq(identifier));
 const orders=[...new Set(exact.map(a=>a['Ordem de disparo']).filter((v):v is number=>v!=null&&v>0&&v<100&&!(sub==='21D'&&[21,31].includes(v))))];
 const reasons:string[]=[],alternatives:string[]=[];
 let moment:MomentEvidence={label:'Momento não identificado',week:null,dispatch:null,confidence:'baixa',source:'Sem evidência suficiente',reasons,alternatives,declared:parseSeq(identifier)};
 if(manual?.source==='manual'&&manual.enabled)moment={...moment,label:manual.label,week:manual.week??null,dispatch:manual.dispatch??null,confidence:'manual',source:'Correção manual da jornada / atividade / canal'};
 else if(idSeq&&/DispD\d+/i.test(identifier))moment={...moment,...idSeq,label:`Disparo ${idSeq.dispatch}`,confidence:'alta',source:'Disparo declarado em af_sub3 / Template ID'};
 else if(idSeq&&(idSeq.week||canalToId(p.content.channel)==='email'||segmentoKey(fields.segment.value)==='crm'))moment={...moment,...idSeq,label:(idSeq.week?`Semana ${idSeq.week} · `:'')+`Disparo ${idSeq.dispatch}`,confidence:'alta',source:'Calendário declarado em af_sub3 / Template ID'};
 else if(idSeq&&segmentoKey(fields.segment.value)==='negados')moment={...moment,...idSeq,label:`Disparo ${idSeq.dispatch}`,confidence:'alta',source:'Índice de toque da régua Negados'};
 else if(nameSeq&&nameSeq.dispatch<100)moment={...moment,...nameSeq,label:(nameSeq.week?`Semana ${nameSeq.week} · `:'')+'Disparo '+nameSeq.dispatch,confidence:'média',source:'Posição declarada no Activity Name'};
 else if(orders.length===1)moment={...moment,dispatch:orders[0],label:`Ordem registrada ${orders[0]}`,confidence:'média',source:'activities.Ordem de disparo (escopo global/canal a revisar)'};
 else if(idSeq)moment={...moment,...idSeq,label:`Sugestão do ID · ${idSeq.week?'S'+idSeq.week+' · ':''}D${idSeq.dispatch}`,source:'Índice do template; não comprova dia relativo ou posição no ramo'};
 if(orders.length>1){alternatives.push('Ordens registradas: '+orders.join(', '));conflicts.push('A mesma ocorrência possui ordens de disparo divergentes.');}
 if(nameSeq&&orders.length===1&&nameSeq.dispatch!==orders[0]){conflicts.push(`Momento: Activity Name=${nameSeq.dispatch} × ordem registrada=${orders[0]} (pode ser ordinal por canal versus global).`);alternatives.push('Ordem registrada '+orders[0]);}
 if(exact.some(a=>a['Ordem de disparo']===0))reasons.push('Ordem 0 preservada como valor sem semântica comprovada; não usada para inferir posição.');
 const waits=distinct(p.paths.flatMap(path=>path.waits));if(waits.length)reasons.push('Esperas configuradas: '+waits.join(' / ')+'; sem converter automaticamente em posição.');
 if(ambiguous21)reasons.push('Token disp21 ambíguo em jornada de recência 21D; não usado como ordinal 21.');
 if(exact.some(a=>a['Ordem de disparo']!=null&&a['Ordem de disparo']!>0&&!orders.includes(a['Ordem de disparo']!)))reasons.push('Ordem cadastrada incompatível com ordinal: recência ou data; ignorada na inferência.');
 const trackingSeq=sequence(clean(p.utm.af_sub2));
 if(idSeq&&trackingSeq&&!idSeq.week&&idSeq.dispatch!==trackingSeq.dispatch)conflicts.push(`Momento: af_sub3 declara ${idSeq.dispatch}, mas af_sub2 declara ${trackingSeq.dispatch}. Revisar parametrização.`);
 if(idSeq&&orders.length===1&&idSeq.dispatch!==orders[0])conflicts.push(`Momento do ID ${idSeq.dispatch} diverge da ordem cadastrada ${orders[0]}.`);
 reasons.push(moment.source);if(idSeq)reasons.push('Índice declarado no ID: '+parseSeq(identifier));
 if(identifier!==observedIdentifier){reasons.push('Momento do ID proposto; não comprova execução ou validade histórica.');if(observedIdentifier&&moment.confidence==='alta'){moment.confidence='média';moment.source='Template ID proposto (revisável)';}}
 if(p.utm.af_sub2)reasons.push('Momento de tracking af_sub2: '+p.utm.af_sub2+' (dimensão separada).');
 if(exact.some(a=>a['Horário de Disparo']==='00:00:00'))reasons.push('Horário 00:00 não usado como evidência de horário real.');
 const candidateParsed=parseActivity(p.activity_name,{jornada:p.journey_name,canal:p.content.channel,bu:fields.front.value,segmento:fields.segment.value,parceiro:fields.partner.value});
 // Reuse scoring, but do not let its legacy journey precedence overwrite governed link dimensions.
 candidateParsed.segmento=segmentoKey(fields.segment.value==='Não identificado'?'':fields.segment.value);
 candidateParsed.campanha=resolveDim('campanha',fields.campaign.value);
 if(moment.dispatch!=null)candidateParsed.seq=moment.week?`S${moment.week}D${String(moment.dispatch).padStart(2,'0')}`:`D${moment.dispatch}`;
 const candidates=catalog.map(t=>{const m=matchTemplate(candidateParsed,[t]);if(!m)return null;const guards:string[]=[];const tf=family(t.id),pf=fields.family.value;if(tf&&pf!=='Não identificado'&&tf!==pf)guards.push(`Família ${tf} diverge de ${pf}`);const partner=idPartner(t.id);if(partner&&activityPartner&&partner!==activityPartner)guards.push(`Parceiro ${partner} diverge de ${activityPartner}`);return {id:t.id,score:m.score,reasons:m.reasons.map(r=>(r.ok?'✓ ':'⚠ ')+r.label+': '+r.val),conflicts:guards};}).filter((v):v is NonNullable<typeof v>=>!!v).sort((a,b)=>a.conflicts.length-b.conflicts.length||b.score-a.score||a.id.localeCompare(b.id)).slice(0,5);
 const templateParts=translateTemplateId(identifier).filter(p=>p.key!=='seq').map(p=>({label:p.label,value:p.value}));
 if(family(identifier))templateParts.push({label:'Família',value:family(identifier)!});if(idPartner(identifier))templateParts.push({label:'Variante',value:idPartner(identifier)!});if(parseSeq(identifier))templateParts.push({label:'Índice do template',value:parseSeq(identifier)!});
 const exactIds=new Set(exact.map(a=>a.id));
 const relatedActivities=universe.filter(a=>!exactIds.has(a.id)&&canalToId(a.Canal)===canalToId(p.content.channel)
  &&fields.partner.value!=='Não identificado'&&(partnerCode(a.parceiro_canonico||a.Parceiro||'')||norm(a.parceiro_canonico||a.Parceiro||''))===(partnerCode(fields.partner.value)||norm(fields.partner.value))
  &&fields.segment.value!=='Não identificado'&&segmentoKey(a.Segmento)!=null&&segmentoKey(a.Segmento)===segmentoKey(fields.segment.value)
  &&norm(a.BU||'')===norm(fields.front.value)
  &&(fields.campaign.value==='Não identificado'||norm(a.Promocional||'')===norm(fields.campaign.value))
  &&(fields.offer.value==='Não identificado'||norm(a.Oferta||'')===norm(fields.offer.value))
  &&(!period||(a['Data de Disparo']&&dispatchDay(a['Data de Disparo'])>=period.start&&dispatchDay(a['Data de Disparo'])<=period.end))
 ).sort((a,b)=>(b['Data de Disparo']||'').localeCompare(a['Data de Disparo']||''));
 const results=(['Propostas','Aprovados','Cartões Gerados','Cliques'] as const).map(key=>{const covered=selected.filter(a=>a[key]!=null&&Number.isFinite(Number(a[key])));return {label:key,value:selected.length&&covered.length===selected.length?covered.reduce((s,a)=>s+Number(a[key]),0):null,covered:covered.length,total:selected.length};});
 return {fields,activities:selected,relatedActivities,results,otherContexts:named.length-exact.length,conflicts,base:sum(selected,'Base Total'),actionable:sum(selected,'Base Acionável'),exec:selected.length,latest:selected.map(a=>a['Data de Disparo']).filter((d):d is string=>!!d).sort().slice(-1)[0]||null,moment,candidates,templateParts};
}
