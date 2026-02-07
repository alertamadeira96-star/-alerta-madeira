import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';

interface FuelPrice {
  type: string;
  price: number;
  previousPrice: number;
  unit: string;
}

const FUEL_TYPES: FuelPrice[] = [
  { type: 'Gasolina 95', price: 1.659, previousPrice: 1.649, unit: '€/L' },
  { type: 'Gasolina 98', price: 1.819, previousPrice: 1.829, unit: '€/L' },
  { type: 'Gasóleo', price: 1.529, previousPrice: 1.519, unit: '€/L' },
  { type: 'GPL Auto', price: 0.789, previousPrice: 0.789, unit: '€/L' },
];

interface FuelPricesWidgetProps {
  compact?: boolean;
}

export default function FuelPricesWidget({ compact = false }: FuelPricesWidgetProps) {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const fetchFuelPrices = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const updatedPrices = FUEL_TYPES.map(fuel => ({
        ...fuel,
        price: fuel.price + (Math.random() * 0.02 - 0.01),
      }));
      
      setFuelPrices(updatedPrices);
      setLastUpdate(new Date().toLocaleDateString('pt-PT', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }));
      setIsLoading(false);
    };

    fetchFuelPrices();
  }, []);

  const getPriceTrend = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.001) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Ionicons name="trending-up" size={14} color="#EF4444" />;
      case 'down':
        return <Ionicons name="trending-down" size={14} color="#22C55E" />;
      default:
        return <Ionicons name="remove" size={14} color={Colors.textSecondary} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#EF4444';
      case 'down':
        return '#22C55E';
      default:
        return Colors.textSecondary;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
          {!compact && <Text style={styles.loadingText}>A carregar preços...</Text>}
        </View>
      </View>
    );
  }

  const mainFuels = expanded ? fuelPrices : fuelPrices.slice(0, 2);
  const compactFuels = fuelPrices.slice(0, 2);

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <View style={styles.compactHeader}>
          <View style={styles.compactIconContainer}>
            <Ionicons name="flash" size={14} color={Colors.textInverse} />
          </View>
          <Text style={styles.compactTitle}>Combustíveis</Text>
        </View>
        
        {compactFuels.map((fuel) => {
          const trend = getPriceTrend(fuel.price, fuel.previousPrice);
          return (
            <View key={fuel.type} style={styles.compactPriceRow}>
              <Text style={styles.compactFuelType}>{fuel.type}</Text>
              <View style={styles.compactPriceInfo}>
                <Text style={styles.compactPrice}>{fuel.price.toFixed(3)}€</Text>
                {getTrendIcon(trend)}
              </View>
            </View>
          );
        })}
        
        <Text style={styles.compactUpdateText}>{lastUpdate}</Text>
      </View>
    );
  }

  return (
    <Pressable 
      style={styles.container}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={18} color={Colors.textInverse} />
          </View>
          <View>
            <Text style={styles.cardTitle}>Combustíveis na Madeira</Text>
            <Text style={styles.updateText}>Atualizado: {lastUpdate}</Text>
          </View>
        </View>
      </View>

      <View style={styles.pricesGrid}>
        {mainFuels.map((fuel, index) => {
          const trend = getPriceTrend(fuel.price, fuel.previousPrice);
          return (
            <View key={fuel.type} style={[styles.priceCard, index % 2 === 1 && styles.priceCardRight]}>
              <Text style={styles.fuelType}>{fuel.type}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{fuel.price.toFixed(3)}</Text>
                <Text style={styles.unit}>{fuel.unit}</Text>
              </View>
              <View style={styles.trendRow}>
                {getTrendIcon(trend)}
                <Text style={[styles.trendText, { color: getTrendColor(trend) }]}>
                  {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
                  {Math.abs(fuel.price - fuel.previousPrice).toFixed(3)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={styles.expandHint}>
        {expanded ? 'Toque para minimizar' : 'Toque para ver todos os preços'}
      </Text>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          Preços médios indicativos. Consulte os postos locais.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
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
    gap: 8,
    marginBottom: 12,
  },
  compactIconContainer: {
    width: 24,
    height: 24,
    backgroundColor: '#F97316',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  compactPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  compactFuelType: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  compactPriceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactPrice: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  compactUpdateText: {
    fontSize: 9,
    color: Colors.textLight,
    marginTop: 8,
    textAlign: 'center',
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#F97316',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  updateText: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  pricesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  priceCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  priceCardRight: {},
  fuelType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  unit: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  expandHint: {
    fontSize: 11,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  disclaimer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
  },
});
