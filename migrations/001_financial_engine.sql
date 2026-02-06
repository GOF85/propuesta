-- ============================================================================
-- MIGRACIÓN: Motor Financiero Completo
-- Fecha: 2026-02-06
-- Descripción: Añade auditoría de precios, costes, márgenes y descuentos
-- ============================================================================

USE catering_proposals;

-- 1. AÑADIR CAMPOS DE COSTE A PLATOS BASE
ALTER TABLE dishes 
ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Precio de coste unitario',
ADD COLUMN margin_percentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Margen esperado %';

-- 2. AÑADIR CAMPOS DE COSTE A OPCIONES DE SERVICIO
ALTER TABLE service_options
ADD COLUMN cost_price DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Coste base de la opción',
ADD COLUMN margin_percentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Margen de beneficio %';

-- 3. AÑADIR CAMPOS DE DESCUENTOS POR VOLUMEN A PROPUESTAS
ALTER TABLE proposals
ADD COLUMN discount_percentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Descuento general aplicado %',
ADD COLUMN discount_reason VARCHAR(255) DEFAULT NULL COMMENT 'Razón del descuento',
ADD COLUMN volume_discount_applied BOOLEAN DEFAULT FALSE COMMENT 'Si se aplicó descuento por volumen',
ADD COLUMN total_base DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total sin IVA',
ADD COLUMN total_vat DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total IVA',
ADD COLUMN total_final DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Total con IVA',
ADD COLUMN total_cost DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Coste total calculado',
ADD COLUMN total_margin DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'Margen total (€)',
ADD COLUMN margin_percentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Margen porcentual',
ADD COLUMN last_calculated_at TIMESTAMP DEFAULT NULL COMMENT 'Última vez que se calcularon totales';

-- 4. TABLA DE AUDITORÍA DE PRECIOS (Registro de cambios)
CREATE TABLE IF NOT EXISTS price_audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT NOT NULL,
    user_id INT,
    change_type ENUM('price_update', 'discount_update', 'vat_update', 'recalculation', 'item_added', 'item_removed') NOT NULL,
    entity_type ENUM('proposal', 'service', 'option', 'item') NOT NULL,
    entity_id INT NOT NULL COMMENT 'ID de la entidad modificada',
    old_value DECIMAL(10, 2) DEFAULT NULL,
    new_value DECIMAL(10, 2) DEFAULT NULL,
    description TEXT COMMENT 'Descripción del cambio',
    metadata JSON COMMENT 'Datos adicionales del cambio',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_proposal_audit (proposal_id, created_at),
    INDEX idx_entity_audit (entity_type, entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. TABLA DE CONFIGURACIÓN DE DESCUENTOS POR VOLUMEN
CREATE TABLE IF NOT EXISTS volume_discount_tiers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    min_pax INT NOT NULL COMMENT 'PAX mínimo',
    max_pax INT DEFAULT NULL COMMENT 'PAX máximo (NULL = sin límite)',
    discount_percentage DECIMAL(5, 2) NOT NULL COMMENT 'Descuento a aplicar %',
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_pax_range CHECK (min_pax >= 0 AND (max_pax IS NULL OR max_pax > min_pax))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. INSERTAR CONFIGURACIÓN POR DEFECTO DE DESCUENTOS
INSERT INTO volume_discount_tiers (min_pax, max_pax, discount_percentage, description) VALUES
(50, 99, 2.00, 'Descuento 2% para grupos de 50-99 pax'),
(100, 199, 5.00, 'Descuento 5% para grupos de 100-199 pax'),
(200, 499, 8.00, 'Descuento 8% para grupos de 200-499 pax'),
(500, NULL, 12.00, 'Descuento 12% para grupos de 500+ pax');

-- 7. ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX idx_proposals_totals ON proposals(total_base, total_final, margin_percentage);
CREATE INDEX idx_service_options_costs ON service_options(cost_price, margin_percentage);
CREATE INDEX idx_dishes_costs ON dishes(cost_price, margin_percentage);

-- 8. VISTA PARA ANÁLISIS DE MÁRGENES POR PROPUESTA
CREATE OR REPLACE VIEW v_proposal_margins AS
SELECT 
    p.id,
    p.unique_hash,
    p.client_name,
    p.pax,
    p.total_base,
    p.total_vat,
    p.total_final,
    p.total_cost,
    p.total_margin,
    p.margin_percentage,
    p.discount_percentage,
    p.volume_discount_applied,
    u.name as commercial_name,
    p.status,
    p.event_date,
    p.created_at
FROM proposals p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.total_final > 0
ORDER BY p.created_at DESC;

-- 9. VISTA PARA AUDITORÍA RECIENTE
CREATE OR REPLACE VIEW v_recent_price_changes AS
SELECT 
    pal.id,
    pal.proposal_id,
    p.client_name,
    u.name as user_name,
    pal.change_type,
    pal.entity_type,
    pal.old_value,
    pal.new_value,
    pal.description,
    pal.created_at
FROM price_audit_log pal
LEFT JOIN proposals p ON pal.proposal_id = p.id
LEFT JOIN users u ON pal.user_id = u.id
ORDER BY pal.created_at DESC
LIMIT 100;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
