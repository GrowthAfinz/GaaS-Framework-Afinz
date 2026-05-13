-- Migration: Create campaign_budgets table
-- Purpose: Store budget allocations per campaign within an objective
-- Created: 2026-04-16

CREATE TABLE IF NOT EXISTS public.campaign_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Foreign key to paid_media_budgets (ObjectiveBudget)
  objective_budget_id UUID NOT NULL REFERENCES public.paid_media_budgets(id) ON DELETE CASCADE,

  -- Timeline
  month TEXT NOT NULL,                    -- MM/yyyy format (e.g., "04/2026")

  -- Campaign identifiers
  campaign_name TEXT NOT NULL,            -- e.g., "Aquisição Cartão", "Lead Gen Plurix"
  objective TEXT NOT NULL,                -- marca | b2c | plurix | seguros
  channel TEXT NOT NULL,                  -- meta | google

  -- Budget allocation
  allocated_budget NUMERIC NOT NULL,      -- R$ allocated to this campaign
  notes TEXT,                             -- Optional notes

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(month, campaign_name, channel),  -- Prevent duplicates
  CHECK (allocated_budget >= 0)           -- No negative budgets
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_budgets_objective_budget
  ON public.campaign_budgets(objective_budget_id);

CREATE INDEX IF NOT EXISTS idx_campaign_budgets_month_objective
  ON public.campaign_budgets(month, objective);

CREATE INDEX IF NOT EXISTS idx_campaign_budgets_campaign_name
  ON public.campaign_budgets(campaign_name);

-- Row Level Security (RLS)
ALTER TABLE public.campaign_budgets ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read
CREATE POLICY "Allow read campaign_budgets"
  ON public.campaign_budgets
  FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update/delete
CREATE POLICY "Allow write campaign_budgets"
  ON public.campaign_budgets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow update campaign_budgets"
  ON public.campaign_budgets
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow delete campaign_budgets"
  ON public.campaign_budgets
  FOR DELETE
  USING (true);

-- Grant permissions
GRANT ALL ON public.campaign_budgets TO authenticated;
GRANT ALL ON public.campaign_budgets TO anon;
