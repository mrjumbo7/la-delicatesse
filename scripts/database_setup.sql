-- Crear base de datos
CREATE DATABASE IF NOT EXISTS la_delicatesse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE la_delicatesse;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    tipo_usuario ENUM('cliente', 'chef') NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de perfiles de chef
CREATE TABLE perfiles_chef (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    especialidad VARCHAR(100),
    experiencia_anos INT,
    precio_por_hora DECIMAL(10,2),
    biografia TEXT,
    ubicacion VARCHAR(200),
    certificaciones TEXT,
    foto_perfil VARCHAR(255),
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_servicios INT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de servicios/contrataciones
CREATE TABLE servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    chef_id INT NOT NULL,
    fecha_servicio DATE NOT NULL,
    hora_servicio TIME NOT NULL,
    ubicacion_servicio VARCHAR(300) NOT NULL,
    numero_comensales INT NOT NULL,
    precio_total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente', 'aceptado', 'rechazado', 'completado', 'cancelado') DEFAULT 'pendiente',
    descripcion_evento TEXT,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (chef_id) REFERENCES usuarios(id)
);

-- Tabla de pagos
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    estado_pago ENUM('pendiente', 'completado', 'fallido', 'reembolsado') DEFAULT 'pendiente',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    referencia_pago VARCHAR(100),
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
);

-- Tabla de calificaciones
CREATE TABLE calificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    cliente_id INT NOT NULL,
    chef_id INT NOT NULL,
    puntuacion INT CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario TEXT,
    fecha_calificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (chef_id) REFERENCES usuarios(id)
);

-- Tabla de recetas
CREATE TABLE recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chef_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ingredientes TEXT NOT NULL,
    instrucciones TEXT NOT NULL,
    tiempo_preparacion INT,
    dificultad ENUM('fácil', 'intermedio', 'difícil'),
    precio DECIMAL(8,2) NOT NULL,
    imagen VARCHAR(255),
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (chef_id) REFERENCES usuarios(id)
);

-- Tabla de compras de recetas
CREATE TABLE compras_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    receta_id INT NOT NULL,
    precio_pagado DECIMAL(8,2) NOT NULL,
    fecha_compra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (receta_id) REFERENCES recetas(id)
);

-- Tabla de mensajes/chat
CREATE TABLE mensajes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    remitente_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id),
    FOREIGN KEY (remitente_id) REFERENCES usuarios(id),
    FOREIGN KEY (destinatario_id) REFERENCES usuarios(id)
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50),
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de imágenes de recetas
CREATE TABLE imagenes_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receta_id INT NOT NULL,
    tipo ENUM('resultado', 'paso') NOT NULL,
    orden INT NOT NULL,
    imagen_url VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
);
