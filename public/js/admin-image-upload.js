/**
 * admin-image-upload.js
 * Propósito: Manejo de upload de imágenes con drag-and-drop, preview y optimización
 * Features: Progress tracking, compression metrics, image gallery
 */

let uploadedImages = [];
let totalOriginalSize = 0;
let totalCompressedSize = 0;

// ════════════════════════════════════════════════════════════════
// DRAG & DROP HANDLERS
// ════════════════════════════════════════════════════════════════

function handleDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('imageUploadBox').classList.add('bg-blue-200');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('imageUploadBox').classList.remove('bg-blue-200');
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  document.getElementById('imageUploadBox').classList.remove('bg-blue-200');
  
  const files = event.dataTransfer.files;
  handleFiles(files);
}

// Click handler para file input
document.addEventListener('DOMContentLoaded', () => {
  const uploadBox = document.getElementById('imageUploadBox');
  const fileInput = document.getElementById('imageFileInput');
  
  uploadBox.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
});

// ════════════════════════════════════════════════════════════════
// FILE HANDLING
// ════════════════════════════════════════════════════════════════

function handleFiles(fileList) {
  const files = Array.from(fileList);
  
  if (files.length === 0) return;
  
  // Mostrar progreso
  document.getElementById('uploadStatus').classList.remove('hidden');
  document.getElementById('uploadMessages').innerHTML = '';
  document.getElementById('uploadProgressBar').style.width = '0%';
  
  uploadFiles(files);
}

