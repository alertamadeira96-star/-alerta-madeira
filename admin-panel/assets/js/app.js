// API configuration - Update this URL
const API_URL = 'https://www.alertmadeira.com/api';

// Get token from session (will be set by PHP)
let API_TOKEN = '';

let currentTab = 'users';

function showTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
    
    loadTabData(tab);
}

function loadTabData(tab) {
    switch(tab) {
        case 'users':
            loadUsers();
            break;
        case 'posts':
            loadPosts();
            break;
        case 'ads':
            loadAds();
            break;
        case 'notifications':
            loadNotifications();
            break;
    }
}

async function loadUsers() {
    const list = document.getElementById('users-list');
    list.innerHTML = '<div class="loading">A carregar...</div>';
    
    const token = window.API_TOKEN || API_TOKEN;
    
    try {
        const response = await fetch(API_URL + '/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        
        if (result.success) {
            const users = result.data;
            if (users.length === 0) {
                list.innerHTML = '<p>Nenhum utilizador encontrado</p>';
                return;
            }
            
            let html = '<table><thead><tr><th>Nome</th><th>Email</th><th>Tipo</th><th>Data</th><th>Ações</th></tr></thead><tbody>';
            users.forEach(user => {
                html += `<tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.role === 'admin' ? 'Administrador' : 'Utilizador'}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td>${user.role !== 'admin' ? `<button class="btn-delete" onclick="deleteUser('${user.id}', '${user.name}')">Eliminar</button>` : ''}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            list.innerHTML = html;
        }
    } catch (error) {
        list.innerHTML = '<p class="error">Erro ao carregar utilizadores</p>';
    }
}

async function loadPosts() {
    const list = document.getElementById('posts-list');
    list.innerHTML = '<div class="loading">A carregar...</div>';
    
    try {
        const response = await fetch(API_URL + '/posts');
        const result = await response.json();
        
        if (result.success) {
            const posts = result.data;
            if (posts.length === 0) {
                list.innerHTML = '<p>Nenhum post encontrado</p>';
                return;
            }
            
            let html = '<table><thead><tr><th>Título</th><th>Autor</th><th>Categoria</th><th>Data</th><th>Ações</th></tr></thead><tbody>';
            posts.forEach(post => {
                html += `<tr>
                    <td>${post.title}</td>
                    <td>${post.user_name}</td>
                    <td>${post.category}</td>
                    <td>${new Date(post.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td><button class="btn-delete" onclick="deletePost('${post.id}', '${post.title}')">Eliminar</button></td>
                </tr>`;
            });
            html += '</tbody></table>';
            list.innerHTML = html;
        }
    } catch (error) {
        list.innerHTML = '<p class="error">Erro ao carregar posts</p>';
    }
}

async function loadAds() {
    const list = document.getElementById('ads-list');
    list.innerHTML = '<div class="loading">A carregar...</div>';
    
    try {
        const response = await fetch(API_URL + '/ads');
        const result = await response.json();
        
        if (result.success) {
            const ads = result.data;
            if (ads.length === 0) {
                list.innerHTML = '<p>Nenhum anúncio encontrado</p>';
                return;
            }
            
            let html = '<table><thead><tr><th>Título</th><th>Link</th><th>Estado</th><th>Data</th><th>Ações</th></tr></thead><tbody>';
            ads.forEach(ad => {
                html += `<tr>
                    <td>${ad.title}</td>
                    <td><a href="${ad.linkUrl}" target="_blank">${ad.linkUrl}</a></td>
                    <td>${ad.active ? 'Ativo' : 'Inativo'}</td>
                    <td>${new Date(ad.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td><button class="btn-delete" onclick="deleteAd('${ad.id}', '${ad.title}')">Eliminar</button></td>
                </tr>`;
            });
            html += '</tbody></table>';
            list.innerHTML = html;
        }
    } catch (error) {
        list.innerHTML = '<p class="error">Erro ao carregar anúncios</p>';
    }
}

async function loadNotifications() {
    const list = document.getElementById('notifications-list');
    list.innerHTML = '<div class="loading">A carregar...</div>';
    
    try {
        const token = window.API_TOKEN || API_TOKEN;
        const response = await fetch(API_URL + '/notifications', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        
        if (result.success) {
            const notifications = result.data;
            if (notifications.length === 0) {
                list.innerHTML = '<p>Nenhuma notificação enviada</p>';
                return;
            }
            
            let html = '';
            notifications.forEach(notif => {
                html += `<div class="notification-card">
                    <h3>${notif.title}</h3>
                    <p>${notif.body}</p>
                    <div class="notification-meta">${new Date(notif.sentAt).toLocaleDateString('pt-PT')} • Por ${notif.sent_by}</div>
                </div>`;
            });
            list.innerHTML = html;
        }
    } catch (error) {
        list.innerHTML = '<p class="error">Erro ao carregar notificações</p>';
    }
}

async function deleteUser(userId, userName) {
    if (!confirm(`Tem a certeza que deseja eliminar ${userName}?`)) return;
    
    const token = window.API_TOKEN || API_TOKEN;
    try {
        const response = await fetch(API_URL + '/users?id=' + userId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Utilizador eliminado com sucesso');
            loadUsers();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        alert('Erro ao eliminar utilizador');
    }
}

async function deletePost(postId, postTitle) {
    if (!confirm(`Tem a certeza que deseja eliminar "${postTitle}"?`)) return;
    
    const token = window.API_TOKEN || API_TOKEN;
    try {
        const response = await fetch(API_URL + '/posts?id=' + postId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Post eliminado com sucesso');
            loadPosts();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        alert('Erro ao eliminar post');
    }
}

async function deleteAd(adId, adTitle) {
    if (!confirm(`Tem a certeza que deseja eliminar "${adTitle}"?`)) return;
    
    const token = window.API_TOKEN || API_TOKEN;
    try {
        const response = await fetch(API_URL + '/ads?id=' + adId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Anúncio eliminado com sucesso');
            loadAds();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        alert('Erro ao eliminar anúncio');
    }
}

function showAdModal() {
    document.getElementById('ad-modal').style.display = 'block';
}

function closeAdModal() {
    document.getElementById('ad-modal').style.display = 'none';
    document.getElementById('ad-form').reset();
}

function showNotificationModal() {
    document.getElementById('notification-modal').style.display = 'block';
}

function closeNotificationModal() {
    document.getElementById('notification-modal').style.display = 'none';
    document.getElementById('notification-form').reset();
}

document.getElementById('ad-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = window.API_TOKEN || API_TOKEN;
    
    try {
        const response = await fetch(API_URL + '/ads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                title: formData.get('title'),
                imageUrl: formData.get('imageUrl'),
                linkUrl: formData.get('linkUrl'),
                active: true
            })
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Anúncio adicionado com sucesso');
            closeAdModal();
            loadAds();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        alert('Erro ao adicionar anúncio');
    }
});

document.getElementById('notification-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const token = window.API_TOKEN || API_TOKEN;
    
    try {
        const response = await fetch(API_URL + '/notifications?action=send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                title: formData.get('title'),
                body: formData.get('body')
            })
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Notificação enviada com sucesso!');
            closeNotificationModal();
            loadNotifications();
        } else {
            alert('Erro: ' + result.error);
        }
    } catch (error) {
        alert('Erro ao enviar notificação');
    }
});

// Load initial data when token is ready
if (window.API_TOKEN) {
    loadUsers();
}

