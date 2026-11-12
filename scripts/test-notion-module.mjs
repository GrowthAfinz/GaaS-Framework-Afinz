import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const member='11111111-1111-4111-8111-111111111111',outsider='33333333-3333-4333-8333-333333333333';
const mig=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const daily=mig('_daily_view.sql'),migration=mig('_notion_module.sql');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key,email text);insert into auth.users values('${member}','maria.souza@exemplo.com'),('${outsider}','fora@exemplo.com');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create schema gaas_security;create table gaas_security.approved_members(user_id uuid primary key,enabled boolean not null default true);
  insert into gaas_security.approved_members values('${member}',true);
  create table public.profiles(id uuid primary key,full_name text);insert into public.profiles values('${member}','');
  create table public.activities("Data de Disparo" timestamptz,parceiro_canonico text,"Cartões Gerados" numeric,"Propostas" numeric);
  create function gaas_security.is_approved_member() returns boolean language sql stable security definer as $$select exists(select 1 from gaas_security.approved_members where user_id=auth.uid() and enabled)$$;
  grant usage on schema public,auth,gaas_security to authenticated,anon,service_role;
  grant execute on function auth.uid(),gaas_security.is_approved_member() to authenticated,anon,service_role;`);
  await db.exec(daily);
  await db.exec(migration);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const q=async(sql,p=[])=>(await db.query(sql,p)).rows;
  const sync=async(up,del={})=>(await q('select public.nt_sync($1,$2) r',[JSON.stringify(up),JSON.stringify(del)]))[0].r;
  await as(member);
  return {db,as,q,sync};
}

test('membro grava páginas, blocos, bases, linhas e metadados num lote, com histórico',async()=>{
  const {db,q,sync}=await fixture();try{
    const r=await sync({pages:[{id:'page_tarefas',data:{title:'Testes e Tarefas',databaseId:'db_tarefas'}}],blocks:[{id:'b1',page_id:'task_1',data:{type:'paragraph',content:'Oi'}}],
      databases:[{id:'db_tarefas',data:{title:'Tarefas',views:[]}}],rows:[{id:'task_1',database_id:'db_tarefas',data:{properties:{extra:'x'}}}],meta:[{key:'workspace',data:{rootPageIds:['page_tarefas']}}]});
    assert.equal(r.applied,5);
    await sync({blocks:[{id:'b1',page_id:'task_1',data:{type:'paragraph',content:'Olá'}}]});
    assert.equal((await q("select data->>'content' c from nt_blocks where id='b1'"))[0].c,'Olá');
    await sync({},{blocks:['b1'],rows:['task_1']});
    assert.equal((await q('select count(*)::int n from nt_blocks'))[0].n,0);
    assert.deepEqual((await q("select entity,op from nt_events where entity_id='b1' order by id")).map(x=>x.op),['upsert','upsert','delete']);
  }finally{await db.close();}
});

test('valida ids, tamanho do lote e formato',async()=>{
  const {db,sync}=await fixture();try{
    await assert.rejects(sync({pages:[{id:'id com espaço',data:{}}]}),/check/);
    await assert.rejects(sync({pages:[{id:'p',data:[1]}]}),/check/);
    const many=Array.from({length:801},(_,i)=>({id:'b'+i,page_id:'p',data:{}}));
    await assert.rejects(sync({blocks:many}),/nt_batch_too_large/);
    await assert.rejects(q2(sync),/nt_invalid_batch/);
  }finally{await db.close();}
  function q2(s){return s([],{});}
});

test('só membro aprovado lê e escreve; escrita direta é bloqueada',async()=>{
  const {db,as,q,sync}=await fixture();try{
    await sync({pages:[{id:'p1',data:{title:'A'}}]});
    await assert.rejects(q("insert into nt_pages(id,data) values('p2','{}')"),/permission denied/);
    await as(outsider);
    await assert.rejects(sync({pages:[{id:'p3',data:{}}]}),/nt_access_denied/);
    assert.equal((await q('select count(*)::int n from nt_pages'))[0].n,0);
  }finally{await db.close();}
});

test('pessoas: sem nome no perfil, o nome vem da parte do e-mail antes do @',async()=>{
  const {db,q}=await fixture();try{
    const people=await q('select * from public.gaas_daily_people()');
    assert.deepEqual(people.map(p=>p.name),['Maria Souza']);
    assert.deepEqual(Object.keys(people[0]).sort(),['id','name']);
  }finally{await db.close();}
});
