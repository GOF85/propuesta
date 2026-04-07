// venues-search.js
// Buscador en tiempo real para venues-list.ejs (Panel Admin)

function setupVenueSearch() {
  const searchInput = document.getElementById('venue-search-input');
  if (!searchInput) return;

  // Obtener todas las cards del catálogo
  function getVenueCards() {
    return Array.from(document.querySelectorAll('.grid > div.bg-white.border.border-gray-200.rounded-xl'));
  }

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();
    const cards = getVenueCards();
    let visibleCount = 0;

    cards.forEach(card => {
      const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const address = card.querySelector('p')?.textContent.toLowerCase() || '';
      
      if (name.includes(query) || address.includes(query)) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Actualizar contador si existe
    const counter = document.getElementById('venue-count-all');
    if (counter) counter.textContent = visibleCount;
  });
}

window.addEventListener('DOMContentLoaded', setupVenueSearch);
