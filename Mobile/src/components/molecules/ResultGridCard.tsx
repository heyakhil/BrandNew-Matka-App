import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';

interface ResultGridCardProps {
  market: MarketItem;
  onPress: (market: MarketItem) => void;
}

export const ResultGridCard: React.FC<ResultGridCardProps> = ({
  market,
  onPress,
}) => {
  return (
    <Card style={styles.card} mode="contained" onPress={() => onPress(market)}>
      <Card.Content style={styles.content}>
        <Text variant="labelLarge" style={styles.title} numberOfLines={1}>
          {market.name}
        </Text>
        <Text variant="titleMedium" style={styles.result}>
          {market.resultLine}
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 10,
  },
  content: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  result: {
    color: APP_COLORS.accent,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
