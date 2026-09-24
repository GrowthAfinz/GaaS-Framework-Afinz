import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, toIsoDay, normalizeSnapshotManifest } from '../supabase/functions/report-sync/report-live-engine.ts';
import { buildArtifact, validateArtifact, validateArtifactIntegrity, certificationPassed, canonicalJson, validateRegression } from '../supabase/functions/report-sync/report-live-versioning.ts';
import { parseReportRequest, reportRoleAllows, requiresReportOperator, selectReportWorkerCredential, verifyReportWorkerCredential } from '../supabase/functions/report-sync/report-live-policy.ts';

const contract = (code, view) => ({slide_code:code,section:'core',title:code,audience:'executivo',source_view:view,required_fields:[],optional_fields:[],fallback_view:null,implementation_readiness:'pronto_dado',conditional:false,display_order:1,active:true});
const seed = () => ({runId:'11111111-1111-4111-8111-111111111111',profile:'monthly_report',periodStart:'2026-08-01',periodEnd:'2026-08-31',
 manifest:{period_start:'2026-08-01',period_end:'2026-08-31',source_cutoffs:{crm:'2026-08-31',media:'2026-08-31',b2c:'2026-08-20'},data_reading_integrated:'2026-08-20',gap_closure_days:11,quality_status:'suspect',field_coverage:{crm_template:1},comparability:{}},
 crm:[{'Data de Disparo':'2026-08-01',BU:'B2C',Parceiro:'Serasa',parceiro_canonico:'Serasa',parceiro_canonico_motivo:'EXPLICIT_PARTNER',parceiro_canonico_confianca:'alta','Base Acionável':100,'Cartões Gerados':10,'Custo Total Campanha':100}],
 media:[],mediaActions:[],b2c:[],goals:[],budgets:[],targets:[],collectionRuns:[],collectionLogs:[],experiments:[],insurance:[],communicationSlots:[],communicationTemplates:[],slideContracts:[contract('C0','VIEW_RUN_MANIFEST'),contract('C3','VIEW_SCORECARD_INTEGRATED')],aliases:[],actionCandidates:[],actionOutcomes:[],metricCertifications:[],config:{quality:{minimum_execution_rows:1,minimum_field_coverage:0.1}}});
const records = (table) => table.slice(1).map(row=>Object.fromEntries(table[0].map((key,i)=>[key,row[i]])));
const artifact = async input => { const built=buildReport(input); return buildArtifact(input,built,Object.fromEntries(built.slides.map(slide=>[slide.slide_instance_id,'Narrativa de teste.']))); };

test('snapshot manifest derives cutoffs from the actual source scope without mutation',()=>{
 const input=seed(), original=structuredClone(input);
 input.insurance=[{'Data de Disparo':'2026-08-10',BU:'Seguros'},{'Data de Disparo':'2026-08-31',BU:'Outra'}];
 input.mediaActions=[{business_date:'2026-08-12',grain_level:'ad',grain_role:'fact'}, {business_date:'2026-08-31',grain_level:'campaign',grain_role:'reconciliation'}];
 const normalized=normalizeSnapshotManifest(input);
 assert.equal(normalized.manifest.source_cutoffs.insurance,'2026-08-10');
 assert.equal(normalized.manifest.source_cutoffs.media_events,'2026-08-12');
 assert.equal(normalized.manifest.data_reading_integrated,null);
 assert.deepEqual(normalized.manifest.missing_sources,['media','b2c']);
 assert.deepEqual(input.manifest,original.manifest);
});

test('regression uses the current equivalent window and falls back to native CRM',async()=>{
 const input=seed();
 input.manifest.data_reading_integrated=null;
 input.crm.push({'Data de Disparo':'2026-07-01',BU:'B2C',Parceiro:'Serasa','Base Acionável':100,'Cartões Gerados':8,'Custo Total Campanha':80});
 const current=await artifact(input), previous=structuredClone(current);
 previous.tabs.VIEW_SCORECARD_INTEGRATED=[['metric','current','previous_equivalent','delta'],['cartoes_crm',1000,1000,0]];
 const result=validateRegression(current,previous).find(item=>item.validation_key==='regression.crm_cards');
 assert.equal(result.status,'passed');
 assert.equal(result.evidence.current,10);
 assert.equal(result.evidence.previous,8);
 assert.equal(result.evidence.comparison_source,'native');
});

