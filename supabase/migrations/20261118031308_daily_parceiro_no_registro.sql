-- BU/parceiro no registro da Visão Daily (decisão do Pablo em 17/11/2026): um projeto genérico
-- (ex.: "Topo de Funil Aquisição") com o BU/parceiro escolhido no registro. Vazio = vale o do projeto.
begin;

alter table public.daily_entries add column if not exists partner_keys text[] not null default '{}';

do $$
declare
  d text := pg_get_functiondef('public.gaas_daily_save_entry(uuid,integer,jsonb)'::regprocedure);
  step text;
  targets text[] := array[
    $t$n.work_ids := '{}'; n.source := 'app';$t$,
    $t$n.work_ids := array(select distinct v::uuid from jsonb_array_elements_text(p_body->'work_ids') v order by 1);
  end if;$t$,
    $t$work_ids = n.work_ids, position = n.position$t$
  ];
  replacements text[] := array[
    $r$n.work_ids := '{}'; n.partner_keys := '{}'; n.source := 'app';$r$,
    $r$n.work_ids := array(select distinct v::uuid from jsonb_array_elements_text(p_body->'work_ids') v order by 1);
  end if;
  if p_body ? 'partner_keys' then
    if jsonb_typeof(p_body->'partner_keys') <> 'array' then raise exception 'daily_partners_invalid'; end if;
    n.partner_keys := array(select distinct v from jsonb_array_elements_text(p_body->'partner_keys') v order by 1);
    if exists (select 1 from unnest(n.partner_keys) k where not exists (select 1 from public.daily_partners p where p.key = k)) then raise exception 'daily_partners_invalid'; end if;
  end if;$r$,
    $r$work_ids = n.work_ids, partner_keys = n.partner_keys, position = n.position$r$
  ];
begin
  for i in 1..array_length(targets, 1) loop
    step := targets[i];
    if position(step in d) = 0 then raise exception 'daily_entry_anchor_not_found: %', left(step, 60); end if;
    d := replace(d, step, replacements[i]);
  end loop;
  execute d;
end $$;

commit;
