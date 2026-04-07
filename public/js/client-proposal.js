/**
 * Client Proposal JavaScript
 * Propósito: Interactividad para vistas de cliente (propuesta + chat)
 */

const proposalHash = window.location.pathname.split('/')[2];
let messages = [];
let pollingInterval;

// CONFIGURACIÓN DE IDIOMA PARA DAYJS
if (typeof dayjs !== 'undefined') {
  dayjs.locale('es');
}

// ════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ════════════════════════════════════════════════════════════════

window.toggleBudgetBreakdown = function() {
  const details = document.getElementById('budget-breakdown-details');
  const chevron = document.getElementById('breakdown-chevron');
  if (!details) return;

  const isHidden = details.classList.contains('hidden');
  
  if (isHidden) {
    details.classList.remove('hidden');
    details.classList.add('animate-fadeIn');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    details.classList.add('hidden');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
};

function showNotification(message, type = 'info') {
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

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Apply proposal data returned from server to update UI without full reload
 */
function applyProposalData(data) {
  if (!data) return;
  currentProposalData = data;
  try {
    updateProgressUI(data);
    updateSidebarUI(data);
    updateFinalSummaryUI(data);
    updateFloatingBarUI(data);
    updateBudgetCardUI(data);
    updateBodySelections && updateBodySelections(data);
    if (typeof lucide !== 'undefined') lucide.createIcons();
  } catch (err) {
    console.error('applyProposalData error:', err);
  }
}

async function syncProposalRealtimeState() {
  try {
    await window.refreshProposalState();
  } catch (err) {
    console.error('syncProposalRealtimeState error:', err);
  }
}

// ════════════════════════════════════════════════════════════════
// ACEPTAR PROPUESTA
// ════════════════════════════════════════════════════════════════

document.getElementById('btn-accept')?.addEventListener('click', () => {
  window.showAppConfirm({
    title: '¿Aceptar Propuesta?',
    message: 'Al confirmar, la propuesta se dará por aceptada y el equipo comercial procederá con la reserva definitiva.',
    confirmText: 'SÍ, ACEPTAR PROPUESTA',
    onConfirm: executeProposalAcceptance
  });
});

async function executeProposalAcceptance() {
  try {
    const response = await fetch(`/p/${proposalHash}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al aceptar');
    }

    if (data.success) {
      showNotification('✅ ¡Propuesta aceptada! El comercial se contactará pronto.', 'success');
      setTimeout(() => location.reload(), 2000);
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════════
// ACTUALIZAR ESTADO DE HITO (ANADIR / CANCELAR)
// ════════════════════════════════════════════════════════════════

window.updateMilestoneStatus = async (serviceId, status) => {
  const clearTransientStyles = (el) => {
    if (!el) return;
    el.style.opacity = '';
    el.style.transform = '';
    el.style.filter = '';
    el.style.transition = '';
    el.classList.remove('ring-4', 'ring-[#31713D]/10');
  };

  // 📍 Animación visual inmediata (Optimistic UI)
  const card = document.getElementById(`service-card-${serviceId}`);
  const row = document.getElementById(`service-row-${serviceId}`);
  const target = card || row;
  
  if (target) {
    if (status === 'cancelled') {
      target.style.transition = 'all 0.4s ease';
      target.style.opacity = '0.5';
      target.style.transform = 'scale(0.98)';
      target.style.filter = 'grayscale(1)';
    } else if (status === 'pending' || status === 'added') {
      target.style.transition = 'all 0.4s ease';
      target.style.opacity = '1';
      target.style.transform = 'scale(1.02)';
      target.style.filter = 'none';
      target.classList.add('ring-4', 'ring-[#31713D]/10');
    }
  }

  try {
    const response = await fetch(`/p/${proposalHash}/milestone/${serviceId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'No se pudo actualizar el hito');
    }

    const msg = status === 'cancelled'
      ? 'Servicio marcado como no añadido'
      : (status === 'added'
        ? 'Servicio añadido correctamente'
        : 'Servicio devuelto a pendiente');
    showNotification(msg, 'success');
    
    // If server returned updated stats, apply them directly to the UI
    if (data && data.stats) {
      applyProposalData(data);
      await syncProposalRealtimeState();
    } else {
      await window.refreshProposalState();
    }

    clearTransientStyles(target);
  } catch (err) {
    clearTransientStyles(target);
    showNotification('✗ Error: ' + err.message, 'error');
  } finally {
    // Red de seguridad: evita que quede estilo "gris" pegado
    clearTransientStyles(target);
  }
};

// ════════════════════════════════════════════════════════════════
// RECHAZAR PROPUESTA
// ════════════════════════════════════════════════════════════════

document.getElementById('btn-reject')?.addEventListener('click', () => {
  document.getElementById('modal-reject').classList.remove('hidden');
});

document.getElementById('btn-cancel-reject')?.addEventListener('click', () => {
  document.getElementById('modal-reject').classList.add('hidden');
});

document.getElementById('btn-confirm-reject')?.addEventListener('click', async () => {
  const reason = document.getElementById('reject-reason')?.value || '';

  try {
    const response = await fetch(`/p/${proposalHash}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason })
    });

    if (!response.ok) throw new Error('Error al rechazar');

    const data = await response.json();
    if (data.success) {
      showNotification('Propuesta rechazada. El comercial ha sido notificado.', 'success');
      setTimeout(() => location.reload(), 2000);
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ════════════════════════════════════════════════════════════════
// SOLICITAR MODIFICACIONES
// ════════════════════════════════════════════════════════════════

document.getElementById('btn-modifications')?.addEventListener('click', () => {
  document.getElementById('modal-modifications').classList.remove('hidden');
});

document.getElementById('btn-cancel-modifications')?.addEventListener('click', () => {
  document.getElementById('modal-modifications').classList.add('hidden');
});

document.getElementById('btn-send-modifications')?.addEventListener('click', async () => {
  const modifications = document.getElementById('modifications-text')?.value || '';

  if (!modifications.trim()) {
    showNotification('Por favor describe los cambios', 'warning');
    return;
  }

  try {
    const response = await fetch(`/p/${proposalHash}/modifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ modifications })
    });

    if (!response.ok) throw new Error('Error al enviar solicitud');

    const data = await response.json();
    if (data.success) {
      showNotification('✓ Solicitud enviada. El comercial la revisará pronto.', 'success');
      document.getElementById('modal-modifications').classList.add('hidden');
      document.getElementById('modifications-text').value = '';
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ════════════════════════════════════════════════════════════════
// POLLING PARA CHAT (Solo si existe chat element)
// ════════════════════════════════════════════════════════════════

let isFirstLoad = true;

async function pollMessages() {
  const targetHash = window.clientProposalHash || proposalHash;
  if (!targetHash) return;

  try {
    const response = await fetch(`/p/${targetHash}/messages`);
    if (!response.ok) return;

    const data = await response.json();
    // Actualizar si hay más mensajes o si es la primera vez
    // Usamos !== en lugar de > porque el optimistic update ya aumentó el length
    if (data.success && (data.messages.length !== messages.length || isFirstLoad)) {
      const isNewMessageFromCommercial = data.messages.some((m, idx) => {
          // Es un mensaje nuevo si su ID no estaba en nuestro mapeo actual
          return m.sender_role === 'commercial' && !messages.some(old => old.id === m.id);
      });
      
      messages = data.messages;
      updateChatDisplay();

      // Si hay mensajes nuevos del comercial y el chat está cerrado, mostrar badge
      if (isNewMessageFromCommercial && !isFirstLoad) {
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow && chatWindow.classList.contains('hidden')) {
          showChatBadges(true);
        }
      }
    }
    isFirstLoad = false;
  } catch (err) {
    console.error('Error en polling:', err);
  }
}

function showChatBadges(show) {
  const badgeHeader = document.getElementById('chat-badge-header');
  const badgeBubble = document.getElementById('chat-badge-bubble');
  
  if (badgeHeader) {
    if (show) badgeHeader.classList.remove('hidden');
    else badgeHeader.classList.add('hidden');
  }
  
  if (badgeBubble) {
    if (show) badgeBubble.classList.remove('hidden');
    else badgeBubble.classList.add('hidden');
  }
}
window.showChatBadges = showChatBadges;

function updateChatDisplay() {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;

  chatContainer.innerHTML = messages.map((msg, index) => {
    const isSystem = msg.message_body.startsWith('🚀') || msg.message_body.startsWith('🚫') || msg.message_body.startsWith('✅') || msg.message_body.startsWith('🔄');
    
    if (isSystem) {
      return `
        <div class="flex justify-center my-4">
          <span class="bg-gray-100 text-gray-500 text-[9px] px-3 py-1 rounded-full border border-gray-100 uppercase tracking-widest font-black shadow-sm">
            ${msg.message_body}
          </span>
        </div>
      `;
    }

    const isClient = msg.sender_role === 'client';
    const alignClass = isClient ? 'self-end flex-row-reverse' : 'self-start flex-row';
    const bubbleClass = isClient ? 'bg-[#31713D] text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none shadow-sm';
    const initials = isClient ? 'YO' : (msg.sender_name ? msg.sender_name.substring(0,2).toUpperCase() : 'MC');
    const avatarBg = isClient ? 'bg-gray-900 shadow-xl' : 'bg-[#31713D]';
    const time = msg.created_at_full || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

    const avatarImg = (!isClient && window.commercialAvatar) 
        ? `<img src="${window.commercialAvatar}" class="w-full h-full rounded-full object-cover">`
        : initials;

    // Separador de fecha
    let dateSeparator = '';
    const msgDate = new Date(msg.created_at).toLocaleDateString();
    const prevMsg = index > 0 ? messages[index-1] : null;
    const prevDate = prevMsg ? new Date(prevMsg.created_at).toLocaleDateString() : null;
    
    if (msgDate !== prevDate) {
        dateSeparator = `
            <div class="flex justify-center my-6">
                <span class="text-[8px] font-black text-gray-300 uppercase tracking-[0.2em]">
                    ${msgDate === new Date().toLocaleDateString() ? 'Hoy' : msgDate}
                </span>
            </div>
        `;
    }

    return `
      ${dateSeparator}
      <div class="flex ${alignClass} gap-2 items-end mb-2 group/chat">
        <div class="w-8 h-8 rounded-full ${(!isClient && window.commercialAvatar) ? '' : avatarBg} text-white flex items-center justify-center text-[9px] font-black flex-shrink-0 shadow-sm border border-white overflow-hidden" 
             style="${(!isClient && !window.commercialAvatar) ? 'background-color: #31713D; color: #FFFFFF' : ''}">
          ${avatarImg}
        </div>
        <div class="flex flex-col ${isClient ? 'items-end' : 'items-start'} max-w-[85%]">
            <div class="${bubbleClass} px-3.5 py-2.5 transition-all hover:shadow-md" 
                 style="${isClient ? 'background-color: #31713D; color: #FFFFFF' : ''}">
                <p class="text-[13px] leading-relaxed whitespace-pre-wrap">${msg.message_body}</p>
            </div>
            <span class="text-[7px] text-gray-400/70 mt-0.5 font-bold uppercase tracking-widest">
                ${time}
            </span>
        </div>
      </div>
    `;
  }).join('');

  // Scroll al final
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Iniciar polling cada 30 segundos
document.addEventListener('DOMContentLoaded', () => {
  pollMessages();
  pollingInterval = setInterval(pollMessages, 30000);
});

window.addEventListener('beforeunload', () => {
  clearInterval(pollingInterval);
});

// ════════════════════════════════════════════════════════════════
// ENVIAR MENSAJE (Chat)
// ════════════════════════════════════════════════════════════════

// Evento: Enter para enviar
document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('btn-send-message').click();
    }
});

