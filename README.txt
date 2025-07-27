===============================================================================
                            LA DÉLICATESSE
                     Plataforma de Chefs a Domicilio
===============================================================================

DESCRIPCIÓN DEL PROYECTO
========================

La Délicatesse es una plataforma web que conecta clientes con chefs certificados
para ofrecer experiencias gastronómicas únicas en la comodidad del hogar. 
La aplicación permite a los usuarios contratar servicios culinarios personalizados
y acceder a recetas exclusivas de chefs profesionales.

CARACTERÍSTICAS PRINCIPALES
===========================

✓ Sistema de autenticación para clientes y chefs
✓ Catálogo de chefs certificados con perfiles detallados
✓ Biblioteca de recetas premium con instrucciones paso a paso
✓ Sistema de reservas y contratación de servicios
✓ Dashboard personalizado para chefs
✓ Sistema de calificaciones y reseñas
✓ Mensajería entre clientes y chefs
✓ Gestión de pagos y métodos de pago
✓ Soporte multiidioma (Español/Inglés)
✓ Diseño responsive y moderno

TECNOLOGÍAS UTILIZADAS
======================

Frontend:
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS para estilos
- Diseño responsive
- Animaciones CSS personalizadas

Backend:
- PHP 8.x
- MySQL 8.x
- PDO para conexión a base de datos
- API RESTful

Otras herramientas:
- WAMP/XAMPP para desarrollo local
- Sistema de autenticación JWT personalizado
- Subida de archivos para imágenes

ESTRUCTURA DEL PROYECTO
=======================

la-delicatesse/
├── api/                    # APIs del backend
│   ├── auth/              # Autenticación y autorización
│   ├── chefs/             # Gestión de chefs
│   ├── client/            # Funciones para clientes
│   ├── dashboard/         # APIs del dashboard
│   ├── profile/           # Gestión de perfiles
│   ├── recipes/           # Gestión de recetas
│   └── services/          # Servicios y reservas
├── assets/                # Recursos estáticos
│   ├── css/              # Hojas de estilo
│   ├── images/           # Imágenes del sitio
│   └── js/               # Scripts JavaScript
├── config/                # Configuración
│   ├── api_keys.php      # Claves API
│   └── database.php      # Configuración BD
├── scripts/               # Scripts SQL
│   ├── database_setup.sql
│   ├── la_delicatesse.sql
│   └── sample_data.sql
├── uploads/               # Archivos subidos
│   ├── profiles/         # Fotos de perfil
│   └── recipes/          # Imágenes de recetas
├── utils/                 # Utilidades
│   ├── auth.php          # Funciones de autenticación
│   └── translate.php     # Sistema de traducción
├── index.html             # Página principal
├── dashboard.html         # Dashboard de chefs
├── chefs-catalog.html     # Catálogo de chefs
├── recipes-catalog.html   # Catálogo de recetas
├── chef-profile.html      # Perfil individual de chef
├── recipe-detail.html     # Detalle de receta
└── user-profile.html      # Perfil de usuario

BASE DE DATOS
=============

Tablas principales:
- usuarios: Información de usuarios (clientes y chefs)
- perfiles_chef: Perfiles detallados de chefs
- recetas: Recetas publicadas por chefs
- servicios: Servicios contratados
- calificaciones: Sistema de reseñas
- mensajes: Sistema de mensajería
- pagos: Gestión de pagos
- chefs_favoritos: Chefs favoritos de clientes
- preferencias_usuario: Preferencias alimentarias

Tablas de traducción:
- traducciones_recetas
- traducciones_perfil_chef
- traducciones_servicios

INSTALACIÓN Y CONFIGURACIÓN
============================

1. Requisitos del sistema:
   - PHP 8.0 o superior
   - MySQL 8.0 o superior
   - Servidor web (Apache/Nginx)
   - WAMP/XAMPP para desarrollo local

2. Configuración de la base de datos:
   - Crear base de datos 'la_delicatesse'
   - Ejecutar script: scripts/la_delicatesse.sql
   - Opcional: Cargar datos de prueba con sample_data.sql

3. Configuración del proyecto:
   - Clonar/descargar archivos en directorio web
   - Configurar credenciales en config/database.php
   - Ajustar permisos de carpeta uploads/
   - Configurar claves API en config/api_keys.php

4. Acceso:
   - URL: http://localhost/la-delicatesse/
   - Dashboard: http://localhost/la-delicatesse/dashboard.html

FUNCIONALIDADES POR TIPO DE USUARIO
===================================

Clientes:
- Explorar catálogo de chefs
- Ver recetas premium
- Contratar servicios culinarios
- Gestionar reservas
- Calificar servicios
- Mensajería con chefs
- Gestionar favoritos
- Configurar preferencias alimentarias

Chefs:
- Dashboard completo
- Gestión de perfil profesional
- Publicar y gestionar recetas
- Administrar servicios
- Comunicación con clientes
- Ver estadísticas y ganancias
- Sistema de calificaciones

API ENDPOINTS PRINCIPALES
=========================

Autenticación:
- POST /api/auth/login.php
- POST /api/auth/register.php
- GET /api/auth/validate.php

Chefs:
- GET /api/chefs/list.php
- GET /api/chefs/profile-complete.php
- GET /api/chefs/reviews.php

Recetas:
- GET /api/recipes/list.php
- POST /api/recipes/save-enhanced.php
- DELETE /api/recipes/delete.php

Servicios:
- POST /api/services/create.php
- GET /api/client/reservations.php

Perfil:
- GET /api/profile/get.php
- POST /api/profile/update.php

CARACTERÍSTICAS TÉCNICAS
========================

- Arquitectura MVC
- API RESTful
- Autenticación basada en tokens
- Validación de datos en frontend y backend
- Manejo de errores robusto
- Optimización de imágenes
- Diseño mobile-first
- Carga asíncrona de contenido
- Sistema de notificaciones
- Internacionalización

SEGURIDAD
=========

- Validación y sanitización de datos
- Protección contra inyección SQL (PDO)
- Autenticación por tokens
- Validación de permisos por endpoint
- Encriptación de contraseñas
- Validación de tipos de archivo
- Headers de seguridad CORS

CONTRIBUCIÓN Y DESARROLLO
=========================

Para contribuir al proyecto:
1. Seguir estándares de código PHP PSR-12
2. Documentar nuevas funcionalidades
3. Realizar pruebas antes de commits
4. Mantener compatibilidad con versiones existentes

Estructura de archivos JavaScript:
- main.js: Funcionalidades globales
- dashboard.js: Lógica del dashboard
- catalog.js: Catálogos de chefs/recetas
- profile.js: Gestión de perfiles
- translations.js: Sistema multiidioma

SOPORTE Y CONTACTO
==================

Para soporte técnico o consultas sobre el proyecto:
- Revisar documentación en scripts/
- Verificar logs de error del servidor
- Consultar estructura de base de datos

VERSIÓN
=======
Versión actual: 2.0
Última actualización: Julio 2025

===============================================================================
                        © 2025 La Délicatesse
                    Plataforma de Experiencias Culinarias
===============================================================================