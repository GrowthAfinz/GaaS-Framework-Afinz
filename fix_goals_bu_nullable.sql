-- Remove NOT NULL constraint from 'bu' column in goals table
-- The application uses a single row per month for all goals, so specific 'bu' is not required.

ALTER TABLE public.goals ALTER COLUMN bu DROP NOT NULL;
