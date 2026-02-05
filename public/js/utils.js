/**
 * Client-side Utilities & Helpers
 * Funciones JavaScript comunes para vistas
 */

/**
 * Realiza una petición AJAX
 * @param {string} url
 * @param {object} options - {method, headers, body, etc}
 * @returns {Promise<object>}
 */
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error('fetchAPI Error:', err);
    showNotification('Error en la petición', 'error');
    throw err;
  }
}

/**
 * Muestra una notificación (toast)
 * @param {string} message
 * @param {string} type - 'success', 'error', 'info', 'warning'
 * @param {number} duration - ms
 */
function showNotification(message, type = 'info', duration = 3000) {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  };
  
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 border rounded-lg p-4 ${colors[type] || colors.info} animate-fadeIn z-50`;
  notification.innerHTML = `
    <p class="font-semibold text-sm">${message}</p>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, duration);
}

/**
 * Formatea una moneda
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0);
}

/**
 * Formatea una fecha
 * @param {string|Date} date
 * @param {string} locale
 * @returns {string}
 */
function formatDate(date, locale = 'es-ES') {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Copia texto al portapapeles
 * @param {string} text
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showNotification('Copiado al portapapeles', 'success', 2000);
  } catch (err) {
    console.error('Error al copiar:', err);
    showNotification('Error al copiar', 'error');
  }
}

/**
 * Confirma una acción con modal
 * @param {string} message
 * @returns {Promise<boolean>}
 */
function confirm(message) {
  return new Promise((resolve) => {
    if (window.confirm(message)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

/**
 * Debounce function
 * @param {function} func
 * @param {number} wait
 * @returns {function}
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {function} func
 * @param {number} limit
 * @returns {function}
 */
function throttle(func, limit = 1000) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Obtiene valor de query param
 * @param {string} name
 * @returns {string|null}
 */
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Valida email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Exportar para uso en módulos (si aplica)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchAPI,
    showNotification,
    formatCurrency,
    formatDate,
    copyToClipboard,
    confirm,
    debounce,
    throttle,
    getQueryParam,
    isValidEmail,
  };
}
