import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const admin='00000000-0000-4000-8000-000000000001',member='11111111-1111-4111-8111-111111111111',outsider='33333333-3333-4333-8333-333333333333';
const file=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');
const daily=file('_daily_view.sql'),kanban=file('_daily_kanban.sql'),belong=file('_tarefas_pertencimento.sql'),subs=file('_sub_tarefas.sql'),contract=file('_tarefas_contrato_ia.sql'),people=file('_pessoas_do_trabalho.sql'),fixes=file('_tarefas_correcoes_revisao.sql');

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
  await db.exec(belong);
  await db.exec(subs);
  await db.exec(contract);
  await db.exec(people);
  await db.exec(fixes);
  await db.exec(`insert into public.daily_partners(key,name,color,position) values('plurix','Plurix','#7c3aed',1),('dia','Dia','#dc2626',2)`);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const entry=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_entry($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  const work=async(body,id=null,rev=null)=>(await one('select public.growth_save_development_task($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  return {db,q,one,as,entry,work};
}





const tree=async(one,body)=>(await one('select public.growth_save_task_tree($1) r',[JSON.stringify(body)])).r;
const P1='bbbbbbbb-0000-4000-8000-000000000001',P2='bbbbbbbb-0000-4000-8000-000000000002',P3='bbbbbbbb-0000-4000-8000-000000000003';
const fails=async(p,code)=>assert.rejects(p,e=>String(e.message).includes(code));
const closed=async(one)=>(await tree(one,{task:{title:'Entrega fechada',task_key:'FEC',resolution:'feito',status:'concluida'},subtasks:[{title:'Etapa um',status:'concluida'}]})).task;

test('pai concluído não ganha Sub Tarefa aberta: nova, reaberta ou movida',async()=>{
  const {db,as,one,work}=await fixture();try{
    await as(member);
    const p=await closed(one);
    assert.equal(p.status,'concluida');
    await fails(tree(one,{parent_id:p.id,subtasks:[{title:'Etapa nova'}]}),'task_parent_closed');
    await fails(work({title:'Etapa avulsa',parent_task_id:p.id}),'task_parent_closed');
    const s=await one('select * from growth_development_tasks where parent_task_id=$1',[p.id]);
    await fails(work({status:'em_execucao'},s.id,s.revision),'task_parent_closed');
    const loose=await work({title:'Tarefa aberta solta'});
    await fails(work({parent_task_id:p.id},loose.id,loose.revision),'task_parent_closed');
    await work({title:'Etapa já feita',parent_task_id:p.id,status:'concluida'});
    const rev=(await one('select revision from growth_development_tasks where id=$1',[p.id])).revision;
    const reopened=await work({status:'planejando'},p.id,rev);
    assert.equal(reopened.status,'planejando');
    const again=await tree(one,{parent_id:p.id,subtasks:[{title:'Etapa nova'}]});
    assert.equal(again.subtasks[0].status,'backlog');
  }finally{await db.close();}
});

test('árvore pedida como concluída com filha aberta é recusada; com filhas fechadas conclui no fim',async()=>{
  const {db,as,one,q}=await fixture();try{
    await as(member);
    await fails(tree(one,{task:{title:'Entrega errada',task_key:'ERR',status:'concluida',resolution:'ok'},subtasks:[{title:'Sub aberta'}]}),'task_subtasks_pending');
    assert.equal((await q("select 1 from growth_development_tasks where task_key like 'ERR%'")).length,0);
    const p=await closed(one);
    assert.equal(p.status,'concluida');assert.equal(p.resolution,'feito');
  }finally{await db.close();}
});

test('chave da Sub Tarefa nova não colide com ex-filha, posição repetida ou chave feita à mão',async()=>{
  const {db,as,one,work}=await fixture();try{
    await as(member);
    const t=await tree(one,{task:{title:'Entrega com chaves',task_key:'COL'},subtasks:[{title:'Etapa A',position:1},{title:'Etapa B',position:1}]});
    assert.deepEqual(t.subtasks.map(s=>s.task_key),['COL-01','COL-02']);
    const b=t.subtasks[1];
    await work({parent_task_id:null},b.id,b.revision);
    await work({title:'Etapa feita à mão',task_key:'COL-03',parent_task_id:t.task.id});
    const more=await tree(one,{parent_id:t.task.id,subtasks:[{title:'Etapa C'},{title:'Etapa D'}]});
    assert.deepEqual(more.subtasks.map(s=>s.task_key),['COL-04','COL-05']);
  }finally{await db.close();}
});

test('project_ids mantém a ordem informada e troca projeto juntado pelo destino',async()=>{
  const {db,as,one,work}=await fixture();try{
    await as(member);
    const a=await work({title:'Tarefa de dois projetos',project_ids:[P3,P1,P3]});
    assert.deepEqual(a.project_ids,[P3,P1]);
    await one('select public.gaas_daily_merge_projects($1,$2) r',[P3,P2]);
    const after=await one('select project_ids from growth_development_tasks where id=$1',[a.id]);
    assert.deepEqual(after.project_ids,[P2,P1]);
    const b=await work({title:'Tarefa com projeto antigo',project_ids:[P3]});
    assert.deepEqual(b.project_ids,[P2]);
  }finally{await db.close();}
});

test('trocar só o workspace recalcula a frente e leva as Sub Tarefas',async()=>{
  const {db,as,one,work}=await fixture();try{
    await as(member);
    const t=await tree(one,{task:{title:'Entrega de aquisição',task_key:'WSP',front_key:'aq'},subtasks:[{title:'Etapa um'}]});
    const moved=await work({workspace:'monetization'},t.task.id,t.task.revision);
    assert.equal(moved.front_key,'re');
    const child=await one('select workspace,front_key from growth_development_tasks where id=$1',[t.subtasks[0].id]);
    assert.deepEqual([child.workspace,child.front_key],['monetization','re']);
  }finally{await db.close();}
});

test('pessoa só com nome: lista com revisão, renomear leva Tarefas, ligar grava histórico',async()=>{
  const {db,as,one,q,work,entry}=await fixture();try{
    await as(member);
    const ana=(await one(`select public.gaas_work_save_person(null,null,'{"name":"Ana"}') r`)).r;
    const listed=(await q('select * from public.gaas_work_people()')).find(p=>p.id===ana.id);
    assert.equal(listed.revision,ana.revision);
    const t=await work({title:'Tarefa da Ana',owner_label:'Ana'});
    await one('select public.gaas_work_save_person($1,$2,$3) r',[ana.id,listed.revision,JSON.stringify({name:'Ana Paula'})]);
    assert.equal((await one('select owner_label from growth_development_tasks where id=$1',[t.id])).owner_label,'Ana Paula');
    const e=await entry({day:'2026-11-20',project_id:P1,body:'Registro da Ana',responsible_id:ana.id});
    const count=async()=>(await q("select count(*)::int n from daily_events where entity='entry' and entity_id=$1",[e.id]))[0].n;
    const before=await count();
    const r=(await one('select public.gaas_work_link_person($1,$2) r',[ana.id,admin])).r;
    assert.equal(r.daily_entries,1);assert.equal(r.tasks,1);
    assert.equal(await count(),before+1);
    const ap=(await one(`select public.gaas_work_save_person(null,null,'{"name":"Paulinha"}') r`)).r;
    const r2=(await one('select public.gaas_work_link_person($1,$2) r',[ap.id,admin])).r;
    assert.equal(r2.merged,true);
    const bia=(await one(`select public.gaas_work_save_person(null,null,'{"name":"Bia"}') r`)).r;
    await one('select public.gaas_work_save_person($1,$2,$3) r',[bia.id,bia.revision,JSON.stringify({archived:true})]);
    assert.ok(!(await q('select id from public.gaas_work_people()')).some(p=>p.id===bia.id));
    assert.ok((await q('select id,archived from public.gaas_work_people(true)')).some(p=>p.id===bia.id&&p.archived));
    await fails(one('select public.gaas_work_link_person($1,$2) r',[bia.id,member]),'person_archived');
  }finally{await db.close();}
});
