import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, TouchableRipple } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';

interface ResultRowProps {
  market: MarketItem;
  onPress: (market: MarketItem) => void;
}

export const ResultRow: React.FC<ResultRowProps> = ({ market, onPress }) => (
  <TouchableRipple style={styles.row} onPress={() => onPress(market)}>
    <>
      <Text style={styles.name} numberOfLines={1}>
        {market.name}
      </Text>
      <Text style={styles.result}>{market.resultLine}</Text>
    </>
  </TouchableRipple>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    elevation: 2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  name: {
    flex: 1,
    color: '#111827',
    fontSize: 15.5,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  result: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
});
