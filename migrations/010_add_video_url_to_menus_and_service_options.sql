-- Migration: Add video_url to menus and service_options
-- Date: 2026-02-27
-- Description: Support optional MP4 preview in client modal from menu composition.

ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(500) NULL AFTER url_images;

ALTER TABLE service_options
  ADD COLUMN IF NOT EXISTS video_url VARCHAR(500) NULL AFTER url_images;
