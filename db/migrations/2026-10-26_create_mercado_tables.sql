-- Módulo Mercado: catálogo de productos, precios por tienda, listas y pagos.

CREATE TABLE IF NOT EXISTS `mercado_categorias` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mercado_categorias_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mercado_tiendas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mercado_tiendas_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mercado_productos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `categoria_id` int unsigned NOT NULL,
  `unidad` varchar(20) NOT NULL DEFAULT 'unidad',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mercado_productos_nombre_categoria` (`nombre`, `categoria_id`),
  KEY `idx_mercado_productos_categoria` (`categoria_id`),
  CONSTRAINT `fk_mercado_productos_categoria`
    FOREIGN KEY (`categoria_id`) REFERENCES `mercado_categorias` (`id`)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mercado_precios` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` int unsigned NOT NULL,
  `tienda_id` int unsigned NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `actualizado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mercado_precios_producto_tienda` (`producto_id`, `tienda_id`),
  KEY `idx_mercado_precios_tienda` (`tienda_id`),
  CONSTRAINT `fk_mercado_precios_producto`
    FOREIGN KEY (`producto_id`) REFERENCES `mercado_productos` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_mercado_precios_tienda`
    FOREIGN KEY (`tienda_id`) REFERENCES `mercado_tiendas` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_mercado_precios_positivo` CHECK (`precio` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mercado_listas` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'pendiente',
  `presupuesto` decimal(12,2) DEFAULT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mercado_lista_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `lista_id` int unsigned NOT NULL,
  `producto_id` int unsigned DEFAULT NULL,
  `nombre_producto` varchar(150) NOT NULL,
  `tienda_id` int unsigned DEFAULT NULL,
  `tienda_nombre` varchar(100) DEFAULT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` decimal(10,3) NOT NULL DEFAULT 1,
  `unidad` varchar(20) NOT NULL DEFAULT 'unidad',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mercado_lista_items_producto` (`lista_id`, `producto_id`),
  KEY `idx_mercado_lista_items_lista` (`lista_id`),
  KEY `idx_mercado_lista_items_producto` (`producto_id`),
  KEY `idx_mercado_lista_items_tienda` (`tienda_id`),
  CONSTRAINT `fk_mercado_lista_items_lista`
    FOREIGN KEY (`lista_id`) REFERENCES `mercado_listas` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `fk_mercado_lista_items_producto`
    FOREIGN KEY (`producto_id`) REFERENCES `mercado_productos` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_mercado_lista_items_tienda`
    FOREIGN KEY (`tienda_id`) REFERENCES `mercado_tiendas` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `chk_mercado_lista_items_cantidad` CHECK (`cantidad` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mercado_pagos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `lista_id` int unsigned NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `porcentaje` decimal(5,2) DEFAULT NULL,
  `monto` decimal(12,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `fecha_vencimiento` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mercado_pagos_lista` (`lista_id`),
  CONSTRAINT `fk_mercado_pagos_lista`
    FOREIGN KEY (`lista_id`) REFERENCES `mercado_listas` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `chk_mercado_pagos_monto` CHECK (`monto` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `mercado_categorias` (`nombre`) VALUES
  ('Proteína'),
  ('Charcutería'),
  ('Productos de limpieza'),
  ('Feria'),
  ('Carbohidratos'),
  ('Lácteos'),
  ('Bebidas'),
  ('Otros');
