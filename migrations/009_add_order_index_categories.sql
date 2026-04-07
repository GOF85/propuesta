-- Migration: 009_add_order_index_categories.sql
-- Description: Add order_index to categories and category field to proposal_items for grouping.

-- 1. Add order_index to app_categories
ALTER TABLE app_categories ADD COLUMN order_index INT DEFAULT 0;

-- 2. Add category to proposal_items for isolated grouping
ALTER TABLE proposal_items ADD COLUMN category VARCHAR(100) DEFAULT NULL;

-- 3. Populate existing proposal_items category from dishes if possible
UPDATE proposal_items pi
JOIN dishes d ON pi.dish_id = d.id
SET pi.category = d.category
WHERE pi.category IS NULL;
