/**
 * Application Constants
 * Valores predefinidos para toda la aplicación
 */

const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
};

const PROPOSAL_STATUS_LABELS = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
};

const PROPOSAL_STATUS_COLORS = {
  draft: 'gray',
  sent: 'yellow',
  accepted: 'green',
};

const SERVICE_TYPES = {
  GASTRONOMY: 'gastronomy',
  LOGISTICS: 'logistics',
  STAFF: 'staff',
  OTHER: 'other',
};

const SERVICE_TYPES_LABELS = {
  gastronomy: 'Gastronomía',
  logistics: 'Logística',
  staff: 'Personal',
  other: 'Otro',
};

const USER_ROLES = {
  ADMIN: 'admin',
  COMMERCIAL: 'commercial',
};

const USER_ROLES_LABELS = {
  admin: 'Administrador',
  commercial: 'Comercial',
};

const VAT_RATES = {
  SERVICE: 10.0,    // Servicios: 10%
  FOOD: 21.0,       // Alimentos: 21%
};

const IMAGE_SIZES = {
  LOGO_MAX_WIDTH: 200,
  LOGO_MAX_HEIGHT: 200,
  UPLOAD_MAX_WIDTH: 1920,
  UPLOAD_MAX_HEIGHT: 1440,
};

const RATE_LIMITS = {
  MAGIC_LINK_PER_MINUTE: 5,
  CHAT_PER_MINUTE: 10,
};

const POLLING_INTERVALS = {
  CHAT_POLL_MS: 30000, // 30 segundos
};

module.exports = {
  PROPOSAL_STATUS,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
  SERVICE_TYPES,
  SERVICE_TYPES_LABELS,
  USER_ROLES,
  USER_ROLES_LABELS,
  VAT_RATES,
  IMAGE_SIZES,
  RATE_LIMITS,
  POLLING_INTERVALS,
};
