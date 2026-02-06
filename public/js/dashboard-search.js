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
  const activeTab = document.querySelector('a[class*="text-blue-600"][class*="border-blue-600"]');
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
  row.className = `hover:bg-gray-50 transition-colors group ${proposal.status === 'cancelled' ? 'bg-red-50/40' : ''}`;
  
  // Mapear colores de estado
  const statusColorMap = {
    'draft': 'bg-gray-100 text-gray-700 border-gray-200',
    'sent': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'accepted': 'bg-green-100 text-green-700 border-green-200',
    'cancelled': 'bg-red-100 text-red-700 border-red-200'
  };

  const statusColor = statusColorMap[proposal.status] || 'bg-gray-100 text-gray-700 border-gray-200';
  const venueDisplay = proposal.venue_names 
    ? proposal.venue_names 
    : '<span class="inline-block bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs border border-yellow-200">Sin venue definido</span>';

  const actionsHtml = proposal.status === 'cancelled'
    ? `
      <div class="flex justify-end gap-2 items-center print-hidden">
        <a href="/p/${escapeHtml(proposal.unique_hash)}" target="_blank"
           class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors border border-emerald-200 inline-flex items-center gap-1.5"
           title="Ver propuesta como cliente">
          👁️ Ver
        </a>
        <span class="px-3 py-1 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700">
          Acciones deshabilitadas
        </span>
      </div>
    `
    : `
      <div class="flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity print-hidden">
        <a href="/p/${escapeHtml(proposal.unique_hash)}" target="_blank"
           class="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors border border-emerald-200 inline-flex items-center gap-1.5"
           title="Ver propuesta como cliente">
          👁️ Ver
        </a>

        <div class="relative group/menu">
          <button class="text-gray-400 hover:text-gray-600 transition-colors text-lg" title="Más opciones">
            ⋮
          </button>
          <div class="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover/menu:block opacity-0 group-hover/menu:opacity-100 transition-opacity z-50">
            <a href="/proposal/${proposal.id}/edit"
               class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 first:rounded-t-lg"
               title="Editar propuesta">
              ✏️ Editar
            </a>

            <button onclick="copyToClipboard('/p/${escapeHtml(proposal.unique_hash)}')"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
                    title="Copiar enlace para compartir">
              🔗 Copiar enlace
            </button>

            <a href="/proposal/${proposal.id}/chat"
               class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
               title="Chat con cliente">
              💬 Chat
            </a>

            <form method="POST" action="/proposal/${proposal.id}/duplicate" style="display: contents;">
              <button type="submit"
                      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50"
                      title="Duplicar propuesta"
                      onclick="return confirm('¿Duplicar esta propuesta?')">
                📋 Duplicar
              </button>
            </form>

            <form method="POST" action="/proposal/${proposal.id}/delete" style="display: contents;">
              <button type="submit"
                      class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                      title="Eliminar propuesta"
                      onclick="return confirm('¿Estás seguro? Esta acción no se puede deshacer.')">
                🗑️ Eliminar
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

  row.innerHTML = `
    <!-- Cliente / Evento -->
    <td class="px-6 py-4">
      <div class="font-bold ${proposal.status === 'cancelled' ? 'text-red-800 line-through' : 'text-gray-900'}">${escapeHtml(proposal.client_name)}</div>
    </td>

    <!-- Fecha Evento -->
    <td class="px-6 py-4 text-sm ${proposal.status === 'cancelled' ? 'text-red-700/70' : 'text-gray-600'}">
      <div>${proposal.formattedDate}</div>
      <div class="text-xs mt-1 ${proposal.status === 'cancelled' ? 'text-red-600/60' : 'text-gray-400'}">${proposal.pax} Pax</div>
    </td>

    <!-- Venue -->
    <td class="px-6 py-4 text-sm ${proposal.status === 'cancelled' ? 'text-red-700/70' : 'text-gray-600'}">
      ${venueDisplay}
    </td>

    <!-- Importe Estimado -->
    <td class="px-6 py-4 text-right">
      <div class="font-bold text-sm ${proposal.status === 'cancelled' ? 'text-red-800' : 'text-gray-900'}">
        ${proposal.total > 0 ? proposal.formattedTotal : '<span class="text-gray-400">--</span>'}
      </div>
    </td>

    <!-- Estado -->
    <td class="px-6 py-4 text-center">
      <div class="inline-block">
        <span class="px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}">
          ${proposal.statusLabel}
        </span>
      </div>
    </td>

    <!-- Acciones -->
    <td class="px-6 py-4 text-right">
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
      // Activar
      link.classList.remove('text-gray-500', 'hover:text-gray-700');
      link.classList.add('text-blue-600', 'border-b-2', 'border-blue-600', '-mb-0');
    } else {
      // Desactivar
      link.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600', '-mb-0');
      link.classList.add('text-gray-500', 'hover:text-gray-700');
    }
  });
}

/**
 * Escapa caracteres HTML para evitar XSS
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
