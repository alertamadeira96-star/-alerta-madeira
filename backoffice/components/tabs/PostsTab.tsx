import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface Post {
  id: string;
  title: string;
  userName: string;
  category: string;
  createdAt: string;
}

export default function PostsTab() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`${API_URL}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar "${postTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao eliminar post');
    }
  };

  if (loading) {
    return <div className="loading">A carregar posts...</div>;
  }

  return (
    <div className="tab-panel">
      <h2>Posts ({posts.length})</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Categoria</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.userName}</td>
                <td>{post.category}</td>
                <td>{new Date(post.createdAt).toLocaleDateString('pt-PT')}</td>
                <td>
                  <button
                    onClick={() => handleDelete(post.id, post.title)}
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
    </div>
  );
}

