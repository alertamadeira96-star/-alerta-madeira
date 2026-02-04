<?php
// Firebase Cloud Messaging Service
// Replace with your FCM server key
define('FCM_SERVER_KEY', 'your-fcm-server-key-here');
define('FCM_URL', 'https://fcm.googleapis.com/fcm/send');

function sendFCMNotification($title, $body) {
    require_once '../config/database.php';
    $db = getDBConnection();
    
    // Get all push tokens
    $stmt = $db->query("SELECT token FROM push_tokens WHERE token IS NOT NULL");
    $tokens = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tokens)) {
        return ['success' => false, 'message' => 'No push tokens registered'];
    }
    
    $successCount = 0;
    $failureCount = 0;
    
    // Send to each token (FCM allows up to 1000 tokens per request, but we'll send individually for simplicity)
    foreach ($tokens as $token) {
        $result = sendFCMToToken($token, $title, $body);
        if ($result['success']) {
            $successCount++;
        } else {
            $failureCount++;
            // Remove invalid tokens
            if (isset($result['remove_token']) && $result['remove_token']) {
                $stmt = $db->prepare("DELETE FROM push_tokens WHERE token = ?");
                $stmt->execute([$token]);
            }
        }
    }
    
    return [
        'success' => true,
        'sent' => $successCount,
        'failed' => $failureCount,
        'total' => count($tokens)
    ];
}

function sendFCMToToken($token, $title, $body) {
    $data = [
        'to' => $token,
        'notification' => [
            'title' => $title,
            'body' => $body,
            'sound' => 'default'
        ],
        'data' => [
            'title' => $title,
            'body' => $body
        ]
    ];
    
    $headers = [
        'Authorization: key=' . FCM_SERVER_KEY,
        'Content-Type: application/json'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, FCM_URL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if (isset($result['success']) && $result['success'] == 1) {
            return ['success' => true];
        }
    }
    
    // Check if token is invalid
    $result = json_decode($response, true);
    if (isset($result['results'][0]['error']) && 
        in_array($result['results'][0]['error'], ['InvalidRegistration', 'NotRegistered'])) {
        return ['success' => false, 'remove_token' => true];
    }
    
    return ['success' => false];
}
?>

