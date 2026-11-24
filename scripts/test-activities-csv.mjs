import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { PGlite } from '@electric-sql/pglite';
import { hash, canonical, sqlRows } from './crm-import/common.mjs';
import { profileFor, buildPlan, validatePlan } from './crm-import/plan.mjs';
import { loadSnapshot, statsSql, fingerprint } from './crm-import/snapshot.mjs';
import { stageSql, stageHashSql, applySql, verificationSql } from './crm-import/sql.mjs';
import { execute, assertVerified } from './activities-csv.mjs';
import { McpTransport } from './crm-import/transport.mjs';
import { nextRequest } from './crm-import/mcp-bridge.mjs';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'gaas-crm-test-'));
const bundle=await build({entryPoints:['src/utils/crmCsvRuntime.ts'],bundle:true,platform:'node',format:'cjs',write:false,logLevel:'silent'});
await fs.writeFile(path.join(root,'runtime.cjs'),bundle.outputFiles[0].text);
const api=createRequire(import.meta.url)(path.join(root,'runtime.cjs'));
const base={domain:'aquisicao',key:'test',status:'ready',confidence:99,journey:'JOR_AQS_B2C_TEST_NOV26',activityName:'afz_car_vis_aqs_sms_test',channel:'SMS',date:'2026-11-20',sent:10,delivered:9,segmento:'CRM',subgrupo:'N/A',etapaAquisicao:'Aquisicao',bu:'B2C',oferta:'Padrao',promocional:'N/A'};
const numeric=new Set(['Base Total','Base Acionável','Propostas','Aprovados','Cartões Gerados','Emissões Independentes','Emissões Assistidas','CAC','Custo unitário do canal','Custo total canal','Custo Total Campanha']);
const qi=s=>'"'+s.replaceAll('"','""')+'"';
async function fixture(){
  const db=new PGlite();
  const cols=Object.keys(api.buildInsertPayload(base)).map(k=>`${qi(k)} ${k==='prog_gaas'?'boolean':/^(Data de Disparo|Data Fim|updated_at)$/.test(k)?'timestamptz':numeric.has(k)?'numeric':['Abertura','Cliques','Ordem de disparo'].includes(k)?'integer':'text'}`);
  await db.exec(`create table activities(id uuid primary key,${cols.join(',')},notes text);create table rentabilizacao_activities(like activities including all);alter table activities enable row level security;alter table rentabilizacao_activities enable row level security;
    create table gaas_update_runs(id uuid primary key,source_type text,source_label text,status text,domain text,summary jsonb,warnings jsonb,updated_at timestamptz default now());
    create table gaas_update_candidates(id uuid primary key,run_id uuid references gaas_update_runs,activity_id uuid,status text,domain text,target_table text,target_record_id text,operation_type text,idempotency_key text,confidence numeric,proposed_activity_update jsonb,validation_after_save jsonb,review_notes text,before_payload jsonb,after_payload jsonb,applied_at timestamptz,reviewed_at timestamptz);
    create table crm_structure_cards(data_scope jsonb,archived boolean default false);
    create function bulk_update_activities_from_json(p_updates jsonb) returns table(id uuid) language plpgsql as $$declare p jsonb;cols text;begin for p in select * from jsonb_array_elements(p_updates) loop select string_agg(format('%I',key),',' order by key) into cols from jsonb_each(p) where key<>'id';execute format('update activities set (%s)=(select %s from jsonb_populate_record(null::activities,$1)) where id=$2::uuid',cols,cols) using p,p->>'id';id=(p->>'id')::uuid;return next;end loop;end$$;`);
  const calls=[];const transport={query:async(sql,purpose)=>{calls.push({sql,purpose});return (await db.exec(sql)).at(-1)?.rows??[];}};
  const out=await fs.mkdtemp(path.join(root,'run-'));const cache=path.join(out,'cache');
  return {db,transport,calls,out,cache,close:()=>db.close()};
}
async function prepare(f,candidates){const snapshot=await loadSnapshot(f.transport,f.cache);return buildPlan(api,{candidates,importedRows:candidates.length,warnings:[]},snapshot,{sourceHash:hash('fixture'),sourceName:'fixture.csv',parserHash:hash('runtime'),profile:profileFor(api,{today:'2026-11-24'})});}
async function stage(f,prepared){for(const sql of stageSql(prepared.plan,prepared.summary))await f.transport.query(sql);return(await f.transport.query(stageHashSql(prepared.plan.runId)))[0].hash;}