document.getElementById('btn-send-message')?.addEventListener('click', async () => {
  const messageInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send-message');
  const message_body = messageInput?.value.trim();

  // Si estamos en modo mantenimiento, el hash viene de otra variable global
  const targetHash = window.clientProposalHash || proposalHash;

  if (!message_body) {
    showNotification('Escribe un mensaje', 'warning');
    return;
  }

  // Prevenir doble envío y mostrar loading
  const originalBtnContent = sendBtn.innerHTML;
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>';
  if (typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const response = await fetch(`/p/${targetHash}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message_body })
    });

    if (!response.ok) {
        let errorMsg = `Error del servidor (${response.status})`;
        try {
            const errData = await response.json();
            errorMsg = errData.message || errData.error || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
    }

    const data = await response.json();
    if (data.success) {
      messageInput.value = '';
      
      // Optimistic Update: Añadir localmente para feedback inmediato
      const now = new Date();
      const tempMsg = {
        message_body: message_body,
        sender_role: 'client',
        created_at: now.toISOString(),
        created_at_full: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      // Añadimos al array local y renderizamos sin esperar al polling
      messages.push(tempMsg);
      updateChatDisplay();
      
      // Sincronizar en segundo plano
      if (typeof pollMessages === 'function') pollMessages();
    } else {
      throw new Error(data.message || 'Error al guardar mensaje');
    }
  } catch (err) {
    console.error('Chat Error:', err);
    showNotification('✗ ' + err.message, 'error');
  } finally {
    sendBtn.disabled = false;
    sendBtn.innerHTML = originalBtnContent;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
});

// Enviar mensaje con Enter
document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    document.getElementById('btn-send-message')?.click();
  }
});

// ════════════════════════════════════════════════════════════════
// DESCARGAR PDF
// ════════════════════════════════════════════════════════════════

document.getElementById('btn-download-pdf')?.addEventListener('click', async () => {
  try {
    const response = await fetch(`/p/${proposalHash}/download-pdf`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Error descargando PDF');

    const data = await response.json();
    if (data.success) {
      window.open(data.url, '_blank');
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

// ════════════════════════════════════════════════════════════════
// GESTIÓN DE VENUES (MODAL Y SELECCIÓN)
// ════════════════════════════════════════════════════════════════

let currentVenueImages = [];
let currentImageIndex = 0;
let currentVenueId = null;
let currentVenueName = '';
let currentTargetVenueId = null;
let currentVenueIsSelected = false;
let currentVenuePreviewImage = '';

/**
 * Función global para seleccionar un venue
 */
/**
 * Modal de Confirmación Genérico y Profesional
 */
window.showAppConfirm = function({ title, message, onConfirm, confirmText = 'CONFIRMAR' }) {
  document.getElementById('confirm-venue-name').parentElement.innerHTML = message;
  document.querySelector('#modal-confirm-venue h3').textContent = title;
  setConfirmVenuePreview(currentVenuePreviewImage);
  
  const modal = document.getElementById('modal-confirm-venue');
  modal.classList.remove('hidden');
  
  const confirmBtn = document.getElementById('btn-modal-venue-confirm');
  confirmBtn.textContent = confirmText;
  confirmBtn.onclick = async () => {
    await onConfirm();
    closeConfirmVenueModal();
  };
};

/**
 * Función global para seleccionar un venue (Abre el modal de confirmación)
 */
window.confirmSelectVenue = function(venueId, venueName, deselect = false) {
  const vid = venueId || currentTargetVenueId;
  const vname = venueName || currentVenueName;

  if (!deselect && !vid) {
    showNotification('✗ Error: No se pudo identificar el espacio.', 'error');
    return;
  }

  if (deselect) {
    window.showAppConfirm({
      title: '¿Deseleccionar Espacio?',
      message: `Vas a dejar <span class="font-bold text-gray-900">${vname}</span> sin selección activa. Tu propuesta quedará con todos los espacios en estado pendiente.`,
      confirmText: 'SÍ, DESELECCIONAR',
      onConfirm: () => executeVenueSelection(null, true)
    });
    return;
  }

  window.showAppConfirm({
    title: '¿Confirmar Espacio?',
    message: `Vas a seleccionar <span class="font-bold text-gray-900">${vname}</span> como la ubicación definitiva para tu evento.`,
    confirmText: 'SÍ, CONFIRMAR SELECCIÓN',
    onConfirm: () => executeVenueSelection(vid, false)
  });
};

window.closeConfirmVenueModal = function() {
  document.getElementById('modal-confirm-venue').classList.add('hidden');
  // Restaurar estructura original si se cambió dinámicamente
  const p = document.querySelector('#modal-confirm-venue p');
  p.innerHTML = 'Vas a seleccionar <span id="confirm-venue-name" class="font-bold text-gray-900"></span> como la ubicación definitiva para tu evento.';
};

function setConfirmVenuePreview(imageUrl) {
  const img = document.getElementById('confirm-venue-preview');
  const icon = document.getElementById('confirm-venue-icon');
  const overlay = document.getElementById('confirm-venue-overlay');
  const overlayName = document.getElementById('confirm-venue-overlay-name');
  if (!img || !icon) return;

  if (overlayName) {
    overlayName.textContent = (currentVenueName || '').trim();
  }

  const normalized = (imageUrl || '').trim();
  if (!normalized) {
    img.classList.add('hidden');
    img.removeAttribute('src');
    icon.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');
    return;
  }

  img.src = normalized;
  img.classList.remove('hidden');
  icon.classList.add('hidden');
  if (overlay && overlayName && overlayName.textContent) overlay.classList.remove('hidden');
  img.onerror = () => {
    img.classList.add('hidden');
    icon.classList.remove('hidden');
    if (overlay) overlay.classList.add('hidden');
  };
}

async function executeVenueSelection(vid, isDeselecting = false) {
  try {
    const confirmBtn = document.getElementById('btn-modal-venue-confirm');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> PROCESANDO...';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const response = await fetch(`/p/${proposalHash}/select-venue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue_id: isDeselecting ? null : vid })
    });

    if (!response.ok) throw new Error('Error al seleccionar venue');

    const data = await response.json();
    if (data.success) {
      showNotification(isDeselecting ? '✓ Espacio deseleccionado' : '✓ Espacio confirmado correctamente', 'success');
      setTimeout(() => location.reload(), 800);
    }
  } catch (err) {
    console.error('Error en executeVenueSelection:', err);
    showNotification('✗ Error: ' + err.message, 'error');
    
    // Restaurar botón si hay error
    const confirmBtn = document.getElementById('btn-modal-venue-confirm');
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'SÍ, CONFIRMAR';
  }
}

