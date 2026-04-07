-- Migration: 007_gastronomy_refactor.sql
-- Description: Refactor gastronomy structure to treat Menus as commercial entities and support fixed prices.

-- 1. Add badges to master catalog menus
ALTER TABLE menus ADD COLUMN IF NOT EXISTS badges JSON DEFAULT NULL AFTER images;

-- 2. Add description, images, badges and price_model to service_options
ALTER TABLE service_options 
  ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER name,
  ADD COLUMN IF NOT EXISTS images JSON DEFAULT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS badges JSON DEFAULT NULL AFTER images,
  ADD COLUMN IF NOT EXISTS price_model ENUM('pax', 'fixed') NOT NULL DEFAULT 'pax' AFTER price_pax;

-- 3. Add price_model to proposal_services for inheritance
ALTER TABLE proposal_services 
  ADD COLUMN IF NOT EXISTS price_model ENUM('pax', 'fixed') NOT NULL DEFAULT 'pax' AFTER type;
