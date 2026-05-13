-- Migration 006: Documenta a adição de 'seguros' como objective válido
-- Nenhuma mudança estrutural é necessária — a coluna `objective` é do tipo TEXT
-- e já aceita qualquer valor textual em todas as tabelas afetadas.
--
-- Este script documenta os valores válidos via COMMENT e garante que a tabela
-- de mapeamentos de campanhas exista com a estrutura correta.

-- Garante existência da tabela de mapeamentos (caso ainda não exista)
CREATE TABLE IF NOT EXISTS public.paid_media_campaign_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_name TEXT NOT NULL UNIQUE,
    objective TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.paid_media_campaign_mappings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.paid_media_campaign_mappings TO anon, authenticated, service_role;

-- Documenta os valores válidos para `objective` em todas as tabelas relevantes
COMMENT ON COLUMN public.paid_media_metrics.objective IS
    'Valores válidos: marca, b2c, plurix, seguros';

COMMENT ON COLUMN public.paid_media_campaign_mappings.objective IS
    'Valores válidos: marca, b2c, plurix, seguros';

-- Garante existência da tabela de budgets com coluna objective (caso não exista)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'paid_media_budgets' AND column_name = 'objective') THEN
        COMMENT ON COLUMN public.paid_media_budgets.objective IS
            'Valores válidos: marca, b2c, plurix, seguros';
    END IF;
END $$;

-- Garante existência da tabela de targets com coluna objective (caso não exista)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'paid_media_targets' AND column_name = 'objective') THEN
        COMMENT ON COLUMN public.paid_media_targets.objective IS
            'Valores válidos: marca, b2c, plurix, seguros';
    END IF;
END $$;
