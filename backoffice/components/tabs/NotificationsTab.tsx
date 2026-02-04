import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Notification {
  id: string;
  title: string;
  body: string;
  sentAt: string;
  sentBy: string;
}

export default function NotificationsTab() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API_URL}/notifications/send`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setFormData({ title: '', body: '' });
      fetchNotifications();
      alert('Notificação enviada com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao enviar notificação');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="loading">A carregar notificações...</div>;
  }

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h2>Notificações ({notifications.length})</h2>
        <button onClick={() => setShowModal(true)} className="add-button">
          + Enviar Notificação
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-state">Nenhuma notificação enviada</div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="notification-card">
              <h3>{notif.title}</h3>
              <p>{notif.body}</p>
              <div className="notification-meta">
                {new Date(notif.sentAt).toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                • Por {notif.sentBy}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Enviar Notificação Push</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Título da notificação"
                />
              </div>
              <div className="form-group">
                <label>Mensagem</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  required
                  rows={5}
                  placeholder="Texto da notificação"
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="cancel-button"
                  disabled={sending}
                >
                  Cancelar
                </button>
                <button type="submit" className="submit-button" disabled={sending}>
                  {sending ? 'A enviar...' : 'Enviar Notificação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

