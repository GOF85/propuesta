-- Migración: Consolidar columnas de capacidad en una sola
-- Cambiar de 3 columnas (capacity_cocktail, capacity_banquet, capacity_theater) a 1 columna (capacity)

USE catering_proposals;

-- 1. Verificar si existen las columnas antiguas
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'venues' AND COLUMN_NAME IN ('capacity_cocktail', 'capacity_banquet', 'capacity_theater', 'capacity');

-- 2. Si existe capacity_cocktail, agregamos capacity si no existe
ALTER TABLE venues ADD COLUMN capacity INT DEFAULT 0 AFTER description;

-- 3. Populamos capacity con el máximo de los 3 valores (o solo el primero si existen)
UPDATE venues 
SET capacity = COALESCE(capacity_cocktail, capacity_banquet, capacity_theater, 0)
WHERE capacity = 0;

-- 4. OPCIONAL: Eliminamos las columnas antiguas después de verificar
-- (Comentado por seguridad, descomenta cuando confirmes)
-- ALTER TABLE venues DROP COLUMN capacity_cocktail;
-- ALTER TABLE venues DROP COLUMN capacity_banquet;  
-- ALTER TABLE venues DROP COLUMN capacity_theater;

-- Verificar resultado
SELECT id, name, capacity FROM venues LIMIT 5;
