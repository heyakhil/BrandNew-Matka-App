import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { GameRateItem } from '../../types/matka';
import { RateCodeBadge } from '../atoms/RateCodeBadge';

interface RateListItemProps {
  rate: GameRateItem;
  onPress?: (rate: GameRateItem) => void;
}

export const RateListItem: React.FC<RateListItemProps> = ({ rate, onPress }) => {
  return (
    <Card
      style={styles.card}
      mode="contained"
      onPress={onPress ? () => onPress(rate) : undefined}>
      <View style={styles.row}>
        <RateCodeBadge code={rate.code} color={rate.badgeColor} />
        <View style={styles.middle}>
          <Text variant="titleSmall" style={styles.name}>
            {rate.name}
          </Text>
          <Text variant="labelSmall" style={styles.sub}>
            10 Ka {rate.displayRatePer10}
          </Text>
        </View>
        <Text variant="titleMedium" style={styles.amount}>
          {rate.displayRatePer10}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    paddingHorizontal: 10,
  },
  name: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
  },
  sub: {
    color: APP_COLORS.textSecondary,
    lineHeight: 14,
  },
  amount: {
    color: APP_COLORS.accent,
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 18,
    paddingRight: 12,
  },
});
