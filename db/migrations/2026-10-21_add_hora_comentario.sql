-- Academix: nuevos campos opcionales "hora" y "comentario" en la tabla de trabajos.
-- MySQL 8.0.22 no soporta ADD COLUMN IF NOT EXISTS: verificar antes de ejecutar.

ALTER TABLE `registros_trabajos`
  ADD COLUMN `hora` varchar(50) DEFAULT NULL AFTER `fecha_entrega_real`,
  ADD COLUMN `comentario` text DEFAULT NULL AFTER `hora`;
