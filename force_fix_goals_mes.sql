-- Recreate 'mes' column to fix type and constraint issues.
-- The previous ALTER failed because of a hidden check constraint or index.
-- Since Integer data (e.g. 202401) is incompatible with the App's "YYYY-MM" format anyway,
-- we drop the old column and start fresh to ensure compatibility.

BEGIN;

-- 1. Drop the problematic column and any dependent constraints (CASCADE)
ALTER TABLE public.goals DROP COLUMN IF EXISTS mes CASCADE;

-- 2. Create the column correctly as TEXT
ALTER TABLE public.goals ADD COLUMN mes TEXT;

-- 3. Restore the UNIQUE constraint required for upserts
ALTER TABLE public.goals ADD CONSTRAINT goals_mes_key UNIQUE (mes);

COMMIT;
