-- FIX RLS POLICIES
-- Drop existing policies to avoid conflicts
drop policy if exists "Allow read access for authenticated users" on public.framework_versions;
drop policy if exists "Allow insert access for authenticated users" on public.framework_versions;
drop policy if exists "Allow update access for authenticated users" on public.framework_versions;
drop policy if exists "Allow delete access for authenticated users" on public.framework_versions;
drop policy if exists "Allow all" on public.framework_versions;

-- Create a permissive policy for development (allows everyone to read/write)
-- This fixes the "new row violates row-level security policy" error
create policy "Allow all access"
on public.framework_versions
for all
using (true)
with check (true);

-- Ensure RLS is enabled (or the policy won't matter, but good practice)
alter table public.framework_versions enable row level security;
