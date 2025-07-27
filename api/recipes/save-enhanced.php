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
        echo json_encode(['success' => false, 'message' => 'Solo los chefs pueden crear recetas']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get form data
    $titulo = $_POST['titulo'] ?? '';
    $descripcion = $_POST['descripcion'] ?? '';
    $tiempo_preparacion = $_POST['tiempo_preparacion'] ?? null;
    $dificultad = $_POST['dificultad'] ?? '';
    $precio = $_POST['precio'] ?? '';
    
    // Process ingredients
    $ingredient_quantities = $_POST['ingredient_quantity'] ?? [];
    $ingredient_units = $_POST['ingredient_unit'] ?? [];
    $ingredient_names = $_POST['ingredient_name'] ?? [];
    
    $ingredientes = [];
    for ($i = 0; $i < count($ingredient_names); $i++) {
        if (!empty($ingredient_names[$i])) {
            $ingredientes[] = ($ingredient_quantities[$i] ?? '') . ' ' . 
                            ($ingredient_units[$i] ?? '') . ' ' . 
                            $ingredient_names[$i];
        }
    }
    $ingredientes_text = implode("\n", $ingredientes);
    
    // Process steps
    $step_descriptions = $_POST['step_description'] ?? [];
    $instrucciones = [];
    for ($i = 0; $i < count($step_descriptions); $i++) {
        if (!empty($step_descriptions[$i])) {
            $instrucciones[] = ($i + 1) . ". " . $step_descriptions[$i];
        }
    }
    $instrucciones_text = implode("\n\n", $instrucciones);
    
    // Validate required fields
    if (empty($titulo) || empty($ingredientes_text) || empty($instrucciones_text) || empty($precio)) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos obligatorios deben ser completados']);
        exit;
    }
    
    // Handle file uploads
    $uploadDir = '../../uploads/recipes/';
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            echo json_encode(['success' => false, 'message' => 'Error al crear directorio de uploads']);
            exit;
        }
    }
    
    $db->autocommit(false);
    
    try {
        // Insert recipe
        $recipeQuery = "INSERT INTO recetas (chef_id, titulo, descripcion, ingredientes, instrucciones, 
                                           tiempo_preparacion, dificultad, precio) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $recipeStmt = $db->prepare($recipeQuery);
        $recipeStmt->bind_param('issssisd', $user['id'], $titulo, $descripcion, $ingredientes_text, 
                               $instrucciones_text, $tiempo_preparacion, $dificultad, $precio);
        $recipeStmt->execute();
        
        $recipeId = $db->insert_id;
        $recipeStmt->close();
        
        // Handle final image
        if (isset($_FILES['final_image']) && $_FILES['final_image']['error'] === UPLOAD_ERR_OK) {
            $fileExtension = strtolower(pathinfo($_FILES['final_image']['name'], PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
            
            if (in_array($fileExtension, $allowedExtensions)) {
                // Check file size (2MB max)
                if ($_FILES['final_image']['size'] > 2 * 1024 * 1024) {
                    throw new Exception('La imagen principal debe ser menor a 2MB');
                }
                
                $fileName = 'recipe_' . $recipeId . '_final_' . time() . '.' . $fileExtension;
                $uploadPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['final_image']['tmp_name'], $uploadPath)) {
                    $imageUrl = 'uploads/recipes/' . $fileName;
                    
                    // Update recipe with image
                    $updateQuery = "UPDATE recetas SET imagen = ? WHERE id = ?";
                    $updateStmt = $db->prepare($updateQuery);
                    $updateStmt->bind_param('si', $imageUrl, $recipeId);
                    $updateStmt->execute();
                    $updateStmt->close();
                    
                    // The image URL is already updated in the recetas table above
                } else {
                    throw new Exception('Error al subir la imagen principal');
                }
            } else {
                throw new Exception('Formato de imagen no válido. Use JPG, PNG o GIF');
            }
        }
        
        // Handle step images
        if (isset($_FILES['step_images'])) {
            for ($i = 0; $i < count($_FILES['step_images']['name']); $i++) {
                if ($_FILES['step_images']['error'][$i] === UPLOAD_ERR_OK) {
                    $fileExtension = strtolower(pathinfo($_FILES['step_images']['name'][$i], PATHINFO_EXTENSION));
                    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
                    
                    if (in_array($fileExtension, $allowedExtensions)) {
                        // Check file size (2MB max)
                        if ($_FILES['step_images']['size'][$i] > 2 * 1024 * 1024) {
                            continue; // Skip this image if too large
                        }
                        
                        $fileName = 'recipe_' . $recipeId . '_step_' . ($i + 1) . '_' . time() . '.' . $fileExtension;
                        $uploadPath = $uploadDir . $fileName;
                        
                        if (move_uploaded_file($_FILES['step_images']['tmp_name'][$i], $uploadPath)) {
                            $imageUrl = 'uploads/recipes/' . $fileName;
                            $descripcion = 'Paso ' . ($i + 1);
                            
                            // Store step images in a directory structure, no database entry needed
                        }
                    }
                }
            }
        }
        
        $db->commit();
        $db->autocommit(true);
        
        echo json_encode([
            'success' => true,
            'message' => 'Receta creada exitosamente',
            'recipe_id' => $recipeId
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        $db->autocommit(true);
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($db)) {
        $db->close();
    }
}
?>