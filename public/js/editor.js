/**
 * Editor JavaScript
 * Propósito: Interactividad del lado cliente (add/remove sin reload)
 * Pattern: Fetch API + DOM manipulation
 */

const proposalId = document.querySelector('[data-proposal-id]')?.dataset.proposalId;

// ═══════════════════════════════════════════════════════════════
// SERVICIOS
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-add-service')?.addEventListener('click', async () => {
  const title = prompt('Nombre del servicio:');
  if (!title) return;

  const type = document.querySelector('[name="service-type"]')?.value || 'gastronomy';

  try {
    const response = await fetch(`/api/proposals/${proposalId}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, type })
    });

    if (!response.ok) throw new Error('Error al agregar servicio');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Servicio agregado', 'success');
      // Agregar fila a tabla de servicios
      addServiceRow(data.service_id, title, type);
      // Recalcular totales
      await calculateTotals();
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// Eliminar servicio
document.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('btn-remove-service')) return;

  if (!confirm('¿Eliminar este servicio?')) return;

  const serviceId = e.target.dataset.serviceId;

  try {
    const response = await fetch(`/api/proposals/${proposalId}/services/${serviceId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Servicio eliminado', 'success');
      e.target.closest('.service-row')?.remove();
      await calculateTotals();
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════════════════════════
// VENUES
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-add-venue')?.addEventListener('click', async () => {
  const venueSelect = document.querySelector('[name="venue-selector"]');
  if (!venueSelect || !venueSelect.value) {
    showNotification('Selecciona un venue', 'warning');
    return;
  }

  const venueId = venueSelect.value;

  try {
    const response = await fetch(`/api/proposals/${proposalId}/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ venue_id: venueId })
    });

    if (!response.ok) throw new Error('Error al agregar venue');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Venue agregado', 'success');
      // Obtener nombre del venue
      const venueName = venueSelect.options[venueSelect.selectedIndex].text;
      addVenueRow(data.venue_id, venueName);
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// Eliminar venue
document.addEventListener('click', async (e) => {
  if (!e.target.classList.contains('btn-remove-venue')) return;

  if (!confirm('¿Eliminar este venue?')) return;

  const venueId = e.target.dataset.venueId;

  try {
    const response = await fetch(`/api/proposals/${proposalId}/venues/${venueId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Venue eliminado', 'success');
      e.target.closest('.venue-row')?.remove();
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════════════════════════
// CÁLCULO DE TOTALES (Motor Financiero)
// ═══════════════════════════════════════════════════════════════

async function calculateTotals() {
  try {
    const response = await fetch(`/api/proposals/${proposalId}/calculate`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Error en cálculo');

    const data = await response.json();
    if (data.success) {
      // Actualizar display de total
      const totalElement = document.querySelector('[data-total]');
      if (totalElement) {
        totalElement.textContent = data.formatted;
        totalElement.dataset.amount = data.total;
      }
    }
  } catch (err) {
    console.error('Error calculando totales:', err);
  }
}

// Recalcular cuando cambie cantidad de pax
document.querySelector('[name="pax"]')?.addEventListener('change', async () => {
  await calculateTotals();
});

// Recalcular cuando cambie un descuento
document.addEventListener('change', async (e) => {
  if (e.target.name?.includes('discount') || e.target.name?.includes('price')) {
    await calculateTotals();
  }
});

// ═══════════════════════════════════════════════════════════════
// FORMULARIO PRINCIPAL
// ═══════════════════════════════════════════════════════════════

let hasChanges = false;

document.querySelectorAll('input, textarea, select').forEach(field => {
  field.addEventListener('change', () => {
    hasChanges = true;
    updateSaveButton();
  });
});

function updateSaveButton() {
  const btn = document.getElementById('btn-save-proposal');
  if (btn) {
    btn.disabled = !hasChanges;
    btn.textContent = hasChanges ? '💾 Guardar Cambios' : '✓ Guardado';
  }
}

document.getElementById('btn-save-proposal')?.addEventListener('click', async () => {
  const formData = {
    client_name: document.querySelector('[name="client_name"]')?.value,
    event_date: document.querySelector('[name="event_date"]')?.value,
    pax: document.querySelector('[name="pax"]')?.value,
    legal_conditions: document.querySelector('[name="legal_conditions"]')?.value
  };

  try {
    const response = await fetch(`/proposal/${proposalId}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Error al guardar');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Propuesta guardada', 'success');
      hasChanges = false;
      updateSaveButton();
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════════════════════════
// PUBLICAR PROPUESTA
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-publish')?.addEventListener('click', async () => {
  if (!confirm('¿Enviar propuesta al cliente?')) return;

  try {
    const response = await fetch(`/proposal/${proposalId}/publish`, {
      method: 'POST'
    });

    if (response.redirected) {
      showNotification('✓ Propuesta enviada', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function showNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  if (type === 'success') {
    notification.style.backgroundColor = '#10b981';
    notification.style.color = 'white';
  } else if (type === 'error') {
    notification.style.backgroundColor = '#ef4444';
    notification.style.color = 'white';
  } else if (type === 'warning') {
    notification.style.backgroundColor = '#f59e0b';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#3b82f6';
    notification.style.color = 'white';
  }

  document.body.appendChild(notification);

  // Auto-remover después de 3 segundos
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function addServiceRow(serviceId, title, type) {
  const tbody = document.querySelector('.services-table tbody');
  if (!tbody) return;

  const row = document.createElement('tr');
  row.className = 'service-row';
  row.innerHTML = `
    <td>${title}</td>
    <td>${type}</td>
    <td>
      <button class="btn btn-sm btn-remove-service" data-service-id="${serviceId}">
        🗑️ Eliminar
      </button>
    </td>
  `;
  tbody.appendChild(row);
}

function addVenueRow(venueId, venueName) {
  const tbody = document.querySelector('.venues-table tbody');
  if (!tbody) return;

  const row = document.createElement('tr');
  row.className = 'venue-row';
  row.innerHTML = `
    <td>${venueName}</td>
    <td>
      <button class="btn btn-sm btn-remove-venue" data-venue-id="${venueId}">
        🗑️ Eliminar
      </button>
    </td>
  `;
  tbody.appendChild(row);
}

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

// Al cargar, calcular totales
document.addEventListener('DOMContentLoaded', () => {
  calculateTotals();
  updateSaveButton();
});

// Advertencia al salir si hay cambios sin guardar
window.addEventListener('beforeunload', (e) => {
  if (hasChanges) {
    e.preventDefault();
    e.returnValue = '¿Seguro? Hay cambios sin guardar.';
  }
});
