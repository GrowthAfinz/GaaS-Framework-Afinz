-- Bucket privado dedicado aos snapshots PDF do Report Live (QA visual por run).
-- Separado de app-data para nao afrouxar o MIME de um bucket compartilhado
-- (app-data aceita apenas CSV/Excel).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('report-live', 'report-live', false, 52428800, array['application/pdf'])
on conflict (id) do update
  set allowed_mime_types = excluded.allowed_mime_types,
      file_size_limit = excluded.file_size_limit;
