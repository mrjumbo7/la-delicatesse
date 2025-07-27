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
              WHERE s.cliente_id = ?
              ORDER BY s.fecha_servicio DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'data' => $reservations
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
