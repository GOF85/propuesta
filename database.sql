-- Creación de la Base de Datos
CREATE DATABASE IF NOT EXISTS catering_proposals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE catering_proposals;

-- 1. USUARIOS (Comerciales)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    role ENUM('admin', 'commercial') DEFAULT 'commercial',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATÁLOGO MAESTRO: VENUES
CREATE TABLE venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 0, -- Capacidad en pax (manual)
    features JSON, -- ["Luz natural", "Wifi", "Jardín"]
    address VARCHAR(255),
    map_iframe TEXT,
    external_url VARCHAR(255),
    images JSON, -- ["/uploads/nombre-venue/img1.webp", "/uploads/nombre-venue/img2.webp"]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATÁLOGO MAESTRO: PLATOS
CREATE TABLE dishes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allergens JSON, -- ["gluten", "crustaceos"]
    badges JSON,    -- ["vegano", "picante"]
    category VARCHAR(50), 
    image_url VARCHAR(255),
    base_price DECIMAL(10, 2) DEFAULT 0.00
);

-- 4. PROPUESTAS (Tabla Principal)
CREATE TABLE proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    unique_hash VARCHAR(64) UNIQUE NOT NULL,
    client_name VARCHAR(255),
    event_date DATE,
    pax INT DEFAULT 0,
    brand_color VARCHAR(7) DEFAULT '#000000',
    logo_url VARCHAR(255),
    legal_conditions TEXT,
    is_editing BOOLEAN DEFAULT TRUE, -- MODO MANTENIMIENTO
    status ENUM('draft', 'sent', 'accepted', 'cancelled') DEFAULT 'draft',
    valid_until DATE, -- Caducidad
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5. VENUES EN PROPUESTA (Relación N:M con atributos)
CREATE TABLE proposal_venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT,
    venue_id INT,
    is_selected BOOLEAN DEFAULT FALSE, -- Si el cliente lo ha elegido o el comercial lo forzó
    custom_override_json JSON, -- Por si cambiamos descripción solo para este evento
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- 6. SERVICIOS / HITOS (Timeline)
CREATE TABLE proposal_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT,
    title VARCHAR(255), -- "Welcome Coffee"
    type ENUM('gastronomy', 'logistics', 'staff', 'other') DEFAULT 'gastronomy',
    start_time TIME,
    end_time TIME,
    vat_rate DECIMAL(4, 2) DEFAULT 10.00, -- 10.00 o 21.00
    order_index INT DEFAULT 0,
    is_multichoice BOOLEAN DEFAULT FALSE, -- Si tiene Opción A / B
    selected_option_index INT DEFAULT NULL, -- NULL = No elegido, 0 = Opcion A, 1 = Opcion B
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- 7. OPCIONES DE SERVICIO (Columnas A, B, C...)
CREATE TABLE service_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT,
    name VARCHAR(100), -- "Opción Premium"
    price_pax DECIMAL(10, 2) DEFAULT 0.00,
    discount_pax DECIMAL(10, 2) DEFAULT 0.00, -- Descuentos ocultos o visibles
    description TEXT,
    FOREIGN KEY (service_id) REFERENCES proposal_services(id) ON DELETE CASCADE
);

-- 8. ITEMS/PLATOS EN PROPUESTA (Copia Profunda)
CREATE TABLE proposal_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    option_id INT, -- Pertenece a una Opción concreta
    name VARCHAR(255),
    description TEXT, -- Editada por comercial
    allergens JSON,
    badges JSON,
    image_url VARCHAR(255),
    FOREIGN KEY (option_id) REFERENCES service_options(id) ON DELETE CASCADE
);

-- 9. CHAT (Mensajería)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proposal_id INT,
    sender_role ENUM('commercial', 'client') NOT NULL,
    message_body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);