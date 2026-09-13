-- The private report-live bucket stores both immutable build JSON and QA PDFs.

update storage.buckets
set allowed_mime_types = array['application/pdf', 'application/json']::text[]
where id = 'report-live';
