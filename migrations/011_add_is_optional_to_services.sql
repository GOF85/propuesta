-- Migration: Add is_optional to proposal_services
-- Date: 2026-04-08
-- Description: Allow optional services (corners, recenas, extras) without blocking client progress.

ALTER TABLE proposal_services
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT FALSE AFTER is_multichoice;