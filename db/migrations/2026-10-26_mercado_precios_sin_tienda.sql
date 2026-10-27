-- Permite guardar un precio base de producto sin asignarlo todavía a una tienda.

ALTER TABLE `mercado_precios`
  MODIFY COLUMN `tienda_id` int unsigned NULL DEFAULT NULL;
