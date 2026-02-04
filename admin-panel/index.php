<?php
session_start();
require_once 'config.php';

// Check if logged in
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    header('Location: login.php');
    exit;
}

$db = getDBConnection();
?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alerta Madeira - Back Office</title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Alerta Madeira - Back Office</h1>
            <div class="user-info">
                <span>Olá, <?php echo htmlspecialchars($_SESSION['name']); ?></span>
                <a href="logout.php" class="btn-logout">Sair</a>
            </div>
        </header>

        <nav class="tabs">
            <button class="tab active" onclick="showTab('users')">Utilizadores</button>
            <button class="tab" onclick="showTab('posts')">Posts</button>
            <button class="tab" onclick="showTab('ads')">Anúncios</button>
            <button class="tab" onclick="showTab('notifications')">Notificações</button>
        </nav>

        <main>
            <!-- Users Tab -->
            <div id="users-tab" class="tab-content active">
                <h2>Utilizadores</h2>
                <div id="users-list"></div>
            </div>

            <!-- Posts Tab -->
            <div id="posts-tab" class="tab-content">
                <h2>Posts</h2>
                <div id="posts-list"></div>
            </div>

            <!-- Ads Tab -->
            <div id="ads-tab" class="tab-content">
                <h2>Anúncios</h2>
                <button class="btn-add" onclick="showAdModal()">+ Adicionar Anúncio</button>
                <div id="ads-list"></div>
            </div>

            <!-- Notifications Tab -->
            <div id="notifications-tab" class="tab-content">
                <h2>Notificações Push</h2>
                <button class="btn-add" onclick="showNotificationModal()">+ Enviar Notificação</button>
                <div id="notifications-list"></div>
            </div>
        </main>
    </div>

    <!-- Ad Modal -->
    <div id="ad-modal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeAdModal()">&times;</span>
            <h3>Adicionar Anúncio</h3>
            <form id="ad-form">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>URL da Imagem</label>
                    <input type="url" name="imageUrl" required>
                </div>
                <div class="form-group">
                    <label>Link de Destino</label>
                    <input type="url" name="linkUrl" required>
                </div>
                <button type="submit" class="btn-submit">Adicionar</button>
            </form>
        </div>
    </div>

    <!-- Notification Modal -->
    <div id="notification-modal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeNotificationModal()">&times;</span>
            <h3>Enviar Notificação Push</h3>
            <form id="notification-form">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" name="title" required>
                </div>
                <div class="form-group">
                    <label>Mensagem</label>
                    <textarea name="body" rows="5" required></textarea>
                </div>
                <button type="submit" class="btn-submit">Enviar</button>
            </form>
        </div>
    </div>

    <script>
        // Get API token from proxy
        let API_TOKEN = '';
        fetch('api-proxy.php')
            .then(r => r.json())
            .then(data => {
                API_TOKEN = data.token;
                window.API_TOKEN = API_TOKEN;
                // Load initial data
                if (typeof loadUsers === 'function') {
                    loadUsers();
                }
            });
    </script>
    <script src="assets/js/app.js"></script>
    <script>
        // Initialize with token
        if (typeof API_TOKEN !== 'undefined' && API_TOKEN) {
            window.API_TOKEN = API_TOKEN;
        }
    </script>
</body>
</html>

