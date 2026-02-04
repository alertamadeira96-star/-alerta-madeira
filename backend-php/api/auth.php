<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/jwt.php';
require_once '../utils/response.php';

$method = $_SERVER['REQUEST_METHOD'];
$db = getDBConnection();

if ($method === 'POST') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'register') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
            sendError('Email, password, and name are required', 400);
        }
        
        $email = strtolower(trim($data['email']));
        $password = $data['password'];
        $name = trim($data['name']);
        
        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            sendError('Email já registado', 400);
        }
        
        // Create user
        $userId = uniqid('user_', true);
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $now = date('Y-m-d H:i:s');
        
        $stmt = $db->prepare("INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, 'user', ?)");
        $stmt->execute([$userId, $email, $hashedPassword, $name, $now]);
        
        // Generate token
        $token = generateJWT(['id' => $userId, 'email' => $email, 'name' => $name, 'role' => 'user']);
        
        sendSuccess([
            'user' => [
                'id' => $userId,
                'email' => $email,
                'name' => $name,
                'role' => 'user',
                'createdAt' => $now
            ],
            'token' => $token
        ]);
        
    } elseif ($action === 'login') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['password'])) {
            sendError('Email and password are required', 400);
        }
        
        $email = strtolower(trim($data['email']));
        
        // Find user
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            sendError('Credenciais inválidas', 401);
        }
        
        // Generate token
        $token = generateJWT([
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'role' => $user['role']
        ]);
        
        sendSuccess([
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'avatar' => $user['avatar'],
                'role' => $user['role'],
                'createdAt' => $user['created_at']
            ],
            'token' => $token
        ]);
    } else {
        sendError('Invalid action', 400);
    }
} else {
    sendError('Method not allowed', 405);
}
?>

