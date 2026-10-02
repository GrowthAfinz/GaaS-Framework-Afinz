import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
function sql(input){
 const container=process.env.GROWTH_FEED_DOCKER_CONTAINER;
 const result=spawnSync(container?'docker':'psql',container?['exec','-i',container,'psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres']:['-X','-v','ON_ERROR_STOP=1'],{cwd:root,env:process.env,input,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);return result.stdout;
}
test('Results dossiers preserve immutable versions, RLS and contextual bets',()=>{
 const baseline=spawnSync(process.execPath,['--test','scripts/test-growth-context-entry-release-7a.mjs'],{cwd:root,env:process.env,encoding:'utf8'});
 assert.equal(baseline.status,0,baseline.stderr||baseline.stdout);
 sql("create table auth.users(id uuid primary key); insert into auth.users values ('11111111-1111-4111-8111-111111111111'); grant usage on schema public to authenticated,anon;");
 sql(readFileSync(resolve(root,'supabase/migrations/20261002190000_growth_results_dossiers.sql'),'utf8'));
 sql(`begin;
 set local role authenticated;
 select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
 do $$
 declare
  scope jsonb := '{"bu":"","segment":"","partner":"","channel":"","campaign":"","type":""}';
  result public.growth_result_retrospectives;
  blocked boolean;
  bet public.growth_bets;
 begin
  result:=public.growth_append_result_retrospective('crm',scope,'2026-09-01',0,'Volume aumentou','Hipotese a verificar','Aprendizado provisório','Verificar próxima safra','Fonte activities','{"rows":10}');
  if result.revision<>1 or result.source_snapshot->>'rows'<>'10' then raise exception 'snapshot/version failed'; end if;
  blocked:=false;
  begin perform public.growth_append_result_retrospective('crm',scope,'2026-09-01',0,'Volume aumentou','','Aprendizado','Verificar','Fonte'); exception when others then blocked:=position('retrospectiva mudou' in sqlerrm)>0; end;
  if not blocked then raise exception 'stale writer was not rejected'; end if;
  result:=public.growth_append_result_retrospective('crm',scope,'2026-09-01',1,'Volume atualizado','','Aprendizado revisado','Verificar novamente','Fonte activities');
  if result.revision<>2 or (select count(*) from public.growth_result_retrospectives)<>2 then raise exception 'append-only history failed'; end if;
  blocked:=false;
  begin update public.growth_result_retrospectives set learning='overwrite'; exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'update permitted'; end if;
  blocked:=false;
  begin delete from public.growth_result_retrospectives; exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'delete permitted'; end if;
  blocked:=false;
  begin perform public.growth_append_result_retrospective('media',scope||'{"segment":"invalid"}','2026-09-01',0,'Observed','','Learned','Next','Source'); exception when others then blocked:=position('incompatible_result_scope' in sqlerrm)>0; end;
  if not blocked then raise exception 'incompatible scope allowed'; end if;
  blocked:=false;
  begin insert into public.growth_result_retrospectives(domain,scope,period,revision,observation,learning,next_action,evidence,author_id) values('crm',scope,'2026-08-01',1,'Observed','Learned','Next','Source','22222222-2222-4222-8222-222222222222'); exception when others then blocked:=position('retrospective_author_required' in sqlerrm)>0; end;
  if not blocked then raise exception 'spoofed author allowed'; end if;
  bet:=public.growth_create_contextual_bet_with_memory('crm_acquisition','{"source_surface":"results_dossier","source_route":"results:crm","period_start":"2026-09-01","period_end":"2026-09-30","filters":{"segment":"Dormant"},"title":"CRM mensal","verification_view":"?view=learning&section=results&result_domain=crm&result_month=2026-09"}','CRM','A ação melhora cartões no segmento','Testar a proposta','Cartões',10,20,'maior_melhor','Pelo menos 20 cartões','2026-10-01','2026-10-31','?view=learning&section=results&result_domain=crm&result_month=2026-09','[]');
  if bet.id is null then raise exception 'contextual bet failed'; end if;
 end $$;
 reset role;
 set local role anon;
 do $$ declare blocked boolean:=false; begin
  begin perform * from public.growth_result_retrospectives; exception when insufficient_privilege then blocked:=true; end;
  if not blocked then raise exception 'anonymous read allowed'; end if;
 end $$;
 rollback;`);
});

