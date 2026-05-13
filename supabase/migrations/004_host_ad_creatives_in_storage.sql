-- Host ad creative assets in Supabase Storage with deterministic paths.

ALTER TABLE public.ad_creatives
ADD COLUMN IF NOT EXISTS asset_storage_bucket TEXT,
ADD COLUMN IF NOT EXISTS asset_storage_path TEXT,
ADD COLUMN IF NOT EXISTS asset_public_url TEXT,
ADD COLUMN IF NOT EXISTS asset_source_url TEXT,
ADD COLUMN IF NOT EXISTS asset_width INTEGER,
ADD COLUMN IF NOT EXISTS asset_height INTEGER,
ADD COLUMN IF NOT EXISTS asset_content_type TEXT,
ADD COLUMN IF NOT EXISTS asset_origin TEXT,
ADD COLUMN IF NOT EXISTS asset_last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS asset_sync_status TEXT,
ADD COLUMN IF NOT EXISTS asset_sync_error TEXT;

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'ad-creatives',
    'ad-creatives',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
  ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'storage.buckets not available in this environment, skipping bucket bootstrap';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read for ad creatives'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Public read for ad creatives"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'ad-creatives')
    $policy$;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ad_creatives_asset_storage_path
ON public.ad_creatives (asset_storage_path);
