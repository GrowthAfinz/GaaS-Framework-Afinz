import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const sql=readFileSync(new URL('../supabase/migrations/20261007203329_sfmc_package_ingestion.sql',import.meta.url),'utf8').replace(/^\uFEFF/,'');
const actor='11111111-1111-4111-8111-111111111111';
const bootstrap=`
create role anon;create role authenticated;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema public,auth to authenticated,anon;
create table communication_templates(template_id text primary key,title text,channel text,status text,source_system text,metadata jsonb default '{}',original_path text,updated_at timestamptz default now());
create table activities(id uuid primary key default gen_random_uuid(),"Activity name / Taxonomia" text,jornada text,"Canal" text,"Data de Disparo" timestamptz,template_id text references communication_templates on update cascade,updated_at timestamptz default now());
create table communication_slots(id uuid primary key default gen_random_uuid(),journey_name text,activity_name text,channel text,current_template_id text references communication_templates on update cascade,source text,coverage_status text,metadata jsonb default '{}',unique(journey_name,activity_name,channel));
`;
async function db(){
 const d=new PGlite();await d.exec(bootstrap);await d.exec(sql);await d.exec(sql);
 await d.query("select set_config('request.jwt.claim.sub',$1,false)",[actor]);return d;
}
function message(extra={}){
 return {occurrence_key:'journeys/1:1:sms',journey_name:'JOR_AQS_TEST',journey_name_raw:'JOR_AQS_TEST',journey_version:1,journey_origin_id:'1',activity_key:'sms',activity_name:'afz_x_sms_test',entry_de:null,entry_filter:null,paths:[],asset_name:'Test',link_url:null,utm:{},is_optout:false,alerts:[],content:{schema_version:1,channel:'SMS',meta_template_name:null,body_text:'Olá ${1}',body_params:['%%FIRST_NAME%%'],footer:null,buttons:[],banner_url:null,sms_from:'29776'},...extra};
}
async function stage(d,m=message()){
 const pkg={package_sha256:randomUUID().replaceAll('-','').repeat(2),file_name:'test.zip',package_name:'Test',package_version:1,parser_version:'1.0.0',journeys_count:1,messages:[m]};
 const r=await d.query('select public.stage_sfmc_package($1::jsonb,$2) id',[JSON.stringify(pkg),'BU teste']);return {id:r.rows[0].id,pkg};
}
async function decision(d,id,extra={}){
 const r=await d.query('select id from sfmc_package_messages where import_id=$1',[id]);
 return {message_id:r.rows[0].id,template_id:'b2c_Test_D1',activity_ids:[],start_date:null,end_date:null,evidence:'',set_current:true,expected_current_id:null,...extra};
}
async function preview(d,id,decisions){
 const r=await d.query('select public.preview_sfmc_package_apply($1,$2::jsonb) result',[id,JSON.stringify(decisions)]);return r.rows[0].result;
}
async function apply(d,id,decisions,p,key=randomUUID()){
 const r=await d.query('select public.apply_sfmc_package_import($1,$2::jsonb,$3,$4) result',[id,JSON.stringify(decisions),p.preview_token,key]);return r.rows[0].result;
}
test('migration repetível; staging isolado; aplicação cria FK antes e é idempotente',async()=>{
 const d=await db();try{
  const s=await stage(d);const again=await d.query('select public.stage_sfmc_package($1::jsonb,$2) id',[JSON.stringify(s.pkg),'BU teste']);assert.equal(again.rows[0].id,s.id);
  assert.equal((await d.query('select count(*)::int n from communication_templates')).rows[0].n,0);
  const a=(await d.query('insert into activities("Activity name / Taxonomia",jornada,"Canal","Data de Disparo") values($1,$2,$3,$4) returning id',[message().activity_name,' JOR_AQUISICAO_TEST ','SMS','2026-09-02T03:00:00Z'])).rows[0].id;
  const dec=await decision(d,s.id,{activity_ids:[a],start_date:'2026-09-02',end_date:'2026-09-02',evidence:'Confirmação operacional'});
  const p=await preview(d,s.id,[dec]);assert.equal(p.activities,1);assert.equal(p.new_templates,1);
  const key=randomUUID();await apply(d,s.id,[dec],p,key);await apply(d,s.id,[dec],p,key);
  assert.equal((await d.query('select count(*)::int n from sfmc_package_application_runs')).rows[0].n,1);
  assert.equal((await d.query('select template_id from activities where id=$1',[a])).rows[0].template_id,dec.template_id);
  assert.equal((await d.query('select count(*)::int n from communication_template_contents where is_current')).rows[0].n,1);
 }finally{await d.close();}
});
test('bloqueia outra jornada, período, jornada nula, conflito e ausência de evidência',async()=>{
 const d=await db();try{
  const s=await stage(d);
  for(const [journey,date,linked] of [['OTHER','2026-09-02T03:00:00Z',null],['JOR_AQS_TEST','2026-09-01T03:00:00Z',null],[null,'2026-09-02T03:00:00Z',null],['JOR_AQS_TEST','2026-09-02T03:00:00Z','other']]){
   if(linked)await d.query("insert into communication_templates(template_id,channel)values('other','SMS') on conflict do nothing");
   const a=(await d.query('insert into activities("Activity name / Taxonomia",jornada,"Canal","Data de Disparo",template_id)values($1,$2,$3,$4,$5)returning id',[message().activity_name,journey,'SMS',date,linked])).rows[0].id;
   const dec=await decision(d,s.id,{activity_ids:[a],start_date:'2026-09-02',end_date:'2026-09-02',evidence:'Confirmado'});
   await assert.rejects(preview(d,s.id,[dec]),/fora|vinculado/);
  }
  const dec=await decision(d,s.id,{activity_ids:[randomUUID()]});await assert.rejects(preview(d,s.id,[dec]),/período e evidência/);
  assert.equal((await d.query('select count(*)::int n from sfmc_package_application_runs')).rows[0].n,0);
 }finally{await d.close();}
});
test('simulação desatualizada aborta atomicamente; novas execuções não são vinculadas',async()=>{
 const d=await db();try{
  const s=await stage(d);const dec=await decision(d,s.id);const p=await preview(d,s.id,[dec]);
  await d.query("insert into communication_templates(template_id,channel)values('b2c_Test_D1','SMS')");
  await assert.rejects(apply(d,s.id,[dec],p),/desatualizada/);
  assert.equal((await d.query('select count(*)::int n from communication_template_contents')).rows[0].n,0);
  await apply(d,s.id,[dec],await preview(d,s.id,[dec]));
  const a=(await d.query('insert into activities("Activity name / Taxonomia",jornada,"Canal","Data de Disparo")values($1,$2,$3,$4)returning id',[message().activity_name,'JOR_AQS_TEST','SMS','2026-09-02T03:00:00Z'])).rows[0].id;
  assert.equal((await d.query('select template_id from activities where id=$1',[a])).rows[0].template_id,null);
 }finally{await d.close();}
});
test('variantes não substituem atual nem curadoria manual; origem preservada',async()=>{
 const d=await db();try{
  await d.query("insert into communication_templates(template_id,channel)values('b2c_Test_D1','SMS')");
  await d.query("insert into communication_slots(journey_name,activity_name,channel,current_template_id,source,metadata)values('JOR_AQS_TEST','afz_x_sms_test','SMS','b2c_Test_D1','manual','{}')");
  const s=await stage(d);const dec=await decision(d,s.id);await apply(d,s.id,[dec],await preview(d,s.id,[dec]));
  const c=(await d.query('select id from communication_template_contents where is_current')).rows[0].id;
  const s2=await stage(d,message({content:{...message().content,body_text:'Outro texto'}}));const dec2=await decision(d,s2.id,{set_current:false});await apply(d,s2.id,[dec2],await preview(d,s2.id,[dec2]));
  assert.equal((await d.query('select id from communication_template_contents where is_current')).rows[0].id,c);
  assert.equal((await d.query('select count(*)::int n from communication_template_contents')).rows[0].n,2);
  assert.equal((await d.query('select count(*)::int n from communication_template_content_observations')).rows[0].n,2);
  assert.equal((await d.query('select source from communication_slots')).rows[0].source,'manual');
  const next=(await d.query('select id from communication_template_contents where not is_current')).rows[0].id;
  await assert.rejects(d.query('select public.select_communication_template_content($1,$2)',[next,randomUUID()]),/atual mudou/);
  await d.query('select public.select_communication_template_content($1,$2)',[next,c]);
  assert.equal((await d.query('select id from communication_template_contents where is_current')).rows[0].id,next);
 }finally{await d.close();}
});
test('anon bloqueado; authenticated lê mas não altera a revisão diretamente',async()=>{
 const d=await db();try{
  await d.exec('set role anon');await assert.rejects(d.query("select public.stage_sfmc_package('{}','BU')"),/permission denied/);
  await d.exec('reset role');const s=await stage(d);
  await d.exec('set role authenticated');
  assert.equal((await d.query('select count(*)::int n from sfmc_package_imports')).rows[0].n,1);
  await assert.rejects(d.query("update sfmc_package_messages set decision='applied'"),/permission denied/);
  const dec=await decision(d,s.id);await apply(d,s.id,[dec],await preview(d,s.id,[dec]));
 }finally{await d.close();}
});


