import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fixture, sample } from './test-insurance-foundation.mjs';

const admin = '11111111-1111-4111-8111-111111111111', viewer = '22222222-2222-4222-8222-222222222222';
const note = '33333333-3333-4333-8333-333333333333', other = '44444444-4444-4444-8444-444444444444', pack = '55555555-5555-4555-8555-555555555555';
const migration = readFileSync('supabase/migrations/20261104171150_portfolio_knowledge_contracts.sql', 'utf8');
async function setup() {
  const f = await fixture(), db = f.db;
  await db.exec(`reset role;
    alter table public.gaas_vault_notes add title text,add frontmatter jsonb default '{}',add content_markdown text default '';
    insert into public.gaas_vault_notes(id,relative_path,content_hash,title,frontmatter) values('${note}','10-Resultados/Mecanicas/Seguros.md','base','Seguros','{"analytics":{"domain":"renta"}}'),('${other}','10-Resultados/Mecanicas/Outra.md','other','Outra','{}');
    alter table public.gaas_knowledge_contributions add status text default 'pending',add created_by uuid,add changes jsonb;
    create table public.gaas_knowledge_packs(id uuid primary key,created_by uuid);insert into public.gaas_knowledge_packs values('${pack}','${admin}');
    create table public.growth_investigations(id uuid,operation_id uuid);create table public.growth_operations(operation_id uuid,scope jsonb);
    create function public.growth_investigation_can_access(uuid,boolean default false) returns boolean language sql as $$select false$$;
    create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
    create function public.gaas_knowledge_submit(uuid,text,text,jsonb) returns uuid language plpgsql as $$declare result uuid:=gen_random_uuid();begin insert into public.gaas_knowledge_contributions(id,created_by,changes) values(result,auth.uid(),$4);return result;end$$;
  `);
  const attention = readFileSync('supabase/migrations/20261029213441_growth_loop_attention.sql', 'utf8');
  await db.exec(attention.slice(0, attention.indexOf('create function public.growth_loop_reconcile()')) + '\ncommit;');
  await db.exec(`create table public.growth_loop_note_links(item_id uuid references public.growth_loop_items,revision integer,path text,expected_hash text,contribution_id uuid references public.gaas_knowledge_contributions,primary key(item_id,revision,path,expected_hash));`);
  await db.exec(migration);
  await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);set role authenticated;`);
  const scalar = async (sql, args=[]) => (await db.query(sql,args)).rows[0].n;
  const certify = async p => {
    const saved = await f.save(p), data = await scalar('select public.insurance_read_snapshot($1) n',[saved.id]);
    await scalar('select public.insurance_certify_snapshot($1,$2,$3) n',[saved.id,data.snapshot_hash,JSON.stringify({SOURCE_SCOPE_REVIEW:'Escopo conferido no material sintetico deste teste.',CACHED_INPUTS_REVIEW:'Formulas conferidas no material sintetico deste teste.'})]);
    return saved.id;
  };
  return {...f,scalar,certify};
}

test('shared report contract omits workbook cells; scopes preserve zero/null; viewers cannot see drafts', async () => {
  const {db,save,scalar}=await setup();
  try {
    const {id}=await save(sample());
    const data=await scalar('select public.report_data_read($1,$2,false) n',[id,JSON.stringify({products:['mulher'],metrics:['sessions','contracts_digital'],periods:['2026-06']})]);
    assert.equal(data.schema,'gaas-report-data/1');
    assert.equal(data.metrics.length,2);
    assert.equal(data.metrics.find(m=>m.code==='sessions').value,null);
    assert.equal(data.metrics.find(m=>m.code==='contracts_digital').value,0);
    assert.equal(data.sources[0].sheets,undefined);
    assert.deepEqual(data.rows,{dispatches:[],portfolio:[]});
    await assert.rejects(scalar('select public.report_data_read($1,$2,false) n',[id,'{"sql":"select *"}']),/INVALID_REPORT_SCOPE/);
    await db.exec(`select set_config('request.jwt.claim.sub','${viewer}',false);`);
    await assert.rejects(scalar('select public.report_data_read($1) n',[id]),/ACCESS_DENIED/);
    await db.exec('reset role;set role anon');
    await assert.rejects(scalar('select public.report_data_note_index() n'),/permission denied/);
  } finally {await db.close();}
});

test('catalog binds the canonical note; certification activates numbers and one existing-queue item',async()=>{
  const {db,save,scalar,certify}=await setup();
  try {
    const p=sample();
    await save(p);
    const index=await scalar('select public.report_data_note_index() n');
    assert.equal(index.length,1);assert.equal(index[0].note_id,note);
    assert.deepEqual(index[0].scope.metrics,['contracts_digital','registrations_digital','cost_per_contract']);
    assert.equal((await scalar('select public.report_data_note_blocks($1) n',[note]))[0].data,null);
    const id=await certify(p);
    const blocks=await scalar('select public.report_data_note_blocks($1) n',[note]);
    assert.equal(blocks[0].data.snapshot.id,id);assert.equal(blocks[0].data.metrics.length,6);
    assert.ok(blocks[0].data.metrics.every(m=>m.period==='window_total'));
    assert.deepEqual(await scalar('select public.report_data_note_blocks($1) n',[other]),[]);
    await certify(p);
    await db.exec('reset role');
    assert.equal(await scalar("select count(*)::int n from public.growth_loop_items where kind='data_review'"),1);
    assert.equal(await scalar('select max(revision)::int n from public.growth_loop_items'),1);
    assert.equal(await scalar("select count(*)::int n from growth_data.note_impacts where status='ready'"),1);
    assert.equal(await scalar('select count(*)::int n from public.gaas_knowledge_contributions'),0);
  } finally {await db.close();}
});

test('another source version with identical scoped facts creates no new editorial notice; a changed fact revises it',async()=>{
  const {db,scalar,certify}=await setup();
  try {
    const p=sample();await certify(p);
    p.editorial={review:'Source metadata changed; facts stayed identical'};await certify(p);
    await db.exec('reset role');
    assert.equal(await scalar('select max(revision)::int n from public.growth_loop_items'),1);
    assert.equal(await scalar("select count(*)::int n from growth_data.note_impacts where status='not_applicable'"),1);
    await db.exec('set role authenticated');
    p.metrics.find(m=>m.product==='mulher'&&m.period==='window_total'&&m.code==='contracts_digital').value=1;
    p.metrics.find(m=>m.product==='mulher'&&m.period==='window_total'&&m.code==='contracts_digital').state='observed';
    const id=await certify(p);
    await db.exec('reset role');
    assert.equal(await scalar('select count(*)::int n from public.growth_loop_items'),1);
    assert.equal(await scalar('select max(revision)::int n from public.growth_loop_items'),2);
    assert.equal(await scalar("select evidence->>'snapshot_id' n from public.growth_loop_items"),id);
  } finally {await db.close();}
});

test('proposals stay pending, reject wrong notes/stale versions, link impacts, resolve only after incorporation',async()=>{
  const {db,scalar,certify}=await setup();
  try {
    await certify(sample());
    await db.exec('reset role');
    const item=(await db.query('select * from public.growth_loop_items')).rows[0];
    await db.exec('set role authenticated');
    const submit=(revision,path,hash='base')=>scalar('select public.growth_loop_submit_note($1,$2,$3,$4,$5,$6) n',[item.id,revision,pack,path,hash,'Editorial reviewed with evidence.']);
    await assert.rejects(submit(item.revision-1,'10-Resultados/Mecanicas/Seguros.md'),/loop_evidence_superseded/);
    await assert.rejects(submit(item.revision,'10-Resultados/Mecanicas/Outra.md','other'),/note_outside_scope/);
    const id=await submit(item.revision,'10-Resultados/Mecanicas/Seguros.md');
    assert.equal(await submit(item.revision,'10-Resultados/Mecanicas/Seguros.md'),id);
    await assert.rejects(scalar('select public.report_data_review_unchanged($1,$2,$3) n',[item.id,item.revision,'O texto existente ainda representa os limites observados.']),/PENDING_EDITORIAL_CONTRIBUTION/);
    await db.exec('reset role');
    assert.equal(await scalar('select status n from public.gaas_knowledge_contributions where id=$1',[id]),'pending');
    assert.equal(await scalar('select status n from growth_data.note_impacts'),'proposed');
    await db.query("update public.gaas_knowledge_contributions set status='approved' where id=$1",[id]);
    assert.equal(await scalar('select state n from public.growth_loop_items'),'needs_review');
    await db.query("update public.gaas_knowledge_contributions set status='incorporated' where id=$1",[id]);
    assert.equal(await scalar('select state n from public.growth_loop_items'),'resolved');
    assert.equal(await scalar('select status n from growth_data.note_impacts'),'applied');
    await db.exec("update public.gaas_vault_notes set content_hash='changed' where id='"+note+"';set role authenticated");
    await assert.rejects(submit(item.revision,'10-Resultados/Mecanicas/Seguros.md','changed'),/knowledge_stale_base/);
  } finally {await db.close();}
});

test('incorporating an older proposal cannot resolve a newer proposal for the same data revision',async()=>{
  const {db,scalar,certify}=await setup();
  try {
    await certify(sample());await db.exec('reset role');
    const item=(await db.query('select * from public.growth_loop_items')).rows[0];
    await db.exec('set role authenticated');
    const submit=markdown=>scalar('select public.growth_loop_submit_note($1,$2,$3,$4,$5,$6) n',[item.id,item.revision,pack,'10-Resultados/Mecanicas/Seguros.md','base',markdown]);
    const older=await submit('Primeira interpretacao revisavel.'),newer=await submit('Segunda interpretacao revisavel.');
    await db.exec('reset role');
    await db.query("update public.gaas_knowledge_contributions set status='incorporated' where id=$1",[older]);
    assert.equal(await scalar('select state n from public.growth_loop_items'),'needs_review');
    assert.equal(await scalar('select contribution_id n from growth_data.note_impacts'),newer);
    await db.query("update public.gaas_knowledge_contributions set status='incorporated' where id=$1",[newer]);
    assert.equal(await scalar('select state n from public.growth_loop_items'),'resolved');
  } finally {await db.close();}
});

test('keeping the editorial text requires an explicit scoped review; a viewer or stale revision cannot resolve it',async()=>{
  const {db,scalar,certify}=await setup();
  try {
    await certify(sample());await db.exec('reset role');
    const item=(await db.query('select * from public.growth_loop_items')).rows[0];
    const review=(revision,reason)=>scalar('select public.report_data_review_unchanged($1,$2,$3) n',[item.id,revision,reason]);
    await db.exec(`select set_config('request.jwt.claim.sub','${viewer}',false);set role authenticated`);
    await assert.rejects(review(item.revision,'O texto existente ainda representa os limites observados.'),/ACCESS_DENIED/);
    await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);`);
    await assert.rejects(review(item.revision-1,'O texto existente ainda representa os limites observados.'),/loop_evidence_superseded/);
    await assert.rejects(review(item.revision,'ok'),/REVIEW_REASON_REQUIRED/);
    await review(item.revision,'O texto existente ainda representa os limites observados.');
    await db.exec('reset role');
    assert.equal(await scalar('select state n from public.growth_loop_items'),'resolved');
    assert.equal(await scalar("select evidence->'editorial_review'->>'decision' n from growth_data.note_impacts"),'text_unchanged');
    assert.equal(await scalar('select count(*)::int n from public.gaas_knowledge_contributions'),0);
    assert.equal(await scalar('select content_hash n from public.gaas_vault_notes where id=$1',[note]),'base');
  } finally {await db.close();}
});

