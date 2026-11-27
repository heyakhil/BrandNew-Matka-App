import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ResultRow } from '../../components/molecules/ResultRow';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { sortMarketsByOpenTime } from '../../utils/matkaHelpers';

interface GameResultScreenProps {
  markets: MarketItem[];
  onSelectMarket: (market: MarketItem) => void;
}

const todayLabel = (): string => new Date().toISOString().slice(0, 10);

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  markets,
  onSelectMarket,
}) => (
  <View style={styles.container}>
    <View style={styles.dateRow}>
      <Text style={styles.dateLabel}>Select Date :</Text>
      <View style={styles.datePill}>
        <Text style={styles.dateText}>{todayLabel()}</Text>
      </View>
    </View>

    <FlatList
      data={sortMarketsByOpenTime(markets.filter(m => m.category === 'main'))}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <ResultRow market={item} onPress={onSelectMarket} />
      )}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateLabel: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
  },
  datePill: {
    width: '48%',
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
