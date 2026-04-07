-- Migration: Add category to menus
-- Date: 2026-02-16

ALTER TABLE menus ADD COLUMN IF NOT EXISTS category VARCHAR(100) AFTER badges;
