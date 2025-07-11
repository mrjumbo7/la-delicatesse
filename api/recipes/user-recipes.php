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
    
    $query = "SELECT r.*, 
                     COALESCE(cr.ventas, 0) as ventas
              FROM recetas r
              LEFT JOIN (
                  SELECT receta_id, COUNT(*) as ventas 
                  FROM compras_recetas 
                  GROUP BY receta_id
              ) cr ON r.id = cr.receta_id
              WHERE r.chef_id = :chef_id AND r.activa = 1
              ORDER BY r.fecha_publicacion DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':chef_id', $user['user_id']);
    $stmt->execute();
    
    $recipes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $recipes
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>