<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $chef_id = isset($_GET['chef_id']) ? $_GET['chef_id'] : null;
    
    if (!$chef_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID del chef no proporcionado']);
        exit;
    }
    
    $query = "SELECT c.id, c.servicio_id, c.puntuacion as calificacion, c.comentario, 
                     c.fecha_calificacion as fecha, c.titulo, 
                     c.aspectos_positivos, c.aspectos_mejora, c.recomendaria,
                     u.nombre as cliente_nombre,
                     s.fecha as servicio_fecha, s.ubicacion as servicio_ubicacion
              FROM calificaciones c
              JOIN servicios s ON c.servicio_id = s.id
              JOIN usuarios u ON c.cliente_id = u.id
              WHERE c.chef_id = :chef_id
              ORDER BY c.fecha_calificacion DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':chef_id', $chef_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $reviews = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $reviews
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor: ' . $e->getMessage()]);
}
?>