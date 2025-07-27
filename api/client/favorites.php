<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'cliente') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Acceso denegado']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Obtener lista de chefs favoritos
        $query = "SELECT u.id, u.nombre, u.email,
                         p.especialidad, p.precio_por_hora, p.foto_perfil,
                         p.calificacion_promedio, p.total_servicios
                  FROM chefs_favoritos cf
                  INNER JOIN usuarios u ON cf.chef_id = u.id
                  INNER JOIN perfiles_chef p ON u.id = p.usuario_id
                  WHERE cf.cliente_id = ?
                  ORDER BY cf.fecha_agregado DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $favorites = [];
        while ($row = $result->fetch_assoc()) {
            $favorites[] = $row;
        }
        
        $stmt->close();
        
        echo json_encode([
            'success' => true,
            'data' => $favorites
        ]);
        
    } elseif ($method === 'POST') {
        // Toggle favorito (agregar o quitar)
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['chef_id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID del chef requerido']);
            exit;
        }
        
        $chef_id = intval($input['chef_id']);
        $user_id = $user['id'];
        
        // Verificar que el chef exista
        $stmt = $db->prepare("SELECT id FROM usuarios WHERE id = ? AND tipo_usuario = 'chef'");
        $stmt->bind_param('i', $chef_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            $stmt->close();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Chef no encontrado']);
            exit;
        }
        $stmt->close();
        
        // Verificar si ya está en favoritos
        $stmt = $db->prepare("SELECT id FROM chefs_favoritos WHERE cliente_id = ? AND chef_id = ?");
        $stmt->bind_param('ii', $user_id, $chef_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $stmt->close();
            // Quitar de favoritos
            $stmt = $db->prepare("DELETE FROM chefs_favoritos WHERE cliente_id = ? AND chef_id = ?");
            $stmt->bind_param('ii', $user_id, $chef_id);
            $stmt->execute();
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Chef removido de favoritos',
                'action' => 'removed'
            ]);
        } else {
            $stmt->close();
            // Agregar a favoritos
            $stmt = $db->prepare("INSERT INTO chefs_favoritos (cliente_id, chef_id) VALUES (?, ?)");
            $stmt->bind_param('ii', $user_id, $chef_id);
            $stmt->execute();
            $stmt->close();
            
            echo json_encode([
                'success' => true,
                'message' => 'Chef agregado a favoritos',
                'action' => 'added'
            ]);
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
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
