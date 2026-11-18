import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketStatus } from '../../types/matka';

interface StatusBadgeProps {
  status: MarketStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config =
    status === 'open_running'
      ? { label: 'Betting Is Running Now', color: APP_COLORS.success }
      : status === 'close_running'
      ? { label: 'Betting Is Running For Close', color: APP_COLORS.accent }
      : { label: 'Betting Closed For Today', color: APP_COLORS.danger };

  return (
    <Text variant="labelMedium" style={[styles.text, { color: config.color }]}>
      {config.label}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
