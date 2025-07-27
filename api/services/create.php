<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $user = authenticateUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    $chef_id = $input['chef_id'] ?? '';
    $fecha_servicio = $input['fecha_servicio'] ?? '';
    $hora_servicio = $input['hora_servicio'] ?? '';
    $ubicacion_servicio = $input['ubicacion_servicio'] ?? '';
    $numero_comensales = $input['numero_comensales'] ?? '';
    $descripcion_evento = $input['descripcion_evento'] ?? '';
    
    // Validaciones
    if (empty($chef_id) || empty($fecha_servicio) || empty($hora_servicio) || 
        empty($ubicacion_servicio) || empty($numero_comensales)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son requeridos']);
        exit;
    }
    
    // Obtener precio del chef
    $priceQuery = "SELECT precio_por_hora FROM perfiles_chef WHERE usuario_id = ?";
    $priceStmt = $db->prepare($priceQuery);
    $priceStmt->bind_param('i', $chef_id);
    $priceStmt->execute();
    $result = $priceStmt->get_result();
    $chefData = $result->fetch_assoc();
    $priceStmt->close();
    if (!$chefData) {
        echo json_encode(['success' => false, 'message' => 'Chef no encontrado']);
        exit;
    }
    
    // Calcular precio total (asumiendo 4 horas de servicio)
    $precio_total = $chefData['precio_por_hora'] * 4;
    
    // Crear servicio
    $insertQuery = "INSERT INTO servicios (cliente_id, chef_id, fecha_servicio, hora_servicio, 
                                         ubicacion_servicio, numero_comensales, precio_total, 
                                         descripcion_evento, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bind_param('iisssiis', $user['id'], $chef_id, $fecha_servicio, $hora_servicio, 
                           $ubicacion_servicio, $numero_comensales, $precio_total, $descripcion_evento);
    
    if ($insertStmt->execute()) {
        $serviceId = $db->insert_id;
        $insertStmt->close();
        
        // Crear notificación para el chef
        $notifQuery = "INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo) 
                       VALUES (?, 'Nueva solicitud de servicio', 
                              'Tienes una nueva solicitud de servicio pendiente', 'servicio')";
        $notifStmt = $db->prepare($notifQuery);
        $notifStmt->bind_param('i', $chef_id);
        $notifStmt->execute();
        $notifStmt->close();
        
        echo json_encode([
            'success' => true,
            'message' => 'Servicio solicitado exitosamente',
            'service_id' => $serviceId,
            'precio_total' => $precio_total
        ]);
    } else {
        $insertStmt->close();
        echo json_encode(['success' => false, 'message' => 'Error al crear servicio']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
} finally {
    if (isset($db)) {
        $db->close();
    }
}
?>
