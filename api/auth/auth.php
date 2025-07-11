<?php
function authenticateUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return false;
    }
    
    $token = $matches[1];
    
    try {
        $decoded = json_decode(base64_decode($token), true);
        
        if (!$decoded || !isset($decoded['user_id']) || !isset($decoded['exp'])) {
            return false;
        }
        
        if ($decoded['exp'] < time()) {
            return false; // Token expirado
        }
        
        return [
            'user_id' => $decoded['user_id'],
            'email' => $decoded['email'],
            'tipo_usuario' => $decoded['tipo_usuario']
        ];
        
    } catch (Exception $e) {
        return false;
    }
}

function requireAuth() {
    $user = authenticateUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    return $user;
}