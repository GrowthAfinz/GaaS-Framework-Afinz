-- Creating Paid Media Metrics Table
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
    cpa NUMERIC DEFAULT 0,
    UNIQUE(date, channel, campaign)
);

-- Enable RLS
ALTER TABLE public.paid_media_metrics ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (adjust as needed for prod)
CREATE POLICY "Allow public read" ON public.paid_media_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.paid_media_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.paid_media_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.paid_media_metrics FOR DELETE USING (true);
