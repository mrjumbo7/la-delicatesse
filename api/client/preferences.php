<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../config/database.php';
require_once '../../utils/auth.php';

// Verificar autenticación
$user = requireAuth();

// Verificar que el usuario sea un cliente
if ($user['tipo_usuario'] !== 'cliente') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso denegado. Solo los clientes pueden acceder a esta función.']);
    exit;
}

// Obtener el ID del usuario autenticado
$userId = $user['id'];

// Conectar a la base de datos
$db = new Database();
$conn = $db->getConnection();

// Manejar solicitud según el método HTTP
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Obtener preferencias del usuario
    try {
        // Consultar preferencias del usuario
        $stmt = $conn->prepare("SELECT id, usuario_id, tipo, preferencia FROM preferencias_usuario WHERE usuario_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $preferences = [];
        $cuisine_types = [];
        $dietary_restrictions = [];
        
        while ($row = $result->fetch_assoc()) {
            $preferences[] = $row;
            
            // Separar por tipo para facilitar la UI
            if ($row['tipo'] === 'cuisine_type') {
                $cuisine_types[] = $row['preferencia'];
            } else if ($row['tipo'] === 'dietary_restriction') {
                $dietary_restrictions[] = $row['preferencia'];
            }
        }
        
        // Devolver respuesta exitosa
        echo json_encode([
            'success' => true, 
            'data' => $preferences,
            'cuisine_types' => $cuisine_types,
            'dietary_restrictions' => $dietary_restrictions
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al obtener preferencias: ' . $e->getMessage()]);
    }
    
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Actualizar preferencias del usuario
    try {
        // Iniciar transacción
        $conn->begin_transaction();
        
        // Eliminar preferencias existentes
        $stmt = $conn->prepare("DELETE FROM preferencias_usuario WHERE usuario_id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        
        // Procesar tipos de cocina seleccionados
        if (isset($_POST['cuisine_type']) && is_array($_POST['cuisine_type'])) {
            $stmt = $conn->prepare("INSERT INTO preferencias_usuario (usuario_id, tipo, preferencia) VALUES (?, 'cuisine_type', ?)");
            
            foreach ($_POST['cuisine_type'] as $cuisine) {
                $stmt->bind_param("is", $userId, $cuisine);
                $stmt->execute();
            }
        }
        
        // Procesar restricciones dietéticas seleccionadas
        if (isset($_POST['dietary_restrictions']) && is_array($_POST['dietary_restrictions'])) {
            $stmt = $conn->prepare("INSERT INTO preferencias_usuario (usuario_id, tipo, preferencia) VALUES (?, 'dietary_restriction', ?)");
            
            foreach ($_POST['dietary_restrictions'] as $restriction) {
                $stmt->bind_param("is", $userId, $restriction);
                $stmt->execute();
            }
        }
        
        // Procesar preferencias personalizadas
        if (isset($_POST['preferences']) && is_array($_POST['preferences'])) {
            $stmt = $conn->prepare("INSERT INTO preferencias_usuario (usuario_id, tipo, preferencia) VALUES (?, 'custom', ?)");
            
            foreach ($_POST['preferences'] as $preference) {
                if (!empty(trim($preference))) {
                    $stmt->bind_param("is", $userId, $preference);
                    $stmt->execute();
                }
            }
        }
        
        // Confirmar transacción
        $conn->commit();
        
        // Devolver respuesta exitosa
        echo json_encode(['success' => true, 'message' => 'Preferencias actualizadas correctamente']);
        
    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $conn->rollback();
        
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error al actualizar preferencias: ' . $e->getMessage()]);
    }
    
} else {
    // Método no permitido
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

// Cerrar conexión
$conn->close();