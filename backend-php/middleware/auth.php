<?php
require_once '../utils/jwt.php';
require_once '../utils/response.php';

function authenticateRequest() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        sendError('Access token required', 401);
    }
    
    $token = $matches[1];
    $payload = verifyJWT($token);
    
    if (!$payload) {
        sendError('Invalid or expired token', 403);
    }
    
    return $payload;
}
?>

