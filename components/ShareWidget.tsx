import React from 'react';
import { View, Text, StyleSheet, Pressable, Share, Platform, Linking, Alert } from 'react-native';
import { Share2, Facebook, MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';

interface ShareWidgetProps {
  title: string;
  description: string;
  url?: string;
}

export default function ShareWidget({ title, description, url }: ShareWidgetProps) {
  const shareMessage = `${title}\n\n${description}\n\nVia Alerta Madeira`;
  const encodedMessage = encodeURIComponent(shareMessage);

  const handleNativeShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: shareMessage,
        title: title,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const handleWhatsAppShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
    const webWhatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webWhatsappUrl);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp');
    }
  };

  const handleFacebookShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`;
    
    try {
      await Linking.openURL(facebookUrl);
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o Facebook');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Partilhar</Text>
      <View style={styles.buttons}>
        <Pressable style={styles.shareButton} onPress={handleNativeShare}>
          <Share2 size={18} color={Colors.primary} />
        </Pressable>
        <Pressable style={[styles.shareButton, styles.whatsappButton]} onPress={handleWhatsAppShare}>
          <MessageCircle size={18} color="#25D366" />
        </Pressable>
        <Pressable style={[styles.shareButton, styles.facebookButton]} onPress={handleFacebookShare}>
          <Facebook size={18} color="#1877F2" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappButton: {
    backgroundColor: '#E8FFF3',
  },
  facebookButton: {
    backgroundColor: '#E8F0FF',
  },
});
