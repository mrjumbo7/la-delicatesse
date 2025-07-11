<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'cliente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT s.*, 
                     u.nombre as chef_nombre,
                     p.especialidad,
                     p.foto_perfil as chef_foto,
                     CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END as has_review
              FROM servicios s
              INNER JOIN usuarios u ON s.chef_id = u.id
              LEFT JOIN perfiles_chef p ON u.id = p.usuario_id
              LEFT JOIN calificaciones c ON s.id = c.servicio_id
              WHERE s.cliente_id = :user_id
              ORDER BY s.fecha_servicio DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->execute();
    
    $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $reservations
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
