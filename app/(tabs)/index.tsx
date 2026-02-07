import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import AdBanner from '@/components/AdBanner';
import WeatherWidget from '@/components/WeatherWidget';
import FuelPricesWidget from '@/components/FuelPricesWidget';
import { Reactions, Post } from '@/types';

type FeedItem = { type: 'post'; data: Post } | { type: 'ad'; id: string } | { type: 'widgets' };

export default function OcorrenciasScreen() {
  const router = useRouter();
  const { getPostsByCategory, toggleReaction, deletePost } = usePosts();
  const { user } = useAuth();
  const posts = getPostsByCategory('ocorrencias');

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    items.push({ type: 'widgets' });
    posts.forEach((post, index) => {
      items.push({ type: 'post', data: post });
      if ((index + 1) % 3 === 0 && index < posts.length - 1) {
        items.push({ type: 'ad', id: `ad-${index}` });
      }
    });
    return items;
  }, [posts]);

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

  const handleCreatePost = () => {
    router.push('/post/create?category=ocorrencias');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={feedItems}
        keyExtractor={(item, index) => {
          if (item.type === 'post') return item.data.id;
          if (item.type === 'ad') return item.id;
          if (item.type === 'widgets') return 'widgets-row';
          return `item-${index}`;
        }}
        renderItem={({ item }) => {
          if (item.type === 'widgets') {
            return (
              <View style={styles.widgetsRow}>
                <WeatherWidget compact />
                <FuelPricesWidget compact />
              </View>
            );
          }
          if (item.type === 'ad') {
            return <AdBanner key={item.id} />;
          }
          return (
            <PostCard 
              post={item.data} 
              userId={user?.id} 
              onReaction={handleReaction}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isOwner={user?.id === item.data.userId}
            />
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={posts.length > 0 ? <AdBanner variant="inline" /> : null}
        ListEmptyComponent={
          <EmptyState 
            iconName="warning"
            title="Sem ocorrências"
            description="Ainda não há ocorrências reportadas. Seja o primeiro a alertar a comunidade!"
          />
        }
      />
      <Pressable style={styles.fab} onPress={handleCreatePost}>
        <Ionicons name="add" size={28} color={Colors.textInverse} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  widgetsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
    marginVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
