<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';
require_once '../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
$user = authenticateRequest();

if ($method === 'GET') {
    // Get all users (admin only)
    if ($user['role'] !== 'admin') {
        sendError('Admin access required', 403);
    }
    
    $stmt = $db->query("SELECT id, email, name, avatar, role, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll();
    
    // Format dates
    foreach ($users as &$u) {
        $u['createdAt'] = $u['created_at'];
        unset($u['created_at']);
    }
    
    sendSuccess($users);
    
} elseif ($method === 'DELETE') {
    // Delete user (admin only)
    if ($user['role'] !== 'admin') {
        sendError('Admin access required', 403);
    }
    
    $userId = $_GET['id'] ?? '';
    if (!$userId) {
        sendError('User ID required', 400);
    }
    
    // Don't allow deleting admin users
    $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $targetUser = $stmt->fetch();
    
    if (!$targetUser) {
        sendError('User not found', 404);
    }
    
    if ($targetUser['role'] === 'admin') {
        sendError('Cannot delete admin user', 403);
    }
    
    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    
    sendSuccess(['message' => 'User deleted successfully']);
} else {
    sendError('Method not allowed', 405);
}
?>

