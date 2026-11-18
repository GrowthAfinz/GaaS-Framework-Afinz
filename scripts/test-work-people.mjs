import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const admin='00000000-0000-4000-8000-000000000001',member='11111111-1111-4111-8111-111111111111',outsider='33333333-3333-4333-8333-333333333333';
const file=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const daily=file('_daily_view.sql'),kanban=file('_daily_kanban.sql'),people=file('_pessoas_do_trabalho.sql');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key,email text);insert into auth.users values('${admin}'),('${member}'),('${outsider}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create schema gaas_security;create table gaas_security.approved_members(user_id uuid primary key,enabled boolean not null default true);
  insert into gaas_security.approved_members values('${admin}',true),('${member}',true);
  create function gaas_security.is_approved_member() returns boolean language sql stable security definer as $$select exists(select 1 from gaas_security.approved_members where user_id=auth.uid() and enabled)$$;
  create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
  create table public.profiles(id uuid primary key,full_name text,email text);
  create table public.activities("Data de Disparo" timestamptz,parceiro_canonico text,"Cartões Gerados" numeric,"Propostas" numeric);
  create table public.growth_work_initiatives(id uuid primary key default gen_random_uuid(),title text not null,workspace text not null,description text not null default '',
    source_note text,revision integer not null default 1,created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
    phase text not null default 'context',guiding_question text not null default '',context_links jsonb not null default '[]',phase_labels jsonb not null default '{}',aliases text[] not null default '{}');
  create table public.growth_work_initiative_events(id uuid primary key default gen_random_uuid(),initiative_id uuid not null references public.growth_work_initiatives(id),
    revision integer not null,actor_id uuid,before_data jsonb,after_data jsonb not null,created_at timestamptz not null default now(),unique(initiative_id,revision));
  create table public.growth_development_tasks(id uuid primary key default gen_random_uuid(),task_key text not null unique,title text not null,description text not null default '',
    area text not null default 'Loop de Memória',priority text not null default 'P2',status text not null default 'backlog',owner_label text,due_date date,dependencies text[] not null default '{}',
    acceptance_criteria text[] not null default '{}',completed_criteria integer[] not null default '{}',blocked_reason text,resolution text,source_note text,revision integer not null default 1,
    created_by uuid not null references auth.users(id),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),workspace text not null default 'sdd',
    work_type text not null default 'task',initiative_id uuid references public.growth_work_initiatives(id),related_workspaces text[] not null default '{}',next_action text not null default '',
    details jsonb not null default '{}',links jsonb not null default '[]');
  alter table public.growth_development_tasks enable row level security;alter table public.growth_work_initiatives enable row level security;
  grant select on public.growth_development_tasks,public.growth_work_initiatives to authenticated;
  grant usage on schema public,auth,gaas_security to authenticated,anon,service_role;
  grant execute on function auth.uid(),gaas_security.is_approved_member(),public.gaas_vault_is_admin() to authenticated,anon,service_role;
  grant select on public.activities to authenticated;`);
  await db.exec(daily);
  const q=async(sql,p=[])=>(await db.query(sql,p)).rows;
  const one=async(sql,p=[])=>(await q(sql,p))[0];
  await db.exec(`insert into public.daily_frentes(key,name,short,color,position) values('aq','Aquisição','Aq','#0e7490',1),('me','Meio de funil','Me','#0d9488',2),('re','Rentabilização','Re','#7c3aed',3);
  insert into public.growth_work_initiatives(id,title,workspace,created_by) values
    ('aaaaaaaa-0000-4000-8000-000000000001','Evolução das jornadas de aquisição','acquisition','${admin}'),
    ('aaaaaaaa-0000-4000-8000-000000000002','Pool de Ofertas — Vai de Visa','monetization','${admin}');
  insert into public.daily_projects(id,name,frente_key,created_by) values
    ('bbbbbbbb-0000-4000-8000-000000000001','Carrinho abandonado','aq','${admin}'),
    ('bbbbbbbb-0000-4000-8000-000000000002','Meio de funil: Upgrade e Repescagem','me','${admin}'),
    ('bbbbbbbb-0000-4000-8000-000000000003','Pool Parceiros (Star, Sipolatti)','re','${admin}'),
    ('bbbbbbbb-0000-4000-8000-000000000004','Recência de compra Plurix','re','${admin}');
  insert into public.growth_development_tasks(id,task_key,title,workspace,initiative_id,created_by) values
    ('cccccccc-0000-4000-8000-000000000001','DEV-pool','Montar vitrine do pool','monetization','aaaaaaaa-0000-4000-8000-000000000002','${admin}');`);
  await db.exec(kanban);
  await db.exec(`update auth.users set email='ana.silva@x.com' where id='${admin}'`);
  await db.exec(people);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const entry=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_entry($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  const work=async(body,id=null,rev=null)=>(await one('select public.growth_save_development_task($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  return {db,q,one,as,entry,work};
}


const person=async(one,body,id=null,rev=null)=>(await one('select public.gaas_work_save_person($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;

test('pessoa só com nome: cria, aparece na lista e vira responsável e seguidora de registro',async()=>{
  const {db,q,one,as,entry}=await fixture();try{
    await as(member);
    const p=await person(one,{name:'  Fulana   de Tal '});
    assert.equal(p.name,'Fulana de Tal');assert.equal(p.has_account,false);
    const list=await q('select id,name from public.gaas_daily_people()');
    assert.ok(list.some(r=>r.id===p.id&&r.name==='Fulana de Tal'));
    assert.ok(list.some(r=>r.id===admin&&r.name==='Ana Silva'));
    const people=await q('select id,has_account from public.gaas_work_people()');
    assert.equal(people.find(r=>r.id===p.id).has_account,false);
    const e=await entry({day:'2026-11-17',project_id:'bbbbbbbb-0000-4000-8000-000000000001',body:'Briefing do carrinho',responsible_id:p.id,follower_ids:[p.id,member]});
    assert.equal(e.responsible_id,p.id);assert.deepEqual([...e.follower_ids].sort(),[p.id,member].sort());
    await assert.rejects(entry({responsible_id:'dddddddd-0000-4000-8000-000000000009'},e.id,1),/daily_person_invalid/);
    await assert.rejects(person(one,{name:'fulana de tal'}),/person_name_taken/);
    await assert.rejects(person(one,{name:'Ana Silva'}),/person_name_taken/);
    await assert.rejects(person(one,{name:'x'}),/person_name_required/);
  }finally{await db.close();}
});

test('ligar à conta troca o nome pela conta na Daily e nas Tarefas, sem apagar a pessoa',async()=>{
  const {db,q,one,as,entry,work}=await fixture();try{
    await as(member);
    const p=await person(one,{name:'Fulana'});
    const e=await entry({day:'2026-11-17',project_id:'bbbbbbbb-0000-4000-8000-000000000001',body:'Carrinho',responsible_id:p.id,follower_ids:[p.id]});
    const t=await work({owner_label:'Fulana'},'cccccccc-0000-4000-8000-000000000001',1);
    const r=(await one('select public.gaas_work_link_person($1,$2) r',[p.id,member])).r;
    assert.equal(r.daily_entries,1);assert.equal(r.tasks,1);
    const after=await one('select responsible_id,follower_ids,revision from daily_entries where id=$1',[e.id]);
    assert.equal(after.responsible_id,member);assert.deepEqual(after.follower_ids,[member]);assert.equal(after.revision,e.revision+1);
    const task=await one('select owner_label,revision from growth_development_tasks where id=$1',[t.id]);
    assert.notEqual(task.owner_label,'Fulana');assert.equal(task.revision,t.revision+1);
    assert.equal((await one('select member_id from work_people where id=$1',[p.id])).member_id,member);
    assert.ok(!(await q('select id from public.gaas_work_people()')).some(x=>x.id===p.id));
    await assert.rejects(one('select public.gaas_work_link_person($1,$2) r',[p.id,member]),/person_not_found/);
  }finally{await db.close();}
});

test('quem não é membro não lê nem cria pessoas',async()=>{
  const {db,q,one,as}=await fixture();try{
    await as(member);await person(one,{name:'Beltrano'});
    await as(outsider);
    assert.equal((await q('select id from work_people')).length,0);
    await assert.rejects(person(one,{name:'Ciclano'}),/daily_access_denied/);
    await assert.rejects(q('select * from public.gaas_work_people()'),/daily_access_denied/);
  }finally{await db.close();}
});