window.openVenueModal = function(venueData) {
  try {
    const venue = typeof venueData === 'string' ? JSON.parse(venueData) : venueData;
    
    // Guardar estado global para el botón
    currentVenueId = venue.id;
    currentVenueName = venue.name;
    currentTargetVenueId = venue.venue_id || venue.id;
    currentVenueIsSelected = Boolean(venue.is_selected === 1 || venue.is_selected === '1' || venue.is_selected === true);
    
    console.log('Modal abierto para ID:', currentTargetVenueId, 'Nombre:', currentVenueName);

    // Título, Contador y Descripción
    document.getElementById('modal-venue-title').textContent = venue.name;
    document.getElementById('modal-venue-description').textContent = venue.description || 'Sin descripción disponible.';
    
    // Actualizar contador (si existe window.proposedVenues)
    const counterElement = document.getElementById('modal-venue-counter');
    if (counterElement && window.proposedVenues) {
      const idx = window.proposedVenues.findIndex(v => v.id === venue.id);
      if (idx !== -1) {
        counterElement.textContent = `${idx + 1} / ${window.proposedVenues.length}`;
      }
    }

    // Ocultar flechas si solo hay un venue
    const navButtons = document.querySelectorAll('.venue-nav-btn');
    if (window.proposedVenues && window.proposedVenues.length <= 1) {
      navButtons.forEach(btn => btn.classList.add('hidden'));
    } else {
      navButtons.forEach(btn => btn.classList.remove('hidden'));
    }
    
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
    const carouselContainer = document.getElementById('modal-venue-carousel');
    currentVenueImages = [];
    if (venue.images) {
      try {
        currentVenueImages = typeof venue.images === 'string' ? JSON.parse(venue.images) : venue.images;
        if (!Array.isArray(currentVenueImages)) currentVenueImages = [];
      } catch (e) { currentVenueImages = []; }
    }
    currentVenuePreviewImage = currentVenueImages[0] ? String(currentVenueImages[0]).replace(/[\n\r]/g, '').trim() : '';
    
    currentImageIndex = 0;
    renderCarousel();

    // Mapa
    const mapContainer = document.getElementById('modal-venue-map-container');
    const mapIframe = document.getElementById('modal-venue-map');
    if (venue.map_iframe) {
      let src = venue.map_iframe;
      if (src.includes('<iframe')) {
        const match = src.match(/src="([^"]+)"/);
        if (match) src = match[1];
      }
      
      // Asegurar que el src es válido para iframe
      if (src.startsWith('//')) src = 'https:' + src;
      
      mapIframe.src = src;
      mapContainer.classList.remove('hidden');
    } else {
      mapContainer.classList.add('hidden');
    }

    // Botón de Selección / Deselección
    const btnSelect = document.getElementById('btn-confirm-select-venue');
    
    if (btnSelect) {
      if (currentVenueIsSelected) {
        btnSelect.innerHTML = `<i data-lucide="x-circle" class="w-4 h-4 md:w-4.5 md:h-4.5"></i><span>DESELECCIONAR</span>`;
        btnSelect.className = "col-span-1 h-11 bg-white text-black font-black uppercase tracking-[0.12em] text-[10px] md:text-[11px] border border-black shadow-md hover:bg-red-50 hover:text-red-600 transition-all active:scale-[0.99] flex items-center justify-center gap-2";
        btnSelect.disabled = false;
      } else {
        btnSelect.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 md:w-4.5 md:h-4.5"></i><span>ELEGIR</span>`;
        btnSelect.className = "col-span-1 h-11 bg-[#31713D] text-white font-black uppercase tracking-[0.12em] text-[10px] md:text-[11px] border border-black shadow-md hover:brightness-110 transition-all active:scale-[0.99] flex items-center justify-center gap-2";
        btnSelect.disabled = false;
      }
    }

    document.getElementById('modal-venue-details').classList.remove('hidden');
    // Reinicializar iconos en el modal
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Configurar Swipe y cierre por click fuera (solo una vez)
    initModalSwipe();
    
  } catch (err) {
    console.error('Error al abrir modal de venue:', err);
  }
};

// Listener único para el botón de elegir espacio
document.addEventListener('DOMContentLoaded', () => {
  const btnSelect = document.getElementById('btn-confirm-select-venue');
  if (btnSelect) {
    btnSelect.addEventListener('click', (e) => {
      e.preventDefault();
      if (btnSelect.disabled) return;
      window.confirmSelectVenue(undefined, undefined, currentVenueIsSelected);
    });
  }
});

document.getElementById('modal-confirm-venue')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-confirm-venue') {
    closeConfirmVenueModal();
  }
});

window.navigateVenue = function(direction) {
  if (!window.proposedVenues || window.proposedVenues.length <= 1) return;
  
  const currentIndex = window.proposedVenues.findIndex(v => v.id === currentVenueId);
  if (currentIndex === -1) return;
  
  let nextIndex = currentIndex + direction;
  if (nextIndex >= window.proposedVenues.length) nextIndex = 0;
  if (nextIndex < 0) nextIndex = window.proposedVenues.length - 1;
  
  openVenueModal(window.proposedVenues[nextIndex]);
};

// Swipe Logic para el Modal
let touchStartX = 0;
let touchEndX = 0;
let swipeInitialized = false;

function initModalSwipe() {
  const modalBg = document.getElementById('modal-venue-details');
  const modalContent = modalBg?.querySelector('.bg-white');
  if (!modalContent || swipeInitialized) return;

  // CERRAR AL HACER CLICK FUERA (En el fondo negro)
  modalBg.addEventListener('click', (e) => {
    if (e.target === modalBg) {
      closeVenueModal();
    }
  });

  modalContent.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modalContent.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });

  swipeInitialized = true;
}

function handleSwipe() {
  const swipeThreshold = 50;
  if (touchEndX < touchStartX - swipeThreshold) {
    // Left swipe -> Next Venue
    navigateVenue(1);
  }
  if (touchEndX > touchStartX + swipeThreshold) {
    // Right swipe -> Previous Venue
    navigateVenue(-1);
  }
}

function renderCarousel() {
  const container = document.getElementById('modal-venue-carousel');
  const currentSpan = document.getElementById('carousel-current');
  const totalSpan = document.getElementById('carousel-total');

  if (!currentVenueImages || currentVenueImages.length === 0) {
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
      <i data-lucide="image-off" class="w-12 h-12"></i>
    </div>`;
    currentSpan.textContent = '0';
    totalSpan.textContent = '0';
    return;
  }

  container.innerHTML = currentVenueImages.map((img, idx) => `
    <div class="w-full h-full shrink-0 cursor-zoom-in" onclick="zoomVenueImage(${idx})">
      <img src="${img.replace(/[\n\r]/g, '').trim()}" class="w-full h-full object-cover">
    </div>
  `).join('');

  totalSpan.textContent = currentVenueImages.length;
  currentSpan.textContent = currentImageIndex + 1;
  updateCarouselPosition();
}

window.prevVenueImage = function() {
  if (currentVenueImages.length <= 1) return;
  currentImageIndex = (currentImageIndex - 1 + currentVenueImages.length) % currentVenueImages.length;
  updateCarousel();
};

window.nextVenueImage = function() {
  if (currentVenueImages.length <= 1) return;
  currentImageIndex = (currentImageIndex + 1) % currentVenueImages.length;
  updateCarousel();
};

function updateCarousel() {
  document.getElementById('carousel-current').textContent = currentImageIndex + 1;
  updateCarouselPosition();
}

function updateCarouselPosition() {
  const container = document.getElementById('modal-venue-carousel');
  if (!container || !currentVenueImages.length) return;
  const percentage = currentImageIndex * 100;
  container.style.transform = `translateX(-${percentage}%)`;
}

window.closeVenueModal = function() {
  document.getElementById('modal-venue-details').classList.add('hidden');
  document.getElementById('modal-venue-map').src = ''; // Limpiar iframe
};

// ════════════════════════════════════════════════════════════════
// LIGHTBOX / ZOOM DE IMÁGENES
// ════════════════════════════════════════════════════════════════

let zoomIndex = 0;

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

// Click fuera para cerrar Zoom
document.getElementById('modal-venue-zoom')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-venue-zoom') {
    closeVenueZoom();
  }
});

// Click fuera para cerrar Detalles del Venue
document.getElementById('modal-venue-details')?.addEventListener('click', (e) => {
  if (e.target.id === 'modal-venue-details') {
    closeVenueModal();
  }
});

// CERRAR MODAL CON ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeVenueZoom();
    closeVenueModal();
    closeConfirmVenueModal();
    document.getElementById('modal-modifications')?.classList.add('hidden');
    document.getElementById('modal-reject')?.classList.add('hidden');
  }
  
  // Flechas para el zoom
  if (!document.getElementById('modal-venue-zoom').classList.contains('hidden')) {
    if (e.key === 'ArrowLeft') changeZoomImage(-1);
    if (e.key === 'ArrowRight') changeZoomImage(1);
  }
});

// ════════════════════════════════════════════════════════════════
// SELECCIONAR VENUE
// ════════════════════════════════════════════════════════════════

async function selectVenue(hash, venueId) {
  try {
    const response = await fetch(`/p/${hash}/select-venue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        venue_id: venueId
      })
    });

    if (!response.ok) throw new Error('Error al seleccionar venue');

    const data = await response.json();
    if (data.success) {
      showNotification('✅ Venue seleccionado correctamente', 'success');
      if (data.stats) applyProposalData(data);
      else window.refreshProposalState();
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
}

