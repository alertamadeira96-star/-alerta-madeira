import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, Alert, Modal, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThumbsUp, Heart, AlertTriangle, MessageCircle, MapPin, Clock, MoreVertical, Edit2, Trash2, Video } from 'lucide-react-native';
import { Post, CATEGORY_LABELS, Reactions } from '@/types';
import Colors from '@/constants/colors';
import ShareWidget from './ShareWidget';
import * as Haptics from 'expo-haptics';

interface PostCardProps {
  post: Post;
  userId?: string;
  onReaction: (postId: string, reactionType: keyof Reactions) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  isOwner?: boolean;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'ocorrencias': Colors.categoryOcorrencias,
    'op-stop': Colors.categoryOpStop,
    'anomalias': Colors.categoryAnomalias,
    'perdidos': Colors.categoryPerdidos,
    'acidentes': Colors.categoryAcidentes,
    'alertas': Colors.categoryAlertas,
  };
  return colors[category] || Colors.primary;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};

export default function PostCard({ post, userId, onReaction, onDelete, onEdit, isOwner }: PostCardProps) {
  const router = useRouter();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [showMenu, setShowMenu] = useState(false);

  const handlePress = () => {
    router.push(`/post/${post.id}` as never);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleReaction = (type: keyof Reactions) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onReaction(post.id, type);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      'Eliminar Publicação',
      'Tem a certeza que deseja eliminar esta publicação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => onDelete?.(post.id)
        },
      ]
    );
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(post);
  };

  const handleVideoPress = async () => {
    if (post.videoUrl) {
      try {
        await Linking.openURL(post.videoUrl);
      } catch {
        Alert.alert('Erro', 'Não foi possível abrir o vídeo');
      }
    }
  };

  const hasReactedThumbsUp = userId && post.reactions.thumbsUp.includes(userId);
  const hasReactedHeart = userId && post.reactions.heart.includes(userId);
  const hasReactedAlert = userId && post.reactions.alert.includes(userId);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable 
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{post.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{post.userName}</Text>
              <View style={styles.metaRow}>
                <Clock size={12} color={Colors.textLight} />
                <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(post.category) }]}>
              <Text style={styles.categoryText}>{CATEGORY_LABELS[post.category]}</Text>
            </View>
            {isOwner && (
              <Pressable style={styles.menuButton} onPress={() => setShowMenu(true)}>
                <MoreVertical size={20} color={Colors.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <Image 
          source={{ uri: post.imageUrl }} 
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {post.videoUrl && (
          <Pressable style={styles.videoIndicator} onPress={handleVideoPress}>
            <Video size={16} color={Colors.textInverse} />
            <Text style={styles.videoText}>Ver Vídeo</Text>
          </Pressable>
        )}

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
          <Text style={styles.description} numberOfLines={3}>{post.description}</Text>
          
          <View style={styles.locationRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>{post.location}</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionsContainer}>
        <View style={styles.reactions}>
          <Pressable 
            style={[styles.reactionButton, hasReactedThumbsUp && styles.reactionButtonActive]}
            onPress={() => handleReaction('thumbsUp')}
          >
            <ThumbsUp 
              size={20} 
              color={hasReactedThumbsUp ? Colors.reactionThumbsUp : Colors.textSecondary}
              fill={hasReactedThumbsUp ? Colors.reactionThumbsUp : 'transparent'}
            />
            <Text style={[styles.reactionCount, hasReactedThumbsUp && { color: Colors.reactionThumbsUp }]}>
              {post.reactions.thumbsUp.length}
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.reactionButton, hasReactedHeart && styles.reactionButtonActive]}
            onPress={() => handleReaction('heart')}
          >
            <Heart 
              size={20} 
              color={hasReactedHeart ? Colors.reactionHeart : Colors.textSecondary}
              fill={hasReactedHeart ? Colors.reactionHeart : 'transparent'}
            />
            <Text style={[styles.reactionCount, hasReactedHeart && { color: Colors.reactionHeart }]}>
              {post.reactions.heart.length}
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.reactionButton, hasReactedAlert && styles.reactionButtonActive]}
            onPress={() => handleReaction('alert')}
          >
            <AlertTriangle 
              size={20} 
              color={hasReactedAlert ? Colors.reactionAlert : Colors.textSecondary}
              fill={hasReactedAlert ? Colors.reactionAlert : 'transparent'}
            />
            <Text style={[styles.reactionCount, hasReactedAlert && { color: Colors.reactionAlert }]}>
              {post.reactions.alert.length}
            </Text>
          </Pressable>
        </View>

        <Pressable style={styles.commentsButton} onPress={handlePress}>
          <MessageCircle size={20} color={Colors.textSecondary} />
          <Text style={styles.commentsCount}>{post.commentsCount}</Text>
        </Pressable>
      </View>

      <View style={styles.shareContainer}>
        <ShareWidget title={post.title} description={post.description} />
      </View>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <Pressable style={styles.menuItem} onPress={handleEdit}>
              <Edit2 size={20} color={Colors.primary} />
              <Text style={styles.menuItemText}>Editar</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDelete}>
              <Trash2 size={20} color={Colors.accent} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Eliminar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  menuButton: {
    padding: 4,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surfaceAlt,
  },
  videoIndicator: {
    position: 'absolute',
    top: 70,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  videoText: {
    fontSize: 12,
    color: Colors.textInverse,
    fontWeight: '500' as const,
  },
  content: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  reactions: {
    flexDirection: 'row',
    gap: 16,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  reactionButtonActive: {
    backgroundColor: Colors.surfaceAlt,
  },
  reactionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  commentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commentsCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  shareContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  menuItemDanger: {
    marginTop: 4,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  menuItemTextDanger: {
    color: Colors.accent,
  },
});
