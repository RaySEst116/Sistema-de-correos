-- Base de datos para Alhmail Email System
-- Este script se ejecuta automáticamente al iniciar el contenedor MySQL

USE alhmail_security;

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de correos electrónicos
CREATE TABLE IF NOT EXISTS emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    to_email TEXT NOT NULL,
    cc_email TEXT,
    bcc_email TEXT,
    subject VARCHAR(1000) NOT NULL,
    body TEXT,
    html_body TEXT,
    attachments TEXT,
    folder VARCHAR(50) DEFAULT 'INBOX',
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_folder (user_id, folder),
    INDEX idx_user_received (user_id, received_at),
    INDEX idx_email_from (from_email),
    INDEX idx_email_to (to_email(255))
);

-- Tabla de configuraciones de cuentas IMAP/SMTP
CREATE TABLE IF NOT EXISTS email_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) NOT NULL,
    imap_host VARCHAR(255),
    imap_port INT DEFAULT 993,
    imap_secure BOOLEAN DEFAULT TRUE,
    smtp_host VARCHAR(255),
    smtp_port INT DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT TRUE,
    username VARCHAR(255),
    password_encrypted TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_email (user_id, email_address)
);

-- Tabla de logs de seguridad/forensia
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    email_id INT,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at)
);

-- Tabla de configuraciones de usuario
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'es',
    emails_per_page INT DEFAULT 25,
    auto_refresh BOOLEAN DEFAULT TRUE,
    notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertar usuario por defecto (contraseña: admin123)
INSERT IGNORE INTO users (id, email, password, name) VALUES 
(1, 'admin@alhmail.com', '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ', 'Administrador');

-- Insertar configuración por defecto para el admin
INSERT IGNORE INTO user_settings (user_id) VALUES (1);

-- Crear vista para correos con información del usuario
CREATE OR REPLACE VIEW email_details AS
SELECT 
    e.*,
    u.name as user_name,
    u.email as user_email
FROM emails e
JOIN users u ON e.user_id = u.id
WHERE e.is_deleted = FALSE;
