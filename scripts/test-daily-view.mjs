import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const member='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',outsider='33333333-3333-4333-8333-333333333333';
const migration=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_daily_view.sql')),'utf8');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${member}'),('${other}'),('${outsider}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create schema gaas_security;create table gaas_security.approved_members(user_id uuid primary key,enabled boolean not null default true);
  insert into gaas_security.approved_members values('${member}',true),('${other}',true);
  create function gaas_security.is_approved_member() returns boolean language sql stable security definer as $$select exists(select 1 from gaas_security.approved_members where user_id=auth.uid() and enabled)$$;
  create table public.profiles(id uuid primary key,full_name text,email text);insert into public.profiles values('${member}','Pessoa Um','um@exemplo.com');
  create table public.activities("Data de Disparo" timestamptz,parceiro_canonico text,"Cartões Gerados" numeric,"Propostas" numeric);
  insert into public.activities values('2026-11-06 03:00:00+00','Plurix',156,217),('2026-11-06 15:00:00+00','Plurix',4,6),('2026-11-07 02:30:00+00','Plurix',1,1),('2026-11-06 12:00:00+00',null,2,3);
  grant usage on schema public,auth,gaas_security to authenticated,anon,service_role;
  grant execute on function auth.uid(),gaas_security.is_approved_member() to authenticated,anon,service_role;
  grant select on public.activities to authenticated;`);
  await db.exec(migration);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const q=async(sql,p=[])=>(await db.query(sql,p)).rows;
  const one=async(sql,p=[])=>(await q(sql,p))[0];
  const entry=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_entry($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  const project=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_project($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  const option=async(kind,key,body)=>(await one('select public.gaas_daily_save_option($1,$2,$3) r',[kind,key,JSON.stringify(body)])).r;
  await as(member);
  await option('frente','re',{name:'Rentabilização',short:'Re',color:'#7c3aed'});
  await option('partner','plurix',{name:'Plurix',color:'#A855F7',crm_key:'Plurix'});
  await option('tag','ti',{name:'Depende de TI',color:'#ca8a04'});
  const pool=await project({name:'Pool de Ofertas Visa',frente_key:'re',partner_keys:['plurix','plurix']});
  return {db,as,q,one,entry,project,option,pool};
}

test('membro cria frente, parceiro, tag e projeto com histórico',async()=>{
  const {db,one,option,pool}=await fixture();try{
    assert.deepEqual(pool.partner_keys,['plurix']);assert.equal(pool.revision,1);
    const t=await option('tag',null,{name:'Crédito Pessoal',color:'#4f46e5'});assert.equal(t.key,'credito-pessoal');
    const t2=await option('tag',null,{name:'Crédito Pessoal'});assert.notEqual(t2.key,t.key);
    const ren=await option('frente','re',{name:'Rentabilização CRM',revision:1});assert.equal(ren.name,'Rentabilização CRM');assert.equal(ren.revision,2);
    await assert.rejects(option('frente','re',{name:'Velha',revision:1}),/daily_revision_conflict/);
    await assert.rejects(option('nada',null,{name:'x'}),/daily_kind_invalid/);
    assert.equal((await one("select count(*)::int n from daily_events")).n,7);
  }finally{await db.close();}
});

test('registro do dia: cria, edita com revisão, valida e exclui sem apagar',async()=>{
  const {db,one,entry,pool}=await fixture();try{
    const e=await entry({day:'2026-11-11',project_id:pool.id,body:'  Validar entrega das ofertas ',tag_keys:['ti'],follower_ids:[other]});
    assert.equal(e.body,'Validar entrega das ofertas');assert.equal(e.responsible_id,member);assert.equal(e.position,1);
    const e2=await entry({body:'Validar entrega para a base acionável'},e.id,1);assert.equal(e2.revision,2);
    await assert.rejects(entry({body:'Conflito'},e.id,1),/daily_revision_conflict/);
    await assert.rejects(entry({day:'2026-11-11',project_id:pool.id,body:'x',tag_keys:['inexistente']}),/daily_tags_invalid/);
    await assert.rejects(entry({day:'2026-11-11',project_id:pool.id,body:'   '}),/daily_body_required|check/);
    await assert.rejects(entry({day:'2026-11-11',project_id:pool.id,body:'x',follower_ids:['44444444-4444-4444-8444-444444444444']}),/daily_person_invalid/);
    const second=await entry({day:'2026-11-11',project_id:pool.id,body:'Segundo'});assert.equal(second.position,2);
    await entry({deleted:true},e.id,2);
    assert.equal((await one("select count(*)::int n from daily_entries where deleted_at is null")).n,1);
    assert.equal((await one("select count(*)::int n from daily_events where entity='entry'")).n,4);
    await assert.rejects(entry({body:'Volta'},e.id,3),/daily_not_found/);
  }finally{await db.close();}
});

test('projeto: nome único entre ativos, arquivado não recebe registro novo e junção move registros',async()=>{
  const {db,one,entry,project,pool}=await fixture();try{
    await assert.rejects(project({name:'pool de ofertas visa',frente_key:'re'}),/daily_project_name_taken|unique/);
    await assert.rejects(project({name:'Sem frente',frente_key:'xx'}),/daily_frente_invalid/);
    const black=await project({name:'Pool Black Visa',frente_key:'re'});
    await entry({day:'2026-11-10',project_id:black.id,body:'Ajuste no e-mail'});
    await entry({day:'2026-11-13',project_id:black.id,body:'SMS e Wpp'});
    const r=(await one('select public.gaas_daily_merge_projects($1,$2) r',[black.id,pool.id])).r;assert.equal(r.moved,2);
    assert.equal((await one('select count(*)::int n from daily_entries where project_id=$1',[pool.id])).n,2);
    const b=await one('select archived,merged_into from daily_projects where id=$1',[black.id]);assert.equal(b.archived,true);assert.equal(b.merged_into,pool.id);
    await assert.rejects(entry({day:'2026-11-14',project_id:black.id,body:'Novo'}),/daily_project_invalid/);
    const again=await project({name:'Pool Black Visa',frente_key:'re'});assert.ok(again.id);
  }finally{await db.close();}
});

test('acesso: só membro aprovado lê e escreve; pessoas saem sem e-mail',async()=>{
  const {db,as,q,one,entry,pool}=await fixture();try{
    const people=await q('select * from public.gaas_daily_people()');assert.equal(people.length,2);
    assert.deepEqual(Object.keys(people[0]).sort(),['id','name']);assert.ok(people.some(p=>p.name==='Pessoa Um'));
    await as(outsider);
    await assert.rejects(entry({day:'2026-11-11',project_id:pool.id,body:'Intruso'}),/daily_access_denied/);
    await assert.rejects(q('select * from public.gaas_daily_people()'),/daily_access_denied/);
    assert.equal((await q('select * from daily_projects')).length,0);
    await assert.rejects(q("insert into daily_projects(name,frente_key) values('Direto','re')"),/permission denied|policy/);
    await as(member);
    await assert.rejects(q("update daily_projects set name='Direto'"),/permission denied/);
    assert.equal((await one('select count(*)::int n from daily_projects')).n,1);
  }finally{await db.close();}
});

test('cartões CRM por dia usam o fuso de São Paulo e agrupam parceiro vazio em N/A',async()=>{
  const {db,q}=await fixture();try{
    const rows=await q("select day::text,partner,cards::int,proposals::int from public.gaas_daily_crm_cards('2026-11-06','2026-11-06') order by partner");
    assert.deepEqual(rows,[{day:'2026-11-06',partner:'N/A',cards:2,proposals:3},{day:'2026-11-06',partner:'Plurix',cards:161,proposals:224}]);
  }finally{await db.close();}
});
