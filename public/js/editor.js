/**
 * Editor JavaScript
 * Propósito: Interactividad del lado cliente (add/remove sin reload)
 * Pattern: Fetch API + DOM manipulation
 */
console.log('[Editor] editor.js loaded');

// Helper para obtener ID de propuesta de forma segura
const getPid = () => document.querySelector('[data-proposal-id]')?.dataset.proposalId;

let hasChanges = false;
let optionsChanged = false;

// ═══════════════════════════════════════════════════════════════
// UI & MICE CATERING EDITOR ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Toggle Presupuesto en Revisión (is_editing)
 */
async function toggleIsEditing(checkbox) {
  const pid = getPid();
  if (!pid) return;
  const isChecked = checkbox.checked;
  try {
    const response = await fetch(`/api/proposals/${pid}/toggle-editing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_editing: isChecked })
    });
    if (!response.ok) throw new Error('Error al actualizar estado');
    showNotification(isChecked ? 'Modo revisión activado' : 'Modo edición activado', 'success');
  } catch (err) {
    checkbox.checked = !isChecked;
    showNotification('Error: ' + err.message, 'error');
  }
}

/**
 * Actualiza el estado de la propuesta de forma inmediata
 */
async function updateProposalStatus(newStatus) {
  const pid = getPid();
  const select = document.getElementById('proposal-status-select');
  if (!select || !pid) return;

  try {
    const response = await fetch(`/proposal/${pid}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error('Error al actualizar el estado');

    // Actualizar clases visuales del select
    select.classList.remove('bg-blue-50', 'text-blue-600', 'border-blue-100', 'focus:border-blue-300');
    select.classList.remove('bg-green-50', 'text-[#31713D]', 'border-green-100', 'focus:border-green-300');
    select.classList.remove('bg-red-50', 'text-red-600', 'border-red-100', 'focus:border-red-300');

    if (newStatus === 'Pipe') {
      select.classList.add('bg-blue-50', 'text-blue-600', 'border-blue-100', 'focus:border-blue-300');
    } else if (newStatus === 'Aceptada') {
      select.classList.add('bg-green-50', 'text-[#31713D]', 'border-green-100', 'focus:border-green-300');
    } else if (newStatus === 'Anulada') {
      select.classList.add('bg-red-50', 'text-red-600', 'border-red-100', 'focus:border-red-300');
    }

    showNotification('Estado actualizado correctamente', 'success');
  } catch (err) {
    console.error('Error:', err);
    showNotification('Error: ' + err.message, 'error');
  }
}

/**
 * Actualiza la categoría del cliente (Sub-label)
 */
async function updateClientCategory(newCategory) {
  const pid = getPid();
  if (!pid) return;

  try {
    const response = await fetch(`/proposal/${pid}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ client_category: newCategory })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Editor] Error response:', errorData);
      throw new Error(errorData.message || 'Error al actualizar la categoría');
    }
    showNotification('Categoría de cliente actualizada', 'success');
  } catch (err) {
    console.error('Error:', err);
    showNotification('Error: ' + err.message, 'error');
  }
}

/**
 * Actualiza campos de la cabecera (client_name, pax, dates, etc.)
 */
async function updateProposalHeader(data) {
  const pid = getPid();
  if (!pid) return;

  // Si cambiamos la fecha de inicio, preguntar si queremos sincronizar todos los servicios
  if (data.event_date) {
    const confirmSync = await Swal.fire({
        title: '¿Sincronizar servicios?',
        text: "¿Quieres mover todos los servicios a la nueva fecha de inicio?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, sincronizar',
        cancelButtonText: 'Solo la propuesta',
        confirmButtonColor: '#31713D',
        cancelButtonColor: '#6b7280'
    });
    
    if (confirmSync.isConfirmed) {
        data.sync_service_dates = true;
    }
  }

  try {
    const response = await fetch(`/api/proposals/${pid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Error al actualizar cabecera');
    
    showNotification('Cabecera actualizada', 'success');
    
    // Si sincronizamos fechas, o cambió el PAX, necesitamos refrescar la UI
    if (data.sync_service_dates || data.pax !== undefined) {
      if (data.pax !== undefined) calculateTotals();
      refreshProposalData();
    }
    
    if (data.event_date !== undefined || data.event_end_date !== undefined) {
        calculateDurationDays();
    }
  } catch (err) {
    console.error('Error al actualizar cabecera:', err);
    showNotification('Error: ' + err.message, 'error');
  }
}

/**
 * Cálculo de duración en días
 */
function calculateDurationDays() {
  const start = document.getElementById('event-date')?.value;
  const end = document.getElementById('event-end-date')?.value;
  const display = document.getElementById('event-duration-days');
  
  if (!start || !end || !display) return;
  
  const d1 = new Date(start);
  const d2 = new Date(end);
  const diffTime = d2 - d1;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays > 0) {
    display.textContent = `${diffDays} día${diffDays > 1 ? 's' : ''}`;
  } else {
    display.textContent = '-';
  }
}

/**
 * Acordeones UI
 */
function toggleSection(sectionId) {
  const section = document.getElementById(`section-${sectionId}`);
  if (!section) return;

  const content = document.getElementById(`content-${sectionId}`) || section.querySelector('.p-8, .p-0, .content-section');
  if (!content) return;

  const icon = section.querySelector('[data-lucide^="chevron-"]');
  const summary = section.querySelector('.section-summary');

  const isHidden = content.classList.contains('hidden');
  
  if (isHidden) {
    // ABRIR
    content.classList.remove('hidden');
    if (summary) summary.classList.add('hidden');
    if (icon) icon.classList.add('rotate-180');
  } else {
    // CERRAR
    content.classList.add('hidden');
    if (summary) summary.classList.remove('hidden');
    if (icon) icon.classList.remove('rotate-180');
  }
  
  if (window.lucide) lucide.createIcons();
}

// ═══════════════════════════════════════════════════════════════
// SERVICIOS (MODAL SYSTEM)
// ═══════════════════════════════════════════════════════════════

function openServiceModal() {
  const modalTitle = document.getElementById('service-modal-title')?.querySelector('span');
  if (modalTitle) modalTitle.textContent = 'Nuevo Hito';
  
  document.getElementById('modal-service-id').value = '';
  document.getElementById('service-form').reset();
  
  // Ocultar opciones para hito nuevo, pero permitir configurar su naturaleza desde el inicio
  document.getElementById('modal-options-container')?.classList.add('hidden');
  document.getElementById('multichoice-container')?.classList.remove('hidden');
  document.getElementById('optional-container')?.classList.remove('hidden');
  if (document.getElementById('modal-service-multichoice')) document.getElementById('modal-service-multichoice').checked = false;
  if (document.getElementById('modal-service-optional')) document.getElementById('modal-service-optional').checked = false;
  
  // Valores por defecto inteligentes
  const eventDate = document.getElementById('event-date')?.value;
  if (eventDate) document.getElementById('modal-service-date').value = eventDate;
  
  // PAX por defecto de la propuesta
  const proposalPax = document.querySelector('input[name="pax"]')?.value;
  if (proposalPax) document.getElementById('modal-service-pax').value = proposalPax;
  
  // Horario por defecto: Si no hay nada, 14:00 - 16:00
  if (!document.getElementById('modal-service-start').value) {
    document.getElementById('modal-service-start').value = "14:00";
    document.getElementById('modal-service-end').value = "16:00";
  }

  // IVA por defecto Gastronomía
  document.getElementById('modal-service-vat').value = "10.00";
  
  // Renderizar sugerencia de localización basada en los hitos ya guardados
  try { renderLocationSuggestionInModal(); } catch (e) { console.error('renderLocationSuggestionInModal error', e); }

  const modal = document.getElementById('serviceModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  
  if (window.lucide) lucide.createIcons();
}

/**
 * Busca en los servicios de la propuesta la última localización no vacía
 * y la devuelve como string. Se basa en `window.servicesMap`.
 */
function getLastServiceLocation() {
  if (!window.servicesMap) return null;
  const services = Object.values(window.servicesMap || {});
  if (!services || services.length === 0) return null;

  // Intentar ordenar por fecha de servicio si existe, fallback por id
  services.sort((a, b) => {
    if (a.service_date && b.service_date) {
      return new Date(a.service_date) - new Date(b.service_date);
    }
    return (a.id || 0) - (b.id || 0);
  });

  // Buscar la última localización no vacía (recorriendo al final)
  for (let i = services.length - 1; i >= 0; i--) {
    const s = services[i];
    if (s && s.location && String(s.location).trim() !== '') return String(s.location).trim();
  }
  return null;
}

/**
 * Inserta (o actualiza) la UI de sugerencia de localización dentro del modal
 */
function renderLocationSuggestionInModal() {
  const modal = document.getElementById('serviceModal');
  if (!modal) return;

  const locationInput = document.getElementById('modal-service-location');
  if (!locationInput) return;

  // Contenedor donde se mostrará la sugerencia (crear si no existe)
  let sugerenceEl = document.getElementById('modal-service-location-suggestion');
  if (!sugerenceEl) {
    sugerenceEl = document.createElement('div');
    sugerenceEl.id = 'modal-service-location-suggestion';
    sugerenceEl.className = 'text-sm mt-2 text-gray-500 flex items-center gap-3';
    locationInput.parentNode.insertBefore(sugerenceEl, locationInput.nextSibling);
  }

  const lastLoc = getLastServiceLocation();
  if (!lastLoc) {
    sugerenceEl.innerHTML = '';
    return;
  }

  sugerenceEl.innerHTML = `
    <div class="flex items-center gap-2">
      <button type="button" class="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md font-medium" onclick="(function(){document.getElementById('modal-service-location').value = '${escapeHtml(lastLoc)}'; showNotification('Localización anterior aplicada', 'success');})();">Usar localización anterior</button>
      <button type="button" class="text-xs px-2 py-1 bg-white text-gray-500 border border-gray-100 rounded-md" onclick="document.getElementById('modal-service-location').value = ''; showNotification('Introduce una nueva localización', 'info');">Crear nueva</button>
      <span class="text-[10px] italic opacity-60">Anterior: <strong class="ml-1 text-gray-700">${escapeHtml(lastLoc)}</strong></span>
    </div>
  `;
}

// Simple escape para insertar texto en HTML (protege comillas simples/dobles)
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * SMART DURATION: Ajusta fin automáticamente (+2h)
 */
document.addEventListener('DOMContentLoaded', () => {
    const startInput = document.getElementById('modal-service-start');
    const endInput = document.getElementById('modal-service-end');
    
    if (startInput && endInput) {
        startInput.addEventListener('change', () => {
            if (!startInput.value) return;
            
            const [hours, minutes] = startInput.value.split(':').map(Number);
            let endHours = (hours + 2) % 24;
            const endValue = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            
            // Solo ajustar si el fin está vacío o es igual al inicio
            if (!endInput.value || endInput.value === startInput.value) {
                endInput.value = endValue;
            }
        });
    }

    // Drag & Drop Feedback para Logo
    const logoContainer = document.querySelector('.group.cursor-pointer.w-10.h-10');
    if (logoContainer) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            logoContainer.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        logoContainer.addEventListener('dragover', () => {
            logoContainer.classList.add('border-[#31713D]', 'scale-110', 'rotate-3');
        });

        ['dragleave', 'drop'].forEach(eventName => {
            logoContainer.addEventListener(eventName, () => {
                logoContainer.classList.remove('border-[#31713D]', 'scale-110', 'rotate-3');
            });
        });

        logoContainer.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                const input = document.getElementById('logo-upload');
                input.files = files;
                // Disparar el evento change manualmente si es necesario o llamar a la función de subida
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
    }
});

/**
 * VALIDACIÓN PRE-VUELO: Antes de generar PDF o enviar
 */
async function validateProposalComplete() {
    const proposalId = getPid();
    // Try to get the triggering button safely (avoid relying on global `event`)
    const btn = (typeof document !== 'undefined' && document.activeElement && document.activeElement.tagName === 'BUTTON')
                ? document.activeElement
                : document.getElementById('btn-validate') || null;
    const originalContent = btn ? btn.innerHTML : '';
    
    if (btn) {
      btn.innerHTML = '<i data-lucide="loader" class="w-3 h-3 animate-spin"></i> Validando...';
      if (window.lucide) lucide.createIcons();
    }

    try {
        const response = await fetch(`/api/proposals/${proposalId}/validate`);
        const result = await response.json();
        
        if (result.valid) {
            Swal.fire({
                title: '¡Propuesta Lista!',
                text: 'No se han encontrado errores críticos. Todo listo para enviar.',
                icon: 'success',
                confirmButtonColor: '#31713D',
                timer: 2000
            });
        } else {
            const issues = result.errors.map(err => `• ${err}`).join('<br>');
            Swal.fire({
                title: 'Atención: Pendiente',
                html: `<div class="text-left text-sm mt-4 text-gray-600">${issues}</div>`,
                icon: 'warning',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#31713D'
            });
        }
    } catch (e) {
        console.error(e);
        // Fallback básico si la API no está
        Swal.fire('Validación Offline', 'Revisa que tengas PAX y al menos un servicio configurado.', 'info');
    } finally {
      if (btn) btn.innerHTML = originalContent;
      if (window.lucide) lucide.createIcons();
    }
}

/**
 * CAMBIO DINÁMICO DE IVA SEGÚN TIPO
 */
function handleServiceTypeChange(type) {
  const vatSelect = document.getElementById('modal-service-vat');
  if (!vatSelect) return;
  
  if (type === 'gastronomy') {
    vatSelect.value = "10.00";
  } else {
    vatSelect.value = "21.00";
  }
}

/**
 * MODO ENFOQUE PARA SERVICIOS
 */
function toggleServicesFocusMode() {
  const section = document.getElementById('section-services');
  if (!section) return;
  
  if (section.classList.contains('fixed')) {
    // Desactivar focus mode
    section.classList.remove('fixed', 'inset-4', 'z-[100]', 'shadow-2xl', 'flex', 'flex-col');
    section.querySelector('.overflow-x-auto').classList.remove('flex-1');
    document.body.classList.remove('overflow-hidden');
  } else {
    // Activar focus mode
    section.classList.add('fixed', 'inset-4', 'z-[100]', 'shadow-2xl', 'flex', 'flex-col');
    section.querySelector('.overflow-x-auto').classList.add('flex-1');
    document.body.classList.add('overflow-hidden');
  }
}

function closeServiceModal() {
  const modal = document.getElementById('serviceModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  
  if (optionsChanged) {
      optionsChanged = false;
      hasChanges = false;
      refreshProposalData();
  }
}

/**
 * RE-RENDERIZA LA TABLA PRINCIPAL DE SERVICIOS
 * Propósito: Refrescar la card "Configuración de Servicios" sin recargar la página
 */
function renderMainServicesTable() {
  const container = document.getElementById('services-list');
  if (!container || !window.servicesMap) return;

  // Convertir mapa a array ordenado (por ID o por fecha si existiera)
  const services = Object.values(window.servicesMap).sort((a, b) => a.id - b.id);
  const proposalId = getPid();

  if (services.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-16 text-center">
          <div class="flex flex-col items-center justify-center gap-3">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
               <i data-lucide="utensils-crossed" class="w-8 h-8 text-gray-200"></i>
            </div>
            <p class="text-sm text-gray-400 font-medium">Aún no has configurado ningún servicio.</p>
            <button type="button" onclick="openServiceModal()" class="bg-[#31713D] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition shadow-lg shadow-green-100 mt-2">
              Añadir Hito / Servicio
            </button>
          </div>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = services.map((service, idx) => {
    const serviceDate = service.service_date ? dayjs(service.service_date).format('DD/MM/YYYY') : '--/--/----';
    const typeLabel = service.type === 'gastronomy' ? 'GASTRONOMÍA' : (service.type === 'extras' ? 'EXTRAS' : service.type.toUpperCase());
    const pax = service.pax || '---';
    
    // Resume de opciones
    let optionsHtml = '';
    if (service.options && service.options.length > 0) {
      optionsHtml = service.options.map(opt => `
        <div class="bg-gray-50 border border-gray-200 px-2 py-0.5 rounded text-[10px] text-gray-500">
          <span class="font-black">${opt.name}</span> 
          <span class="opacity-40 ml-1">(${opt.items?.length || 0} ítems)</span>
        </div>
      `).join('');
    } else {
      optionsHtml = '<p class="text-[10px] text-gray-400 italic">Sin opciones configuradas</p>';
    }

    return `
      <tr class="hover:bg-gray-50 transition-colors group cursor-pointer" 
          data-service-id="${service.id}"
          onclick="editServiceById('${service.id}')">
        <td class="px-3 py-4 text-center align-top">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-400 group-hover:bg-[#31713D] group-hover:text-white font-bold text-[10px] transition-all">
            ${idx + 1}
          </span>
        </td>
        <td class="px-3 py-4 align-top">
          <div class="text-[11px] font-bold text-gray-800 whitespace-nowrap">
            <i data-lucide="calendar" class="w-3 h-3 inline mr-1 text-gray-300"></i>
            ${serviceDate}
          </div>
        </td>
        <td class="px-3 py-4">
          <div class="flex flex-col">
            <div class="flex items-center gap-2">
              <div class="font-bold text-gray-900 text-sm">${service.title}</div>
              <span class="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">${typeLabel}</span>
              ${service.location ? `<span class="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">${service.location}</span>` : ''}
              ${service.is_multichoice ? '<span class="text-[8px] bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">MULTICHOICE</span>' : ''}
              ${service.is_optional ? '<span class="text-[8px] bg-gray-50 text-gray-600 border border-dashed border-gray-300 px-1.5 py-0.5 rounded font-black uppercase tracking-widest">OPCIONAL</span>' : ''}
              ${(() => {
                try {
                  const selIdx = (service.selected_option_index !== null && service.selected_option_index !== undefined) ? Number(service.selected_option_index) : null;
                  const accepted = selIdx !== null ? (service.is_multichoice ? selIdx >= 0 : selIdx === 0) : false;
                  if (accepted) return `<span class="text-[9px] bg-green-50 text-[#31713D] border border-green-100 px-1.5 py-0.5 rounded font-black uppercase tracking-widest ml-2">${service.is_optional ? 'Cliente añadió' : 'Cliente aceptó'}</span>`;
                } catch (e) { /* ignore */ }
                return '';
              })()}
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              ${optionsHtml}
            </div>
            ${(() => {
              try {
                if (!service.is_multichoice) return '';
                const selIdx = (service.selected_option_index !== null && service.selected_option_index !== undefined) ? Number(service.selected_option_index) : null;
                if (selIdx === null || selIdx === undefined || selIdx < 0) return '';
                const sorted = (service.options || []).slice().sort((a,b) => a.id - b.id);
                const sel = sorted[selIdx];
                if (!sel) return '';
                return `<div class="mt-2"><span class="text-[10px] bg-green-50 text-[#31713D] px-2 py-1 rounded font-black">${service.is_optional ? 'Añadido:' : 'Seleccionado:'} ${escapeHtml(sel.name)}</span></div>`;
              } catch (e) { return ''; }
            })()}
          </div>
        </td>
        <td class="px-3 py-4 text-center align-top whitespace-nowrap">
          <span class="text-xs font-bold ${service.pax ? 'text-[#31713D]' : 'text-gray-400'}">
            ${pax} PAX
          </span>
          <div class="text-[9px] text-gray-400 mt-1 font-medium">${service.vat_rate || 0}% IVA Incl.</div>
        </td>
        <td class="px-3 py-4 text-center align-top whitespace-nowrap">
          ${(() => {
            try {
              const pricePerPax = Number(service.price_per_pax || service.price_per_pax === 0 ? service.price_per_pax : 0);
              const paxCount = Number(service.pax || document.querySelector('input[name="pax"]')?.value || 0);
              const importe = (pricePerPax || 0) * (paxCount || 0);
              return `<div class="text-sm font-black text-gray-900">${importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>`;
            } catch (e) { return '<div class="text-sm text-gray-400">-</div>'; }
          })()}
        </td>
        <td class="px-3 py-4 align-top text-center whitespace-nowrap">
          <div class="inline-flex flex-col items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1.5 rounded-lg border border-gray-100">
            <div class="flex items-center gap-1">
              <i data-lucide="clock" class="w-3 h-3 text-gray-300"></i>
              ${service.start_time ? String(service.start_time).substring(0, 5) : '--:--'}
              <span class="text-gray-300">→</span>
              ${service.end_time ? String(service.end_time).substring(0, 5) : (service.duration ? 'Auto' : '--:--')}
            </div>
            ${service.duration ? `<div class="text-[10px] font-black text-[#31713D] bg-green-100/50 px-1.5 rounded uppercase tracking-tighter">${service.duration} MIN</div>` : ''}
          </div>
        </td>
        <td class="px-3 py-4 align-top text-center border-l border-gray-100">
          <div class="flex items-center justify-center gap-1">
            <button type="button" class="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition" onclick="event.stopPropagation(); duplicateService(${service.id})">
              <i data-lucide="copy" class="w-4 h-4"></i>
            </button>
            <button type="button" class="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" onclick="event.stopPropagation(); deleteService(${service.id})">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

/**
 * REFRESCA TODOS LOS DATOS DE LA PROPUESTA Y RE-RENDERIZA LA UI
 */
async function refreshProposalData() {
  try {
    const pid = getPid();
    const res = await fetch(`/api/proposals/${pid}`);
    if (!res.ok) throw new Error('Error al obtener datos actualizados');
    
    const data = await res.json();
    
    // Actualizar estados globales
    // window.proposal = data.proposal; (Cuidado con sobrescribir si hay más cosas)
    window.servicesMap = {};
    if (data.services) {
      data.services.forEach(s => window.servicesMap[s.id] = s);
    }
    
    // Re-renderizar componentes clave
    renderMainServicesTable();
    if (typeof calculateTotals === 'function') calculateTotals();
    
  } catch (err) {
    console.error('Error al refrescar propuesta:', err);
  }
}

/**
 * Gestión de Modal de Descuentos
 */
function openDiscountsModal() {
  const modal = document.getElementById('discountsModal');
  if (modal) {
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }
}

function closeDiscountsModal() {
  const modal = document.getElementById('discountsModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Gestión de Modal de Máximo Potencial
 */
function openMaxPotentialModal() {
  const modal = document.getElementById('maxPotentialModal');
  if (modal) {
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }
}

function closeMaxPotentialModal() {
  const modal = document.getElementById('maxPotentialModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * GESTIÓN DE LÍNEAS DE DESCUENTO
 */
async function handleAddDiscountLine() {
  const nameEl = document.getElementById('new_discount_name');
  const valueEl = document.getElementById('new_discount_value');
  const typeEl = document.getElementById('new_discount_type');

  const name = nameEl.value.trim();
  const type = typeEl.value;
  const value = parseFloat(valueEl.value) || 0;

  if (!name) return showNotification('El concepto es obligatorio', 'warning');
  if (value <= 0) return showNotification('El valor debe ser mayor a 0', 'warning');

  try {
    const proposalId = getPid();
    const response = await fetch(`/api/proposals/${proposalId}/discounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, value })
    });

    if (!response.ok) throw new Error('Error al añadir descuento');

    showNotification('Línea de descuento añadida', 'success');
    
    // Limpiar formulario manual
    nameEl.value = '';
    valueEl.value = '';

    // Recalcular y refrescar vista
    await refreshDiscountsModalContent();
    await refreshProposalData();
  } catch (err) {
    console.error('[handleAddDiscountLine] Error:', err);
    showNotification(err.message, 'error');
  }
}

async function handleDeleteDiscountLine(discountId) {
  if (discountId === 'legacy-percent' || discountId === 'legacy-fixed') {
      return showNotification('Este descuento general debe editarse desde la configuración global (legacy)', 'info');
  }

  if (!confirm('¿Eliminar esta línea de descuento?')) return;

  try {
    const proposalId = getPid();
    const response = await fetch(`/api/proposals/${proposalId}/discounts/${discountId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar descuento');

    showNotification('Descuento eliminado', 'success');
    await refreshDiscountsModalContent();
    await refreshProposalData();
  } catch (err) {
    console.error('[handleDeleteDiscountLine] Error:', err);
    showNotification(err.message, 'error');
  }
}

async function refreshDiscountsModalContent() {
    try {
        const proposalId = getPid();
        if (!proposalId) return;

        const response = await fetch(`/api/proposals/${proposalId}`);
        if (!response.ok) throw new Error('Error al obtener datos actualizados');
        
        const data = await response.json();
        const proposal = data.proposal;
        
        const container = document.getElementById('discounts-content');
        const modalTotalEl = document.querySelector('[data-modal-total-discount]');
        
        if (!container) return;

        if (proposal.totals && proposal.totals.discounts && proposal.totals.discounts.length > 0) {
            container.innerHTML = proposal.totals.discounts.map(d => `
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100 group">
                    <div class="flex-1">
                      <p class="text-[11px] font-black text-gray-900 flex items-center gap-2">
                        ${d.name}
                        ${d.type === 'percentage' ? `<span class="bg-red-200 text-red-700 text-[8px] px-1.5 py-0.5 rounded ml-1">${d.value}%</span>` : ''}
                      </p>
                      <p class="text-[9px] text-red-500 font-bold uppercase tracking-widest">
                        ${d.type === 'percentage' ? 'Porcentual' : 'Importe Fijo'}
                      </p>
                    </div>
                    <div class="flex items-center gap-4">
                      <p class="text-xs font-black text-red-600">-${Number(d.amount).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                      <button type="button" onclick="handleDeleteDiscountLine('${d.id}')" 
                              class="p-1.5 text-red-200 hover:text-red-600 transition-colors">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <i data-lucide="info" class="w-8 h-8 text-gray-200 mx-auto mb-2"></i>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sin descuentos activos</p>
                </div>
            `;
        }

        if (modalTotalEl) {
            modalTotalEl.textContent = `-${Number(proposal.totals?.total_discount || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}`;
        }

        // Sincronizar totales en la Vista Principal (EVITA QUE PAREZCA VACIO/DESACTUALIZADO)
        await calculateTotals();

        if (window.lucide) lucide.createIcons();
    } catch (err) {
        console.error('[refreshDiscountsModalContent] Error:', err);
    }
}

/**
 * Guarda los descuentos manuales en la BD y recalcula (DEPRECATED: Usar handleAddDiscountLine)
 */
async function saveDiscounts() {
    // Mantener por compatibilidad si se llama, pero redirigir a la nueva lógica
    handleAddDiscountLine();
}

function editService(service) {
  if (!service) return;
  console.log('[Editor] Editing:', service);
  optionsChanged = false; // Reset flag al abrir
  // Al editar un hito existente no mostramos la sugerencia de "usar anterior"
  const suggEl = document.getElementById('modal-service-location-suggestion');
  if (suggEl) suggEl.innerHTML = '';
  
  const modalId = document.getElementById('modal-service-id');
  const modalTitle = document.getElementById('modal-service-title');
  const modalType = document.getElementById('modal-service-type');
  const modalDate = document.getElementById('modal-service-date');
  const modalStart = document.getElementById('modal-service-start');
  const modalEnd = document.getElementById('modal-service-end');
  const modalDuration = document.getElementById('modal-service-duration');
  const modalPax = document.getElementById('modal-service-pax');
  const modalVat = document.getElementById('modal-service-vat');
  const modalLocation = document.getElementById('modal-service-location');
  const modalComments = document.getElementById('modal-service-comments');
  const multichoiceCheck = document.getElementById('modal-service-multichoice');
  const optionalCheck = document.getElementById('modal-service-optional');

  const titleSpan = document.getElementById('service-modal-title')?.querySelector('span');
  if (titleSpan) titleSpan.textContent = 'Editar Hito';
  
  if (modalId) modalId.value = service.id || '';
  if (modalTitle) modalTitle.value = service.title || '';
  if (modalType) modalType.value = service.type || 'extras';
  if (modalLocation) modalLocation.value = service.location || '';
  
  if (modalDate && service.service_date) {
    // Si la fecha ya viene formateada como YYYY-MM-DD desde el server (vía DATE_FORMAT)
    if (typeof service.service_date === 'string' && service.service_date.includes('-') && !service.service_date.includes('T')) {
        modalDate.value = service.service_date;
    } else {
        try {
            // Fallback para objetos Date o strings ISO
            const d = new Date(service.service_date);
            const y = d.getUTCFullYear();
            const m = String(d.getUTCMonth() + 1).padStart(2, '0');
            const day = String(d.getUTCDate()).padStart(2, '0');
            modalDate.value = `${y}-${m}-${day}`;
        } catch(e) {
            modalDate.value = '';
        }
    }
  } else if (modalDate) {
    modalDate.value = '';
  }
  
  if (modalStart) modalStart.value = service.start_time ? String(service.start_time).substring(0,5) : '';
  if (modalEnd) modalEnd.value = service.end_time ? String(service.end_time).substring(0,5) : '';
  if (modalDuration) modalDuration.value = service.duration || '';
  if (modalPax) modalPax.value = service.pax || '';
  if (modalVat) modalVat.value = service.vat_rate || '';
  if (modalComments) modalComments.value = service.comments || '';
  
  if (multichoiceCheck) {
    multichoiceCheck.checked = !!service.is_multichoice;
  }
  if (optionalCheck) {
    optionalCheck.checked = !!(service.is_optional === true || service.is_optional === 1 || service.is_optional === '1');
  }

  // Mostrar contenedores de edición avanzada
  document.getElementById('multichoice-container')?.classList.remove('hidden');
  document.getElementById('optional-container')?.classList.remove('hidden');
  
  const modal = document.getElementById('serviceModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Renderizar opciones en el modal
  const optionsContainer = document.getElementById('modal-options-container');
  if (optionsContainer) {
    if (service.id) {
      optionsContainer.classList.remove('hidden');
      renderModalOptions(service.options || []);
    } else {
      optionsContainer.classList.add('hidden');
    }
  }
  
  const sModal = document.getElementById('serviceModal');
  if (sModal) sModal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}


/**
 * Renderiza la lista de opciones e ítems dentro del modal de configuración
 */
function renderModalOptions(options) {
  const optionsList = document.getElementById('modal-options-list');
  const proposalId = getPid();
  const serviceId = document.getElementById('modal-service-id').value;
  
  if (!options || options.length === 0) {
    optionsList.innerHTML = `
      <div class="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
        <p class="text-xs text-gray-400 font-medium italic">Sin opciones configuradas aún.</p>
      </div>
    `;
    return;
  }

  optionsList.innerHTML = options.map(opt => `
    <div class="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <span class="text-sm font-black text-gray-900">${opt.name}</span>
          <span class="text-[11px] font-black text-[#31713D] bg-green-50 px-2 py-0.5 rounded border border-green-100">
            ${Number(opt.price_pax || 0).toFixed(2)} €
          </span>
          <button type="button" onclick="editOption(${opt.id})" class="text-gray-300 hover:text-amber-500 transition" title="Editar Nombre/Precio">
             <i data-lucide="edit-3" class="w-3 h-3"></i>
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" onclick="openDishSelector(${proposalId}, ${opt.id})" 
                  class="text-[9px] font-black text-amber-600 hover:text-black uppercase tracking-widest bg-amber-50 px-2 py-1 rounded">
            + Añadir Platos
          </button>
          <button type="button" onclick="openOptionMediaModal(${opt.id})" 
                  class="text-[9px] font-black text-purple-600 hover:text-black uppercase tracking-widest bg-purple-50 px-2 py-1 rounded" title="Imágenes y Etiquetas">
            Multimedia
          </button>
          <button type="button" onclick="duplicateOption(${opt.id})" 
                  class="text-[9px] font-black text-blue-600 hover:text-black uppercase tracking-widest bg-blue-50 px-2 py-1 rounded" title="Duplicar este menú">
            Duplicar
          </button>
          <button type="button" onclick="deleteOption(${opt.id})" class="text-gray-300 hover:text-red-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>

      <!-- Items List -->
      <div class="space-y-1.5 ml-2 border-l-2 border-gray-50 pl-4">
        ${(opt.items || []).map(item => `
          <div class="flex items-center justify-between group py-1">
             <div class="flex items-center gap-2">
                <span class="text-xs text-gray-600 font-medium">${item.name || item.dish_name || 'Plato'}</span>
                ${item.qty > 1 ? `<span class="text-[9px] bg-gray-100 px-1 rounded text-gray-400 font-bold">x${item.qty}</span>` : ''}
             </div>
             <div class="flex items-center gap-2">
                <button type="button" onclick="editItemById(${item.id}, ${opt.id}, ${serviceId})" class="text-gray-200 hover:text-[#31713D] transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </button>
                <button type="button" onclick="removeItem(${item.id})" class="text-gray-200 hover:text-red-500 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
             </div>
          </div>
        `).join('') || '<p class="text-[9px] text-gray-300 italic">No hay platos añadidos.</p>'}
      </div>
    </div>
  `).join('');
  if (window.lucide) lucide.createIcons();
}

/**
 * Refresca la vista del modal de servicio sin recargar la página entera
 */
async function refreshServiceData() {
  const serviceId = document.getElementById('modal-service-id').value;
  if (!serviceId) return;
    
  let spinner = document.getElementById('service-sync-spinner');
  if (spinner) spinner.classList.remove('hidden');

  // Disable interactive controls in the modal while syncing (keep allow-during-sync elements enabled)
  const modal = document.getElementById('serviceModal');
  let previouslyDisabled = [];
  if (modal) {
    const controls = modal.querySelectorAll('button, input, select, textarea');
    controls.forEach((el, idx) => {
      if (el.classList && el.classList.contains('allow-during-sync')) return;
      previouslyDisabled[idx] = el.disabled ? '1' : '0';
      try { el.disabled = true; } catch (e) {}
    });
  }

  try {
    const res = await fetch(`/api/services/${serviceId}`);
        if (!res.ok) throw new Error('No se pudo obtener el servicio');
        const service = await res.json();
        
        // Actualizar el mapa global para que persista el clic si se cierra
        if (window.servicesMap) {
            window.servicesMap[serviceId] = service;
        }
        
        // Re-renderizar las opciones
        renderModalOptions(service.options || []);

        // Sincronizar también la vista principal de "Configuración de Servicios"
        // para que cualquier cambio dentro del modal (opciones/ítems) se refleje
        // inmediatamente en la tabla principal y en los totales.
        if (typeof renderMainServicesTable === 'function') renderMainServicesTable();
        if (typeof calculateTotals === 'function') calculateTotals();

        optionsChanged = true; // Marcamos que ha habido cambios asíncronos
        
        // Marcar que hay cambios para que el usuario guarde al final si quiere, 
        // pero estas acciones ya están en DB.
        window.saveStatusDot?.classList.remove('opacity-0');
    } catch (e) {
      console.error('Error refreshing service data:', e);
    } finally {
      // Restore controls
      if (modal) {
        const controls = modal.querySelectorAll('button, input, select, textarea');
        controls.forEach((el, idx) => {
          if (el.classList && el.classList.contains('allow-during-sync')) return;
          try {
            const prev = previouslyDisabled[idx];
            el.disabled = prev === '1';
          } catch (e) {}
        });
      }

      if (spinner) spinner.classList.add('hidden');
    }
}


function editItemById(itemId, optionId, serviceId) {
    const service = window.servicesMap[serviceId];
    if (!service) return;
    const option = service.options.find(o => o.id === optionId);
    if (!option) return;
    const item = option.items.find(i => i.id === itemId);
    if (!item) return;
    editItem(item);
}


function addOptionFromModal() {
  const serviceId = document.getElementById('modal-service-id').value;
  if (!serviceId) return showNotification('Guarda el hito antes de añadir opciones', 'warning');
  promptAddOption(serviceId);
}

/**
 * Abre el catálogo de menús para importar uno directamente al hito actual
 */
window.openMenuCatalogForService = function() {
  const serviceId = document.getElementById('modal-service-id').value;
  if (!serviceId) {
    showNotification('Error: Guarda el hito antes de importar del catálogo', 'warning');
    return;
  }
  
  // Abrir el selector de platos en modo "importación de menú"
  // Usamos currentOptionId = null para indicar que debe crearse uno nuevo
  const proposalId = getPid();
  
  if (typeof openDishSelector === 'function') {
    // IMPORTANTE: Guardamos el ID del hito para saber dónde crear la opción luego
    window.currentServiceIdForImport = serviceId;
    openDishSelector(proposalId, null);
    if (typeof switchDishTab === 'function') switchDishTab('menus');
  } else {
    showNotification('El catálogo no está disponible', 'error');
  }
}

async function saveService(shouldClose = true) {
  const idField = document.getElementById('modal-service-id');
  const id = idField ? idField.value : '';
  
  const payload = {
    title: document.getElementById('modal-service-title').value.trim(),
    type: document.getElementById('modal-service-type').value,
    service_date: document.getElementById('modal-service-date').value,
    start_time: document.getElementById('modal-service-start').value || null,
    end_time: document.getElementById('modal-service-end').value || null,
    duration: parseInt(document.getElementById('modal-service-duration').value) || 0,
    pax: document.getElementById('modal-service-pax').value ? parseInt(document.getElementById('modal-service-pax').value) : null,
    vat_rate: document.getElementById('modal-service-vat').value ? parseFloat(document.getElementById('modal-service-vat').value) : null,
    location: document.getElementById('modal-service-location')?.value.trim() || null,
    comments: document.getElementById('modal-service-comments').value.trim() || null,
    is_multichoice: document.getElementById('modal-service-multichoice')?.checked ? 1 : 0,
    is_optional: document.getElementById('modal-service-optional')?.checked ? 1 : 0
  };

  if (!payload.title) return showNotification('El título es obligatorio', 'warning');

  try {
    const pid = getPid();
    const url = id 
      ? `/api/proposals/${pid}/services/${id}`
      : `/api/proposals/${pid}/services`;
    
    const response = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Error al guardar hito');
    
    const result = await response.json();
    
    if (shouldClose) {
        showNotification('Hito guardado correctamente', 'success');
        closeServiceModal();
        hasChanges = false;
        refreshProposalData();
    } else {
        // Modo silencioso (para habilitar opciones)
        const createdServiceId = result.serviceId || result.id;
        if (!id && createdServiceId) {
            idField.value = createdServiceId;
            document.getElementById('modal-options-container').classList.remove('hidden');
            renderModalOptions([]); // Vacío inicialmente
            showNotification('Hito creado. Ya puedes añadir opciones.', 'success');
        }
    }
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}


async function duplicateService(serviceId) {
  if (!confirm('¿Seguro que deseas duplicar este hito y todo su contenido?')) return;
  
  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/services/${serviceId}/duplicate`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Error al duplicar hito');
    
    showNotification('Hito duplicado correctamente', 'success');
    hasChanges = false;
    refreshProposalData();
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

async function deleteService(serviceId) {
  if (!confirm('¿Seguro que deseas eliminar este hito permanentemente?')) return;
  
  console.log('[Editor] Deleting service:', serviceId);
  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/services/${serviceId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error al eliminar hito en el servidor');
    }
    
    showNotification('Hito eliminado correctamente', 'success');
    hasChanges = false;
    refreshProposalData();
  } catch (err) {
    console.error('[Editor] deleteService Error:', err);
    showNotification('Error: ' + err.message, 'error');
  }
}

function editServiceById(serviceId) {
  console.log('[Editor] editServiceById called with ID:', serviceId);
  const service = window.servicesMap ? window.servicesMap[serviceId] : null;
  
  if (!service) {
    console.error('[Editor] Service not found in map. Current map:', window.servicesMap);
    showNotification('Error: Hito no encontrado en el mapa de datos', 'error');
    return;
  }
  
  try {
    editService(service);
  } catch (err) {
    console.error('[Editor] Error in editService:', err);
    showNotification('Error al abrir el editor del hito: ' + err.message, 'error');
  }
}

function editServiceByData(btn) {
  try {
    const data = btn.dataset.service || btn.getAttribute('data-service');
    if (!data) {
        // Intentar obtener ID del botón o del padre
        const id = btn.id || btn.closest('[data-service-id]')?.dataset.serviceId;
        if (id) return editServiceById(id);
    }
    const service = JSON.parse(decodeURIComponent(data));
    editService(service);
  } catch (e) {
    console.error('Error parsing service data:', e);
  }
}

/**
 * Constantes y Utilidades para Modal de Ítems
 */
const ALLERGENS_LIST = [
    { id: 'gluten', icon: '🌾', name: 'Gluten' },
    { id: 'crustaceans', icon: '🦞', name: 'Crustáceos' },
    { id: 'eggs', icon: '🥚', name: 'Huevos' },
    { id: 'fish', icon: '🐟', name: 'Pescado' },
    { id: 'peanuts', icon: '🥜', name: 'Cacahuetes' },
    { id: 'soy', icon: '🫘', name: 'Soja' },
    { id: 'milk', icon: '🥛', name: 'Lácteos' },
    { id: 'nuts', icon: '🌰', name: 'Frutos de cáscara' },
    { id: 'celery', icon: '🌿', name: 'Apio' },
    { id: 'mustard', icon: '🍯', name: 'Mostaza' },
    { id: 'sesame', icon: '🥯', name: 'Sésamo' },
    { id: 'sulphites', icon: '🍷', name: 'Sulfitos' },
    { id: 'lupins', icon: '🌸', name: 'Altramuces' },
    { id: 'molluscs', icon: '🐚', name: 'Moluscos' }
];

function renderAllergensGrid(selectedAllergens = '') {
    const grid = document.getElementById('item-allergens-grid');
    if (!grid) return;
    
    const selected = (selectedAllergens || '').split(',').map(s => s.trim().toLowerCase());
    
    grid.innerHTML = ALLERGENS_LIST.map(alg => {
        const isActive = selected.includes(alg.id);
        return `
            <button type="button" 
                    onclick="toggleAllergen('${alg.id}')"
                    id="alg-${alg.id}"
                    class="flex flex-col items-center p-2 rounded-lg border transition-all ${isActive ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}"
                    title="${alg.name}">
                <span class="text-xl mb-1">${alg.icon}</span>
                <span class="text-[10px] font-medium uppercase tracking-tight">${alg.name.substring(0, 6)}</span>
            </button>
        `;
    }).join('');
}

function toggleAllergen(id) {
    const btn = document.getElementById(`alg-${id}`);
    if (!btn) return;
    
    const isActive = btn.classList.contains('bg-indigo-50');
    if (isActive) {
        btn.classList.remove('bg-indigo-50', 'border-indigo-500', 'text-indigo-700');
        btn.classList.add('bg-white', 'border-slate-200', 'text-slate-500');
    } else {
        btn.classList.add('bg-indigo-50', 'border-indigo-500', 'text-indigo-700');
        btn.classList.remove('bg-white', 'border-slate-200', 'text-slate-500');
    }
}

/**
 * Gestión de Modal de Ítems (Platos / Productos)
 */
function editItem(item) {
    console.log('[Editor] Editing Item:', item);
    document.getElementById('modal-item-id').value = item.id;
    document.getElementById('modal-item-name').value = item.name || item.dish_name || '';
    document.getElementById('modal-item-description').value = item.description || '';
    document.getElementById('modal-item-price').value = item.price_unit || item.price_pax || 0;
    document.getElementById('modal-item-vat').value = item.vat_rate || item.item_vat_rate || '';
    
    // Renderizado de Alérgenos
    renderAllergensGrid(item.allergens || '');
    
    document.getElementById('itemModal').classList.remove('hidden');
}

function closeItemModal() {
    document.getElementById('itemModal').classList.add('hidden');
}

async function saveItemChanges() {
    const id = document.getElementById('modal-item-id').value;
    
    // Recoger alérgenos seleccionados
    const selectedAllergens = ALLERGENS_LIST
        .filter(alg => document.getElementById(`alg-${alg.id}`).classList.contains('bg-indigo-50'))
        .map(alg => alg.id)
        .join(', ');

    const payload = {
        name: document.getElementById('modal-item-name').value.trim(),
        description: document.getElementById('modal-item-description').value.trim(),
        price_unit: parseFloat(document.getElementById('modal-item-price').value) || 0,
        vat_rate: document.getElementById('modal-item-vat').value ? parseFloat(document.getElementById('modal-item-vat').value) : null,
        allergens: selectedAllergens
    };

    try {
        const pid = getPid();
        const response = await fetch(`/api/proposals/${pid}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error al guardar cambios del plato');
        
        showNotification('Plato actualizado localmente', 'success');
        closeItemModal();
        await refreshServiceData(); // Refrescar vista del modal de servicios
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
}

/**
 * Gestión de Opciones (Menús Alternativos / Versiones)
 */
async function editOption(optionId) {
    const serviceId = document.getElementById('modal-service-id').value;
    const service = window.servicesMap ? window.servicesMap[serviceId] : null;
    if (!service || !service.options) return;

    const opt = service.options.find(o => o.id === optionId);
    if (!opt) return;

    document.getElementById('modal-option-id').value = opt.id;
    document.getElementById('modal-option-name').value = opt.name;
    document.getElementById('modal-option-price').value = opt.price_pax;
    
    document.getElementById('optionModal').classList.remove('hidden');
}

function closeOptionModal() {
    document.getElementById('optionModal').classList.add('hidden');
}

async function saveOptionChanges() {
    const id = document.getElementById('modal-option-id').value;
    const payload = {
        name: document.getElementById('modal-option-name').value.trim(),
        price_pax: parseFloat(document.getElementById('modal-option-price').value) || 0
    };

    try {
        const pid = getPid();
        const response = await fetch(`/api/proposals/${pid}/options/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Error al actualizar opción');
        
        showNotification('Opción actualizada', 'success');
        closeOptionModal();
        await refreshServiceData();
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
}

async function promptAddOption(serviceId) {
    const name = prompt('Nombre de la opción (ej: Menú Ejecutivo):');
    if (!name) return;
    
    const price = prompt('Precio por persona:', '0.00');
    if (price === null) return;

    try {
        const pid = getPid();
        const response = await fetch(`/api/proposals/${pid}/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: serviceId,
                name: name,
                price_pax: parseFloat(price) || 0
            })
        });
        
        if (!response.ok) throw new Error('Error al añadir opción');
        
        showNotification('Opción añadida', 'success');
        await refreshServiceData();
    } catch (err) {
        showNotification('Error: ' + err.message, 'error');
    }
}

async function deleteOption(optionId) {
  if (!confirm('¿Seguro que deseas eliminar esta opción y todos sus platos?')) return;
  
  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/options/${optionId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar opción');
    
    showNotification('Opción eliminada', 'success');
    await refreshServiceData();
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

async function duplicateOption(optionId) {
  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/options/${optionId}/duplicate`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Error al duplicar menú');
    
    showNotification('Menú duplicado correctamente', 'success');
    await refreshServiceData();
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}

async function removeItem(itemId) {
  if (!confirm('¿Eliminar este plato de la opción?')) return;
  
  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/items/${itemId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('Error al eliminar plato');
    
    showNotification('Plato eliminado', 'success');
    await refreshServiceData();
  } catch (err) {
    showNotification('Error: ' + err.message, 'error');
  }
}


// Cálculo automático en Modal
document.getElementById('modal-service-start')?.addEventListener('input', () => syncModalTimes('start'));
document.getElementById('modal-service-duration')?.addEventListener('input', () => syncModalTimes('duration'));
document.getElementById('modal-service-end')?.addEventListener('input', () => syncModalTimes('end'));

function syncModalTimes(source) {
  const start = document.getElementById('modal-service-start');
  const duration = document.getElementById('modal-service-duration');
  const end = document.getElementById('modal-service-end');
  
  if (source === 'start' || source === 'duration') {
    if (start.value && parseInt(duration.value) > 0) {
      const [h, m] = start.value.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m + parseInt(duration.value), 0);
      end.value = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  } else if (source === 'end' && start.value && end.value) {
    const [h1, m1] = start.value.split(':').map(Number);
    const [h2, m2] = end.value.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 1440;
    duration.value = diff;
  }
}

// Inicializar fechas
document.addEventListener('DOMContentLoaded', () => {
  calculateDurationDays();
  document.getElementById('event-date')?.addEventListener('change', calculateDurationDays);
  document.getElementById('event-end-date')?.addEventListener('change', calculateDurationDays);
});

// ═══════════════════════════════════════════════════════════════
// VENUES (Searchable & Dynamic)
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// VENUES (Searchable & Dynamic)
// ═══════════════════════════════════════════════════════════════

const venueSearchInput = document.getElementById('venue-search-input');
const venueResults = document.getElementById('venue-results');
const venueSelectedId = document.getElementById('venue-selected-id');
const btnAddVenue = document.getElementById('btn-add-venue');

if (venueSearchInput) {
  // Manejar búsqueda en tiempo real
  venueSearchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      venueResults.classList.add('hidden');
      return;
    }

    let count = 0;
    const MAX_RESULTS = 10;
    const options = document.querySelectorAll('.venue-option');
    options.forEach(opt => {
      const name = opt.dataset.name.toLowerCase();
      if (name.includes(term) && count < MAX_RESULTS) {
        opt.classList.remove('hidden');
        count++;
      } else {
        opt.classList.add('hidden');
      }
    });

    if (count > 0) {
      venueResults.classList.remove('hidden');
    } else {
      venueResults.classList.add('hidden');
    }

    // Resetear selección si cambió el texto
    venueSelectedId.value = '';
    btnAddVenue.disabled = true;
  });

  // ENTER: Seleccionar el primero automáticamente
  venueSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstVisible = venueResults.querySelector('.venue-option:not(.hidden)');
      if (firstVisible) {
          firstVisible.click();
          btnAddVenue.click();
      }
    }
  });

  // Seleccionar una opción del dropdown
  document.addEventListener('click', (e) => {
    const opt = e.target.closest('.venue-option');
    if (opt) {
      venueSearchInput.value = opt.dataset.name;
      venueSelectedId.value = opt.dataset.id;
      venueResults.classList.add('hidden');
      btnAddVenue.disabled = false;
      return;
    }

    // Seleccionar desde el catálogo (Botones rápidos)
    const btnCatalog = e.target.closest('.btn-catalog-add');
    if (btnCatalog) {
      const vid = btnCatalog.dataset.id;
      const vname = btnCatalog.dataset.name;
      addVenueToProposal(vid, vname);
      return;
    }

    // Cerrar si click afuera
    if (!venueSearchInput?.contains(e.target) && !venueResults?.contains(e.target)) {
      venueResults?.classList.add('hidden');
    }
  });

  // Mostrar todos al hacer focus si está vacío
  venueSearchInput.addEventListener('focus', (e) => {
    if (e.target.value === '') {
      const options = document.querySelectorAll('.venue-option');
      options.forEach(o => o.classList.remove('hidden'));
      venueResults.classList.remove('hidden');
    }
  });
}

// Seleccionar venue como principal
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-select-venue');
  if (!btn) return;

  const venueId = btn.dataset.venueId;

  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/venues/${venueId}/select`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Error al seleccionar venue');

    const data = await response.json();
    if (data.success) {
      if (data.deselected) {
        showNotification('✓ Selección de venue eliminada', 'success');
        btn.classList.remove('text-[#31713D]');
        btn.classList.add('text-gray-300');
        btn.title = 'Marcar como principal';
      } else {
        showNotification('✓ Venue seleccionado como principal', 'success');
        
        // Actualizar UI: quitar clase a todos y ponerla al actual
        document.querySelectorAll('.btn-select-venue').forEach(b => {
          b.classList.remove('text-[#31713D]');
          b.classList.add('text-gray-300');
          b.title = 'Marcar como principal';
        });
        
        btn.classList.remove('text-gray-300');
        btn.classList.add('text-[#31713D]');
        btn.title = 'Venue seleccionado';
      }
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

/**
 * 🚀 SCRAPING DESDE EL EDITOR
 */
const btnScrapeVenue = document.getElementById('btn-scrape-venue');
const scrapeUrlInput = document.getElementById('venue-scrape-url');

btnScrapeVenue?.addEventListener('click', async () => {
  const url = scrapeUrlInput.value.trim();
  if (!url) {
    showNotification('Por favor, pega una URL válida', 'warning');
    return;
  }

  try {
    btnScrapeVenue.disabled = true;
    btnScrapeVenue.innerHTML = '<i class="animate-spin mr-2">⏳</i> Scrapeando...';
    
    showNotification('Iniciando scraping... puede tardar unos segundos', 'info');

    const response = await fetch('/api/admin/venues/scrape-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    const data = await response.json();
    
    if (data.success) {
      showNotification(`✓ Venue "${data.venue.name}" importado y agregado`, 'success');
      // 1. Añadir a la propuesta directamente
      addVenueToProposal(data.venueId, data.venue.name);
      // 2. Limpiar input
      scrapeUrlInput.value = '';
    } else {
      throw new Error(data.error || 'Error en scraping');
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  } finally {
    btnScrapeVenue.disabled = false;
    btnScrapeVenue.innerHTML = '<i data-lucide="zap" class="w-4 h-4 mr-2"></i> Importar';
    if (window.lucide) window.lucide.createIcons();
  }
});

/**
 * Lógica común para añadir venue
 */
async function addVenueToProposal(venueId, venueName) {
  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/venues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ venue_id: venueId })
    });

    if (!response.ok) throw new Error('Error al agregar venue');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Venue agregado correctamente', 'success');
      addVenueRow(data.venue_id, venueName);
    } else {
      throw new Error(data.message || 'Error desconocido');
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
}

btnAddVenue?.addEventListener('click', async () => {
  const venueId = venueSelectedId.value;
  const venueName = venueSearchInput.value;
  if (!venueId) {
    showNotification('Selecciona un venue de la lista', 'warning');
    return;
  }
  
  await addVenueToProposal(venueId, venueName);
  
  // Limpiar buscador
  venueSearchInput.value = '';
  venueSelectedId.value = '';
  btnAddVenue.disabled = true;
});

function addVenueRow(id, name) {
  const tbody = document.querySelector('.venues-table tbody');
  const emptyRow = tbody.querySelector('tr td.italic')?.closest('tr');
  if (emptyRow) emptyRow.remove();

  const tr = document.createElement('tr');
  tr.className = 'venue-row hover:bg-gray-50/50 transition-colors border-b border-gray-50';
  tr.innerHTML = `
    <td class="py-4 px-4 font-medium text-gray-900">${name}</td>
    <td class="py-4 px-4 text-right">
      <button 
        type="button" 
        class="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex items-center gap-2 btn-remove-venue" 
        data-venue-id="${id}"
      >
        <i data-lucide="trash-2" class="w-4 h-4"></i>
        <span>Eliminar</span>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  if (window.lucide) window.lucide.createIcons();
}

// Eliminar venue
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-remove-venue');
  if (!btn) return;

  if (!confirm('¿Eliminar este venue de la propuesta?')) return;

  const venueId = btn.dataset.venueId;

  try {
    const pid = getPid();
    const response = await fetch(`/api/proposals/${pid}/venues/${venueId}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Error al eliminar');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Venue eliminado', 'success');
      btn.closest('.venue-row')?.remove();
      
      // Verificar si quedó vacía
      const tbody = document.querySelector('.venues-table tbody');
      if (tbody.children.length === 0) {
        tbody.innerHTML = '<tr><td class="py-12 px-4 text-center text-gray-400 italic" colspan="2">No se han añadido venues a esta propuesta</td></tr>';
      }
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ═══════════════════════════════════════════════════════════════
// CÁLCULO DE TOTALES (Motor Financiero)
// ═══════════════════════════════════════════════════════════════

async function calculateTotals() {
  const pid = getPid();
  if (!pid) return;

  try {
    const response = await fetch(`/api/proposals/${pid}/calculate`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Error en cálculo');

    const data = await response.json();
    if (data.success && data.totals && data.formatted) {
      // 1. ACTUALIZAR IMPORTES REALES / APROBADOS
      const totalFinal = document.querySelector('[data-total-final]');
      if (totalFinal && data.formatted.total_final) {
        totalFinal.textContent = data.formatted.total_final;
      }
      
      const subtotalBase = document.querySelector('[data-subtotal-base]');
      if (subtotalBase && data.formatted.total_base) {
        subtotalBase.textContent = data.formatted.total_base;
      }

      const totalVat = document.querySelector('[data-total-vat]');
      if (totalVat && data.formatted.total_vat) {
        totalVat.textContent = data.formatted.total_vat;
      }

      const totalDiscount = document.querySelectorAll('[data-total-discount], [data-modal-total-discount]');
      totalDiscount.forEach(el => {
        if (data.formatted.total_discount) {
          el.textContent = '-' + data.formatted.total_discount;
        }
      });

      // 2. ACTUALIZAR MÁXIMO POTENCIAL (PROYECCIÓN)
      const maxBase = document.querySelector('[data-max-base]');
      if (maxBase && data.formatted.total_max_base) {
        maxBase.textContent = data.formatted.total_max_base;
      }

      const maxDiscount = document.querySelector('[data-max-discount]');
      if (maxDiscount && data.formatted.total_max_discount) {
        maxDiscount.textContent = '-' + data.formatted.total_max_discount;
      }

      const maxVat = document.querySelector('[data-max-vat]');
      if (maxVat && data.formatted.total_max_vat) {
        maxVat.textContent = data.formatted.total_max_vat;
      }

      const maxPotential = document.querySelector('[data-max-potential], [data-max-final]');
      if (maxPotential && data.formatted.total_max_potential) {
        maxPotential.textContent = data.formatted.total_max_potential;
      }

      // 3. ACTUALIZAR MODAL DE MÁXIMO POTENCIAL
      const maxPotentialTableBody = document.getElementById('max-potential-table-body');
      const dataModalMaxPotential = document.querySelector('[data-modal-max-potential]');
      if (dataModalMaxPotential && data.formatted.total_max_potential) {
        dataModalMaxPotential.textContent = data.formatted.total_max_potential;
      }

      if (maxPotentialTableBody && data.totals.max_breakdown) {
        let html = '';
        data.totals.max_breakdown.forEach(item => {
          html += `
            <tr class="border-b border-amber-50">
              <td class="py-3 pr-4">
                <p class="font-black text-gray-900 uppercase tracking-tighter">${item.name}</p>
              </td>
              <td class="py-3 text-right font-bold text-gray-600">
                ${formatCurrency(item.price_pax)}
              </td>
              <td class="py-3 text-right text-gray-500">
                x ${item.pax}
              </td>
              <td class="py-3 text-right font-black text-gray-900">
                ${formatCurrency(item.subtotal)}
              </td>
            </tr>
          `;
        });
        maxPotentialTableBody.innerHTML = html;
      }
    }
  } catch (err) {
    console.error('Calculate totals error:', err);
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

// Delegación de eventos para cambios en inputs (incluyendo dinámicos)
document.addEventListener('input', (e) => {
  if (e.target.matches('input, textarea, select') && !e.target.closest('#chat-sidebar')) {
    hasChanges = true;
    updateSaveButton();

    // Si cambian las fechas, refrescar duración
    if (e.target.name === 'event_date' || e.target.name === 'event_end_date') {
      calculateDurationDays();
    }
  }
});

function updateSaveButton() {
  const btn = document.getElementById('btn-save-proposal');
  const dot = document.getElementById('save-status-dot');
  if (btn) {
    if (hasChanges) {
      btn.classList.add('bg-amber-600', 'shadow-amber-200');
      btn.classList.remove('bg-[#31713D]');
      if (dot) dot.classList.remove('opacity-0');
    } else {
      btn.classList.remove('bg-amber-600', 'shadow-amber-200');
      btn.classList.add('bg-[#31713D]');
      if (dot) dot.classList.add('opacity-0');
    }
  }
}

document.getElementById('btn-save-proposal')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const pid = getPid();
  console.log('[Editor] Saving proposal...', pid);
  
  if (!pid) {
    showNotification('Error: ID de propuesta no encontrado', 'error');
    return;
  }

  // Recolectar datos de forma robusta
  const getVal = (name) => document.querySelector(`[name="${name}"]`)?.value;
  const getCheck = (name) => document.querySelector(`[name="${name}"]`)?.checked ? 1 : 0;

  const formData = {
    client_name: getVal('client_name'),
    client_email: getVal('client_email'),
    custom_ref: getVal('custom_ref'),
    event_date: getVal('event_date') || null,
    event_end_date: getVal('event_end_date') || null,
    pax: parseInt(getVal('pax')) || 0,
    valid_until: getVal('valid_until') || null,
    legal_conditions: getVal('legal_conditions'),
    show_legal_conditions: getCheck('show_legal_conditions'),
    general_conditions: getVal('general_conditions'),
    show_general_conditions: getCheck('show_general_conditions'),
    status: getVal('status'),
    logo_url: getVal('logo_url'),
    brand_color: getVal('brand_color')
  };

  console.log('[Editor] Sending update:', formData);

  const btn = document.getElementById('btn-save-proposal');
  const dot = document.getElementById('save-status-dot');
  const originalHTML = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="animate-spin" data-lucide="loader-2"></i>';
    if (window.lucide) lucide.createIcons();

    const response = await fetch(`/proposal/${pid}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    console.log('[Editor] Save response:', data);

    if (!response.ok) throw new Error(data.message || 'Error al guardar');

    if (data.success) {
      showNotification('✓ Cambios guardados correctamente', 'success');
      hasChanges = false;
      updateSaveButton();
      await calculateTotals();
    } else {
      throw new Error(data.message || 'Error desconocido');
    }
  } catch (err) {
    console.error('[Editor] Save error:', err);
    showNotification('✗ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="save" class="w-6 h-6 group-hover:scale-110 transition-transform"></i><div id="save-status-dot" class="w-2.5 h-2.5 bg-amber-400 border border-white rounded-full absolute top-3 right-3 opacity-0 transition-opacity"></div>';
    if (window.lucide) lucide.createIcons();
    updateSaveButton();
  }
});

// ═══════════════════════════════════════════════════════════════
// PUBLICAR PROPUESTA
// ═══════════════════════════════════════════════════════════════

document.getElementById('btn-publish')?.addEventListener('click', async () => {
  if (!confirm('¿Enviar propuesta al cliente?')) return;

  try {
    const pid = getPid();
    const response = await fetch(`/proposal/${pid}/publish`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Error al enviar');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Propuesta enviada', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// Alternativa: Buscar todos los botones con la clase/id de publish
document.querySelectorAll('[class*="btn-primary"]:not([type="submit"])').forEach(btn => {
  if (btn.textContent.includes('Enviar') || btn.textContent.includes('📤')) {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      if (!confirm('¿Enviar propuesta al cliente?')) return;

      try {
        const pid = getPid();
        const response = await fetch(`/proposal/${pid}/publish`, {
          method: 'POST'
        });

        if (!response.ok) throw new Error('Error al enviar');

        showNotification('✓ Propuesta enviada', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } catch (err) {
        showNotification('✗ Error: ' + err.message, 'error');
      }
    });
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
    notification.style.backgroundColor = '#31713D';
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

// ═══════════════════════════════════════════════════════════════
// PERSONALIZACIÓN VISUAL (LOGO & COLOR)
// ═══════════════════════════════════════════════════════════════

document.getElementById('logo-upload')?.addEventListener('change', async function(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showNotification('Por favor, selecciona una imagen válida', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('logo', file);

  try {
    showNotification('Procesando logo...', 'info');
    
    const response = await fetch('/api/proposal/upload-logo', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Error al subir logo');

    const result = await response.json();
    if (result.success) {
      // 1. Actualizar el input hidden
      document.querySelector('[name="logo_url"]').value = result.logoUrl;
      
      // 2. Actualizar el preview en la UI
      const previewImg = document.getElementById('editor-logo-preview');
      const previewIcon = document.getElementById('editor-logo-icon');
      
      if (previewImg) {
        previewImg.src = result.logoUrl;
      } else if (previewIcon) {
        // Si no existía imagen, crearla
        const parent = previewIcon.parentElement;
        previewIcon.remove();
        const newImg = document.createElement('img');
        newImg.id = 'editor-logo-preview';
        newImg.src = result.logoUrl;
        newImg.className = 'max-w-full max-h-full object-contain';
        parent.insertBefore(newImg, parent.firstChild);
      }

      // 3. Actualizar color si se extrajo
      if (result.brandColor) {
        const colorInput = document.getElementById('editor-brand-color');
        const hexVal = document.getElementById('color-hex-val');
        if (colorInput) colorInput.value = result.brandColor;
        if (hexVal) hexVal.value = result.brandColor;
      }

      hasChanges = true;
      updateSaveButton();
      showNotification('Logo actualizado y color extraído', 'success');
    }
  } catch (err) {
    console.error('[Editor] Logo upload error:', err);
    showNotification('Error al procesar logo', 'error');
  }
});

// Sincronizar input color con el texto hex
document.getElementById('editor-brand-color')?.addEventListener('input', function(e) {
  const hexVal = document.getElementById('color-hex-val');
  if (hexVal) hexVal.value = e.target.value;
  hasChanges = true;
  updateSaveButton();
});

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

// ════════════════════════════════════════════════════════════════
// VISUALIZACIÓN DE VENUE (MODAL & ZOOM)
// ════════════════════════════════════════════════════════════════

let currentVenueImages = [];
let currentImageIndex = 0;
let zoomIndex = 0;

window.openVenueModal = function(venueData) {
  try {
    const venue = typeof venueData === 'string' ? JSON.parse(venueData) : venueData;
    
    document.getElementById('modal-venue-title').textContent = venue.name;
    document.getElementById('modal-venue-description').textContent = venue.description || 'Sin descripción disponible.';
    
    // Dirección
    const addressElement = document.getElementById('modal-venue-address');
    const addressContainer = document.getElementById('modal-venue-address-container');
    if (venue.address) {
      addressElement.textContent = venue.address;
      addressContainer.classList.remove('hidden');
    } else {
      addressContainer.classList.add('hidden');
    }

    // Link Externo
    const linkContainer = document.getElementById('modal-venue-link-container');
    const linkElement = document.getElementById('modal-venue-link');
    if (venue.external_url) {
      linkElement.href = venue.external_url;
      linkContainer.classList.remove('hidden');
    } else {
      linkContainer.classList.add('hidden');
    }

    // Carousel de imágenes
    currentVenueImages = [];
    if (venue.images) {
      try {
        currentVenueImages = typeof venue.images === 'string' ? JSON.parse(venue.images) : venue.images;
        if (!Array.isArray(currentVenueImages)) currentVenueImages = [];
      } catch (e) { currentVenueImages = []; }
    }
    
    currentImageIndex = 0;
    renderVenueCarousel();

    // Mapa
    const mapIframe = document.getElementById('modal-venue-map');
    if (venue.map_iframe) {
      let src = venue.map_iframe;
      if (src.includes('<iframe')) {
        const match = src.match(/src="([^"]+)"/);
        if (match) src = match[1];
      }
      if (src.startsWith('//')) src = 'https:' + src;
      mapIframe.src = src;
      mapIframe.parentElement.classList.remove('hidden');
    } else {
      mapIframe.parentElement.classList.add('hidden');
    }

    document.getElementById('modal-venue-details').classList.remove('hidden');
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('Error opening venue modal:', err);
  }
};

window.closeVenueModal = function() {
  document.getElementById('modal-venue-details').classList.add('hidden');
  document.getElementById('modal-venue-map').src = '';
};

function renderVenueCarousel() {
  const container = document.getElementById('modal-venue-carousel');
  const currentSpan = document.getElementById('carousel-current');
  const totalSpan = document.getElementById('carousel-total');

  if (!currentVenueImages || currentVenueImages.length === 0) {
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500"><i data-lucide="image-off" class="w-12 h-12"></i></div>`;
    currentSpan.textContent = '0';
    totalSpan.textContent = '0';
    return;
  }

  container.innerHTML = currentVenueImages.map((img, idx) => `
    <div class="w-full h-full shrink-0 cursor-zoom-in" onclick="zoomVenueImage(${idx})">
      <img src="${img.replace(/[\n\r]/g, '').trim()}" class="w-full h-full object-cover text-white">
    </div>
  `).join('');

  totalSpan.textContent = currentVenueImages.length;
  currentSpan.textContent = currentImageIndex + 1;
  updateVenueCarouselPosition();
}

function updateVenueCarouselPosition() {
  const container = document.getElementById('modal-venue-carousel');
  if (!container || !currentVenueImages.length) return;
  const percentage = currentImageIndex * 100;
  container.style.transform = `translateX(-${percentage}%)`;
}

window.prevVenueImage = function() {
  if (currentVenueImages.length <= 1) return;
  currentImageIndex = (currentImageIndex - 1 + currentVenueImages.length) % currentVenueImages.length;
  const currentSpan = document.getElementById('carousel-current');
  currentSpan.textContent = currentImageIndex + 1;
  updateVenueCarouselPosition();
};

window.nextVenueImage = function() {
  if (currentVenueImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentVenueImages.length;
  const currentSpan = document.getElementById('carousel-current');
  currentSpan.textContent = currentImageIndex + 1;
  updateVenueCarouselPosition();
};

window.zoomVenueImage = function(index) {
  zoomIndex = index;
  const zoomModal = document.getElementById('modal-venue-zoom');
  const zoomCarousel = document.getElementById('zoom-carousel');
  const zoomTotal = document.getElementById('zoom-total');
  
  if (!currentVenueImages || currentVenueImages.length === 0) return;

  zoomCarousel.innerHTML = currentVenueImages.map(img => `
    <div class="w-full h-full shrink-0 flex items-center justify-center p-4">
      <img src="${img.replace(/[\n\r]/g, '').trim()}" class="max-w-full max-h-full object-contain shadow-2xl">
    </div>
  `).join('');

  zoomTotal.textContent = currentVenueImages.length;
  updateZoomCarousel();
  zoomModal.classList.remove('hidden');
  if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.closeVenueZoom = function() {
  document.getElementById('modal-venue-zoom').classList.add('hidden');
};

window.changeZoomImage = function(step) {
  if (currentVenueImages.length <= 1) return;
  zoomIndex = (zoomIndex + step + currentVenueImages.length) % currentVenueImages.length;
  updateZoomCarousel();
};

function updateZoomCarousel() {
  const zoomCarousel = document.getElementById('zoom-carousel');
  const zoomCurrent = document.getElementById('zoom-current');
  if (!zoomCarousel || !currentVenueImages.length) return;
  const percentage = zoomIndex * 100;
  zoomCarousel.style.transform = `translateX(-${percentage}%)`;
  zoomCurrent.textContent = zoomIndex + 1;
}

// Click fuera para cerrar
document.addEventListener('click', (e) => {
  if (e.target.id === 'modal-venue-zoom') closeVenueZoom();
  if (e.target.id === 'modal-venue-details') closeVenueModal();
});

// Tecla ESC para cerrar modales
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeVenueZoom();
    closeVenueModal();
  }
  if (!document.getElementById('modal-venue-zoom').classList.contains('hidden')) {
    if (e.key === 'ArrowLeft') changeZoomImage(-1);
    if (e.key === 'ArrowRight') changeZoomImage(1);
  }
});

/**
 * Listener global para el checkbox de Multichoice
 */
document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'modal-service-multichoice') {
    if (e.target.checked) {
      const serviceId = document.getElementById('modal-service-id').value;
      if (!serviceId) {
        const title = document.getElementById('modal-service-title').value.trim();
        if (title) {
          saveService(false); // Guardar sin recargar para habilitar opciones
        } else {
          showNotification('Ponle un nombre al hito para añadir opciones', 'info');
          e.target.checked = false;
        }
      } else {
        document.getElementById('modal-options-container').classList.remove('hidden');
      }
    }
  }
});


/**
 * Inicialización de SortableJS para reordenar ítems
 */
document.addEventListener('DOMContentLoaded', () => {
    const sortableContainers = document.querySelectorAll('.items-sortable');
    
    sortableContainers.forEach(container => {
        new Sortable(container, {
            animation: 150,
            ghostClass: 'bg-green-50',
            handle: '.cursor-move',
            onEnd: async (evt) => {
                const optionId = container.dataset.optionId;
                const items = Array.from(container.querySelectorAll('[data-item-id]')).map((el, index) => ({
                    id: parseInt(el.dataset.itemId),
                    order_index: index
                }));

                const pid = getPid();
                try {
                    const response = await fetch(`/api/proposals/${pid}/items/reorder`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ items })
                    });

                    if (!response.ok) throw new Error('Error al guardar el nuevo orden');
                    showNotification('Orden actualizado', 'success');
                } catch (err) {
                    showNotification('Error: ' + err.message, 'error');
                }
            }
        });
    });

    // Cambiar color del icono de comentarios según contenido
    const commentsTextarea = document.querySelector('textarea[name="legal_conditions"]');
    const commentsIcon = document.getElementById('icon-comentarios');
    if (commentsTextarea && commentsIcon) {
        commentsTextarea.addEventListener('input', () => {
            if (commentsTextarea.value.trim().length > 0) {
                commentsIcon.classList.remove('text-gray-400');
                commentsIcon.classList.add('text-[#31713D]');
            } else {
                commentsIcon.classList.remove('text-[#31713D]');
                commentsIcon.classList.add('text-gray-400');
            }
        });
    }
});

/**
 * GESTIÓN DE MULTIMEDIA DE OPCIONES (Gastronomía Refactor)
 */
let currentEditingOptionId = null;

window.openOptionMediaModal = async function(optionId) {
    if (!optionId) return;
    currentEditingOptionId = optionId;
    const modal = document.getElementById('optionMediaModal');
    if (!modal) {
        console.error('[Editor] optionMediaModal not found in DOM');
        return;
    }

    try {
        console.log('[Editor] Opening media for option:', optionId);
        const response = await fetch(`/api/options/${optionId}`);
        if (!response.ok) throw new Error("No se pudo cargar la información de la opción");
        const option = await response.json();

        const titleEl = document.getElementById('modal-media-title');
        const descEl = document.getElementById('modal-media-description');
        const badgesEl = document.getElementById('modal-media-badges');
        const videoEl = document.getElementById('modal-media-video-url');

        if (titleEl) titleEl.innerText = `Multimedia: ${option.name || 'Menú'}`;
        if (descEl) descEl.value = option.description || '';
        if (videoEl) videoEl.value = option.video_url || '';
        
        // Robustez para badges
        let badgesList = [];
        if (Array.isArray(option.badges)) badgesList = option.badges;
        else if (typeof option.badges === 'string') try { badgesList = JSON.parse(option.badges); } catch(e) {}
        
        if (badgesEl) badgesEl.value = Array.isArray(badgesList) ? badgesList.join(', ') : '';
        
        // Renderizar imagenes actuales
        const container = document.getElementById('modal-media-images-container');
        if (container) {
            container.innerHTML = '';
            
            let images = [];
            if (Array.isArray(option.images)) images = option.images;
            else if (typeof option.images === 'string') try { images = JSON.parse(option.images); } catch(e) {}
            
            (images || []).forEach((img) => {
                if (!img) return;
                const div = document.createElement('div');
                div.className = 'relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200';
                div.innerHTML = `
                    <img src="${img}" class="w-full h-full object-cover">
                    <button type="button" onclick="removeOptionImage(this)" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                `;
                container.appendChild(div);
            });
        }

        modal.classList.remove('hidden');
        if(typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error("[Editor] Error loading option media:", e);
        if (typeof showNotification === 'function') showNotification('Error al cargar multimedia: ' + e.message, 'error');
    }
};

window.closeOptionMediaModal = function() {
    document.getElementById('optionMediaModal').classList.add('hidden');
};

window.addOptionImageUrl = function() {
    const urlInput = document.getElementById('modal-media-new-image');
    const url = urlInput.value.trim();
    if (!url) return;

    const container = document.getElementById('modal-media-images-container');
    const div = document.createElement('div');
    div.className = 'relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200';
    div.innerHTML = `
        <img src="${url}" class="w-full h-full object-cover">
        <button type="button" onclick="removeOptionImage(this)" class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg">
            <i data-lucide="x" class="w-3 h-3"></i>
        </button>
    `;
    container.appendChild(div);
    urlInput.value = '';
    if(typeof lucide !== 'undefined') lucide.createIcons();
};

window.removeOptionImage = function(btn) {
    btn.closest('div').remove();
};

window.saveOptionMedia = async function() {
    if (!currentEditingOptionId) return;

    const description = document.getElementById('modal-media-description').value;
    const badgesRaw = document.getElementById('modal-media-badges').value;
  const videoUrl = (document.getElementById('modal-media-video-url')?.value || '').trim();
    const badges = badgesRaw.split(',').map(b => b.trim()).filter(b => b);
    
    const imageElements = document.querySelectorAll('#modal-media-images-container img');
    const images = Array.from(imageElements).map(img => img.src);

    try {
        const response = await fetch(`/api/options/${currentEditingOptionId}/media`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description, badges, images, video_url: videoUrl || null })
        });

        if (response.ok) {
            if (typeof showNotification === 'function') showNotification('Multimedia guardada correctamente', 'success');
            closeOptionMediaModal();
            // Refrescar hito actual
            if (typeof refreshServiceData === 'function') refreshServiceData();
        } else {
            throw new Error("Failed to save");
        }
    } catch (e) {
        console.error("Error saving media:", e);
        if (typeof showNotification === 'function') showNotification('Error al guardar multimedia', 'error');
    }
};
