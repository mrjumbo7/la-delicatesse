<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../utils/auth.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $user = authenticateUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido o expirado']);
        exit;
    }
    
    // Verificar que el usuario sigue activo en la base de datos
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT id, nombre, email, tipo_usuario, activo FROM usuarios WHERE id = ? AND activo = 1";
    $stmt = $db->prepare($query);
    $stmt->bind_param('i', $user['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $dbUser = $result->fetch_assoc();
    
    $stmt->close();
    $db->close();
    
    if (!$dbUser) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado o inactivo']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Token válido',
        'user' => $dbUser
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>