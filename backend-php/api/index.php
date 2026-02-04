<?php
// API Router
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);
$path = trim($path, '/');

// Route to appropriate file
$routes = [
    'auth' => 'auth.php',
    'users' => 'users.php',
    'posts' => 'posts.php',
    'comments' => 'comments.php',
    'ads' => 'ads.php',
    'notifications' => 'notifications.php',
    'push-tokens' => 'push-tokens.php',
    'health' => 'health.php'
];

$pathParts = explode('/', $path);
$route = $pathParts[0] ?? '';

if ($route === 'health') {
    require_once 'health.php';
} elseif (isset($routes[$route])) {
    require_once $routes[$route];
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found']);
}
?>

