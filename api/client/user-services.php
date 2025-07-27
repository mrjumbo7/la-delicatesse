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
    
    $query = "SELECT s.*, c.nombre as chef_nombre, c.apellido as chef_apellido, c.foto as chef_foto 
              FROM servicios s 
              INNER JOIN usuarios c ON s.chef_id = c.id 
              WHERE s.cliente_id = ? 
              ORDER BY s.fecha_servicio DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $services = [];
    while ($row = $result->fetch_assoc()) {
        $services[] = [
            'id' => $row['id'],
            'fecha_servicio' => $row['fecha_servicio'],
            'hora_inicio' => $row['hora_inicio'],
            'duracion' => $row['duracion'],
            'estado' => $row['estado'],
            'tipo_servicio' => $row['tipo_servicio'],
            'precio' => $row['precio'],
            'chef' => [
                'id' => $row['chef_id'],
                'nombre' => $row['chef_nombre'],
                'apellido' => $row['chef_apellido'],
                'foto' => $row['chef_foto']
            ]
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'services' => $services
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
} finally {
    if (isset($db)) {
        $db->close();
    }
}