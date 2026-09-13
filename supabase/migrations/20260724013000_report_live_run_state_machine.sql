-- Expand the legacy report_runs lifecycle to the versioned release state machine.
-- Legacy states remain accepted while old runs and recovery paths still exist.

alter table public.report_runs
  drop constraint if exists report_runs_status_check;

alter table public.report_runs
  add constraint report_runs_status_check check (
    status in (
      'queued',
      'writing_sheets',
      'generating_narrative',
      'refreshing_slides',
      'building',
      'built',
      'certified',
      'rejected',
      'superseded',
      'publishing',
      'done',
      'error',
      'stale'
    )
  );
