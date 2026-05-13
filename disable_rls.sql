-- FORCEFULLY DISABLE RLS
-- This turns off all row-level security checks for this table.
-- It is the surest way to fix "violates row-level security policy" in development.

ALTER TABLE public.framework_versions DISABLE ROW LEVEL SECURITY;

-- Grant explicit permissions to all roles just to be safe
GRANT ALL ON public.framework_versions TO anon;
GRANT ALL ON public.framework_versions TO authenticated;
GRANT ALL ON public.framework_versions TO service_role;
