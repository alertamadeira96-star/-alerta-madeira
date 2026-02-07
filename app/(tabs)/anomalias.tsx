import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, Pressable, Text, TextInput, ScrollView, Modal, Alert, Platform, ActivityIndicator, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePosts } from '@/contexts/PostsContext';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import EmptyState from '@/components/EmptyState';
import AdBanner from '@/components/AdBanner';
import { Reactions, Post } from '@/types';

type FeedItem = { type: 'post'; data: Post } | { type: 'ad'; id: string } | { type: 'form' };

const CATEGORIAS_ANOMALIA = [
  'Estradas e Pavimentos',
  'Iluminação Pública',
  'Saneamento',
  'Limpeza Urbana',
  'Espaços Verdes',
  'Sinalização',
  'Mobiliário Urbano',
  'Outro',
];

const ASSUNTOS_POR_CATEGORIA: Record<string, string[]> = {
  'Estradas e Pavimentos': ['Buraco na estrada', 'Pavimento danificado', 'Passeio em mau estado', 'Falta de passadeira'],
  'Iluminação Pública': ['Candeeiro avariado', 'Zona sem iluminação', 'Luz sempre acesa'],
  'Saneamento': ['Esgoto entupido', 'Mau cheiro', 'Tampa de saneamento danificada'],
  'Limpeza Urbana': ['Lixo acumulado', 'Contentor cheio', 'Entulho abandonado'],
  'Espaços Verdes': ['Árvore caída', 'Erva alta', 'Jardim abandonado'],
  'Sinalização': ['Sinal danificado', 'Falta de sinalização', 'Sinal ilegível'],
  'Mobiliário Urbano': ['Banco danificado', 'Paragem de autocarro', 'Graffiti'],
  'Outro': ['Outro problema'],
};

