-- Migration: Create Media Library table
-- Description: Stores metadata for the global image catalog

CREATE TABLE IF NOT EXISTS media_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255),
    path VARCHAR(255) NOT NULL,
    size_kb DECIMAL(10, 2),
    width INT,
    height INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
