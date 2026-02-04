<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';
require_once '../middleware/auth.php';
require_once '../services/fcm.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();
$user = authenticateRequest();

if ($user['role'] !== 'admin') {
    sendError('Admin access required', 403);
}

if ($method === 'GET') {
    // Get all notifications
    $stmt = $db->query("SELECT * FROM push_notifications ORDER BY sent_at DESC");
    $notifications = $stmt->fetchAll();
    
    foreach ($notifications as &$notif) {
        $notif['sentAt'] = $notif['sent_at'];
        unset($notif['sent_at']);
    }
    
    sendSuccess($notifications);
    
} elseif ($method === 'POST') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'send') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['title']) || !isset($data['body'])) {
            sendError('Title and body are required', 400);
        }
        
        $notificationId = uniqid('notif_', true);
        $now = date('Y-m-d H:i:s');
        
        // Save to database
        $stmt = $db->prepare("INSERT INTO push_notifications (id, title, body, sent_at, sent_by) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$notificationId, $data['title'], $data['body'], $now, $user['name']]);
        
        // Send push notifications via FCM
        $result = sendFCMNotification($data['title'], $data['body']);
        
        sendSuccess([
            'id' => $notificationId,
            'title' => $data['title'],
            'body' => $data['body'],
            'sentAt' => $now,
            'sentBy' => $user['name'],
            'pushResult' => $result
        ]);
    } else {
        sendError('Invalid action', 400);
    }
} else {
    sendError('Method not allowed', 405);
}
?>

