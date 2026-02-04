import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
  createdAt: string;
}

export default function AdsTab() {
  const { token } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    active: true,
  });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API_URL}/ads`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAds(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar anúncios');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adId: string, adTitle: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar "${adTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/ads/${adId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao eliminar anúncio');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/ads`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowModal(false);
      setFormData({ title: '', imageUrl: '', linkUrl: '', active: true });
      fetchAds();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao adicionar anúncio');
    }
  };

  if (loading) {
    return <div className="loading">A carregar anúncios...</div>;
  }

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h2>Anúncios ({ads.length})</h2>
        <button onClick={() => setShowModal(true)} className="add-button">
          + Adicionar Anúncio
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Link</th>
              <th>Estado</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {ads.map((ad) => (
              <tr key={ad.id}>
                <td>{ad.title}</td>
                <td>
                  <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer">
                    {ad.linkUrl}
                  </a>
                </td>
                <td>{ad.active ? 'Ativo' : 'Inativo'}</td>
                <td>{new Date(ad.createdAt).toLocaleDateString('pt-PT')}</td>
                <td>
                  <button
                    onClick={() => handleDelete(ad.id, ad.title)}
                    className="delete-button"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Adicionar Anúncio</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>URL da Imagem</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Link de Destino</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-button">
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

