<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';
require_once '../../utils/translate.php';
require_once '../../config/api_keys.php';

try {
    $user = requireAuth();
    
    $database = new Database();
    $db = $database->getConnection();
    
    $nombre = $_POST['nombre'] ?? '';
    $email = $_POST['email'] ?? '';
    $telefono = $_POST['telefono'] ?? '';
    $especialidad = $_POST['especialidad'] ?? '';
    $experiencia_anos = $_POST['experiencia_anos'] ?? null;
    $precio_por_hora = $_POST['precio_por_hora'] ?? null;
    $biografia = $_POST['biografia'] ?? '';
    $ubicacion = $_POST['ubicacion'] ?? '';
    $certificaciones = $_POST['certificaciones'] ?? '';
    
    // Handle file upload
    $foto_perfil = null;
    if (isset($_FILES['foto_perfil']) && $_FILES['foto_perfil']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/profiles/';
        
        // Create directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $fileExtension = strtolower(pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        
        if (in_array($fileExtension, $allowedExtensions)) {
            $fileName = 'profile_' . $user['id'] . '_' . time() . '.' . $fileExtension;
            $uploadPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $uploadPath)) {
                $foto_perfil = 'uploads/profiles/' . $fileName;
            }
        }
    }
    
    // Start transaction
    $db->autocommit(false);
    
    try {
        // Update user basic info
        $userQuery = "UPDATE usuarios SET nombre = ?, email = ?, telefono = ? WHERE id = ?";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bind_param('sssi', $nombre, $email, $telefono, $user['id']);
        $userStmt->execute();
        $userStmt->close();
        
        // Update or insert chef profile
        $checkProfileQuery = "SELECT id FROM perfiles_chef WHERE usuario_id = ?";
        $checkStmt = $db->prepare($checkProfileQuery);
        $checkStmt->bind_param('i', $user['id']);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        
        if ($result->num_rows > 0) {
            $checkStmt->close();
            // Update existing profile
            if ($foto_perfil) {
                $profileQuery = "UPDATE perfiles_chef SET 
                               especialidad = ?, experiencia_anos = ?, precio_por_hora = ?,
                               biografia = ?, ubicacion = ?, certificaciones = ?, foto_perfil = ?
                               WHERE usuario_id = ?";
                $profileStmt = $db->prepare($profileQuery);
                $profileStmt->bind_param('sidssssi', $especialidad, $experiencia_anos, $precio_por_hora, 
                                       $biografia, $ubicacion, $certificaciones, $foto_perfil, $user['id']);
            } else {
                $profileQuery = "UPDATE perfiles_chef SET 
                               especialidad = ?, experiencia_anos = ?, precio_por_hora = ?,
                               biografia = ?, ubicacion = ?, certificaciones = ?
                               WHERE usuario_id = ?";
                $profileStmt = $db->prepare($profileQuery);
                $profileStmt->bind_param('sidsssi', $especialidad, $experiencia_anos, $precio_por_hora, 
                                       $biografia, $ubicacion, $certificaciones, $user['id']);
            }
            
            $profileStmt->execute();
            $profileStmt->close();
        } else {
            $checkStmt->close();
            // Insert new profile
            $profileQuery = "INSERT INTO perfiles_chef 
                           (usuario_id, especialidad, experiencia_anos, precio_por_hora, 
                            biografia, ubicacion, certificaciones, foto_perfil) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $profileStmt = $db->prepare($profileQuery);
            $profileStmt->bind_param('isidssss', $user['id'], $especialidad, $experiencia_anos, $precio_por_hora, 
                                   $biografia, $ubicacion, $certificaciones, $foto_perfil);
            $profileStmt->execute();
            $profileStmt->close();
        }
        
        // Traducir contenido al inglés
        try {
            $translator = new Translator(APIKeys::getRapidAPIKey());
            
            // Contenido a traducir
            $textsToTranslate = [
                'especialidad' => $especialidad,
                'biografia' => $biografia,
                'certificaciones' => $certificaciones
            ];
            
            $translations = $translator->translateArray($textsToTranslate);
            
            // Guardar traducciones
            $translationQuery = "INSERT INTO traducciones_perfil_chef 
                               (perfil_chef_id, idioma, titulo, descripcion, especialidad) 
                               VALUES (?, 'en', ?, ?, ?)
                               ON DUPLICATE KEY UPDATE 
                               titulo = VALUES(titulo),
                               descripcion = VALUES(descripcion),
                               especialidad = VALUES(especialidad)";
            
            $translationStmt = $db->prepare($translationQuery);
            $translationStmt->bind_param('isss', $user['id'], $nombre, $translations['biografia'], $translations['especialidad']);
            $translationStmt->execute();
            $translationStmt->close();
        } catch (Exception $e) {
            error_log('Error en la traducción: ' . $e->getMessage());
            // Continuar con la actualización aunque falle la traducción
        }
        
        $db->commit();
        $db->autocommit(true);
        
        // Return updated user data
        $updatedUser = [
            'nombre' => $nombre,
            'email' => $email,
            'telefono' => $telefono,
            'especialidad' => $especialidad,
            'foto_perfil' => $foto_perfil
        ];
        
        echo json_encode([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente',
            'user'    => $updatedUser
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
