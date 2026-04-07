-- 006_add_show_legal_conditions.sql
-- Añadir toggle de visibilidad para comentarios legales/comerciales

USE catering_proposals;

ALTER TABLE proposals 
ADD COLUMN show_legal_conditions BOOLEAN DEFAULT TRUE;
