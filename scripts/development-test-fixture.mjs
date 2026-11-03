import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
const admin='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
const migration=readFileSync('supabase/migrations/'+readdirSync('supabase/migrations').find(f=>f.endsWith('_growth_development_backlog.sql')),'utf8');
const attention=readFileSync('supabase/migrations/20261029213441_growth_loop_attention.sql','utf8');
const put=attention.slice(attention.indexOf('create function growth_loop_private.put('),attention.indexOf('create function public.growth_loop_reconcile()'));
export async function fixture(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${admin}'),('${other}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function public.gaas_vault_is_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
 grant usage on schema public,auth to authenticated,anon,service_role;grant execute on function auth.uid(),public.gaas_vault_is_admin() to authenticated,service_role;
 create schema growth_loop_private;
 create table public.growth_loop_items(id uuid primary key default gen_random_uuid(),episode_key text unique,kind text constraint growth_loop_items_kind_check check(kind in ('source','investigation','outcome','contribution')),
 source_id text,front text,period date,title text,summary text,next_action text,state text,route text,notice_revision integer default 0,revision integer default 0,content_hash text default '',priority integer,evidence jsonb default '{}',created_at timestamptz default now(),updated_at timestamptz default now());
 create table public.growth_loop_revisions(item_id uuid,revision integer,content_hash text,packet jsonb,created_at timestamptz);
 create table public.growth_loop_analyses(item_id uuid,revision integer,state text);
 `);
 await db.exec(put);await db.exec(migration);
 await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false)`);
 const save=async(body,id=null,revision=null)=>(await db.query('select growth_save_development_task($1,$2,$3) t',[id,revision,JSON.stringify(body)])).rows[0].t;
 return {db,save};
}
