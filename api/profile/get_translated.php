<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Obtener el ID del chef y el idioma solicitado
    $chef_id = isset($_GET['chef_id']) ? intval($_GET['chef_id']) : 0;
    $language = isset($_GET['lang']) ? $_GET['lang'] : 'es';
    
    if ($chef_id === 0) {
        throw new Exception('ID de chef no proporcionado');
    }
    
    // Consulta base para obtener información del perfil
    $query = "SELECT u.nombre, u.email, u.telefono, pc.*, 
              COALESCE(t.titulo, u.nombre) as titulo_traducido,
              COALESCE(t.descripcion, pc.biografia) as biografia_traducida,
              COALESCE(t.especialidad, pc.especialidad) as especialidad_traducida
              FROM usuarios u
              INNER JOIN perfiles_chef pc ON u.id = pc.usuario_id
              LEFT JOIN traducciones_perfil_chef t ON pc.id = t.perfil_chef_id AND t.idioma = ?
              WHERE u.id = ? AND u.tipo_usuario = 'chef'";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('si', $language, $chef_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $chef_profile = $result->fetch_assoc();
        $stmt->close();
        
        // Estructurar la respuesta
        $response = [
            'success' => true,
            'profile' => [
                'nombre' => $language === 'es' ? $chef_profile['nombre'] : $chef_profile['titulo_traducido'],
                'email' => $chef_profile['email'],
                'telefono' => $chef_profile['telefono'],
                'especialidad' => $language === 'es' ? $chef_profile['especialidad'] : $chef_profile['especialidad_traducida'],
                'experiencia_anos' => $chef_profile['experiencia_anos'],
                'precio_por_hora' => $chef_profile['precio_por_hora'],
                'biografia' => $language === 'es' ? $chef_profile['biografia'] : $chef_profile['biografia_traducida'],
                'ubicacion' => $chef_profile['ubicacion'],
                'certificaciones' => $chef_profile['certificaciones'],
                'foto_perfil' => $chef_profile['foto_perfil'],
                'calificacion_promedio' => $chef_profile['calificacion_promedio']
            ]
        ];
        
        echo json_encode($response);
    } else {
        throw new Exception('Perfil de chef no encontrado');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    if (isset($db)) {
        $db->close();
    }
}