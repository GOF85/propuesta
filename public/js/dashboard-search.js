/**
 * Dashboard Search - Búsqueda AJAX en tiempo real
 * Escucha cambios en el input de búsqueda y actualiza la tabla de propuestas
 */

let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchLoading = document.getElementById('searchLoading');
  const tableContainer = document.querySelector('tbody');
  
  if (!searchInput) return;

  // Escuchar cambios en tiempo real
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    
    const searchTerm = searchInput.value.trim();
    const status = getStatusFromUI();
    
    // Pequeño delay para no hacer demasiadas llamadas
    searchTimeout = setTimeout(() => {
      performSearch(searchTerm, status);
    }, 300);
  });

  // Escuchar cambios en los filtros de estado
  document.querySelectorAll('a[href*="?status="]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Extraer status de la URL
      const url = new URL(link.href, window.location.origin);
      const status = url.searchParams.get('status') || 'all';
      
      // Actualizar tabs visualmente
      updateStatusTabs(status);
      
      // Obtener búsqueda actual
      const searchTerm = searchInput.value.trim();
      
      // Buscar con nuevo status
      performSearch(searchTerm, status);
    });
  });
});

/**
 * Obtiene el status actual de la UI
 */
function getStatusFromUI() {
  // Ahora buscamos el diseño de pill activa (bg-white y shadow-sm)
  const activeTab = document.querySelector('a.bg-white.shadow-sm');
  if (activeTab) {
    const url = new URL(activeTab.href, window.location.origin);
    return url.searchParams.get('status') || 'all';
  }
  return 'all';
}

/**
 * Realiza la búsqueda AJAX
 */
