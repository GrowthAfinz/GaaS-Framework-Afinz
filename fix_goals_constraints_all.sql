-- Remove NOT NULL constraints from all legacy columns in goals table
-- The application only uses 'mes' and metric columns. Other columns like 'segmento', 'bu', 'ano', etc.
-- are remnants of a previous schema and should be optional (nullable).

DO $$
BEGIN
    -- Segmento
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'segmento') THEN
        ALTER TABLE public.goals ALTER COLUMN segmento DROP NOT NULL;
    END IF;

    -- Canal
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'canal') THEN
        ALTER TABLE public.goals ALTER COLUMN canal DROP NOT NULL;
    END IF;

    -- Parceiro
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'parceiro') THEN
        ALTER TABLE public.goals ALTER COLUMN parceiro DROP NOT NULL;
    END IF;

    -- Safra
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'safra') THEN
        ALTER TABLE public.goals ALTER COLUMN safra DROP NOT NULL;
    END IF;

    -- BU
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'bu') THEN
        ALTER TABLE public.goals ALTER COLUMN bu DROP NOT NULL;
    END IF;

    -- Ano (New culprit!)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'ano') THEN
        ALTER TABLE public.goals ALTER COLUMN ano DROP NOT NULL;
    END IF;

    -- Etapa de Aquisição (Proactive fix)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'etapa_de_aquisicao') THEN
        ALTER TABLE public.goals ALTER COLUMN etapa_de_aquisicao DROP NOT NULL;
    END IF;

    -- Status (Proactive fix)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'goals' AND column_name = 'status') THEN
        ALTER TABLE public.goals ALTER COLUMN status DROP NOT NULL;
    END IF;
END $$;
