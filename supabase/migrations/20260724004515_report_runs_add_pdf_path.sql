alter table report_runs
  add column if not exists pdf_path text;

comment on column report_runs.pdf_path is
  'Caminho no bucket report-live do PDF exportado do Google Slides para este run (report-live/<run_id>.pdf). Permite QA visual automatizado sem download manual.';
