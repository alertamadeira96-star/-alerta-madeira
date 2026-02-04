import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Droplets, MapPin, ChevronDown, X, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  humidity: number;
  description: string;
  feelsLike: number;
  windSpeed: number;
}

const MADEIRA_MUNICIPIOS = [
  { id: 'funchal', name: 'Funchal', temp: 22 },
  { id: 'camara-lobos', name: 'Câmara de Lobos', temp: 21 },
  { id: 'santa-cruz', name: 'Santa Cruz', temp: 20 },
  { id: 'machico', name: 'Machico', temp: 19 },
  { id: 'santana', name: 'Santana', temp: 17 },
  { id: 'sao-vicente', name: 'São Vicente', temp: 18 },
  { id: 'porto-moniz', name: 'Porto Moniz', temp: 19 },
  { id: 'calheta', name: 'Calheta', temp: 21 },
  { id: 'ponta-do-sol', name: 'Ponta do Sol', temp: 22 },
  { id: 'ribeira-brava', name: 'Ribeira Brava', temp: 20 },
  { id: 'porto-santo', name: 'Porto Santo', temp: 23 },
];

interface WeatherWidgetProps {
  compact?: boolean;
}

export default function WeatherWidget({ compact = false }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedMunicipio, setSelectedMunicipio] = useState(MADEIRA_MUNICIPIOS[0]);
  const [showMunicipioPicker, setShowMunicipioPicker] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'windy'];
      const descriptions: Record<WeatherData['condition'], string> = {
        sunny: 'Céu limpo',
        cloudy: 'Parcialmente nublado',
        rainy: 'Chuva ligeira',
        snowy: 'Neve',
        windy: 'Vento forte',
      };
      const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
      const baseTemp = selectedMunicipio.temp;
      const variation = Math.floor(Math.random() * 4) - 2;
      
      setWeather({
        temperature: baseTemp + variation,
        condition: randomCondition,
        humidity: Math.floor(Math.random() * 30) + 50,
        description: descriptions[randomCondition],
        feelsLike: baseTemp + variation + 2,
        windSpeed: Math.floor(Math.random() * 20) + 5,
      });
      setIsLoading(false);
    };

    fetchWeather();
  }, [selectedMunicipio]);

  const iconSize = compact ? 24 : 32;

  const getWeatherIcon = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return <Sun size={iconSize} color="#F59E0B" />;
      case 'cloudy':
        return <Cloud size={iconSize} color="#9CA3AF" />;
      case 'rainy':
        return <CloudRain size={iconSize} color="#3B82F6" />;
      case 'snowy':
        return <CloudSnow size={iconSize} color="#93C5FD" />;
      case 'windy':
        return <Wind size={iconSize} color="#6B7280" />;
      default:
        return <Sun size={iconSize} color="#F59E0B" />;
    }
  };

  const getWeatherGradient = (condition: WeatherData['condition']) => {
    switch (condition) {
      case 'sunny':
        return '#FEF3C7';
      case 'cloudy':
        return '#F3F4F6';
      case 'rainy':
        return '#DBEAFE';
      case 'snowy':
        return '#E0E7FF';
      case 'windy':
        return '#F3F4F6';
      default:
        return '#FEF3C7';
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          {!compact && <Text style={styles.loadingText}>A carregar meteorologia...</Text>}
        </View>
      </View>
    );
  }

  if (!weather) return null;

  return (
    <>
      <Pressable 
        style={[styles.container, compact && styles.containerCompact, { backgroundColor: getWeatherGradient(weather.condition) }]}
        onPress={() => !compact && setExpanded(!expanded)}
      >
        {compact ? (
          <>
            <View style={styles.compactHeader}>
              <Sun size={14} color={Colors.primary} />
              <Text style={styles.compactTitle}>Meteorologia</Text>
            </View>
            <Pressable 
              style={styles.compactLocationSelector}
              onPress={() => setShowMunicipioPicker(true)}
            >
              <MapPin size={12} color={Colors.primary} />
              <Text style={styles.compactLocationText} numberOfLines={1}>{selectedMunicipio.name}</Text>
              <ChevronDown size={12} color={Colors.primary} />
            </Pressable>
            <View style={styles.compactMainContent}>
              <View style={styles.compactIconContainer}>
                {getWeatherIcon(weather.condition)}
              </View>
              <Text style={styles.compactTemperature}>{weather.temperature}°C</Text>
            </View>
            <Text style={styles.compactDescription}>{weather.description}</Text>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Sun size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>Meteorologia</Text>
              </View>
              <Pressable 
                style={styles.locationSelector}
                onPress={(e) => {
                  e.stopPropagation();
                  setShowMunicipioPicker(true);
                }}
              >
                <MapPin size={14} color={Colors.primary} />
                <Text style={styles.locationText}>{selectedMunicipio.name}</Text>
                <ChevronDown size={14} color={Colors.primary} />
              </Pressable>
            </View>

            <View style={styles.mainContent}>
              <View style={styles.weatherIconContainer}>
                {getWeatherIcon(weather.condition)}
              </View>
              <View style={styles.tempInfo}>
                <Text style={styles.temperature}>{weather.temperature}°C</Text>
                <Text style={styles.description}>{weather.description}</Text>
              </View>
            </View>
            
            {expanded && (
              <View style={styles.detailsContainer}>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Thermometer size={18} color={Colors.textSecondary} />
                    <Text style={styles.detailLabel}>Sensação</Text>
                    <Text style={styles.detailValue}>{weather.feelsLike}°C</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Droplets size={18} color="#3B82F6" />
                    <Text style={styles.detailLabel}>Humidade</Text>
                    <Text style={styles.detailValue}>{weather.humidity}%</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Wind size={18} color="#6B7280" />
                    <Text style={styles.detailLabel}>Vento</Text>
                    <Text style={styles.detailValue}>{weather.windSpeed} km/h</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={styles.expandHint}>
              {expanded ? 'Toque para minimizar' : 'Toque para mais detalhes'}
            </Text>
          </>
        )}
      </Pressable>

      <Modal
        visible={showMunicipioPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMunicipioPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowMunicipioPicker(false)}>
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecionar Município</Text>
                <Pressable onPress={() => setShowMunicipioPicker(false)}>
                  <X size={24} color={Colors.text} />
                </Pressable>
              </View>
              <ScrollView>
                {MADEIRA_MUNICIPIOS.map((municipio) => (
                  <Pressable
                    key={municipio.id}
                    style={[
                      styles.pickerItem,
                      selectedMunicipio.id === municipio.id && styles.pickerItemSelected
                    ]}
                    onPress={() => {
                      setSelectedMunicipio(municipio);
                      setShowMunicipioPicker(false);
                    }}
                  >
                    <View style={styles.pickerItemContent}>
                      <MapPin size={18} color={selectedMunicipio.id === municipio.id ? Colors.primary : Colors.textSecondary} />
                      <Text style={[
                        styles.pickerItemText,
                        selectedMunicipio.id === municipio.id && styles.pickerItemTextSelected
                      ]}>
                        {municipio.name}
                      </Text>
                    </View>
                    {selectedMunicipio.id === municipio.id && (
                      <Check size={20} color={Colors.primary} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  containerCompact: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
    padding: 12,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  compactLocationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  compactLocationText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.primary,
    maxWidth: 80,
  },
  compactMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTemperature: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  compactDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  weatherIconContainer: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  expandHint: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 12,
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
  pickerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
