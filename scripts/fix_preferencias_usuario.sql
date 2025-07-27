-- Script para corregir la estructura de la tabla preferencias_usuario
-- Este script agrega el campo 'tipo' que falta en la tabla

USE la_delicatesse;

-- Agregar el campo 'tipo' a la tabla preferencias_usuario
ALTER TABLE preferencias_usuario 
ADD COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'custom' AFTER usuario_id;

-- Actualizar los registros existentes para asignar un tipo por defecto
UPDATE preferencias_usuario 
SET tipo = 'dietary_restriction' 
WHERE preferencia IN ('Vegetariano', 'Vegano', 'Sin gluten', 'Sin lactosa', 'Sin azúcar', 'Kosher', 'Halal');

UPDATE preferencias_usuario 
SET tipo = 'cuisine_type' 
WHERE preferencia IN ('Italiana', 'Francesa', 'Japonesa', 'China', 'Mexicana', 'India', 'Mediterránea', 'Tailandesa', 'Española', 'Peruana');

-- Los demás registros mantendrán el tipo 'custom' por defecto

-- Verificar la estructura actualizada
DESCRIBE preferencias_usuario;