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
    
    $query = "SELECT u.id, u.nombre, u.email,
                     p.especialidad, p.precio_por_hora, p.foto_perfil,
                     p.calificacion_promedio, p.total_servicios
              FROM chefs_favoritos cf
              INNER JOIN usuarios u ON cf.chef_id = u.id
              INNER JOIN perfiles_chef p ON u.id = p.usuario_id
              WHERE cf.cliente_id = :user_id
              ORDER BY cf.fecha_agregado DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['user_id']);
    $stmt->execute();
    
    $favorites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $favorites
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
