-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3306
-- Tiempo de generación: 26-07-2025 a las 02:20:57
-- Versión del servidor: 8.3.0
-- Versión de PHP: 8.2.18

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `la_delicatesse`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificaciones`
--

DROP TABLE IF EXISTS `calificaciones`;
CREATE TABLE IF NOT EXISTS `calificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `servicio_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `chef_id` int NOT NULL,
  `puntuacion` int DEFAULT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `comentario` text,
  `aspectos_positivos` text,
  `aspectos_mejora` text,
  `recomendaria` tinyint(1) DEFAULT '1',
  `fecha_calificacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `servicio_id` (`servicio_id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `idx_calificaciones_chef` (`chef_id`)
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chefs_favoritos`
--

DROP TABLE IF EXISTS `chefs_favoritos`;
CREATE TABLE IF NOT EXISTS `chefs_favoritos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `chef_id` int NOT NULL,
  `fecha_agregado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_favorite` (`cliente_id`,`chef_id`),
  KEY `chef_id` (`chef_id`),
  KEY `idx_chefs_favoritos_cliente` (`cliente_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `chefs_favoritos`
--

INSERT INTO `chefs_favoritos` (`id`, `cliente_id`, `chef_id`, `fecha_agregado`) VALUES
(1, 1, 3, '2025-06-25 23:47:51'),
(2, 1, 4, '2025-06-25 23:47:51'),
(3, 2, 3, '2025-06-25 23:47:51'),
(4, 2, 5, '2025-06-25 23:47:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `compras_recetas`
--

DROP TABLE IF EXISTS `compras_recetas`;
CREATE TABLE IF NOT EXISTS `compras_recetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `receta_id` int NOT NULL,
  `precio_pagado` decimal(8,2) NOT NULL,
  `fecha_compra` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `receta_id` (`receta_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `imagenes_recetas`
--

DROP TABLE IF EXISTS `imagenes_recetas`;
CREATE TABLE IF NOT EXISTS `imagenes_recetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receta_id` int NOT NULL,
  `tipo` enum('paso','resultado') NOT NULL,
  `orden` int DEFAULT '0',
  `imagen_url` varchar(255) NOT NULL,
  `descripcion` text,
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `receta_id` (`receta_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `imagenes_recetas`
--

INSERT INTO `imagenes_recetas` (`id`, `receta_id`, `tipo`, `orden`, `imagen_url`, `descripcion`, `fecha_subida`) VALUES
(1, 1, 'paso', 1, '/placeholder.svg?height=300&width=400', 'Preparar los ingredientes', '2025-06-25 23:47:51'),
(2, 1, 'paso', 2, '/placeholder.svg?height=300&width=400', 'Cocinar la pasta', '2025-06-25 23:47:51'),
(3, 1, 'paso', 3, '/placeholder.svg?height=300&width=400', 'Mezclar con la salsa', '2025-06-25 23:47:51'),
(4, 1, 'resultado', 0, '/placeholder.svg?height=400&width=600', 'Pasta Carbonara terminada', '2025-06-25 23:47:51'),
(5, 2, 'paso', 1, '/placeholder.svg?height=300&width=400', 'Marinar el pollo', '2025-06-25 23:47:51'),
(6, 2, 'paso', 2, '/placeholder.svg?height=300&width=400', 'Cocinar con vino', '2025-06-25 23:47:51'),
(7, 2, 'resultado', 0, '/placeholder.svg?height=400&width=600', 'Coq au Vin listo para servir', '2025-06-25 23:47:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes`
--

DROP TABLE IF EXISTS `mensajes`;
CREATE TABLE IF NOT EXISTS `mensajes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `servicio_id` int NOT NULL,
  `remitente_id` int NOT NULL,
  `destinatario_id` int NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `leido` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `servicio_id` (`servicio_id`),
  KEY `remitente_id` (`remitente_id`),
  KEY `destinatario_id` (`destinatario_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `metodos_pago`
--

DROP TABLE IF EXISTS `metodos_pago`;
CREATE TABLE IF NOT EXISTS `metodos_pago` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `ultimos_digitos` varchar(4) DEFAULT NULL,
  `nombre_titular` varchar(100) DEFAULT NULL,
  `fecha_expiracion` varchar(7) DEFAULT NULL,
  `es_principal` tinyint(1) DEFAULT '0',
  `fecha_agregado` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=MyISAM AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `metodos_pago`
--

INSERT INTO `metodos_pago` (`id`, `usuario_id`, `tipo`, `ultimos_digitos`, `nombre_titular`, `fecha_expiracion`, `es_principal`, `fecha_agregado`) VALUES
(1, 1, 'Visa', '1234', 'María González', '12/2025', 1, '2025-06-25 23:47:51'),
(2, 1, 'MasterCard', '5678', 'María González', '08/2026', 0, '2025-06-25 23:47:51'),
(3, 2, 'Visa', '9012', 'Carlos Rodríguez', '03/2027', 1, '2025-06-25 23:47:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `mensaje` text NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `leida` tinyint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pagos`
--

DROP TABLE IF EXISTS `pagos`;
CREATE TABLE IF NOT EXISTS `pagos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `servicio_id` int NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(50) DEFAULT NULL,
  `metodo_pago_id` int DEFAULT NULL,
  `estado_pago` enum('pendiente','completado','fallido','reembolsado') DEFAULT 'pendiente',
  `fecha_pago` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `referencia_pago` varchar(100) DEFAULT NULL,
  `comprobante_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `servicio_id` (`servicio_id`),
  KEY `metodo_pago_id` (`metodo_pago_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `perfiles_chef`
--

DROP TABLE IF EXISTS `perfiles_chef`;
CREATE TABLE IF NOT EXISTS `perfiles_chef` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `especialidad` varchar(100) DEFAULT NULL,
  `experiencia_anos` int DEFAULT NULL,
  `precio_por_hora` decimal(10,2) DEFAULT NULL,
  `biografia` text,
  `ubicacion` varchar(200) DEFAULT NULL,
  `certificaciones` text,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `calificacion_promedio` decimal(3,2) DEFAULT '0.00',
  `total_servicios` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `perfiles_chef`
--

INSERT INTO `perfiles_chef` (`id`, `usuario_id`, `especialidad`, `experiencia_anos`, `precio_por_hora`, `biografia`, `ubicacion`, `certificaciones`, `foto_perfil`, `calificacion_promedio`, `total_servicios`) VALUES
(1, 3, 'Cocina Italiana', 8, 45.00, 'Chef especializado en cocina italiana tradicional con 8 años de experiencia en restaurantes de alta gama.', 'San Salvador', 'Certificación en Cocina Italiana, Diploma Culinario', NULL, 4.80, 25),
(2, 4, 'Cocina Francesa', 12, 60.00, 'Chef con formación en París, especializada en cocina francesa clásica y moderna.', 'Santa Tecla', 'Le Cordon Bleu París, Certificación en Pastelería', NULL, 4.90, 40),
(3, 5, 'Cocina Asiática', 6, 40.00, 'Experto en cocina asiática fusión, especializado en sushi y cocina japonesa contemporánea.', 'Antiguo Cuscatlán', 'Certificación en Cocina Japonesa, Curso de Sushi Master', NULL, 4.70, 18),
(4, 6, 'Cocina Italiana', 5, 25.00, '', 'Soyapango', '', 'uploads/profiles/profile_6_1751075273.jpg', 0.00, 0),
(5, 8, 'Cocina General', NULL, 25.00, NULL, NULL, NULL, NULL, 0.00, 0),
(6, 9, 'Cocina Europea', 6, 29.99, '', 'Santa Tecla', '', 'uploads/profiles/profile_9_1751079973.jpg', 0.00, 0),
(7, 10, 'Cocina Francesa', 9, 34.99, '', 'Antiguo Cuscatlán', '', 'uploads/profiles/profile_10_1751080747.jpg', 0.00, 0),
(8, 11, 'Cocina Oriental', 5, 29.99, '', 'San Salvador', '', 'uploads/profiles/profile_11_1751080857.jpg', 0.00, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `preferencias_usuario`
--

DROP TABLE IF EXISTS `preferencias_usuario`;
CREATE TABLE IF NOT EXISTS `preferencias_usuario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `preferencia` varchar(100) NOT NULL,
  `fecha_agregada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `preferencias_usuario`
--

INSERT INTO `preferencias_usuario` (`id`, `usuario_id`, `preferencia`, `fecha_agregada`) VALUES
(1, 1, 'Vegetariano', '2025-06-25 23:47:51'),
(2, 1, 'Sin gluten', '2025-06-25 23:47:51'),
(3, 2, 'Vegano', '2025-06-25 23:47:51'),
(4, 2, 'Sin lactosa', '2025-06-25 23:47:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recetas`
--

DROP TABLE IF EXISTS `recetas`;
CREATE TABLE IF NOT EXISTS `recetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `chef_id` int NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text,
  `ingredientes` text NOT NULL,
  `instrucciones` text NOT NULL,
  `tiempo_preparacion` int DEFAULT NULL,
  `dificultad` enum('fácil','intermedio','difícil') DEFAULT NULL,
  `precio` decimal(8,2) NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `fecha_publicacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activa` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `chef_id` (`chef_id`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `recetas`
--

INSERT INTO `recetas` (`id`, `chef_id`, `titulo`, `descripcion`, `ingredientes`, `instrucciones`, `tiempo_preparacion`, `dificultad`, `precio`, `imagen`, `fecha_publicacion`, `activa`) VALUES
(6, 9, 'Salmón Glaseado con Miso y Sésamo sobre Puré de Coliflor', 'Fusión elegante entre la cocina japonesa y europea. El salmón se glasea con una mezcla umami de miso mientras descansa sobre un sedoso puré de coliflor infusionado con mantequilla europea.', '4 (180 gramos cada uno) Filetes de Salmón, sin piel\n3 cucharadas Miso blanco\n2 cucharadas Mirin\n2 cucharadas Sake\n1 cucharada Azúcar Morena\n1 cucharada Aceite de sésamo\n1  Coliflor\n100 mililitros Crema de leche\n80 gramos Mantequilla europea\n200 mililitros Leche entera\n1 cucharada Semilla de sésamo negro', '1. Para el glaseado: mezcla miso, mirin, sake, azúcar y aceite de sésamo hasta obtener una pasta homogénea.\n\n2. Marina el salmón con el glaseado por 15 minutos a temperatura ambiente.\n\n3. Corta la coliflor en floretes y hierve en agua con sal por 15 minutos hasta que esté muy tierna.\n\n4. Escurre la coliflor y procesa con crema, mantequilla y leche hasta obtener un puré sedoso. Sazona con sal y pimienta.\n\n5. Precalienta el horno a 200°C. Sella el salmón en una sartén caliente por 2 minutos de cada lado.\n\n6. Transfiere al horno por 6-8 minutos hasta que esté en su punto.\n\n7. Sirve el salmón sobre el puré de coliflor, espolvorea con sésamo negro y decora con cebollín.', 35, 'intermedio', 12.99, 'uploads/recipes/recipe_6_final_1751080309.jpg', '2025-06-28 03:11:49', 1),
(5, 6, 'Risotto de Trufa Negra con Parmesano Reggiano', 'Un cremoso risotto italiano elevado con el aroma intenso de la trufa negra y la profundidad del auténtico Parmesano Reggiano. Un plato elegante que combina la técnica tradicional con ingredientes de lujo.', '320 gramos Arroz Arborio\n1200 mililitros Caldo de pollo casero\n1  Cebolla blanca pequeña\n3  Dientes de ajo\n150 mililitros Vino blanco seco\n100 gramos Mantequilla sin sal\n120 gramos Parmesano Reggiano\n30 gramos Trufa negra\n60 mililitros Aceite de oliva extra virgen', '1. Calienta el aceite de oliva en una sartén amplia a fuego medio. Sofríe la cebolla hasta que esté transparente (5 min).\n\n2. Agrega el ajo y cocina 1 minuto más. Incorpora el arroz y tuesta por 2-3 minutos hasta que los granos estén nacarados.\n\n3. Vierte el vino blanco y revuelve hasta que se absorba completamente.\n\n4. Agrega el caldo caliente de a una porción (1 cucharón), revolviendo constantemente hasta que se absorba antes de añadir más. Repite por 18-20 minutos.\n\n5. Cuando el arroz esté al dente, retira del fuego. Incorpora 70g de mantequilla y 80g de Parmesano, revolviendo vigorosamente.\n\n6. Ajusta la sazón. Sirve inmediatamente decorando con láminas de trufa, el resto del queso y perejil.', 45, 'difícil', 14.99, 'uploads/recipes/recipe_5_final_1751076193.jpg', '2025-06-28 02:03:13', 1),
(7, 10, 'Magret de Pato con Reducción de Cerezas y Fondant de Papa', 'Clásico de la cocina francesa donde el magret de pato se cocina a la perfección, acompañado de una intensa reducción de cerezas y cremosas papas fondant que se derriten en el paladar.', '2 (400 gramos cada uno) Magrets de pato\n300 gramos Cerezas frescas\n200 mililitros Vino tinto\n100 mililitros Caldo de pato o pollo concentrado\n2 cucharadas Miel de abeja\n1 cucharada Vinagre balsámico\n8  Papas medianas tipo Yukon Gold\n150 gramos Mantequilla\n4 ramas Tomillo fresco\n3  Dientes de ajo', '1. Papas fondant: Pela las papas y córtalas en cilindros de 5cm. En una sartén amplia, dora las papas por ambos lados en mantequilla.\n\n2. Agrega tomillo, ajo y caldo hasta cubrir la mitad. Cocina a fuego bajo por 30-40 minutos, volteando ocasionalmente.\n\n3. Reducción: En una sartén, reduce el vino tinto a la mitad. Agrega cerezas, miel y vinagre. Cocina 15 minutos hasta obtener consistencia de jarabe.\n\n4. Magret: Haz cortes en la piel del pato en forma de rombo. Sella en sartén fría con la piel hacia abajo por 8-10 minutos.\n\n5. Voltea y cocina 4-6 minutos más para término medio. Deja reposar 5 minutos antes de cortar.\n\n6. Corta el magret en láminas diagonales. Sirve con las papas fondant y la reducción de cerezas.', 75, 'difícil', 17.99, 'uploads/recipes/recipe_7_final_1751080666.jpg', '2025-06-28 03:17:46', 1),
(8, 11, 'Tartar de Atún Rojo con Aguacate y Caviar de Soja', 'Entrada sofisticada que celebra la frescura del atún rojo de primera calidad, complementado con cremoso aguacate, el toque salino del caviar de soja y un aliño cítrico que realza todos los sabores.', '400 gramos Atún rojo sashimi grande\n2  Aguacates maduros pero firmes\n2 cucharadas Caviar de soja\n1  Pepino pequeño\n2 cucharaditas Wasabi fresco\n3 cucharadas Salsa de soja baja en sodio\n1  Jugo de lima\n2  Cebolletas\n  Tostadas de arroz', '1. Preparación del atún: Corta el atún en cubos pequeños de 0.5cm. Mantén refrigerado hasta el momento de servir.\n\n2. Aliño: Mezcla salsa de soja, aceite de sésamo, jugo de lima, jengibre y wasabi hasta integrar completamente.\n\n3. Aguacate: Corta los aguacates en cubos del mismo tamaño que el atún.\n\n4. Pepino: Pela y corta en brunoise (cubos muy pequeños) para agregar textura.\r\n\n\n5. Montaje: En un bowl frío, mezcla suavemente atún, aguacate y pepino con el aliño.\n\n6. Presentación: Utiliza un aro de emplatar para formar torres en cada plato. Corona con caviar de soja y cebolletas\n\n7. Acompaña con tostadas de arroz', 25, 'intermedio', 15.99, 'uploads/recipes/recipe_8_final_1751081093.jpg', '2025-06-28 03:24:53', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios`
--

DROP TABLE IF EXISTS `servicios`;
CREATE TABLE IF NOT EXISTS `servicios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cliente_id` int NOT NULL,
  `chef_id` int NOT NULL,
  `fecha_servicio` date NOT NULL,
  `hora_servicio` time NOT NULL,
  `ubicacion_servicio` varchar(300) NOT NULL,
  `numero_comensales` int NOT NULL,
  `precio_total` decimal(10,2) NOT NULL,
  `estado` enum('pendiente','aceptado','rechazado','completado','cancelado') DEFAULT 'pendiente',
  `descripcion_evento` text,
  `fecha_solicitud` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_servicios_cliente` (`cliente_id`),
  KEY `idx_servicios_chef` (`chef_id`),
  KEY `idx_servicios_fecha` (`fecha_servicio`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `traducciones_categorias`
--

DROP TABLE IF EXISTS `traducciones_categorias`;
CREATE TABLE IF NOT EXISTS `traducciones_categorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoria_id` int NOT NULL,
  `idioma` char(2) NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_translation` (`categoria_id`,`idioma`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `traducciones_perfil_chef`
--

DROP TABLE IF EXISTS `traducciones_perfil_chef`;
CREATE TABLE IF NOT EXISTS `traducciones_perfil_chef` (
  `id` int NOT NULL AUTO_INCREMENT,
  `perfil_chef_id` int NOT NULL,
  `idioma` char(2) NOT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `especialidad` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_translation` (`perfil_chef_id`,`idioma`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `traducciones_recetas`
--

DROP TABLE IF EXISTS `traducciones_recetas`;
CREATE TABLE IF NOT EXISTS `traducciones_recetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `receta_id` int NOT NULL,
  `idioma` char(2) NOT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `descripcion` text,
  `ingredientes` text,
  `instrucciones` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_translation` (`receta_id`,`idioma`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `traducciones_servicios`
--

DROP TABLE IF EXISTS `traducciones_servicios`;
CREATE TABLE IF NOT EXISTS `traducciones_servicios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `servicio_id` int NOT NULL,
  `idioma` char(2) NOT NULL,
  `titulo` varchar(100) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_translation` (`servicio_id`,`idioma`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` text,
  `fecha_nacimiento` date DEFAULT NULL,
  `tipo_usuario` enum('cliente','chef') NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_ultimo_acceso` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password`, `telefono`, `direccion`, `fecha_nacimiento`, `tipo_usuario`, `fecha_registro`, `activo`, `fecha_ultimo_acceso`) VALUES
(9, 'Henry', 'chele@gmail.com', '$2y$10$gqdKdi51ChNnhgnbp10UWuU4uOdEmHFY1e7.lGNpk6VL716Y.lYtq', '1234-5678', NULL, NULL, 'chef', '2025-06-28 03:03:15', 1, NULL),
(10, 'Oscar', 'oscar@gmail.com', '$2y$10$u8EL5ZMUbO/z5ex4LDE22.2ba8CG4oHMbZGWmYA1Kb8H5vTOnGfaC', '1234-5678', NULL, NULL, 'chef', '2025-06-28 03:12:58', 1, NULL),
(11, 'Alejandro', 'alejandro@gmail.com', '$2y$10$ym/IhWYk/oV3ExhEGdmUHupdPRLUeRfykA5ZQXBsyRdE/9J9VMg/C', '1234-5678', NULL, NULL, 'chef', '2025-06-28 03:20:04', 1, NULL),
(6, 'Emerson', 'emersonbonilla@gmai.com', '$2y$10$eVbZFZ9akJQEqWgU2QcfzuICSuxu159QfYTOoE2WdNcym1yvuyI7C', '1234-5678', NULL, NULL, 'chef', '2025-06-23 23:49:16', 1, NULL),
(7, 'Jacobo Alejandro Hernández Guirola', 'jacoboguirola@gmai.com', '$2y$10$.jqCtmBV6Bcgm18uCmB9WeX1FKg7VQwbjg7QSOLO5H4KTnB2fd2s.', '1234-5678', NULL, NULL, 'cliente', '2025-06-23 23:57:02', 1, '2025-06-28 01:43:33');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
