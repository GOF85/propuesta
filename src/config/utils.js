/**
 * Utilities & Helpers
 * Funciones de uso general en servicios y controladores
 */

const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

/**
 * Genera un hash único para acceso magic link
 * @returns {string} Hash de 32 caracteres
 */
function generateUniqueHash() {
  return uuidv4().replace(/-/g, '').substring(0, 32);
}

/**
 * Formatea una fecha para mostrar
 * @param {Date} date
 * @param {string} format - dayjs format string
 * @returns {string}
 */
function formatDate(date, format = 'DD/MM/YYYY') {
  return dayjs(date).format(format);
}

/**
 * Formatea una moneda (EUR)
 * @param {number} amount
 * @returns {string} Ej: "1.234,56 €"
 */
function formatCurrency(amount) {
  if (typeof amount !== 'number') return '0,00 €';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

/**
 * Calcula el IVA según tipo
 * @param {number} baseAmount - Importe base
 * @param {number} vatRate - % IVA (ej: 10.0 o 21.0)
 * @returns {number} Importe de IVA
 */
function calculateVAT(baseAmount, vatRate = 21.0) {
  return baseAmount * (vatRate / 100);
}

/**
 * Calcula importe total con IVA
 * @param {number} baseAmount
 * @param {number} vatRate
 * @returns {number}
 */
function calculateTotalWithVAT(baseAmount, vatRate = 21.0) {
  return baseAmount + calculateVAT(baseAmount, vatRate);
}

/**
 * Valida email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Trunca un string
 * @param {string} str
 * @param {number} maxLength
 * @returns {string}
 */
function truncate(str, maxLength = 50) {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
}

/**
 * Convierte objeto de query params a Where SQL
 * @param {object} filters - {status: 'draft', search: 'amazon'}
 * @param {array} allowedFields - ['status', 'search']
 * @returns {object} {whereClause: '', values: []}
 */
function buildWhereClause(filters, allowedFields) {
  const whereConditions = [];
  const values = [];
  
  for (const [key, value] of Object.entries(filters)) {
    if (value && allowedFields.includes(key)) {
      if (key === 'search') {
        whereConditions.push('(client_name LIKE ? OR event_name LIKE ?)');
        values.push(`%${value}%`, `%${value}%`);
      } else {
        whereConditions.push(`${key} = ?`);
        values.push(value);
      }
    }
  }
  
  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  return { whereClause, values };
}

/**
 * Pausa de forma asíncrona (para testing)
 * @param {number} ms
 * @returns {Promise}
 */
function delay(ms = 1000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  generateUniqueHash,
  formatDate,
  formatCurrency,
  calculateVAT,
  calculateTotalWithVAT,
  isValidEmail,
  truncate,
  buildWhereClause,
  delay,
};
