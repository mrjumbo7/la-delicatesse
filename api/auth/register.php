<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $nombre = $_POST['nombre'] ?? '';
    $email = $_POST['email'] ?? '';
    $telefono = $_POST['telefono'] ?? '';
    $tipo_usuario = $_POST['tipo_usuario'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Validaciones
    if (empty($nombre) || empty($email) || empty($tipo_usuario) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos obligatorios deben ser completados']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit;
    }
    
    if (!in_array($tipo_usuario, ['cliente', 'chef'])) {
        echo json_encode(['success' => false, 'message' => 'Tipo de usuario inválido']);
        exit;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'La contraseña debe tener al menos 6 caracteres']);
        exit;
    }
    
    // Verificar si el email ya existe
    $checkQuery = "SELECT id FROM usuarios WHERE email = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bind_param('s', $email);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
        $checkStmt->close();
        $db->close();
        exit;
    }
    $checkStmt->close();
    
    // Encriptar contraseña
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insertar usuario
    $insertQuery = "INSERT INTO usuarios (nombre, email, telefono, tipo_usuario, password) 
                    VALUES (?, ?, ?, ?, ?)";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bind_param('sssss', $nombre, $email, $telefono, $tipo_usuario, $hashedPassword);
    
    if ($insertStmt->execute()) {
        $userId = $db->insert_id;
        
        // Si es chef, crear perfil básico
        if ($tipo_usuario === 'chef') {
            $profileQuery = "INSERT INTO perfiles_chef (usuario_id, especialidad, precio_por_hora) 
                           VALUES (?, 'Cocina General', 25.00)";
            $profileStmt = $db->prepare($profileQuery);
            $profileStmt->bind_param('i', $userId);
            $profileStmt->execute();
            $profileStmt->close();
        }
        
        $insertStmt->close();
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user_id' => $userId
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al registrar usuario']);
        $insertStmt->close();
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
