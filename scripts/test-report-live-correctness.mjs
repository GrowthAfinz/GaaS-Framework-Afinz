import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, toIsoDay, normalizeSnapshotManifest } from '../supabase/functions/report-sync/report-live-engine.ts';
import { buildArtifact, validateArtifactIntegrity, certificationPassed, canonicalJson, validateRegression } from '../supabase/functions/report-sync/report-live-versioning.ts';
import { parseReportRequest, reportRoleAllows, requiresReportOperator, selectReportWorkerCredential, verifyReportWorkerCredential } from '../supabase/functions/report-sync/report-live-policy.ts';

const contract = (code, view) => ({slide_code:code,section:'core',title:code,audience:'executivo',source_view:view,required_fields:[],optional_fields:[],fallback_view:null,implementation_readiness:'pronto_dado',conditional:false,display_order:1,active:true});
const seed = () => ({runId:'11111111-1111-4111-8111-111111111111',profile:'monthly_report',periodStart:'2026-08-01',periodEnd:'2026-08-31',
 manifest:{period_start:'2026-08-01',period_end:'2026-08-31',source_cutoffs:{crm:'2026-08-31',media:'2026-08-31',b2c:'2026-08-20'},data_reading_integrated:'2026-08-20',gap_closure_days:11,quality_status:'suspect',field_coverage:{crm_template:1},comparability:{}},
 crm:[{'Data de Disparo':'2026-08-01',BU:'B2C',Parceiro:'Serasa','Base Acionável':100,'Cartões Gerados':10,'Custo Total Campanha':100}],
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
