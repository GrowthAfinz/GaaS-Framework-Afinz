import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

test('Release 8 additive schema: immutable versions, explicit confirmation, RLS and scoped uniqueness',async()=>{
  const db=new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    const migration=readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_trigger_observation_release_8.sql'));
    await db.exec(readFileSync('supabase/migrations/'+migration,'utf8'));
    // Only synthetic metadata. No production registry or observed aggregate file in CI.
    const insert=`insert into public.growth_operations(operation_id,front,domain,scope,display_name,vault_note_path,valid_from,provenance)
      values ('CRM-test','crm_aquisicao','CRM','{"bu":"Synthetic","segment":"Synthetic","partner":"Synthetic"}','Synthetic','synthetic.md','2026-01-01','{"source":"synthetic"}');`;
    await db.exec('set role service_role;');
    await db.exec(insert);
    assert.equal((await db.query('select count(*)::integer as n from public.growth_operation_versions')).rows[0].n,1);
    await db.exec("update public.growth_operations set display_name='Synthetic revision' where operation_id='CRM-test'");
    assert.equal((await db.query('select count(*)::integer as n from public.growth_operation_versions')).rows[0].n,2);
    await assert.rejects(db.exec("update public.growth_operations set lifecycle='confirmada' where operation_id='CRM-test'"),/check constraint/);
    await assert.rejects(db.exec(insert.replace("'CRM-test'","'CRM-duplicate'")),/unique constraint/);
    await assert.rejects(db.exec(insert.replace("'CRM-test'","'CRM-invalid'").replace('"partner":"Synthetic"','"other":"Synthetic"')),/check constraint/);
    await assert.rejects(db.exec('delete from public.growth_operations'),/permission denied/);
    await db.exec(`insert into public.growth_trigger_rules(rule_id,front,family,metric,params,version,valid_from,backtest_ref,created_by)
      values('synthetic-v1','crm_aquisicao','T1','cards','{}',1,'2026-01-01','synthetic','synthetic');`);
    await assert.rejects(db.exec("update public.growth_trigger_rules set mode='ativo'"),/permission denied/);
    await db.exec('reset role;');
    await assert.rejects(db.exec("update public.growth_trigger_rules set mode='ativo'"),/immutable/);
    await assert.rejects(db.exec('delete from public.growth_operation_versions'),/immutable/);
    for(const role of ['anon','authenticated']) {
      await db.exec('set role '+role);
      await assert.rejects(db.exec('select * from public.growth_operations'),/permission denied/);
      await db.exec('reset role;');
    }
    const rls=await db.query("select count(*)::integer as n from pg_class where relname in ('growth_operations','growth_operation_versions','growth_trigger_rules') and relrowsecurity");
    assert.equal(rls.rows[0].n,3);
  } finally {await db.close();}
});
