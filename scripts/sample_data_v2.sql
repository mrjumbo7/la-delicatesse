-- Datos de ejemplo para las nuevas funcionalidades
USE la_delicatesse;

-- Preferencias alimenticias de ejemplo
INSERT INTO preferencias_usuario (usuario_id, preferencia) VALUES
(1, 'Vegetariano'),
(1, 'Sin gluten'),
(2, 'Vegano'),
(2, 'Sin lactosa');

-- Chefs favoritos de ejemplo
INSERT INTO chefs_favoritos (cliente_id, chef_id) VALUES
(1, 3),
(1, 4),
(2, 3),
(2, 5);

-- Métodos de pago de ejemplo
INSERT INTO metodos_pago (usuario_id, tipo, ultimos_digitos, nombre_titular, fecha_expiracion, es_principal) VALUES
(1, 'Visa', '1234', 'María González', '12/2025', TRUE),
(1, 'MasterCard', '5678', 'María González', '08/2026', FALSE),
(2, 'Visa', '9012', 'Carlos Rodríguez', '03/2027', TRUE);

-- Imágenes de recetas de ejemplo
INSERT INTO imagenes_recetas (receta_id, tipo, orden, imagen_url, descripcion) VALUES
(1, 'paso', 1, '/placeholder.svg?height=300&width=400', 'Preparar los ingredientes'),
(1, 'paso', 2, '/placeholder.svg?height=300&width=400', 'Cocinar la pasta'),
(1, 'paso', 3, '/placeholder.svg?height=300&width=400', 'Mezclar con la salsa'),
(1, 'resultado', 0, '/placeholder.svg?height=400&width=600', 'Pasta Carbonara terminada'),
(2, 'paso', 1, '/placeholder.svg?height=300&width=400', 'Marinar el pollo'),
(2, 'paso', 2, '/placeholder.svg?height=300&width=400', 'Cocinar con vino'),
(2, 'resultado', 0, '/placeholder.svg?height=400&width=600', 'Coq au Vin listo para servir');
