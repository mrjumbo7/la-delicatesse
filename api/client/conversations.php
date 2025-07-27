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
    
    // Obtener conversaciones del cliente
    $query = "SELECT c.*, u.nombre as chef_nombre, u.apellido as chef_apellido, u.foto as chef_foto,
                     (SELECT mensaje FROM mensajes WHERE conversacion_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultimo_mensaje,
                     (SELECT fecha_envio FROM mensajes WHERE conversacion_id = c.id ORDER BY fecha_envio DESC LIMIT 1) as ultima_fecha
              FROM conversaciones c
              INNER JOIN usuarios u ON c.chef_id = u.id
              WHERE c.cliente_id = ?
              ORDER BY ultima_fecha DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $conversations = [];
    while ($row = $result->fetch_assoc()) {
        $conversations[] = [
            'id' => $row['id'],
            'chef' => [
                'id' => $row['chef_id'],
                'nombre' => $row['chef_nombre'],
                'apellido' => $row['chef_apellido'],
                'foto' => $row['chef_foto']
            ],
            'ultimo_mensaje' => $row['ultimo_mensaje'],
            'ultima_fecha' => $row['ultima_fecha'],
            'estado' => $row['estado']
        ];
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'conversations' => $conversations
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
} finally {
    if (isset($db)) {
        $db->close();
    }
}