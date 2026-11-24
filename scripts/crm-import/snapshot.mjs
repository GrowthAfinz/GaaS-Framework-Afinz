import fs from 'node:fs/promises';
import path from 'node:path';
import { TABLES, md5, literal } from './common.mjs';
export const AUDIT_TABLES = [...TABLES, 'gaas_update_runs', 'gaas_update_candidates'];
export const schemaExpression = `(select md5(string_agg(table_name||':'||column_name||':'||udt_name||':'||is_nullable||':'||coalesce(column_default,''),',' order by table_name,ordinal_position)) from information_schema.columns where table_schema='public' and table_name in (${AUDIT_TABLES.map(literal).join(',')}))`;
export const rpcExpression = `md5(pg_get_functiondef('public.bulk_update_activities_from_json(jsonb)'::regprocedure))`;
export const triggerExpression = `(select md5(coalesce(string_agg(pg_get_triggerdef(t.oid)||pg_get_functiondef(t.tgfoid),',' order by t.tgname,t.tgrelid),'')) from pg_trigger t where t.tgrelid in ('public.activities'::regclass,'public.rentabilizacao_activities'::regclass) and not t.tgisinternal)`;
export const mappingExpression = `(select md5(coalesce(string_agg(jsonb_build_object('scope',data_scope,'archived',archived)::text,',' order by data_scope::text,archived),'')) from public.crm_structure_cards)`;
export const statsSql = `select jsonb_build_object('schemaHash',${schemaExpression},'rpcHash',${rpcExpression},'triggerHash',${triggerExpression},'mappingHash',${mappingExpression},'columns',(select jsonb_agg(jsonb_build_object('table',table_name,'name',column_name,'type',udt_name)) from information_schema.columns where table_schema='public' and table_name in (${AUDIT_TABLES.map(literal).join(',')})),'rls',(select jsonb_object_agg(relname,relrowsecurity) from pg_class where oid in ('public.activities'::regclass,'public.rentabilizacao_activities'::regclass)),'tables',jsonb_build_object(${TABLES.map(t => `${literal(t)},(select jsonb_build_object('count',count(*),'latest',max(updated_at)::text,'hash',md5(coalesce(string_agg(id::text||':'||md5(to_jsonb(t)::text),',' order by id),''))) from public.${t} t)`).join(',')})) as metadata`;
export function fingerprint(rows) {
  return md5([...rows].sort((a,b)=>a.data.id.localeCompare(b.data.id)).map(x=>x.data.id+':'+x.fingerprint).join(','));
}
export function validateMetadata(meta) {
  if (!meta?.schemaHash || !meta.rpcHash || !meta.triggerHash || !meta.mappingHash) throw new Error('Missing live database contract');
  for(const table of TABLES) if(meta.rls?.[table]!==true) throw new Error('Unexpected RLS state: '+table);
  const required={activities:['id','jornada','Canal','Data de Disparo','Activity name / Taxonomia','updated_at'],rentabilizacao_activities:['id','jornada','Canal','Data de Disparo','Activity name / Taxonomia','updated_at'],gaas_update_runs:['id','domain','summary','status'],gaas_update_candidates:['id','run_id','before_payload','after_payload','validation_after_save','target_record_id','operation_type','idempotency_key']};
  for(const [table,fields] of Object.entries(required)) for(const field of fields) if(!meta.columns.some(c=>c.table===table&&c.name===field)) throw new Error(`Missing column: ${table}.${field}`);
}
async function readJson(file) { try{return JSON.parse(await fs.readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;} }
async function pages(transport, table, where='') {
  const rows=[];let cursor='';
  for(;;){const query=`select to_jsonb(t) as data,md5(to_jsonb(t)::text) as fingerprint from public.${table} t where true ${where} ${cursor?`and id>${literal(cursor)}::uuid`:''} order by id limit 1000`;
    const page=await transport.query(query,'snapshot:'+table); rows.push(...page);
    if(page.length<1000)break;cursor=page.at(-1).data.id;
  }return rows;
}
export async function loadSnapshot(transport, cacheDir) {
  await fs.mkdir(cacheDir,{recursive:true});
  for(let attempt=0;attempt<2;attempt++){
    const meta=(await transport.query(statsSql,'preflight'))[0]?.metadata;validateMetadata(meta);
    const old=await readJson(path.join(cacheDir,'metadata.json'));
    const rows={},downloads={};
    for(const table of TABLES){
      let cached=await readJson(path.join(cacheDir,table+'.json'));
      const prior=old?.tables?.[table],current=meta.tables[table];
      if(cached && (!prior || cached.length!==prior.count || fingerprint(cached)!==prior.hash)) cached=null;
      if(cached && prior.hash===current.hash){rows[table]=cached;downloads[table]=0;continue;}
      if(cached && prior.latest && current.latest && prior.latest<current.latest){
        const delta=await pages(transport,table,`and updated_at>=${literal(prior.latest)}::timestamptz`);
        const byId=new Map(cached.map(r=>[r.data.id,r]));delta.forEach(r=>byId.set(r.data.id,r));cached=[...byId.values()];downloads[table]=delta.length;
        if(cached.length!==current.count || fingerprint(cached)!==current.hash) cached=null;
      }else cached=null;
      if(!cached){cached=await pages(transport,table);downloads[table]=cached.length;}
      rows[table]=cached;
    }
    const end=(await transport.query(statsSql,'snapshot-stability'))[0]?.metadata;
    if(TABLES.some(t=>meta.tables[t].hash!==end.tables[t].hash||rows[t].length!==end.tables[t].count||fingerprint(rows[t])!==end.tables[t].hash))continue;
    if(meta.schemaHash!==end.schemaHash||meta.rpcHash!==end.rpcHash||meta.triggerHash!==end.triggerHash||meta.mappingHash!==end.mappingHash)continue;
    for(const t of TABLES)await fs.writeFile(path.join(cacheDir,t+'.json'),JSON.stringify(rows[t]));
    await fs.writeFile(path.join(cacheDir,'metadata.json'),JSON.stringify(end));
    return {metadata:end,rows,downloads};
  }throw new Error('Database changed during snapshot. Retry without writing data.');
}

// Patch the verified cache only if all production changes are explained by this run.
// Unexpected trigger side effects/other writers leave the previous cache intact.
export async function reconcileAppliedCache(transport, cacheDir, plan) {
  const prior=await readJson(path.join(cacheDir,'metadata.json'));
  if(!prior||TABLES.some(t=>prior.tables[t].hash!==plan.snapshot[t].hash))return null;
  const rows={};for(const t of TABLES){rows[t]=await readJson(path.join(cacheDir,t+'.json'));if(!rows[t]||fingerprint(rows[t])!==prior.tables[t].hash)return null;}
  const applied=await transport.query(`select target_table,after_payload as data,md5(after_payload::text) as fingerprint from public.gaas_update_candidates where run_id=${literal(plan.runId)}::uuid and status='applied' order by id`,'cache-after-apply');
  if(applied.length!==plan.changes.length)return null;
  for(const t of TABLES){const byId=new Map(rows[t].map(r=>[r.data.id,r]));for(const row of applied.filter(r=>r.target_table===t))byId.set(row.data.id,{data:row.data,fingerprint:row.fingerprint});rows[t]=[...byId.values()];}
  const meta=(await transport.query(statsSql,'cache-after-stability'))[0]?.metadata;validateMetadata(meta);
  if(TABLES.some(t=>rows[t].length!==meta.tables[t].count||fingerprint(rows[t])!==meta.tables[t].hash))return null;
  for(const t of TABLES)await fs.writeFile(path.join(cacheDir,t+'.json'),JSON.stringify(rows[t]));
  await fs.writeFile(path.join(cacheDir,'metadata.json'),JSON.stringify(meta));return meta;
}
