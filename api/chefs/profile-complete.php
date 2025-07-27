<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        throw new Exception('No se pudo conectar a la base de datos');
    }
    
    // Obtener el ID del chef y el idioma solicitado
    $chef_id = isset($_GET['chef_id']) ? intval($_GET['chef_id']) : 0;
    $language = isset($_GET['lang']) ? $_GET['lang'] : 'es';
    
    if ($chef_id === 0) {
        throw new Exception('ID de chef no proporcionado');
    }
    
    // Consulta base para obtener información del perfil
    $profileQuery = "SELECT u.id, u.nombre, u.email, u.telefono, u.fecha_registro, pc.*, 
              COALESCE(t.titulo, u.nombre) as titulo_traducido,
              COALESCE(t.descripcion, pc.biografia) as biografia_traducida,
              COALESCE(t.especialidad, pc.especialidad) as especialidad_traducida
              FROM usuarios u
              INNER JOIN perfiles_chef pc ON u.id = pc.usuario_id
              LEFT JOIN traducciones_perfil_chef t ON pc.id = t.perfil_chef_id AND t.idioma = ?
              WHERE u.id = ? AND u.tipo_usuario = 'chef'";
    
    $stmt = $db->prepare($profileQuery);
    if (!$stmt) {
        throw new Exception('Error al preparar consulta: ' . $db->error);
    }
    
    $stmt->bind_param('si', $language, $chef_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        // Verificar si el usuario existe
        $checkUserQuery = "SELECT id, nombre, tipo_usuario FROM usuarios WHERE id = ?";
        $checkStmt = $db->prepare($checkUserQuery);
        $checkStmt->bind_param('i', $chef_id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            throw new Exception('Usuario no encontrado');
        } else {
            $user = $checkResult->fetch_assoc();
            if ($user['tipo_usuario'] !== 'chef') {
                throw new Exception('El usuario no es un chef');
            } else {
                throw new Exception('Chef existe pero no tiene perfil completo');
            }
        }
        $checkStmt->close();
    }
    
    $chef_profile = $result->fetch_assoc();
    $stmt->close();
    
    // Obtener estadísticas del chef
    $statsQuery = "SELECT 
                    COUNT(DISTINCT s.id) as total_servicios,
                    COUNT(DISTINCT CASE WHEN s.estado = 'completado' THEN s.id END) as servicios_completados,
                    AVG(CASE WHEN c.puntuacion IS NOT NULL THEN c.puntuacion END) as calificacion_promedio,
                    COUNT(DISTINCT c.id) as total_reviews,
                    SUM(CASE WHEN s.estado = 'completado' THEN s.precio_total ELSE 0 END) as ingresos_totales
                   FROM servicios s
                   LEFT JOIN calificaciones c ON s.id = c.servicio_id
                   WHERE s.chef_id = ?";
    
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->bind_param('i', $chef_id);
    $statsStmt->execute();
    $result = $statsStmt->get_result();
    $stats = $result->fetch_assoc();
    $statsStmt->close();
    
    // Obtener reviews recientes (últimas 5)
    $reviewsQuery = "SELECT c.id, c.puntuacion as calificacion, c.comentario, 
                     c.fecha_calificacion as fecha, c.titulo, 
                     c.aspectos_positivos, c.aspectos_mejora, c.recomendaria,
                     u.nombre as cliente_nombre,
                     s.fecha_servicio, s.ubicacion_servicio
              FROM calificaciones c
              JOIN servicios s ON c.servicio_id = s.id
              JOIN usuarios u ON c.cliente_id = u.id
              WHERE c.chef_id = ?
              ORDER BY c.fecha_calificacion DESC
              LIMIT 5";
    
    $reviewsStmt = $db->prepare($reviewsQuery);
    $reviewsStmt->bind_param('i', $chef_id);
    $reviewsStmt->execute();
    $result = $reviewsStmt->get_result();
    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = $row;
    }
    $reviewsStmt->close();
    
    // Obtener recetas del chef
    $recipesQuery = "SELECT r.id, r.titulo as nombre, r.descripcion as descripcion_corta, 
                     r.tiempo_preparacion, r.dificultad, r.precio, r.imagen,
                     r.fecha_publicacion, r.ingredientes, r.instrucciones
                     FROM recetas r
                     WHERE r.chef_id = ? AND r.activa = 1
                     ORDER BY r.fecha_publicacion DESC";
    
    $recipesStmt = $db->prepare($recipesQuery);
    $recipesStmt->bind_param('i', $chef_id);
    $recipesStmt->execute();
    $result = $recipesStmt->get_result();
    $recipes = [];
    while ($row = $result->fetch_assoc()) {
        $recipes[] = $row;
    }
    $recipesStmt->close();
    
    // Obtener servicios recientes (últimos 5 completados)
    $servicesQuery = "SELECT s.id, s.fecha_servicio, s.ubicacion_servicio, 
                      s.numero_comensales, s.precio_total, s.descripcion_evento,
                      u.nombre as cliente_nombre
                      FROM servicios s
                      JOIN usuarios u ON s.cliente_id = u.id
                      WHERE s.chef_id = ? AND s.estado = 'completado'
                      ORDER BY s.fecha_servicio DESC
                      LIMIT 5";
    
    $servicesStmt = $db->prepare($servicesQuery);
    $servicesStmt->bind_param('i', $chef_id);
    $servicesStmt->execute();
    $result = $servicesStmt->get_result();
    $recent_services = [];
    while ($row = $result->fetch_assoc()) {
        $recent_services[] = $row;
    }
    $servicesStmt->close();
    
    // Estructurar la respuesta completa
    $response = [
        'success' => true,
        'data' => [
            'id' => $chef_profile['id'],
            'profile' => [
                'nombre' => $language === 'es' ? $chef_profile['nombre'] : $chef_profile['titulo_traducido'],
                'email' => $chef_profile['email'],
                'telefono' => $chef_profile['telefono'],
                'especialidad' => $language === 'es' ? $chef_profile['especialidad'] : $chef_profile['especialidad_traducida'],
                'experiencia_anos' => $chef_profile['experiencia_anos'],
                'precio_por_hora' => $chef_profile['precio_por_hora'],
                'biografia' => $language === 'es' ? $chef_profile['biografia'] : $chef_profile['biografia_traducida'],
                'ubicacion' => $chef_profile['ubicacion'],
                'certificaciones' => $chef_profile['certificaciones'],
                'foto_perfil' => $chef_profile['foto_perfil'],
                'fecha_registro' => $chef_profile['fecha_registro']
            ],
            'estadisticas' => [
                'total_servicios' => intval($stats['total_servicios']),
                'servicios_completados' => intval($stats['servicios_completados']),
                'calificacion_promedio' => round(floatval($stats['calificacion_promedio']), 2),
                'total_reviews' => intval($stats['total_reviews']),
                'ingresos_totales' => floatval($stats['ingresos_totales']),
                'tasa_completacion' => $stats['total_servicios'] > 0 ? 
                    round(($stats['servicios_completados'] / $stats['total_servicios']) * 100, 1) : 0
            ],
            'reviews' => $reviews,
            'recetas' => $recipes,
            'servicios_recientes' => $recent_services
        ]
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($db)) {
        $db->close();
    }
}
?>