<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';
require_once '../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

if ($method === 'GET') {
    $postId = $_GET['postId'] ?? '';
    
    if (!$postId) {
        sendError('Post ID required', 400);
    }
    
    $stmt = $db->prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC");
    $stmt->execute([$postId]);
    $comments = $stmt->fetchAll();
    
    foreach ($comments as &$comment) {
        $comment['createdAt'] = $comment['created_at'];
        unset($comment['created_at']);
    }
    
    sendSuccess($comments);
    
} elseif ($method === 'POST') {
    $user = authenticateRequest();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['postId']) || !isset($data['text'])) {
        sendError('Post ID and text are required', 400);
    }
    
    // Get user info
    $stmt = $db->prepare("SELECT name, avatar FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userInfo = $stmt->fetch();
    
    // Check if post exists
    $stmt = $db->prepare("SELECT id FROM posts WHERE id = ?");
    $stmt->execute([$data['postId']]);
    if (!$stmt->fetch()) {
        sendError('Post not found', 404);
    }
    
    $commentId = uniqid('comment_', true);
    $now = date('Y-m-d H:i:s');
    
    $stmt = $db->prepare("INSERT INTO comments (id, post_id, user_id, user_name, user_avatar, text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $commentId,
        $data['postId'],
        $user['id'],
        $userInfo['name'],
        $userInfo['avatar'],
        $data['text'],
        $now
    ]);
    
    // Update post comments count
    $stmt = $db->prepare("UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?");
    $stmt->execute([$data['postId']]);
    
    $stmt = $db->prepare("SELECT * FROM comments WHERE id = ?");
    $stmt->execute([$commentId]);
    $newComment = $stmt->fetch();
    $newComment['createdAt'] = $newComment['created_at'];
    unset($newComment['created_at']);
    
    sendSuccess($newComment, 201);
} else {
    sendError('Method not allowed', 405);
}
?>

