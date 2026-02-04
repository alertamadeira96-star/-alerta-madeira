import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import UsersTab from '@/components/tabs/UsersTab';
import PostsTab from '@/components/tabs/PostsTab';
import AdsTab from '@/components/tabs/AdsTab';
import NotificationsTab from '@/components/tabs/NotificationsTab';

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'ads' | 'notifications'>('users');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    } else if (user && user.role !== 'admin') {
      router.push('/');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Carregando...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Layout>
      <div className="tabs">
        <button
          className={activeTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('users')}
        >
          Utilizadores
        </button>
        <button
          className={activeTab === 'posts' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button
          className={activeTab === 'ads' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('ads')}
        >
          Anúncios
        </button>
        <button
          className={activeTab === 'notifications' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('notifications')}
        >
          Notificações
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'posts' && <PostsTab />}
        {activeTab === 'ads' && <AdsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </Layout>
  );
}

