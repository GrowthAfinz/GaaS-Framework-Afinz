-- Build a review queue from recent recurrence without assuming that a journey
-- is active. Re-running is safe and preserves every operator decision.

WITH freshness AS (
  SELECT max("Data de Disparo"::date) AS max_date
  FROM public.activities
),
recent_candidates AS (
  SELECT
    jornada AS journey_name,
    "Activity name / Taxonomia" AS activity_name,
    "Canal" AS channel,
    count(DISTINCT "Data de Disparo"::date) AS recent_dispatch_days
  FROM public.activities
  CROSS JOIN freshness
  WHERE "Data de Disparo"::date >= freshness.max_date - 44
    AND jornada IS NOT NULL
    AND "Activity name / Taxonomia" IS NOT NULL
    AND "Canal" IS NOT NULL
  GROUP BY 1, 2, 3
  HAVING count(DISTINCT "Data de Disparo"::date) >= 2
),
observed_range AS (
  SELECT
    candidate.*,
    min(activity."Data de Disparo"::date) AS first_seen_on,
    max(activity."Data de Disparo"::date) AS last_seen_on
  FROM recent_candidates AS candidate
  JOIN public.activities AS activity
    ON activity.jornada = candidate.journey_name
   AND activity."Activity name / Taxonomia" = candidate.activity_name
   AND activity."Canal" = candidate.channel
  GROUP BY
    candidate.journey_name,
    candidate.activity_name,
    candidate.channel,
    candidate.recent_dispatch_days
)
INSERT INTO public.communication_slots (
  journey_name,
  activity_name,
  channel,
  lifecycle_status,
  coverage_status,
  source,
  first_seen_on,
  last_seen_on,
  metadata
)
SELECT
  journey_name,
  activity_name,
  channel,
  'candidate',
  'unmapped',
  'recent_activity',
  first_seen_on,
  last_seen_on,
  jsonb_build_object(
    'discovery_window_days', 45,
    'recent_dispatch_days', recent_dispatch_days,
    'discovered_from', 'activities'
  )
FROM observed_range
ON CONFLICT (journey_name, activity_name, channel)
DO UPDATE SET
  last_seen_on = greatest(
    public.communication_slots.last_seen_on,
    excluded.last_seen_on
  ),
  metadata = public.communication_slots.metadata || excluded.metadata,
  updated_at = now();