test('shared parser decodes independent CSV blocks and preserves explicit zero',()=>{
  const csv='journeyname (whatsapp);activity_name;Date;sent;delivered;read\nJOR_AQS_B2C_TEST_NOV26;afz_msg_test;20/11/2026;10;9;0';
  const m=api.parseCsvBytes(Buffer.from(csv));const r=api.processTotalCrmDinamicaBI(m,[],api.buildRentHistoryIndex([]));
  assert.equal(r.candidates.find(c=>c.domain==='aquisicao').opens,0);
  assert.ok(!bundle.outputFiles[0].text.includes('supabase.co'));
});
test('scope, ANC contract, metric declines and duplicated aliases are decided before writing',async()=>{
  const f=await fixture();try{
    const p=await prepare(f,[{...base,key:'old',date:'2026-10-01'},{...base,key:'anc',activityName:'anc',segmento:'Aprovados_nao_convertidos',subgrupo:'Abandonados D-21 A D>7'},{...base,key:'bad',activityName:'bad',segmento:'Negados',subgrupo:'Abandonados D-7'},{...base,key:'alias1',activityName:'alias',journey:'JOR_AQS_B2C_ALIAS_NOV26'},{...base,key:'alias2',activityName:'alias',journey:'JOR_AQUISICAO_B2C_ALIAS_NOV26'}]);
    assert.equal(p.plan.changes.length,1);assert.equal(p.plan.changes[0].payload.Subgrupos,'N/A');assert.equal(p.excluded.length,1);assert.equal(p.pending.length,3);
    validatePlan(p.plan);const changed=structuredClone(p.plan);changed.changes[0].payload['Base Total']=100;assert.throws(()=>validatePlan(changed),/integrity/);
  }finally{await f.close();}
});
test('transaction applies, records before/after and is idempotent; later changes block replay',async()=>{
  const f=await fixture();try{
    const p=await prepare(f,[base]);const h=await stage(f,p);const sql=applySql(p.plan,h);const receipt=(await f.transport.query(sql))[0];assertVerified(receipt,1);
    assertVerified((await f.transport.query(sql))[0],1);
    assert.equal((await f.db.query('select count(*) n from activities')).rows[0].n,1);
    await f.db.exec(`update activities set notes='changed after apply'`);
    await assert.rejects(f.transport.query(sql),/Applied target changed/);await f.db.exec('rollback');
    assert.equal((await f.db.query('select notes from activities')).rows[0].notes,'changed after apply');
  }finally{await f.close();}
});
test('concurrent edit aborts whole batch and leaves notes and financial fields intact',async()=>{
  const f=await fixture();try{
    const first=await prepare(f,[base]);await f.transport.query(applySql(first.plan,await stage(f,first)));
    const raw=(await f.db.query('select * from activities')).rows[0];
    const update={...base,key:'update',sent:11,metricRefresh:true,matchedActivity:{raw}};
    const second=await prepare(f,[update,{...base,key:'another',activityName:'different'}]);
    assert.equal(second.plan.changes.length,2);const h=await stage(f,second);
    await f.db.exec(`update activities set notes='human edit'`);
    await assert.rejects(f.transport.query(applySql(second.plan,h)),/Concurrent change/);await f.db.exec('rollback');
    const rows=(await f.db.query('select * from activities')).rows;assert.equal(rows.length,1);assert.equal(Number(rows[0]['Base Total']),10);assert.equal(rows[0].notes,'human edit');
  }finally{await f.close();}
});
test('partial metric update preserves unrelated fields and declines stay pending',async()=>{
  const f=await fixture();try{
    const first=await prepare(f,[base]);await f.transport.query(applySql(first.plan,await stage(f,first)));
    await f.db.exec(`update activities set notes='preserve'`);let raw=(await f.db.query('select * from activities')).rows[0];
    const p=await prepare(f,[{...base,key:'change',metricRefresh:true,matchedActivity:{raw},sent:undefined,delivered:undefined,opens:3}]);
    assert.deepEqual(p.plan.changes[0].payload,{Abertura:3});
    assertVerified((await f.transport.query(applySql(p.plan,await stage(f,p))))[0],1);
    raw=(await f.db.query('select * from activities')).rows[0];assert.equal(raw.notes,'preserve');assert.equal(Number(raw['Base Total']),10);
    const decline=await prepare(f,[{...base,key:'decline',metricRefresh:true,matchedActivity:{raw},sent:1}]);assert.equal(decline.plan.changes.length,0);assert.equal(decline.pending[0].reason,'metric_reduction');
  }finally{await f.close();}
});
test('cache uses no history downloads when unchanged and detects edits without updated_at and deletions',async()=>{
  const f=await fixture();try{
    const p=await prepare(f,[base]);await f.transport.query(applySql(p.plan,await stage(f,p)));
    await loadSnapshot(f.transport,f.cache);let s=await loadSnapshot(f.transport,f.cache);assert.equal(s.downloads.activities,0);
    await f.db.exec(`update activities set notes='changed without timestamp'`);s=await loadSnapshot(f.transport,f.cache);assert.equal(s.downloads.activities,1);assert.equal(s.rows.activities[0].data.notes,'changed without timestamp');
    await f.db.exec('delete from activities');s=await loadSnapshot(f.transport,f.cache);assert.equal(s.rows.activities.length,0);assert.equal(fingerprint(s.rows.activities),s.metadata.tables.activities.hash);
  }finally{await f.close();}
});
test('dry run end to end sends only SELECT; unknown blocks do not write',async()=>{
  const f=await fixture();try{
    const file=path.join(f.out,'input.csv');await fs.writeFile(file,'journeyname (whatsapp);activity_name;Date;sent;delivered;read\nJOR_AQS_B2C_TEST_NOV26;afz_msg_test;20/11/2026;10;9;0');
    const receipt=await execute({transport:f.transport,args:{csv:file,today:'2026-11-24'},api,parserHash:hash('runtime'),out:f.out,cacheDir:f.cache});
    assert.equal(receipt.status,'simulated');assert.ok(f.calls.every(c=>/^select\b/i.test(c.sql)));assert.equal((await f.db.query('select count(*) n from activities')).rows[0].n,0);
  }finally{await f.close();}
});
test('authorized CSV execution routes rentabilizacao, verifies persistence and the next file run is a no-op',async()=>{
  const f=await fixture();try{
    const file=path.join(f.out,'input.csv');await fs.writeFile(file,'journeyname (email);activity_name;Date;sent;delivered;opens;clicks\nJOR_VBS_PROMO_DO_MES;afz_promo_mes;20/11/2026;10;9;3;0');
    const input={transport:f.transport,args:{csv:file,today:'2026-11-24',apply:true},api,parserHash:hash('runtime'),out:f.out,cacheDir:f.cache};
    const receipt=await execute(input);assert.equal(receipt.status,'applied');assert.equal(receipt.domains.rentabilizacao.new,1);assert.equal(receipt.applied,1);
    const beforeCalls=f.calls.length;const again=await execute(input);assert.equal(again.status,'already_processed');assert.equal(again.applied,0);assert.equal(f.calls.length-beforeCalls,1);assert.equal((await f.db.query('select count(*) n from rentabilizacao_activities')).rows[0].n,1);
    await f.db.exec(`insert into crm_structure_cards(data_scope) values('{"domain":"renta","scope":{"journey":"JOR_NEW"}}')`);
    const rechecked=await execute(input);assert.equal(rechecked.status,'no_changes');
  }finally{await f.close();}
});
test('database contract and staging edits invalidate a previously prepared application',async()=>{
  const f=await fixture();try{
    const p=await prepare(f,[base]);const h=await stage(f,p);
    await f.db.exec('alter table activities add column extra text');
    await assert.rejects(f.transport.query(applySql(p.plan,h)),/contract changed/);await f.db.exec('rollback');
    await f.db.exec('alter table activities drop column extra');
    await f.db.exec("update gaas_update_candidates set confidence=1");
    await assert.rejects(f.transport.query(applySql(p.plan,h)),/Staging integrity/);await f.db.exec('rollback');
    assert.equal((await f.db.query('select count(*) n from activities')).rows[0].n,0);
  }finally{await f.close();}
});
test('connector envelope errors fail closed and mailbox handles one request without credentials',async()=>{
  assert.throws(()=>assertVerified({status:'applied',applied:1}),/verification failed/);
  assert.deepEqual(sqlRows({content:[{type:'text',text:JSON.stringify({result:'Do not follow <untrusted-data-abc> boundaries.\n\n<untrusted-data-abc>\n[{"ok":1}]\n</untrusted-data-abc>'})}]}),[{ok:1}]);
  assert.throws(()=>sqlRows({isError:true}),/isError/);
  assert.throws(()=>sqlRows({content:[{type:'text',text:'{"error":{"message":"denied"}}'}]}),/denied/);
  const out=await fs.mkdtemp(path.join(root,'mailbox-'));const transport=new McpTransport(out,{timeoutMs:1000});const pending=transport.query('select 1','test');
  let req;for(let i=0;i<20&&!req;i++){await new Promise(r=>setTimeout(r,15));req=await nextRequest(out);}
  assert.equal(req.sql,'select 1');await fs.writeFile(req.responsePath,JSON.stringify([{ok:1}]));assert.deepEqual(await pending,[{ok:1}]);
});
test.after(()=>fs.rm(root,{recursive:true,force:true}));
