-- FIX FOR DEV MODE (MOCKED AUTH)
-- The "Dev User" in the app is a local mock and does not authenticate with Supabase.
-- Therefore, all requests from the dev user are treated as "anon" (anonymous).

-- 1. Drop previous 'authenticated' policies as they block anon users
drop policy if exists "Allow read access for authenticated users" on public.framework_versions;
drop policy if exists "Allow insert access for authenticated users" on public.framework_versions;
drop policy if exists "Allow update access for authenticated users" on public.framework_versions;
drop policy if exists "Allow delete access for authenticated users" on public.framework_versions;
drop policy if exists "Allow all access" on public.framework_versions;

-- 2. Allow ANONYMOUS access (Required for 'signInAsDev' to work)
create policy "Allow anonymous access"
on public.framework_versions
for all
to anon
using (true)
with check (true);

-- 3. Also allow authenticated (in case real login is used later)
create policy "Allow authenticated access"
on public.framework_versions
for all
to authenticated
using (true)
with check (true);

alter table public.framework_versions enable row level security;
