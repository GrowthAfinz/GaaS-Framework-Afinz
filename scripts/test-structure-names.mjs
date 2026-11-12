import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

// Nomes do Mapeamento e ligação projeto da Daily ↔ campanha do board: tudo por id, renomear não solta nada.
const admin='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222';
const mig=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key,email text);insert into auth.users values('${admin}','a@x'),('${member}','b@x');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
  create schema gaas_security;create table gaas_security.approved_members(user_id uuid primary key,enabled boolean not null default true);
  insert into gaas_security.approved_members values('${admin}',true),('${member}',true);
  create function gaas_security.is_approved_member() returns boolean language sql stable security definer as $$select exists(select 1 from gaas_security.approved_members where user_id=auth.uid() and enabled)$$;
  create table public.profiles(id uuid primary key,full_name text,email text);
  create table public.activities("Data de Disparo" timestamptz,parceiro_canonico text,"Cartões Gerados" numeric,"Propostas" numeric);
  grant usage on schema public,auth,gaas_security to authenticated,anon,service_role;
  grant execute on function auth.uid(),public.gaas_vault_is_admin(),gaas_security.is_approved_member() to authenticated,anon,service_role;
  grant select on public.activities to authenticated;`);
  for (const m of ['_crm_structure_board.sql','_crm_consumo_sfmc.sql','_sfmc_journey_map.sql','_daily_view.sql','_structure_names_daily_link.sql']) await db.exec(mig(m));
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const one=async(sql,p=[])=>(await db.query(sql,p)).rows[0];
  await as(admin);
  const p=(await one(`select public.crm_structure_save_pillar(null,null,$1) r`,[JSON.stringify({title:'Rentabilização'})])).r;
  const l=(await one(`select public.crm_structure_save_lane(null,null,$1) r`,[JSON.stringify({pillar_id:p.id,title:'Ativação'})])).r;
  const card=(await one(`select public.crm_structure_save_card(null,null,$1) r`,[JSON.stringify({lane_id:l.id,title:'Ofertas Vai de Visa'})])).r;
  await db.exec(`reset role;
    insert into sfmc_consumo_rules(priority,pattern,front,card_id,group_label) values
      (10,'POOL',null,'${card.id}',null),(20,'COB','Cobrança',null,'Cobrança'),(30,'COB_ATRASO','Cobrança',null,'Cobrança');
    insert into sfmc_journey_map(journey,card_id,front,group_label) values ('JOR_COB_X',null,'Cobrança','Cobrança');`);
  await as(admin);
  const option=async(kind,key,body)=>(await one('select public.gaas_daily_save_option($1,$2,$3) r',[kind,key,JSON.stringify(body)])).r;
  const project=async(body,id=null,rev=null)=>(await one('select public.gaas_daily_save_project($1,$2,$3) r',[id,rev,JSON.stringify(body)])).r;
  await option('frente','re',{name:'Rentabilização',short:'Re',color:'#7c3aed'});
  return {db,as,one,card,project,lane:l};
}

test('projeto da Daily liga na campanha por id e o nome do card pode mudar sem soltar',async()=>{
  const {db,as,one,card,project}=await fixture();try{
    const a=await project({name:'Pool de Ofertas Visa',frente_key:'re',structure_card_id:card.id});
    const b=await project({name:'Pool Black Visa',frente_key:'re',structure_card_id:card.id});
    assert.equal(a.structure_card_id,card.id);assert.equal(b.structure_card_id,card.id,'vários projetos na mesma campanha');
    await one(`select public.crm_structure_save_card($1,$2,$3) r`,[card.id,card.revision,JSON.stringify({title:'Pool de Ofertas | Black Visa'})]);
    const r=await one(`select c.title from daily_projects p join crm_structure_cards c on c.id=p.structure_card_id where p.id=$1`,[a.id]);
    assert.equal(r.title,'Pool de Ofertas | Black Visa');
    const cleared=await project({structure_card_id:''},a.id,a.revision);
    assert.equal(cleared.structure_card_id,null,'desligar a campanha');
    await as(member);
    await assert.rejects(project({name:'Outro',frente_key:'re',structure_card_id:'00000000-0000-4000-8000-000000000000'}),/daily_card_invalid/);
  }finally{await db.close();}
});

test('renomear grupo troca regras e mapa juntos; só admin',async()=>{
  const {db,as,one}=await fixture();try{
    assert.equal((await one(`select public.sfmc_rename_group('Cobrança','Cobrança e acordos') r`)).r,3);
    await db.exec('reset role');
    assert.equal((await one(`select count(*)::int n from sfmc_consumo_rules where group_label='Cobrança e acordos'`)).n,2);
    assert.equal((await one(`select group_label from sfmc_journey_map where journey='JOR_COB_X'`)).group_label,'Cobrança e acordos');
    await as(admin);
    await assert.rejects(one(`select public.sfmc_rename_group('Não existe','Novo nome')`),/sfmc_group_not_found/);
    await assert.rejects(one(`select public.sfmc_rename_group('Cobrança e acordos','x')`),/sfmc_group_name_invalid/);
    await as(member);
    await assert.rejects(one(`select public.sfmc_rename_group('Cobrança e acordos','Outro')`),/crm_structure_access_denied/);
  }finally{await db.close();}
});

test('grupo vira campanha: regras e vínculos passam a apontar para o card',async()=>{
  const {db,as,one,lane}=await fixture();try{
    const nc=(await one(`select public.crm_structure_save_card(null,null,$1) r`,[JSON.stringify({lane_id:lane.id,title:'Cobrança'})])).r;
    assert.equal((await one(`select public.sfmc_promote_group('Cobrança',$1) r`,[nc.id])).r,3);
    await db.exec('reset role');
    const rows=(await db.query(`select card_id,group_label from sfmc_consumo_rules where pattern like 'COB%'`)).rows;
    assert.ok(rows.every(x=>x.card_id===nc.id&&x.group_label===null));
    assert.equal((await one(`select card_id from sfmc_journey_map where journey='JOR_COB_X'`)).card_id,nc.id);
    await as(member);
    await assert.rejects(one(`select public.sfmc_promote_group('X',$1)`,[nc.id]),/crm_structure_access_denied/);
  }finally{await db.close();}
});
