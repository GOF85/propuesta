-- Migration: Dishes & Menus System
-- Date: 2026-02-09
-- Description: Add comprehensive dishes management + menus system with multiple images support

-- 1. Migrate dishes table: image_url → images (JSON array)
ALTER TABLE dishes ADD COLUMN images JSON DEFAULT NULL;

-- Migrate existing single image_url to images array
UPDATE dishes 
SET images = IF(
  image_url IS NOT NULL AND image_url != '', 
  JSON_ARRAY(image_url), 
  JSON_ARRAY()
)
WHERE images IS NULL;

-- Drop old column after migration (keep backup)
-- ALTER TABLE dishes DROP COLUMN image_url;
-- For now: keep image_url for reference, will remove in cleanup phase

-- 2. Create menus table
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  base_price DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create menu_dishes junction table (M:M relationship with ordering)
CREATE TABLE IF NOT EXISTS menu_dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  dish_id INT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_menu_dish (menu_id, dish_id),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  INDEX idx_menu_sort (menu_id, sort_order),
  INDEX idx_dish (dish_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Extend proposal_items table: add optional FK to dishes (for tracking origin)
ALTER TABLE proposal_items ADD COLUMN dish_id INT DEFAULT NULL AFTER option_id;
ALTER TABLE proposal_items ADD FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE SET NULL;
ALTER TABLE proposal_items ADD INDEX idx_dish_id (dish_id);

-- 5. Update proposal_items images column if it doesn't exist (for consistency with dishes)
-- proposal_items already has image_url, but for consistency could migrate to images JSON
-- For now: keep image_url in proposal_items (adhoc copy from dishes already contains image_url)
-- If needed later: ALTER TABLE proposal_items ADD COLUMN images JSON;

-- 6. Add indexes for faster queries
-- Indexes on menus and menu_dishes created with table, adding to other tables
ALTER TABLE dishes ADD UNIQUE INDEX idx_name_unique (name);
ALTER TABLE proposal_items ADD INDEX idx_option_id (option_id);

-- 7. Verification queries (run after migration)
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'dishes' AND TABLE_SCHEMA = DATABASE();
-- SELECT COUNT(*) as total_dishes FROM dishes;
-- SELECT COUNT(*) as total_menus FROM menus;
-- SELECT COUNT(*) as total_menu_items FROM menu_dishes;

-- ✅ Migration complete
