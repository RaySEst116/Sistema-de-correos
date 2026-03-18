-- Agregar columnas para soportar borradores y correos enviados con destinatarios múltiples
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS `to` TEXT NULL,
ADD COLUMN IF NOT EXISTS `cc` TEXT NULL,
ADD COLUMN IF NOT EXISTS `bcc` TEXT NULL;

-- Actualizar la columna attachments para que pueda almacenar JSON
ALTER TABLE emails 
MODIFY COLUMN `attachments` JSON NULL DEFAULT NULL;
