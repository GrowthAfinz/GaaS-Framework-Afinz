-- Enable RLS on goals table
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all access" ON public.goals;
DROP POLICY IF EXISTS "Allow read access" ON public.goals;
DROP POLICY IF EXISTS "Allow insert access" ON public.goals;
DROP POLICY IF EXISTS "Allow update access" ON public.goals;

-- Create a permissive policy for goals (allows everyone to read/write)
-- WARNING: This allows any user (anon or authenticated) to modify goals.
-- Ideally, restart RLS and restrict to authenticated users only, but for this issue we ensure access first.
CREATE POLICY "Allow all access"
ON public.goals
FOR ALL
USING (true)
WITH CHECK (true);
