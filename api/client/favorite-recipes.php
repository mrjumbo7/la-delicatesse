<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

// Verificar autenticación
$user = requireAuth();

// Verificar que el usuario sea un cliente
if ($user['tipo_usuario'] !== 'cliente') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los clientes pueden acceder a esta función.']);
    exit;
}

// Obtener el ID del usuario autenticado
$userId = $user['id'];

// Conectar a la base de datos
$db = new Database();
$conn = $db->getConnection();

// Manejar solicitud según el método HTTP
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener recetas favoritas del usuario
    try {
        // Verificar si la tabla existe
        $tableExists = false;
        $stmt = $conn->prepare("SHOW TABLES LIKE 'recetas_favoritas'");
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $tableExists = true;
        }
        $stmt->close();
        
        if (!$tableExists) {
            // Si la tabla no existe, devolver un array vacío
            echo json_encode(['success' => true, 'data' => [], 'message' => 'Funcionalidad en desarrollo']);
            exit;
        }
        
        // Consultar recetas favoritas del usuario
        $stmt = $conn->prepare("
            SELECT r.id, r.titulo, r.descripcion, r.tiempo_preparacion, r.dificultad, r.precio,
                   r.imagen, r.fecha_publicacion, u.id as chef_id, u.nombre as chef_nombre
            FROM recetas_favoritas rf
            JOIN recetas r ON rf.receta_id = r.id
            JOIN usuarios u ON r.chef_id = u.id
            WHERE rf.cliente_id = ?
            ORDER BY rf.fecha_agregado DESC
        ");
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $favoriteRecipes = [];
        while ($row = $result->fetch_assoc()) {
            $favoriteRecipes[] = $row;
        }
        
        $stmt->close();
        
        // Devolver respuesta exitosa
        echo json_encode(['success' => true, 'data' => $favoriteRecipes]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener recetas favoritas: ' . $e->getMessage()]);
    }
    
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Añadir receta a favoritos
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['receta_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de receta no proporcionado']);
        exit;
    }
    
    $recipeId = intval($data['receta_id']);
    
    try {
        // Verificar si la tabla existe
        $tableExists = false;
        $stmt = $conn->prepare("SHOW TABLES LIKE 'recetas_favoritas'");
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $tableExists = true;
        }
        $stmt->close();
        
        if (!$tableExists) {
            // Crear la tabla si no existe
            $conn->query("
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
        
        // Verificar si la receta ya está en favoritos
        $stmt = $conn->prepare("SELECT id FROM recetas_favoritas WHERE cliente_id = ? AND receta_id = ?");
        $stmt->bind_param('ii', $userId, $recipeId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $stmt->close();
            echo json_encode(['success' => false, 'message' => 'Esta receta ya está en tus favoritos']);
            exit;
        }
        $stmt->close();
        
        // Verificar que la receta exista
        $stmt = $conn->prepare("SELECT id FROM recetas WHERE id = ?");
        $stmt->bind_param('i', $recipeId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'La receta no existe']);
            exit;
        }
        $stmt->close();
        
        // Añadir receta a favoritos
        $stmt = $conn->prepare("INSERT INTO recetas_favoritas (cliente_id, receta_id) VALUES (?, ?)");
        $stmt->bind_param('ii', $userId, $recipeId);
        $stmt->execute();
        $stmt->close();
        
        // Devolver respuesta exitosa
        echo json_encode(['success' => true, 'message' => 'Receta añadida a favoritos']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al añadir receta a favoritos: ' . $e->getMessage()]);
    }
    
} else {
    // Método no permitido
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

// Cerrar conexión
$conn->close();