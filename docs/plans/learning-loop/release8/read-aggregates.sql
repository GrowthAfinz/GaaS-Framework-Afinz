with monthly as (
select date_trunc('month',"Data de Disparo" at time zone 'America/Sao_Paulo')::date::text as month,
"BU" as bu,"Segmento" as segment,parceiro_canonico as partner,
count(*)::integer as dispatches,count(*) filter(where "Cartões Gerados" is null)::integer as missing_cards,
count(*) filter(where "Custo Total Campanha" is null)::integer as missing_cost,
count(*) filter(where status not in ('Realizado','Enviado') or status is null)::integer as unproven_execution,
sum("Cartões Gerados")::text as cards,sum("Custo Total Campanha")::text as cost
from public.activities
where "Data de Disparo">='2025-10-01 00:00:00-03' and "Data de Disparo"<'2026-10-01 00:00:00-03'
group by 1,2,3,4
), freshness as (
select 'activities'::text as source,max(("Data de Disparo" at time zone 'America/Sao_Paulo')::date)::text as latest from public.activities where status in ('Realizado','Enviado') and "Data de Disparo" <= current_timestamp
union all select 'paid_media_metrics:meta',max(date)::text from public.paid_media_metrics where lower(channel) in ('meta','facebook','meta ads')
union all select 'paid_media_metrics:google',max(date)::text from public.paid_media_metrics where lower(channel) in ('google','google ads')
union all select 'b2c_daily_metrics',max(data)::text from public.b2c_daily_metrics
union all select 'app_afinz_funnel_daily_raw',max(business_date)::text from public.app_afinz_funnel_daily_raw
union all select 'serasa_bi_daily_funnel',max(data)::text from public.serasa_bi_daily_funnel
)
select jsonb_build_object('data_read_at',current_timestamp,'evaluation_as_of',(current_timestamp at time zone 'America/Sao_Paulo')::date,
'timezone','America/Sao_Paulo','transaction_snapshot',pg_current_snapshot()::text,
'monthly',(select jsonb_agg(to_jsonb(m) order by month,bu,segment,partner) from monthly m),
'freshness',(select jsonb_agg(to_jsonb(f) order by source) from freshness f),
'media_channels',(select jsonb_agg(distinct channel) from public.paid_media_metrics)) as snapshot;
