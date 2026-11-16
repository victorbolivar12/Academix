-- Ajustes del catálogo de Alimentación: agrega la ensalada y depura opciones.

INSERT IGNORE INTO `alimentacion_alimentos` (`nombre`, `categoria`, `calorias_por_100g`) VALUES
  ('Ensalada', 'Verduras', 30);

DELETE FROM `alimentacion_alimentos`
WHERE `nombre` IN (
  'Avena',
  'Quinoa cocida',
  'Camarón',
  'Frijoles cocidos',
  'Tofu',
  'Garbanzos cocidos'
);

DELETE FROM `alimentacion_alimentos`
WHERE `categoria` IN ('Grasas', 'Otros');