test('real-snapshot partner drift blocks the existing publication gate',async()=>{
 const input=seed();
 const confirmed=normalizeSnapshotManifest(input);
 assert.equal(confirmed.manifest.quality_status,'suspect');
 assert.deepEqual(confirmed.manifest.comparability.partner_resolution_equivalence,{checked_rows:1,mismatch_count:0,status:'confirmed',sample:[]});
 input.crm[0].parceiro_canonico_motivo='B2C_CAMPAIGN_TWIN_MATCH';
 const blocked=normalizeSnapshotManifest(input);
 assert.equal(blocked.manifest.quality_status,'blocked');
 assert.equal(blocked.manifest.comparability.partner_resolution_equivalence.mismatch_count,1);
 const validations=validateArtifact(await artifact(blocked));
 const publicationGate=validations.find(row=>row.validation_key==='manifest.publication_gate');
 assert.equal(publicationGate.status,'failed');
 assert.match(publicationGate.message,/parceiro canônico SQL e TypeScript/);
 assert.equal(certificationPassed(validations),false);
});

test('manifest spec version must match the immutable artifact version',async()=>{
 const built=await artifact(seed());
 let check=validateArtifact(built).find(row=>row.validation_key==='versions.manifest_spec');
 assert.equal(check.status,'passed');
 const row=built.tabs.VIEW_RUN_MANIFEST.find(item=>item[0]==='spec_version');
 row[1]='1.0';
 check=validateArtifact(built).find(item=>item.validation_key==='versions.manifest_spec');
 assert.equal(check.status,'failed');
 assert.deepEqual(check.evidence,{manifest_spec:'1.0',artifact_spec:'3.1'});
});

test('partner channel view has one row per channel and pp variation',()=>{
 const input=seed();
 input.slideContracts=[{...contract('P3',null),section:'partner'}];
 const row=(date,channel,segment,cards)=>({'Data de Disparo':date,BU:'B2C',Parceiro:'Proprietaria',Segmento:segment,Canal:channel,
   'Base Acionável':100,'Cartões Gerados':cards,'Custo Total Campanha':100});
 input.crm=[
   row('2026-08-01','E-mail','A',10),row('2026-08-02','E-mail','B',20),
   row('2026-08-03','SMS','A',30),row('2026-08-04','WhatsApp','A',20),row('2026-08-05','Push','A',20),
   row('2026-07-01','E-mail','A',40),row('2026-07-02','SMS','A',20),
   row('2026-07-03','WhatsApp','A',20),row('2026-07-04','Push','A',20),
 ];
 const table=buildReport(input).tabs.VP_PROPRIETARIA_CHANNELS;
 assert.deepEqual(table[0],['channel','cards','base','cost','channel_cost','cac','conversion','share','share_previous_equivalent','share_delta_pp']);
 const rows=records(table);
 assert.equal(rows.length,4);
 assert.equal(rows.find(item=>item.channel==='E-mail').share,0.3);
 assert.ok(Math.abs(rows.find(item=>item.channel==='E-mail').share_delta_pp-(-10))<1e-9);
 assert.ok(Math.abs(rows.reduce((total,item)=>total+item.share,0)-1)<1e-9);
});

test('unresolved partner warns only when it carries cards',()=>{
 const input=seed();
 input.crm=[{'Data de Disparo':'2026-08-01',BU:'Seguros',Parceiro:null,'Base Acionável':100,'Cartões Gerados':0,'Custo Total Campanha':0}];
 let candidates=buildReport(input).actionCandidates;
 assert.equal(candidates.some(row=>row.signal_code==='PARTNER_NA_CLASSIFICATION'),false);
 input.crm[0]['Cartões Gerados']=1;
 candidates=buildReport(input).actionCandidates;
 assert.equal(candidates.some(row=>row.signal_code==='PARTNER_NA_CLASSIFICATION'),true);
});

test('required unavailable front remains visible with blocked confidence',()=>{
 const input=seed();input.slideContracts=[{...contract('B2C','VIEW_SOURCE_UNAVAILABLE'),section:'front'}];
 const slide=buildReport(input).slides[0];
 assert.equal(slide.run_eligibility,'render_com_limites');
 assert.equal(slide.confidence_status,'blocked');
 assert.equal(slide.evidence.view_exists,false);
});

test('parallel funnel checks each origin and never totals partial B2C as complete',()=>{
 const input=seed();input.slideContracts=[{...contract('B1','VIEW_B2C_PARALLEL_FUNNELS'),required_fields:['crm_cards','b2c_proposals','b2c_emissions']}];
 assert.deepEqual(buildReport(input).slides[0].missing_required_fields,['b2c_proposals','b2c_emissions']);
 input.b2c=[{data:'2026-08-01',tipo:'total',propostas_total:10,emissoes_total:2},{data:'2026-08-02',tipo:'total',propostas_total:null,emissoes_total:1}];
 const built=buildReport(input), row=records(built.tabs.VIEW_B2C_PARALLEL_FUNNELS).find(r=>r.source_type==='total');
 assert.equal(row.proposals,'');assert.equal(row.emissions,3);assert.equal(row.conversion,'');
 assert.deepEqual(built.slides[0].missing_required_fields,['b2c_proposals']);
});