// ════════════════════════════════════════════════════════════════
// SELECCIONAR OPCIÓN (Choice)
// ════════════════════════════════════════════════════════════════

async function selectServiceOption(hash, serviceId, optionId, isDeselecting = false) {
  // Animación para el cliente
  if (!isDeselecting) {
    const targetCard = document.getElementById(`option-card-${optionId}`);
    if (targetCard) {
      const container = targetCard.closest('.grid') || targetCard.parentElement;
      const allCards = container.querySelectorAll('.menu-option-card');
      
      allCards.forEach(card => {
        if (card !== targetCard) {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          card.style.pointerEvents = 'none';
        } else {
          card.classList.add('border-brand-primary', 'shadow-2xl', 'ring-8', 'ring-brand-primary/5', 'scale-[1.02]');
        }
      });
      
      // Cambiar layout de grid a 1 sola columna suavemente
      container.classList.remove('md:grid-cols-2');
      container.classList.add('grid-cols-1');
    }
  } else {
    // Si estamos deseleccionando, podemos mostrar un aviso o animar de vuelta
    const targetCard = document.getElementById(`option-card-${optionId}`);
    if (targetCard) {
      targetCard.style.opacity = '0.5';
    }
  }

  try {
    const response = await fetch(`/p/${hash}/select-option`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceId: serviceId,
        optionId: optionId
      })
    });

    if (!response.ok) throw new Error('Error al actualizar selección');

    const data = await response.json();
    if (data.success) {
      if (!isDeselecting) showNotification('✅ Opción seleccionada', 'success');
      // If server returned updated stats, apply them directly to the UI
      if (data.stats) {
        applyProposalData(data);
        await syncProposalRealtimeState();
      } else {
        window.refreshProposalState();
      }
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
}

// Alias para compatibilidad con el EJS actualizado
window.handleServiceSelection = function(btn) {
  const serviceId = btn.getAttribute('data-service-id');
  const optionId = btn.getAttribute('data-option-id');
  const isSelected = btn.getAttribute('data-selected') === 'true';
  console.log('[handleServiceSelection]', { serviceId, optionId, isSelected });
  window.selectServiceOption(proposalHash, serviceId, optionId, isSelected);
};

window.selectServiceOptionEnhanced = selectServiceOption;
window.selectServiceOption = selectServiceOption;
window.selectVenue = selectVenue;

// ════════════════════════════════════════════════════════════════
// UX OPTIMIZATION: SIDEBAR, PROGRESS & DYNAMIC UPDATES
// ════════════════════════════════════════════════════════════════

let currentProposalData = null;

function resolveFirstPendingTargetId(data) {
  const choices = (data && Array.isArray(data.choices)) ? data.choices : [];
  const firstPending = choices.find(c => !c.is_completed);
  if (!firstPending) return null;

  if (firstPending.type === 'venue') {
    return document.getElementById('venues-section') ? 'venues-section' : null;
  }

  if (typeof firstPending.id === 'string' && firstPending.id.startsWith('service_')) {
    const serviceId = firstPending.id.replace('service_', '');
    const cardId = `service-card-${serviceId}`;
    if (document.getElementById(cardId)) return cardId;
  }

  if (document.getElementById('gastronomia-section')) return 'gastronomia-section';
  if (document.getElementById('timeline-section')) return 'timeline-section';
  return null;
}

window.scrollToFirstPendingChoice = function(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const targetId = resolveFirstPendingTargetId(currentProposalData);
  if (!targetId) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.add('ring-4', 'ring-amber-300/60');
  setTimeout(() => {
    target.classList.remove('ring-4', 'ring-amber-300/60');
  }, 1200);
};

/**
 * Muestra/Oculta el panel lateral de elecciones
 */
window.toggleSidebar = function() {
  const sidebar = document.getElementById('selection-sidebar');
  const overlay = document.getElementById('selection-sidebar-overlay');
  if (!sidebar || !overlay) return;

  const isHidden = sidebar.classList.contains('translate-x-full');
  
  if (isHidden) {
    sidebar.classList.remove('translate-x-full');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('opacity-100'), 10);
    // Actualizar contenido al abrir
    window.refreshProposalState();
  } else {
    sidebar.classList.add('translate-x-full');
    overlay.classList.remove('opacity-100');
    setTimeout(() => overlay.classList.add('hidden'), 300);
  }
};

/**
 * Obtiene el estado actual de la propuesta y actualiza la UI
 */
window.refreshProposalState = async function() {
  try {
    const response = await fetch(`/p/${proposalHash}/json`);
    const data = await response.json();
    
    if (data.success) {
      currentProposalData = data;
      updateProgressUI(data);
      updateSidebarUI(data);
      updateFinalSummaryUI(data); // <--- AÑADIDO
      updateFloatingBarUI(data);
      updateBodySelections(data);
      
      // Re-inicializar iconos de Lucide para todo el DOM actualizado
      if (typeof lucide !== 'undefined') {
          lucide.createIcons();
      }
    }
  } catch (err) {
    console.error('Error refreshing proposal state:', err);
  }
};

/**
 * Actualiza el resumen final al pie de la propuesta
 */
