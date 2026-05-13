-- Add unique constraints to allow UPSERT operations

-- B2C Daily Metrics Constraint
-- Ensures only one record per date exists
ALTER TABLE b2c_daily_metrics
ADD CONSTRAINT b2c_daily_metrics_data_key UNIQUE (data);

-- Paid Media Metrics Constraint
-- Ensures unique record per channel, campaign and date
ALTER TABLE paid_media_metrics
ADD CONSTRAINT paid_media_metrics_unique_entry UNIQUE (date, channel, campaign);
