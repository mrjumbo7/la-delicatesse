<?php
require_once '../config/database.php';
require_once '../auth/auth.php';

// Verificar autenticación
$user = requireAuth();

// Verificar que el usuario sea un cliente
if ($user['tipo_usuario'] !== 'cliente') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los clientes pueden acceder a esta función.']);
    exit;
}

// Obtener el ID del usuario autenticado
$userId = $user['user_id'];

// Obtener datos del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || !isset($data['type']) || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Datos incompletos. Se requiere tipo y ID.']);
    exit;
}

$type = $data['type'];
$id = intval($data['id']);

// Conectar a la base de datos
$db = new Database();
$conn = $db->getConnection();

try {
    // Añadir según el tipo (chef o receta)
    if ($type === 'chef') {
        // Verificar que el chef exista
        $stmt = $conn->prepare("SELECT id FROM usuarios WHERE id = ? AND tipo_usuario = 'chef'");
        $stmt->bindParam(1, $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'El chef no existe']);
            exit;
        }
        
        // Verificar si ya está en favoritos
        $stmt = $conn->prepare("SELECT id FROM chefs_favoritos WHERE cliente_id = ? AND chef_id = ?");
        $stmt->bindParam(1, $userId, PDO::PARAM_INT);
        $stmt->bindParam(2, $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => false, 'message' => 'Este chef ya está en tus favoritos']);
            exit;
        }
        
        // Añadir chef a favoritos
        $stmt = $conn->prepare("INSERT INTO chefs_favoritos (cliente_id, chef_id) VALUES (?, ?)");
        $stmt->bindParam(1, $userId, PDO::PARAM_INT);
        $stmt->bindParam(2, $id, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Chef añadido a favoritos']);
    } 
    else if ($type === 'recipe') {
        // Verificar si la tabla existe
        $tableExists = false;
        $stmt = $conn->prepare("SHOW TABLES LIKE 'recetas_favoritas'");
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            $tableExists = true;
        }
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $conn->exec("
                CREATE TABLE recetas_favoritas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    cliente_id INT NOT NULL,
                    receta_id INT NOT NULL,
                    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY unique_favorite (cliente_id, receta_id),
                    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE
                )
            ");
        }
        
        // Verificar que la receta exista
        $stmt = $conn->prepare("SELECT id FROM recetas WHERE id = ?");
        $stmt->bindParam(1, $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'La receta no existe']);
            exit;
        }
        
        // Verificar si ya está en favoritos
        $stmt = $conn->prepare("SELECT id FROM recetas_favoritas WHERE cliente_id = ? AND receta_id = ?");
        $stmt->bindParam(1, $userId, PDO::PARAM_INT);
        $stmt->bindParam(2, $id, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => false, 'message' => 'Esta receta ya está en tus favoritos']);
            exit;
        }
        
        // Añadir receta a favoritos
        $stmt = $conn->prepare("INSERT INTO recetas_favoritas (cliente_id, receta_id) VALUES (?, ?)");
        $stmt->bindParam(1, $userId, PDO::PARAM_INT);
        $stmt->bindParam(2, $id, PDO::PARAM_INT);
        $stmt->execute();
        
        echo json_encode(['success' => true, 'message' => 'Receta añadida a favoritos']);
    } 
    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tipo no válido. Use "chef" o "recipe".']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al añadir a favoritos: ' . $e->getMessage()]);
}

// En PDO no es necesario cerrar la conexión explícitamente, se cierra automáticamente
// cuando la variable $conn sale del ámbito
$conn = null;