function updateFinalSummaryUI(data) {
  const summaryGrid = document.getElementById('summary-choices-grid');
  if (!summaryGrid) return;

  const selectedVenue = data.proposal.venues.find(v => v.is_selected);
  const selectedServices = data.proposal.services.filter(s => s.selected_option_index !== null && s.selected_option_index >= 0);

  let html = '';

  // Venue
  if (selectedVenue) {
    html += `
      <div class="bg-white border border-black p-5 shadow-sm hover:shadow-md transition-all group animate-fadeIn">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:brand-bg group-hover:text-white transition-all">
            <i data-lucide="map-pin" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tu Espacio</p>
            <p class="font-black text-xs uppercase tracking-tight truncate">${selectedVenue.name}</p>
          </div>
          <button onclick="document.getElementById('venues-section')?.scrollIntoView({behavior: 'smooth'})" class="text-blue-500 hover:scale-110 transition-transform">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }

  // Services
  selectedServices.forEach(s => {
    const opt = s.options[s.selected_option_index];
    html += `
      <div class="bg-white border border-black p-5 shadow-sm hover:shadow-md transition-all group animate-fadeIn">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:brand-bg group-hover:text-white transition-all">
            <i data-lucide="check" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">${s.title}</p>
            <p class="font-black text-xs uppercase tracking-tight truncate">${opt.name}</p>
          </div>
          <button onclick="document.getElementById('option-card-${opt.id}')?.scrollIntoView({behavior: 'smooth'})" class="text-blue-500 hover:scale-110 transition-transform">
            <i data-lucide="edit-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  });

  // Pendientes
  data.stats.pending_choices.forEach(c => {
    html += `
      <div class="bg-red-50 border-2 border-dashed border-red-100 p-5 group animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-red-100 flex items-center justify-center text-red-600">
            <i data-lucide="alert-circle" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 min-w-0 text-left">
            <p class="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Pendiente</p>
            <p class="font-black text-xs uppercase tracking-tight truncate text-red-600">${c.label}</p>
          </div>
          <button onclick="document.getElementById('${c.type === 'venue' ? 'venues-section' : 'timeline-section'}')?.scrollIntoView({behavior: 'smooth'})" class="text-red-600 hover:scale-110 transition-transform">
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  });

  summaryGrid.innerHTML = html;
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Actualiza la barra de progreso
 */
function updateProgressUI(data) {
  const bar = document.getElementById('progress-bar-fill');
  const summaryBar = document.getElementById('summary-progress-bar');
  const percentText = document.getElementById('progress-percent');
  const statusText = document.getElementById('choices-status');
  const pendingList = document.getElementById('pending-choices-list');
  const quickDecisionRail = document.getElementById('quick-decision-rail');
  const headerPendingBadge = document.getElementById('header-pending-badge');
  const headerPendingText = document.getElementById('header-pending-text');
  const pendingCount = (data.choices || []).filter(c => !c.is_completed).length;

  if (bar) bar.style.width = `${data.stats.progress_percentage}%`;
  if (summaryBar) summaryBar.style.width = `${data.stats.progress_percentage}%`;
  if (percentText) percentText.textContent = `${data.stats.progress_percentage}%`;
  
  if (statusText) {
    const isCompleted = data.stats.all_completed;
    statusText.textContent = !isCompleted 
      ? 'ELECCIONES PENDIENTES' 
      : '✓ PROPUESTA COMPLETADA';
    
    if (isCompleted) {
        statusText.classList.remove('text-gray-600', 'text-orange-600');
        statusText.classList.add('text-green-600');
        if (bar) bar.style.backgroundColor = '#16a34a'; // bg-green-600
        if (summaryBar) summaryBar.style.backgroundColor = '#16a34a';
    } else {
        statusText.classList.remove('text-green-600', 'text-gray-600');
        statusText.classList.add('text-orange-600');
        if (bar) bar.style.backgroundColor = '#ea580c'; // bg-orange-600
        if (summaryBar) summaryBar.style.backgroundColor = '#ea580c';
    }
  }

  if (headerPendingBadge) {
    if (pendingCount > 0) {
      headerPendingBadge.textContent = String(pendingCount);
      headerPendingBadge.classList.remove('hidden');
    } else {
      headerPendingBadge.classList.add('hidden');
    }
  }

  if (headerPendingText) {
    if (pendingCount > 0) {
      headerPendingText.textContent = `Pendientes: ${pendingCount}`;
      headerPendingText.classList.remove('text-green-300');
      headerPendingText.classList.add('text-amber-300/90');
    } else {
      headerPendingText.textContent = 'Todo confirmado';
      headerPendingText.classList.remove('text-amber-300/90');
      headerPendingText.classList.add('text-green-300');
    }
  }

  // Lista de pendientes (badges)
  if (pendingList) {
    pendingList.innerHTML = data.choices
      .filter(c => !c.is_completed)
      .map(c => `
        <a href="#${c.type === 'venue' ? 'venues-section' : 'timeline-section'}" class="flex-shrink-0 bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 text-[9px] font-black uppercase tracking-tighter hover:bg-orange-100 transition-all flex items-center gap-1 group">
          <i data-lucide="alert-circle" class="w-2.5 h-2.5 animate-pulse"></i>
          <span>${c.label}</span>
          <i data-lucide="chevron-right" class="w-2 h-2 group-hover:translate-x-0.5 transition-transform"></i>
        </a>
      `).join('');
    
    // Si no hay pendientes, mostrar confirmación verde
    if (data.choices.every(c => c.is_completed)) {
        pendingList.innerHTML = `
          <div class="flex-shrink-0 bg-green-50 text-green-600 border border-green-200 px-3 py-1 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 animate-fadeIn">
            <i data-lucide="check-circle" class="w-2.5 h-2.5"></i>
            <span>Toda la selección confirmada</span>
          </div>
        `;
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  if (quickDecisionRail) {
    const pendingChoices = (data.choices || []).filter(c => !c.is_completed);
    const buttons = [];

    const venuePending = pendingChoices.find(c => c.type === 'venue');
    if (venuePending) {
      buttons.push(`
        <button type="button"
                onclick="document.getElementById('venues-section')?.scrollIntoView({behavior: 'smooth', block: 'center'})"
                class="h-[28px] px-3 bg-[#31713D] text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-black transition-all">
          <i data-lucide="map-pin" class="w-3 h-3"></i>
          <span>Elegir espacio</span>
        </button>
      `);
    }

    const servicePending = pendingChoices.find(c => c.type === 'service');
    if (servicePending) {
      const serviceId = String(servicePending.id || '').replace('service_', '');
      buttons.push(`
        <button type="button"
                onclick="document.getElementById('service-card-${serviceId}')?.scrollIntoView({behavior: 'smooth', block: 'center'})"
                class="h-[28px] px-3 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-amber-600 transition-all">
          <i data-lucide="mouse-pointer-2" class="w-3 h-3"></i>
          <span>Resolver servicio pendiente</span>
        </button>
      `);
    }

    if (buttons.length === 0) {
      quickDecisionRail.innerHTML = `
        <span class="text-[8px] font-black uppercase tracking-widest text-green-700 flex items-center gap-1.5">
          <i data-lucide="check-circle" class="w-3 h-3"></i>
          <span>Todo listo para confirmar propuesta</span>
        </span>
      `;
    } else {
      quickDecisionRail.innerHTML = `
        <span class="text-[8px] font-black uppercase tracking-widest text-gray-500">Siguiente paso:</span>
        ${buttons.join('')}
      `;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

/**
 * Actualiza el contenido del panel lateral
 */
function updateSidebarUI(data) {
  const container = document.getElementById('sidebar-choices-content');
  const totalText = document.getElementById('sidebar-total');
  const countBadge = document.getElementById('sidebar-count');

  const baseEl = document.getElementById('sidebar-base');
  const discountEl = document.getElementById('sidebar-discount');
  const discountRow = document.getElementById('sidebar-discount-row');
  const ivaEl = document.getElementById('sidebar-iva');

  // El total principal del sidebar ahora muestra la Base Imponible con Descuentos
  if (totalText) totalText.textContent = formatCurrency(data.proposal.totals?.total_base_after_discount || 0);
  if (countBadge) countBadge.textContent = data.stats.completed_choices || 0;

  const totals = data.proposal.totals || {};
  if (baseEl) baseEl.textContent = formatCurrency(totals.total_base || 0);
  if (ivaEl) ivaEl.textContent = formatCurrency(totals.total_vat || 0);

  if (discountRow) {
    if (totals.total_discount && totals.total_discount > 0) {
      if (discountEl) discountEl.textContent = '-' + formatCurrency(totals.total_discount);
      discountRow.style.display = 'flex';
    } else {
      discountRow.style.display = 'none';
    }
  }

  if (!container) return;

  let html = '';

  // 1. ESPACIO (Diferenciar entre seleccionado y pendiente)
  const selectedVenue = data.proposal.venues.find(v => v.is_selected);
  const venueCount = data.proposal.venues.length;

  if (venueCount > 0) {
    html += `
      <div class="space-y-3 mb-8">
        <div class="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
            <h4 class="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
              <i data-lucide="map" class="w-3 h-3 text-[#31713D]"></i> Tu Espacio
            </h4>
            ${selectedVenue ? '<span class="text-[8px] font-black text-[#31713D] bg-[#31713D]/5 px-2 py-0.5 rounded-none border border-[#31713D]/20 uppercase">Confirmado</span>' : '<span class="text-[8px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-none border border-orange-200 uppercase animate-pulse italic">Escoger...</span>'}
        </div>
        ${selectedVenue ? `
          <div class="bg-white border border-black p-4 shadow-sm flex items-center gap-4 group transition-all hover:shadow-md">
            <div class="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0 overflow-hidden">
               ${ (() => {
                  try {
                    const imgs = typeof selectedVenue.images === 'string' ? JSON.parse(selectedVenue.images) : selectedVenue.images;
                    const thumb = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
                    return thumb ? `<img src="${thumb}" class="w-full h-full object-cover">` : `<i data-lucide="map-pin" class="w-4 h-4 text-gray-400"></i>`;
                  } catch(e) {
                    return `<i data-lucide="map-pin" class="w-4 h-4 text-gray-400"></i>`;
                  }
               })() }
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-black text-[13px] uppercase tracking-tighter truncate leading-none mb-1 text-black">${selectedVenue.name}</p>
              <button onclick="toggleSidebar(); document.getElementById('venues-section')?.scrollIntoView({behavior: 'smooth'});" class="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1">
                <i data-lucide="refresh-ccw" class="w-2.5 h-2.5"></i> Cambiar espacio
              </button>
            </div>
          </div>
        ` : `
          <div class="bg-orange-50 border border-dashed border-orange-300 p-4 flex items-center gap-4 cursor-pointer hover:bg-orange-100 transition-all"
               onclick="toggleSidebar(); document.getElementById('venues-section')?.scrollIntoView({behavior: 'smooth'});">
            <div class="w-10 h-10 bg-white flex items-center justify-center border border-orange-100 flex-shrink-0 animate-bounce shadow-sm">
              <i data-lucide="alert-circle" class="w-5 h-5 text-orange-500"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-black text-[11px] text-orange-800 uppercase tracking-tight mb-0.5 leading-none">Falta escoger espacio</p>
              <p class="text-[9px] font-bold text-orange-600 uppercase tracking-widest opacity-70">Ver opciones propuestas</p>
            </div>
          </div>
        `}
      </div>
    `;
  }

  // 2. SERVICIOS ELEGIDOS (Agrupados por fecha y más compactos)
  const selectedServices = (data.proposal.services || []).filter(s => s.selected_option_index !== null && s.selected_option_index !== undefined && parseInt(s.selected_option_index) >= 0);
  
  if (selectedServices.length > 0) {
    // Agrupar por fecha
    const grouped = {};
    selectedServices.forEach(s => {
      const dateKey = s.service_date ? s.service_date : 'TBD';
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(s);
    });

    const sortedDates = Object.keys(grouped).sort();

    html += `
      <div class="space-y-6">
        <h4 class="text-[10px] font-black text-black uppercase tracking-[0.2em] border-b border-gray-200 pb-2 flex items-center gap-2">
          <i data-lucide="check-circle" class="w-3 h-3 text-[#31713D]"></i> Servicios Seleccionados
        </h4>
        <div class="space-y-8">
          ${sortedDates.map(date => {
            let formattedDate = 'Fecha por confirmar';
            if (date !== 'TBD') {
                try {
                    if (typeof dayjs !== 'undefined') {
                        formattedDate = dayjs(date).format('dddd, D [de] MMMM').toUpperCase();
                    } else {
                        formattedDate = date;
                    }
                } catch(e) { formattedDate = date; }
            }
            
            return `
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-black"></span>
                  <p class="text-[9px] font-black text-black tracking-widest uppercase italic">${formattedDate}</p>
                </div>
                <div class="space-y-3">
                  ${grouped[date].map(s => {
                    const optIdx = parseInt(s.selected_option_index);
                    const opt = s.options && s.options[optIdx];
                    if (!opt) return ''; // Fallback robusto
                    
                    const servicePax = s.pax || data.proposal.pax || 1;
                    const subtotal = (s.price_per_pax || 0) * servicePax;
                    
                    // Detalle de platos (items) si existen
                    let itemsHtml = '';
                    if (opt.items && opt.items.length > 0) {
                        const topItems = opt.items.slice(0, 3).map(i => i.name).join(', ');
                        const extra = opt.items.length > 3 ? ` y ${opt.items.length - 3} más...` : '';
                        itemsHtml = `<p class="text-[9px] text-gray-400 font-medium italic mt-1 leading-tight">${topItems}${extra}</p>`;
                    }

                    return `
                      <div class="bg-white border border-gray-200 p-4 shadow-sm hover:border-black transition-all group flex flex-col gap-3">
                        <div class="flex items-start justify-between gap-4">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1.5">
                              <span class="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-1.5 py-0.5 border border-gray-100">${s.title}</span>
                              ${s.location ? `<span class="text-[7px] text-blue-600 font-bold uppercase tracking-widest flex items-center gap-0.5 opacity-60"><i data-lucide="map-pin" class="w-2 h-2"></i> ${s.location}</span>` : ''}
                            </div>
                            <p class="font-black text-[14px] uppercase tracking-tighter text-black leading-none mb-1 group-hover:text-[#31713D]">${opt.name}</p>
                            ${itemsHtml}
                          </div>
                          <button onclick="toggleSidebar(); scrollIntoOption('${opt.id}')" class="w-8 h-8 flex items-center justify-center border border-gray-100 text-gray-400 hover:text-black hover:border-black hover:bg-gray-50 transition-all flex-shrink-0 shadow-xs">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                        
                        <div class="flex items-center justify-between pt-3 border-t border-gray-50">
                           <div class="flex items-center gap-2">
                              <span class="text-[9px] font-black text-gray-500 uppercase tracking-tighter">${servicePax} PAX</span>
                              <span class="text-[9px] text-gray-300">×</span>
                              <span class="text-[10px] font-black text-black tracking-tight">${formatCurrency(s.price_per_pax || 0)}</span>
                           </div>
                           <span class="text-[14px] font-black text-[#31713D] tracking-tighter">${formatCurrency(subtotal)}</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  if (html === '') {
    html = `
      <div class="flex flex-col items-center justify-center py-20 text-center opacity-30">
        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <i data-lucide="shopping-cart" class="w-8 h-8 text-gray-400"></i>
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">Tu selección está vacía</p>
        <p class="text-[9px] font-bold text-gray-400 mt-2">Elige un espacio o menú para empezar</p>
      </div>
    `;
  }

  container.innerHTML = html;
  
  // Refrescar iconos
  if (typeof lucide !== 'undefined') {
      lucide.createIcons();
  }
}

/**
 * Helper para hacer scroll a una opción específica
 */
window.scrollIntoOption = function(optionId) {
    const el = document.getElementById(`option-card-${optionId}`);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-brand-primary/20');
        setTimeout(() => el.classList.remove('ring-4', 'ring-brand-primary/20'), 2000);
    }
}

/**
 * Actualiza la card de presupuesto principal
 */
function updateBudgetCardUI(data) {
  const baseEl = document.getElementById('final-base-after-discount');
  const vatEl = document.getElementById('final-vat');
  const totalEl = document.getElementById('final-total');
  
  const totals = data.proposal.totals || {};
  
  if (baseEl) {
    const val = totals.total_base_after_discount || 0;
    const integerPart = Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const decimalPart = (val % 1).toFixed(2).split('.')[1] || '00';
    
    baseEl.innerHTML = `${integerPart}<span class="text-xl md:text-2xl text-[#31713D]">,${decimalPart}</span><span class="ml-1 text-2xl md:text-3xl">€</span>`;
  }
  
  if (vatEl) vatEl.textContent = formatCurrency(totals.total_vat || 0);
  if (totalEl) totalEl.textContent = formatCurrency(totals.total_final || 0);
}

/**
 * Actualiza la barra flotante de confirmación
 */
function updateFloatingBarUI(data) {
  const bar = document.getElementById('floating-confirm-bar');
  const totalText = document.getElementById('floating-total');
  
  // Actualizar con Base Imponible con Descuentos
  if (totalText) totalText.textContent = formatCurrency(data.proposal.totals?.total_base_after_discount || 0);

  // Mostrar la barra siempre durante el proceso de elección (ocultar solo si ya está aceptada)
  if (bar) {
    const isLocked = ['Aceptada', 'accepted'].includes(data.proposal.status);
    
    if (!isLocked) {
        bar.classList.remove('translate-y-full');
    } else {
        bar.classList.add('translate-y-full');
    }
  }
}

/**
 * Actualiza visualmente los elementos en el cuerpo de la página sin recargar
 */
function updateBodySelections(data) {
  // 1. Ocultar sección de venues si ya hay uno seleccionado
  const venuesSection = document.getElementById('venues-section');
  const anyVenueSelected = data.proposal.venues.some(v => v.is_selected);
  if (venuesSection) {
    if (anyVenueSelected) {
      venuesSection.classList.add('hidden');
    } else {
      venuesSection.classList.remove('hidden');
    }
  }

  // 2. Actualizar Header
  const headerVenue = document.getElementById('header-venue-name');
  const headerTotal = document.getElementById('header-total');
  const headerIcon = document.getElementById('header-venue-icon');

  if (headerVenue) {
    const selectedVenue = data.proposal.venues.find(v => v.is_selected);
    headerVenue.textContent = selectedVenue ? selectedVenue.name : 'Múltiples Opciones';
    
    // Update venue icon to image thumbnail
    if (headerIcon) {
       if (selectedVenue && selectedVenue.images) {
         try {
           const imgs = typeof selectedVenue.images === 'string' ? JSON.parse(selectedVenue.images) : selectedVenue.images;
           const thumb = Array.isArray(imgs) && imgs.length > 0 ? imgs[0] : null;
           headerIcon.innerHTML = thumb ? `<img src="${thumb}" class="w-full h-full object-cover">` : `<i data-lucide="map-pin" class="w-5 h-5 text-white/50"></i>`;
         } catch(e) {
            headerIcon.innerHTML = `<i data-lucide="map-pin" class="w-5 h-5 text-white/50"></i>`;
         }
       } else {
         headerIcon.innerHTML = `<i data-lucide="map-pin" class="w-5 h-5 text-white/50"></i>`;
       }
    }
  }
  if (headerTotal) {
    headerTotal.textContent = formatCurrency(data.proposal.totals?.total_base_after_discount || 0);
  }

  // 3. Actualizar Estados de Hitos (Headers de servicios)
  data.proposal.services.forEach(service => {
    const statusHeader = document.getElementById(`service-header-status-${service.id}`);
    const statusCell = document.getElementById(`service-status-cell-${service.id}`);
    const actionCell = document.getElementById(`service-actions-cell-${service.id}`);
    
    const rawIdx = service.selected_option_index;
    const hasDecision = !(rawIdx === null || rawIdx === undefined || rawIdx === '');
    const numericIdx = hasDecision ? Number(rawIdx) : null;
    const isInvalidDecision = hasDecision && Number.isNaN(numericIdx);
    const isCancelled = !isInvalidDecision && numericIdx === -1;
    const isPending = !hasDecision || isInvalidDecision;
    const isAdded = !isPending ? (service.is_multichoice ? numericIdx >= 0 : numericIdx === 0) : false;
    const isLocked = ['Aceptada', 'accepted'].includes(data.proposal.status);
    const pax = data.proposal.pax || 1;

    // --- CABECERA (Gastronomía) ---
    if (statusHeader) {
      if (isAdded) {
        const subtotal = (service.price_per_pax || 0) * (service.pax || pax);
        statusHeader.innerHTML = `
          <div class="bg-white px-8 py-2 rounded-none border border-black shadow-sm flex items-center gap-8 divide-x divide-gray-100 animate-fadeIn">
            <div class="text-right">
              <span class="text-[9px] font-black text-black uppercase tracking-[0.3em] block mb-0.5 leading-none">${service.pax || pax} ASISTENTES</span>
              <span class="text-xl font-black text-gray-900 tracking-tighter leading-none">
                ${formatCurrency(service.price_per_pax || 0)} <small class="text-[10px] text-black font-bold">/u</small>
              </span>
            </div>
            <div class="pl-8 text-right">
              <span class="text-[9px] font-black text-black uppercase tracking-[0.3em] block mb-0.5 leading-none">SUBTOTAL SERVICIO</span>
              <span class="text-2xl font-black text-[#31713D] tracking-tighter leading-none">
                ${formatCurrency(subtotal)}
              </span>
            </div>
          </div>
          ${!isLocked ? `
            <button type="button"
                    onclick="window.updateMilestoneStatus('${service.id}', 'pending')"
                    class="ml-3 h-[32px] px-4 border border-black bg-white text-black rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-50 hover:border-amber-600 hover:text-amber-700 transition-all"
                    title="Volver a decidir este servicio">
              <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
              <span>Volver a decidir</span>
            </button>
          ` : ''}
        `;
      } else if (isCancelled) {
        if (!isLocked) {
          statusHeader.innerHTML = `
            <button onclick="window.updateMilestoneStatus('${service.id}', 'pending')" 
                    class="flex items-center gap-4 px-6 py-2.5 bg-white border border-[#31713D] rounded-none shadow-sm hover:bg-[#31713D]/5 transition-all group animate-fadeIn">
              <i data-lucide="rotate-ccw" class="w-5 h-5 text-[#31713D] group-hover:rotate-[-45deg] transition-transform"></i>
              <div class="text-left">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">SERVICIO CANCELADO</span>
                <span class="text-xs font-black text-[#31713D] tracking-tight uppercase">RECUPERAR ESTE SERVICIO</span>
              </div>
            </button>
          `;
        } else {
          statusHeader.innerHTML = `
            <div class="flex items-center gap-4 px-6 py-2.5 bg-gray-50 border border-gray-200 rounded-none shadow-inner opacity-60 animate-fadeIn">
              <i data-lucide="x-circle" class="w-5 h-5 text-gray-400"></i>
              <div class="text-left">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1">CANCELADO</span>
                <span class="text-xs font-black text-gray-500 tracking-tight uppercase">No disponible</span>
              </div>
            </div>
          `;
        }
      } else {
        if (!isLocked && !service.is_multichoice) {
          statusHeader.innerHTML = `
            <div class="flex items-center gap-2 animate-fadeIn">
              <span class="inline-flex items-center gap-1.5 h-[32px] px-3 border border-amber-200 bg-amber-50 text-amber-800 text-[9px] font-black uppercase tracking-widest">
                <i data-lucide="alert-circle" class="w-3 h-3"></i>
                <span>Pendiente de decisión</span>
              </span>
              <button type="button"
                      onclick="window.updateMilestoneStatus('${service.id}', 'added')"
                      class="h-[32px] px-5 bg-[#31713D] text-white rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm">
                <i data-lucide="plus" class="w-3 h-3"></i>
                <span>Añadir ahora</span>
              </button>
              <button type="button"
                      onclick="window.updateMilestoneStatus('${service.id}', 'cancelled')"
                      class="h-[32px] px-4 bg-black text-white rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all"
                      title="Cancelar servicio">
                <i data-lucide="trash-2" class="w-3 h-3 text-white"></i>
                <span>No añadir</span>
              </button>
            </div>
          `;
        } else {
          statusHeader.innerHTML = `
            <div class="flex items-center gap-2 animate-fadeIn">
              <div class="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-none shadow-inner">
                <div class="w-8 h-8 rounded-none bg-amber-500/10 flex items-center justify-center">
                  <i data-lucide="alert-circle" class="w-5 h-5 text-amber-600"></i>
                </div>
                <div>
                  <span class="text-[10px] font-black text-amber-800 uppercase tracking-widest block text-amber-900">Elección pendiente</span>
                  <span class="text-[9px] text-amber-700 font-bold uppercase tracking-tighter">Debes elegir una opción</span>
                </div>
              </div>
              <button type="button"
                      onclick="document.getElementById('service-options-container-${service.id}')?.scrollIntoView({ behavior: 'smooth', block: 'center' })"
                      class="h-[32px] px-4 bg-[#31713D] text-white rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm">
                <i data-lucide="mouse-pointer-2" class="w-3 h-3"></i>
                <span>Elegir opción</span>
              </button>
            </div>
          `;
        }
      }
    }

    // --- TABLA (Timeline) ---
    if (statusCell) {
        if (isAdded) {
            statusCell.innerHTML = '<span class="text-[9px] font-black text-white bg-[#31713D] px-2.5 py-1 rounded-none uppercase tracking-widest animate-fadeIn">Añadido</span>';
        } else if (isCancelled) {
            statusCell.innerHTML = '<span class="text-[9px] font-black text-black/50 bg-gray-100 px-2.5 py-1 rounded-none uppercase tracking-widest animate-fadeIn">Cancelado</span>';
        } else {
            statusCell.innerHTML = '<span class="text-[9px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-none uppercase tracking-widest animate-fadeIn">Pendiente</span>';
        }
    }

    if (actionCell && !isLocked) {
        let actionsHtml = '<div class="inline-flex items-center gap-2 animate-fadeIn">';
        if (isCancelled) {
            actionsHtml += `
                <button type="button" onclick="window.updateMilestoneStatus('${service.id}', 'pending')"
                        class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-[#31713D] rounded-none transition-all bg-white text-[#31713D] hover:bg-[#31713D] hover:text-white shadow-sm flex items-center gap-1.5">
                  <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Recuperar
                </button>
            `;
        } else {
            if (!service.is_multichoice && !isAdded) {
                actionsHtml += `
                    <button type="button" onclick="window.updateMilestoneStatus('${service.id}', 'added')"
                            class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-[#31713D] rounded-none transition-all bg-[#31713D] text-white hover:bg-black shadow-sm flex items-center gap-1.5">
                      <i data-lucide="plus" class="w-3 h-3"></i> Añadir
                    </button>
                `;
            } else if (service.is_multichoice && !isAdded) {
                actionsHtml += `
                    <a href="#gastronomia-section" class="px-4 py-2 text-[9px] font-black uppercase tracking-widest border border-gray-200 rounded-none transition-all bg-white text-gray-900 hover:border-black shadow-sm flex items-center gap-1.5">
                      <i data-lucide="mouse-pointer-2" class="w-3 h-3"></i> Seleccionar
                    </a>
                `;
            } else if (isAdded) {
                 actionsHtml += `
                    <div class="flex items-center gap-2 px-4 py-2 bg-[#31713D]/5 text-[#31713D] border border-[#31713D] rounded-none">
                        <i data-lucide="check" class="w-3 h-3"></i>
                        <span class="text-[9px] font-black uppercase tracking-widest">Añadido</span>
                    </div>
                `;
            }
            
            // Botón de cancelación (Sin X, solo icono trash más sutil o texto)
            if (isAdded) {
                // Si ya está añadido, permitimos "Desmarcar" (volver a pendiente)
                actionsHtml += `
                    <button type="button" onclick="window.updateMilestoneStatus('${service.id}', 'pending')"
                            class="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-red-600 transition-colors"
                            title="Quitar">
                      Desmarcar
                    </button>
                `;
            } else {
                // Si está pendiente, permitimos "No quiero este servicio" (cancelar)
                actionsHtml += `
                    <button type="button" onclick="window.updateMilestoneStatus('${service.id}', 'cancelled')"
                            class="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 border border-transparent hover:border-red-100 transition-all"
                            title="Descartar servicio">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                `;
            }
        }
        actionsHtml += '</div>';
        actionCell.innerHTML = actionsHtml;
    }

    // --- OPCIONES / MOSAICOS ---
    const optionsContainer = document.getElementById(`service-options-container-${service.id}`);
    const optionsGrid = document.getElementById(`service-options-grid-${service.id}`);
    
    if (optionsContainer) {
        if (isCancelled) optionsContainer.classList.add('hidden');
        else optionsContainer.classList.remove('hidden');
    }

    if (optionsGrid) {
        if (service.is_multichoice && isAdded) {
            optionsGrid.classList.remove('md:grid-cols-2');
            optionsGrid.classList.add('grid-cols-1');
        } else if (service.is_multichoice) {
            optionsGrid.classList.remove('grid-cols-1');
            optionsGrid.classList.add('md:grid-cols-2');
        }
        
        // Actualizar cada card dentro del grid
        service.options.forEach((opt, cardIdx) => {
            const card = document.getElementById(`option-card-${opt.id}`);
            const actionsArea = document.getElementById(`option-actions-${opt.id}`);

            if (card) {
              const cardIsSelected = isAdded && Number(numericIdx) === cardIdx;
                const shouldHideOther = isAdded && service.is_multichoice && !cardIsSelected;

                if (cardIsSelected) {
                    card.classList.remove('hidden', 'opacity-0', 'scale-95', 'border-gray-100', 'bg-gray-50/10');
                    card.classList.add('border-[#31713D]', 'bg-white', 'shadow-xl', 'scale-[1.01]');
                } else if (shouldHideOther) {
                    card.classList.add('hidden', 'opacity-0', 'scale-95');
                } else {
                    card.classList.remove('hidden', 'opacity-0', 'scale-95', 'border-[#31713D]', 'bg-white', 'shadow-xl', 'scale-[1.01]');
                    card.classList.add('border-gray-100', 'bg-gray-50/10');
                }
            }

            if (actionsArea) {
              const cardIsSelected = isAdded && Number(numericIdx) === cardIdx;
                let actionsHtml = '';

                if (service.is_multichoice) {
                    if (!isLocked) {
                        actionsHtml = `
                          <div class="flex items-center">
                            <button type="button" 
                                    data-service-id="${service.id}"
                                    data-option-id="${opt.id}"
                                    data-selected="${cardIsSelected}"
                                    onclick="event.stopPropagation(); window.handleServiceSelection(this)"
                                    class="${cardIsSelected ? 'bg-white text-gray-900 border-2 border-black hover:border-red-500 hover:text-red-500 hover:bg-red-50' : 'bg-[#31713D] text-white hover:bg-black'} h-[32px] px-6 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm group">
                              ${cardIsSelected ? `
                                <i data-lucide="check" class="w-3 h-3 text-brand-primary group-hover:hidden"></i>
                                <i data-lucide="rotate-ccw" class="w-3 h-3 hidden group-hover:block"></i>
                                <span class="text-brand-primary group-hover:hidden">Seleccionado</span>
                                <span class="hidden group-hover:block uppercase">Deseleccionar</span>
                              ` : `
                                <i data-lucide="mouse-pointer-2" class="w-3 h-3"></i> Elegir
                              `}
                            </button>
                          </div>
                        `;
                    } else if (cardIsSelected) {
                        actionsHtml = `
                          <div class="flex items-center gap-2 px-4 py-2 bg-[#31713D]/5 text-[#31713D] border border-[#31713D] rounded-none">
                            <i data-lucide="check" class="w-3 h-3"></i>
                            <span class="text-[9px] font-black uppercase tracking-widest">Confirmado</span>
                          </div>
                        `;
                    }
                } else {
                    // Non-multichoice (gastronomía simple)
                    if (isAdded) {
                        actionsHtml = `
                          <div class="inline-flex items-center gap-2">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 bg-green-50 text-[#31713D] text-[9px] font-black uppercase tracking-widest">
                              <i data-lucide="check" class="w-3 h-3"></i>
                              <span>Añadido</span>
                            </span>
                          </div>
                        `;
                    } else if (isCancelled) {
                        actionsHtml = `
                          <div class="inline-flex items-center gap-2">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest">
                              <i data-lucide="x" class="w-3 h-3"></i>
                              <span>No añadido</span>
                            </span>
                          </div>
                        `;
                    } else if (!isLocked) {
                        actionsHtml = `
                          <div class="inline-flex items-center gap-2">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest">
                              <i data-lucide="arrow-up" class="w-3 h-3"></i>
                              <span>Decide arriba</span>
                            </span>
                          </div>
                        `;
                    }
                }
                actionsArea.innerHTML = actionsHtml;
            }
        });
    }
  });

  // 4. Actualizar Zonas de Acción
  updateActionZone(data);
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Actualiza la zona de botones de acción según el estado
 */
function updateActionZone(data) {
    const zone = document.getElementById('economics-action-zone');
    if (!zone) return;

    const proposal = data.proposal;
    const isLocked = ['Aceptada', 'accepted'].includes(proposal.status);
    
    if (isLocked) {
        zone.innerHTML = `
            <div class="bg-green-600 text-white px-6 py-5 rounded-none font-black uppercase tracking-widest text-[11px] shadow-lg flex items-center justify-center gap-3">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
              <span>Propuesta Aceptada</span>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    const allCompleted = data.stats.all_completed;

    let html = '';
    if (!allCompleted) {
        html = `
            <div class="space-y-3">
                <button onclick="showPendingNotification(event, '${data.stats.pending_choices.map(c => c.label).join(', ')}')"
                        class="w-full bg-orange-600 text-white px-6 py-5 rounded-none font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-3">
                  <i data-lucide="alert-circle" class="w-4 h-4 animate-pulse"></i>
                  <span>Pendientes selecciones</span>
                </button>
                <p class="text-[9px] text-center font-black text-orange-600 uppercase tracking-widest">
                  Falta: ${data.stats.pending_choices.map(c => c.label).join(' y ')}
                </p>
            </div>
        `;
    } else {
        html = `
            <button id="btn-accept-main" 
                    onclick="executeProposalAcceptance()"
                    class="w-full text-white px-6 py-5 rounded-none font-black uppercase tracking-widest text-[11px] shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 group"
                    style="background-color: #31713D">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
              <span>Confirmar Propuesta</span>
            </button>
        `;
    }

    html += `
        <div class="grid grid-cols-2 gap-2 mt-4">
          <button onclick="toggleChat(event)" class="bg-white hover:bg-green-50 text-black border border-black py-3 rounded-none font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all">
            <i data-lucide="message-square" class="w-3.5 h-3.5 text-[#31713D]"></i> Chat
          </button>
          <button onclick="document.getElementById('modal-reject').classList.remove('hidden')" class="bg-white hover:bg-red-50 text-black border border-black py-3 rounded-none font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all">
            <i data-lucide="x" class="w-3.5 h-3.5 text-red-600"></i> Rechazar
          </button>
        </div>
    `;

    zone.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Sincronizar otros botones de confirmación
    updateAllConfirmButtons(allCompleted);
}

/**
 * Muestra notificación de pendientes
 */
window.showPendingNotification = function(e, labels) {
    if (e) e.preventDefault();
    const txt = labels || "Hay elementos pendientes de selección";
    showNotification(`⚠️ Faltan estas selecciones antes de confirmar: ${txt}`, 'warning');
  // Hacer scroll a la guía de siguiente paso
  document.getElementById('quick-decision-rail')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Sincroniza todos los botones de "Confirmar Propuesta" (Sidebar, Floating)
 */
function updateAllConfirmButtons(allCompleted) {
    const sidebarBtn = document.getElementById('btn-sidebar-accept');
    const floatingBtn = document.getElementById('btn-floating-accept');
    
    [sidebarBtn, floatingBtn].forEach(btn => {
        if (!btn) return;
        
        const span = btn.querySelector('span');
        if (!allCompleted) {
            btn.classList.remove('brand-bg', 'bg-[#31713D]');
            btn.classList.add('bg-orange-600', 'hover:bg-orange-700');
            if (span) span.textContent = 'Pendientes selecciones';
            btn.setAttribute('onclick', "showPendingNotification(event)");
        } else {
            btn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
            btn.classList.add('brand-bg', 'bg-[#31713D]');
            if (span) span.textContent = 'Confirmar Propuesta';
            btn.setAttribute('onclick', "executeProposalAcceptance()");
        }
    });
}

/**
 * Contactar desde el modal de menú con mensaje predefinido
 */
window.contactConsultantFromMenu = async function() {
  const data = window.currentModalService;
  if (!data) return;

  const message = `Hola, tengo una consulta sobre el menú ${data.menuName} para el servicio ${data.serviceTitle} del día ${data.serviceDate}`;
  
  // Cerramos modal de menú
  if (typeof closeMenuModal === 'function') closeMenuModal();

  // Abrimos chat
  if (typeof toggleChat === 'function') toggleChat();

  // Pre-llenar el input del chat
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.value = message;
    chatInput.focus();
    // Animación de feedback
    chatInput.classList.add('ring-2', 'ring-[#31713D]');
    setTimeout(() => chatInput.classList.remove('ring-2', 'ring-[#31713D]'), 2000);
  }
};

/**
 * Helper para formatear moneda
 */
function formatCurrency(val) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
}

// Inicializar el estado al cargar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.refreshProposalState, 1000);
    
    // Vincular botón flotante
    document.getElementById('btn-floating-accept')?.addEventListener('click', () => {
        document.getElementById('btn-accept')?.click();
    });
    
    document.getElementById('btn-sidebar-accept')?.addEventListener('click', () => {
        window.toggleSidebar();
        document.getElementById('btn-accept')?.click();
    });
});

