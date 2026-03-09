const { Client } = require('pg');

const pass = encodeURIComponent('Afinz@sorocred2025');
const connectionString = `postgresql://postgres:${pass}@db.mipiwxadnpwtcgfcedym.supabase.co:6543/postgres`;

const client = new Client({
    connectionString: connectionString,
});

const sql = `
-- Create Paid Media Budgets
CREATE TABLE IF NOT EXISTS public.paid_media_budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month TEXT NOT NULL,
    channel TEXT NOT NULL,
    objective TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    UNIQUE(month, channel, objective)
);

ALTER TABLE public.paid_media_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read budgets" ON public.paid_media_budgets;
DROP POLICY IF EXISTS "Allow public insert budgets" ON public.paid_media_budgets;
DROP POLICY IF EXISTS "Allow public update budgets" ON public.paid_media_budgets;
DROP POLICY IF EXISTS "Allow public delete budgets" ON public.paid_media_budgets;

CREATE POLICY "Allow public read budgets" ON public.paid_media_budgets FOR SELECT USING (true);
CREATE POLICY "Allow public insert budgets" ON public.paid_media_budgets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update budgets" ON public.paid_media_budgets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete budgets" ON public.paid_media_budgets FOR DELETE USING (true);


-- Create Paid Media Targets 
CREATE TABLE IF NOT EXISTS public.paid_media_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month TEXT NOT NULL,
    metric TEXT NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    channel TEXT,
    objective TEXT,
    notes TEXT,
    UNIQUE(month, metric, channel, objective)
);

ALTER TABLE public.paid_media_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read targets" ON public.paid_media_targets;
DROP POLICY IF EXISTS "Allow public insert targets" ON public.paid_media_targets;
DROP POLICY IF EXISTS "Allow public update targets" ON public.paid_media_targets;
DROP POLICY IF EXISTS "Allow public delete targets" ON public.paid_media_targets;

CREATE POLICY "Allow public read targets" ON public.paid_media_targets FOR SELECT USING (true);
CREATE POLICY "Allow public insert targets" ON public.paid_media_targets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update targets" ON public.paid_media_targets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete targets" ON public.paid_media_targets FOR DELETE USING (true);
`;

async function execute() {
    try {
        await client.connect();
        console.log("✅ Conectado ao Supabase.");
        await client.query(sql);
        console.log("✅ Tabelas de Budgets e Targets criadas com sucesso!");
    } catch (err) {
        console.error("❌ Erro ao executar SQL:", err);
    } finally {
        await client.end();
    }
}

execute();
