<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';
require_once '../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

if ($method === 'GET') {
    $activeOnly = isset($_GET['active']) && $_GET['active'] === 'true';
    
    if ($activeOnly) {
        $stmt = $db->query("SELECT * FROM advertisements WHERE active = 1 ORDER BY created_at DESC");
    } else {
        $stmt = $db->query("SELECT * FROM advertisements ORDER BY created_at DESC");
    }
    
    $ads = $stmt->fetchAll();
    
    foreach ($ads as &$ad) {
        $ad['active'] = (bool)$ad['active'];
        $ad['createdAt'] = $ad['created_at'];
        unset($ad['created_at']);
    }
    
    sendSuccess($ads);
    
} elseif ($method === 'POST') {
    $user = authenticateRequest();
    
    if ($user['role'] !== 'admin') {
        sendError('Admin access required', 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['imageUrl']) || !isset($data['linkUrl']) || !isset($data['title'])) {
        sendError('Image URL, link URL, and title are required', 400);
    }
    
    $adId = uniqid('ad_', true);
    $now = date('Y-m-d H:i:s');
    
    $stmt = $db->prepare("INSERT INTO advertisements (id, image_url, link_url, title, active, created_at) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $adId,
        $data['imageUrl'],
        $data['linkUrl'],
        $data['title'],
        isset($data['active']) ? (int)$data['active'] : 1,
        $now
    ]);
    
    $stmt = $db->prepare("SELECT * FROM advertisements WHERE id = ?");
    $stmt->execute([$adId]);
    $newAd = $stmt->fetch();
    $newAd['active'] = (bool)$newAd['active'];
    $newAd['createdAt'] = $newAd['created_at'];
    unset($newAd['created_at']);
    
    sendSuccess($newAd, 201);
    
} elseif ($method === 'DELETE') {
    $user = authenticateRequest();
    
    if ($user['role'] !== 'admin') {
        sendError('Admin access required', 403);
    }
    
    $adId = $_GET['id'] ?? '';
    if (!$adId) {
        sendError('Ad ID required', 400);
    }
    
    $stmt = $db->prepare("DELETE FROM advertisements WHERE id = ?");
    $stmt->execute([$adId]);
    
    sendSuccess(['message' => 'Advertisement deleted successfully']);
} else {
    sendError('Method not allowed', 405);
}
?>

