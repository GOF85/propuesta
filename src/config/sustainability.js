/**
 * Configuración de la Propuesta Sostenible
 * Edita este archivo para cambiar los textos, iconos e imágenes de la sección de sostenibilidad.
 */

module.exports = [
  {
    id: 1,
    pilar: "01 / Producto",
    titulo: "Gastronomía de Proximidad",
    destaque: "Proximidad.",
    descripcion: "Eliminamos la huella de logística priorizando el Producto Km 0. Trabajamos directamente con huertas locales de la Comunidad de Madrid y participamos en programas de recuperación de variedades autóctonas.",
    imagen: "https://micecatering.com/wp-content/uploads/2020/02/sostenibilidad.jpg",
    color: "#31713D",
    bgColor: "bg-white",
    textColor: "text-gray-900",
    icon: "utensils",
    tags: [
      { label: "Sello EvenSost Premium", icon: "award", image: "https://eventsost.com/wp-content/uploads/2021/04/Logo-EvenSost-Premium.png" },
      { label: "Producto Certificado", icon: "shield-check" }
    ]
  },
  {
    id: 2,
    pilar: "02 / Operaciones",
    titulo: "Operativa Zero Waste",
    destaque: "Zero Waste.",
    descripcion: "Eliminamos el 100% de botellas PET mediante sistemas REFILL y menaje de cristal reutilizable en todos nuestros servicios corporativos.",
    imagen: "https://micecatering.com/wp-content/uploads/2022/10/banner-sostenibilidad.jpg",
    color: "#4ade80",
    bgColor: "bg-gray-900",
    textColor: "text-white",
    icon: "recycle",
    features: [
      { titulo: "Agua Microfiltrada", desc: "Sistemas refill de cristal en todas las estaciones de hidratación.", icon: "droplet" },
      { titulo: "Gestión de Orgánico", desc: "Transformación en energía renovable (biogás) certificado.", icon: "recycle" }
    ]
  },
  {
    id: 3,
    pilar: "03 / Sociedad",
    titulo: "Impacto Positivo",
    destaque: "Positivo.",
    descripcion: "Donación sistemática de excedentes alimentarios asegurando residuo alimentario 0 y apoyo social real a colectivos vulnerables.",
    imagen: "https://micecatering.com/wp-content/uploads/2021/04/Sostenibilidad-MICE-Catering-blog.jpg",
    color: "#9333ea",
    bgColor: "bg-white",
    textColor: "text-gray-900",
    icon: "heart",
    cards: [
      { titulo: "Compromiso Olvidados", desc: "Donación diaria a la Asociación olVIDAdos.", icon: "heart", full: true },
      { titulo: "Empleo Local", desc: "Contratación de proximidad.", icon: "heart-handshake" },
      { titulo: "Agenda 2030", desc: "Monitorización activa ODS.", icon: "globe" }
    ]
  },
  {
    id: 4,
    pilar: "04 / Transporte",
    titulo: "Movilidad Limpia",
    destaque: "Limpia.",
    descripcion: "Nuestra flota de vehículos está en proceso de electrificación total. El 60% de nuestros desplazamientos en Madrid centro son ZERO Emisiones.",
    imagen: "https://micecatering.com/wp-content/uploads/2020/03/transporte-catering.jpg",
    color: "#3b82f6",
    bgColor: "bg-blue-900",
    textColor: "text-white",
    icon: "truck",
    items: [
      { label: "Energía 100% Renovable en Sede", icon: "zap" },
      { label: "Rutas Optimizadas por IA", icon: "map-pin" }
    ]
  },
  {
    id: 5,
    pilar: "05 / Garantía",
    titulo: "Certificaciones",
    destaque: "Certificadas.",
    descripcion: "MICE Catering es el primer catering 100% comprometido con la neutralidad de carbono y la economía circular en el sector corporativo.",
    imagen: "https://micecatering.com/wp-content/uploads/2021/04/Sostenibilidad-MICE-Catering-blog.jpg",
    color: "#6b7280",
    bgColor: "bg-gray-50",
    textColor: "text-gray-900",
    icon: "award",
    certificates: [
      { name: "EvenSost Premium", desc: "Máximo nivel eventos sostenibles.", img: "https://eventsost.com/wp-content/uploads/2021/04/Logo-EvenSost-Premium.png" },
      { name: "ISO 14001:2015", desc: "Gestión Ambiental Internacional.", icon: "check-square" },
      { name: "APPCC / FDA", desc: "Seguridad alimentaria total.", icon: "shield-check" }
    ]
  }
];
