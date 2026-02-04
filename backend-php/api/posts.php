<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';
require_once '../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

if ($method === 'GET') {
    $postId = $_GET['id'] ?? '';
    
    if ($postId) {
        // Get single post
        $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
        $stmt->execute([$postId]);
        $post = $stmt->fetch();
        
        if (!$post) {
            sendError('Post not found', 404);
        }
        
        // Get reactions
        $stmt = $db->prepare("SELECT user_id, reaction_type FROM reactions WHERE post_id = ?");
        $stmt->execute([$postId]);
        $reactions = $stmt->fetchAll();
        
        $formattedReactions = ['thumbsUp' => [], 'heart' => [], 'alert' => []];
        foreach ($reactions as $r) {
            $formattedReactions[$r['reaction_type']][] = $r['user_id'];
        }
        
        $post['reactions'] = $formattedReactions;
        $post['createdAt'] = $post['created_at'];
        unset($post['created_at']);
        
        sendSuccess($post);
    } else {
        // Get all posts
        $stmt = $db->query("SELECT * FROM posts ORDER BY created_at DESC");
        $posts = $stmt->fetchAll();
        
        // Get reactions for all posts
        $stmt = $db->query("SELECT post_id, user_id, reaction_type FROM reactions");
        $allReactions = $stmt->fetchAll();
        
        $reactionsByPost = [];
        foreach ($allReactions as $r) {
            if (!isset($reactionsByPost[$r['post_id']])) {
                $reactionsByPost[$r['post_id']] = ['thumbsUp' => [], 'heart' => [], 'alert' => []];
            }
            $reactionsByPost[$r['post_id']][$r['reaction_type']][] = $r['user_id'];
        }
        
        // Format posts
        foreach ($posts as &$post) {
            $post['reactions'] = $reactionsByPost[$post['id']] ?? ['thumbsUp' => [], 'heart' => [], 'alert' => []];
            $post['createdAt'] = $post['created_at'];
            unset($post['created_at']);
        }
        
        sendSuccess($posts);
    }
    
} elseif ($method === 'POST') {
    $user = authenticateRequest();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['title']) || !isset($data['description']) || !isset($data['category'])) {
        sendError('Title, description, and category are required', 400);
    }
    
    $postId = uniqid('post_', true);
    $now = date('Y-m-d H:i:s');
    
    // Get user info
    $stmt = $db->prepare("SELECT name, avatar FROM users WHERE id = ?");
    $stmt->execute([$user['id']]);
    $userInfo = $stmt->fetch();
    
    $stmt = $db->prepare("INSERT INTO posts (id, user_id, user_name, user_avatar, title, description, image_url, video_url, category, location, latitude, longitude, created_at, comments_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([
        $postId,
        $user['id'],
        $userInfo['name'],
        $userInfo['avatar'],
        $data['title'],
        $data['description'],
        $data['imageUrl'] ?? null,
        $data['videoUrl'] ?? null,
        $data['category'],
        $data['location'] ?? null,
        $data['latitude'] ?? null,
        $data['longitude'] ?? null,
        $now
    ]);
    
    $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $newPost = $stmt->fetch();
    $newPost['reactions'] = ['thumbsUp' => [], 'heart' => [], 'alert' => []];
    $newPost['createdAt'] = $newPost['created_at'];
    unset($newPost['created_at']);
    
    sendSuccess($newPost, 201);
    
} elseif ($method === 'DELETE') {
    $user = authenticateRequest();
    $postId = $_GET['id'] ?? '';
    
    if (!$postId) {
        sendError('Post ID required', 400);
    }
    
    // Check if post exists and user owns it or is admin
    $stmt = $db->prepare("SELECT user_id FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    $post = $stmt->fetch();
    
    if (!$post) {
        sendError('Post not found', 404);
    }
    
    if ($post['user_id'] !== $user['id'] && $user['role'] !== 'admin') {
        sendError('Not authorized', 403);
    }
    
    // Delete reactions and comments
    $stmt = $db->prepare("DELETE FROM reactions WHERE post_id = ?");
    $stmt->execute([$postId]);
    
    $stmt = $db->prepare("DELETE FROM comments WHERE post_id = ?");
    $stmt->execute([$postId]);
    
    $stmt = $db->prepare("DELETE FROM posts WHERE id = ?");
    $stmt->execute([$postId]);
    
    sendSuccess(['message' => 'Post deleted successfully']);
} else {
    sendError('Method not allowed', 405);
}
?>