test('missing B2C does not downgrade the same CRM partner evidence',()=>{
 const input=seed();input.slideContracts=[{...contract('P1',null),section:'partner'}];
 const baseline=buildReport(input).slides;
 assert.ok(baseline.length>0);
 input.manifest.quality_status='blocked';input.manifest.data_reading_integrated=null;input.manifest.source_cutoffs.b2c=null;
 const partial=buildReport(input).slides;
 assert.deepEqual(partial.map(s=>[s.confidence_status,s.cutoff_maturity]),baseline.map(s=>[s.confidence_status,s.cutoff_maturity]));
 assert.deepEqual(partial[0].evidence.quality_scope,['crm']);
});

test('invalid commands and dates never fall through to full',()=>{
 for(const body of [{mode:'unknown'}, {mode:'status'}, {period_start:'2026-02-30'}, {period_start:'2026-09-02',period_end:'2026-09-01'}, [], null]) assert.throws(()=>parseReportRequest(body));
 assert.equal(parseReportRequest({mode:'cleanup_sheet_tabs'}).mode,'cleanup_sheet_tabs');
 assert.equal(parseReportRequest({mode:'export_artifact'}).mode,'export_artifact');
});
test('published PDF is readable by signed-in users while mutations require an operator',()=>{
 assert.equal(requiresReportOperator('export_pdf'),false);
 for(const mode of ['full','publish','rollback','resume_structure','worker']) assert.equal(requiresReportOperator(mode),true);
});
test('team roles separate candidate generation, live publication and access management',()=>{
 assert.equal(reportRoleAllows('viewer','export_pdf'),true);
 assert.equal(reportRoleAllows('viewer','build'),false);
 assert.equal(reportRoleAllows('analyst','build'),true);
 assert.equal(reportRoleAllows('analyst','publish'),false);
 assert.equal(reportRoleAllows('publisher','full'),true);
 assert.equal(reportRoleAllows('publisher','set_member'),false);
 assert.equal(reportRoleAllows('publisher','export_artifact'),false);
 assert.equal(reportRoleAllows('admin','export_artifact'),true);
 assert.equal(reportRoleAllows('admin','set_member'),true);
 assert.equal(reportRoleAllows(null,'export_pdf'),false);
});
test('worker authentication survives a stripped custom header and transient verification errors',async()=>{
 const token='a'.repeat(64);
 assert.equal(selectReportWorkerCredential(token,''),token);
 assert.equal(selectReportWorkerCredential(null,token),token);
 assert.equal(selectReportWorkerCredential(null,'user.jwt.value'),null);
 let calls=0, pauses=0;
 const status=await verifyReportWorkerCredential(token,async()=>{
  calls+=1;
  return calls<3?{data:null,error:new Error('temporary')}:{data:true,error:null};
 },3,async()=>{pauses+=1;});
 assert.equal(status,'valid');assert.equal(calls,3);assert.equal(pauses,2);
 assert.equal(await verifyReportWorkerCredential(token,async()=>({data:false,error:null})),'invalid');
 assert.equal(await verifyReportWorkerCredential(token,async()=>({data:null,error:new Error('offline')}),2,async()=>{}),'unavailable');
});
test('business date retains date-only and uses Sao Paulo for timestamps',()=>{
 assert.equal(toIsoDay('2026-08-01'),'2026-08-01');
 assert.equal(toIsoDay('2026-08-01T02:59:59Z'),'2026-07-31');
 assert.equal(toIsoDay('2026-08-01T03:00:00Z'),'2026-08-01');
});
test('integrated scorecard respects cutoff while native executive retains full period',()=>{
 const input=seed(); input.crm.push({...input.crm[0],'Data de Disparo':'2026-08-25','Cartões Gerados':20});
 const built=buildReport(input);
 assert.equal(records(built.tabs.VIEW_SCORECARD_INTEGRATED).find(row=>row.metric==='cartoes_crm').current,10);
 assert.equal(JSON.parse(records(built.tabs.VIEW_EXECUTIVE_READING)[0].core_kpis).crm_cards,30);
});
test('missing and partial cost cannot produce zero or understated CAC',()=>{
 const input=seed();input.crm.push({...input.crm[0],'Custo Total Campanha':null});
 const built=buildReport(input),daily=records(built.tabs.VIEW_PACING_ISODAYS);
 assert.equal(daily[0].crm_cost,'');assert.equal(daily[0].cumulative_cac,'');
 assert.equal(daily[1].crm_cards,'');assert.equal(daily[1].cumulative_cards,'');
 assert.equal(records(built.tabs.VIEW_SCORECARD_INTEGRATED).find(row=>row.metric==='cac_crm').current,'');
 input.crm=input.crm.slice(0,1);input.crm[0]['Custo Total Campanha']=0;
 assert.equal(records(buildReport(input).tabs.VIEW_PACING_ISODAYS)[0].cumulative_cac,0);
});
test('phase 2a projects canonical monthly rulers without recalculating their values',()=>{
 const input=seed();
 input.slideContracts=[{...contract('P1',null),section:'partner'},{...contract('P4',null),section:'partner'}];
 input.monthlyAcquisition=Array.from({length:6},(_,index)=>({
   mes:`2026-${String(index+3).padStart(2,'0')}-01`,parceiro:'Serasa',cartoes:index===5?988:700+index*20,
   cac:7.2,tx_finalizacao:index===5?0.03866:0.03,tx_aprovacao:0.998,tx_proposta:1.18,
   cartoes_min_6m:600,cartoes_max_6m:1000,cac_min_6m:6,cac_max_6m:9,
   tx_final_min_6m:0.0241,tx_final_max_6m:0.0528,tx_aprovacao_min_6m:0.99,tx_aprovacao_max_6m:1,
   tx_proposta_min_6m:1,tx_proposta_max_6m:1.3,meses_observados:6,cac_meses_validos_6m:6,
   tx_final_meses_validos_6m:6,tx_aprovacao_meses_validos_6m:6,tx_proposta_meses_validos_6m:6,
   mes_fechado:true,regime_serie:'serasa_pos_2026_02',funil_semantica:'lead_pre_qualificado',
 }));
 const built=buildReport(input), rulers=records(built.tabs.VIEW_EDITORIAL_RULERS), layouts=records(built.tabs.VIEW_EDITORIAL_LAYOUTS);
 assert.equal(rulers.find(row=>row.slide_code==='P1'&&row.metric_key==='cartoes').value,988);
 assert.equal(rulers.find(row=>row.slide_code==='P4'&&row.metric_key==='tx_finalizacao').value,0.03866);
 assert.equal(layouts.find(row=>row.slide_code==='P4').layout,'volume_conversao_final');
 assert.equal(records(built.tabs.VIEW_EDITORIAL_CHART_REGISTRY).length,2);
 const monthlyChartTable=built.tabs.VIEW_EDITORIAL_MONTHLY_CHARTS;
 assert.ok(monthlyChartTable.every(row=>row.length===monthlyChartTable[0].length));
});
test('pacing exposes the aligned prior period and never invents an uncertified target',()=>{
 const input=seed();input.slideContracts=[contract('C4','VIEW_PACING_ISODAYS')];
 input.crm.push({...input.crm[0],'Data de Disparo':'2026-07-01','Cartões Gerados':8});
 const first=records(buildReport(input).tabs.VIEW_PACING_ISODAYS)[0];
 assert.equal(first.day_of_period,1);
 assert.equal(first.previous_equivalent_date,'2026-07-01');
 assert.equal(first.previous_equivalent_cumulative_cards,8);
 assert.equal(first.certified_target_cumulative_cards,'');
});
test('partial-month pacing compares the same calendar days of the prior month',()=>{
 const input=seed();input.periodStart='2026-09-01';input.periodEnd='2026-09-11';input.slideContracts=[contract('C4','VIEW_PACING_ISODAYS')];
 input.crm=[
   {...input.crm[0],'Data de Disparo':'2026-09-01','Cartões Gerados':10},
   {...input.crm[0],'Data de Disparo':'2026-08-01','Cartões Gerados':8},
   {...input.crm[0],'Data de Disparo':'2026-08-21','Cartões Gerados':99},
 ];
 const first=records(buildReport(input).tabs.VIEW_PACING_ISODAYS)[0];
 assert.equal(first.previous_equivalent_date,'2026-08-01');
 assert.equal(first.previous_equivalent_cumulative_cards,8);
});
test('missing B2C falls back to native CRM instead of hiding valid numbers',()=>{
 const input=seed();input.manifest.data_reading_integrated=null;input.manifest.source_cutoffs.b2c=null;
 input.slideContracts[1].required_fields=['crm_cards','crm_cost'];
 const built=buildReport(input), slide=built.slides.find(row=>row.slide_code==='C3');
 assert.equal(built.tabs.VIEW_SCORECARD_INTEGRATED.length,1);
 assert.equal(slide.source_view,'VIEW_SCORECARD_NATIVE');assert.equal(slide.fallback_applied,'VIEW_SCORECARD_NATIVE');
 assert.equal(slide.run_eligibility,'render_com_limites');
 assert.equal(records(built.tabs.VIEW_SCORECARD_NATIVE).find(row=>row.metric==='cartoes_crm').current,10);
});
test('required metric is checked even when its table has rows',()=>{
 const input=seed();input.slideContracts[1].required_fields=['crm_cards','crm_cost'];input.crm[0]['Custo Total Campanha']=null;
 const slide=buildReport(input).slides.find(row=>row.slide_code==='C3');
 assert.deepEqual(slide.missing_required_fields,['crm_cost']);assert.equal(slide.run_eligibility,'render_com_limites');
});
test('inactive slides and completed collectors are not false signals',()=>{
 const input=seed();input.slideContracts[1].active=false;input.collectionRuns=[{source:'meta',status:'complete',rows_rejected:0}];const built=buildReport(input);
 assert.equal(built.slides.some(slide=>slide.slide_code==='C3'),false);
 assert.equal(records(built.tabs.VIEW_QUALITY_INCIDENTS).some(row=>row.status==='complete'),false);
});
test('media uses certified result at ad grain, not most frequent event or mixed windows',()=>{
 const input=seed();input.media=[{date:'2026-08-01',ad_id:'ad1',channel:'meta',campaign:'CAMP',spend:300}];
 const event={business_date:'2026-08-01',ad_id:'ad1',channel:'meta',campaign_name:'CAMP',source:'meta_results',grain_level:'ad',grain_role:'fact',canonical_event:'start_trial',source_event_name:'conversions:start_trial_mobile_app',effective_attribution_window:'7d_click',value:10,observation_status:'available'};
 input.eventMap=[{...event,is_primary_measure:true,confidence:'trusted',certified_at:'2026-07-01',valid_from:'2026-07-01'}];
 input.mediaActions=[event,{...event,grain_level:'campaign',grain_role:'reconciliation'},{...event,source:'meta_attributed',source_event_name:'page_view',canonical_event:'page_view',value:100}];
 let row=records(buildReport(input).tabs.VIEW_MEDIA_CAMPAIGNS)[0];
 assert.equal(row.result_value,10);assert.equal(row.cpa_value,30);assert.equal(row.result_event,'start_trial');
 input.media.push({...input.media[0],date:'2026-08-02'});row=records(buildReport(input).tabs.VIEW_MEDIA_CAMPAIGNS)[0];
 assert.equal(row.cpa_value,'');assert.equal(row.result_state,'partial');
 input.mediaActions.push({...event,effective_attribution_window:'1d_click'});row=records(buildReport(input).tabs.VIEW_MEDIA_CAMPAIGNS)[0];
 assert.equal(row.result_value,'');assert.equal(row.cpa_value,'');
});
test('identical business content across attempts has identical idempotency key',async()=>{
 const input=seed(); const first=await artifact(input);input.runId='22222222-2222-4222-8222-222222222222';
 const second=await artifact(input);
 assert.equal(second.idempotency_key,first.idempotency_key,JSON.stringify(Object.keys(first.tabs).filter(key=>JSON.stringify(first.tabs[key])!==JSON.stringify(second.tabs[key]))));
});
test('certification rejects changed cells and narrative after build',async()=>{
 const original=await artifact(seed());assert.equal(certificationPassed(await validateArtifactIntegrity(original)),true);
 const cells=structuredClone(original);cells.tabs.VIEW_SCORECARD_INTEGRATED[2][1]=999999;
 assert.equal(certificationPassed(await validateArtifactIntegrity(cells)),false);
 const narrative=structuredClone(original);narrative.narratives[narrative.slides[0].slide_instance_id]='Alterado';
 assert.equal(certificationPassed(await validateArtifactIntegrity(narrative)),false);
 const source=structuredClone(original);source.sources.crm[0]['Cartões Gerados']=999;
 assert.equal(certificationPassed(await validateArtifactIntegrity(source)),false);
 const auxiliary=structuredClone(original);auxiliary.tabs.VIEW_METRIC_DICTIONARY[1][0]='Alterado';
 assert.equal(certificationPassed(await validateArtifactIntegrity(auxiliary)),false);
 assert.throws(()=>canonicalJson({metric:Infinity}));
});
