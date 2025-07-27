<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $chef_id = isset($_GET['chef_id']) ? $_GET['chef_id'] : null;
    $recipe_id = isset($_GET['id']) ? $_GET['id'] : null;
    
    $query = "SELECT r.*, u.nombre as chef_nombre, 
                     COALESCE(AVG(c.puntuacion), 0) as calificacion_promedio,
                     COUNT(cr.id) as total_compras
              FROM recetas r
              INNER JOIN usuarios u ON r.chef_id = u.id
              LEFT JOIN compras_recetas cr ON r.id = cr.receta_id
              LEFT JOIN calificaciones c ON cr.cliente_id = c.cliente_id AND r.chef_id = c.chef_id
              WHERE r.activa = 1";
    
    if ($recipe_id) {
        $query .= " AND r.id = ?";
    } elseif ($chef_id) {
        $query .= " AND r.chef_id = ?";
    }
    
    $query .= " GROUP BY r.id, u.nombre ORDER BY r.fecha_publicacion DESC";
    
    $stmt = $db->prepare($query);
    
    if ($recipe_id) {
        $stmt->bind_param('i', $recipe_id);
    } elseif ($chef_id) {
        $stmt->bind_param('i', $chef_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $recipes = [];
    while ($row = $result->fetch_assoc()) {
        $recipes[] = $row;
    }
    
    $stmt->close();
    $db->close();
    
    echo json_encode([
        'success' => true,
        'data' => $recipes
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
