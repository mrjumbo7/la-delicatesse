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
            $fileName = 'profile_' . $user['user_id'] . '_' . time() . '.' . $fileExtension;
            $uploadPath = $uploadDir . $fileName;
            
            if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $uploadPath)) {
                $foto_perfil = 'uploads/profiles/' . $fileName;
            }
        }
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Update user basic info
        $userQuery = "UPDATE usuarios SET nombre = :nombre, email = :email, telefono = :telefono WHERE id = :user_id";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(':nombre', $nombre);
        $userStmt->bindParam(':email', $email);
        $userStmt->bindParam(':telefono', $telefono);
        $userStmt->bindParam(':user_id', $user['user_id']);
        $userStmt->execute();
        
        // Update or insert chef profile
        $checkProfileQuery = "SELECT id FROM perfiles_chef WHERE usuario_id = :user_id";
        $checkStmt = $db->prepare($checkProfileQuery);
        $checkStmt->bindParam(':user_id', $user['user_id']);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            // Update existing profile
            $profileQuery = "UPDATE perfiles_chef SET 
                           especialidad = :especialidad,
                           experiencia_anos = :experiencia_anos,
                           precio_por_hora = :precio_por_hora,
                           biografia = :biografia,
                           ubicacion = :ubicacion,
                           certificaciones = :certificaciones";
            
            if ($foto_perfil) {
                $profileQuery .= ", foto_perfil = :foto_perfil";
            }
            
            $profileQuery .= " WHERE usuario_id = :user_id";
            
            $profileStmt = $db->prepare($profileQuery);
            $profileStmt->bindParam(':especialidad', $especialidad);
            $profileStmt->bindParam(':experiencia_anos', $experiencia_anos);
            $profileStmt->bindParam(':precio_por_hora', $precio_por_hora);
            $profileStmt->bindParam(':biografia', $biografia);
            $profileStmt->bindParam(':ubicacion', $ubicacion);
            $profileStmt->bindParam(':certificaciones', $certificaciones);
            $profileStmt->bindParam(':user_id', $user['user_id']);
            
            if ($foto_perfil) {
                $profileStmt->bindParam(':foto_perfil', $foto_perfil);
            }
            
            $profileStmt->execute();
        } else {
            // Insert new profile
            $profileQuery = "INSERT INTO perfiles_chef 
                           (usuario_id, especialidad, experiencia_anos, precio_por_hora, 
                            biografia, ubicacion, certificaciones, foto_perfil) 
                           VALUES (:user_id, :especialidad, :experiencia_anos, :precio_por_hora, 
                                  :biografia, :ubicacion, :certificaciones, :foto_perfil)";
            
            $profileStmt = $db->prepare($profileQuery);
            $profileStmt->bindParam(':user_id', $user['user_id']);
            $profileStmt->bindParam(':especialidad', $especialidad);
            $profileStmt->bindParam(':experiencia_anos', $experiencia_anos);
            $profileStmt->bindParam(':precio_por_hora', $precio_por_hora);
            $profileStmt->bindParam(':biografia', $biografia);
            $profileStmt->bindParam(':ubicacion', $ubicacion);
            $profileStmt->bindParam(':certificaciones', $certificaciones);
            $profileStmt->bindParam(':foto_perfil', $foto_perfil);
            $profileStmt->execute();
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
                               VALUES (:perfil_id, 'en', :titulo, :descripcion, :especialidad)
                               ON DUPLICATE KEY UPDATE 
                               titulo = :titulo,
                               descripcion = :descripcion,
                               especialidad = :especialidad";
            
            $translationStmt = $db->prepare($translationQuery);
            $translationStmt->bindParam(':perfil_id', $user['user_id']);
            $translationStmt->bindParam(':titulo', $nombre);
            $translationStmt->bindParam(':descripcion', $translations['biografia']);
            $translationStmt->bindParam(':especialidad', $translations['especialidad']);
            $translationStmt->execute();
        } catch (Exception $e) {
            error_log('Error en la traducción: ' . $e->getMessage());
            // Continuar con la actualización aunque falle la traducción
        }
        
        $db->commit();
        
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
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}
?>
