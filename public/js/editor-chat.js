/**
 * Editor Chat JavaScript
 * Propósito: Manejar el chat de negociación en el lado comercial
 * Pattern: Polling (30s) + Fetch API
 */

document.addEventListener('DOMContentLoaded', () => {
    const proposalId = document.querySelector('[data-proposal-id]')?.dataset.proposalId;
    if (!proposalId) return;

    const messagesContainer = document.getElementById('chat-messages-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('btn-send-message');
    const chatForm = document.getElementById('chat-form');
    const unreadBadge = document.getElementById('chat-unread-count');

    let lastMessageCount = -1;
    let isPolling = false;
    let lastMessagesJSON = ''; // Para detectar cambios sin re-renderizar

    /**
     * Marcar mensajes como leídos
     */
    async function markAsRead() {
        try {
            const response = await fetch(`/api/proposals/${proposalId}/messages/mark-read`, {
                method: 'POST'
            });
            if (response.ok) {
                if (unreadBadge) unreadBadge.classList.add('hidden');
            }
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }

    // Reset unread count when clicking on the chat sidebar
    const sidebar = document.getElementById('chat-sidebar');
    const tabUnread = document.getElementById('chat-tab-unread');

    /**
     * Sistema de Maximizado / Full Screen
     */
    window.toggleMaximizeChat = () => {
        const sidebar = document.getElementById('chat-sidebar');
        if (!sidebar) return;
        const icon = document.getElementById('chat-maximize-icon');
        const isMaximized = sidebar.classList.contains('fixed');

        if (!isMaximized) {
            // Expandir a Full Screen Modal
            sidebar.setAttribute('data-original-classes', sidebar.className);
            
            // Crear backdrop para click outside
            const backdrop = document.createElement('div');
            backdrop.id = 'chat-backdrop';
            backdrop.className = 'fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm';
            backdrop.onclick = () => {
                window.toggleMaximizeChat(); // Cerrar al hacer click fuera
            };
            document.body.appendChild(backdrop);
            
            sidebar.className = 'fixed inset-0 w-full h-full z-[200] bg-white flex flex-col transition-all duration-300';
            // Prevenir que clicks dentro del sidebar cierren el modal
            sidebar.onclick = (e) => e.stopPropagation();
            
            if (icon) {
                icon.setAttribute('data-lucide', 'minimize-2');
                icon.classList.remove('maximize-2');
                icon.classList.add('minimize-2');
            }
            document.body.style.overflow = 'hidden';
        } else {
            // Volver al estado original
            // Remover backdrop
            const backdrop = document.getElementById('chat-backdrop');
            if (backdrop) backdrop.remove();
            
            sidebar.className = sidebar.getAttribute('data-original-classes') || 'lg:col-span-3 sticky top-20 bg-white rounded-2xl border-2 border-black shadow-xl flex flex-col h-[450px] lg:h-[750px] overflow-hidden print:hidden transition-all';
            sidebar.onclick = null; // Remover handler
            
            if (icon) {
                icon.setAttribute('data-lucide', 'maximize-2');
                icon.classList.remove('minimize-2');
                icon.classList.add('maximize-2');
            }
            document.body.style.overflow = '';
        }

        if (window.lucide) lucide.createIcons();
        setTimeout(scrollToBottom, 50);
    };

    /**
     * El botón del header ahora dispara el maximizado
     */
    window.toggleChat = () => {
        window.toggleMaximizeChat();
    };

    /**
     * Marcar como leído al enfocar el input
     */
    if (chatInput) {
        chatInput.addEventListener('focus', markAsRead);
    }

    /**
     * Sincronizar estados (si fuera necesario en el futuro)
     */
    function syncExpandChat() {
        return; // No longer needed as we use the same sidebar element
    }

    /**
     * Obtener mensajes del servidor
     */
    async function fetchMessages() {
        if (isPolling) return;
        isPolling = true;

        try {
            const response = await fetch(`/api/proposals/${proposalId}/messages`);
            if (!response.ok) throw new Error('Error al conectar con el servidor');
            
            const data = await response.json();
            const messages = data.messages || [];
            
            // Comparar con los mensajes anteriores (JSON string para evitar re-renderizar innecesariamente)
            const currentMessagesJSON = JSON.stringify(messages);
            
            // Solo renderizar si hay cambios
            if (currentMessagesJSON !== lastMessagesJSON) {
                renderMessages(messages);
                lastMessagesJSON = currentMessagesJSON;
            }
            
            updateUnreadBadge(messages);
            lastMessageCount = messages.length;
            
        } catch (err) {
            console.error('Chat Error:', err);
        } finally {
            isPolling = false;
        }
    }

    /**
     * Renderizar lista de mensajes
     */
    function renderMessages(messages) {
        if (!messagesContainer) return;

        // Mostrar siempre todos los mensajes
        const displayMessages = messages;

        if (displayMessages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <i data-lucide="check-circle-2" class="w-8 h-8 mb-2 text-black/20"></i>
                    <p class="text-[10px] font-medium leading-tight text-black/40">No hay mensajes</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        messagesContainer.innerHTML = displayMessages.map((msg, index) => {
            const isCommercial = msg.sender_role === 'commercial' || msg.sender_role === 'admin';
            const isSystem = msg.message_body.startsWith('🚀') || msg.message_body.startsWith('🚫') || msg.message_body.startsWith('✅');
            
            if (isSystem) {
                return `
                    <div class="flex justify-center my-1.5">
                        <span class="bg-[#31713D] text-white text-[9px] px-2 py-0.5 rounded-full border border-[#31713D] uppercase tracking-tighter">
                            ${msg.message_body}
                        </span>
                    </div>
                `;
            }

            const bgColor = isCommercial ? 'bg-[#31713D] text-white' : 'bg-white border-2 border-black text-black';
            const align = isCommercial ? 'self-end items-end' : 'self-start items-start';
            const time = msg.created_at_full || (msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

            // Separador de fecha
            let dateSeparator = '';
            const msgDate = new Date(msg.created_at).toLocaleDateString();
            const prevMsg = index > 0 ? displayMessages[index-1] : null;
            const prevDate = prevMsg ? new Date(prevMsg.created_at).toLocaleDateString() : null;
            
            if (msgDate !== prevDate) {
                dateSeparator = `
                    <div class="flex justify-center my-4">
                        <span class="text-[8px] font-bold text-black/40 uppercase tracking-widest">
                            ${msgDate === new Date().toLocaleDateString() ? 'Hoy' : msgDate}
                        </span>
                    </div>
                `;
            }

            return `
                ${dateSeparator}
                <div class="flex flex-col ${align} max-w-[90%] mb-2 last:mb-0 group/msg">
                    <div class="${bgColor} px-3 py-1.5 rounded-2xl ${isCommercial ? 'rounded-tr-none' : 'rounded-tl-none'} text-[11px] whitespace-pre-wrap leading-tight shadow-sm">
                        ${msg.message_body}
                    </div>
                    <span class="text-[7px] text-black/50 mt-0.5 px-1 font-bold uppercase tracking-widest">${time}</span>
                </div>
            `;
        }).join('');
        
        if (window.lucide) lucide.createIcons();
        scrollToBottom(true); // true = animar el último mensaje
    }

    /**
     * Actualizar badge de no leídos
     */
    function updateUnreadBadge(messages) {
        if (!unreadBadge) return;
        // Solo contar los del cliente que no han sido leídos
        const unreadFromClient = messages.filter(m => m.sender_role === 'client' && m.is_read === 0).length;
        
        if (unreadFromClient > 0) {
            unreadBadge.textContent = unreadFromClient;
            unreadBadge.classList.remove('hidden');
            if (tabUnread) {
                tabUnread.textContent = unreadFromClient;
                tabUnread.classList.remove('hidden');
                tabUnread.classList.add('flex');
            }
        } else {
            unreadBadge.classList.add('hidden');
            if (tabUnread) {
                tabUnread.classList.add('hidden');
                tabUnread.classList.remove('flex');
            }
        }
    }

    /**
     * Scroll al final del chat con animación suave (solo en cambios reales)
     */
    function scrollToBottom(animate = true) {
        if (!messagesContainer) return;
        
        // Usar scroll suave (smooth scroll)
        setTimeout(() => {
            // Scroll al final del contenedor
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
            
            // Agregar pulso visual al último mensaje solo si hay cambios
            if (animate) {
                const messageElements = messagesContainer.querySelectorAll('.flex.self-end.items-end, .flex.self-start.items-start');
                if (messageElements.length > 0) {
                    // Encontrar el último mensaje (no separator o button)
                    for (let i = messageElements.length - 1; i >= 0; i--) {
                        const msg = messageElements[i];
                        if (!msg.classList.contains('mt-4')) { // Avoid the "Ver solo pendientes" button
                            msg.style.animation = 'none';
                            // Trigger reflow para reiniciar la animación
                            void msg.offsetWidth;
                            msg.style.animation = 'fadeInUp 0.6s ease-out forwards';
                            break;
                        }
                    }
                }
            }
        }, 10);
    }

    /**
     * Enviar mensaje
     */
    async function sendMessage(e) {
        if (e) e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        chatInput.disabled = true;
        sendBtn.disabled = true;
        const originalBtnContent = sendBtn.innerHTML;
        sendBtn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';

        try {
            const response = await fetch(`/api/proposals/${proposalId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_body: text })
            });

            if (!response.ok) {
                let errorMsg = 'No se pudo enviar';
                try {
                    const errData = await response.json();
                    errorMsg = errData.message || errorMsg;
                } catch(e) {}
                throw new Error(errorMsg);
            }
            
            chatInput.value = '';
            chatInput.style.height = 'auto';

            // Optimistic Update: Añadir el mensaje enviado localmente para feedback inmediato
            const now = new Date();
            const tempMessage = {
                message_body: text,
                sender_role: 'commercial',
                sender_name: 'Tú',
                created_at: now.toISOString(),
                created_at_full: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            
            // Si el contenedor estaba vacío (mostrando el placeholder de no hay mensajes)
            if (lastMessageCount <= 0) {
                messagesContainer.innerHTML = '';
            }
            
            lastMessageCount++; // Evitar que el siguiente poll re-renderice todo si el conteo coincide
            
            // Append manual
            const div = document.createElement('div');
            div.className = 'flex flex-col self-end items-end max-w-[90%] mb-4 last:mb-0';
            div.innerHTML = `
                <span class="text-[10px] text-gray-400 mb-1 px-1 font-semibold uppercase tracking-wider">Tú • ${tempMessage.created_at_full}</span>
                <div class="bg-[#31713D] text-white shadow-sm px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed">
                    ${text}
                </div>
            `;
            messagesContainer.appendChild(div);
            scrollToBottom();

            // Sincronizar con el servidor en segundo plano
            fetchMessages(); 
        } catch (err) {
            console.error('Error sending message:', err);
            // Mostrar error brevemente
            const originalInputPlaceholder = chatInput.placeholder;
            chatInput.placeholder = 'ERROR: ' + err.message.toUpperCase();
            chatInput.classList.add('border-red-500');
            setTimeout(() => {
                chatInput.placeholder = originalInputPlaceholder;
                chatInput.classList.remove('border-red-500');
            }, 3000);
        } finally {
            chatInput.disabled = false;
            sendBtn.innerHTML = originalBtnContent;
            sendBtn.disabled = (chatInput.value.length === 0);
            chatInput.focus();
        }
    }

    /**
     * Marcar como leídos
     */
    async function markAsRead() {
        if (!unreadBadge || unreadBadge.classList.contains('hidden')) return;

        try {
            await fetch(`/api/proposals/${proposalId}/messages/mark-read`, { method: 'POST' });
            unreadBadge.classList.add('hidden');
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    }

    // --- EVENTOS ---

    if (chatInput) {
        // Autogrow textarea
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            if (sendBtn) sendBtn.disabled = !chatInput.value.trim();
        });

        // Enter para enviar
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Marcar como leído al enfocar el input
        chatInput.addEventListener('focus', markAsRead);
    }

    if (chatForm) {
        chatForm.addEventListener('submit', sendMessage);
    }

    // --- INICIO ---
    fetchMessages().then(() => {
        // Scroll al último mensaje después de cargar
        setTimeout(() => {
            scrollToBottom();
        }, 100);
        
        // Después de la primera carga, si el servidor no lo hizo ya, marcamos como leído
        if (unreadBadge && !unreadBadge.classList.contains('hidden')) {
            console.log('[Chat] Mensajes no leídos detectados en carga, marcando como leídos...');
            markAsRead();
        }
    });
    setInterval(fetchMessages, 30000); // 30s polling
});

