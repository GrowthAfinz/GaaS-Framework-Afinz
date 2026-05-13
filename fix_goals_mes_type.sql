-- Change 'mes' column type from INTEGER to TEXT
-- The application sends 'YYYY-MM' (e.g. '2026-02'), which causes an error if the column is INTEGER.

DO $$
BEGIN
    -- Attempt to change the column type. 
    -- We use USING mes::text to convert any existing integers to text if there's data.
    ALTER TABLE public.goals ALTER COLUMN mes TYPE TEXT USING mes::text;
END $$;
