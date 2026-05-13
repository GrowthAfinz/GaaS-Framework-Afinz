-- Create goals table for syncing monthly targets
create table if not exists goals (
  id uuid default uuid_generate_v4() primary key,
  mes text not null unique, -- Format: YYYY-MM
  cartoes_meta numeric default 0,
  b2c_meta numeric default 0,
  plurix_meta numeric default 0,
  b2b2c_meta numeric default 0,
  cac_max numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table goals enable row level security;

create policy "Enable read access for all users" on goals for select using (true);
create policy "Enable insert for authenticated users only" on goals for insert with check (auth.role() = 'authenticated' or auth.role() = 'anon');
create policy "Enable update for authenticated users only" on goals for update using (auth.role() = 'authenticated' or auth.role() = 'anon');
