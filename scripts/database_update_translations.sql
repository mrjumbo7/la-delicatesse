-- Actualización de base de datos para soporte multilingüe
USE la_delicatesse;

-- Tabla para traducciones de perfiles de chef
CREATE TABLE IF NOT EXISTS traducciones_perfil_chef (
    id INT AUTO_INCREMENT PRIMARY KEY,
    perfil_chef_id INT NOT NULL,
    idioma CHAR(2) NOT NULL,
    titulo VARCHAR(100),
    descripcion TEXT,
    especialidad VARCHAR(100),
    FOREIGN KEY (perfil_chef_id) REFERENCES perfil_chef(id) ON DELETE CASCADE,
    UNIQUE KEY unique_translation (perfil_chef_id, idioma)
);

-- Tabla para traducciones de recetas
CREATE TABLE IF NOT EXISTS traducciones_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receta_id INT NOT NULL,
    idioma CHAR(2) NOT NULL,
    titulo VARCHAR(100),
    descripcion TEXT,
    ingredientes TEXT,
    instrucciones TEXT,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_translation (receta_id, idioma)
);

-- Tabla para traducciones de servicios
CREATE TABLE IF NOT EXISTS traducciones_servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    idioma CHAR(2) NOT NULL,
    titulo VARCHAR(100),
    descripcion TEXT,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_translation (servicio_id, idioma)
);

-- Tabla para traducciones de categorías
CREATE TABLE IF NOT EXISTS traducciones_categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    idioma CHAR(2) NOT NULL,
    nombre VARCHAR(50),
    descripcion TEXT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    UNIQUE KEY unique_translation (categoria_id, idioma)
);