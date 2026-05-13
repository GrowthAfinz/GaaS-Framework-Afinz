-- Add UNIQUE constraint to 'mes' column in goals table
-- This is required for .upsert(..., { onConflict: 'mes' }) to work.

DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'goals_mes_key'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.goals ADD CONSTRAINT goals_mes_key UNIQUE (mes);
    END IF;
END $$;
