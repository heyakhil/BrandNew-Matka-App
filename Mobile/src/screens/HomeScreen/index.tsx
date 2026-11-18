import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MarketCard } from '../../components/molecules/MarketCard';
import { PromoHeroBanner } from '../../components/molecules/PromoHeroBanner';
import type { MarketItem } from '../../types/matka';
import { styles } from './styles';

interface HomeScreenProps {
  markets: MarketItem[];
  onPlaceBet: (market: MarketItem) => void;
  onOpenChart: (market: MarketItem) => void;
  onOpenRates: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  markets,
  onPlaceBet,
  onOpenChart,
  onOpenRates,
}) => {
  const mainMarkets = useMemo(
    () => markets.filter(m => m.category === 'main'),
    [markets],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mainMarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <PromoHeroBanner onRatesPress={onOpenRates} />
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Live Matka Markets
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MarketCard
            market={item}
            onPlaceBet={onPlaceBet}
            onOpenChart={onOpenChart}
          />
        )}
      />
    </View>
  );
};
