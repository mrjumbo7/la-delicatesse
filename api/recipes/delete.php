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
    $checkQuery = "SELECT id, imagen FROM recetas WHERE id = :recipe_id AND chef_id = :chef_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':recipe_id', $recipe_id);
    $checkStmt->bindParam(':chef_id', $user['user_id']);
    $checkStmt->execute();
    
    $recipe = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$recipe) {
        echo json_encode(['success' => false, 'message' => 'Receta no encontrada o no autorizada']);
        exit;
    }
    
    $db->beginTransaction();
    
    try {
        // Obtener todas las imágenes asociadas para eliminarlas
        $imagesQuery = "SELECT imagen_url FROM imagenes_recetas WHERE receta_id = :recipe_id";
        $imagesStmt = $db->prepare($imagesQuery);
        $imagesStmt->bindParam(':recipe_id', $recipe_id);
        $imagesStmt->execute();
        $images = $imagesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Eliminar registros de imágenes de la base de datos
        $deleteImagesQuery = "DELETE FROM imagenes_recetas WHERE receta_id = :recipe_id";
        $deleteImagesStmt = $db->prepare($deleteImagesQuery);
        $deleteImagesStmt->bindParam(':recipe_id', $recipe_id);
        $deleteImagesStmt->execute();
        
        // Marcar la receta como inactiva en lugar de eliminarla
        $updateQuery = "UPDATE recetas SET activa = 0 WHERE id = :recipe_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(':recipe_id', $recipe_id);
        $updateStmt->execute();
        
        $db->commit();
        
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
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>