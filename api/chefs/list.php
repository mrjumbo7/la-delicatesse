<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once '../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $chef_id = isset($_GET['id']) ? $_GET['id'] : null;
    
    $query = "SELECT u.id, u.nombre, u.email, u.telefono,
                     p.especialidad, p.experiencia_anos, p.precio_por_hora,
                     p.biografia, p.ubicacion, p.certificaciones, p.foto_perfil,
                     p.calificacion_promedio, p.total_servicios
              FROM usuarios u
              INNER JOIN perfiles_chef p ON u.id = p.usuario_id
              WHERE u.tipo_usuario = 'chef' AND u.activo = 1";
    
    if ($chef_id) {
        $query .= " AND u.id = ?";
    }
    
    $query .= " ORDER BY p.calificacion_promedio DESC, p.total_servicios DESC";
    
    $stmt = $db->prepare($query);
    
    if ($chef_id) {
        $stmt->bind_param('i', $chef_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $chefs = [];
    while ($row = $result->fetch_assoc()) {
        $chefs[] = $row;
    }
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'data' => $chefs
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
