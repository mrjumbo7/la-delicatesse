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
$userId = $user['id'];

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
    // Eliminar según el tipo (chef o receta)
    if ($type === 'chef') {
        // Eliminar chef de favoritos
        $stmt = $conn->prepare("DELETE FROM chefs_favoritos WHERE cliente_id = ? AND chef_id = ?");
        $stmt->bind_param("ii", $userId, $id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Chef eliminado de favoritos']);
        } else {
            echo json_encode(['success' => false, 'message' => 'El chef no estaba en favoritos o ya fue eliminado']);
        }
    } 
    else if ($type === 'recipe') {
        // Eliminar receta de favoritas (asumiendo que existe una tabla recetas_favoritas)
        // Nota: Esta tabla no existe en el esquema actual, se debe crear
        $stmt = $conn->prepare("DELETE FROM recetas_favoritas WHERE cliente_id = ? AND receta_id = ?");
        $stmt->bind_param("ii", $userId, $id);
        $stmt->execute();
        
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => true, 'message' => 'Receta eliminada de favoritos']);
        } else {
            echo json_encode(['success' => false, 'message' => 'La receta no estaba en favoritos o ya fue eliminada']);
        }
    } 
    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tipo no válido. Use "chef" o "recipe".']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al eliminar de favoritos: ' . $e->getMessage()]);
}

// Cerrar conexión
$conn->close();