test('real references project the same metrics and daily rows without workbook cells', {skip:!process.env.INSURANCE_FIXTURE_DIR,timeout:120000},async()=>{
  const {db,save,scalar}=await setup();
  try {
    const {join}=await import('node:path');
    const {loadInsuranceRuntime}=await import('./insurance-export.mjs');
    const {parser}=await loadInsuranceRuntime();
    const packet=await parser.parseInsuranceFiles(['Performance_Geral_Seguros (1).xlsx','Radar_Portfolio_Afinz_Comite_Gestao_2026 1.xlsx'].map(name=>new File([readFileSync(join(process.env.INSURANCE_FIXTURE_DIR,name))],name)));
    await db.exec('reset role');
    for(const source of packet.sources){source.storage_path=`sources/${admin}/${source.sha256}.xlsx`;await db.query('insert into storage.objects(bucket_id,name) values($1,$2)',['insurance-reports',source.storage_path]);}
    await db.exec('set role authenticated');
    const {id}=await save(packet);
    const full=await scalar('select public.insurance_read_snapshot($1) n',[id]);
    const light=await scalar('select public.report_data_read($1,$2,true) n',[id,'{}']);
    const sort=metrics=>[...metrics].sort((a,b)=>JSON.stringify([a.product,a.period,a.code]).localeCompare(JSON.stringify([b.product,b.period,b.code])));
    assert.deepEqual(sort(light.metrics),sort(full.manifest.metrics));
    assert.deepEqual(light.rows.dispatches,full.manifest.dispatches);
    assert.deepEqual(light.rows.portfolio,full.manifest.portfolio);
    assert.ok(light.sources.every(source=>source.sheets===undefined));
    const fullBytes=Buffer.byteLength(JSON.stringify(full)),lightBytes=Buffer.byteLength(JSON.stringify(light));
    assert.ok(lightBytes<fullBytes/2);
    console.log(JSON.stringify({full_snapshot_bytes:fullBytes,light_report_bytes:lightBytes,reduction_percent:Math.round((1-lightBytes/fullBytes)*100)}));
  } finally {await db.close();}
});
