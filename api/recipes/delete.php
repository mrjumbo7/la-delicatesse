<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    $user = requireAuth();
    
    if ($user['tipo_usuario'] !== 'chef') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Solo los chefs pueden eliminar recetas']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $recipe_id = $input['recipe_id'] ?? '';
    
    if (empty($recipe_id)) {
        echo json_encode(['success' => false, 'message' => 'ID de receta requerido']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Verificar que la receta pertenece al chef
    $checkQuery = "SELECT id, imagen FROM recetas WHERE id = ? AND chef_id = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bind_param('ii', $recipe_id, $user['id']);
    $checkStmt->execute();
    $result = $checkStmt->get_result();
    $recipe = $result->fetch_assoc();
    $checkStmt->close();
    
    if (!$recipe) {
        echo json_encode(['success' => false, 'message' => 'Receta no encontrada o no autorizada']);
        exit;
    }
    
    $db->autocommit(false);
    
    try {
        // Obtener todas las imágenes asociadas para eliminarlas
        $imagesQuery = "SELECT imagen_url FROM imagenes_recetas WHERE receta_id = ?";
        $imagesStmt = $db->prepare($imagesQuery);
        $imagesStmt->bind_param('i', $recipe_id);
        $imagesStmt->execute();
        $result = $imagesStmt->get_result();
        $images = [];
        while ($row = $result->fetch_assoc()) {
            $images[] = $row;
        }
        $imagesStmt->close();
        
        // Eliminar registros de imágenes de la base de datos
        $deleteImagesQuery = "DELETE FROM imagenes_recetas WHERE receta_id = ?";
        $deleteImagesStmt = $db->prepare($deleteImagesQuery);
        $deleteImagesStmt->bind_param('i', $recipe_id);
        $deleteImagesStmt->execute();
        $deleteImagesStmt->close();
        
        // Marcar la receta como inactiva en lugar de eliminarla
        $updateQuery = "UPDATE recetas SET activa = 0 WHERE id = ?";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bind_param('i', $recipe_id);
        $updateStmt->execute();
        $updateStmt->close();
        
        $db->commit();
        $db->autocommit(true);
        
        // Eliminar archivos físicos
        if ($recipe['imagen'] && file_exists('../../' . $recipe['imagen'])) {
            unlink('../../' . $recipe['imagen']);
        }
        
        foreach ($images as $image) {
            if (file_exists('../../' . $image['imagen_url'])) {
                unlink('../../' . $image['imagen_url']);
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Receta eliminada exitosamente'
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        $db->autocommit(true);
        throw $e;
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