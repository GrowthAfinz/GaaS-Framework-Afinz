-- ==========================================================
-- GaaS FIX: Criar tabelas ausentes + Liberar RLS
-- Execute no SQL Editor do Supabase Dashboard
-- ==========================================================

-- ============ CRIAR TABELAS SE NÃO EXISTIREM ============

CREATE TABLE IF NOT EXISTS public.paid_media_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    channel TEXT NOT NULL,
    campaign TEXT NOT NULL,
    objective TEXT,
    spend NUMERIC DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    ctr NUMERIC DEFAULT 0,
    cpc NUMERIC DEFAULT 0,
    cpm NUMERIC DEFAULT 0,
    cpa NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.b2c_daily_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data DATE NOT NULL,
    propostas_total NUMERIC DEFAULT 0,
    emissoes_total NUMERIC DEFAULT 0,
    percentual_conversao NUMERIC DEFAULT 0,
    observacoes TEXT
);

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mes TEXT NOT NULL,
    cartoes_meta NUMERIC DEFAULT 0,
    b2c_meta NUMERIC DEFAULT 0,
    plurix_meta NUMERIC DEFAULT 0,
    b2b2c_meta NUMERIC DEFAULT 0,
    cac_max NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.paid_media_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month TEXT NOT NULL,
    channel TEXT NOT NULL,
    objective TEXT NOT NULL,
    budget NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.paid_media_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month TEXT NOT NULL,
    metric TEXT NOT NULL,
    channel TEXT NOT NULL,
    objective TEXT NOT NULL,
    target_value NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ DESABILITAR RLS (acesso total) ============

ALTER TABLE public.paid_media_metrics DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.paid_media_metrics TO anon, authenticated, service_role;

ALTER TABLE public.b2c_daily_metrics DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.b2c_daily_metrics TO anon, authenticated, service_role;

ALTER TABLE public.goals DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.goals TO anon, authenticated, service_role;

ALTER TABLE public.paid_media_budgets DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.paid_media_budgets TO anon, authenticated, service_role;

ALTER TABLE public.paid_media_targets DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.paid_media_targets TO anon, authenticated, service_role;

-- ============ REMOVER POLÍTICAS ANTIGAS (se existirem) ============

DO $$
BEGIN
    -- paid_media_metrics
    DROP POLICY IF EXISTS "Allow public read" ON public.paid_media_metrics;
    DROP POLICY IF EXISTS "Allow public insert" ON public.paid_media_metrics;
    DROP POLICY IF EXISTS "Allow public update" ON public.paid_media_metrics;
    DROP POLICY IF EXISTS "Allow public delete" ON public.paid_media_metrics;
    -- b2c_daily_metrics
    DROP POLICY IF EXISTS "Allow public read" ON public.b2c_daily_metrics;
    DROP POLICY IF EXISTS "Allow public insert" ON public.b2c_daily_metrics;
    -- goals
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.goals;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.goals;
    DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.goals;
EXCEPTION WHEN OTHERS THEN
    NULL; -- ignora erros se políticas não existem
END $$;

-- ============ VERIFICAÇÃO FINAL ============
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'paid_media_metrics', 'b2c_daily_metrics',
    'goals', 'paid_media_budgets', 'paid_media_targets'
);
-- Todas as linhas devem mostrar: rowsecurity = false
