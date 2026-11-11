-- Módulo Meta: productos que se planean comprar, con precio y fecha objetivo.

CREATE TABLE IF NOT EXISTS `metas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `precio` decimal(12,2) NOT NULL,
  `fecha_compra` date NOT NULL,
  `completado` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_metas_completado` (`completado`),
  KEY `idx_metas_fecha_compra` (`fecha_compra`),
  CONSTRAINT `chk_metas_precio` CHECK (`precio` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
