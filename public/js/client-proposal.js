/**
 * Client Proposal JavaScript
 * Propósito: Interactividad para vistas de cliente (propuesta + chat)
 */

const proposalHash = window.location.pathname.split('/')[2];
let messages = [];
let pollingInterval;

// ════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ════════════════════════════════════════════════════════════════

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

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ════════════════════════════════════════════════════════════════
// ACEPTAR PROPUESTA
// ════════════════════════════════════════════════════════════════

document.getElementById('btn-accept')?.addEventListener('click', async () => {
  if (!confirm('¿Deseas aceptar esta propuesta?')) return;

  try {
    const response = await fetch(`/p/${proposalHash}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error al aceptar');

    const data = await response.json();
    if (data.success) {
      showNotification('✅ ¡Propuesta aceptada! El comercial se contactará pronto.', 'success');
      setTimeout(() => location.reload(), 2000);
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
  }
});

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

async function pollMessages() {
  try {
    const response = await fetch(`/p/${proposalHash}/messages`);
    if (!response.ok) return;

    const data = await response.json();
    if (data.success && data.messages.length > messages.length) {
      messages = data.messages;
      updateChatDisplay();
    }
  } catch (err) {
    console.error('Error en polling:', err);
  }
}

function updateChatDisplay() {
  const chatContainer = document.getElementById('chat-messages');
  if (!chatContainer) return;

  chatContainer.innerHTML = messages.map(msg => `
    <div class="message message-${msg.sender_role}">
      <p class="text-xs text-gray-500 mb-1">${msg.sender_role === 'client' ? 'Tú' : 'Comercial'} - ${msg.created_at}</p>
      <p class="text-gray-900">${msg.message_body}</p>
    </div>
  `).join('');

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

document.getElementById('btn-send-message')?.addEventListener('click', async () => {
  const messageInput = document.getElementById('chat-input');
  const message_body = messageInput?.value.trim();

  if (!message_body) {
    showNotification('Escribe un mensaje', 'warning');
    return;
  }

  try {
    const response = await fetch(`/p/${proposalHash}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message_body })
    });

    if (!response.ok) throw new Error('Error al enviar');

    const data = await response.json();
    if (data.success) {
      messageInput.value = '';
      pollMessages(); // Actualizar chat inmediatamente
    }
  } catch (err) {
    showNotification('✗ Error: ' + err.message, 'error');
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
// CERRAR MODALES CON ESC
// ════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('modal-modifications')?.classList.add('hidden');
    document.getElementById('modal-reject')?.classList.add('hidden');
  }
});