export default function AnomaliasScreen() {
  const router = useRouter();
  const { getPostsByCategory, toggleReaction, deletePost, createPost, createPostPending } = usePosts();
  const { user } = useAuth();
  const posts = getPostsByCategory('anomalias');

  const [showForm, setShowForm] = useState(false);
  const [local, setLocal] = useState('');
  const [detalhesLocal, setDetalhesLocal] = useState('');
  const [categoria, setCategoria] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAssuntoPicker, setShowAssuntoPicker] = useState(false);
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  const feedItems = useMemo(() => {
    const items: FeedItem[] = [];
    items.push({ type: 'form' });
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

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude: lat, longitude: lon } = position.coords;
              try {
                const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
                const formattedAddress = address 
                  ? `${address.street || ''} ${address.streetNumber || ''}, ${address.city || address.region || 'Madeira'}`.trim()
                  : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                setLocal(formattedAddress);
                setLatitude(lat);
                setLongitude(lon);
              } catch {
                setLocal(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                setLatitude(lat);
                setLongitude(lon);
              }
              setIsLoadingLocation(false);
            },
            () => {
              Alert.alert('Erro', 'Não foi possível obter a localização.');
              setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        }
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Por favor, permita o acesso à localização.');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lon } = location.coords;
      
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        const formattedAddress = address 
          ? `${address.street || ''} ${address.streetNumber || ''}, ${address.city || address.region || 'Madeira'}`.trim()
          : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setLocal(formattedAddress);
        setLatitude(lat);
        setLongitude(lon);
      } catch {
        setLocal(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        setLatitude(lat);
        setLongitude(lon);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível obter a localização.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera 
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permissão Necessária', 'Por favor, permita o acesso à câmara/galeria.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [16, 9],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePublish = async () => {
    if (!local.trim()) {
      Alert.alert('Erro', 'Por favor, adicione a localização');
      return;
    }
    if (!categoria) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria');
      return;
    }
    if (!assunto) {
      Alert.alert('Erro', 'Por favor, selecione um assunto');
      return;
    }
    if (!imageUri) {
      Alert.alert('Erro', 'Por favor, adicione uma foto');
      return;
    }
    if (!user) return;

    try {
      await createPost({
        userId: user.id,
        userName: user.name,
        title: `${categoria} - ${assunto}`,
        description: descricao.trim() || `${assunto} em ${local}`,
        imageUrl: imageUri,
        category: 'anomalias',
        location: local,
        latitude,
        longitude,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setLocal('');
      setDetalhesLocal('');
      setCategoria('');
      setAssunto('');
      setDescricao('');
      setImageUri(null);
      setLatitude(undefined);
      setLongitude(undefined);
      setShowForm(false);
      
      Alert.alert('Sucesso', 'Anomalia publicada com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    }
  };

  const renderFormCard = () => (
    <View style={styles.formCard}>
      <View style={styles.formHeader}>
        <Ionicons name="construct" size={24} color={Colors.primary} />
        <Text style={styles.formTitle}>Problemas na sua localidade? Divulgue aqui!</Text>
      </View>

      {!showForm ? (
        <Pressable style={styles.expandButton} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={20} color={Colors.textInverse} />
          <Text style={styles.expandButtonText}>Reportar Anomalia</Text>
        </Pressable>
      ) : (
        <View style={styles.formContent}>
          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Local</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={styles.locationInput}
                value={local}
                onChangeText={setLocal}
                placeholder="Obtenha a localização ou insira a morada"
                placeholderTextColor={Colors.textLight}
              />
              <Pressable 
                style={styles.locationBtn}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <Ionicons name="location" size={20} color={Colors.textInverse} />
                )}
              </Pressable>
            </View>
            <Text style={styles.fieldHelper}>
              Obtenha a sua localização atual, assinale o marcador do local no mapa ou insira a morada.
            </Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Detalhes do Local</Text>
            <TextInput
              style={styles.textArea}
              value={detalhesLocal}
              onChangeText={setDetalhesLocal}
              placeholder="Ex: atrás do muro, ao lado do bar"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={2}
            />
            <Text style={styles.fieldHelper}>
              Pode acrescentar detalhes adicionais sobre o local.
            </Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Categoria</Text>
            <Pressable 
              style={styles.selectButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <Text style={categoria ? styles.selectText : styles.selectPlaceholder}>
                {categoria || 'Escolha'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Assunto</Text>
            <Pressable 
              style={[styles.selectButton, !categoria && styles.selectDisabled]}
              onPress={() => categoria && setShowAssuntoPicker(true)}
              disabled={!categoria}
            >
              <Text style={assunto ? styles.selectText : styles.selectPlaceholder}>
                {assunto || 'Indique a Categoria'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Foto</Text>
            {imageUri ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
                <Pressable style={styles.removeImage} onPress={() => setImageUri(null)}>
                  <Ionicons name="close" size={16} color={Colors.textInverse} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.photoRow}>
                <Pressable style={styles.photoBtn} onPress={() => pickImage(true)}>
                  <Ionicons name="camera" size={20} color={Colors.primary} />
                </Pressable>
                <View style={styles.photoInputWrapper}>
                  <Text style={styles.photoPlaceholder}>Nenhuma foto selecionada...</Text>
                </View>
                <Pressable style={styles.photoAddBtn} onPress={() => pickImage(false)}>
                  <Ionicons name="add" size={18} color={Colors.textInverse} />
                </Pressable>
              </View>
            )}
            <Text style={styles.fieldHelper}>.jpg ou .png com tamanho máximo de 10 MB.</Text>
          </View>

          <View style={styles.formField}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.textArea, styles.descriptionArea]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descreva o problema com mais detalhes..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={600}
            />
            <Text style={styles.charCount}>Caracteres disponíveis: {600 - descricao.length}</Text>
          </View>

          <Pressable 
            style={[styles.publishBtn, createPostPending && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={createPostPending}
          >
            <Ionicons name="checkmark" size={20} color={Colors.textInverse} />
            <Text style={styles.publishBtnText}>
              {createPostPending ? 'A publicar...' : 'Publicar Anomalia'}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>
        </View>
      )}

      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecionar Categoria</Text>
                <Pressable onPress={() => setShowCategoryPicker(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>
              <ScrollView>
                {CATEGORIAS_ANOMALIA.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.pickerItem, categoria === cat && styles.pickerItemSelected]}
                    onPress={() => {
                      setCategoria(cat);
                      setAssunto('');
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, categoria === cat && styles.pickerItemTextSelected]}>
                      {cat}
                    </Text>
                    {categoria === cat && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showAssuntoPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssuntoPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowAssuntoPicker(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecionar Assunto</Text>
                <Pressable onPress={() => setShowAssuntoPicker(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>
              <ScrollView>
                {(ASSUNTOS_POR_CATEGORIA[categoria] || []).map((ass) => (
                  <Pressable
                    key={ass}
                    style={[styles.pickerItem, assunto === ass && styles.pickerItemSelected]}
                    onPress={() => {
                      setAssunto(ass);
                      setShowAssuntoPicker(false);
                    }}
                  >
                    <Text style={[styles.pickerItemText, assunto === ass && styles.pickerItemTextSelected]}>
                      {ass}
                    </Text>
                    {assunto === ass && <Ionicons name="checkmark" size={20} color={Colors.primary} />}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={feedItems}
        keyExtractor={(item, index) => {
          if (item.type === 'post') return item.data.id;
          if (item.type === 'ad') return item.id;
          return `form-${index}`;
        }}
        renderItem={({ item }) => {
          if (item.type === 'form') {
            return renderFormCard();
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
        ListEmptyComponent={
          <EmptyState 
            iconName="construct"
            title="Sem anomalias"
            description="Ainda não há anomalias reportadas. Reporte problemas na via pública!"
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
    paddingVertical: 8,
    flexGrow: 1,
  },
  formCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  formTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  expandButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  formContent: {
    gap: 16,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  fieldHelper: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  locationInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#00BCD4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  descriptionArea: {
    minHeight: 100,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectDisabled: {
    opacity: 0.6,
  },
  selectText: {
    fontSize: 15,
    color: Colors.text,
  },
  selectPlaceholder: {
    fontSize: 15,
    color: Colors.textLight,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#00BCD4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPlaceholder: {
    fontSize: 14,
    color: Colors.textLight,
  },
  photoAddBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.textLight,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  publishBtnDisabled: {
    opacity: 0.7,
  },
  publishBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerItemSelected: {
    backgroundColor: Colors.surfaceAlt,
  },
  pickerItemText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});
