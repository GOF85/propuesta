-- 005_commercial_ux_upgrades.sql
-- Actualizaciones para el Perfil Comercial y Experiencia de Cliente

USE catering_proposals;

-- 1. Mejoras en ítems de propuesta: IVA específico y precio unitario
ALTER TABLE proposal_items
ADD COLUMN vat_rate DECIMAL(4, 2) DEFAULT NULL,
ADD COLUMN price_unit DECIMAL(10, 2) DEFAULT NULL;

-- 2. Tracking de visualización para el Dashboard
ALTER TABLE proposals
ADD COLUMN last_viewed_at TIMESTAMP NULL DEFAULT NULL;
