import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, FlatList, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { usePosts } from '@/contexts/PostsContext';
import { User, Post, Advertisement } from '@/types';
import * as Haptics from 'expo-haptics';

export default function AdminTabScreen() {
  const { user } = useAuth();
  const { users, notifications, deleteUser, sendNotification, sendNotificationPending } = useAdmin();
  const { posts, ads, deletePost, addAd, deleteAd } = usePosts();
  
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'ads' | 'notifications'>('users');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adLinkUrl, setAdLinkUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');

  if (!user || user.role !== 'admin') {
    return (
      <View style={styles.unauthorized}>
        <Text style={styles.unauthorizedText}>Acesso restrito a administradores</Text>
      </View>
    );
  }

  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Eliminar Utilizador',
      `Tem a certeza que deseja eliminar ${userName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteUser(userId);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      ]
    );
  };

  const handleDeletePost = (postId: string, postTitle: string) => {
    Alert.alert(
      'Eliminar Publicação',
      `Tem a certeza que deseja eliminar "${postTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deletePost(postId);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      ]
    );
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    
    await sendNotification(notificationTitle.trim(), notificationBody.trim(), user.name);
    setShowNotificationModal(false);
    setNotificationTitle('');
    setNotificationBody('');
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Sucesso', 'Notificação enviada com sucesso!');
  };

  const handleAddAd = async () => {
    if (!adImageUrl.trim() || !adLinkUrl.trim() || !adTitle.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    
    await addAd({
      imageUrl: adImageUrl.trim(),
      linkUrl: adLinkUrl.trim(),
      title: adTitle.trim(),
      active: true,
    });
    
    setShowAdModal(false);
    setAdImageUrl('');
    setAdLinkUrl('');
    setAdTitle('');
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDeleteAd = (adId: string, adTitleParam: string) => {
    Alert.alert(
      'Eliminar Publicidade',
      `Tem a certeza que deseja eliminar "${adTitleParam}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteAd(adId);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle}>{item.name}</Text>
          <Text style={styles.listItemSubtitle}>{item.email}</Text>
          <Text style={styles.listItemMeta}>{item.role === 'admin' ? 'Administrador' : 'Utilizador'}</Text>
        </View>
      </View>
      {item.role !== 'admin' && (
        <Pressable 
          style={styles.deleteButton}
          onPress={() => handleDeleteUser(item.id, item.name)}
        >
          <Ionicons name="trash" size={18} color={Colors.accent} />
        </Pressable>
      )}
    </View>
  );

  const renderPostItem = ({ item }: { item: Post }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemInfo}>
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.listItemSubtitle}>Por: {item.userName}</Text>
          <Text style={styles.listItemMeta}>{new Date(item.createdAt).toLocaleDateString('pt-PT')}</Text>
        </View>
      </View>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => handleDeletePost(item.id, item.title)}
      >
        <Ionicons name="trash" size={18} color={Colors.accent} />
      </Pressable>
    </View>
  );

  const renderAdItem = ({ item }: { item: Advertisement }) => (
    <View style={styles.listItem}>
      <View style={styles.listItemInfo}>
        <View style={styles.listItemContent}>
          <Text style={styles.listItemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.listItemSubtitle} numberOfLines={1}>{item.linkUrl}</Text>
          <Text style={styles.listItemMeta}>{item.active ? 'Ativo' : 'Inativo'}</Text>
        </View>
      </View>
      <Pressable 
        style={styles.deleteButton}
        onPress={() => handleDeleteAd(item.id, item.title)}
      >
        <Ionicons name="trash" size={18} color={Colors.accent} />
      </Pressable>
    </View>
  );

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Pressable 
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Ionicons name="people" size={18} color={activeTab === 'users' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Utilizadores</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Ionicons name="megaphone" size={18} color={activeTab === 'posts' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>Posts</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'ads' && styles.tabActive]}
          onPress={() => setActiveTab('ads')}
        >
          <Ionicons name="image" size={18} color={activeTab === 'ads' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'ads' && styles.tabTextActive]}>Anúncios</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons name="notifications" size={18} color={activeTab === 'notifications' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>Notif.</Text>
        </Pressable>
      </View>

      {activeTab === 'users' && (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum utilizador encontrado</Text>
          }
        />
      )}

      {activeTab === 'posts' && (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma publicação encontrada</Text>
          }
        />
      )}

      {activeTab === 'ads' && (
        <>
          <FlatList
            data={ads}
            renderItem={renderAdItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhum anúncio encontrado</Text>
            }
          />
          <Pressable style={styles.fab} onPress={() => setShowAdModal(true)}>
            <Ionicons name="image" size={24} color={Colors.textInverse} />
          </Pressable>
        </>
      )}

      {activeTab === 'notifications' && (
        <>
          <ScrollView contentContainerStyle={styles.listContent}>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma notificação enviada</Text>
            ) : (
              notifications.map((notif) => (
                <View key={notif.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{notif.title}</Text>
                  <Text style={styles.notificationBody}>{notif.body}</Text>
                  <Text style={styles.notificationMeta}>
                    {formatNotificationDate(notif.sentAt)} • Por {notif.sentBy}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
          <Pressable style={styles.fab} onPress={() => setShowNotificationModal(true)}>
            <Send size={24} color={Colors.textInverse} />
          </Pressable>
        </>
      )}

      <Modal
        visible={showNotificationModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowNotificationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar Notificação</Text>
              <Pressable onPress={() => setShowNotificationModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={styles.input}
              value={notificationTitle}
              onChangeText={setNotificationTitle}
              placeholder="Título da notificação"
              placeholderTextColor={Colors.textLight}
            />
            
            <Text style={styles.inputLabel}>Mensagem</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notificationBody}
              onChangeText={setNotificationBody}
              placeholder="Texto da notificação"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />
            
            <Pressable 
              style={[styles.submitButton, sendNotificationPending && styles.submitButtonDisabled]}
              onPress={handleSendNotification}
              disabled={sendNotificationPending}
            >
              <Text style={styles.submitButtonText}>
                {sendNotificationPending ? 'A enviar...' : 'Enviar Notificação'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAdModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Publicidade</Text>
              <Pressable onPress={() => setShowAdModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            
            <Text style={styles.inputLabel}>Título</Text>
            <TextInput
              style={styles.input}
              value={adTitle}
              onChangeText={setAdTitle}
              placeholder="Nome do anúncio"
              placeholderTextColor={Colors.textLight}
            />
            
            <Text style={styles.inputLabel}>URL da Imagem</Text>
            <TextInput
              style={styles.input}
              value={adImageUrl}
              onChangeText={setAdImageUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              keyboardType="url"
            />
            
            <Text style={styles.inputLabel}>Link de Destino</Text>
            <TextInput
              style={styles.input}
              value={adLinkUrl}
              onChangeText={setAdLinkUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              keyboardType="url"
            />
            
            <Pressable style={styles.submitButton} onPress={handleAddAd}>
              <Text style={styles.submitButtonText}>Adicionar Publicidade</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  unauthorized: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  unauthorizedText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listItemContent: {
    flex: 1,
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
  listItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  listItemMeta: {
    fontSize: 11,
    color: Colors.textLight,
  },
  deleteButton: {
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 40,
  },
  notificationItem: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  notificationBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationMeta: {
    fontSize: 12,
    color: Colors.textLight,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
