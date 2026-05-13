-- Migration: add video_thumbnail_url column and fix image_url data
-- Run this in Supabase SQL Editor

-- 1. Add missing column video_thumbnail_url
ALTER TABLE ad_creatives
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- 2. Clear corrupted image_url data (was copying thumbnail_path which is 64x64)
-- The Edge Function will repopulate with real url_1080 on next run
UPDATE ad_creatives
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND image_url = thumbnail_path;

-- 3. Also clear image_url where it contains low-res indicators
UPDATE ad_creatives
SET image_url = NULL
WHERE image_url LIKE '%p64x64%'
   OR image_url LIKE '%p_n%'
   OR image_url LIKE '%s260x260%'
   OR image_url LIKE '%s480x480%';

SELECT
  COUNT(*) AS total,
  COUNT(image_url) AS with_image_url,
  COUNT(video_thumbnail_url) AS with_video_thumb,
  COUNT(aspect_ratio) AS with_aspect_ratio,
  COUNT(media_type) AS with_media_type
FROM ad_creatives;
