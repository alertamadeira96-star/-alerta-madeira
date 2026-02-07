import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface Ad {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  sponsor: string;
  ctaText: string;
  url: string;
}

const DEMO_ADS: Ad[] = [
  {
    id: '1',
    title: 'Restaurante O Madeirense',
    description: 'Autêntica gastronomia regional. Espetada na brasa!',
    mediaUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    mediaType: 'image',
    sponsor: 'Patrocinado',
    ctaText: 'Ver Menu',
    url: 'https://example.com',
  },
  {
    id: '2',
    title: 'Rent-a-Car Funchal',
    description: 'Alugue o seu carro a partir de 25€/dia',
    mediaUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop',
    mediaType: 'image',
    sponsor: 'Patrocinado',
    ctaText: 'Reservar',
    url: 'https://example.com',
  },
  {
    id: '3',
    title: 'Hotel Vista Mar',
    description: 'Escapadinha na Madeira com 20% desconto',
    mediaUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=400&fit=crop',
    mediaType: 'image',
    sponsor: 'Patrocinado',
    ctaText: 'Ver Oferta',
    url: 'https://example.com',
  },
  {
    id: '4',
    title: 'Descubra a Madeira',
    description: 'Turismo e natureza num só lugar',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    mediaType: 'video',
    sponsor: 'Patrocinado',
    ctaText: 'Explorar',
    url: 'https://example.com',
  },
  {
    id: '5',
    title: 'Supermercado Pingo Doce',
    description: 'Promoções de verão! Até 50% desconto',
    mediaUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=400&fit=crop',
    mediaType: 'image',
    sponsor: 'Patrocinado',
    ctaText: 'Ver Folheto',
    url: 'https://example.com',
  },
  {
    id: '6',
    title: 'Clínica Veterinária Funchal',
    description: 'Cuidamos do seu melhor amigo',
    mediaUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop',
    mediaType: 'image',
    sponsor: 'Patrocinado',
    ctaText: 'Marcar Consulta',
    url: 'https://example.com',
  },
  {
    id: '7',
    title: 'Aventura na Natureza',
    description: 'Experiências únicas na ilha',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    mediaType: 'video',
    sponsor: 'Patrocinado',
    ctaText: 'Descobrir',
    url: 'https://example.com',
  },
];

interface AdBannerProps {
  variant?: 'banner' | 'inline';
}

export default function AdBanner({ variant = 'banner' }: AdBannerProps) {
  const [currentAd, setCurrentAd] = useState<Ad>(DEMO_ADS[0]);
  const [dismissed, setDismissed] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * DEMO_ADS.length);
    setCurrentAd(DEMO_ADS[randomIndex]);
  }, []);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setDismissed(true));
  };

  const handlePress = () => {
    console.log('Ad clicked:', currentAd.title);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (dismissed) return null;

  if (variant === 'inline') {
    return (
      <Animated.View style={[styles.inlineContainer, { opacity: fadeAnim }]}>
        <Image 
          source={{ uri: currentAd.mediaType === 'image' ? currentAd.mediaUrl : 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&h=200&fit=crop' }} 
          style={styles.inlineImage} 
          contentFit="cover"
        />
        <View style={styles.inlineContent}>
          <Text style={styles.inlineSponsor}>{currentAd.sponsor}</Text>
          <Text style={styles.inlineTitle} numberOfLines={1}>{currentAd.title}</Text>
          <Text style={styles.inlineDescription} numberOfLines={1}>{currentAd.description}</Text>
        </View>
        <Pressable style={styles.inlineCta} onPress={handlePress}>
          <Text style={styles.inlineCtaText}>{currentAd.ctaText}</Text>
        </Pressable>
        <Pressable style={styles.inlineDismiss} onPress={handleDismiss}>
          <Ionicons name="close" size={16} color={Colors.textLight} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Pressable style={styles.mediaContainer} onPress={handlePress}>
        {currentAd.mediaType === 'video' ? (
          <>
            <Video
              ref={videoRef}
              source={{ uri: currentAd.mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay
              isMuted={isMuted}
            />
            <Pressable style={styles.muteButton} onPress={toggleMute}>
              {isMuted ? (
                <Ionicons name="volume-mute" size={18} color="#fff" />
              ) : (
                <Ionicons name="volume-high" size={18} color="#fff" />
              )}
            </Pressable>
          </>
        ) : (
          <Image 
            source={{ uri: currentAd.mediaUrl }} 
            style={styles.media} 
            contentFit="cover"
          />
        )}
        
        <View style={styles.overlay}>
          <View style={styles.sponsorBadge}>
            <Text style={styles.sponsorText}>{currentAd.sponsor}</Text>
          </View>
          <Pressable style={styles.dismissButton} onPress={handleDismiss}>
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
        
        <View style={styles.contentOverlay}>
          <View style={styles.textContent}>
            <Text style={styles.title} numberOfLines={1}>{currentAd.title}</Text>
            <Text style={styles.description} numberOfLines={1}>{currentAd.description}</Text>
          </View>
          <Pressable style={styles.ctaButton} onPress={handlePress}>
            <Text style={styles.ctaText}>{currentAd.ctaText}</Text>
            <Ionicons name="open-outline" size={14} color="#fff" />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mediaContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  sponsorBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sponsorText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    padding: 5,
  },
  muteButton: {
    position: 'absolute',
    bottom: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: 8,
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  textContent: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  inlineImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.surfaceAlt,
  },
  inlineContent: {
    flex: 1,
  },
  inlineSponsor: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inlineTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  inlineDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  inlineCta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inlineCtaText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  inlineDismiss: {
    padding: 4,
  },
});
