/**
 * LÓGICA PARA EL SELECTOR DE PLATOS Y MENÚS
 * Permite buscar e importar platos o menús completos a una opción (Choice) de un servicio.
 */

if (typeof currentProposalId === 'undefined') {
    var currentProposalId = null;
    var currentOptionId = null;
    var menusData = [];
    var dishesData = [];
    var currentDishTab = 'menus'; // 'menus' o 'dishes'
}

/**
 * Abrir el selector de platos para una opción específica
 */
async function openDishSelector(proposalId, optionId, defaultTab = null) {
    currentProposalId = proposalId;
    currentOptionId = optionId;
    
    // Si viene de una opción específica (milestone), sugerimos platos sueltos
    // Si viene sin opción (importar menú al hito), sugerimos menús
    if (defaultTab) {
        currentDishTab = defaultTab;
    } else {
        currentDishTab = optionId ? 'dishes' : 'menus';
    }
    
    console.log('[Catalog] Opening for Proposal:', proposalId, 'Option:', optionId, 'Tab:', currentDishTab);
    
    // El ID en editor.ejs es dishSelectorModal
    const modal = document.getElementById('dishSelectorModal') || document.getElementById('dish-selector-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Cargar datos si no están cargados
    if (menusData.length === 0 && dishesData.length === 0) {
        await loadMenusAndDishes();
    } else {
        switchDishTab(currentDishTab);
    }
}

/**
 * Cerrar el selector
 */
function closeDishSelector() {
    const modal = document.getElementById('dishSelectorModal') || document.getElementById('dish-selector-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Cargar datos desde el servidor
 */
async function loadMenusAndDishes() {
    try {
        const container = document.getElementById('dish-items-grid');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-gray-300">
                    <div class="w-8 h-8 border-4 border-[#31713D] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p class="font-bold uppercase tracking-widest text-[10px]">Consultando Catálogo...</p>
                </div>
            `;
        }

        // Cargar Menús, Platos y CATEGORÍAS en paralelo
        const [menusRes, dishesRes, categoriesRes] = await Promise.all([
            fetch('/api/services?limit=10000'),
            fetch('/api/dishes?limit=10000'),
            fetch('/api/categories?type=dish')
        ]);

        const menusDataJson = await menusRes.json();
        const dishesDataJson = await dishesRes.json();
        const categoriesDataJson = await categoriesRes.json();

        // Extraer arrays según el formato de la API
        menusData = menusDataJson.services || (Array.isArray(menusDataJson) ? menusDataJson : []);
        dishesData = dishesDataJson.dishes || (Array.isArray(dishesDataJson) ? dishesDataJson : []);

        // Poblar el selector de categorías
        const catSelect = document.getElementById('catalog-category-filter');
        if (catSelect && categoriesDataJson.success) {
            catSelect.innerHTML = '<option value="">Categoría</option>' + 
                categoriesDataJson.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }

        console.log('[Catalog] Loaded:', { menus: menusData.length, dishes: dishesData.length });
        
        if (currentDishTab === 'dishes') {
            renderDishesTab();
        } else {
            renderMenusTab();
        }
    } catch (error) {
        console.error('Error cargando catálogo:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error al cargar catálogo', 'error');
        }
    }
}

/**
 * Renderizar la pestaña de Menús (Galería)
 */
function renderMenusTab() {
    currentDishTab = 'menus';
    renderFilteredMenus(menusData);
}

/**
 * Renderizar la pestaña de Platos (Galería)
 */
function renderDishesTab() {
    currentDishTab = 'dishes';
    renderFilteredDishes(dishesData);
}

function switchDishTab(tab) {
    currentDishTab = tab;
    
    // Actualizar UI de pestañas
    const btnMenus = document.getElementById('tab-menus');
    const btnDishes = document.getElementById('tab-dishes');
    
    if (tab === 'menus') {
        if (btnMenus) {
            btnMenus.classList.add('bg-white', 'text-[#31713D]', 'shadow-sm', 'border-gray-100');
            btnMenus.classList.remove('text-gray-500', 'hover:text-gray-900', 'border-transparent');
        }
        if (btnDishes) {
            btnDishes.classList.remove('bg-white', 'text-[#31713D]', 'shadow-sm', 'border-gray-100');
            btnDishes.classList.add('text-gray-500', 'hover:text-gray-900', 'border-transparent');
        }
        renderMenusTab();
    } else {
        if (btnDishes) {
            btnDishes.classList.add('bg-white', 'text-[#31713D]', 'shadow-sm', 'border-gray-100');
            btnDishes.classList.remove('text-gray-500', 'hover:text-gray-900', 'border-transparent');
        }
        if (btnMenus) {
            btnMenus.classList.remove('bg-white', 'text-[#31713D]', 'shadow-sm', 'border-gray-100');
            btnMenus.classList.add('text-gray-500', 'hover:text-gray-900', 'border-transparent');
        }
        renderDishesTab();
    }
}

/**
 * Renderizado de cuadrícula de platos
 */
function renderFilteredDishes(data) {
    const container = document.getElementById('dish-items-grid');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="utensils-crossed" class="w-8 h-8 text-gray-300"></i>
                </div>
                <p class="text-gray-400 font-medium italic">No se han encontrado platos individuales.</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    container.innerHTML = data.map(dish => {
        let image = dish.image_url;
        if (!image && Array.isArray(dish.images) && dish.images.length > 0) image = dish.images[0];
        
        // Formatear alérgenos como badges pequeños
        const allergens = Array.isArray(dish.allergens) ? dish.allergens : [];
        const allergensHtml = allergens.map(a => `
            <span class="bg-red-50 text-red-600 px-1.5 py-0.5 rounded-none text-[8px] font-black uppercase tracking-tighter border border-red-100">${a}</span>
        `).join('') || '<span class="text-[8px] text-gray-300 italic uppercase font-black tracking-tighter">Sin alérgenos</span>';
            
        return `
        <div class="bg-white border border-gray-100 rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
            <div class="h-44 bg-gray-50 relative overflow-hidden">
                ${image 
                    ? `<img src="${image}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">`
                    : `<div class="w-full h-full flex items-center justify-center text-gray-200">
                         <i data-lucide="utensils" class="w-12 h-12"></i>
                       </div>`
                }
                <!-- Badge de categoría overlay opcional -->
                <div class="absolute top-3 left-3">
                   <span class="bg-black/80 text-white text-[8px] px-2 py-1 uppercase font-black tracking-widest backdrop-blur-sm">${dish.category || 'Plato'}</span>
                </div>
            </div>

            <div class="p-5 flex-1 flex flex-col">
                <div class="mb-3">
                    <h3 class="text-sm font-black text-gray-900 tracking-tight leading-snug group-hover:text-[#31713D] transition-colors line-clamp-2" title="${dish.name}">
                        ${dish.name}
                    </h3>
                </div>

                <p class="text-[11px] text-gray-500 line-clamp-2 mb-4 font-medium italic leading-relaxed">
                   ${dish.description || 'Delicioso plato preparado con ingredientes frescos.'}
                </p>
                
                <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div class="flex flex-wrap gap-1 flex-1 overflow-hidden">
                        ${allergensHtml}
                    </div>
                    
                    <button onclick="addDishToOption(${dish.id})" 
                            class="bg-[#31713D] text-white p-3 rounded-none hover:bg-black transition shadow-lg shadow-green-100 active:scale-95 group/btn shrink-0">
                        <i data-lucide="plus" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
    if (window.lucide) lucide.createIcons();
}

/**
 * Añadir un Plato individual a la opción
 */
async function addDishToOption(dishId) {
    try {
        if (!currentOptionId) {
            throw new Error('Debes seleccionar un menú antes de añadir platos sueltos.');
        }

        const res = await fetch(`/api/proposals/${currentProposalId}/options/${currentOptionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                source: 'dish',
                sourceId: dishId 
            })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Error al añadir el plato');
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Plato añadido correctamente', 'success');
        }
        
        // No cerramos el selector para permitir añadir varios
        await refreshModalAfterItemChange();
    } catch (error) {
        console.error(error);
        if (typeof showNotification === 'function') {
            showNotification(error.message, 'error');
        }
    }
}

/**
 * Renderizado de cuadrícula de menús
 */
function renderFilteredMenus(data) {
    const container = document.getElementById('dish-items-grid');
    if (!container) return;

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-300"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
                </div>
                <p class="text-gray-400 font-medium italic">No se han encontrado menús en el catálogo.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = data.map(menu => {
        // Buscar la imagen en varias propiedades posibles
        let image = null;
        if (Array.isArray(menu.images) && menu.images.length > 0) image = menu.images[0];
        else if (menu.image_url) image = menu.image_url;
        else if (menu.url_images) image = menu.url_images;
            
        return `
        <div class="bg-white border border-gray-100 rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
            <!-- Imagen -->
            <div class="h-40 bg-gray-50 relative overflow-hidden cursor-help" title="Incluye: ${menu.dish_names || 'Platos por definir'}">
                ${image 
                    ? `<img src="${image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">`
                    : `<div class="w-full h-full flex items-center justify-center text-gray-200">
                         <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="m9 11 1 9"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/></svg>
                       </div>`
                }
                <!-- Badge de platos count -->
                <div class="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-none shadow-sm border border-white/20">
                    <span class="text-[9px] font-black text-gray-900 uppercase tracking-tighter">${menu.dishes_count || 0} platos</span>
                </div>
            </div>

            <div class="p-5 flex-1 flex flex-col">
                <!-- Título y Categoría fuera de la imagen para legibilidad -->
                <div class="mb-2">
                    <span class="text-[8px] text-[#31713D] uppercase font-black tracking-widest block mb-1">${menu.category || 'Gastronomía'}</span>
                    <h3 class="text-gray-900 text-sm font-black tracking-tight leading-snug group-hover:text-[#31713D] transition-colors line-clamp-2" title="${menu.name}">
                        ${menu.name}
                    </h3>
                </div>

                <p class="text-[11px] text-gray-400 line-clamp-2 mb-4 font-medium italic leading-relaxed">
                   ${menu.description || 'Menú completo diseñado para eventos corporativos.'}
                </p>
                
                <div class="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div class="flex flex-col">
                        <span class="text-[8px] text-gray-300 font-black uppercase tracking-widest mb-0.5">Precio Recomendado</span>
                        <span class="text-sm font-black text-gray-900">
                            ${Number(menu.base_price || 0).toFixed(2)}€ <small class="text-[10px] opacity-40">/ pax</small>
                        </span>
                    </div>
                    
                    <button onclick="addMenuToOption(${menu.id})" 
                            class="bg-[#31713D] text-white p-3 rounded-none hover:bg-black transition shadow-lg shadow-green-100 active:scale-95 group/btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="group-hover/btn:rotate-90 transition-transform duration-300"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                </div>
            </div>
        </div>
    `}).join('');
    if (window.lucide) lucide.createIcons();
}

/**
 * Añadir un Menú completo a la opción o crear una nueva si no hay currentOptionId
 */
async function addMenuToOption(menuId) {
    const originalOptionId = currentOptionId;
    try {
        const menuInfo = menusData.find(m => m.id === menuId);
        if (!currentOptionId) {
            const serviceId = window.currentServiceIdForImport;
            if (!serviceId) throw new Error('No se ha identificado el hito destino');

            const menuName = menuInfo ? menuInfo.name : 'Nuevo Menú';

            // 1. Crear la opción
            const optRes = await fetch(`/api/proposals/${currentProposalId}/options`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: serviceId,
                    name: menuName,
                    price_pax: menuInfo ? menuInfo.base_price : 0
                })
            });

            if (!optRes.ok) throw new Error('Error al añadir el menú al hito');
            const newOpt = await optRes.json();
            currentOptionId = newOpt.optionId; 
        }

        // 2. Importar los platos del menú a la opción
        const res = await fetch(`/api/proposals/${currentProposalId}/options/${currentOptionId}/import-menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ menuId })
        });
        
        if (!res.ok) throw new Error('Error al importar platos del menú');
        
        if (typeof showNotification === 'function') {
            const label = menuInfo ? menuInfo.name : 'Menú';
            showNotification(`✓ ${label} importado correctamente`, 'success');
        }
        
        // NO cerramos el selector para permitir meter tantos como quiera
        // closeDishSelector();
        
        // Si vinimos de importar al hito (sin opción previa), reseteamos para que 
        // el próximo clic cree una opción nueva en lugar de concatenar en la misma
        if (!originalOptionId) {
            currentOptionId = null;
        }

        await refreshModalAfterItemChange();
    } catch (error) {
        console.error(error);
        if (typeof showNotification === 'function') {
            showNotification(error.message || 'No se pudo importar el menú', 'error');
        }
    }
}

/**
 * Refrescar los datos del modal de servicio tras las importaciones
 */
async function refreshModalAfterItemChange() {
    const serviceId = document.getElementById('modal-service-id').value || window.currentServiceIdForImport;
    if (!serviceId) return;
    
    // Si estamos en el editor de propuestas, usamos las funciones globales de editor.js
    if (typeof refreshServiceData === 'function') {
        await refreshServiceData();
    } else {
        window.location.reload();
    }
}

/**
 * Filtrar menús o platos por texto y categoría en tiempo real (Catálogo)
 */
function filterCatalog() {
    const searchInput = document.getElementById('dish-search-input');
    const categoryFilter = document.getElementById('catalog-category-filter');
    
    const queryText = searchInput ? searchInput.value : '';
    const category = categoryFilter ? categoryFilter.value : '';
    
    const q = normalizeText(queryText || '');
    
    if (currentDishTab === 'menus') {
        const filtered = menusData.filter(m => {
            const matchesText = !q || (
                normalizeText(m.name).includes(q) || 
                normalizeText(m.description || '').includes(q) ||
                normalizeText(m.category || '').includes(q) ||
                normalizeText(m.dish_names || '').includes(q)
            );
            const matchesCategory = !category || m.category === category;
            return matchesText && matchesCategory;
        });
        renderFilteredMenus(filtered);
    } else {
        const filtered = dishesData.filter(d => {
            const matchesText = !q || (
                normalizeText(d.name).includes(q) || 
                normalizeText(d.description || '').includes(q) ||
                normalizeText(d.category || '').includes(q)
            );
            const matchesCategory = !category || d.category === category;
            return matchesText && matchesCategory;
        });
        renderFilteredDishes(filtered);
    }
}

/**
 * Función auxiliar para normalizar texto (acentos y mayúsculas)
 */
function normalizeText(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Alias para compatibilidad si fuera necesario
function filterDishGallery(queryText) {
    return filterCatalog(queryText);
}
