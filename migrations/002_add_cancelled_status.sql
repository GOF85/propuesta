-- Agregar nuevo estado 'cancelled' en propuestas
ALTER TABLE proposals
  MODIFY status ENUM('draft', 'sent', 'accepted', 'cancelled') DEFAULT 'draft';
