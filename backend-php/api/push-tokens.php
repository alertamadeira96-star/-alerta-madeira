<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';
require_once '../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
$user = authenticateRequest();

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['token'])) {
        sendError('Push token is required', 400);
    }
    
    $token = $data['token'];
    $platform = $data['platform'] ?? null;
    
    // Check if token exists
    $stmt = $db->prepare("SELECT id FROM push_tokens WHERE token = ?");
    $stmt->execute([$token]);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update existing token
        $stmt = $db->prepare("UPDATE push_tokens SET user_id = ?, platform = ? WHERE token = ?");
        $stmt->execute([$user['id'], $platform, $token]);
        sendSuccess(['message' => 'Push token updated']);
    } else {
        // Create new token
        $tokenId = uniqid('token_', true);
        $stmt = $db->prepare("INSERT INTO push_tokens (id, user_id, token, platform) VALUES (?, ?, ?, ?)");
        $stmt->execute([$tokenId, $user['id'], $token, $platform]);
        sendSuccess(['message' => 'Push token registered']);
    }
} else {
    sendError('Method not allowed', 405);
}
?>

