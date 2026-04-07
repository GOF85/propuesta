    ; __append("<!DOCTYPE html>\n<html lang=\"es\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Propuesta de Catering - MICE</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <link rel=\"stylesheet\" href=\"/css/professional.css\">\n    \n    <!-- 🎨 INYECCIÓN DINÁMICA DE BRANDING -->\n    <style>\n      html {\n        scroll-behavior: smooth;\n      }\n      :root {\n        /* Colores dinámicos generados desde logo */\n        --brand-primary: ")
    ; __line = 17
    ; __append(escapeFn( brandPalette.primary ))
    ; __append(";\n        --brand-primary-rgb: ")
    ; __line = 18
    ; __append(escapeFn( brandPalette.primaryRgb ))
    ; __append(";\n        --brand-hover: ")
    ; __line = 19
    ; __append(escapeFn( brandPalette.hover ))
    ; __append(";\n        --brand-light: ")
    ; __line = 20
    ; __append(escapeFn( brandPalette.light ))
    ; __append(";\n        --brand-dark: ")
    ; __line = 21
    ; __append(escapeFn( brandPalette.dark ))
    ; __append(";\n        --brand-text: ")
    ; __line = 22
    ; __append(escapeFn( brandPalette.text ))
    ; __append(";\n        --brand-complement: ")
    ; __line = 23
    ; __append(escapeFn( brandPalette.complement ))
    ; __append(";\n      }\n\n      /* Aplicar branding dinámico */\n      .brand-bg { background-color: var(--brand-primary) !important; }\n      .brand-bg-light { background-color: var(--brand-light) !important; }\n      .brand-text { color: var(--brand-primary) !important; }\n      .brand-contrast { color: var(--brand-text) !important; }\n      .brand-border { border-color: var(--brand-primary) !important; }\n      .brand-hover:hover { background-color: var(--brand-hover) !important; }\n      \n      /* Utilities para contraste dinámico */\n      .group:hover .group-hover\\:brand-contrast { color: var(--brand-text) !important; }\n      .group:hover .group-hover\\:brand-bg { background-color: var(--brand-primary) !important; }\n      \n      /* Botones con marca */\n      .btn-brand {\n        background-color: var(--brand-primary);\n        color: var(--brand-text);\n        border: none;\n      }\n      .btn-brand:hover {\n        background-color: var(--brand-hover);\n      }\n\n      /* Animaciones para selección de menú */\n      .menu-option-card {\n        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);\n      }\n\n      /* Estilos para propuesta aceptada */\n      .accepted-stamp {\n        transform: rotate(-15deg);\n        border: 4px solid #31713D;\n        color: #31713D;\n        display: inline-block;\n        padding: 0.5rem 1rem;\n        font-weight: 900;\n        text-transform: uppercase;\n        letter-spacing: 0.2em;\n        position: absolute;\n        top: 2rem;\n        right: 2rem;\n        background: rgba(255, 255, 255, 0.9);\n        z-index: 30;\n        box-shadow: 0 0 20px rgba(49, 113, 61, 0.2);\n      }\n      \n      .success-gradient {\n        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);\n      }\n\n      /* 🎬 WOW ANIMATIONS */\n      @keyframes revealUp {\n        0% { opacity: 0; transform: translateY(40px) scale(0.98); }\n        100% { opacity: 1; transform: translateY(0) scale(1); }\n      }\n\n      @keyframes revealRight {\n        0% { opacity: 0; transform: translateX(-30px); }\n        100% { opacity: 1; transform: translateX(0); }\n      }\n\n      @keyframes slideInBar {\n        0% { transform: scaleX(0); opacity: 0; }\n        100% { transform: scaleX(1); opacity: 1; }\n      }\n\n      .reveal-wow {\n        opacity: 0;\n        animation: revealUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;\n      }\n\n      @keyframes fadeIn {\n        from { opacity: 0; transform: translateY(10px); }\n        to { opacity: 1; transform: translateY(0); }\n      }\n      .animate-fadeIn {\n        animation: fadeIn 0.3s ease-out forwards;\n      }\n\n      .stagger-1 { animation-delay: 0.1s; }\n      .stagger-2 { animation-delay: 0.2s; }\n      .stagger-3 { animation-delay: 0.3s; }\n      .stagger-4 { animation-delay: 0.4s; }\n      .stagger-5 { animation-delay: 0.5s; }\n\n      .reveal-text {\n        animation: revealRight 1s cubic-bezier(0.16, 1, 0.3, 1) both;\n      }\n\n      /* Blur effect on scroll preparation */\n      .scroll-reveal {\n        opacity: 0;\n        transform: translateY(30px);\n        transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);\n      }\n\n      .scroll-reveal.visible {\n        opacity: 1;\n        transform: translateY(0);\n      }\n\n      /* 🚫 REMOVE ALL ROUNDED CORNERS EXCEPT HERO */\n      *, *::before, *::after {\n        border-radius: 0 !important;\n      }\n      .hero-print {\n        border-radius: 0.75rem !important;\n      }\n      .hero-bg-layer {\n        border-radius: 0.75rem !important;\n      }\n\n      .service-item-description {\n        display: -webkit-box;\n        -webkit-box-orient: vertical;\n        -webkit-line-clamp: 5;\n        line-clamp: 5;\n        overflow: hidden;\n      }\n\n      @media (min-width: 768px) {\n        .service-item-description {\n          display: block;\n          -webkit-line-clamp: unset;\n          line-clamp: unset;\n          overflow: visible;\n        }\n      }\n    </style>\n</head>\n<body class=\"bg-gray-50\">\n    \n    ")
    ; __line = 157
    ; __append( include('../partials/header-client') )
    ; __append("\n\n    ")
    ; __line = 159
    ;  
      // Identificar venue seleccionado
      const selectedVenue = proposal.venues.find(v => v.is_selected);
      const otherVenues = proposal.venues.filter(v => !v.is_selected);
      
      // Helper para parsear imágenes de forma ultra-robusta
      const parseImages = (imgStr) => {
        if (!imgStr) return [];
        
        // Si ya es un array (parseado por el driver)
        if (Array.isArray(imgStr)) {
          return imgStr.map(img => (typeof img === 'string' ? img.replace(/[\n\r]/g, '').trim() : img)).filter(Boolean);
        }
        
        try {
          // Limpiar carácteres invisibles y saltos de línea
          const cleanStr = String(imgStr).replace(/[\n\r]/g, '').trim();
          
          // Caso 1: JSON estándar
          if (cleanStr.startsWith('[') || cleanStr.startsWith('{')) {
            const parsed = JSON.parse(cleanStr);
            if (Array.isArray(parsed)) {
              return parsed.map(img => (typeof img === 'string' ? img.replace(/[\n\r]/g, '').trim() : img)).filter(Boolean);
            }
          }
          
          // Caso 2: Lista separada por comas (fallback)
          if (cleanStr.includes('/uploads/')) {
             return cleanStr.split(',').map(s => s.trim().replace(/[\[\]"']/g, '')).filter(Boolean);
          }
        } catch (e) {
          // Silenciar error y usar fallback regex
        }
        
        // Fallback final: Búsqueda por regex de rutas de /uploads/
        const matches = String(imgStr).match(/\/uploads\/[^"'\s,\]]+/g);
        if (matches) {
          return matches.map(m => m.replace(/[\]"']/g, '').trim());
        }
        
        return [];
      };

      // Definir si la propuesta está bloqueada (ya aceptada)
      const isLocked = ['Aceptada', 'accepted'].includes(proposal.status);
    
    ; __line = 204
    ; __append("\n\n<main class=\"min-h-screen bg-gray-50/50\" data-proposed-venues='")
    ; __line = 206
    ; __append( JSON.stringify(proposal.venues || []) )
    ; __append("'>\n\n  <div class=\"max-w-7xl mx-auto px-4 py-8\">\n\n    <!-- Hero Header Section -->\n    ")
    ; __line = 211
    ;  
      const venueFirstImg = selectedVenue ? parseImages(selectedVenue.images)[0] : null; 
    
    ; __line = 213
    ; __append("\n    <div class=\"mb-8 bg-gray-900 overflow-hidden relative min-h-[380px] flex items-center rounded-xl border border-black shadow-2xl hero-print reveal-wow\">\n      <!-- Background Image with more focus -->\n      <div class=\"absolute inset-0 z-0 text-white/10 uppercase font-black text-[12vw] flex items-center justify-center opacity-10 pointer-events-none select-none hero-bg-layer\">\n        MICE CATERING\n      </div>\n      <div class=\"absolute inset-0 z-0 hero-bg-layer\">\n        ")
    ; __line = 220
    ;  if (venueFirstImg) { 
    ; __append("\n          <img src=\"")
    ; __line = 221
    ; __append(escapeFn( venueFirstImg ))
    ; __append("\" class=\"w-full h-full object-cover opacity-80 hero-bg-layer\" alt=\"\">\n        ")
    ; __line = 222
    ;  } 
    ; __append("\n        <div class=\"absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent hero-bg-layer\"></div>\n      </div>\n\n      <div class=\"relative z-10 w-full px-10 py-8 flex flex-col justify-between min-h-[380px]\">\n        \n        <!-- Logo Empresa & Status (Top Left) -->\n        <div class=\"absolute top-8 left-8 z-30 flex flex-col items-start gap-4\">\n          <!-- Logo Mi Empresa -->\n          <div class=\"bg-white p-4 border border-black shadow-xl reveal-text\">\n            <img src=\"/logomice.png\" alt=\"MICE Catering\" class=\"h-10 w-auto object-contain\">\n          </div>\n\n          <!-- Badge Presupuesto Aprobado (Current style) -->\n          ")
    ; __line = 236
    ;  if (proposal.status === 'Aceptada' || proposal.status === 'accepted') { 
    ; __append("\n            <div class=\"flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-2.5 border-l-4 border-[#31713D] shadow-2xl animate-in fade-in slide-in-from-left duration-700\">\n               <div class=\"w-8 h-8 bg-[#31713D] text-white rounded-none flex items-center justify-center shadow-lg\">\n                 <i data-lucide=\"check\" class=\"w-5 h-5\"></i>\n               </div>\n               <div>\n                 <h2 class=\"text-[12px] font-black text-gray-900 tracking-tight leading-none uppercase\">Presupuesto Aprobado</h2>\n                 <p class=\"text-[8px] font-bold text-black uppercase tracking-widest mt-0.5\">ESTADO: CONFIRMADO</p>\n               </div>\n            </div>\n          ")
    ; __line = 246
    ;  } 
    ; __append("\n        </div>\n\n        <!-- Top Right: Client Logo (Kept as is for branding) -->\n        <div class=\"absolute top-8 right-8 z-20\">\n          ")
    ; __line = 251
    ;  if (proposal.logo_url) { 
    ; __append("\n            <div class=\"bg-white p-4 border border-black shadow-xl reveal-text\">\n              <img src=\"")
    ; __line = 253
    ; __append(escapeFn( proposal.logo_url ))
    ; __append("\" alt=\"")
    ; __append(escapeFn( proposal.client_name ))
    ; __append("\" \n                  class=\"max-h-12 md:max-h-16 w-auto object-contain\">\n            </div>\n          ")
    ; __line = 256
    ;  } 
    ; __append("\n        </div>\n\n        <!-- Bottom Section (Name & Ref Left) -->\n        <div class=\"flex justify-start items-end w-full mt-auto\">\n          <div class=\"space-y-2\">\n            <h1 class=\"text-5xl md:text-6xl font-black text-white tracking-tighter leading-[0.9] m-0 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)]\">\n              ")
    ; __line = 263
    ; __append(escapeFn( proposal.client_name ))
    ; __append("\n            </h1>\n            <p class=\"text-[10px] text-white font-black flex items-center gap-2 uppercase tracking-[0.3em] drop-shadow-md opacity-90\">\n              <i data-lucide=\"hash\" class=\"w-3.5 h-3.5 text-white\"></i>\n              REF: ")
    ; __line = 267
    ; __append(escapeFn( proposal.custom_ref || 'OF-' + proposal.unique_hash.substring(0,8).toUpperCase() ))
    ; __append("\n            </p>\n          </div>\n        </div>\n      </div>\n\n      <!-- Bottom Right: Venue Name (Mirroring REF style) -->\n      ")
    ; __line = 274
    ;  if (selectedVenue) { 
    ; __append("\n        <div class=\"absolute bottom-0 right-0 z-20 p-6 md:p-8 text-right\">\n          <p class=\"text-[10px] text-white font-black flex items-center justify-end gap-2 uppercase tracking-[0.3em] drop-shadow-md opacity-90 leading-none\">\n            ")
    ; __line = 277
    ; __append(escapeFn( selectedVenue.name ))
    ; __append("\n            <i data-lucide=\"map-pin\" class=\"w-3.5 h-3.5 text-white\"></i>\n          </p>\n        </div>\n      ")
    ; __line = 281
    ;  } 
    ; __append("\n    </div>\n\n    <!-- Main Content (Single Column) -->\n    <div class=\"space-y-6 pb-8\">\n\n        <!-- Venues Section (Only shown if NO venue is selected) -->\n        ")
    ; __line = 288
    ;  const anyVenueSelected = proposal.venues && proposal.venues.some(v => v.is_selected || v.is_selected === 1 || v.is_selected === "1"); 
    ; __append("\n        ")
    ; __line = 289
    ;  if (!anyVenueSelected) { 
    ; __append("\n          <div class=\"card overflow-hidden p-0 border-none shadow-none\" id=\"venues-section\" data-any-venue-selected=\"")
    ; __line = 290
    ; __append(escapeFn( anyVenueSelected ? 'true' : 'false' ))
    ; __append("\">\n            <div class=\"brand-bg px-8 py-5 flex items-center justify-between cursor-pointer group\" onclick=\"toggleVenuesSection()\">\n              <h2 class=\"font-black uppercase tracking-widest text-[11px] flex items-center\">\n                <span class=\"bg-white px-4 py-2 flex items-center gap-2 shadow-sm\">\n                  <i data-lucide=\"map\" class=\"text-[#31713D] w-4 h-4\"></i> \n                  <span class=\"text-black\">Espacios Propuestos</span>\n                </span>\n              </h2>\n              <div class=\"flex items-center gap-4\">\n                ")
    ; __line = 299
    ;  if (proposal.venues && proposal.venues.length > 0) { 
    ; __append("\n                  <span class=\"bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-bold px-3 py-1 rounded-none border uppercase tracking-tighter\">\n                    ")
    ; __line = 301
    ; __append(escapeFn( proposal.venues.length ))
    ; __append(" Opciones\n                  </span>\n                ")
    ; __line = 303
    ;  } 
    ; __append("\n                <i data-lucide=\"chevron-down\" id=\"venues-toggle-icon\" class=\"w-4 h-4 transition-transform duration-300 rotate-180 text-white/40 group-hover:text-white\"></i>\n              </div>\n            </div>\n\n            <div id=\"venues-container\" class=\"p-6\">\n              ")
    ; __line = 309
    ;  if (proposal.venues && proposal.venues.length > 0) { 
    ; __append("\n                <div class=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n                  ")
    ; __line = 311
    ;  proposal.venues.forEach((venue, idx) => { 
    ; __append("\n                    <div class=\"group relative bg-white border border-black rounded-none overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer\"\n                         data-venue='")
    ; __line = 313
    ; __append( JSON.stringify(venue).replace(/'/g, "&#39;") )
    ; __append("'\n                         onclick=\"openVenueModal(this.dataset.venue)\">\n\n                      <div class=\"p-6\">\n                        <h3 class=\"text-2xl font-black text-gray-900 mb-6 group-hover:brand-text transition-colors leading-tight\">\n                          ")
    ; __line = 318
    ; __append(escapeFn( venue.name ))
    ; __append("\n                        </h3>\n\n                        <!-- Miniaturas (5) -->\n                        ")
    ; __line = 322
    ;  const venueImages = parseImages(venue.images); 
    ; __append("\n                        <div class=\"flex gap-2\">\n                          ")
    ; __line = 324
    ;  for(let i=0; i < 5; i++) { 
    ; __append("\n                            <div class=\"flex-1 aspect-square bg-gray-100 overflow-hidden border border-black italic text-[8px] text-gray-300 flex items-center justify-center\">\n                              ")
    ; __line = 326
    ;  if (venueImages[i]) { 
    ; __append("\n                                <img src=\"")
    ; __line = 327
    ; __append(escapeFn( venueImages[i] ))
    ; __append("\" class=\"w-full h-full object-cover\" alt=\"Vista ")
    ; __append(escapeFn( i+1 ))
    ; __append("\">\n                              ")
    ; __line = 328
    ;  } else { 
    ; __append("\n                                <i data-lucide=\"image\" class=\"w-4 h-4 opacity-20\"></i>\n                              ")
    ; __line = 330
    ;  } 
    ; __append("\n                            </div>\n                          ")
    ; __line = 332
    ;  } 
    ; __append("\n                        </div>\n                      </div>\n                    </div>\n                  ")
    ; __line = 336
    ;  }); 
    ; __append("\n                </div>\n              ")
    ; __line = 338
    ;  } else { 
    ; __append("\n                <div class=\"text-center py-12 bg-gray-50 rounded-none border-2 border-dashed border-black\">\n                  <i data-lucide=\"building-2\" class=\"w-12 h-12 text-gray-300 mx-auto mb-3\"></i>\n                  <p class=\"text-black font-medium\">No hay espacios específicos asignados a esta propuesta</p>\n                </div>\n              ")
    ; __line = 343
    ;  } 
    ; __append("\n            </div>\n          </div>\n        ")
    ; __line = 346
    ;  } 
    ; __append("\n\n        <script>\n          function toggleVenuesSection() {\n            const container = document.getElementById('venues-container');\n            const icon = document.getElementById('venues-toggle-icon');\n            const section = document.getElementById('venues-section');\n            const isVenueSelected = section ? section.getAttribute('data-any-venue-selected') === 'true' : false;\n            \n            if (container.classList.contains('hidden')) {\n              container.classList.remove('hidden');\n              container.classList.add('p-6');\n              icon.classList.add('rotate-180');\n              section.classList.remove('opacity-70', 'scale-[0.99]');\n            } else {\n              container.classList.add('hidden');\n              container.classList.remove('p-6');\n              icon.classList.remove('rotate-180');\n              // Solo añadimos el efecto de \"menos foco\" si hay un venue seleccionado\n              if (isVenueSelected) {\n                section.classList.add('opacity-70', 'scale-[0.99]');\n              }\n            }\n          }\n        </script>\n\n        <!-- Legal Conditions -->\n        ")
    ; __line = 373
    ;  if (proposal.show_legal_conditions && proposal.legal_conditions) { 
    ; __append("\n          <div class=\"bg-gray-50/80 border-l-4 border-[#31713D] p-3 mb-4 shadow-sm scroll-reveal\">\n            <div class=\"flex items-start gap-3\">\n              <i data-lucide=\"info\" class=\"w-3.5 h-3.5 text-[#31713D] mt-0.5 opacity-70\"></i>\n              <div class=\"space-y-0.5\">\n                <span class=\"text-[8px] font-black uppercase tracking-[0.15em] text-[#31713D]/80 block mb-0.5\">Nota del Comercial</span>\n                <p class=\"text-gray-600 leading-tight whitespace-pre-wrap text-[10px] font-medium italic\">\n                  \"")
    ; __line = 380
    ; __append(escapeFn( proposal.legal_conditions ))
    ; __append("\"\n                </p>\n              </div>\n            </div>\n          </div>\n        ")
    ; __line = 385
    ;  } 
    ; __append("\n\n        ")
    ; __line = 387
    ;  if (proposal.services && proposal.services.some(s => s.start_time)) { 
    ; __append("\n          <div class=\"card overflow-hidden p-0 border-none shadow-none scroll-reveal\" id=\"timeline-section\">\n            <div class=\"brand-bg px-8 py-5 flex items-center justify-between cursor-pointer group\" onclick=\"toggleTimelineSection()\">\n              <h2 class=\"font-black uppercase tracking-widest text-[11px] flex items-center\">\n                <span class=\"bg-white px-4 py-2 flex items-center gap-2 shadow-sm\">\n                  <i data-lucide=\"clock\" class=\"text-[#31713D] w-4 h-4\"></i> \n                  <span class=\"text-black\">Cronograma Estimado</span>\n                </span>\n              </h2>\n              <i data-lucide=\"chevron-down\" id=\"timeline-toggle-icon\" class=\"w-4 h-4 text-white/40 group-hover:text-white transition-colors\"></i>\n            </div>\n\n            <div id=\"timeline-container\" class=\"hidden p-6 md:p-8 bg-white/60 border-t border-black/5\">\n              <div class=\"relative pl-6 border-l-2 border-[#31713D]/40 space-y-3 md:space-y-4\">\n                ")
    ; __line = 401
    ;  
                  const sortedTimelineServices = [...proposal.services].sort((a, b) => {
                    const dateA = a.service_date ? new Date(a.service_date) : new Date(0);
                    const dateB = b.service_date ? new Date(b.service_date) : new Date(0);
                    if (dateA - dateB !== 0) return dateA - dateB;
                    return (a.start_time || '').localeCompare(b.start_time || '');
                  });
                
    ; __line = 408
    ; __append("\n                ")
    ; __line = 409
    ;  sortedTimelineServices.forEach((s, idx) => { 
    ; __append("\n                  <div class=\"relative bg-white border border-black/10 shadow-sm px-4 py-3 md:px-6 md:py-4 hover:shadow-md transition-all min-h-[96px]\">\n                    <div class=\"absolute -left-[34px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-none bg-white border-4 border-[#31713D] shadow-sm z-10\"></div>\n                    <div class=\"grid grid-cols-1 md:grid-cols-[180px_1fr_190px] gap-4 md:gap-5 md:items-stretch\">\n                      <div class=\"w-full md:w-full flex-shrink-0 bg-gray-50 border border-black/10 px-3 py-2 min-h-[86px] flex flex-col justify-center\">\n                        <div class=\"text-[10px] font-black uppercase tracking-widest text-[#31713D] leading-none mb-2\">\n                          ")
    ; __line = 415
    ; __append(escapeFn( dayjs(s.service_date || proposal.event_date).format('DD MMM').toUpperCase() ))
    ; __append("\n                        </div>\n                        <div class=\"text-xl font-black text-gray-900 tracking-tighter leading-none\">\n                          ")
    ; __line = 418
    ; __append(escapeFn( s.start_time ? s.start_time.substring(0, 5) : '--:--' ))
    ; __append("\n                        </div>\n                        ")
    ; __line = 420
    ;  if (s.start_time && s.duration > 0) { 
                           const [h, m] = s.start_time.split(':').map(Number);
                           const d = new Date();
                           d.setHours(h, m + s.duration);
                        
    ; __line = 424
    ; __append("\n                          <div class=\"text-[9px] text-black/70 font-black uppercase tracking-widest mt-1 leading-none\">\n                            ↳ ")
    ; __line = 426
    ; __append(escapeFn( String(d.getHours()).padStart(2, '0') ))
    ; __append(":")
    ; __append(escapeFn( String(d.getMinutes()).padStart(2, '0') ))
    ; __append("\n                          </div>\n                        ")
    ; __line = 428
    ;  } 
    ; __append("\n                      </div>\n                      <div class=\"min-w-0 md:self-center md:min-h-[86px] flex flex-col justify-center\">\n                        <div class=\"flex items-center gap-2 mb-1 flex-wrap\">\n                          <h3 class=\"text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight leading-none\">")
    ; __line = 432
    ; __append(escapeFn( s.title ))
    ; __append("</h3>\n                          ")
    ; __line = 433
    ;  
                            let localizedType = s.type;
                            if(s.type === 'gastronomy') localizedType = 'Gastronomía';
                            else if(s.type === 'logistics') localizedType = 'Logística';
                            else if(s.type === 'staff') localizedType = 'Personal';
                            else localizedType = 'Extras';
                          
    ; __line = 439
    ; __append("\n                          <span class=\"md:hidden text-[8px] font-black text-black border border-black/80 px-2 py-0.5 rounded-none uppercase tracking-tighter bg-white\">\n                            ")
    ; __line = 441
    ; __append(escapeFn( localizedType ))
    ; __append("\n                          </span>\n                        </div>\n                        <p class=\"text-[11px] text-black/70 font-medium leading-tight italic min-h-[16px]\">")
    ; __line = 444
    ; __append(escapeFn( s.comments || '' ))
    ; __append("</p>\n                      </div>\n\n                      <div class=\"hidden md:flex md:self-stretch\">\n                        <span class=\"w-full h-full min-h-[86px] flex items-center justify-center text-[11px] font-black text-black border border-black/80 px-3 py-2 rounded-none uppercase tracking-wider bg-white text-center leading-tight\">\n                          ")
    ; __line = 449
    ; __append(escapeFn( localizedType ))
    ; __append("\n                        </span>\n                      </div>\n                    </div>\n                  </div>\n                ")
    ; __line = 454
    ;  }); 
    ; __append("\n              </div>\n            </div>\n          </div>\n\n          <script>\n            function toggleTimelineSection() {\n              const container = document.getElementById('timeline-container');\n              const icon = document.getElementById('timeline-toggle-icon');\n              if (container.classList.contains('hidden')) {\n                container.classList.remove('hidden');\n                icon.classList.add('rotate-180');\n              } else {\n                container.classList.add('hidden');\n                icon.classList.remove('rotate-180');\n              }\n            }\n          </script>\n        ")
    ; __line = 472
    ;  } 
    ; __append("\n\n        <!-- ════════════════════════════════════════════════════════ -->\n        <!-- SECCIÓN: OFERTA GASTRONÓMICA (MOSAICO) -->\n        <!-- ════════════════════════════════════════════════════════ -->\n        ")
    ; __line = 477
    ;  
          const gastroServices = (proposal.services || []).filter(s => s.type === 'gastronomy');
        
    ; __line = 479
    ; __append("\n\n        ")
    ; __line = 481
    ;  if (gastroServices.length > 0) { 
    ; __append("\n          <div class=\"card overflow-hidden p-0 mb-0 border-none shadow-none bg-transparent scroll-reveal\" id=\"gastronomia-section\">\n            <div class=\"brand-bg px-8 py-5 flex items-center justify-between group\">\n              <div class=\"flex items-center gap-4\">\n                <h2 class=\"font-black uppercase tracking-widest text-[11px] flex items-center\">\n                  <span class=\"bg-white px-4 py-2 flex items-center gap-2 shadow-sm\">\n                    <i data-lucide=\"utensils\" class=\"text-[#31713D] w-4 h-4\"></i> \n                    <span class=\"text-black\">Oferta Gastronómica</span>\n                  </span>\n                </h2>\n              </div>\n              <div class=\"flex items-center gap-2\">\n                <span class=\"text-[8px] font-bold text-white/40 uppercase tracking-widest\">Mosaico de opciones</span>\n              </div>\n            </div>\n\n            <div class=\"space-y-8\">\n              ")
    ; __line = 498
    ;  gastroServices.forEach(service => { 
    ; __append("\n                ")
    ; __line = 499
    ;  
                  const rawSelectedIndex = service.selected_option_index;
                  const hasDecision = !(rawSelectedIndex === null || rawSelectedIndex === undefined || rawSelectedIndex === '');
                  const selectedIndex = hasDecision ? Number(rawSelectedIndex) : null;
                  const isInvalidDecision = hasDecision && Number.isNaN(selectedIndex);
                  const isCancelled = !isInvalidDecision && selectedIndex === -1;
                  const isPending = !hasDecision || isInvalidDecision;
                  const isAdded = !isPending && (service.is_multichoice ? selectedIndex >= 0 : selectedIndex === 0);
                  const showHeaderEconomics = isAdded;
                  const servicePax = service.pax || proposal.pax;
                  const serviceSubtotal = (service.price_per_pax || 0) * servicePax;
                
    ; __line = 510
    ; __append("\n                <div id=\"service-card-")
    ; __line = 511
    ; __append(escapeFn( service.id ))
    ; __append("\" class=\"bg-white rounded-none shadow-xl overflow-hidden border transition-all hover:shadow-2xl ")
    ; __append(escapeFn( isCancelled ? 'border-gray-200' : 'border-black' ))
    ; __append("\">\n                  <!-- Service Header -->\n                  <div class=\"")
    ; __line = 513
    ; __append(escapeFn( isCancelled ? 'px-10 py-2' : 'px-10 py-3' ))
    ; __append(" border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 ")
    ; __append(escapeFn( isCancelled ? 'bg-gray-50' : 'bg-gradient-to-r from-gray-50 to-white' ))
    ; __append("\">\n                    <div class=\"space-y-1\">\n                      <div class=\"flex items-center gap-3 flex-wrap\">\n                        <span class=\"w-1.5 h-6 ")
    ; __line = 516
    ; __append(escapeFn( isCancelled ? 'bg-gray-300' : 'bg-[#31713D]' ))
    ; __append(" rounded-none\"></span>\n                        <h3 class=\"text-2xl font-black ")
    ; __line = 517
    ; __append(escapeFn( isCancelled ? 'text-gray-400 opacity-60' : 'text-gray-900' ))
    ; __append(" tracking-tight uppercase leading-none m-0\">")
    ; __append(escapeFn( service.title ))
    ; __append("</h3>\n\n                        ")
    ; __line = 519
    ;  if (!isCancelled && !showHeaderEconomics && !service.is_multichoice) { 
    ; __append("\n                          <div class=\"ml-2 px-3 py-1 bg-white border border-[#31713D]/30 rounded-none shadow-sm flex items-center gap-2\">\n                            <span class=\"text-[9px] font-black uppercase tracking-widest text-[#31713D]\">Subtotal servicio</span>\n                            <span class=\"text-sm font-black text-[#31713D] tracking-tight leading-none\">")
    ; __line = 522
    ; __append(escapeFn( formatCurrency(serviceSubtotal) ))
    ; __append("</span>\n                          </div>\n                        ")
    ; __line = 524
    ;  } 
    ; __append("\n                        \n                        <!-- FECHA DEL HITO -->\n                        <div class=\"flex items-center gap-1.5 px-3 py-1 bg-white border border-black/10 rounded-none shadow-sm ml-2 ")
    ; __line = 527
    ; __append(escapeFn( isCancelled ? 'opacity-40 grayscale' : '' ))
    ; __append("\">\n                          <i data-lucide=\"calendar\" class=\"w-3.5 h-3.5 text-[#31713D]\"></i>\n                          <span class=\"text-[10px] font-black uppercase tracking-widest text-[#31713D]\">\n                            ")
    ; __line = 530
    ; __append(escapeFn( dayjs(service.service_date || proposal.event_date).format('DD MMM') ))
    ; __append("\n                          </span>\n                        </div>\n\n                        ")
    ; __line = 534
    ;  if (service.location) { 
    ; __append("\n                          <div class=\"flex items-center gap-1.5 px-3 py-1 bg-white border border-black/10 rounded-none shadow-sm ml-2 ")
    ; __line = 535
    ; __append(escapeFn( isCancelled ? 'opacity-40 grayscale' : '' ))
    ; __append("\">\n                            <i data-lucide=\"map-pin\" class=\"w-3.5 h-3.5 text-blue-600\"></i>\n                            <span class=\"text-[10px] font-black uppercase tracking-widest text-blue-600\">")
    ; __line = 537
    ; __append(escapeFn( service.location ))
    ; __append("</span>\n                          </div>\n                        ")
    ; __line = 539
    ;  } 
    ; __append("\n\n                        <!-- 📍 LOCALIZACIÓN HITO (UX UPGRADE) -->\n                        ")
    ; __line = 542
    ;  if (service.location && !isCancelled) { 
    ; __append("\n                          <div class=\"flex items-center gap-1.5 px-3 py-1 bg-white border border-black/10 rounded-none shadow-sm ml-2 animate-fadeIn\">\n                             <i data-lucide=\"map-pin\" class=\"w-3.5 h-3.5 text-blue-500\"></i>\n                             <span class=\"text-[10px] font-black uppercase tracking-widest text-gray-600\">")
    ; __line = 545
    ; __append(escapeFn( service.location ))
    ; __append("</span>\n                          </div>\n                        ")
    ; __line = 547
    ;  } 
    ; __append("\n\n                        ")
    ; __line = 549
    ;  if (isCancelled) { 
    ; __append("\n                          <!-- Mini Card for Cancelled Service -->\n                          <div class=\"flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-none shadow-sm ml-4 grayscale opacity-60\">\n                            ")
    ; __line = 552
    ;  
                              let cancelImg = '/img/placeholder.png';
                              if (service.options && service.options.length > 0 && service.options[0].images) {
                                try {
                                  let imgs = typeof service.options[0].images === 'string' ? JSON.parse(service.options[0].images) : service.options[0].images;
                                  if (imgs && imgs.length > 0) cancelImg = imgs[0];
                                } catch(e) {}
                              }
                            
    ; __line = 560
    ; __append("\n                            <img src=\"")
    ; __line = 561
    ; __append(escapeFn( cancelImg ))
    ; __append("\" class=\"w-5 h-5 object-cover rounded-none shadow-inner\" alt=\"\">\n                            <span class=\"text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none\">SERVICIO CANCELADO</span>\n                          </div>\n                        ")
    ; __line = 564
    ;  } 
    ; __append("\n                      </div>\n\n                      ")
    ; __line = 567
    ;  if (!isCancelled && !showHeaderEconomics && service.is_multichoice) { 
    ; __append("\n                        <div class=\"flex items-center gap-2 px-3 py-1.5 bg-white border border-[#31713D]/30 rounded-none shadow-sm w-fit\">\n                          <span class=\"text-[9px] font-black uppercase tracking-widest text-[#31713D]\">Subtotal servicio</span>\n                          <span class=\"text-base font-black text-[#31713D] tracking-tight leading-none\">")
    ; __line = 570
    ; __append(escapeFn( formatCurrency(serviceSubtotal) ))
    ; __append("</span>\n                          <span class=\"text-[9px] font-black uppercase tracking-widest text-black/40\">(")
    ; __line = 571
    ; __append(escapeFn( servicePax ))
    ; __append(" pax)</span>\n                        </div>\n                      ")
    ; __line = 573
    ;  } 
    ; __append("\n\n                      ")
    ; __line = 575
    ;  if (service.start_time && !isCancelled) { 
    ; __append("\n                        <div class=\"flex items-center gap-2 px-3 py-0.5 bg-white border border-black rounded-none w-fit\">\n                          <i data-lucide=\"clock\" class=\"w-3.5 h-3.5 text-black\"></i>\n                          <span class=\"text-[10px] font-black text-black uppercase tracking-widest leading-none\">")
    ; __line = 578
    ; __append(escapeFn( service.start_time.substring(0,5) ))
    ; __append("h <span class=\"mx-1 text-gray-200\">|</span> ESTIMADO</span>\n                        </div>\n                      ")
    ; __line = 580
    ;  } 
    ; __append("\n                    </div>\n\n                    <div class=\"flex items-center gap-4\">\n                      ")
    ; __line = 584
    ;  if (!isCancelled && !isLocked && service.is_multichoice) { 
    ; __append("\n                        <button type=\"button\" \n                                onclick=\"updateMilestoneStatus('")
    ; __line = 586
    ; __append(escapeFn( service.id ))
    ; __append("', 'cancelled')\"\n                                class=\"h-[32px] px-4 border border-black text-white bg-black rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-gray-900 mr-2\"\n                                title=\"Cancelar hito completo\">\n                          <i data-lucide=\"trash-2\" class=\"w-3 h-3 text-white\"></i>\n                          <span>Cancelar Servicio</span>\n                        </button>\n                      ")
    ; __line = 592
    ;  } 
    ; __append("\n\n                      <div id=\"service-header-status-")
    ; __line = 594
    ; __append(escapeFn( service.id ))
    ; __append("\" class=\"flex items-center\">\n                        ")
    ; __line = 595
    ;  if (showHeaderEconomics) { 
    ; __append("\n                          <div class=\"bg-white px-8 py-2 rounded-none border border-black shadow-sm flex items-center gap-8 divide-x divide-gray-100 animate-fadeIn\">\n                            <div class=\"text-right\">\n                              <span class=\"text-[9px] font-black text-black uppercase tracking-[0.3em] block mb-0.5 leading-none\">")
    ; __line = 598
    ; __append(escapeFn( service.pax || proposal.pax ))
    ; __append(" ASISTENTES</span>\n                              <span class=\"text-xl font-black text-gray-900 tracking-tighter leading-none\">\n                                ")
    ; __line = 600
    ; __append(escapeFn( formatCurrency(service.price_per_pax || 0) ))
    ; __append(" <small class=\"text-[10px] text-black font-bold\">/u</small>\n                              </span>\n                            </div>\n                            <div class=\"pl-8 text-right\">\n                              <span class=\"text-[9px] font-black text-black uppercase tracking-[0.3em] block mb-0.5 leading-none\">SUBTOTAL SERVICIO</span>\n                              <span class=\"text-2xl font-black text-[#31713D] tracking-tighter leading-none\">\n                                ")
    ; __line = 606
    ; __append(escapeFn( formatCurrency(serviceSubtotal) ))
    ; __append("\n                              </span>\n                            </div>\n                          </div>\n                          ")
    ; __line = 610
    ;  if (!isLocked) { 
    ; __append("\n                            <button type=\"button\"\n                                    onclick=\"window.updateMilestoneStatus('")
    ; __line = 612
    ; __append(escapeFn( service.id ))
    ; __append("', 'pending')\"\n                                    class=\"ml-3 h-[32px] px-4 border border-black bg-white text-black rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-50 hover:border-amber-600 hover:text-amber-700 transition-all\"\n                                    title=\"Volver a decidir este servicio\">\n                              <i data-lucide=\"rotate-ccw\" class=\"w-3 h-3\"></i>\n                              <span>Volver a decidir</span>\n                            </button>\n                          ")
    ; __line = 618
    ;  } 
    ; __append("\n                        ")
    ; __line = 619
    ;  } else { 
    ; __append("\n                          ")
    ; __line = 620
    ;  if (isCancelled) { 
    ; __append("\n                            ")
    ; __line = 621
    ;  if (!isLocked) { 
    ; __append("\n                            <button onclick=\"window.updateMilestoneStatus('")
    ; __line = 622
    ; __append(escapeFn( service.id ))
    ; __append("', 'pending')\" \n                                    class=\"flex items-center gap-4 px-6 py-2.5 bg-white border border-[#31713D] rounded-none shadow-sm hover:bg-[#31713D]/5 transition-all group\">\n                              <i data-lucide=\"rotate-ccw\" class=\"w-5 h-5 text-[#31713D] group-hover:rotate-[-45deg] transition-transform\"></i>\n                              <div class=\"text-left\">\n                                <span class=\"text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1\">SERVICIO CANCELADO</span>\n                                <span class=\"text-xs font-black text-[#31713D] tracking-tight uppercase\">RECUPERAR ESTE SERVICIO</span>\n                              </div>\n                            </button>\n                            ")
    ; __line = 630
    ;  } else { 
    ; __append("\n                              <div class=\"flex items-center gap-4 px-6 py-2.5 bg-gray-50 border border-gray-200 rounded-none shadow-inner opacity-60\">\n                                <i data-lucide=\"x-circle\" class=\"w-5 h-5 text-gray-400\"></i>\n                                <div class=\"text-left\">\n                                  <span class=\"text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none mb-1\">CANCELADO</span>\n                                  <span class=\"text-xs font-black text-gray-500 tracking-tight uppercase\">No disponible</span>\n                                </div>\n                              </div>\n                            ")
    ; __line = 638
    ;  } 
    ; __append("\n                          ")
    ; __line = 639
    ;  } else { 
    ; __append("\n                            ")
    ; __line = 640
    ;  if (!isLocked && !service.is_multichoice) { 
    ; __append("\n                              <div class=\"flex items-center gap-2\">\n                                <span class=\"inline-flex items-center gap-1.5 h-[32px] px-3 border border-amber-200 bg-amber-50 text-amber-800 text-[9px] font-black uppercase tracking-widest\">\n                                  <i data-lucide=\"alert-circle\" class=\"w-3 h-3\"></i>\n                                  <span>Pendiente de decisión</span>\n                                </span>\n                                <button type=\"button\"\n                                        onclick=\"window.updateMilestoneStatus('")
    ; __line = 647
    ; __append(escapeFn( service.id ))
    ; __append("', 'added')\"\n                                        class=\"h-[32px] px-5 bg-[#31713D] text-white rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm\">\n                                  <i data-lucide=\"plus\" class=\"w-3 h-3\"></i>\n                                  <span>Añadir ahora</span>\n                                </button>\n                                <button type=\"button\"\n                                        onclick=\"window.updateMilestoneStatus('")
    ; __line = 653
    ; __append(escapeFn( service.id ))
    ; __append("', 'cancelled')\"\n                                        class=\"h-[32px] px-4 bg-black text-white rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 transition-all\"\n                                        title=\"Cancelar servicio\">\n                                  <i data-lucide=\"trash-2\" class=\"w-3 h-3 text-white\"></i>\n                                  <span>No añadir</span>\n                                </button>\n                              </div>\n                            ")
    ; __line = 660
    ;  } else { 
    ; __append("\n                              <div class=\"flex items-center gap-2\">\n                                <div class=\"flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-none shadow-inner\">\n                                  <div class=\"w-8 h-8 rounded-none bg-amber-500/10 flex items-center justify-center\">\n                                    <i data-lucide=\"alert-circle\" class=\"w-5 h-5 text-amber-600\"></i>\n                                  </div>\n                                  <div>\n                                    <span class=\"text-[10px] font-black text-amber-800 uppercase tracking-widest block text-amber-900\">Elección pendiente</span>\n                                    <span class=\"text-[9px] text-amber-700 font-bold uppercase tracking-tighter\">Debes elegir una opción</span>\n                                  </div>\n                                </div>\n                                <button type=\"button\"\n                                        onclick=\"document.getElementById('service-options-container-")
    ; __line = 672
    ; __append(escapeFn( service.id ))
    ; __append("')?.scrollIntoView({ behavior: 'smooth', block: 'center' })\"\n                                        class=\"h-[32px] px-4 bg-[#31713D] text-white rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-sm\">\n                                  <i data-lucide=\"mouse-pointer-2\" class=\"w-3 h-3\"></i>\n                                  <span>Elegir opción</span>\n                                </button>\n                              </div>\n                            ")
    ; __line = 678
    ;  } 
    ; __append("\n                          ")
    ; __line = 679
    ;  } 
    ; __append("\n                        ")
    ; __line = 680
    ;  } 
    ; __append("\n                      </div>\n                    </div>\n                  </div>\n\n                  <div id=\"service-options-container-")
    ; __line = 685
    ; __append(escapeFn( service.id ))
    ; __append("\" class=\"")
    ; __append(escapeFn( isCancelled ? 'hidden' : 'p-6 md:px-10 md:pt-3 md:pb-8' ))
    ; __append("\">\n                    ")
    ; __line = 686
    ;  if (service.options && service.options.length > 0) { 
    ; __append("\n                      ")
    ; __line = 687
    ;  
                        const optionsSorted = [...service.options].sort((a,b) => a.id - b.id);
                      
    ; __line = 689
    ; __append("\n                      <div id=\"service-options-grid-")
    ; __line = 690
    ; __append(escapeFn( service.id ))
    ; __append("\" class=\"")
    ; __append(escapeFn( (service.is_multichoice && isAdded) ? 'grid grid-cols-1' : (service.is_multichoice ? 'grid grid-cols-1 md:grid-cols-2' : 'space-y-10') ))
    ; __append(" gap-6\">\n                      ")
    ; __line = 691
    ;  optionsSorted.forEach((opt, idx) => { 
    ; __append("\n                        ")
    ; __line = 692
    ;  const isSelected = isAdded && selectedIndex === idx; 
    ; __append("\n                        <div class=\"menu-option-card transition-all duration-700 rounded-none p-6 border shadow-sm ")
    ; __line = 693
    ; __append(escapeFn( isSelected ? 'border-[#31713D] bg-white shadow-xl scale-[1.01]' : (isAdded && service.is_multichoice ? 'hidden opacity-0 scale-95' : 'border-gray-100 bg-gray-50/10 cursor-pointer hover:shadow-lg transition-all') ))
    ; __append("\"\n                             id=\"option-card-")
    ; __line = 694
    ; __append(escapeFn( opt.id ))
    ; __append("\"\n                             onclick=\"openMenuModal(this)\"\n                             data-menu='")
    ; __line = 696
    ; __append( JSON.stringify(opt).replace(/'/g, "&#39;") )
    ; __append("'\n                             data-service-title=\"")
    ; __line = 697
    ; __append(escapeFn( service.title ))
    ; __append("\"\n                             data-service-date=\"")
    ; __line = 698
    ; __append(escapeFn( dayjs(service.service_date || proposal.event_date).format('DD/MM/YYYY') ))
    ; __append("\"\n                             data-service-pax=\"")
    ; __line = 699
    ; __append(escapeFn( service.pax || proposal.pax ))
    ; __append("\"\n                             data-service-price-pax=\"")
    ; __line = 700
    ; __append(escapeFn( service.price_per_pax || 0 ))
    ; __append("\">\n                          \n                          <!-- PRESENTACIÓN DE MENÚ (DISEÑO COMPACTO Y HORIZONTAL) -->\n                          <div class=\"flex items-start gap-6\">\n                            ")
    ; __line = 704
    ;  
                              let menuImg = null;
                              if (opt.images && opt.images.length > 0) menuImg = opt.images[0];
                              else if (opt.items && opt.items.length > 0 && opt.items[0].image_url) menuImg = opt.items[0].image_url;
                            
    ; __line = 708
    ; __append("\n                            <div class=\"flex flex-col gap-2\">\n                              <div class=\"w-24 h-24 md:w-32 md:h-32 flex-shrink-0 overflow-hidden rounded-none border border-black/10 shadow-md relative group bg-gray-50\">\n                                ")
    ; __line = 711
    ;  if (menuImg) { 
    ; __append("\n                                  <img src=\"")
    ; __line = 712
    ; __append(escapeFn( menuImg ))
    ; __append("\" class=\"w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110\">\n                                ")
    ; __line = 713
    ;  } else { 
    ; __append("\n                                  <div class=\"w-full h-full flex items-center justify-center text-gray-200\">\n                                    <i data-lucide=\"utensils\" class=\"w-8 h-8 opacity-20\"></i>\n                                  </div>\n                                ")
    ; __line = 717
    ;  } 
    ; __append("\n                              </div>\n                              <div class=\"bg-black text-white px-3 py-1 text-center rounded-none\">\n                                <span class=\"text-[12px] font-black tracking-tighter leading-none\">\n                                  ")
    ; __line = 721
    ; __append(escapeFn( formatCurrency(opt.price_pax || 0) ))
    ; __append(" <small class=\"text-[8px] uppercase opacity-60\">/u</small>\n                                </span>\n                              </div>\n                            </div>\n\n                            <div class=\"flex-1 min-w-0\">\n                              <div class=\"flex flex-col gap-2 md:gap-4\">\n                                <div class=\"flex flex-col md:flex-row md:items-start justify-between gap-4\">\n                                  <h5 class=\"text-xl md:text-2xl font-black text-gray-900 tracking-tighter leading-none uppercase italic serif truncate\">\n                                    ")
    ; __line = 730
    ; __append(escapeFn( opt.name ))
    ; __append("\n                                  </h5>\n                                  <div class=\"flex flex-wrap items-center gap-2\" id=\"option-actions-")
    ; __line = 732
    ; __append(escapeFn( opt.id ))
    ; __append("\">\n                                    ")
    ; __line = 733
    ;  if (service.is_multichoice) { 
    ; __append("\n                                      ")
    ; __line = 734
    ;  if (proposal.status === 'Pipe' || proposal.status === 'draft' || proposal.status === 'sent') { 
    ; __append("\n                                        <div class=\"flex items-center\">\n                                          <button type=\"button\" \n                                                  data-service-id=\"")
    ; __line = 737
    ; __append(escapeFn( service.id ))
    ; __append("\"\n                                                  data-option-id=\"")
    ; __line = 738
    ; __append(escapeFn( opt.id ))
    ; __append("\"\n                                                  data-selected=\"")
    ; __line = 739
    ; __append(escapeFn( isSelected ))
    ; __append("\"\n                                                  onclick=\"event.stopPropagation(); window.handleServiceSelection(this)\"\n                                                  class=\"")
    ; __line = 741
    ; __append(escapeFn( isSelected ? 'bg-white text-gray-900 border-2 border-black hover:border-red-500 hover:text-red-500 hover:bg-red-50' : 'bg-[#31713D] text-white hover:bg-black' ))
    ; __append(" h-[32px] px-6 rounded-none text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm group\">\n                                            ")
    ; __line = 742
    ;  if (isSelected) { 
    ; __append("\n                                              <i data-lucide=\"check\" class=\"w-3 h-3 text-brand-primary group-hover:hidden\"></i>\n                                              <i data-lucide=\"rotate-ccw\" class=\"w-3 h-3 hidden group-hover:block\"></i>\n                                              <span class=\"text-brand-primary group-hover:hidden\">Seleccionado</span>\n                                              <span class=\"hidden group-hover:block uppercase\">Deseleccionar</span>\n                                            ")
    ; __line = 747
    ;  } else { 
    ; __append("\n                                              <i data-lucide=\"mouse-pointer-2\" class=\"w-3 h-3\"></i> Elegir\n                                            ")
    ; __line = 749
    ;  } 
    ; __append("\n                                          </button>\n                                        </div>\n                                      ")
    ; __line = 752
    ;  } 
    ; __append("\n                                    ")
    ; __line = 753
    ;  } 
    ; __append("\n                                  </div>\n                                </div>\n                                ")
    ; __line = 756
    ;  const pax = service.pax || proposal.pax; const subtotal = (opt.price_pax || 0) * pax; 
    ; __append("\n                                <div class=\"mt-2 w-full flex flex-col items-stretch\">\n                                  <div class=\"flex flex-row items-center gap-2 px-2 py-1 bg-[#31713D]/5 border border-[#31713D]/10 rounded-none w-full\">\n                                    <span class=\"text-[10px] font-black uppercase tracking-widest text-[#31713D]\">Subtotal menú</span>\n                                    <span class=\"text-base font-black text-[#31713D] tracking-tight leading-none\">")
    ; __line = 760
    ; __append(escapeFn( formatCurrency(subtotal) ))
    ; __append("</span>\n                                    <span class=\"text-[9px] font-black uppercase tracking-widest text-black/40\">(")
    ; __line = 761
    ; __append(escapeFn( pax ))
    ; __append(" pax)</span>\n                                  </div>\n                                </div>\n                              </div>\n                              ")
    ; __line = 765
    ;  } else if (isSelected) { 
    ; __append("\n                                <div class=\"flex items-center gap-2 px-4 py-2 bg-[#31713D]/5 text-[#31713D] border border-[#31713D] rounded-none\">\n                                  <i data-lucide=\"check\" class=\"w-3 h-3\"></i>\n                                  <span class=\"text-[9px] font-black uppercase tracking-widest\">Confirmado</span>\n                                </div>\n                              ")
    ; __line = 770
    ;  } else { 
    ; __append("\n                                <div class=\"inline-flex items-center gap-2\">\n                                  ")
    ; __line = 772
    ;  if (isAdded) { 
    ; __append("\n                                    <span class=\"inline-flex items-center gap-1.5 px-3 py-1.5 border border-green-200 bg-green-50 text-[#31713D] text-[9px] font-black uppercase tracking-widest\">\n                                      <i data-lucide=\"check\" class=\"w-3 h-3\"></i>\n                                      <span>Añadido</span>\n                                    </span>\n                                  ")
    ; __line = 777
    ;  } else if (isCancelled) { 
    ; __append("\n                                    <span class=\"inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-gray-100 text-gray-600 text-[9px] font-black uppercase tracking-widest\">\n                                      <i data-lucide=\"x\" class=\"w-3 h-3\"></i>\n                                      <span>No añadido</span>\n                                    </span>\n                                  ")
    ; __line = 782
    ;  } else if (!isLocked) { 
    ; __append("\n                                    <span class=\"inline-flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest\">\n                                      <i data-lucide=\"arrow-up\" class=\"w-3 h-3\"></i>\n                                      <span>Decide arriba</span>\n                                    </span>\n                                  ")
    ; __line = 787
    ;  } 
    ; __append("\n                                </div>\n                              ")
    ; __line = 789
    ;  } 
    ; __append("\n\n                              ")
    ; __line = 791
    ;  if (opt.badges && opt.badges.length > 0) { 
    ; __append("\n                                <div class=\"flex items-center gap-1.5 flex-wrap mt-2\">\n                                  ")
    ; __line = 793
    ;  opt.badges.forEach(b => { 
    ; __append("\n                                    <span class=\"bg-gray-100 text-gray-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-gray-200\">")
    ; __line = 794
    ; __append(escapeFn( b ))
    ; __append("</span>\n                                  ")
    ; __line = 795
    ;  }) 
    ; __append("\n                                </div>\n                              ")
    ; __line = 797
    ;  } 
    ; __append("\n\n                              ")
    ; __line = 799
    ;  if (opt.description) { 
    ; __append("\n                                <div class=\"mt-2 pt-2 border-t border-black/5\">\n                                  <p class=\"text-[12px] md:text-[13px] text-black/70 font-medium leading-relaxed italic whitespace-pre-line mb-1\">\n                                    ")
    ; __line = 802
    ; __append(escapeFn( opt.description ))
    ; __append("\n                                  </p>\n                                </div>\n                              ")
    ; __line = 805
    ;  } 
    ; __append("\n                            </div>\n                          </div>\n\n                        </div>\n                      ")
    ; __line = 810
    ;  }); 
    ; __append("\n                    </div>\n                  ")
    ; __line = 812
    ;  } 
    ; __append("\n                </div>\n              ")
    ; __line = 814
    ;  }); 
    ; __append("\n            </div>\n          </div>\n        ")
    ; __line = 817
    ;  } 
    ; __append("\n\n        <!-- Standard Contract Conditions (Institutional) -->\n        <div class=\"card overflow-hidden p-0 bg-white rounded-none mb-0 border-none shadow-none !mt-0 print:break-before-page ")
    ; __line = 820
    ; __append(escapeFn( !proposal.show_general_conditions ? 'hidden print:hidden' : '' ))
    ; __append("\">\n          <div class=\"brand-bg px-8 py-5 flex items-center justify-between cursor-pointer group border-b border-white/5\" onclick=\"document.getElementById('institutional-conditions').classList.toggle('hidden')\">\n            <h2 class=\"font-black uppercase tracking-widest text-[11px] flex items-center\">\n              <span class=\"bg-white px-4 py-2 flex items-center gap-2 shadow-sm\">\n                <i data-lucide=\"shield-check\" class=\"text-[#31713D] w-4 h-4\"></i> \n                <span class=\"text-black\">Condiciones Generales de Contratación</span>\n              </span>\n            </h2>\n            <i data-lucide=\"chevron-down\" class=\"w-4 h-4 text-white/40 group-hover:text-white transition-colors\"></i>\n          </div>\n          \n          <div id=\"institutional-conditions\" class=\"p-8 md:p-12 space-y-10 hidden\">\n            ")
    ; __line = 832
    ;  
               const genConds = proposal.general_conditions || '';
               const sections = genConds.split(/\n(?=[A-ZÁÉÍÓÚ\s]+:)/).filter(s => s.trim());
               const middle = Math.ceil(sections.length / 2);
               const leftCol = sections.slice(0, middle);
               const rightCol = sections.slice(middle);
            
    ; __line = 838
    ; __append("\n            <div class=\"grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20\">\n              \n              <!-- Left Column -->\n              <div class=\"space-y-10\">\n                ")
    ; __line = 843
    ;  leftCol.forEach(section => { 
                   const lines = section.split('\n').filter(l => l.trim());
                   const title = lines[0].replace(':', '').trim();
                   const items = lines.slice(1);
                
    ; __line = 847
    ; __append("\n                  <section>\n                    <h3 class=\"text-[#31713D] font-black uppercase tracking-widest text-[12px] mb-6 flex items-center gap-3\">\n                      <span class=\"w-2 h-6 bg-[#31713D]\"></span> ")
    ; __line = 850
    ; __append(escapeFn( title ))
    ; __append("\n                    </h3>\n                    <ul class=\"space-y-3 text-[11px] text-gray-600 leading-relaxed\">\n                      ")
    ; __line = 853
    ;  items.forEach(item => { 
                         const isBullet = item.startsWith('-');
                         const text = isBullet ? item.substring(1).trim() : item.trim();
                      
    ; __line = 856
    ; __append("\n                        <li class=\"flex gap-3\">\n                          <i data-lucide=\"")
    ; __line = 858
    ; __append(escapeFn( isBullet ? 'check' : 'info' ))
    ; __append("\" class=\"w-3.5 h-3.5 text-[#31713D] flex-shrink-0 mt-0.5\"></i>\n                          <span>")
    ; __line = 859
    ; __append( text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') )
    ; __append("</span>\n                        </li>\n                      ")
    ; __line = 861
    ;  }); 
    ; __append("\n                    </ul>\n                  </section>\n                ")
    ; __line = 864
    ;  }); 
    ; __append("\n              </div>\n\n              <!-- Right Column -->\n              <div class=\"space-y-10\">\n                ")
    ; __line = 869
    ;  rightCol.forEach(section => { 
                   const lines = section.split('\n').filter(l => l.trim());
                   const title = lines[0].replace(':', '').trim();
                   const items = lines.slice(1);
                
    ; __line = 873
    ; __append("\n                  <section>\n                    <h3 class=\"text-[#31713D] font-black uppercase tracking-widest text-[12px] mb-6 flex items-center gap-3\">\n                      <span class=\"w-2 h-6 bg-[#31713D]\"></span> ")
    ; __line = 876
    ; __append(escapeFn( title ))
    ; __append("\n                    </h3>\n                    <ul class=\"space-y-3 text-[11px] text-gray-600 leading-relaxed\">\n                      ")
    ; __line = 879
    ;  items.forEach(item => { 
                         const isBullet = item.startsWith('-');
                         const text = isBullet ? item.substring(1).trim() : item.trim();
                      
    ; __line = 882
    ; __append("\n                        <li class=\"flex gap-3\">\n                          <i data-lucide=\"")
    ; __line = 884
    ; __append(escapeFn( isBullet ? 'check' : 'info' ))
    ; __append("\" class=\"w-3.5 h-3.5 text-[#31713D] flex-shrink-0 mt-0.5\"></i>\n                          <span>")
    ; __line = 885
    ; __append( text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') )
    ; __append("</span>\n                        </li>\n                      ")
    ; __line = 887
    ;  }); 
    ; __append("\n                    </ul>\n                  </section>\n                ")
    ; __line = 890
    ;  }); 
    ; __append("\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <!-- SECCIÓN MANIFIESTO: SOSTENIBILIDAD (Homogeneizada) -->\n        <div class=\"card overflow-hidden p-0 bg-white rounded-none mb-0 border-none shadow-none !mt-0 print:hidden transition-shadow\">\n          <div onclick=\"toggleSustainability()\" class=\"brand-bg px-8 py-5 flex items-center justify-between cursor-pointer group border-b border-white/5\">\n                          <div class=\"flex items-center gap-6\">\n              <h2 class=\"font-black uppercase tracking-widest text-[11px] flex items-center\">\n                <span class=\"bg-white px-4 py-2 flex items-center gap-2 shadow-sm\">\n                  <i data-lucide=\"leaf\" class=\"text-[#31713D] w-4 h-4\"></i> \n                  <span class=\"text-black\">Propuesta Sostenible</span>\n                </span>\n              </h2>\n            </div>\n            \n            <div class=\"flex items-center gap-6\">\n              <i data-lucide=\"chevron-down\" id=\"sustainability-chevron\" class=\"w-4 h-4 text-white/40 group-hover:text-white transition-colors\"></i>\n            </div>\n          </div>\n\n          <div id=\"manifiesto-content\" class=\"hidden print:block bg-white\">\n            \n            <!-- Selector de Secciones (Visible solo al desplegar) -->\n            <div class=\"border-b border-black flex flex-nowrap overflow-x-auto bg-gray-50/50 p-2 gap-2 print:hidden scrollbar-hide\">\n              ")
    ; __line = 917
    ;  sustainabilityConfig.forEach((sec, idx) => { 
    ; __append("\n                <button data-slide-id=\"")
    ; __line = 918
    ; __append(escapeFn( sec.id ))
    ; __append("\" \n                  class=\"whitespace-nowrap flex-1 px-4 py-3 rounded-none text-[9px] font-black uppercase tracking-widest ")
    ; __line = 919
    ; __append(escapeFn( idx === 0 ? 'bg-white shadow-sm text-gray-900 border-black' : 'text-black hover:text-gray-900 border-transparent' ))
    ; __append(" border transition-all\" \n                  id=\"btn-slide-")
    ; __line = 920
    ; __append(escapeFn( sec.id ))
    ; __append("\">\n                  <i data-lucide=\"")
    ; __line = 921
    ; __append(escapeFn( sec.icon ))
    ; __append("\" class=\"w-3 h-3 mb-1 mx-auto hidden md:block opacity-40\"></i>\n                  <span class=\"block\">")
    ; __line = 922
    ; __append(escapeFn( sec.titulo ))
    ; __append("</span>\n                </button>\n              ")
    ; __line = 924
    ;  }); 
    ; __append("\n            </div>\n\n            ")
    ; __line = 927
    ;  sustainabilityConfig.forEach((sec, idx) => { 
    ; __append("\n              <div id=\"slide-")
    ; __line = 928
    ; __append(escapeFn( sec.id ))
    ; __append("\" class=\"slide-container ")
    ; __append(escapeFn( idx === 0 ? 'print:block' : 'hidden print:block' ))
    ; __append(" ")
    ; __append(escapeFn( sec.bgColor ))
    ; __append(" ")
    ; __append(escapeFn( sec.textColor ))
    ; __append("\">\n                <div class=\"flex flex-col lg:flex-row min-h-[500px]\">\n                  \n                  <!-- Contenido Texto -->\n                  <div class=\"w-full lg:w-1/2 p-12 md:p-16 flex flex-col justify-center ")
    ; __line = 932
    ; __append(escapeFn( (idx % 2) === 0 ? 'order-first lg:order-last' : '' ))
    ; __append("\">\n                    <div class=\"space-y-8 text-left\">\n                      <span class=\"text-[12px] font-black uppercase tracking-[0.4em] border-l-4 pl-6 block\" data-sec-color=\"")
    ; __line = 934
    ; __append(escapeFn( sec.color ))
    ; __append("\">\n                        Pilar ")
    ; __line = 935
    ; __append(escapeFn( sec.pilar ))
    ; __append("\n                      </span>\n                      <h3 class=\"text-5xl font-black tracking-tighter leading-none m-0\">\n                        ")
    ; __line = 938
    ; __append(escapeFn( sec.titulo.split(' ').slice(0, -1).join(' ') ))
    ; __append(" <br>\n                        <span data-sec-color=\"")
    ; __line = 939
    ; __append(escapeFn( sec.color ))
    ; __append("\" class=\"")
    ; __append(escapeFn( (idx % 2) !== 0 ? 'italic serif' : '' ))
    ; __append("\">\n                          ")
    ; __line = 940
    ; __append(escapeFn( sec.destaque ))
    ; __append("\n                        </span>\n                      </h3>\n                      <p class=\"")
    ; __line = 943
    ; __append(escapeFn( sec.textColor === 'text-white' ? 'text-white/60' : 'text-black' ))
    ; __append(" text-lg font-light leading-relaxed max-w-sm\">\n                        ")
    ; __line = 944
    ; __append(escapeFn( sec.descripcion ))
    ; __append("\n                      </p>\n\n                      <!-- Subsecciones Dinámicas -->\n                      <div class=\"space-y-6 pt-4\">\n                        ")
    ; __line = 949
    ;  if (sec.features) { 
    ; __append("\n                          ")
    ; __line = 950
    ;  sec.features.forEach(f => { 
    ; __append("\n                            <div class=\"flex items-start gap-4\">\n                              <div class=\"w-10 h-10 rounded-none flex items-center justify-center flex-shrink-0\" data-sec-bg=\"")
    ; __line = 952
    ; __append(escapeFn( sec.color + '20' ))
    ; __append("\">\n                                <i data-lucide=\"")
    ; __line = 953
    ; __append(escapeFn( f.icon ))
    ; __append("\" class=\"w-5 h-5\" data-sec-color=\"")
    ; __append(escapeFn( sec.color ))
    ; __append("\"></i>\n                              </div>\n                              <div>\n                                <p class=\"text-sm font-black uppercase tracking-widest\">")
    ; __line = 956
    ; __append(escapeFn( f.titulo ))
    ; __append("</p>\n                                <p class=\"text-xs opacity-60 font-light max-w-sm\">")
    ; __line = 957
    ; __append(escapeFn( f.desc ))
    ; __append("</p>\n                              </div>\n                            </div>\n                          ")
    ; __line = 960
    ;  }); 
    ; __append("\n                        ")
    ; __line = 961
    ;  } 
    ; __append("\n\n                        ")
    ; __line = 963
    ;  if (sec.cards) { 
    ; __append("\n                          <div class=\"grid grid-cols-1 md:grid-cols-2 gap-4\">\n                            ")
    ; __line = 965
    ;  sec.cards.forEach(c => { 
    ; __append("\n                              <div class=\"p-5 rounded-none border ")
    ; __line = 966
    ; __append(escapeFn( c.full ? 'md:col-span-2' : '' ))
    ; __append("\" data-sec-bg=\"")
    ; __append(escapeFn( sec.color + '10' ))
    ; __append("\" data-sec-border=\"")
    ; __append(escapeFn( sec.color + '20' ))
    ; __append("\">\n                                <i data-lucide=\"")
    ; __line = 967
    ; __append(escapeFn( c.icon ))
    ; __append("\" class=\"w-6 h-6 mb-2\" data-sec-color=\"")
    ; __append(escapeFn( sec.color ))
    ; __append("\"></i>\n                                <p class=\"text-[10px] font-black uppercase tracking-widest\">")
    ; __line = 968
    ; __append(escapeFn( c.titulo ))
    ; __append("</p>\n                                <p class=\"text-[9px] opacity-70 font-bold\">")
    ; __line = 969
    ; __append(escapeFn( c.desc ))
    ; __append("</p>\n                              </div>\n                            ")
    ; __line = 971
    ;  }); 
    ; __append("\n                          </div>\n                        ")
    ; __line = 973
    ;  } 
    ; __append("\n\n                        ")
    ; __line = 975
    ;  if (sec.tags) { 
    ; __append("\n                          <div class=\"grid grid-cols-2 gap-6 pt-2 grayscale opacity-60\">\n                            ")
    ; __line = 977
    ;  sec.tags.forEach(t => { 
    ; __append("\n                              <div class=\"flex flex-col gap-2 ")
    ; __line = 978
    ; __append(escapeFn( t.image ? '' : 'border-l border-black pl-4' ))
    ; __append("\">\n                                ")
    ; __line = 979
    ;  if (t.image) { 
    ; __append("\n                                  <img src=\"")
    ; __line = 980
    ; __append(escapeFn( t.image ))
    ; __append("\" class=\"h-8 w-auto object-contain mr-auto\">\n                                ")
    ; __line = 981
    ;  } else { 
    ; __append("\n                                  <i data-lucide=\"")
    ; __line = 982
    ; __append(escapeFn( t.icon ))
    ; __append("\" class=\"w-6 h-6\" data-sec-color=\"")
    ; __append(escapeFn( sec.color ))
    ; __append("\"></i>\n                                ")
    ; __line = 983
    ;  } 
    ; __append("\n                                <p class=\"text-[8px] font-bold text-black uppercase tracking-widest\">")
    ; __line = 984
    ; __append(escapeFn( t.label ))
    ; __append("</p>\n                              </div>\n                            ")
    ; __line = 986
    ;  }); 
    ; __append("\n                          </div>\n                        ")
    ; __line = 988
    ;  } 
    ; __append("\n\n                        ")
    ; __line = 990
    ;  if (sec.items) { 
    ; __append("\n                          <div class=\"space-y-4\">\n                            ")
    ; __line = 992
    ;  sec.items.forEach(it => { 
    ; __append("\n                              <div class=\"flex items-center gap-4\">\n                                <i data-lucide=\"")
    ; __line = 994
    ; __append(escapeFn( it.icon ))
    ; __append("\" class=\"w-5 h-5\" data-sec-color=\"")
    ; __append(escapeFn( sec.color ))
    ; __append("\"></i>\n                                <span class=\"text-[11px] font-black uppercase tracking-widest\">")
    ; __line = 995
    ; __append(escapeFn( it.label ))
    ; __append("</span>\n                              </div>\n                            ")
    ; __line = 997
    ;  }); 
    ; __append("\n                          </div>\n                        ")
    ; __line = 999
    ;  } 
    ; __append("\n\n                        ")
    ; __line = 1001
    ;  if (sec.certificates) { 
    ; __append("\n                          <div class=\"grid grid-cols-1 md:grid-cols-3 gap-6\">\n                            ")
    ; __line = 1003
    ;  sec.certificates.forEach(cert => { 
    ; __append("\n                              <div class=\"bg-white p-6 border border-black shadow-sm flex flex-col items-center text-center\">\n                                ")
    ; __line = 1005
    ;  if (cert.img) { 
    ; __append("\n                                  <img src=\"")
    ; __line = 1006
    ; __append(escapeFn( cert.img ))
    ; __append("\" class=\"h-12 mb-4 grayscale\">\n                                ")
    ; __line = 1007
    ;  } else { 
    ; __append("\n                                  <div class=\"w-12 h-12 bg-gray-50 flex items-center justify-center rounded-none mb-4\">\n                                    <i data-lucide=\"")
    ; __line = 1009
    ; __append(escapeFn( cert.icon ))
    ; __append("\" class=\"w-6 h-6 text-black\"></i>\n                                  </div>\n                                ")
    ; __line = 1011
    ;  } 
    ; __append("\n                                <p class=\"text-[10px] font-black uppercase tracking-widest text-gray-900\">")
    ; __line = 1012
    ; __append(escapeFn( cert.name ))
    ; __append("</p>\n                                <p class=\"text-[8px] text-black mt-1\">")
    ; __line = 1013
    ; __append(escapeFn( cert.desc ))
    ; __append("</p>\n                              </div>\n                            ")
    ; __line = 1015
    ;  }); 
    ; __append("\n                          </div>\n                        ")
    ; __line = 1017
    ;  } 
    ; __append("\n                      </div>\n\n                    </div>\n                  </div>\n\n                  <!-- Imagen Lateral -->\n                  <div class=\"w-full lg:w-1/2 relative bg-gray-50 min-h-[400px]\">\n                    <img src=\"")
    ; __line = 1025
    ; __append(escapeFn( sec.imagen ))
    ; __append("\" class=\"absolute inset-0 w-full h-full object-cover ")
    ; __append(escapeFn( sec.textColor === 'text-white' ? 'opacity-60' : '' ))
    ; __append("\" alt=\"")
    ; __append(escapeFn( sec.titulo ))
    ; __append("\">\n                  </div>\n                </div>\n              </div>\n            ")
    ; __line = 1029
    ;  }); 
    ; __append("\n          </div>\n        </div>\n\n        <!-- Propuesta Económica Title (Style unified with conditions) -->\n        <div class=\"card overflow-hidden p-0 rounded-none border-none mb-0 !mt-0 print:hidden shadow-none\">\n          <div class=\"brand-bg px-8 py-5 flex items-center justify-between cursor-pointer group\" onclick=\"toggleBudgetBreakdown()\">\n            <h2 class=\"font-black uppercase tracking-widest text-[11px] flex items-center\">\n              <span class=\"bg-white px-4 py-2 flex items-center gap-2 shadow-sm\">\n                <i data-lucide=\"calculator\" class=\"text-[#31713D] w-4 h-4\"></i> \n                <span class=\"text-black\">Propuesta Económica</span>\n              </span>\n              <span class=\"hidden sm:inline text-[9px] font-bold text-white/50 ml-4 tracking-normal uppercase\">(Clic para ver detalle)</span>\n            </h2>\n            \n            <div class=\"flex items-center gap-6\">\n              <div class=\"hidden md:flex items-center gap-4\">\n                <span class=\"text-[9px] font-black text-[#4ade80] uppercase tracking-widest animate-pulse\">Ver desglose detallado</span>\n                <div class=\"h-4 w-px bg-white/10\"></div>\n                <i data-lucide=\"check\" class=\"text-[#4ade80] w-3.5 h-3.5\"></i>\n              </div>\n              <div class=\"flex items-center gap-2\">\n                <span class=\"text-[8px] font-bold text-white/40 uppercase tracking-widest md:hidden\">Ver detalle</span>\n                <i data-lucide=\"chevron-down\" id=\"breakdown-chevron\" class=\"w-4 h-4 text-white/40 group-hover:text-white transition-all duration-300\"></i>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        <!-- Budget Total Card (At bottom) -->\n        <div id=\"total-budget\" class=\"card overflow-hidden shadow-none border-none bg-white p-0 print:border-none print:shadow-none rounded-none !mt-0 mb-4 scroll-reveal\">\n          ")
    ; __line = 1060
    ;  
            const pendingGastro = (proposal.services || []).filter(s => 
              s.type === 'gastronomy' && s.is_multichoice && (s.selected_option_index === null || s.selected_option_index === undefined)
            );
            const hasAddedMilestone = (proposal.services || []).some(s => {
              const idx = s.selected_option_index;
              if (idx === null || idx === undefined || idx === -1) return false;
              return s.is_multichoice ? idx >= 0 : idx === 0;
            });
          
    ; __line = 1069
    ; __append("\n          \n          <div class=\"p-6 md:p-10\">\n            \n\n            <div class=\"flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-10\">\n              \n              <!-- Financial breakdown: Only Base Imponible (remove Inversión Final card) -->\n              <div onclick=\"toggleBudgetBreakdown()\" class=\"flex-1 grid grid-cols-12 gap-8 items-stretch cursor-pointer group\">\n                <!-- 1. BASE IMPONIBLE (MASTER CARD - EQUAL WIDTH) -->\n                <div class=\"col-span-12 p-10 rounded-none bg-white border-[3.5px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.06)] group-hover:shadow-[12px_12px_0px_0px_rgba(49,113,61,0.2)] transition-all transform group-hover:-translate-y-1.5 flex flex-col justify-between min-h-[260px] relative\">\n                  <div class=\"flex flex-col sm:flex-row justify-between items-start gap-4\">\n                    <span class=\"text-[12px] font-black text-black uppercase tracking-[0.4em] flex items-center gap-2\">\n                        <span class=\"w-2 h-6 bg-black\"></span> Base Imponible\n                    </span>\n                    ")
    ; __line = 1084
    ;  if (proposal.totals?.total_discount > 0) { 
    ; __append("\n                        <div class=\"flex flex-col items-end gap-2\">\n                            ")
    ; __line = 1086
    ;  if (proposal.totals?.discounts && proposal.totals.discounts.length > 0) { 
    ; __append("\n                                ")
    ; __line = 1087
    ;  proposal.totals.discounts.forEach((disc, idx) => { 
    ; __append("\n                                    <div class=\"bg-black text-[#4ade80] px-4 py-2 rounded-none flex items-center gap-3 shadow-sm border border-black transform ")
    ; __line = 1088
    ; __append(escapeFn( idx % 2 === 0 ? '-rotate-1' : 'rotate-1' ))
    ; __append("\">\n                                        <i data-lucide=\"gift\" class=\"w-4 h-4\"></i>\n                                        <div class=\"flex flex-col\">\n                                            <span class=\"text-[10px] font-black uppercase tracking-widest\">Descuento aplicado</span>\n                                            <span class=\"text-lg font-black\">-")
    ; __line = 1092
    ; __append(escapeFn( disc.amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €</span>\n                                        </div>\n                                    </div>\n                                ")
    ; __line = 1095
    ;  }) 
    ; __append("\n                            ")
    ; __line = 1096
    ;  } else { 
    ; __append("\n                                <div class=\"bg-black text-[#4ade80] px-4 py-2 rounded-none flex items-center gap-3 shadow-sm border border-black transform -rotate-1\">\n                                    <i data-lucide=\"gift\" class=\"w-4 h-4\"></i>\n                                    <div class=\"flex flex-col\">\n                                        <span class=\"text-[10px] font-black uppercase tracking-widest\">Descuento aplicado</span>\n                                        <span class=\"text-lg font-black\">-")
    ; __line = 1101
    ; __append(escapeFn( (proposal.totals?.total_discount || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €</span>\n                                    </div>\n                                </div>\n                            ")
    ; __line = 1104
    ;  } 
    ; __append("\n                        </div>\n                    ")
    ; __line = 1106
    ;  } 
    ; __append("\n                  </div>\n                  <div class=\"flex flex-col mt-4 gap-4\">\n                    ")
    ; __line = 1109
    ;  if (proposal.totals?.total_discount > 0) { 
    ; __append("\n                      <div class=\"flex items-center gap-3 mb-1\">\n                         <span class=\"text-xl md:text-2xl lg:text-3xl font-black text-black line-through uppercase tracking-tighter opacity-20 truncate\">\n                            ")
    ; __line = 1112
    ; __append(escapeFn( (proposal.totals?.total_base || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €\n                          </span>\n                      </div>\n                    ")
    ; __line = 1115
    ;  } 
    ; __append("\n                    <div class=\"flex items-baseline flex-wrap gap-x-2\">\n                      <span class=\"text-4xl md:text-6xl lg:text-7xl font-black text-[#31713D] tracking-tighter leading-none break-all\">\n                        ")
    ; __line = 1118
    ; __append(escapeFn( Math.floor(proposal.totals?.total_base_after_discount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append("<span class=\"text-xl md:text-2xl text-[#31713D]\">,")
    ; __append(escapeFn( ((proposal.totals?.total_base_after_discount % 1).toFixed(2).split('.')[1]) || '00' ))
    ; __append("</span><span class=\"ml-1 text-2xl md:text-3xl\">€</span>\n                      </span>\n                      <span class=\"ml-4 text-[10px] font-black uppercase tracking-widest text-gray-400\">Pulsa para desglose</span>\n                    </div>\n                    <div class=\"flex flex-col md:flex-row gap-4 mt-4\">\n                      <div class=\"flex-1 flex flex-col items-start\">\n                        <span class=\"text-[10px] font-black uppercase tracking-widest text-black\">Impuestos (IVA)</span>\n                        <span class=\"text-2xl font-black text-amber-600\">")
    ; __line = 1125
    ; __append(escapeFn( (proposal.totals?.total_vat || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €</span>\n                      </div>\n                      <div class=\"flex-1 flex flex-col items-start\">\n                        <span class=\"text-[10px] font-black uppercase tracking-widest text-black\">Total + IVA</span>\n                        <span class=\"text-2xl font-black text-green-700\">")
    ; __line = 1129
    ; __append(escapeFn( (proposal.totals?.total_final || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €</span>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n              </div>\n\n              <!-- Action Zone -->\n              <div id=\"economics-action-zone\" class=\"lg:w-[260px] shrink-0 flex flex-col gap-3 print:hidden\">\n                ")
    ; __line = 1138
    ;  if (proposal.status === 'Aceptada') { 
    ; __append("\n                  <div class=\"bg-green-50 px-6 py-5 rounded-none border border-black flex items-center gap-4\">\n                    <div class=\"w-10 h-10 rounded-none bg-[#31713D] text-white flex items-center justify-center shrink-0 shadow-sm\">\n                      <i data-lucide=\"check\" class=\"w-5 h-5\"></i>\n                    </div>\n                    <div>\n                      <span class=\"text-[10px] font-black uppercase tracking-widest text-[#31713D]\">Confirmada</span>\n                      <p class=\"text-[9px] text-black font-bold\">Reserva Activa</p>\n                    </div>\n                  </div>\n                  \n                  <!-- Chat always available -->\n                  <button onclick=\"toggleChat(event)\" class=\"w-full bg-white hover:bg-green-50 text-black border border-black py-3 rounded-none font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all\">\n                    <i data-lucide=\"message-square\" class=\"w-3.5 h-3.5 text-[#31713D]\"></i> Chat con Comercial\n                  </button>\n                ")
    ; __line = 1153
    ;  } else if (proposal.status === 'cancelled') { 
    ; __append("\n                  <div class=\"bg-gray-100 px-6 py-5 rounded-none border border-black flex items-center gap-4 grayscale\">\n                     <span class=\"text-[10px] font-black uppercase tracking-widest text-black\">Propuesta Desestimada</span>\n                  </div>\n                ")
    ; __line = 1157
    ;  } else { 
    ; __append("\n                    <!-- Main Action -->\n                    ")
    ; __line = 1159
    ;  if (pendingGastro.length > 0) { 
    ; __append("\n                      <a href=\"#gastronomia-section\" class=\"bg-amber-600 text-white px-6 py-4 rounded-none font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-amber-700 transition-all flex items-center justify-center gap-3\">\n                        <span>Seleccione su Propuesta Gastronómica</span>\n                        <i data-lucide=\"chevron-right\" class=\"w-4 h-4\"></i>\n                      </a>\n                    ")
    ; __line = 1164
    ;  } else if (!hasAddedMilestone) { 
    ; __append("\n                      <div class=\"bg-gray-100 text-black/60 px-6 py-5 rounded-none font-black uppercase tracking-widest text-[10px] border border-gray-200 flex items-center justify-center gap-3\">\n                        <i data-lucide=\"alert-triangle\" class=\"w-4 h-4\"></i>\n                        <span>Debe añadir al menos un hito para aceptar</span>\n                      </div>\n                    ")
    ; __line = 1169
    ;  } else { 
    ; __append("\n                      <button id=\"btn-accept\" \n                              class=\"text-white px-6 py-5 rounded-none font-black uppercase tracking-widest text-[11px] shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center gap-3 group\"\n                              style=\"background-color: var(--brand-primary)\">\n                        <i data-lucide=\"shield-check\" class=\"w-5 h-5\"></i>\n                        <span>Confirmar Propuesta Comercial</span>\n                      </button>\n                    ")
    ; __line = 1176
    ;  } 
    ; __append("\n\n                    <!-- Secondary Actions -->\n                    <div class=\"grid grid-cols-2 gap-2\">\n                      <button onclick=\"toggleChat(event)\" class=\"bg-white hover:bg-green-50 text-black border border-black py-3 rounded-none font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all\">\n                        <i data-lucide=\"message-square\" class=\"w-3.5 h-3.5 text-[#31713D]\"></i> Chat\n                      </button>\n\n                      <button onclick=\"document.getElementById('modal-reject').classList.remove('hidden')\" class=\"bg-white hover:bg-red-50 text-black border border-black py-3 rounded-none font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 transition-all\">\n                        <i data-lucide=\"x\" class=\"w-3.5 h-3.5 text-red-600\"></i> Rechazar\n                      </button>\n                    </div>\n                ")
    ; __line = 1188
    ;  } 
    ; __append("\n              </div>\n            </div>\n\n            <!-- Detailed Breakdown Table (Hidden by default) -->\n            <div id=\"budget-breakdown-details\" class=\"hidden mt-10 pt-10 border-t border-black overflow-hidden w-full\">\n              <h4 class=\"text-[11px] font-black text-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3\">\n                 <span class=\"w-1.5 h-4 bg-black\"></span> Desglose económico detallado\n              </h4>\n              <div class=\"overflow-x-auto\">\n                <table class=\"w-full text-left border-collapse\">\n                  <thead>\n                    <tr class=\"bg-black text-white\">\n                      <th class=\"py-4 text-[9px] font-black uppercase tracking-[0.2em] px-6 border-r border-white/10\">Concepto / Servicio</th>\n                      <th class=\"py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right px-6 border-r border-white/10\">Base Imponible</th>\n                      <th class=\"py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right px-6 border-r border-white/10\">IVA %</th>\n                      <th class=\"py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right px-6 border-r border-white/10\">Cuota IVA</th>\n                      <th class=\"py-4 text-[9px] font-black uppercase tracking-[0.2em] text-right px-6\">Precio Total</th>\n                    </tr>\n                  </thead>\n                  <tbody class=\"divide-y divide-black/10\">\n                    ")
    ; __line = 1209
    ;  
                      const totalBase = proposal.totals?.total_base || 1;
                      const totalBaseAfter = proposal.totals?.total_base_after_discount || 0;
                      const globalDiscountRatio = totalBaseAfter / totalBase;
                    
    ; __line = 1213
    ; __append("\n                    ")
    ; __line = 1214
    ;  (proposal.totals?.breakdown || []).forEach(item => { 
    ; __append("\n                      <tr class=\"hover:bg-green-50 transition-colors group/row\">\n                        <td class=\"py-6 px-6 border-r border-black/5\">\n                          <span class=\"text-[11px] font-black text-black uppercase tracking-wider block group-hover/row:text-[#31713D]\">\n                            ")
    ; __line = 1218
    ; __append(escapeFn( item.name.includes(' - ') ? item.name.split(' - ')[1] : item.name ))
    ;  if (item.price_model !== 'fixed') { 
    ; __append(", para ")
    ; __append(escapeFn( item.pax ))
    ; __append(" asistentes")
    ;  } 
    ; __append("\n                          </span>\n                          <span class=\"text-[8px] font-bold text-black/40 uppercase tracking-widest mt-1 block\">\n                            ")
    ; __line = 1221
    ; __append(escapeFn( item.name.includes(' - ') ? item.name.split(' - ')[0] : 'Servicio' ))
    ; __append("\n                          </span>\n                        </td>\n                        <td class=\"py-6 px-6 text-right text-sm font-black text-black font-mono border-r border-black/5 whitespace-nowrap\">\n                          ")
    ; __line = 1225
    ; __append(escapeFn( (item.subtotal || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ))
    ; __append(" €\n                        </td>\n                        <td class=\"py-6 px-6 text-right text-[11px] font-black text-black/70 italic border-r border-black/5\">")
    ; __line = 1227
    ; __append(escapeFn( item.vat_rate ))
    ; __append("%</td>\n                        <td class=\"py-6 px-6 text-right text-sm font-black text-black font-mono border-r border-black/5 whitespace-nowrap\">\n                          ")
    ; __line = 1229
    ;  const itemVat = item.subtotal * (item.vat_rate / 100) * globalDiscountRatio; 
    ; __append("\n                          ")
    ; __line = 1230
    ; __append(escapeFn( (itemVat || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ))
    ; __append(" €\n                        </td>\n                        <td class=\"py-6 px-6 text-right text-sm font-black text-black font-mono whitespace-nowrap\">\n                          ")
    ; __line = 1233
    ; __append(escapeFn( (item.subtotal + itemVat).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ))
    ; __append(" €\n                        </td>\n                      </tr>\n                    ")
    ; __line = 1236
    ;  }) 
    ; __append("\n\n                    ")
    ; __line = 1238
    ;  if (proposal.totals?.discounts && proposal.totals.discounts.length > 0) { 
    ; __append("\n                      ")
    ; __line = 1239
    ;  proposal.totals.discounts.forEach(discount => { 
    ; __append("\n                        <tr class=\"bg-[#F2F8F3] group/disc\">\n                          <td class=\"py-6 px-6 border-r border-black/5\">\n                            <div class=\"flex items-center gap-2\">\n                                <i data-lucide=\"gift\" class=\"w-4 h-4 text-[#31713D]\"></i>\n                                <div>\n                                    <span class=\"text-[11px] font-black text-[#31713D] uppercase tracking-wider block\">")
    ; __line = 1245
    ; __append(escapeFn( discount.name ))
    ; __append("</span>\n                                    <span class=\"text-[8px] font-black text-black/40 uppercase italic\">Descuento Comercial</span>\n                                </div>\n                            </div>\n                          </td>\n                          <td class=\"py-6 px-6 text-right text-sm font-black text-[#31713D] font-mono border-r border-black/5 whitespace-nowrap\">\n                            -")
    ; __line = 1251
    ; __append(escapeFn( (discount.amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ))
    ; __append(" €\n                          </td>\n                          <td class=\"py-6 px-6 text-right text-[11px] font-black text-black/30 border-r border-black/5\"></td>\n                          <td class=\"py-6 px-6 text-right text-sm font-black text-black/30 font-mono border-r border-black/5\"></td>\n                          <td class=\"py-6 px-6 text-right text-sm font-black text-[#31713D] font-mono whitespace-nowrap\">\n                            -")
    ; __line = 1256
    ; __append(escapeFn( (discount.amount || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ))
    ; __append(" €\n                          </td>\n                        </tr>\n                      ")
    ; __line = 1259
    ;  }) 
    ; __append("\n                    ")
    ; __line = 1260
    ;  } 
    ; __append("\n                  </tbody>\n                  <tfoot class=\"bg-black text-white border-t border-white/20\">\n                    <tr>\n                      <td class=\"py-6 px-6 text-[10px] font-black uppercase tracking-widest\">INVERSIÓN FINAL</td>\n                      <td class=\"py-6 px-6 text-right font-mono text-sm text-[#A3E635]\">\n                         ")
    ; __line = 1266
    ; __append(escapeFn( (proposal.totals?.total_base_after_discount || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €\n                      </td>\n                      <td class=\"py-6 px-6\"></td>\n                      <td class=\"py-6 px-6 text-right font-mono text-sm\">\n                         ")
    ; __line = 1270
    ; __append(escapeFn( (proposal.totals?.total_vat || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €\n                      </td>\n                      <td class=\"py-6 px-6 text-right font-mono text-xl font-black text-[#A3E635]\">\n                         ")
    ; __line = 1273
    ; __append(escapeFn( (proposal.totals?.total_final || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €\n                      </td>\n                    </tr>\n                  </tfoot>\n                </table>\n              </div>\n            </div>\n          </div>\n          \n          <div class=\"bg-gray-50 px-10 py-4 flex justify-between items-center text-black\">\n            <span class=\"text-[8px] font-bold uppercase tracking-[0.2em]\">MICE CATERING © 2026 // Propuesta Comercial</span>\n            <span class=\"text-[10px] font-black uppercase tracking-widest\">Base Imponible tras descuento: ")
    ; __line = 1284
    ; __append(escapeFn( (proposal.totals?.total_base_after_discount || 0).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ".") ))
    ; __append(" €</span>\n            ")
    ; __line = 1285
    ;  if (!isLocked) { 
    ; __append("\n              <button onclick=\"window.print()\" class=\"text-black hover:text-gray-600 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all\">\n                <i data-lucide=\"printer\" class=\"w-3.5 h-3.5\"></i> Guardar PDF\n              </button>\n            ")
    ; __line = 1289
    ;  } 
    ; __append("\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <!-- Print Only Footer Decorator -->\n  <div class=\"hidden print:block fixed bottom-0 left-0 w-full py-8 px-12 border-t border-black bg-white\">\n    <div class=\"flex justify-between items-center\">\n      <div class=\"flex items-center gap-4\">\n        <img src=\"/logomice.png\" alt=\"MICE Catering\" class=\"h-8 w-auto\">\n        <div class=\"h-8 w-px bg-gray-200\"></div>\n        <div class=\"text-[8px] font-black text-black uppercase tracking-[0.2em] leading-tight\">\n          Catering Corporativo de Alto Nivel<br>\n          micecatering.com\n        </div>\n      </div>\n      <div class=\"text-right\">\n        <p class=\"text-[8px] font-black text-gray-900 uppercase tracking-widest mb-1\">Tu Asesor: ")
    ; __line = 1308
    ; __append(escapeFn( proposal.commercial_name ))
    ; __append("</p>\n        <p class=\"text-[7px] text-black italic\">Esta propuesta tiene carácter informativo y está sujeta a disponibilidad.</p>\n      </div>\n    </div>\n  </div>\n</main>\n\n<!-- Modal: Solicitar Modificaciones -->\n<div id=\"modal-modifications\" class=\"fixed inset-0 bg-black/80 hidden flex items-center justify-center z-[100] p-4 backdrop-blur-md\">\n  <div class=\"bg-white rounded-none shadow-2xl max-w-lg w-full transform transition-all overflow-hidden border border-white/10\">\n    <div class=\"px-8 py-8 relative flex flex-col items-center text-center overflow-hidden\">\n      <!-- Fondo decorativo con branding -->\n      <div class=\"absolute top-0 left-0 w-full h-24 opacity-10\" style=\"background-color: var(--brand-primary)\"></div>\n      \n      ")
    ; __line = 1322
    ;  if (proposal.logo_url) { 
    ; __append("\n        <img src=\"")
    ; __line = 1323
    ; __append(escapeFn( proposal.logo_url ))
    ; __append("\" alt=\"")
    ; __append(escapeFn( proposal.client_name ))
    ; __append("\" class=\"h-8 w-auto mb-6 relative z-10 scale-110 object-contain\">\n      ")
    ; __line = 1324
    ;  } 
    ; __append("\n\n      <h2 class=\"text-2xl font-black uppercase tracking-tighter text-gray-900 mb-2 relative z-10\">\n        ¿Qué cambios necesitas?\n      </h2>\n      <p class=\"text-black text-sm mb-6 max-w-[80%]\">Nuestro asesor ")
    ; __line = 1329
    ; __append(escapeFn( proposal.commercial_name ))
    ; __append(" recibirá tu solicitud inmediatamente.</p>\n\n      <div class=\"w-full space-y-4 relative z-10\">\n        <textarea id=\"modifications-text\" \n          placeholder=\"Ej: Aumentar 10 invitados, cambiar la hora de inicio a las 20:30, añadir opciones sin gluten...\"\n          rows=\"5\"\n          class=\"w-full bg-gray-50 border-2 border-black rounded-none p-6 text-sm font-medium focus:border-gray-300 focus:ring-0 transition-all resize-none placeholder:text-gray-300\"></textarea>\n      </div>\n\n      <div class=\"grid grid-cols-2 gap-3 w-full mt-8 relative z-10\">\n        <button onclick=\"document.getElementById('modal-modifications').classList.add('hidden')\" class=\"py-4 text-black font-bold uppercase tracking-widest text-[10px] hover:text-gray-600 transition-colors\">\n          Cancelar\n        </button>\n        <button id=\"btn-send-modifications\" \n                class=\"text-white py-4 font-black uppercase tracking-widest text-[11px] rounded-none shadow-xl hover:brightness-110 active:scale-95 transition-all\"\n                style=\"background-color: var(--brand-primary)\">\n          Enviar Mensaje\n        </button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Modal: Rechazar Propuesta -->\n<div id=\"modal-reject\" class=\"fixed inset-0 bg-black/80 hidden flex items-center justify-center z-[100] p-4 backdrop-blur-md\">\n  <div class=\"bg-white rounded-none shadow-2xl max-w-md w-full transform transition-all overflow-hidden border border-white/10\">\n    <div class=\"p-8 text-center\">\n      <div class=\"w-16 h-16 bg-red-50 text-red-600 rounded-none flex items-center justify-center mx-auto mb-6 border border-red-100\">\n        <i data-lucide=\"alert-triangle\" class=\"w-8 h-8\"></i>\n      </div>\n      \n      <h3 class=\"text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter\">¿Rechazar Propuesta?</h3>\n      <p class=\"text-black text-sm mb-8 leading-relaxed\">\n        Lamentamos que la propuesta no encaje. Si nos indicas el motivo, podremos ajustar futuras ofertas a tus necesidades.\n      </p>\n\n      <div class=\"space-y-4 mb-8\">\n        <textarea id=\"reject-reason\" \n          placeholder=\"Cuéntanos el motivo (opcional)...\"\n          rows=\"3\"\n          class=\"w-full bg-gray-50 border border-black rounded-none p-4 text-xs font-medium focus:border-red-500 focus:ring-0 transition-all resize-none\"></textarea>\n      </div>\n\n      <div class=\"flex flex-col gap-2\">\n        <button id=\"btn-confirm-reject\" class=\"w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-none hover:bg-red-700 transition-all shadow-lg shadow-red-200\">\n          CONFIRMAR RECHAZO\n        </button>\n        <button onclick=\"document.getElementById('modal-reject').classList.add('hidden')\" class=\"w-full py-3 text-black font-bold text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors\">\n          VOLVER ATRÁS\n        </button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Modal: Confirmar Selección de Venue -->\n<div id=\"modal-confirm-venue\" class=\"fixed inset-0 bg-black/70 hidden flex items-center justify-center z-[100] p-4 backdrop-blur-md\">\n  <div class=\"bg-white rounded-none shadow-2xl max-w-sm w-full transform transition-all overflow-hidden border border-white/10\">\n    <div class=\"p-8 text-center flex flex-col items-center\">\n      <div id=\"confirm-venue-media\" class=\"relative w-20 h-20 mb-6 border border-black/10 shadow-inner bg-gray-50 overflow-hidden flex items-center justify-center\">\n        <img id=\"confirm-venue-preview\" src=\"\" alt=\"Preview venue\" class=\"w-full h-full object-cover hidden\">\n        <div id=\"confirm-venue-overlay\" class=\"absolute hidden inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-left\">\n          <span id=\"confirm-venue-overlay-name\" class=\"block text-[8px] font-black uppercase tracking-wider text-white truncate\"></span>\n        </div>\n        <div id=\"confirm-venue-icon\" class=\"w-full h-full flex items-center justify-center\" style=\"background-color: var(--brand-primary); opacity: 0.1\">\n          <i data-lucide=\"map-pin\" class=\"w-10 h-10\" style=\"color: var(--brand-primary)\"></i>\n        </div>\n      </div>\n      \n      <h3 class=\"text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter\">¿Confirmar Espacio?</h3>\n      <p class=\"text-black text-sm mb-8 leading-relaxed max-w-[80%]\">\n        Vas a seleccionar <span id=\"confirm-venue-name\" class=\"font-bold text-gray-900 border-b-2\" style=\"border-color: var(--brand-primary)\"></span> como tu ubicación.\n      </p>\n\n      <div class=\"space-y-3 w-full\">\n        <button id=\"btn-modal-venue-confirm\" \n                class=\"w-full py-4 text-white font-black uppercase tracking-widest text-xs rounded-none transition-all shadow-xl hover:brightness-110 active:scale-95 transform\"\n                style=\"background-color: var(--brand-primary)\">\n          SÍ, CONFIRMAR SELECCIÓN\n        </button>\n        <button onclick=\"closeConfirmVenueModal()\" class=\"w-full py-3 text-black font-bold text-[10px] uppercase tracking-widest hover:text-gray-600 transition-colors\">\n          CANCELAR\n        </button>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Modal: Detalles del Venue -->\n<div id=\"modal-venue-details\" class=\"fixed inset-0 bg-black/60 hidden flex items-center justify-center z-[60] p-4 backdrop-blur-md\">\n  <div class=\"bg-white rounded-none shadow-2xl max-w-5xl w-full h-[85vh] overflow-hidden flex flex-col md:flex-row transform transition-all border border-white/20\">\n    <!-- Left Column: Carousel (50%) + Map (50%) -->\n    <div class=\"w-full md:w-1/2 h-full flex flex-col bg-gray-100 border-r border-black\">\n      <!-- Top 50%: Image Carousel -->\n      <div class=\"h-1/2 relative bg-gray-900 group overflow-hidden\">\n        <div id=\"modal-venue-carousel\" class=\"flex h-full w-full transition-transform duration-500 ease-out\">\n           <!-- Imágenes inyectadas vía JS -->\n        </div>\n        \n        <!-- Navigation Arrows -->\n        <button onclick=\"prevVenueImage()\" class=\"absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/90 backdrop-blur p-2 rounded-none text-white hover:text-gray-900 transition-all shadow-lg opacity-0 group-hover:opacity-100 z-20\">\n          <i data-lucide=\"chevron-left\" class=\"w-6 h-6\"></i>\n        </button>\n        <button onclick=\"nextVenueImage()\" class=\"absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/90 backdrop-blur p-2 rounded-none text-white hover:text-gray-900 transition-all shadow-lg opacity-0 group-hover:opacity-100 z-20\">\n          <i data-lucide=\"chevron-right\" class=\"w-6 h-6\"></i>\n        </button>\n\n        <!-- Counter Indicator -->\n        <div class=\"absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-none border border-white/10 flex items-center gap-2 z-20\">\n          <span id=\"carousel-current\" class=\"text-white font-black text-xs\">1</span>\n          <span class=\"text-white/40 font-bold text-[10px]\">/</span>\n          <span id=\"carousel-total\" class=\"text-white/60 font-bold text-xs\">0</span>\n        </div>\n      </div>\n\n      <!-- Bottom 50%: Operational Map -->\n      <div class=\"h-1/2 relative\">\n        <div id=\"modal-venue-map-container\" class=\"w-full h-full bg-gray-50\">\n          <iframe id=\"modal-venue-map\" width=\"100%\" height=\"100%\" style=\"border:0;\" src=\"\" allowfullscreen=\"\" loading=\"lazy\"></iframe>\n        </div>\n        <div class=\"absolute top-4 left-4 z-10 pointer-events-none\">\n          <div class=\"bg-white/90 backdrop-blur px-3 py-1.5 rounded-none shadow-lg border border-black0 flex items-center gap-2\">\n            <i data-lucide=\"map-pin\" class=\"w-3.5 h-3.5 text-blue-500\"></i>\n            <span class=\"text-[9px] font-black uppercase tracking-widest text-gray-700\">Ubicación</span>\n          </div>\n        </div>\n      </div>\n    </div>\n\n    <!-- Info Side -->\n    <div class=\"w-full md:w-1/2 flex flex-col h-full bg-white\">\n      <!-- Header -->\n      <div class=\"relative border-b border-black\">\n        <button onclick=\"closeVenueModal()\" class=\"absolute top-4 right-4 z-20 p-2 bg-white hover:bg-red-50 hover:text-red-500 transition-all border border-black\">\n          <i data-lucide=\"x\" class=\"w-5 h-5\"></i>\n        </button>\n\n        <div class=\"p-4 md:p-5 bg-gray-50 border-b border-black/20\">\n          <div class=\"grid grid-cols-3 gap-2 md:gap-3 items-stretch pr-12\">\n            ")
    ; __line = 1468
    ;  if (!isLocked) { 
    ; __append("\n              <button id=\"btn-confirm-select-venue\" class=\"col-span-1 h-11 bg-[#31713D] text-white font-black uppercase tracking-[0.12em] text-[10px] md:text-[11px] border border-black shadow-md hover:brightness-110 transition-all active:scale-[0.99] flex items-center justify-center gap-2\">\n                <i data-lucide=\"check-circle\" class=\"w-4 h-4 md:w-4.5 md:h-4.5\"></i>\n                <span>ELEGIR</span>\n              </button>\n            ")
    ; __line = 1473
    ;  } 
    ; __append("\n\n            <button onclick=\"navigateVenue(-1)\" class=\"venue-nav-btn h-11 bg-white border border-black text-gray-700 text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5\">\n              <i data-lucide=\"arrow-left\" class=\"w-4 h-4\"></i>\n              <span>Anterior</span>\n            </button>\n\n            <button onclick=\"navigateVenue(1)\" class=\"venue-nav-btn h-11 bg-gray-900 text-white border border-black text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-1.5\">\n              <span>Siguiente</span>\n              <i data-lucide=\"arrow-right\" class=\"w-4 h-4\"></i>\n            </button>\n          </div>\n        </div>\n\n        <div class=\"p-6 md:p-8 md:pb-5\">\n          <div class=\"space-y-1.5\">\n            <div class=\"flex items-center gap-2\">\n              <span class=\"text-[10px] uppercase font-black tracking-[0.3em] text-[#31713D]\">Detalles del Espacio</span>\n              <span id=\"modal-venue-counter\" class=\"bg-gray-100 text-black text-[10px] px-2 py-0.5 rounded-none font-bold\">1 / 3</span>\n            </div>\n            <h2 id=\"modal-venue-title\" class=\"text-3xl md:text-4xl font-black text-gray-900 leading-none tracking-tighter\">\n              Nombre del Venue\n            </h2>\n          </div>\n        </div>\n      </div>\n\n      <!-- Content -->\n      <div class=\"flex-1 overflow-y-auto px-6 md:px-8 py-5 space-y-5\">\n        <div class=\"space-y-2\">\n          <p class=\"text-[10px] uppercase font-bold tracking-widest text-black\">Descripción del Espacio</p>\n          <p id=\"modal-venue-description\" class=\"text-sm text-gray-600 leading-relaxed\">\n            ...\n          </p>\n        </div>\n\n        <div id=\"modal-venue-link-container\" class=\"space-y-3\">\n           <a id=\"modal-venue-link\" href=\"#\" target=\"_blank\" class=\"w-full py-4 bg-gray-900 text-white rounded-none font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl border border-black\">\n             <i data-lucide=\"external-link\" class=\"w-5 h-5 text-blue-400\"></i>\n             Ver en micecatering.com\n           </a>\n        </div>\n\n        <div id=\"modal-venue-address-container\" class=\"space-y-2 bg-gray-50 p-6 rounded-none border border-black\">\n          <p class=\"text-[10px] uppercase font-bold tracking-widest text-black\">Dirección</p>\n          <div class=\"flex items-start gap-3\">\n             <i data-lucide=\"map-pin\" class=\"w-5 h-5 text-blue-500 mt-0.5\"></i>\n             <p id=\"modal-venue-address\" class=\"text-sm font-bold text-gray-800\">\n               Cargando dirección...\n             </p>\n          </div>\n        </div>\n      </div>\n      \n      <!-- Footer -->\n      <div class=\"px-6 md:px-8 py-4 border-t border-black bg-gray-50/70\">\n        <p class=\"text-[9px] italic text-black text-center mb-0 leading-tight\">\n          La disponibilidad está sujeta a confirmación final por parte del espacio.\n        </p>\n      </div>\n    </div>\n  </div>\n</div>\n\n<!-- Modal: Zoom de Imágenes (Lightbox) -->\n<div id=\"modal-venue-zoom\" class=\"fixed inset-0 bg-black/95 hidden z-[70] flex flex-col items-center justify-center p-4 md:p-12 backdrop-blur-sm\">\n  <!-- Close Button -->\n  <button onclick=\"closeVenueZoom()\" class=\"absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-[80]\">\n    <i data-lucide=\"x\" class=\"w-10 h-10\"></i>\n  </button>\n\n  <!-- Zoom Slider Container -->\n  <div class=\"relative w-full max-w-6xl aspect-[16/9] md:h-[80vh]\">\n    <div class=\"w-full h-full overflow-hidden\">\n      <div id=\"zoom-carousel\" class=\"flex h-full w-full transition-transform duration-500 ease-out\">\n        <!-- Inyectado por JS -->\n      </div>\n    </div>\n\n    <!-- Navigation -->\n    <button id=\"zoom-prev\" onclick=\"changeZoomImage(-1)\" class=\"absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-10\">\n      <i data-lucide=\"chevron-left\" class=\"w-12 h-12\"></i>\n    </button>\n    <button id=\"zoom-next\" onclick=\"changeZoomImage(1)\" class=\"absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors p-4 z-10\">\n      <i data-lucide=\"chevron-right\" class=\"w-12 h-12\"></i>\n    </button>\n\n    <!-- Indicator -->\n    <div class=\"absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-3 items-center\">\n      <span id=\"zoom-current\" class=\"text-white font-black text-xl\">1</span>\n      <span class=\"text-white/20 text-sm\">/</span>\n      <span id=\"zoom-total\" class=\"text-white/40 font-bold text-lg\">0</span>\n    </div>\n  </div>\n</div>\n\n<!-- Professional Styles -->\n<style>\n  @media print {\n    @page {\n      margin: 1.5cm;\n      size: A4;\n    }\n    \n    body {\n      background: white !important;\n      font-size: 12pt;\n    }\n\n    .print\\:hidden {\n      display: none !important;\n    }\n\n    /* Force background colors */\n    * {\n      -webkit-print-color-adjust: exact !important;\n      print-color-adjust: exact !important;\n    }\n\n    /* Container adjustments */\n    .max-w-7xl, .max-w-6xl {\n      max-width: 100% !important;\n      padding: 0 !important;\n      margin: 0 !important;\n    }\n\n    main {\n      padding: 0 !important;\n      background: white !important;\n    }\n\n    /* Hide elements not needed in PDF */\n    nav, footer, .fixed, .modal, button, a[href^=\"#\"], .cursor-pointer {\n      display: none !important;\n    }\n\n    /* Card adjustments for print */\n    .card {\n      box-shadow: none !important;\n      border: 1px solid #eee !important;\n      break-inside: avoid;\n      margin-bottom: 0.1rem !important;\n      padding-top: 0.5rem !important;\n      padding-bottom: 0.5rem !important;\n    }\n\n    .card > div {\n      padding-top: 0.25rem !important;\n      padding-bottom: 0.25rem !important;\n    }\n\n    /* Hero section print refinement */\n    .hero-print {\n      min-height: 380px !important;\n      break-after: avoid;\n      background-color: #111827 !important;\n    }\n\n    .hero-print img {\n      opacity: 1 !important;\n    }\n\n    /* Print Titles */\n    .card-header {\n      background-color: #f3f4f6 !important;\n      border-bottom: 2px solid #111827 !important;\n    }\n\n    /* Remove interactive elements labels like \"Solicitar cambios\" */\n    .print\\:hidden, #modal-modifications, #modal-reject, #chat-toggle {\n      display: none !important;\n    }\n\n    /* Footer adjustments */\n    #chat-section { display: none !important; }\n\n    /* Always show contract conditions on print */\n    #institutional-conditions {\n      display: block !important;\n    }\n  }\n\n  .form-input {\n    width: 100%;\n    padding: 0.75rem;\n    border: 1px solid #d1d5db;\n    border-radius: 0.5rem;\n    font-family: inherit;\n    font-size: 0.875rem;\n    transition: all 150ms ease;\n  }\n\n  .form-input:focus {\n    outline: none;\n    border-color: #3b82f6;\n    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);\n  }\n\n  .btn {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    gap: 0.5rem;\n    padding: 0.75rem 1.5rem;\n    border-radius: 0.75rem;\n    font-weight: 600;\n    font-size: 0.875rem;\n    transition: all 150ms ease;\n    cursor: pointer;\n    text-decoration: none;\n    border: 1px solid transparent;\n  }\n\n  .btn-primary {\n    background-color: #3b82f6;\n    color: white;\n    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);\n  }\n\n  .btn-primary:hover {\n    background-color: #2563eb;\n    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);\n    transform: translateY(-2px);\n  }\n\n  .btn-secondary {\n    background-color: #e5e7eb;\n    color: #1f2937;\n  }\n\n  .btn-secondary:hover {\n    background-color: #d1d5db;\n  }\n\n  .btn-outline {\n    border: 2px solid #d1d5db;\n    color: #374151;\n    background-color: transparent;\n  }\n\n  .btn-outline:hover {\n    background-color: #f9fafb;\n    border-color: #9ca3af;\n  }\n\n  .btn-lg {\n    padding: 1rem 1.5rem;\n    font-size: 1rem;\n  }\n\n  /* 💬 Chat Widget Styles */\n  #chat-widget {\n    position: fixed;\n    bottom: 6.25rem;\n    right: 1.5rem;\n    z-index: 110;\n  }\n\n  #btn-toggle-chat {\n    width: 3.5rem;\n    height: 3.5rem;\n    border-radius: 9999px;\n    background-color: #31713D;\n    color: #FFFFFF;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);\n    cursor: pointer;\n    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);\n  }\n\n  #btn-toggle-chat:hover {\n    transform: scale(1.1) rotate(5deg);\n    box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.3);\n  }\n\n  #chat-window {\n    position: absolute;\n    bottom: 5rem;\n    right: 0;\n    width: 24rem;\n    height: 34rem;\n    background-color: white;\n    border-radius: 1.5rem;\n    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n    border: 1px solid #f3f4f6;\n    overflow: hidden;\n    z-index: 101;\n    transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1);\n    transform-origin: bottom right;\n  }\n\n  /* .message styles removed - using tailwind in JS */\n  .bg-brand { background-color: var(--brand-primary); }\n  .text-brand { color: var(--brand-primary); }\n  .border-brand { border-color: var(--brand-primary); }\n\n  /* 📱 Chat Full Screen en Móvil o pantallas pequeñas */\n  @media (max-width: 768px) {\n    #chat-window {\n      position: fixed;\n      bottom: 0 !important;\n      right: 0 !important;\n      width: 100vw !important;\n      height: 100vh !important;\n      height: -webkit-fill-available;\n      border-radius: 0 !important;\n      z-index: 999;\n    }\n\n    #chat-messages {\n      padding: 1.5rem !important;\n      gap: 1rem !important;\n    }\n\n    /* Letras mucho más grandes en móvil/pantalla completa */\n    .message {\n      font-size: 1.125rem !important;\n      line-height: 1.5rem !important;\n      max-width: 90% !important;\n      padding: 1rem 1.25rem !important;\n    }\n\n    .message p.text-\\[10px\\] {\n      font-size: 0.75rem !important;\n      margin-bottom: 0.5rem !important;\n    }\n\n    #chat-input {\n      font-size: 1.125rem !important;\n      padding: 1rem 1.5rem !important;\n    }\n\n    #btn-send-message {\n      width: 3.5rem !important;\n      height: 3.5rem !important;\n    }\n\n    /* Header del chat más grande */\n    #chat-window h3 {\n      font-size: 1.125rem !important;\n    }\n    #chat-window p.text-\\[10px\\] {\n      font-size: 0.75rem !important;\n    }\n  }\n\n  @media print {\n    .btn, nav, .sticky, button, #btn-accept, #btn-modifications, #btn-reject, #chat-widget {\n      display: none !important;\n    }\n    \n    #modal-modifications, #modal-reject {\n      display: none !important;\n    }\n  }\n</style>\n\n<!-- 💬 Chat Widget -->\n<div id=\"chat-widget\" class=\"print:hidden\">\n    <div id=\"chat\" class=\"absolute -top-20\"></div>\n    <div id=\"chat-window\" class=\"hidden flex flex-col\">\n        <div class=\"p-5 flex justify-between items-center shadow-lg shrink-0\" style=\"background-color: #31713D; color: #FFFFFF\">\n            <div class=\"flex items-center gap-3\">\n              <div class=\"relative\">\n                ")
    ; __line = 1839
    ;  if (proposal.commercial_avatar) { 
    ; __append("\n                  <img src=\"")
    ; __line = 1840
    ; __append(escapeFn( proposal.commercial_avatar ))
    ; __append("\" alt=\"")
    ; __append(escapeFn( proposal.commercial_name ))
    ; __append("\" class=\"w-10 h-10 rounded-none border border-white/30 object-cover shadow-lg\">\n                ")
    ; __line = 1841
    ;  } else { 
    ; __append("\n                  <div class=\"w-10 h-10 bg-white/20 backdrop-blur-md rounded-none flex items-center justify-center border border-white/30\">\n                    <i data-lucide=\"user\" class=\"w-5 h-5 text-white opacity-70\"></i>\n                  </div>\n                ")
    ; __line = 1845
    ;  } 
    ; __append("\n              </div>\n              <div class=\"flex flex-col\">\n                <h3 class=\"font-black text-xs uppercase tracking-[0.1em]\">")
    ; __line = 1848
    ; __append(escapeFn( proposal.commercial_name || 'Tu Asesor' ))
    ; __append("</h3>\n                <p class=\"text-[9px] opacity-70 font-bold uppercase tracking-widest mt-0.5\">Asesor MICE Catering</p>\n              </div>\n            </div>\n            <button onclick=\"toggleChat(event)\" class=\"bg-white/10 hover:bg-white/20 p-2 rounded-none transition-all active:scale-90 text-white\">\n                <i data-lucide=\"x\" class=\"w-5 h-5\"></i>\n            </button>\n        </div>\n        \n        <div id=\"chat-messages\" class=\"flex-1 overflow-y-auto p-5 bg-slate-50/50 flex flex-col gap-1 scroll-smooth\">\n            <!-- Los mensajes se cargan dinámicamente -->\n            <div class=\"text-center py-10 opacity-30 italic\">\n              <i data-lucide=\"message-circle\" class=\"w-10 h-10 mx-auto mb-2\"></i>\n              <p class=\"text-[9px] uppercase tracking-widest font-black\">Tu historial de mensajes</p>\n            </div>\n        </div>\n\n        <div class=\"p-5 bg-white border-t border-black flex flex-col gap-3 shrink-0\">\n            <div class=\"relative flex items-center\">\n              <input type=\"text\" id=\"chat-input\" placeholder=\"Pregunta algo sobre el evento...\" \n                     class=\"w-full bg-gray-50 border border-black rounded-none px-5 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all placeholder:text-gray-300 shadow-inner\">\n              <button id=\"btn-send-message\" class=\"absolute right-2 w-10 h-10 rounded-none flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl\" style=\"background-color: #31713D; color: #FFFFFF\">\n                  <i data-lucide=\"send\" class=\"w-4 h-4\"></i>\n              </button>\n            </div>\n            <div class=\"flex items-center justify-center gap-2 opacity-20\">\n              <i data-lucide=\"lock\" class=\"w-2.5 h-2.5\"></i>\n              <span class=\"text-[8px] font-black uppercase tracking-[0.2em]\">Conexión Segura</span>\n            </div>\n        </div>\n    </div>\n    \n    <button id=\"btn-toggle-chat\" onclick=\"toggleChat(event)\" class=\"relative group !p-0 overflow-hidden border-2 border-white shadow-2xl\">\n        ")
    ; __line = 1881
    ;  if (proposal.commercial_avatar) { 
    ; __append("\n          <img src=\"")
    ; __line = 1882
    ; __append(escapeFn( proposal.commercial_avatar ))
    ; __append("\" alt=\"Chat\" class=\"w-full h-full object-cover\">\n        ")
    ; __line = 1883
    ;  } else { 
    ; __append("\n          <i data-lucide=\"message-circle\" class=\"w-7 h-7\"></i>\n        ")
    ; __line = 1885
    ;  } 
    ; __append("\n        <!-- Tooltip indicativo -->\n        <span class=\"absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-none opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-xl\">\n          ¿Alguna duda? ")
    ; __line = 1888
    ; __append(escapeFn( proposal.commercial_name ? 'Habla con ' + proposal.commercial_name.split(' ')[0] : 'Chat en vivo' ))
    ; __append("\n        </span>\n        <!-- Badge de notificación -->\n        <span id=\"chat-badge-bubble\" class=\"absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-none hidden animate-pulse\"></span>\n    </button>\n</div>\n\n<!-- Script Toggle Chat -->\n<script>\n  window.toggleChat = function(event) {\n    if (event) event.stopPropagation();\n    const chatWindow = document.getElementById('chat-window');\n    if (!chatWindow) return;\n    \n    const isHidden = chatWindow.classList.contains('hidden');\n    \n    if (isHidden) {\n      chatWindow.classList.remove('hidden');\n      chatWindow.classList.add('flex');\n      // Limpiar badges al abrir\n      if (window.showChatBadges) window.showChatBadges(false);\n      // Foco al input tras un pequeño delay para que la transición (si hubiera) respete\n      setTimeout(() => {\n        const input = document.getElementById('chat-input');\n        if(input) input.focus();\n        \n        // Scroll al fondo al abrir\n        const chatMessages = document.getElementById('chat-messages');\n        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;\n      }, 100);\n    } else {\n      chatWindow.classList.add('hidden');\n      chatWindow.classList.remove('flex');\n    }\n  };\n\n  // Cierre por click fuera o ESC para Chat Cliente\n  document.addEventListener('click', (e) => {\n    const chatWindow = document.getElementById('chat-window');\n    const chatWidget = document.getElementById('chat-widget');\n    if (!chatWindow || chatWindow.classList.contains('hidden')) return;\n    \n    // Si el click es fuera del widget completo y no es el botón toggle\n    if (!chatWidget.contains(e.target)) {\n      window.toggleChat();\n    }\n  });\n\n  document.addEventListener('keydown', (e) => {\n    if (e.key === 'Escape') {\n      const chatWindow = document.getElementById('chat-window');\n      if (chatWindow && !chatWindow.classList.contains('hidden')) {\n        window.toggleChat();\n      }\n    }\n  });\n\n  // Funciones para Manifiesto Sostenible\n  function toggleSustainability() {\n    console.log('Toggle Sustainability triggered');\n    const content = document.getElementById('manifiesto-content');\n    if (!content) return;\n\n    const isHidden = content.classList.contains('hidden');\n    if (isHidden) {\n      content.classList.remove('hidden');\n    } else {\n      content.classList.add('hidden');\n    }\n\n    const chevron = document.getElementById('sustainability-chevron');\n    if (chevron) {\n      chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';\n      chevron.style.transition = 'transform 0.3s ease';\n    }\n\n    // Asegurar iconos al abrir\n    if (isHidden && typeof lucide !== 'undefined') {\n      setTimeout(() => lucide.createIcons(), 10);\n    }\n  }\n\n  // Hacerlas globales\n  window.toggleSustainability = toggleSustainability;\n\n  window.showSlide = function(id) {\n    console.log('Showing slide:', id);\n    // Esconder todos los containers\n    const slides = document.querySelectorAll('.slide-container');\n    slides.forEach(el => el.classList.add('hidden'));\n    \n    // Mostrar el seleccionado\n    const target = document.getElementById('slide-' + id);\n    if(target) target.classList.remove('hidden');\n\n    // Actualizar botones\n    document.querySelectorAll('[id^=\"btn-slide-\"]').forEach(btn => {\n      btn.classList.remove('bg-white', 'shadow-sm', 'text-gray-900', 'border-black');\n      btn.classList.add('text-black', 'border-transparent');\n    });\n\n    const activeBtn = document.getElementById('btn-slide-' + id);\n    if(activeBtn) {\n      activeBtn.classList.remove('text-black', 'border-transparent');\n      activeBtn.classList.add('bg-white', 'shadow-sm', 'text-gray-900', 'border-black');\n    }\n    \n    // Refresh icons if content was hidden\n    if (typeof lucide !== 'undefined') lucide.createIcons();\n  };\n\n  // Auto-open chat if hash is #chat\n  window.addEventListener('DOMContentLoaded', () => {\n    if (window.location.hash === '#chat') {\n      setTimeout(() => {\n        const chatWindow = document.getElementById('chat-window');\n        if (chatWindow && chatWindow.classList.contains('hidden')) {\n          toggleChat();\n        }\n      }, 800);\n    }\n  });\n\n  // Toggle para desglose económico\n  window.toggleBudgetBreakdown = function() {\n    const details = document.getElementById('budget-breakdown-details');\n    const chevron = document.getElementById('breakdown-chevron');\n    if (!details || !chevron) return;\n    \n    if (details.classList.contains('hidden')) {\n      details.classList.remove('hidden');\n      chevron.classList.add('rotate-180');\n      // Scroll suave al desglose\n      details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });\n    } else {\n      details.classList.add('hidden');\n      chevron.classList.remove('rotate-180');\n    }\n  };\n</script>\n\n<!-- Script de cliente -->\n<script>\n  (function(){\n    const mainEl = document.querySelector('main') || document.body;\n    try {\n      const raw = mainEl.getAttribute('data-proposed-venues');\n      window.proposedVenues = raw ? JSON.parse(raw) : [];\n    } catch(e) { window.proposedVenues = []; }\n    window.commercialAvatar = ")
    ; __line = 2037
    ; __append( JSON.stringify(proposal.commercial_avatar || '') )
    ; __append(";\n    window.commercialName = ")
    ; __line = 2038
    ; __append( JSON.stringify(proposal.commercial_name || 'Asesor') )
    ; __append(";\n  })();\n</script>\n<script src=\"https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js\"></script>\n<script src=\"https://cdn.jsdelivr.net/npm/dayjs@1/locale/es.js\"></script>\n<script>\n  // Inicializar locale de dayjs\n  if (typeof dayjs !== 'undefined') {\n    dayjs.locale('es');\n  }\n</script>\n<script src=\"/js/client-proposal.js\" defer></script>\n\n<script src=\"https://unpkg.com/lucide@latest\"></script>\n<script>\n  // Inicializar iconos de Lucide\n  window.addEventListener('DOMContentLoaded', () => {\n    if (typeof lucide !== 'undefined') {\n      lucide.createIcons();\n    }\n  });\n</script>\n\n<!-- MODAL DE DETALLE DE MENÚ -->\n<div id=\"service-menu-modal\" class=\"fixed inset-0 z-[100] hidden overflow-y-auto\" aria-labelledby=\"modal-title\" role=\"dialog\" aria-modal=\"true\">\n  <div class=\"flex items-center justify-center min-h-screen px-3 pt-2 pb-8 text-center sm:block sm:p-0\">\n    <div class=\"fixed inset-0 transition-opacity bg-gray-900/90 backdrop-blur-sm\" onclick=\"closeMenuModal()\"></div>\n    \n    <div class=\"inline-block w-full max-w-7xl my-4 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-none relative\">\n        <!-- Botón cerrar -->\n        <button onclick=\"closeMenuModal()\" class=\"absolute top-4 right-4 md:top-5 md:right-5 z-20 p-2.5 md:p-3 bg-black text-white hover:bg-[#31713D] transition-all\">\n            <i data-lucide=\"x\" class=\"w-6 h-6\"></i>\n        </button>\n\n        <div id=\"menu-modal-content\">\n            <!-- Cargado dinámicamente -->\n        </div>\n    </div>\n  </div>\n</div>\n\n<!-- MODAL GALERÍA CAROUSEL -->\n<div id=\"gallery-carousel-modal\" class=\"fixed inset-0 z-[200] hidden flex flex-col items-center justify-center bg-black/95 transition-all\" role=\"dialog\" aria-modal=\"true\">\n    <button onclick=\"closeGalleryModal()\" class=\"absolute top-8 right-8 z-[220] p-4 text-white/50 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full\">\n        <i data-lucide=\"x\" class=\"w-8 h-8\"></i>\n    </button>\n\n    <!-- Flechas Navegación -->\n    <button onclick=\"prevGalleryImage()\" class=\"absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-[210] p-4 text-white bg-black/50 hover:bg-[#31713D] transition-all\">\n        <i data-lucide=\"chevron-left\" class=\"w-10 h-10\"></i>\n    </button>\n    <button onclick=\"nextGalleryImage()\" class=\"absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-[210] p-4 text-white bg-black/50 hover:bg-[#31713D] transition-all\">\n        <i data-lucide=\"chevron-right\" class=\"w-10 h-10\"></i>\n    </button>\n\n    <!-- Contenido Carousel -->\n    <div id=\"carousel-main-container\" class=\"relative w-full h-[85vh] flex items-center justify-center px-4 md:px-24\">\n        <img id=\"carousel-main-image\" src=\"\" class=\"max-h-full max-w-full object-contain shadow-2xl transition-all duration-300\">\n        \n      <!-- Overlay Info (Compacto, menos invasivo) -->\n      <div class=\"absolute bottom-5 left-5 md:bottom-8 md:left-8 max-w-[75vw] md:max-w-xl bg-[#31713D]/92 border border-white/20 px-4 py-3 md:px-5 md:py-4 text-white z-[215] shadow-xl backdrop-blur-[2px]\">\n        <h3 id=\"carousel-image-title\" class=\"text-lg md:text-2xl font-black italic tracking-tight uppercase leading-none mb-1.5\"></h3>\n        <p id=\"carousel-image-desc\" class=\"text-[11px] md:text-sm font-medium opacity-90 leading-snug\"></p>\n        </div>\n    </div>\n\n    <!-- Contador -->\n    <div class=\"absolute top-10 left-1/2 -translate-x-1/2 px-6 py-2 bg-white/10 rounded-full\">\n        <span id=\"carousel-counter\" class=\"text-white font-black text-sm tracking-widest uppercase\">1 / 1</span>\n    </div>\n</div>\n\n<!-- MODAL VIDEO PREVIEW -->\n<div id=\"video-preview-modal\" class=\"fixed inset-0 z-[230] hidden flex items-center justify-center bg-black/95 px-4\" role=\"dialog\" aria-modal=\"true\">\n  <div class=\"absolute inset-0\" onclick=\"closeVideoModal()\"></div>\n  <button onclick=\"closeVideoModal()\" class=\"absolute top-8 right-8 z-[240] p-4 text-white/70 hover:text-white transition-all bg-white/10 hover:bg-white/20 rounded-full\">\n    <i data-lucide=\"x\" class=\"w-8 h-8\"></i>\n  </button>\n  <div class=\"relative z-[235] w-full max-w-5xl\">\n    <div class=\"bg-black border border-white/20 shadow-2xl\">\n      <video id=\"video-preview-player\" class=\"w-full max-h-[82vh]\" controls playsinline preload=\"metadata\"></video>\n    </div>\n  </div>\n</div>\n\n<script>\n  // Intersection Observer globally defined\n  const observerOptions = {\n    threshold: 0.1,\n    rootMargin: '0px 0px -50px 0px'\n  };\n\n  const observer = new IntersectionObserver((entries) => {\n    entries.forEach(entry => {\n      if (entry.isIntersecting) {\n        entry.target.classList.add('visible');\n      }\n    });\n  }, observerOptions);\n\n  document.addEventListener('DOMContentLoaded', () => {\n    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));\n    \n    // Lucide Icons refresh\n    if (typeof lucide !== 'undefined') {\n      lucide.createIcons();\n    }\n  });\n\n  // Estado Global Galería\n  let currentGalleryImages = [];\n  let currentGalleryIndex = 0;\n\n  window.openGalleryAt = function(index) {\n      currentGalleryIndex = index;\n      updateGalleryModal();\n      document.getElementById('gallery-carousel-modal').classList.remove('hidden');\n      document.body.style.overflow = 'hidden';\n  };\n\n  window.closeGalleryModal = function() {\n      document.getElementById('gallery-carousel-modal').classList.add('hidden');\n      if (\n        !document.getElementById('service-menu-modal').classList.contains('hidden') ||\n        !document.getElementById('video-preview-modal').classList.contains('hidden')\n      ) {\n        document.body.style.overflow = 'hidden';\n      } else {\n        document.body.style.overflow = '';\n      }\n  };\n\n  window.openVideoModal = function(videoUrl) {\n    const modal = document.getElementById('video-preview-modal');\n    const player = document.getElementById('video-preview-player');\n    if (!modal || !player || !videoUrl) return;\n    player.src = videoUrl;\n    player.load();\n    modal.classList.remove('hidden');\n    document.body.style.overflow = 'hidden';\n    const playPromise = player.play();\n    if (playPromise && typeof playPromise.catch === 'function') {\n      playPromise.catch(() => {});\n    }\n  };\n\n  window.closeVideoModal = function() {\n    const modal = document.getElementById('video-preview-modal');\n    const player = document.getElementById('video-preview-player');\n    if (player) {\n      player.pause();\n      player.removeAttribute('src');\n      player.load();\n    }\n    if (modal) modal.classList.add('hidden');\n\n    const isMenuOpen = !document.getElementById('service-menu-modal').classList.contains('hidden');\n    const isGalleryOpen = !document.getElementById('gallery-carousel-modal').classList.contains('hidden');\n    document.body.style.overflow = (isMenuOpen || isGalleryOpen) ? 'hidden' : '';\n  };\n\n  function updateGalleryModal() {\n      const img = currentGalleryImages[currentGalleryIndex];\n      const mainImg = document.getElementById('carousel-main-image');\n      \n      mainImg.style.opacity = '0';\n      setTimeout(() => {\n          mainImg.src = img.src;\n          document.getElementById('carousel-image-title').innerText = img.title || '';\n          document.getElementById('carousel-image-desc').innerText = img.description || '';\n          document.getElementById('carousel-counter').innerText = `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;\n          mainImg.style.opacity = '1';\n      }, 200);\n  }\n\n  window.nextGalleryImage = function() {\n      currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;\n      updateGalleryModal();\n  };\n\n  window.prevGalleryImage = function() {\n      currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;\n      updateGalleryModal();\n  };\n\n  window.openMenuModal = function(input) {\n    try {\n        let opt;\n        let serviceTitle = '';\n        let serviceDate = '';\n        let servicePaxAttr = null;\n        let servicePricePaxAttr = null;\n        if (input instanceof HTMLElement) {\n            opt = JSON.parse(input.getAttribute('data-menu'));\n            serviceTitle = input.getAttribute('data-service-title') || '';\n            serviceDate = input.getAttribute('data-service-date') || '';\n            servicePaxAttr = input.getAttribute('data-service-pax');\n            servicePricePaxAttr = input.getAttribute('data-service-price-pax');\n        } else {\n            opt = typeof input === 'string' ? JSON.parse(input) : input;\n        }\n\n        const parseNumeric = (val) => {\n          if (val === null || val === undefined || val === '') return NaN;\n          const normalized = String(val).replace(',', '.').replace(/[^0-9.-]/g, '');\n          return Number(normalized);\n        };\n\n        const defaultPax = Number('")
    ; __line = 2246
    ; __append(escapeFn( proposal.pax || 0 ))
    ; __append("') || 0;\n        const parsedPaxFromAttr = parseNumeric(servicePaxAttr);\n        const resolvedPax = Number.isFinite(parsedPaxFromAttr) && parsedPaxFromAttr > 0 ? parsedPaxFromAttr : defaultPax;\n\n        const parsedPriceFromOption = parseNumeric(opt?.price_pax);\n        const parsedPriceFromAttr = parseNumeric(servicePricePaxAttr);\n        const resolvedPricePax = Number.isFinite(parsedPriceFromOption)\n          ? parsedPriceFromOption\n          : (Number.isFinite(parsedPriceFromAttr) ? parsedPriceFromAttr : 0);\n\n        // Almacenar datos para el chat predefinido\n        window.currentModalService = {\n          menuName: opt.name,\n          serviceTitle: serviceTitle,\n          serviceDate: serviceDate,\n          pax: resolvedPax,\n          pricePax: resolvedPricePax\n        };\n\n        const modal = document.getElementById('service-menu-modal');\n        const content = document.getElementById('menu-modal-content');\n        \n        // Preparar imágenes para galería global\n        currentGalleryImages = [];\n        if (opt.items && opt.items.length > 0) {\n            opt.items.forEach(item => {\n                if (item.image_url) {\n                    currentGalleryImages.push({\n                        src: item.image_url,\n                        title: item.name,\n                        description: item.description\n                    });\n                }\n            });\n        }\n        // Añadir imágenes principales del menú si no están\n        if (opt.images && opt.images.length > 0) {\n            opt.images.forEach(img => {\n                if (!currentGalleryImages.find(c => c.src === img)) {\n                    currentGalleryImages.push({ src: img, title: opt.name, description: '' });\n                }\n            });\n        }\n\n        let badgesHtml = (opt.badges || []).map(b => `<span class=\"bg-[#31713D] text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-sm\">${b}</span>`).join('');\n        \n        const formatMoney = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);\n\n        // Ajuste dinámico de tamaño de fuente para el título (Aún más compacto)\n        const nameLength = (opt.name || '').length;\n        let titleSizeClass = \"text-2xl md:text-4xl\";\n        if (nameLength > 25) titleSizeClass = \"text-xl md:text-3xl\";\n        \n        // Galería de imágenes (columnas adaptativas + altura compacta)\n        const imageCount = (opt.images || []).length;\n        const desktopColsClass = imageCount >= 4\n          ? 'md:grid-cols-4'\n          : (imageCount === 3 ? 'md:grid-cols-3' : (imageCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'));\n        const normalizedVideoUrl = (opt.video_url || '').trim();\n        const hasVideo = normalizedVideoUrl.length > 0;\n        const galleryWidthClass = hasVideo ? 'w-full' : 'max-w-4xl mx-auto';\n\n        let galleryHtml = imageCount > 0 ? `\n          <div class=\"grid grid-cols-2 ${desktopColsClass} auto-rows-fr gap-1 mb-2 overflow-hidden border border-black p-1 bg-gray-50 shadow-sm ${galleryWidthClass} h-full\">\n                ${opt.images.map((img, iIdx) => {\n                    const globalIdx = currentGalleryImages.findIndex(c => c.src === img);\n                    return `\n                    <div class=\"h-[140px] md:h-[160px] overflow-hidden border border-black group cursor-zoom-in\" onclick=\"openGalleryAt(${globalIdx >= 0 ? globalIdx : 0})\">\n                        <img src=\"${img}\" class=\"w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110\">\n                    </div>`;\n                }).join('')}\n            </div>` : '';\n\n        const videoPreviewHtml = hasVideo ? `\n          <div class=\"border border-black bg-gray-50 p-1.5 h-full min-h-[170px] md:min-h-[176px] flex flex-col shadow-sm\">\n            <div class=\"flex items-center justify-between mb-1.5 px-0.5\">\n              <span class=\"text-[9px] font-black uppercase tracking-[0.2em] text-[#31713D]\">Video</span>\n              <span class=\"text-[8px] font-black uppercase tracking-widest text-black/40\">Click para ampliar</span>\n            </div>\n            <button type=\"button\" onclick=\"openVideoModal('${normalizedVideoUrl.replace(/'/g, \"\\\\'\")}')\" class=\"group relative flex-1 min-h-[130px] md:min-h-[160px] bg-black border border-black/20 overflow-hidden cursor-pointer\">\n              <video src=\"${normalizedVideoUrl}\" class=\"w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity\" muted preload=\"metadata\" playsinline></video>\n              <div class=\"absolute inset-0 flex items-center justify-center pointer-events-none\">\n                <span class=\"w-10 h-10 rounded-full bg-black/55 border border-white/30 flex items-center justify-center text-white\">\n                  <i data-lucide=\"play\" class=\"w-4.5 h-4.5 ml-0.5\"></i>\n                </span>\n              </div>\n            </button>\n          </div>\n        ` : '';\n\n        const mediaBlockHtml = hasVideo\n          ? `<div class=\"grid grid-cols-1 lg:grid-cols-[minmax(0,4fr)_minmax(260px,1fr)] gap-2 items-stretch\">${galleryHtml || '<div class=\"h-full border border-black bg-gray-50 shadow-sm\"></div>'}${videoPreviewHtml}</div>`\n          : galleryHtml;\n\n        let detailsHtml = '';\n        if (opt.items && opt.items.length > 0) {\n            // Agrupar items por categoría\n            const groupedItems = opt.items.reduce((acc, item) => {\n                const cat = item.category || 'Otros';\n                if (!acc[cat]) acc[cat] = [];\n                acc[cat].push(item);\n                return acc;\n            }, {});\n\n            detailsHtml = Object.entries(groupedItems).map(([category, items]) => {\n                const itemsHtml = items.map((item, idx) => {\n                    const hasAllergens = (item.allergens || []).length > 0;\n                    const allergensHtml = hasAllergens ? `\n                        <div class=\"absolute bottom-full left-0 mb-4 hidden group-hover/desc:block z-50 animate-fadeIn bg-white border border-black p-4 shadow-2xl min-w-[280px]\">\n                            <div class=\"flex items-center gap-2 mb-3 pb-2 border-b border-black/5\">\n                                <i data-lucide=\"info\" class=\"w-3 h-3 text-[#31713D]\"></i>\n                                <span class=\"text-[9px] font-black uppercase tracking-widest text-[#31713D]\">Información de Alérgenos</span>\n                            </div>\n                            <div class=\"grid grid-cols-2 gap-3\">\n                                ${item.allergens.map(all => `\n                                    <div class=\"flex items-center gap-2\">\n                                        <div class=\"w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-200\">\n                                            <img src=\"/img/allergens/${all.toLowerCase().replace(/\\s/g, '')}.png\" class=\"w-5 h-5 object-contain\" onerror=\"this.parentElement.style.display='none'\">\n                                        </div>\n                                        <span class=\"text-[10px] font-bold text-gray-800 uppercase tracking-tighter\">${all}</span>\n                                    </div>`).join('')}\n                            </div>\n                        </div>` : `\n                        <div class=\"absolute bottom-full left-0 mb-4 hidden group-hover/desc:block z-50 animate-fadeIn bg-white border border-black p-4 shadow-2xl min-w-[240px]\">\n                            <div class=\"flex items-center gap-2\">\n                                <i data-lucide=\"shield-check\" class=\"w-4 h-4 text-[#31713D]\"></i>\n                                <span class=\"text-[10px] font-black uppercase tracking-widest text-[#31713D]\">No contiene alérgenos declarados</span>\n                            </div>\n                        </div>`;\n\n                    const globalIdx = currentGalleryImages.findIndex(c => c.src === item.image_url);\n\n                    return `\n                        <div class=\"py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group/item\">\n                          <div class=\"flex items-center gap-3\">\n                                ${item.image_url ? `\n                              <div class=\"w-10 h-10 flex-shrink-0 border border-black/10 overflow-hidden cursor-zoom-in\" onclick=\"openGalleryAt(${globalIdx})\">\n                                        <img src=\"${item.image_url}\" class=\"w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700\">\n                                    </div>\n                                ` : `\n                                    <div class=\"w-2 flex-shrink-0 h-2 bg-[#31713D]/40\"></div>\n                                `}\n                                <div class=\"flex-1 min-w-0\">\n                                    <h5 class=\"text-[12px] md:text-[13px] font-black text-gray-900 uppercase tracking-tight leading-none mb-0.5\">${item.name}</h5>\n                                    ${item.description ? `\n                                        <div class=\"relative group/desc max-w-2xl cursor-help\">\n                                        <p class=\"service-item-description text-[10px] md:text-[11px] text-gray-500 italic font-medium leading-tight whitespace-pre-line break-words\">${item.description}</p>\n                                            ${allergensHtml}\n                                        </div>` : ''}\n                                </div>\n                            </div>\n                        </div>`;\n                }).join('');\n\n                return `\n                    <div class=\"mb-4 last:mb-0 bg-white border border-black/10 p-3 md:p-4 shadow-sm\">\n                      <div class=\"flex items-center gap-3 mb-2\">\n                        <h6 class=\"text-[10px] md:text-[11px] font-black uppercase tracking-[0.28em] text-[#31713D] border-b-2 border-[#31713D] pb-1\">\n                                ${category}\n                            </h6>\n                        </div>\n                      <div class=\"grid grid-cols-1 md:grid-cols-2 gap-x-6\">\n                            ${itemsHtml}\n                        </div>\n                    </div>`;\n            }).join('');\n        }\n\n        content.innerHTML = `\n                <div class=\"bg-gray-50 p-4 md:p-6 pr-16 md:pr-20 border-b border-black\">\n                <div class=\"max-w-6xl mx-auto\">\n                    <div class=\"flex gap-1.5 mb-2\">${badgesHtml}</div>\n                    \n                    <div class=\"flex flex-col md:flex-row md:items-end justify-between gap-2 mb-2\">\n                        <h2 class=\"${titleSizeClass} font-black italic tracking-tighter uppercase leading-[0.9] text-gray-900 transition-all break-words\">${opt.name}</h2>\n                    </div>\n                    \n                    <div class=\"flex flex-col md:flex-row md:items-start justify-between gap-3\">\n                        <div class=\"flex-1\">\n                        ${opt.description ? `<p class=\"text-[12px] md:text-[14px] text-gray-700 italic font-medium leading-snug max-w-4xl border-l-2 border-[#31713D] pl-3 py-0.5 whitespace-pre-line\">${opt.description}</p>` : ''}\n                        </div>\n\n                        <div class=\"shrink-0 w-full md:w-auto md:min-w-[240px] space-y-2\">\n                          <div class=\"bg-white border border-black px-4 py-2.5 shadow-sm\">\n                            <span class=\"text-[9px] font-black text-black uppercase tracking-[0.18em] block mb-1 leading-none\">${window.currentModalService.pax} ASISTENTES</span>\n                            <div class=\"text-[12px] text-gray-700 font-bold mb-1.5 leading-none\">${formatMoney(window.currentModalService.pricePax)} <small class=\"text-[9px] text-gray-600\">/u</small></div>\n                            <div>\n                              <span class=\"text-[9px] font-black text-black uppercase tracking-[0.18em] block mb-1 leading-none\">SUBTOTAL SERVICIO</span>\n                              <span class=\"text-xl md:text-2xl font-black text-[#31713D] tracking-tighter leading-none\">\n                                ${formatMoney(window.currentModalService.pricePax * window.currentModalService.pax)}\n                              </span>\n                            </div>\n                          </div>\n\n                          ${opt.url_images ? `\n                          <a href=\"${opt.url_images}\" target=\"_blank\" class=\"w-full flex items-center justify-center gap-2 bg-white border border-black px-3 py-2 hover:bg-[#31713D] hover:text-white hover:border-[#31713D] transition-all group/link shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 relative overflow-hidden\">\n                            <i data-lucide=\"camera\" class=\"w-4 h-4 text-[#31713D] group-hover/link:text-white transition-colors\"></i>\n                            <span class=\"text-[9px] font-black uppercase tracking-[0.18em] leading-none\">Ver Álbum · Galería</span>\n                          </a>\n                          ` : ''}\n                        </div>\n                    </div>\n                </div>\n            </div>\n                <div class=\"p-4 md:p-6 bg-white min-h-[28vh]\">\n                <div class=\"max-w-7xl mx-auto\">\n                  ${mediaBlockHtml}\n                    <div class=\"mt-4\">\n                        ${detailsHtml}\n                    </div>\n                </div>\n            </div>\n            \n            <!-- Footer compacto: solo acción de chat -->\n                <div class=\"px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end\">\n              <div onclick=\"window.contactConsultantFromMenu()\" \n                 class=\"group inline-flex items-center gap-3 cursor-pointer\">\n                <div class=\"relative\">\n                  <div class=\"w-9 h-9 bg-[#31713D] rounded-none flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform\">\n                    <i data-lucide=\"message-circle\" class=\"w-4.5 h-4.5\"></i>\n                  </div>\n                </div>\n                <div class=\"text-left\">\n                  <p class=\"text-[9px] font-black uppercase tracking-widest text-[#31713D] mb-0.5\">Consultar dudas</p>\n                  <p class=\"text-sm font-bold text-gray-900 leading-none\">Hablar con tu gestor</p>\n                </div>\n              </div>\n            </div>\n        `;\n\n        modal.classList.remove('hidden');\n        document.body.style.overflow = 'hidden';\n        if (window.lucide) lucide.createIcons();\n    } catch (e) {\n        console.error(\"Error opening menu modal:\", e);\n    }\n  };\n\n  window.closeMenuModal = function() {\n    document.getElementById('service-menu-modal').classList.add('hidden');\n    if (\n      document.getElementById('gallery-carousel-modal').classList.contains('hidden') &&\n      document.getElementById('video-preview-modal').classList.contains('hidden')\n    ) {\n      document.body.style.overflow = '';\n    }\n  };\n</script>\n\n<!-- 🏁 FLOATING CONFIRMATION BAR (UX UPGRADE) -->\n<div id=\"floating-confirm-bar\" class=\"fixed bottom-0 inset-x-0 z-[60] bg-white border-t-2 border-black transform translate-y-full transition-transform duration-500 shadow-[0_-10px_30px_rgba(0,0,0,0.18)] print:hidden\">\n  <div class=\"max-w-7xl mx-auto px-6 py-3 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-3 md:gap-6\">\n    <div class=\"flex items-center gap-3 md:gap-4 min-w-0\">\n      <span class=\"inline-flex items-center h-[34px] px-3 border border-green-200 bg-green-50 text-[#31713D] text-[9px] font-black uppercase tracking-widest whitespace-nowrap\">\n        Base imponible\n      </span>\n      <span id=\"floating-total\" class=\"text-2xl md:text-3xl font-black text-[#31713D] tracking-tighter leading-none whitespace-nowrap\">")
    ; __line = 2502
    ; __append(escapeFn( formatCurrency(proposal.totals?.total_base_after_discount || 0) ))
    ; __append("</span>\n      <span class=\"hidden md:inline text-[9px] font-black uppercase tracking-widest text-gray-400\">(descuentos aplicados)</span>\n    </div>\n    <div class=\"flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end\">\n      <button onclick=\"toggleSidebar()\" class=\"flex-1 md:flex-none h-[42px] px-4 md:px-6 border border-black/20 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2\">\n        <i data-lucide=\"eye\" class=\"w-4 h-4 text-[#31713D]\"></i>\n        <span>Revisar Elecciones</span>\n      </button>\n      <button id=\"btn-floating-accept\" class=\"flex-1 md:flex-none h-[42px] px-5 md:px-8 bg-white text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.15em] shadow-2xl hover:bg-green-50 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 border-2 border-transparent hover:border-black\">\n        <i data-lucide=\"check-circle\" class=\"w-5 h-5 text-green-600\"></i>\n        <span>Confirmar mi Propuesta</span>\n      </button>\n    </div>\n  </div>\n</div>\n\n<!-- 📋 SIDEBAR / SELECTION DRAWER (UX UPGRADE) -->\n<div id=\"selection-sidebar-overlay\" class=\"fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] hidden transition-opacity duration-300 opacity-0\" onclick=\"toggleSidebar()\"></div>\n<div id=\"selection-sidebar\" class=\"fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[80] shadow-2xl transform translate-x-full transition-transform duration-500 flex flex-col border-l border-black print:hidden\">\n  <!-- Sidebar Header -->\n  <div class=\"brand-bg p-8 text-white relative\">\n    <button onclick=\"toggleSidebar()\" class=\"absolute top-8 right-8 text-white/60 hover:text-white transition-colors\">\n      <i data-lucide=\"x\" class=\"w-6 h-6\"></i>\n    </button>\n    <div class=\"flex items-center gap-4 mb-2\">\n      <div class=\"w-12 h-12 bg-white/10 flex items-center justify-center border border-white/20 overflow-hidden\">\n        ")
    ; __line = 2528
    ;  if (proposal.logo_url) { 
    ; __append("\n          <img src=\"")
    ; __line = 2529
    ; __append(escapeFn( proposal.logo_url ))
    ; __append("\" alt=\"")
    ; __append(escapeFn( proposal.client_name ))
    ; __append("\" class=\"w-full h-full object-contain bg-white p-1\" />\n        ")
    ; __line = 2530
    ;  } else { 
    ; __append("\n          <i data-lucide=\"shopping-bag\" class=\"w-6 h-6 text-green-400\"></i>\n        ")
    ; __line = 2532
    ;  } 
    ; __append("\n      </div>\n      <div>\n        <h2 class=\"text-2xl font-black tracking-tighter uppercase mb-0\">Mi Selección</h2>\n        <p class=\"text-[10px] font-bold text-white/50 uppercase tracking-widest leading-none\">Resumen de tu evento</p>\n      </div>\n    </div>\n  </div>\n\n  <!-- Sidebar Content -->\n  <div id=\"sidebar-choices-content\" class=\"flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50\">\n    <!-- Will be filled by JS: Venues + Selected Options -->\n    <div class=\"animate-pulse space-y-4\">\n      <div class=\"h-20 bg-gray-200\"></div>\n      <div class=\"h-20 bg-gray-200\"></div>\n      <div class=\"h-20 bg-gray-200\"></div>\n    </div>\n  </div>\n\n  <!-- Sidebar Footer -->\n  <div class=\"p-8 border-t border-black bg-white space-y-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]\">\n    <div class=\"space-y-2\">\n      <div class=\"flex justify-between items-center\">\n        <span class=\"text-[11px] font-black text-gray-400 uppercase tracking-widest\">Base Imponible</span>\n        <span id=\"sidebar-base\" class=\"text-3xl md:text-4xl font-black brand-text\">0,00 €</span>\n      </div>\n\n      <div id=\"sidebar-discount-row\" class=\"flex justify-between items-center brand-text\" style=\"display:none;\">\n        <span class=\"text-[11px] font-black uppercase tracking-widest\">Descuento</span>\n        <span id=\"sidebar-discount\" class=\"text-sm font-black\">-0,00 €</span>\n      </div>\n\n      <div class=\"flex justify-between items-center\">\n        <span class=\"text-[11px] font-black text-gray-400 uppercase tracking-widest\">IVA</span>\n        <span id=\"sidebar-iva\" class=\"text-sm font-bold text-gray-600\">0,00 €</span>\n      </div>\n\n      <div class=\"border-t border-black mt-2 pt-3 flex justify-between items-end\">\n        <span class=\"text-[11px] font-bold uppercase text-gray-600\">Total (IVA incl.)</span>\n        <span id=\"sidebar-total\" class=\"text-xl font-bold text-gray-700\">0,00 €</span>\n      </div>\n    </div>\n    <button id=\"btn-sidebar-accept\" class=\"w-full brand-bg text-white py-5 text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:brand-hover transition-all transform active:scale-95 flex items-center justify-center gap-4 group\">\n      <span>Confirmar Propuesta</span>\n      <i data-lucide=\"arrow-right\" class=\"w-5 h-5 group-hover:translate-x-1 transition-transform\"></i>\n    </button>\n    <button onclick=\"toggleChat(event)\" class=\"w-full bg-white border border-black text-black py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3\">\n      <i data-lucide=\"message-circle\" class=\"w-4 h-4 text-[#31713D]\"></i>\n      <span>Consultar dudas con mi asesor</span>\n    </button>\n  </div>\n</div>\n\n")
    ; __line = 2585
    ; __append( include('../partials/footer-client') )
    ; __append("\n</body>\n</html>\n\n")
    ; __line = 2589
