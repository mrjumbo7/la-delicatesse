<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'cliente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Obtener recetas favoritas del cliente
    $query = "SELECT r.*, c.nombre as chef_nombre, c.apellido as chef_apellido 
              FROM recetas r 
              INNER JOIN recetas_favoritas rf ON r.id = rf.receta_id 
              INNER JOIN usuarios c ON r.chef_id = c.id 
              WHERE rf.cliente_id = ? 
              ORDER BY rf.fecha_agregado DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $recipes = [];
    while ($row = $result->fetch_assoc()) {
        $recipes[] = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'descripcion' => $row['descripcion'],
            'tiempo_preparacion' => $row['tiempo_preparacion'],
            'dificultad' => $row['dificultad'],
            'imagen' => $row['imagen'],
            'chef' => [
                'nombre' => $row['chef_nombre'],
                'apellido' => $row['chef_apellido']
            ]
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'recipes' => $recipes
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
} finally {
    if (isset($db)) {
        $db->close();
    }
}