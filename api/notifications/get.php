<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $user = requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Obtener notificaciones del usuario
        $query = "SELECT * FROM notificaciones 
                  WHERE usuario_id = ? 
                  ORDER BY fecha_creacion DESC 
                  LIMIT 20";
        
        $stmt = $db->prepare($query);
        $stmt->bind_param('i', $user['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $notifications = [];
        while ($row = $result->fetch_assoc()) {
            $notifications[] = $row;
        }
        $stmt->close();
        
        // Contar notificaciones no leídas
        $unreadQuery = "SELECT COUNT(*) as unread_count FROM notificaciones 
                        WHERE usuario_id = ? AND leida = 0";
        $unreadStmt = $db->prepare($unreadQuery);
        $unreadStmt->bind_param('i', $user['id']);
        $unreadStmt->execute();
        $unreadResult = $unreadStmt->get_result();
        $unreadCount = $unreadResult->fetch_assoc()['unread_count'];
        $unreadStmt->close();
        
        echo json_encode([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $unreadCount
        ]);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Marcar notificación como leída
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['notification_id'])) {
            // Marcar una notificación específica como leída
            $notification_id = $input['notification_id'];
            $updateQuery = "UPDATE notificaciones SET leida = 1 
                           WHERE id = ? AND usuario_id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bind_param('ii', $notification_id, $user['id']);
            $updateStmt->execute();
            $updateStmt->close();
        } elseif (isset($input['mark_all_read']) && $input['mark_all_read']) {
            // Marcar todas las notificaciones como leídas
            $updateQuery = "UPDATE notificaciones SET leida = 1 WHERE usuario_id = ?";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bind_param('i', $user['id']);
            $updateStmt->execute();
            $updateStmt->close();
        }
        
        echo json_encode(['success' => true, 'message' => 'Notificaciones actualizadas']);
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