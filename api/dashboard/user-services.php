<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../auth/auth.php';

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'chef') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT s.*, 
                     u.nombre as cliente_nombre,
                     u.email as cliente_email,
                     u.telefono as cliente_telefono
              FROM servicios s
              INNER JOIN usuarios u ON s.cliente_id = u.id
              WHERE s.chef_id = :chef_id
              ORDER BY s.fecha_servicio DESC, s.fecha_solicitud DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':chef_id', $user['user_id']);
    $stmt->execute();
    
    $services = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $services
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>