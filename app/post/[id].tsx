import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, Alert, Modal, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORY_LABELS, Reactions, Category } from '@/types';
import ShareWidget from '@/components/ShareWidget';
import * as Haptics from 'expo-haptics';

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
  return date.toLocaleDateString('pt-PT', { 
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCommentDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' });
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getPostById, getCommentsByPost, toggleReaction, addComment, updatePost, deletePost } = usePosts();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const insets = useSafeAreaInsets();
  
  const post = getPostById(id || '');
  const comments = getCommentsByPost(id || '');
  const isOwner = user && post && user.id === post.userId;

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Publicação não encontrada</Text>
      </View>
    );
  }

  const handleReaction = (type: keyof Reactions) => {
    if (user) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      toggleReaction(post.id, user.id, type);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !user) return;
    
    await addComment({
      postId: post.id,
      userId: user.id,
      userName: user.name,
      text: commentText.trim(),
    });
    
    setCommentText('');
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
          onPress: async () => {
            await deletePost(post.id);
            router.back();
          }
        },
      ]
    );
  };

  const handleEditOpen = () => {
    setShowMenu(false);
    setEditTitle(post.title);
    setEditDescription(post.description);
    setEditVideoUrl(post.videoUrl || '');
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      Alert.alert('Erro', 'Por favor, preencha título e descrição');
      return;
    }
    
    await updatePost(post.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      videoUrl: editVideoUrl.trim() || undefined,
    });
    
    setShowEditModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
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

  const hasReactedThumbsUp = user && post.reactions.thumbsUp.includes(user.id);
  const hasReactedHeart = user && post.reactions.heart.includes(user.id);
  const hasReactedAlert = user && post.reactions.alert.includes(user.id);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: CATEGORY_LABELS[post.category as Category],
          headerRight: () => isOwner ? (
            <Pressable onPress={() => setShowMenu(true)} style={{ padding: 8 }}>
              <MoreVertical size={22} color={Colors.textInverse} />
            </Pressable>
          ) : null,
        }} 
      />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: post.imageUrl }} style={styles.image} contentFit="cover" />
          
          {post.videoUrl && (
            <Pressable style={styles.videoButton} onPress={handleVideoPress}>
              <Ionicons name="videocam" size={20} color={Colors.textInverse} />
              <Text style={styles.videoButtonText}>Ver Vídeo</Text>
            </Pressable>
          )}
          
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.userName.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.userName}>{post.userName}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="time" size={12} color={Colors.textLight} />
                    <Text style={styles.metaText}>{formatDate(post.createdAt)}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(post.category) }]}>
                <Text style={styles.categoryText}>{CATEGORY_LABELS[post.category as Category]}</Text>
              </View>
            </View>

            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.description}>{post.description}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={Colors.textSecondary} />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>

            <View style={styles.shareSection}>
              <ShareWidget title={post.title} description={post.description} />
            </View>

            <View style={styles.reactionsBar}>
              <Pressable 
                style={[styles.reactionButton, hasReactedThumbsUp && styles.reactionButtonActive]}
                onPress={() => handleReaction('thumbsUp')}
              >
                <Ionicons 
                  name={hasReactedThumbsUp ? 'thumbs-up' : 'thumbs-up-outline'} 
                  size={22} 
                  color={hasReactedThumbsUp ? Colors.reactionThumbsUp : Colors.textSecondary}
                />
                <Text style={[styles.reactionCount, hasReactedThumbsUp && { color: Colors.reactionThumbsUp }]}>
                  {post.reactions.thumbsUp.length}
                </Text>
              </Pressable>

              <Pressable 
                style={[styles.reactionButton, hasReactedHeart && styles.reactionButtonActive]}
                onPress={() => handleReaction('heart')}
              >
                <Ionicons 
                  name={hasReactedHeart ? 'heart' : 'heart-outline'} 
                  size={22} 
                  color={hasReactedHeart ? Colors.reactionHeart : Colors.textSecondary}
                />
                <Text style={[styles.reactionCount, hasReactedHeart && { color: Colors.reactionHeart }]}>
                  {post.reactions.heart.length}
                </Text>
              </Pressable>

              <Pressable 
                style={[styles.reactionButton, hasReactedAlert && styles.reactionButtonActive]}
                onPress={() => handleReaction('alert')}
              >
                <Ionicons 
                  name="warning" 
                  size={22} 
                  color={hasReactedAlert ? Colors.reactionAlert : Colors.textSecondary}
                />
                <Text style={[styles.reactionCount, hasReactedAlert && { color: Colors.reactionAlert }]}>
                  {post.reactions.alert.length}
                </Text>
              </Pressable>
            </View>

            <View style={styles.commentsSection}>
              <View style={styles.commentsSectionHeader}>
                <Ionicons name="chatbubble" size={20} color={Colors.text} />
                <Text style={styles.commentsSectionTitle}>
                  Comentários ({comments.length})
                </Text>
              </View>

              {comments.length === 0 ? (
                <View style={styles.noComments}>
                  <Text style={styles.noCommentsText}>Seja o primeiro a comentar!</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>
                        {comment.userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentUserName}>{comment.userName}</Text>
                        <Text style={styles.commentTime}>{formatCommentDate(comment.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.commentInputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.commentInput}
            placeholder="Escreva um comentário..."
            placeholderTextColor={Colors.textLight}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable 
            style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendComment}
            disabled={!commentText.trim()}
          >
            <Ionicons name="send" size={20} color={commentText.trim() ? Colors.textInverse : Colors.textLight} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <Pressable style={styles.menuItem} onPress={handleEditOpen}>
              <Ionicons name="create" size={20} color={Colors.primary} />
              <Text style={styles.menuItemText}>Editar</Text>
            </Pressable>
            <Pressable style={[styles.menuItem, styles.menuItemDanger]} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color={Colors.accent} />
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Eliminar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.editModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Editar Publicação</Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <ScrollView style={styles.editModalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.editLabel}>Título</Text>
              <TextInput
                style={styles.editInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Título"
                placeholderTextColor={Colors.textLight}
              />
              
              <Text style={styles.editLabel}>Descrição</Text>
              <TextInput
                style={[styles.editInput, styles.editTextArea]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Descrição"
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
              />
              
              <Text style={styles.editLabel}>Vídeo (opcional)</Text>
              <TextInput
                style={styles.editInput}
                value={editVideoUrl}
                onChangeText={setEditVideoUrl}
                placeholder="Link do YouTube ou redes sociais"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
                keyboardType="url"
              />
            </ScrollView>
            
            <Pressable style={styles.editSaveButton} onPress={handleEditSave}>
              <Text style={styles.editSaveButtonText}>Guardar Alterações</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.surfaceAlt,
  },
  videoButton: {
    position: 'absolute',
    top: 240,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  videoButtonText: {
    fontSize: 14,
    color: Colors.textInverse,
    fontWeight: '600' as const,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  userName: {
    fontSize: 15,
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
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  shareSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reactionsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.surfaceAlt,
  },
  reactionButtonActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reactionCount: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  commentsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  commentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  commentsSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  noComments: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    color: Colors.textInverse,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  commentContent: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  commentTime: {
    fontSize: 11,
    color: Colors.textLight,
  },
  commentText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceAlt,
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  editModalScroll: {
    maxHeight: 400,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editTextArea: {
    minHeight: 120,
  },
  editSaveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  editSaveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
