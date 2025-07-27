<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'chef') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Total services
    $servicesQuery = "SELECT COUNT(*) as total FROM servicios WHERE chef_id = ?";
    $servicesStmt = $db->prepare($servicesQuery);
    $servicesStmt->bind_param('i', $user['id']);
    $servicesStmt->execute();
    $result = $servicesStmt->get_result();
    $totalServices = $result->fetch_assoc()['total'];
    $servicesStmt->close();
    
    // Average rating
    $ratingQuery = "SELECT AVG(puntuacion) as avg_rating FROM calificaciones WHERE chef_id = ?";
    $ratingStmt = $db->prepare($ratingQuery);
    $ratingStmt->bind_param('i', $user['id']);
    $ratingStmt->execute();
    $result = $ratingStmt->get_result();
    $avgRating = $result->fetch_assoc()['avg_rating'] ?? 0;
    $ratingStmt->close();
    
    // Total earnings
    $earningsQuery = "SELECT COALESCE(SUM(p.monto), 0) as total_earnings 
                     FROM pagos p 
                     INNER JOIN servicios s ON p.servicio_id = s.id 
                     WHERE s.chef_id = ? AND p.estado_pago = 'completado'";
    $earningsStmt = $db->prepare($earningsQuery);
    $earningsStmt->bind_param('i', $user['id']);
    $earningsStmt->execute();
    $result = $earningsStmt->get_result();
    $totalEarnings = $result->fetch_assoc()['total_earnings'];
    $earningsStmt->close();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_services' => (int)$totalServices,
            'avg_rating' => (float)$avgRating,
            'total_earnings' => (float)$totalEarnings
        ]
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