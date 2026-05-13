-- Add missing columns to the goals table
-- It seems 'b2b2c_meta' and 'plurix_meta' are missing based on the error message.

DO $$
BEGIN
    -- Add b2b2c_meta if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'b2b2c_meta') THEN
        ALTER TABLE public.goals ADD COLUMN b2b2c_meta NUMERIC DEFAULT 0;
    END IF;

    -- Add plurix_meta if it doesn't exist (likely also missing if b2b2c is)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'plurix_meta') THEN
        ALTER TABLE public.goals ADD COLUMN plurix_meta NUMERIC DEFAULT 0;
    END IF;

    -- Ensure other columns exist just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'cartoes_meta') THEN
        ALTER TABLE public.goals ADD COLUMN cartoes_meta NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'b2c_meta') THEN
        ALTER TABLE public.goals ADD COLUMN b2c_meta NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'cac_max') THEN
        ALTER TABLE public.goals ADD COLUMN cac_max NUMERIC DEFAULT 0;
    END IF;

    -- Refresh schema cache happens automatically on Supabase, but good to be aware.
END $$;
