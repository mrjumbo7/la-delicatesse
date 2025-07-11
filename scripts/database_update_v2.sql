-- Actualización de base de datos para nuevas funcionalidades
USE la_delicatesse;

-- Tabla para imágenes de recetas (pasos y resultado final)
CREATE TABLE IF NOT EXISTS imagenes_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receta_id INT NOT NULL,
    tipo ENUM('paso', 'resultado') NOT NULL,
    orden INT DEFAULT 0,
    imagen_url VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);

-- Tabla para chefs favoritos
CREATE TABLE IF NOT EXISTS chefs_favoritos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    chef_id INT NOT NULL,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (chef_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (cliente_id, chef_id)
);

-- Tabla para preferencias alimenticias de usuarios
CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    preferencia VARCHAR(100) NOT NULL,
    fecha_agregada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Actualizar tabla de usuarios para incluir dirección
ALTER TABLE usuarios 
ADD COLUMN direccion TEXT AFTER telefono,
ADD COLUMN fecha_nacimiento DATE AFTER direccion;

-- Tabla para métodos de pago guardados
CREATE TABLE IF NOT EXISTS metodos_pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    ultimos_digitos VARCHAR(4),
    nombre_titular VARCHAR(100),
    fecha_expiracion VARCHAR(7),
    es_principal BOOLEAN DEFAULT FALSE,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Actualizar tabla de pagos para incluir método de pago
ALTER TABLE pagos 
ADD COLUMN metodo_pago_id INT AFTER metodo_pago,
ADD COLUMN comprobante_url VARCHAR(255) AFTER referencia_pago,
ADD FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id);

-- Actualizar tabla de calificaciones para incluir más detalles
ALTER TABLE calificaciones 
ADD COLUMN titulo VARCHAR(200) AFTER puntuacion,
ADD COLUMN aspectos_positivos TEXT AFTER comentario,
ADD COLUMN aspectos_mejora TEXT AFTER aspectos_positivos,
ADD COLUMN recomendaria BOOLEAN DEFAULT TRUE AFTER aspectos_mejora;

-- Índices para mejorar rendimiento
CREATE INDEX idx_servicios_cliente ON servicios(cliente_id);
CREATE INDEX idx_servicios_chef ON servicios(chef_id);
CREATE INDEX idx_servicios_fecha ON servicios(fecha_servicio);
CREATE INDEX idx_calificaciones_chef ON calificaciones(chef_id);
CREATE INDEX idx_chefs_favoritos_cliente ON chefs_favoritos(cliente_id);
