-- Catálogo inicial de Mercado.
-- Los precios se guardan sin tienda para asignarlos después desde la interfaz.

INSERT INTO `mercado_productos` (`nombre`, `categoria_id`, `unidad`)
SELECT d.`nombre`, c.`id`, d.`unidad`
FROM (
  SELECT 'Pollo' AS `nombre`, 'Proteína' AS `categoria`, 'kg' AS `unidad`
  UNION ALL SELECT 'Carne', 'Proteína', 'kg'
  UNION ALL SELECT 'Cochino', 'Proteína', 'kg'
  UNION ALL SELECT 'Carne para mechar', 'Proteína', 'kg'
  UNION ALL SELECT 'Lagarto con hueso', 'Proteína', 'kg'
  UNION ALL SELECT 'Chorizo', 'Proteína', 'kg'
  UNION ALL SELECT 'Chuleta ahumada', 'Proteína', 'kg'
  UNION ALL SELECT 'Patas de cochino', 'Proteína', 'kg'
  UNION ALL SELECT 'Pescado', 'Proteína', 'kg'
  UNION ALL SELECT 'Queso', 'Charcutería', 'kg'
  UNION ALL SELECT 'Variados', 'Charcutería', 'unidad'
  UNION ALL SELECT 'Huevo', 'Charcutería', 'unidad'
  UNION ALL SELECT 'Jamón', 'Charcutería', 'kg'
  UNION ALL SELECT 'Arroz', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Harina Pan', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Leche', 'Carbohidratos', 'g'
  UNION ALL SELECT 'Harina de avena', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Espagueti', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Salsa de tomate', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Mostaza', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Pan', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Aceite', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Yogur', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Café', 'Carbohidratos', 'unidad'
  UNION ALL SELECT 'Jabón', 'Productos de limpieza', 'unidad'
  UNION ALL SELECT 'Papel', 'Productos de limpieza', 'unidad'
  UNION ALL SELECT 'Cloro', 'Productos de limpieza', 'unidad'
  UNION ALL SELECT 'Desinfectante', 'Productos de limpieza', 'unidad'
  UNION ALL SELECT 'Ace', 'Productos de limpieza', 'unidad'
) AS d
INNER JOIN `mercado_categorias` c ON c.`nombre` = d.`categoria`
ON DUPLICATE KEY UPDATE `unidad` = VALUES(`unidad`);

INSERT INTO `mercado_precios` (`producto_id`, `tienda_id`, `precio`)
SELECT p.`id`, NULL, d.`precio`
FROM (
  SELECT 'Pollo' AS `nombre`, 'Proteína' AS `categoria`, 3.60 AS `precio`
  UNION ALL SELECT 'Carne', 'Proteína', 10.50
  UNION ALL SELECT 'Cochino', 'Proteína', 6.50
  UNION ALL SELECT 'Lagarto con hueso', 'Proteína', 7.00
  UNION ALL SELECT 'Chorizo', 'Proteína', 6.00
  UNION ALL SELECT 'Chuleta ahumada', 'Proteína', 10.00
  UNION ALL SELECT 'Patas de cochino', 'Proteína', 4.00
  UNION ALL SELECT 'Queso', 'Charcutería', 6.50
  UNION ALL SELECT 'Variados', 'Charcutería', 7.00
  UNION ALL SELECT 'Huevo', 'Charcutería', 6.60
  UNION ALL SELECT 'Jamón', 'Charcutería', 4.00
  UNION ALL SELECT 'Arroz', 'Carbohidratos', 1.12
  UNION ALL SELECT 'Harina Pan', 'Carbohidratos', 1.02
  UNION ALL SELECT 'Leche', 'Carbohidratos', 11.00
  UNION ALL SELECT 'Harina de avena', 'Carbohidratos', 1.95
  UNION ALL SELECT 'Salsa de tomate', 'Carbohidratos', 1.50
  UNION ALL SELECT 'Mostaza', 'Carbohidratos', 1.63
  UNION ALL SELECT 'Pan', 'Carbohidratos', 2.00
  UNION ALL SELECT 'Aceite', 'Carbohidratos', 2.00
  UNION ALL SELECT 'Yogur', 'Carbohidratos', 2.00
  UNION ALL SELECT 'Café', 'Carbohidratos', 3.00
  UNION ALL SELECT 'Jabón', 'Productos de limpieza', 1.00
  UNION ALL SELECT 'Papel', 'Productos de limpieza', 1.80
  UNION ALL SELECT 'Cloro', 'Productos de limpieza', 2.00
  UNION ALL SELECT 'Ace', 'Productos de limpieza', 1.80
) AS d
INNER JOIN `mercado_categorias` c ON c.`nombre` = d.`categoria`
INNER JOIN `mercado_productos` p
  ON p.`nombre` = d.`nombre` AND p.`categoria_id` = c.`id`
WHERE NOT EXISTS (
  SELECT 1
  FROM `mercado_precios` pr
  WHERE pr.`producto_id` = p.`id` AND pr.`tienda_id` IS NULL
);
