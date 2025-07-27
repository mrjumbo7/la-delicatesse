<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    // Obtener reseñas del usuario
    try {
        // Consultar reseñas realizadas por el usuario
        $stmt = $conn->prepare("
            SELECT c.id, c.servicio_id, c.puntuacion, c.comentario, c.fecha_calificacion, 
                   c.titulo, c.aspectos_positivos, c.aspectos_mejora, c.recomendaria,
                   u.id as chef_id, u.nombre as chef_nombre, u.email as chef_email,
                   s.fecha_servicio as servicio_fecha, s.ubicacion_servicio as servicio_ubicacion
            FROM calificaciones c
            JOIN servicios s ON c.servicio_id = s.id
            JOIN usuarios u ON s.chef_id = u.id
            WHERE c.cliente_id = ?
            ORDER BY c.fecha_calificacion DESC
        ");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $reviews = [];
        while ($row = $result->fetch_assoc()) {
            $reviews[] = $row;
        }
        
        // Devolver respuesta exitosa
        echo json_encode(['success' => true, 'data' => $reviews]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener reseñas: ' . $e->getMessage()]);
    }
    
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // Eliminar una reseña
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de reseña no proporcionado']);
        exit;
    }
    
    $reviewId = intval($data['id']);
    
    try {
        // Verificar que la reseña pertenezca al usuario
        $stmt = $conn->prepare("SELECT id FROM calificaciones WHERE id = ? AND cliente_id = ?");
        $stmt->bind_param("ii", $reviewId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para eliminar esta reseña']);
            exit;
        }
        
        // Eliminar la reseña
        $stmt = $conn->prepare("DELETE FROM calificaciones WHERE id = ?");
        $stmt->bind_param("i", $reviewId);
        $stmt->execute();
        
        // Devolver respuesta exitosa
        echo json_encode(['success' => true, 'message' => 'Reseña eliminada correctamente']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al eliminar reseña: ' . $e->getMessage()]);
    }
    
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Actualizar una reseña
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data || !isset($data['id']) || !isset($data['puntuacion']) || !isset($data['comentario'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Datos incompletos para actualizar la reseña']);
        exit;
    }
    
    $reviewId = intval($data['id']);
    $rating = intval($data['puntuacion']);
    $comment = $data['comentario'];
    $title = $data['titulo'] ?? null;
    $positiveAspects = $data['aspectos_positivos'] ?? null;
    $improvementAspects = $data['aspectos_mejora'] ?? null;
    $recommend = isset($data['recomendaria']) ? intval($data['recomendaria']) : null;
    
    // Validar puntuación
    if ($rating < 1 || $rating > 5) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'La puntuación debe estar entre 1 y 5']);
        exit;
    }
    
    try {
        // Verificar que la reseña pertenezca al usuario
        $stmt = $conn->prepare("SELECT id FROM calificaciones WHERE id = ? AND cliente_id = ?");
        $stmt->bind_param("ii", $reviewId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No tienes permiso para actualizar esta reseña']);
            exit;
        }
        
        // Actualizar la reseña
        $stmt = $conn->prepare("
            UPDATE calificaciones 
            SET puntuacion = ?, comentario = ?, titulo = ?, 
                aspectos_positivos = ?, aspectos_mejora = ?, recomendaria = ?
            WHERE id = ?
        ");
        $stmt->bind_param("issssii", $rating, $comment, $title, $positiveAspects, $improvementAspects, $recommend, $reviewId);
        $stmt->execute();
        
        // Devolver respuesta exitosa
        echo json_encode(['success' => true, 'message' => 'Reseña actualizada correctamente']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar reseña: ' . $e->getMessage()]);
    }
    
} else {
    // Método no permitido
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

// Cerrar conexión
$conn->close();