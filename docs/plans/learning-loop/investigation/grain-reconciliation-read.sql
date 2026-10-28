-- Read-only local-scope comparison of policies. Results UI currently groups its entire snapshot; cross-scope collisions require separate checking.
-- Neither candidate policy certifies the correct business total.
with s as (
 select a.*,o.operation_id,
 count(*) over(partition by a."Activity name / Taxonomia",a."Data de Disparo",a."BU",a."Canal") as key_rows
 from public.activities a join public.growth_operations o
 on a."BU"=o.scope->>'bu' and a."Segmento"=o.scope->>'segment' and a.parceiro_canonico=o.scope->>'partner'
 where o.operation_id in ('CRM-92fbd40403','CRM-a695575900')
 and a."Data de Disparo">=timestamptz '2026-09-01 00:00:00-03'
 and a."Data de Disparo"<timestamptz '2026-10-01 00:00:00-03'
) select operation_id,count(*) rows,sum("Cartões Gerados") stored_cards,
count(*) filter(where key_rows>1) excluded_under_local_key_policy,
sum("Cartões Gerados") filter(where key_rows=1) cards_under_local_key_policy
from s group by operation_id;
