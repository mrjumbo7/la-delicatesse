<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $user = requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $activities = [];
    
    if ($user['tipo_usuario'] === 'chef') {
        // Recent services for chef
        $servicesQuery = "SELECT s.fecha_solicitud as fecha, u.nombre as cliente_nombre, s.estado
                         FROM servicios s
                         INNER JOIN usuarios u ON s.cliente_id = u.id
                         WHERE s.chef_id = ?
                         ORDER BY s.fecha_solicitud DESC
                         LIMIT 5";
        
        $servicesStmt = $db->prepare($servicesQuery);
        $servicesStmt->bind_param('i', $user['id']);
        $servicesStmt->execute();
        $result = $servicesStmt->get_result();
        $services = [];
        while ($row = $result->fetch_assoc()) {
            $services[] = $row;
        }
        $servicesStmt->close();
        
        foreach ($services as $service) {
            $activities[] = [
                'descripcion' => "Nueva solicitud de servicio de {$service['cliente_nombre']} - Estado: {$service['estado']}",
                'fecha' => $service['fecha'],
                'icon' => '📋'
            ];
        }
        
        // Recent reviews
        $reviewsQuery = "SELECT c.fecha_calificacion as fecha, c.puntuacion, u.nombre as cliente_nombre
                        FROM calificaciones c
                        INNER JOIN usuarios u ON c.cliente_id = u.id
                        WHERE c.chef_id = ?
                        ORDER BY c.fecha_calificacion DESC
                        LIMIT 3";
        
        $reviewsStmt = $db->prepare($reviewsQuery);
        $reviewsStmt->bind_param('i', $user['id']);
        $reviewsStmt->execute();
        $result = $reviewsStmt->get_result();
        $reviews = [];
        while ($row = $result->fetch_assoc()) {
            $reviews[] = $row;
        }
        $reviewsStmt->close();
        
        foreach ($reviews as $review) {
            $stars = str_repeat('⭐', $review['puntuacion']);
            $activities[] = [
                'descripcion' => "Nueva reseña de {$review['cliente_nombre']}: {$stars}",
                'fecha' => $review['fecha'],
                'icon' => '⭐'
            ];
        }
        
    } else {
        // Recent activities for client
        $servicesQuery = "SELECT s.fecha_solicitud as fecha, u.nombre as chef_nombre, s.estado
                         FROM servicios s
                         INNER JOIN usuarios u ON s.chef_id = u.id
                         WHERE s.cliente_id = ?
                         ORDER BY s.fecha_solicitud DESC
                         LIMIT 5";
        
        $servicesStmt = $db->prepare($servicesQuery);
        $servicesStmt->bind_param('i', $user['id']);
        $servicesStmt->execute();
        $result = $servicesStmt->get_result();
        $services = [];
        while ($row = $result->fetch_assoc()) {
            $services[] = $row;
        }
        $servicesStmt->close();
        
        foreach ($services as $service) {
            $activities[] = [
                'descripcion' => "Servicio con Chef {$service['chef_nombre']} - Estado: {$service['estado']}",
                'fecha' => $service['fecha'],
                'icon' => '🍽️'
            ];
        }
    }
    
    // Sort by date
    usort($activities, function($a, $b) {
        return strtotime($b['fecha']) - strtotime($a['fecha']);
    });
    
    // Limit to 10 most recent
    $activities = array_slice($activities, 0, 10);
    
    echo json_encode([
        'success' => true,
        'data' => $activities
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
} finally {
    if (isset($db)) {
        $db->close();
    }
}
?>