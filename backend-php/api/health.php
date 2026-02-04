<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../utils/response.php';

try {
    $db = getDBConnection();
    sendSuccess(['status' => 'ok', 'message' => 'Alerta Madeira API is running']);
} catch (Exception $e) {
    sendError('Database connection failed', 500);
}
?>

