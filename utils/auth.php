<?php
function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return false;
    }
    
    $token = $matches[1];
    
    try {
        $decoded = json_decode(base64_decode($token), true);
        
        if (!$decoded || !isset($decoded['user_id']) || !isset($decoded['exp'])) {
            return false;
        }
        
        if ($decoded['exp'] < time()) {
            return false; // Token expirado
        }
        
        return $decoded;
    } catch (Exception $e) {
        return false;
    }
}

function requireAuth() {
    $user = authenticateUser();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    // Obtener información completa del usuario desde la base de datos
    require_once __DIR__ . '/../config/database.php';
    $db = new Database();
    $conn = $db->getConnection();
    
    try {
        $stmt = $conn->prepare("SELECT id, nombre, email, tipo_usuario, activo FROM usuarios WHERE id = ?");
        $stmt->bind_param("i", $user['user_id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            exit;
        }
        
        $userData = $result->fetch_assoc();
        
        if (!$userData['activo']) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Usuario inactivo']);
            exit;
        }
        
        $stmt->close();
        $conn->close();
        return $userData;
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error de autenticación: ' . $e->getMessage()]);
        exit;
    }
}
?>
