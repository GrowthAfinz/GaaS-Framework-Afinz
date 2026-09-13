-- Campaigns without a source campaign_id receive a provisional identity based
-- on the exact platform + exact campaign name. No fuzzy/textual merge occurs.

create unique index if not exists paid_media_campaign_aliases_exact_source_idx
  on public.paid_media_campaign_aliases (
    platform,
    coalesce(source_campaign_id, ''),
    source_campaign_name
  );

insert into public.canonical_paid_media_campaigns (
  canonical_campaign_id,
  display_name,
  platform,
  canonical_objective,
  certification_status,
  metadata
)
select distinct on (lower(m.channel), m.campaign)
  lower(m.channel) || ':name:' || left(md5(m.campaign), 12),
  m.campaign,
  lower(m.channel),
  coalesce(mapping.objective, m.objective),
  'pending_review',
  jsonb_build_object(
    'seed_source', 'paid_media_metrics',
    'identity_rule', 'exact_platform_and_name'
  )
from public.paid_media_metrics m
left join public.paid_media_campaign_mappings mapping
  on mapping.campaign_name = m.campaign
where m.campaign is not null
  and btrim(m.campaign) <> ''
  and not exists (
    select 1
    from public.paid_media_campaign_aliases alias
    where alias.platform = lower(m.channel)
      and alias.source_campaign_name = m.campaign
  )
order by lower(m.channel), m.campaign, m.date desc
on conflict (canonical_campaign_id) do nothing;

insert into public.paid_media_campaign_aliases (
  canonical_campaign_id,
  platform,
  source_campaign_id,
  source_campaign_name,
  source_system,
  certification_status
)
select distinct
  lower(m.channel) || ':name:' || left(md5(m.campaign), 12),
  lower(m.channel),
  null,
  m.campaign,
  'paid_media_metrics',
  'pending_review'
from public.paid_media_metrics m
where m.campaign is not null
  and btrim(m.campaign) <> ''
  and not exists (
    select 1
    from public.paid_media_campaign_aliases alias
    where alias.platform = lower(m.channel)
      and alias.source_campaign_name = m.campaign
  )
on conflict do nothing;
