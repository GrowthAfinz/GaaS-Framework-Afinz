import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const admin='00000000-0000-4000-8000-000000000001',member='11111111-1111-4111-8111-111111111111',outsider='33333333-3333-4333-8333-333333333333';
const file=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const daily=file('_daily_view.sql'),kanban=file('_daily_kanban.sql'),belong=file('_tarefas_pertencimento.sql'),subs=file('_sub_tarefas.sql');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${member}'),('${outsider}');
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
  await db.exec(belong);
  await db.exec(subs);
  await db.exec(`insert into public.daily_partners(key,name,color,position) values('plurix','Plurix','#7c3aed',1),('dia','Dia','#dc2626',2)`);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const entry=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_entry($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  const work=async(body,id=null,rev=null)=>(await one('select public.growth_save_development_task($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  return {db,q,one,as,entry,work};
}



const T='cccccccc-0000-4000-8000-000000000001',P1='bbbbbbbb-0000-4000-8000-000000000001';
const sub=(work,parent,title,extra={})=>work({title,task_key:'SUB-'+Math.random().toString(36).slice(2,9),parent_task_id:parent,...extra});

test('Sub Tarefa herda iniciativa, frente e projetos do pai e acompanha quando o pai muda',async()=>{
  const {db,as,work,one}=await fixture();try{
    await as(member);
    const parent=await work({project_ids:[P1]},T,1);
    const s=await sub(work,parent.id,'Conferir público do piloto',{subtask_group:'Preparação',position:1,initiative_id:'aaaaaaaa-0000-4000-8000-000000000001'});
    assert.equal(s.parent_task_id,parent.id);assert.equal(s.initiative_id,parent.initiative_id);assert.equal(s.front_key,parent.front_key);
    assert.deepEqual(s.project_ids,[P1]);assert.equal(s.subtask_group,'Preparação');
    const moved=await work({initiative_id:'aaaaaaaa-0000-4000-8000-000000000001'},parent.id,parent.revision);
    const child=await one('select initiative_id,front_key,revision from growth_development_tasks where id=$1',[s.id]);
    assert.equal(child.initiative_id,moved.initiative_id);assert.equal(child.front_key,moved.front_key);assert.equal(child.revision,s.revision+1);
  }finally{await db.close();}
});

test('um nível só: Sub Tarefa não tem Sub Tarefa e Tarefa com filhas não vira Sub Tarefa',async()=>{
  const {db,as,work}=await fixture();try{
    await as(member);
    const s=await sub(work,T,'Revisar comunicações');
    await assert.rejects(sub(work,s.id,'Neta'),/task_parent_nested/);
    const other=await work({title:'Outra Tarefa grande',workspace:'monetization'});
    await assert.rejects(work({parent_task_id:other.id},T,1),/task_has_subtasks/);
    await assert.rejects(work({parent_task_id:s.id},s.id,s.revision),/task_parent_invalid|task_parent_nested/);
  }finally{await db.close();}
});

test('marcar Sub Tarefa não pede evidência; o pai só conclui com todas fechadas e com a entrega',async()=>{
  const {db,as,work}=await fixture();try{
    await as(member);
    const a=await sub(work,T,'Homologar seedlist',{acceptance_criteria:['Seedlist conferida']});
    const b=await sub(work,T,'Registrar liberação');
    const aDone=await work({status:'concluida'},a.id,a.revision);assert.equal(aDone.status,'concluida');
    await assert.rejects(work({status:'concluida',resolution:'Piloto liberado'},T,1),/task_subtasks_pending/);
    await work({status:'cancelada'},b.id,b.revision);
    await assert.rejects(work({status:'concluida'},T,1),/task_completion_evidence_required/);
    const done=await work({status:'concluida',resolution:'Piloto liberado'},T,1);assert.equal(done.status,'concluida');
  }finally{await db.close();}
});

test('transformar Sub Tarefa em Tarefa mantém id, chave e histórico',async()=>{
  const {db,as,work,one}=await fixture();try{
    await as(member);
    const s=await sub(work,T,'Ajustar LP do parceiro',{subtask_group:'Conteúdo'});
    const t=await work({parent_task_id:null},s.id,s.revision);
    assert.equal(t.id,s.id);assert.equal(t.task_key,s.task_key);assert.equal(t.parent_task_id,null);assert.equal(t.subtask_group,null);
    assert.ok((await one('select count(*)::int n from growth_development_tasks where id=$1',[s.id])).n===1);
  }finally{await db.close();}
});
