import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { usePosts } from '@/contexts/PostsContext';
import { Category, CATEGORY_LABELS } from '@/types';
import * as Haptics from 'expo-haptics';

const CATEGORIES: Category[] = ['ocorrencias', 'op-stop', 'anomalias', 'perdidos', 'acidentes', 'alertas'];

const getCategoryColor = (category: Category) => {
  const colors: Record<Category, string> = {
    'ocorrencias': Colors.categoryOcorrencias,
    'op-stop': Colors.categoryOpStop,
    'anomalias': Colors.categoryAnomalias,
    'perdidos': Colors.categoryPerdidos,
    'acidentes': Colors.categoryAcidentes,
    'alertas': Colors.categoryAlertas,
  };
  return colors[category];
};

const getCategoryPublishText = (category: Category) => {
  const texts: Record<Category, string> = {
    'ocorrencias': 'Publicar Ocorrência',
    'op-stop': 'Publicar Op. Stop',
    'anomalias': 'Publicar Anomalia',
    'perdidos': 'Publicar Perdidos',
    'acidentes': 'Publicar Acidente',
    'alertas': 'Publicar Alerta',
  };
  return texts[category];
};

interface LocationData {
  address: string;
  latitude?: number;
  longitude?: number;
}

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const { user } = useAuth();
  const { createPost, createPostPending } = usePosts();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [locationData, setLocationData] = useState<LocationData>({ address: '' });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    (params.category as Category) || 'ocorrencias'
  );

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              try {
                const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
                const formattedAddress = address 
                  ? `${address.street || ''} ${address.streetNumber || ''}, ${address.city || address.region || 'Madeira'}`.trim()
                  : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                setLocationData({
                  address: formattedAddress,
                  latitude,
                  longitude,
                });
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              } catch {
                setLocationData({
                  address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                  latitude,
                  longitude,
                });
              }
              setIsLoadingLocation(false);
            },
            () => {
              Alert.alert('Erro', 'Não foi possível obter a localização. Insira manualmente.');
              setIsLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        } else {
          Alert.alert('Erro', 'Geolocalização não suportada neste navegador.');
          setIsLoadingLocation(false);
        }
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão Negada', 'Por favor, permita o acesso à localização nas definições.');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const formattedAddress = address 
          ? `${address.street || ''} ${address.streetNumber || ''}, ${address.city || address.region || 'Madeira'}`.trim()
          : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        setLocationData({
          address: formattedAddress,
          latitude,
          longitude,
        });
      } catch {
        setLocationData({
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          latitude,
          longitude,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Erro', 'Não foi possível obter a localização. Tente novamente ou insira manualmente.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleManualLocationSave = () => {
    if (manualLocation.trim()) {
      setLocationData({
        address: manualLocation.trim(),
        latitude: undefined,
        longitude: undefined,
      });
      setShowLocationModal(false);
      setManualLocation('');
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
    if (!title.trim()) {
      Alert.alert('Erro', 'Por favor, adicione um título');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, adicione uma descrição');
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
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUri,
        videoUrl: videoUrl.trim() || undefined,
        category: selectedCategory,
        location: locationData.address || 'Madeira, Portugal',
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      });
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch {
      Alert.alert('Erro', 'Não foi possível publicar. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Nova Publicação</Text>
        <Pressable 
          style={[styles.publishButton, createPostPending && styles.publishButtonDisabled]}
          onPress={handlePublish}
          disabled={createPostPending}
        >
          <Ionicons name="checkmark" size={20} color={Colors.textInverse} />
          <Text style={styles.publishText}>
            {createPostPending ? 'A publicar...' : getCategoryPublishText(selectedCategory)}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
              <Pressable style={styles.changeImageButton} onPress={() => setImageUri(null)}>
                <Ionicons name="close" size={20} color={Colors.textInverse} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.imagePicker}>
              <Pressable style={styles.imageOption} onPress={() => pickImage(true)}>
                <View style={styles.imageOptionIcon}>
                  <Ionicons name="camera" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.imageOptionText}>Tirar Foto</Text>
              </Pressable>
              <View style={styles.imageDivider} />
              <Pressable style={styles.imageOption} onPress={() => pickImage(false)}>
                <View style={styles.imageOptionIcon}>
                  <Ionicons name="image" size={28} color={Colors.primary} />
                </View>
                <Text style={styles.imageOptionText}>Galeria</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Categoria</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.categoryChip,
                    selectedCategory === cat && { backgroundColor: getCategoryColor(cat) }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    selectedCategory === cat && styles.categoryChipTextActive
                  ]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Título</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="O que está a acontecer?"
              placeholderTextColor={Colors.textLight}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Descrição</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Descreva a situação com mais detalhes..."
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionLabelRow}>
              <Ionicons name="videocam" size={18} color={Colors.primary} />
              <Text style={styles.sectionLabel}>Vídeo (opcional)</Text>
            </View>
            <TextInput
              style={styles.titleInput}
              placeholder="Link do YouTube ou redes sociais"
              placeholderTextColor={Colors.textLight}
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            <Text style={styles.helperText}>Cole o link de um vídeo do YouTube, Instagram ou TikTok</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionLabel}>Localização</Text>
            <View style={styles.locationContainer}>
              <Pressable 
                style={[styles.locationButton, styles.gpsButton]}
                onPress={getCurrentLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} />
                ) : (
                  <Ionicons name="navigate" size={20} color={Colors.textInverse} />
                )}
                <Text style={styles.locationButtonText}>
                  {isLoadingLocation ? 'A obter...' : 'Usar GPS'}
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.locationButton, styles.manualButton]}
                onPress={() => setShowLocationModal(true)}
              >
                <Ionicons name="create" size={20} color={Colors.primary} />
                <Text style={styles.manualButtonText}>Manual</Text>
              </Pressable>
            </View>
            {locationData.address ? (
              <View style={styles.locationDisplay}>
                <Ionicons name="location" size={16} color={Colors.secondary} />
                <Text style={styles.locationText} numberOfLines={2}>
                  {locationData.address}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Inserir Localização</Text>
                <Pressable onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </Pressable>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Rua de Santa Maria, Funchal"
                placeholderTextColor={Colors.textLight}
                value={manualLocation}
                onChangeText={setManualLocation}
                autoFocus
              />
              <Pressable 
                style={[styles.modalButton, !manualLocation.trim() && styles.modalButtonDisabled]}
                onPress={handleManualLocationSave}
                disabled={!manualLocation.trim()}
              >
                <Text style={styles.modalButtonText}>Confirmar</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imagePicker: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  imageOption: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  imageOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOptionText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  imageDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formSection: {
    marginBottom: 20,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
  },
  titleInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descriptionInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  charCount: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'right',
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  gpsButton: {
    backgroundColor: Colors.primary,
  },
  manualButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  locationDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    padding: 12,
    borderRadius: 10,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
