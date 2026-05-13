-- Create table for Framework Versions
create table if not exists public.framework_versions (
    id uuid not null default gen_random_uuid(),
    filename text not null,
    storage_path text not null,
    created_at timestamp with time zone not null default now(),
    row_count integer default 0,
    is_active boolean default false,
    description text,
    constraint framework_versions_pkey primary key (id)
);

-- Enable RLS
alter table public.framework_versions enable row level security;

-- Policies (Adjust according to your auth model, here allowing all for authenticated)
create policy "Allow read access for authenticated users"
on public.framework_versions
for select
to authenticated
using (true);

create policy "Allow insert access for authenticated users"
on public.framework_versions
for insert
to authenticated
with check (true);

create policy "Allow update access for authenticated users"
on public.framework_versions
for update
to authenticated
using (true);

create policy "Allow delete access for authenticated users"
on public.framework_versions
for delete
to authenticated
using (true);

-- Storage Bucket Policy (Ensure 'app-data' bucket exists and is public/accessible)
-- This is usually setup in the dashboard, but keeping a note here.
