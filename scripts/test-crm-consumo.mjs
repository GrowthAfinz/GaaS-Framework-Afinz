import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const mig=suffix=>readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith(suffix)),'utf8');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${other}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
  grant usage on schema public,auth to authenticated,anon,service_role;grant execute on function auth.uid(),public.gaas_vault_is_admin() to authenticated,service_role;`);
  await db.exec(mig('_crm_structure_board.sql'));
  await db.exec(mig('_crm_consumo_sfmc.sql'));
  await db.exec(mig('_sfmc_journey_map.sql'));
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  await as(admin);
  const p=(await db.query(`select public.crm_structure_save_pillar(null,null,$1) r`,[JSON.stringify({title:'Aquisição'})])).rows[0].r;
  const l=(await db.query(`select public.crm_structure_save_lane(null,null,$1) r`,[JSON.stringify({pillar_id:p.id,title:'Emissão'})])).rows[0].r;
  const c=(await db.query(`select public.crm_structure_save_card(null,null,$1) r`,[JSON.stringify({lane_id:l.id,title:'Repescagem'})])).rows[0].r;
  await db.exec(`reset role;
    insert into sfmc_dispatch_daily(channel,activity_name,dispatch_date,journey,sent,delivered) values
      ('WPP','afz_wpp_a','2026-11-03','JOR_B',100,90),('WPP','afz_wpp_a','2026-11-03','JOR_A',100,90),
      ('WPP','afz_wpp_a','2026-11-03','JOR_C',40,30),('EMAIL','afz_mail_b','2026-11-04','JOR_A',500,null),
      ('SMS','afz_sms_c','2026-10-20','JOR_C',70,60),('SMS','afz_sms_zero','2026-11-05','JOR_C',0,0);`);
  await as(admin);
  const goal=(card,ch,v)=>db.query('select public.sfmc_save_card_goal($1,$2,$3)',[card,ch,v]);
  const one=async(sql,params=[])=>(await db.query(sql,params)).rows[0];
  return {db,as,c,goal,one};
}

test('envios compactos: uma linha por activity, dia e canal, jornada de maior volume e empate pela ordem',async()=>{
  const {db,one}=await fixture();try{
    const r=(await one(`select public.sfmc_consumo_dispatches('2026-11-01') r`)).r;
    assert.deepEqual(r.journeys,['JOR_A']);
    assert.deepEqual(r.activities,['afz_mail_b','afz_wpp_a']);
    assert.equal(r.rows.length,2,'zero e fora da data ficam de fora; repetidas viram uma');
    assert.deepEqual(r.rows[0],[0,1,'WPP','2026-11-03',100,90]);
    assert.deepEqual(r.rows[1],[0,0,'EMAIL','2026-11-04',500,null]);
    assert.equal(r.last,'2026-11-05');
    const all=(await one(`select public.sfmc_consumo_dispatches('2026-10-01') r`)).r;
    assert.equal(all.rows.length,3);
  }finally{await db.close();}
});

test('meta por campanha: só admin, canal válido, zero apaga',async()=>{
  const {db,as,c,goal,one}=await fixture();try{
    await goal(c.id,'WPP',1234.4);
    assert.equal((await one('select monthly_volume v from sfmc_card_goals where card_id=$1',[c.id])).v,'1234');
    await goal(c.id,'WPP',5000);
    assert.equal((await one('select count(*)::int n, max(monthly_volume) v from sfmc_card_goals')).v,'5000');
    await assert.rejects(goal(c.id,'PUSH',10),/sfmc_goal_channel_invalid/);
    await assert.rejects(goal('0c5b0000-0000-4000-8000-0000000000ff','SMS',10),/sfmc_goal_card_invalid/);
    await goal(c.id,'WPP',0);
    assert.equal((await one('select count(*)::int n from sfmc_card_goals')).n,0);
    await as(other);
    await assert.rejects(goal(c.id,'SMS',10),/crm_structure_access_denied/);
  }finally{await db.close();}
});

test('leitura só autenticada e sem escrita direta nas tabelas',async()=>{
  const {db,as}=await fixture();try{
    await as(other);
    assert.equal((await db.query('select count(*)::int n from sfmc_dispatch_daily')).rows[0].n,6);
    await assert.rejects(db.query("insert into sfmc_contract_plan values ('Aquisição','SMS','2026-08-01',10)"),/permission denied/);
    await assert.rejects(db.query("delete from sfmc_dispatch_daily"),/permission denied/);
    await assert.rejects(db.query("insert into sfmc_consumo_rules(pattern,group_label) values ('X','Y')"),/permission denied/);
    await db.exec(`reset role;select set_config('request.jwt.claim.sub','',false);set role anon;`);
    await assert.rejects(db.query('select * from sfmc_contract_plan'),/permission denied/);
    await assert.rejects(db.query(`select public.sfmc_consumo_dispatches('2026-01-01')`),/permission denied/);
  }finally{await db.close();}
});

test('regras e contrato validam o formato',async()=>{
  const {db}=await fixture();try{
    await db.exec('reset role');
    await assert.rejects(db.query("insert into sfmc_consumo_rules(pattern) values ('X')"),/check/);
    await assert.rejects(db.query("insert into sfmc_contract_plan values ('Aquisição','WPP','2026-08-01',10)"),/check/);
    await assert.rejects(db.query("insert into sfmc_contract_plan values ('Aquisição','SMS','2026-08-15',10)"),/check/);
    await db.query("insert into sfmc_contract_plan values ('Aquisição','WPPU','2026-08-01',10)");
  }finally{await db.close();}
});

test('mapeamento manual: admin salva, troca, limpa e valida; outros só leem',async()=>{
  const {db,as,c,one}=await fixture();try{
    const save=items=>db.query('select public.sfmc_save_journey_map($1) n',[JSON.stringify(items)]);
    assert.equal((await save([{journey:'JOR_A',card_id:c.id,front:'Aquisição'},{journey:'JOR_B',front:'Cobrança',group_label:'Cobrança'}])).rows[0].n,2);
    assert.equal((await one('select count(*)::int n from sfmc_journey_map')).n,2);
    await save([{journey:'JOR_A',front:null,group_label:'A classificar'}]);
    const a=await one("select card_id, group_label from sfmc_journey_map where journey='JOR_A'");
    assert.equal(a.card_id,null);assert.equal(a.group_label,'A classificar');
    await save([{journey:'JOR_B',clear:true}]);
    assert.equal((await one('select count(*)::int n from sfmc_journey_map')).n,1);
    await assert.rejects(save([{journey:'JOR_C'}]),/check/);
    await assert.rejects(save([{journey:' '}]),/sfmc_journey_map_invalid/);
    await assert.rejects(save([{journey:'JOR_D',card_id:'0c5b0000-0000-4000-8000-0000000000ff'}]),/sfmc_goal_card_invalid/);
    await as(other);
    assert.equal((await one('select count(*)::int n from sfmc_journey_map')).n,1);
    await assert.rejects(save([{journey:'JOR_E',group_label:'X y'}]),/crm_structure_access_denied/);
    await assert.rejects(db.query("delete from sfmc_journey_map"),/permission denied/);
  }finally{await db.close();}
});
