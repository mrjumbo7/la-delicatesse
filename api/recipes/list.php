<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $chef_id = isset($_GET['chef_id']) ? $_GET['chef_id'] : null;
    
    $query = "SELECT r.*, u.nombre as chef_nombre
              FROM recetas r
              INNER JOIN usuarios u ON r.chef_id = u.id
              WHERE r.activa = 1";
    
    if ($chef_id) {
        $query .= " AND r.chef_id = :chef_id";
    }
    
    $query .= " ORDER BY r.fecha_publicacion DESC";
    
    $stmt = $db->prepare($query);
    
    if ($chef_id) {
        $stmt->bindParam(':chef_id', $chef_id, PDO::PARAM_INT);
    }
    
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