test('recusa dois canais para ID novo e payload inválido, sem escrita parcial',async()=>{
 const d=await db();try{
  const first=message();const second=message({occurrence_key:'journeys/1:1:wpp',activity_key:'wpp',content:{...message().content,channel:'WhatsApp'}});
  const pkg={package_sha256:'f'.repeat(64),file_name:'test.zip',package_name:'Test',package_version:1,parser_version:'1.0.0',journeys_count:1,messages:[first,second]};
  const id=(await d.query('select public.stage_sfmc_package($1::jsonb,$2) id',[JSON.stringify(pkg),'BU teste'])).rows[0].id;
  const rows=(await d.query('select id from sfmc_package_messages where import_id=$1',[id])).rows;
  const decisions=await Promise.all(rows.map(async r=>({...await decision(d,id),message_id:r.id,set_current:false})));
  await assert.rejects(preview(d,id,decisions),/canais diferentes/);
  assert.equal((await d.query('select count(*)::int n from communication_templates')).rows[0].n,0);
  const bad={...pkg,package_sha256:'e'.repeat(64),messages:[message({content:{...message().content,footer:{bad:true}}})]};
  await assert.rejects(d.query('select public.stage_sfmc_package($1::jsonb,$2)',[JSON.stringify(bad),'BU teste']),/estrutura válida/);
  assert.equal((await d.query('select count(*)::int n from sfmc_package_imports')).rows[0].n,1);
 }finally{await d.close();}
});
