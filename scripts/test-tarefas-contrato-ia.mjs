import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const admin='00000000-0000-4000-8000-000000000001',member='11111111-1111-4111-8111-111111111111',outsider='33333333-3333-4333-8333-333333333333';
const file=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const daily=file('_daily_view.sql'),kanban=file('_daily_kanban.sql'),belong=file('_tarefas_pertencimento.sql'),subs=file('_sub_tarefas.sql'),contract=file('_tarefas_contrato_ia.sql');

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
  await db.exec(contract);
  await db.exec(`insert into public.daily_partners(key,name,color,position) values('plurix','Plurix','#7c3aed',1),('dia','Dia','#dc2626',2)`);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const entry=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_entry($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  const work=async(body,id=null,rev=null)=>(await one('select public.growth_save_development_task($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  return {db,q,one,as,entry,work};
}




const tree=async(one,body)=>(await one('select public.growth_save_task_tree($1) r',[JSON.stringify(body)])).r;
const tpl=async(one,body,id=null,rev=null)=>(await one('select public.growth_save_task_template($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;

test('modelo não guarda conclusão e cria a Tarefa com as Sub Tarefas numa transação',async()=>{
  const {db,as,one,q}=await fixture();try{
    await as(member);
    const m=await tpl(one,{key:'piloto-liberacao',title:'Piloto com liberação',body:{
      task:{title:'Piloto (modelo)',status:'concluida',resolution:'antiga',completed_criteria:[0],acceptance_criteria:['Decisão registrada'],details:{completed_on:'2026-11-01',kind:'piloto'}},
      subtasks:[{title:'Conferir público',subtask_group:'Preparação'},{title:'Homologar seedlist',subtask_group:'Validação',due_in_days:7}]}});
    assert.equal(m.body.task.status,undefined);assert.equal(m.body.task.resolution,undefined);assert.equal(m.body.task.details.completed_on,undefined);
    const r=await tree(one,{template_key:'piloto-liberacao',task:{title:'Piloto Mulher · Mensal',task_key:'SEG-PIL-MUL-MEN',workspace:'cross_sell'}});
    assert.equal(r.task.title,'Piloto Mulher · Mensal');assert.equal(r.task.status,'backlog');assert.deepEqual(r.task.acceptance_criteria,['Decisão registrada']);
    assert.equal(r.subtasks.length,2);
    assert.deepEqual(r.subtasks.map(s=>s.task_key),['SEG-PIL-MUL-MEN-01','SEG-PIL-MUL-MEN-02']);
    assert.ok(r.subtasks.every(s=>s.parent_task_id===r.task.id));assert.equal(r.subtasks[1].subtask_group,'Validação');assert.ok(r.subtasks[1].due_date);
    const more=await tree(one,{parent_id:r.task.id,subtasks:[{title:'Decidir continuidade'}]});
    assert.equal(more.task.id,r.task.id);assert.equal(more.subtasks[0].task_key,'SEG-PIL-MUL-MEN-03');
    assert.equal((await q('select id from growth_development_tasks where parent_task_id=$1',[r.task.id])).length,3);
  }finally{await db.close();}
});

test('falha em uma Sub Tarefa desfaz a árvore inteira',async()=>{
  const {db,as,one,q}=await fixture();try{
    await as(member);
    const before=(await q('select id from growth_development_tasks')).length;
    await assert.rejects(tree(one,{task:{title:'Árvore que falha'},subtasks:[{title:'Primeira etapa'},{title:''}]}),/task_tree_invalid/);
    assert.equal((await q('select id from growth_development_tasks')).length,before);
    await assert.rejects(tree(one,{template_key:'nao-existe'}),/template_not_found/);
  }finally{await db.close();}
});

test('quem não é membro não usa o contrato',async()=>{
  const {db,as,one}=await fixture();try{
    await as(outsider);
    await assert.rejects(tree(one,{task:{title:'Tentativa de fora'}}),/development_access_denied/);
    await assert.rejects(tpl(one,{key:'x1',title:'Modelo'}),/development_access_denied/);
  }finally{await db.close();}
});