async function uploadFiles(files) {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  try {
    document.getElementById('uploadProgress').textContent = '5%';
    document.getElementById('uploadProgressBar').style.width = '5%';
    
    const response = await fetch('/api/admin/upload/batch', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    document.getElementById('uploadProgress').textContent = '100%';
    document.getElementById('uploadProgressBar').style.width = '100%';
    
    // Procesar resultados
    if (data.results) {
      data.results.forEach((result, index) => {
        if (result.success) {
          const imageData = {
            id: result.hash,
            path: result.path,
            filename: result.filename,
            sizeKB: parseFloat(result.sizeKB),
            width: result.width,
            height: result.height,
            timestamp: new Date().toLocaleString('es-ES')
          };
          
          uploadedImages.push(imageData);
          totalCompressedSize += imageData.sizeKB;
          
          // Mostrar mensaje de éxito
          showUploadMessage(
            `✅ ${result.filename} - ${result.sizeKB}KB`,
            'success'
          );
          
          // Agregar a galería
          addImageToGallery(imageData);
        } else {
          showUploadMessage(
            `❌ ${files[index]?.name} - ${result.error}`,
            'error'
          );
        }
      });
      
      // Actualizar estadísticas
      updateStatistics();
      
      // Ocultar barra de progreso después de 2s
      setTimeout(() => {
        document.getElementById('uploadStatus').classList.add('hidden');
      }, 2000);
    }
  } catch (error) {
    showUploadMessage(
      `❌ Error en upload: ${error.message}`,
      'error'
    );
    document.getElementById('uploadStatus').classList.add('hidden');
  }
}

// ════════════════════════════════════════════════════════════════
// UI UPDATES
// ════════════════════════════════════════════════════════════════

function showUploadMessage(message, type = 'info') {
  const messagesDiv = document.getElementById('uploadMessages');
  
  const messageEl = document.createElement('div');
  messageEl.className = `text-sm p-3 rounded-lg ${
    type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
    type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
    'bg-blue-100 text-blue-800 border border-blue-300'
  }`;
  messageEl.textContent = message;
  
  messagesDiv.appendChild(messageEl);
  
  // Auto-remove después de 5 segundos (para success)
  if (type === 'success') {
    setTimeout(() => messageEl.remove(), 5000);
  }
}

function addImageToGallery(imageData) {
  const grid = document.getElementById('processedImagesGrid');
  
  // Si mostraba "no hay imágenes", limipiar
  if (grid.innerHTML.includes('Sube imágenes para verlas')) {
    grid.innerHTML = '';
  }
  
  const imageCard = document.createElement('div');
  imageCard.className = 'bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition group';
  imageCard.dataset.imageId = imageData.id;
  
  imageCard.innerHTML = `
    <!-- Thumbnail Preview -->
    <div class="relative bg-gray-100 h-40 overflow-hidden flex items-center justify-center group-hover:bg-gray-200 transition">
      <div class="text-center">
        <div class="text-4xl mb-2">📸</div>
        <p class="text-xs text-gray-600">${imageData.width}x${imageData.height}px</p>
      </div>
      
      <!-- Overlay Delete Button -->
      <button onclick="deleteImage('${imageData.id}')" 
              class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded opacity-0 group-hover:opacity-100 transition"
              title="Eliminar imagen">
        🗑️
      </button>
    </div>
    
    <!-- Info Section -->
    <div class="p-4">
      <h4 class="font-semibold text-gray-900 text-sm mb-2 truncate">
        ${imageData.filename}
      </h4>
      
      <!-- Metadata -->
      <div class="space-y-1 text-xs text-gray-600 mb-3">
        <div class="flex justify-between">
          <span>Tamaño:</span>
          <span class="font-medium">${imageData.sizeKB}KB</span>
        </div>
        <div class="flex justify-between">
          <span>Formato:</span>
          <span class="font-medium">WebP</span>
        </div>
        <div class="flex justify-between">
          <span>Hash:</span>
          <span class="font-mono text-gray-500">${imageData.id.substring(0, 8)}...</span>
        </div>
      </div>
      
      <!-- Path Copy -->
      <div class="bg-gray-50 rounded p-2 mb-3 border border-gray-200">
        <input type="text" 
               value="${imageData.path}" 
               readonly 
               class="w-full text-xs bg-transparent font-mono text-gray-700 focus:outline-none"
               onclick="this.select()"
               title="Click para copiar">
      </div>
      
      <!-- Timestamp -->
      <p class="text-xs text-gray-500">
        ${imageData.timestamp}
      </p>
    </div>
  `;
  
  grid.appendChild(imageCard);
}

function updateStatistics() {
  const imageCount = uploadedImages.length;
  document.getElementById('imageCount').textContent = imageCount;
  
  if (imageCount > 0) {
    // Calcular compresión promedio (placeholder - habría que guardar tamaño original)
    const avgCompression = 80; // Estimado 80% de reducción
    document.getElementById('compressRatio').textContent = `~${avgCompression}%`;
    
    // Espacio ahorrado estimado (asumiendo 80% de reducción)
    const estimatedOriginal = totalCompressedSize / (1 - avgCompression / 100);
    const spaceSaved = (estimatedOriginal - totalCompressedSize) / 1024;
    document.getElementById('spaceSaved').textContent = `${spaceSaved.toFixed(1)} MB`;
  }
}

async function deleteImage(imageId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/admin/image/${imageId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Eliminar de UI
      const imageCard = document.querySelector(`[data-image-id="${imageId}"]`);
      if (imageCard) {
        imageCard.remove();
      }
      
      // Actualizar array
      uploadedImages = uploadedImages.filter(img => img.id !== imageId);
      
      // Mostrar mensaje
      showUploadMessage(`✅ Imagen eliminada: ${data.message}`, 'success');
      
      // Actualizar estadísticas
      updateStatistics();
      
      // Si no hay más imágenes, mostrar mensaje vacío
      const grid = document.getElementById('processedImagesGrid');
      if (grid.children.length === 0) {
        grid.innerHTML = `
          <div class="text-center py-8 col-span-4 text-gray-500">
            <p class="text-sm">Sube imágenes para verlas aquí</p>
          </div>
        `;
      }
    } else {
      showUploadMessage(`❌ Error: ${data.error}`, 'error');
    }
  } catch (error) {
    showUploadMessage(`❌ Error al eliminar: ${error.message}`, 'error');
  }
}

// ════════════════════════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════════════════════════

console.log('✅ Admin image upload script loaded');
