<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
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
    
    // Total reservations
    $reservationsQuery = "SELECT COUNT(*) as total FROM servicios WHERE cliente_id = ?";
    $reservationsStmt = $db->prepare($reservationsQuery);
    $reservationsStmt->bind_param('i', $user['id']);
    $reservationsStmt->execute();
    $result = $reservationsStmt->get_result();
    $totalReservations = $result->fetch_assoc()['total'];
    $reservationsStmt->close();
    
    // Total favorites
    $favoritesQuery = "SELECT COUNT(*) as total FROM chefs_favoritos WHERE cliente_id = ?";
    $favoritesStmt = $db->prepare($favoritesQuery);
    $favoritesStmt->bind_param('i', $user['id']);
    $favoritesStmt->execute();
    $result = $favoritesStmt->get_result();
    $totalFavorites = $result->fetch_assoc()['total'];
    $favoritesStmt->close();
    
    // Total spent
    $spentQuery = "SELECT COALESCE(SUM(p.monto), 0) as total 
                   FROM pagos p 
                   INNER JOIN servicios s ON p.servicio_id = s.id 
                   WHERE s.cliente_id = ? AND p.estado_pago = 'completado'";
    $spentStmt = $db->prepare($spentQuery);
    $spentStmt->bind_param('i', $user['id']);
    $spentStmt->execute();
    $result = $spentStmt->get_result();
    $totalSpent = $result->fetch_assoc()['total'];
    $spentStmt->close();
    
    echo json_encode([
        'success' => true,
        'data' => [
            'total_reservations' => (int)$totalReservations,
            'total_favorites' => (int)$totalFavorites,
            'total_spent' => (float)$totalSpent
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
} finally {
    if (isset($db)) {
        $db->close();
    }
}
?>