async function performSearch(searchTerm, status) {
  const searchInput = document.getElementById('searchInput');
  const searchLoading = document.getElementById('searchLoading');
  const tableContainer = document.querySelector('tbody');
  const tableWrapper = document.querySelector('table');
  
  if (!tableContainer) return;

  // Mostrar indicador de carga
  searchLoading?.classList.remove('hidden');

  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (status && status !== 'all') params.append('status', status);

    const response = await fetch(`/api/dashboard/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Error en la búsqueda');
    }

    const data = await response.json();

    if (data.success) {
      // Ocultar paginación durante la búsqueda AJAX ya que los datos de página cambian
      const paginationDiv = document.querySelector('.bg-gray-50\\/50.border-t');
      if (paginationDiv) paginationDiv.style.display = 'none';

      // Limpiar tabla actual
      tableContainer.innerHTML = '';

      if (data.proposals.length === 0) {
        // Empty state
        if (tableWrapper) {
          tableWrapper.closest('.bg-white').innerHTML = `
            <div class="p-12 text-center">
              <div class="text-5xl mb-4">📋</div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">No hay propuestas</h3>
              <p class="text-gray-500 mb-6">
                ${searchTerm 
                  ? `No se encontraron resultados para "${searchTerm}"` 
                  : `No tienes propuestas con ese filtro`
                }
              </p>
              <a href="/proposal/new" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                + Crear Propuesta
              </a>
            </div>
          `;
        }
      } else {
        // Renderizar propuestas
        data.proposals.forEach(proposal => {
          const row = createProposalRow(proposal);
          tableContainer.appendChild(row);
        });
        
        // Re-inicializar iconos Lucide después de la búsqueda
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }
      }
    }
  } catch (error) {
    console.error('Error en búsqueda:', error);
    // Mostrar error sin romper la UI
  } finally {
    // Ocultar indicador de carga
    searchLoading?.classList.add('hidden');
  }
}

/**
 * Crea una fila de propuesta para la tabla
 */
function createProposalRow(proposal) {
  const row = document.createElement('tr');
  const hasUnread = proposal.unread_messages > 0;
  const isAnulada = proposal.status === 'Anulada' || proposal.status === 'cancelled';
  const hasSelectedVenue = !!proposal.has_selected_venue;
  
  row.className = `hover:bg-gray-50 transition-colors group cursor-pointer border-l-4 ${hasUnread ? 'bg-orange-50/30 border-l-orange-500 shadow-[inset_0_0_10px_rgba(255,165,0,0.05)]' : 'border-l-transparent'} ${isAnulada ? 'bg-red-50/40' : ''}`;
  row.onclick = () => window.location.href = `/proposal/${proposal.id}/edit`;
  
  // Mapear colores de estado
  const statusColorMap = {
    'Pipe': 'bg-gray-100 text-gray-700 border-gray-200',
    'draft': 'bg-gray-100 text-gray-700 border-gray-200',
    'sent': 'bg-gray-100 text-gray-700 border-gray-200',
    'Aceptada': 'bg-green-100 text-[#31713D] border-green-200',
    'accepted': 'bg-green-100 text-[#31713D] border-green-200',
    'Anulada': 'bg-red-100 text-red-700 border-red-200',
    'cancelled': 'bg-red-100 text-red-700 border-red-200'
  };

  const statusColor = statusColorMap[proposal.status] || 'bg-gray-100 text-gray-700 border-gray-200';
  
  let venueDisplayHtml = '';
  if (proposal.venue_names) {
    venueDisplayHtml = `
      <div class="flex items-center gap-1.5">
        ${hasSelectedVenue ? `<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-green-600"></i>` : ''}
        <span>${proposal.venue_names}</span>
      </div>
    `;
  } else {
    venueDisplayHtml = '<span class="inline-block bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded text-[10px] border border-yellow-200">Sin venue definido</span>';
  }

  const actionsHtml = proposal.status === 'Anulada'
    ? `
      <div class="flex flex-wrap justify-end gap-1.5 items-center print-hidden">
        <a href="/p/${escapeHtml(proposal.unique_hash)}" target="_blank"
           class="p-1.5 text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 inline-flex items-center"
           title="Ver propuesta como cliente"
           onclick="event.stopPropagation()">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </a>
        <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold border border-red-200 bg-red-50 text-red-700">
          Anulada
        </span>
      </div>
    `
    : `
      <div class="flex flex-wrap justify-end gap-1.5 items-center print-hidden">
        <a href="/p/${escapeHtml(proposal.unique_hash)}" target="_blank"
           class="p-1.5 text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 inline-flex items-center"
           title="Ver propuesta como cliente"
           onclick="event.stopPropagation()">
          <i data-lucide="eye" class="w-4 h-4"></i>
        </a>

        <form method="POST" action="/proposal/${proposal.id}/duplicate" style="display: inline;">
          <button type="submit"
                  class="p-1.5 text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 inline-flex items-center"
                  title="Duplicar propuesta"
                  onclick="event.stopPropagation(); return confirm('¿Duplicar esta propuesta?')">
            <i data-lucide="copy" class="w-4 h-4"></i>
          </button>
        </form>

        <form method="POST" action="/proposal/${proposal.id}/delete" style="display: inline;">
          <button type="submit"
                  class="p-1.5 text-black hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 inline-flex items-center"
                  title="Eliminar propuesta"
                  onclick="event.stopPropagation(); return confirm('¿Estás seguro? Esta acción no se puede deshacer.')">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </form>
      </div>
    `;

  row.innerHTML = `
    <!-- Notif -->
    <td class="px-2 py-2 text-center">
      ${hasUnread ? `
        <div class="flex items-center justify-center">
          <span class="flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full shadow-sm animate-pulse" title="${proposal.unread_messages} mensajes nuevos">
            ${proposal.unread_messages}
          </span>
        </div>
      ` : `
        <div class="flex items-center justify-center text-gray-200 group-hover:text-gray-300">
          <i data-lucide="message-square" class="w-3.5 h-3.5 opacity-20"></i>
        </div>
      `}
    </td>
    <!-- OV -->
    <td class="px-4 py-2">
      <div class="flex flex-col">
        <span class="text-sm font-bold text-[#31713D] uppercase tracking-tight">
          ${proposal.custom_ref || 'Sin Ref.'}
        </span>
        <span class="text-[9px] font-mono text-gray-400 mt-0.5">
          ID: #${proposal.id.toString().padStart(4, '0')}
        </span>
      </div>
    </td>
    <!-- Cliente / Evento -->
    <td class="px-4 py-2">
      <div class="flex items-center gap-2">
        <div class="font-bold text-sm ${isAnulada ? 'text-red-800 line-through' : 'text-gray-900'}">${escapeHtml(proposal.client_name)}</div>
      </div>
    </td>

    <!-- Fecha Evento -->
    <td class="px-4 py-2 text-xs ${isAnulada ? 'text-red-700/70' : 'text-gray-600'}">
      <div>${proposal.formattedDate}</div>
      <div class="text-[10px] mt-0.5 ${isAnulada ? 'text-red-600/60' : 'text-gray-400'}">${proposal.pax} Pax</div>
    </td>

    <!-- Venue -->
    <td class="px-4 py-2 text-xs ${isAnulada ? 'text-red-700/70' : 'text-gray-600'}">
      ${venueDisplayHtml}
    </td>

    <!-- Importe Estimado -->
    <td class="px-4 py-2 text-right">
      <div class="font-bold text-xs ${isAnulada ? 'text-red-800' : 'text-gray-900'}">
        ${proposal.total > 0 ? proposal.formattedTotal : '<span class="text-gray-400">--</span>'}
      </div>
    </td>

    <!-- Estado -->
    <td class="px-4 py-2 text-center">
      <div class="inline-block">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}">
          ${proposal.statusLabel}
        </span>
      </div>
    </td>

    <!-- Revisión (is_editing) -->
    <td class="px-4 py-2 text-center">
        <label class="relative inline-flex items-center cursor-pointer" onclick="event.stopPropagation()">
            <input type="checkbox" 
                   class="sr-only peer" 
                   ${proposal.is_editing ? 'checked' : ''}
                   onchange="toggleRevision(${proposal.id}, this.checked)">
            <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#31713D]"></div>
        </label>
    </td>

    <!-- Acciones -->
    <td class="px-4 py-2 text-right">
      ${actionsHtml}
    </td>
  `;

  return row;
}

/**
 * Actualiza visualmente las tabs de estado
 */
function updateStatusTabs(selectedStatus) {
  document.querySelectorAll('a[href*="?status="]').forEach(link => {
    const url = new URL(link.href, window.location.origin);
    const status = url.searchParams.get('status') || 'all';
    
    if (status === selectedStatus) {
      // Activar (Pill design)
      link.classList.remove('text-gray-500', 'hover:text-gray-700');
      link.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
    } else {
      // Desactivar
      link.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
      link.classList.add('text-gray-500', 'hover:text-gray-700');
    }
  });
}

/**
 * Escapa caracteres HTML para evitar XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, m => map[m]);
}
