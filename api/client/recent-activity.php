<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../auth/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'cliente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $activities = [];
    
    // Obtener últimas reservaciones
    $query = "SELECT 'reservacion' as tipo, s.fecha_servicio as fecha, 
                     CONCAT('Reservaste un servicio con ', u.nombre, ' ', u.apellido) as descripcion,
                     s.id as referencia_id
              FROM servicios s
              INNER JOIN usuarios u ON s.chef_id = u.id
              WHERE s.cliente_id = :user_id
              ORDER BY s.fecha_servicio DESC LIMIT 5";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->execute();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $activities[] = $row;
    }
    
    // Obtener últimos chefs favoritos agregados
    $query = "SELECT 'favorito' as tipo, f.fecha_agregado as fecha,
                     CONCAT('Agregaste a ', u.nombre, ' ', u.apellido, ' a favoritos') as descripcion,
                     f.chef_id as referencia_id
              FROM chefs_favoritos f
              INNER JOIN usuarios u ON f.chef_id = u.id
              WHERE f.cliente_id = :user_id
              ORDER BY f.fecha_agregado DESC LIMIT 5";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->execute();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $activities[] = $row;
    }
    
    // Ordenar actividades por fecha
    usort($activities, function($a, $b) {
        return strtotime($b['fecha']) - strtotime($a['fecha']);
    });
    
    // Limitar a las 10 actividades más recientes
    $activities = array_slice($activities, 0, 10);
    
    echo json_encode([
        'success' => true,
        'activities' => $activities
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}