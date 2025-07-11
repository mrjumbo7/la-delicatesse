-- Insertar datos de ejemplo
USE la_delicatesse;

-- Usuarios de ejemplo
INSERT INTO usuarios (nombre, email, password, telefono, tipo_usuario) VALUES
('María González', 'maria@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '7123-4567', 'cliente'),
('Carlos Rodríguez', 'carlos@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '7234-5678', 'cliente'),
('Chef Antonio Pérez', 'antonio@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '7345-6789', 'chef'),
('Chef Isabella Martínez', 'isabella@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '7456-7890', 'chef'),
('Chef Roberto Silva', 'roberto@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '7567-8901', 'chef');

-- Perfiles de chef
INSERT INTO perfiles_chef (usuario_id, especialidad, experiencia_anos, precio_por_hora, biografia, ubicacion, certificaciones, calificacion_promedio, total_servicios) VALUES
(3, 'Cocina Italiana', 8, 45.00, 'Chef especializado en cocina italiana tradicional con 8 años de experiencia en restaurantes de alta gama.', 'San Salvador', 'Certificación en Cocina Italiana, Diploma Culinario', 4.8, 25),
(4, 'Cocina Francesa', 12, 60.00, 'Chef con formación en París, especializada en cocina francesa clásica y moderna.', 'Santa Tecla', 'Le Cordon Bleu París, Certificación en Pastelería', 4.9, 40),
(5, 'Cocina Asiática', 6, 40.00, 'Experto en cocina asiática fusión, especializado en sushi y cocina japonesa contemporánea.', 'Antiguo Cuscatlán', 'Certificación en Cocina Japonesa, Curso de Sushi Master', 4.7, 18);

-- Recetas de ejemplo
INSERT INTO recetas (chef_id, titulo, descripcion, ingredientes, instrucciones, tiempo_preparacion, dificultad, precio) VALUES
(3, 'Pasta Carbonara Auténtica', 'Receta tradicional italiana de pasta carbonara', 'Pasta, huevos, panceta, queso parmesano, pimienta negra', 'Instrucciones detalladas paso a paso...', 30, 'intermedio', 8.99),
(4, 'Coq au Vin Clásico', 'Pollo al vino tinto estilo francés tradicional', 'Pollo, vino tinto, champiñones, cebollitas, hierbas', 'Preparación tradicional francesa...', 120, 'difícil', 15.99),
(5, 'Sushi Roll California', 'Sushi roll estilo California con cangrejo y aguacate', 'Arroz sushi, nori, cangrejo, aguacate, pepino, mayonesa', 'Técnica de enrollado profesional...', 45, 'intermedio', 12.99);
