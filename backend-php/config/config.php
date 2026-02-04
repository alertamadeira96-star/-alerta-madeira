<?php
// Application configuration
define('JWT_SECRET', 'AlertaMadeira2024!SecretKey@Secure#Random');
define('JWT_EXPIRATION', 2592000); // 30 days in seconds

// CORS configuration
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Timezone
date_default_timezone_set('Europe/Lisbon');

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
?>

