import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, FileText, Heart, MessageCircle, Calendar, Shield } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import { Reactions, Post } from '@/types';

export default function PerfilScreen() {
  const router = useRouter();
  const { user, logout, logoutPending } = useAuth();
  const { getPostsByUser, getUserStats, toggleReaction, deletePost } = usePosts();
  
  const userPosts = user ? getPostsByUser(user.id) : [];
  const stats = user ? getUserStats(user.id) : { postsCount: 0, totalReactions: 0, totalComments: 0 };

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleReaction = (postId: string, reactionType: keyof Reactions) => {
    if (user) {
      toggleReaction(postId, user.id, reactionType);
    }
  };

  const handleDelete = async (postId: string) => {
    await deletePost(postId);
  };

  const handleEdit = (post: Post) => {
    router.push(`/post/${post.id}` as never);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{user.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.joinedRow}>
                <Calendar size={14} color={Colors.textLight} />
                <Text style={styles.joinedText}>Membro desde {formatDate(user.createdAt)}</Text>
              </View>
              {user.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Shield size={14} color={Colors.textInverse} />
                  <Text style={styles.adminBadgeText}>Administrador</Text>
                </View>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FileText size={24} color={Colors.primary} />
                <Text style={styles.statNumber}>{stats.postsCount}</Text>
                <Text style={styles.statLabel}>Publicações</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Heart size={24} color={Colors.reactionHeart} />
                <Text style={styles.statNumber}>{stats.totalReactions}</Text>
                <Text style={styles.statLabel}>Reações</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MessageCircle size={24} color={Colors.primary} />
                <Text style={styles.statNumber}>{stats.totalComments}</Text>
                <Text style={styles.statLabel}>Comentários</Text>
              </View>
            </View>

            {user.role === 'admin' && (
              <Pressable 
                style={styles.adminButton} 
                onPress={() => router.push('/admin' as never)}
              >
                <Shield size={20} color={Colors.textInverse} />
                <Text style={styles.adminButtonText}>Painel de Administração</Text>
              </Pressable>
            )}

            <Pressable 
              style={styles.logoutButton} 
              onPress={handleLogout}
              disabled={logoutPending}
            >
              <LogOut size={20} color={Colors.accent} />
              <Text style={styles.logoutText}>
                {logoutPending ? 'A sair...' : 'Terminar Sessão'}
              </Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>As Minhas Publicações</Text>
            </View>
          </>
        }
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            userId={user.id} 
            onReaction={handleReaction}
            onDelete={handleDelete}
            onEdit={handleEdit}
            isOwner={true}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState 
            icon={FileText}
            title="Sem publicações"
            description="Ainda não fez nenhuma publicação. Comece a alertar a comunidade!"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    marginBottom: 12,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinedText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.adminPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.adminPrimary,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  adminButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
