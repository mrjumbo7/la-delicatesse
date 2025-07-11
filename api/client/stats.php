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
    $reservationsQuery = "SELECT COUNT(*) as total FROM servicios WHERE cliente_id = :user_id";
    $reservationsStmt = $db->prepare($reservationsQuery);
    $reservationsStmt->bindParam(':user_id', $user['user_id']);
    $reservationsStmt->execute();
    $totalReservations = $reservationsStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total favorites
    $favoritesQuery = "SELECT COUNT(*) as total FROM chefs_favoritos WHERE cliente_id = :user_id";
    $favoritesStmt = $db->prepare($favoritesQuery);
    $favoritesStmt->bindParam(':user_id', $user['user_id']);
    $favoritesStmt->execute();
    $totalFavorites = $favoritesStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total spent
    $spentQuery = "SELECT COALESCE(SUM(p.monto), 0) as total 
                   FROM pagos p 
                   INNER JOIN servicios s ON p.servicio_id = s.id 
                   WHERE s.cliente_id = :user_id AND p.estado_pago = 'completado'";
    $spentStmt = $db->prepare($spentQuery);
    $spentStmt->bindParam(':user_id', $user['user_id']);
    $spentStmt->execute();
    $totalSpent = $spentStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
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
}
?>
