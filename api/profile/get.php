<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $user = requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT u.*, p.especialidad, p.experiencia_anos, p.precio_por_hora,
                     p.biografia, p.ubicacion, p.certificaciones, p.foto_perfil,
                     p.calificacion_promedio, p.total_servicios
              FROM usuarios u
              LEFT JOIN perfiles_chef p ON u.id = p.usuario_id
              WHERE u.id = ?";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $profile = $result->fetch_assoc();
    $stmt->close();
    
    if (!$profile) {
        echo json_encode(['success' => false, 'message' => 'Perfil no encontrado']);
        exit;
    }
    
    // Remove password from response
    unset($profile['password']);
    
    echo json_encode([
        'success' => true,
        'data' => $profile
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
