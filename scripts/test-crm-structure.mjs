import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';

const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const migration=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_crm_structure_board.sql')),'utf8');

async function fixture(){
  const db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
  create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${other}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
  grant usage on schema public,auth to authenticated,anon,service_role;grant execute on function auth.uid(),public.gaas_vault_is_admin() to authenticated,service_role;`);
  await db.exec(migration);
  const as=async who=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${who}',false);set role authenticated;`);
  const rpc=fn=>async(body,id=null,rev=null)=>(await db.query(`select public.${fn}($1,$2,$3) r`,[id,rev,JSON.stringify(body)])).rows[0].r;
  const card=rpc('crm_structure_save_card'),lane=rpc('crm_structure_save_lane'),pillar=rpc('crm_structure_save_pillar');
  const one=async(sql,p=[])=>(await db.query(sql,p)).rows[0];
  await as(admin);
  const p=await pillar({title:'Aquisição',accent:'#00C6CC'});
  const aq=await lane({pillar_id:p.id,title:'Emissão de novas contas',metric_key:'aq'});
  const de=await lane({pillar_id:p.id,title:'Desbloqueio e 1º uso',metric_key:'de'});
  return {db,as,card,lane,pillar,one,p,aq,de};
}

test('admin monta pilar e colunas com posição incremental e histórico',async()=>{
  const {db,pillar,one,p,aq,de}=await fixture();try{
    assert.equal(p.position,1);assert.equal(aq.position,1);assert.equal(de.position,2);
    const p2=await pillar({title:'Rentabilização'});assert.equal(p2.position,2);
    await assert.rejects(pillar({title:'Cor ruim',accent:'azul'}),/check/);
    assert.equal((await one("select count(*)::int n from crm_structure_events where before_data is null")).n,4);
  }finally{await db.close();}
});

test('admin cria, edita e move campanha com revisão e histórico append-only',async()=>{
  const {db,card,one,aq,de}=await fixture();try{
    await card({lane_id:aq.id,title:'Repescagem',data_scope:{domain:'crm',scope:{segment:'Negados'}}});
    const c=await card({lane_id:aq.id,title:'Campanha Nosso Pay',bus:['Super Nosso','Nosso Pay','Super Nosso',' '],audience:'Novos clientes'});
    assert.equal(c.revision,1);assert.equal(c.declared_status,'bkl');assert.deepEqual(c.bus,['Nosso Pay','Super Nosso']);
    assert.equal(c.position,2);
    const same=await card({title:'Campanha Nosso Pay'},c.id,1);assert.equal(same.revision,1,'sem mudança não cria revisão');
    const moved=await card({lane_id:de.id},c.id,1);assert.equal(moved.revision,2);assert.equal(moved.position,1,'vai para o fim da coluna nova');
    const st=await card({declared_status:'rec',measurement:'c',data_scope:{domain:'crm',scope:{segment:'Leads_Parceiros'}}},c.id,2);
    assert.equal(st.declared_status,'rec');assert.equal(st.data_scope.scope.segment,'Leads_Parceiros');
    const cleared=await card({data_scope:null},c.id,3);assert.equal(cleared.data_scope,null);
    assert.equal((await one('select count(*)::int n from crm_structure_events where entity_id=$1',[c.id])).n,4);
    const ev=await one('select before_data->>\'lane_id\' b, after_data->>\'lane_id\' a from crm_structure_events where entity_id=$1 and revision=2',[c.id]);
    assert.equal(ev.b,aq.id);assert.equal(ev.a,de.id);
  }finally{await db.close();}
});

test('conflito de revisão, validações e coluna com campanhas ativa não arquiva',async()=>{
  const {db,card,lane,p,aq}=await fixture();try{
    const c=await card({lane_id:aq.id,title:'Campanha teste'});
    await card({title:'Campanha teste 2'},c.id,1);
    await assert.rejects(card({title:'Edição velha'},c.id,1),/crm_structure_revision_conflict/);
    await assert.rejects(card({lane_id:aq.id,title:'x'}),/crm_structure_title_required/);
    await assert.rejects(card({lane_id:aq.id,title:'Status ruim',declared_status:'ativo'}),/check/);
    await assert.rejects(card({lane_id:aq.id,title:'Escopo ruim',data_scope:{domain:'media'}}),/check/);
    await assert.rejects(card({lane_id:'0c5b0000-0000-4000-8000-0000000000ff',title:'Coluna inexistente'}),/crm_structure_lane_invalid/);
    await assert.rejects(lane({archived:true},aq.id,1),/crm_structure_lane_not_empty/);
    const l=await lane({pillar_id:p.id,title:'Nova coluna'});
    assert.equal((await lane({archived:true},l.id,1)).archived,true);
    await assert.rejects(card({lane_id:l.id,title:'Coluna arquivada'}),/crm_structure_lane_invalid/);
  }finally{await db.close();}
});

test('não admin e anônimo não escrevem; leitura só autenticada; tabelas sem escrita direta',async()=>{
  const {db,as,card,aq}=await fixture();try{
    await card({lane_id:aq.id,title:'Campanha existente'});
    await as(other);
    assert.equal((await db.query('select count(*)::int n from crm_structure_cards')).rows[0].n,1,'autenticado lê');
    await assert.rejects(card({lane_id:aq.id,title:'Tentativa sem acesso'}),/crm_structure_access_denied/);
    await assert.rejects(db.query("update crm_structure_cards set title='hack'"),/permission denied/);
    await assert.rejects(db.query('delete from crm_structure_events'),/permission denied/);
    await db.exec(`reset role;select set_config('request.jwt.claim.sub','',false);set role anon;`);
    await assert.rejects(db.query('select * from crm_structure_cards'),/permission denied/);
    await assert.rejects(card({lane_id:aq.id,title:'Tentativa anônima'}),/permission denied/);
  }finally{await db.close();}
});
