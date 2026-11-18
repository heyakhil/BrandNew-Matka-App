import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketStatus } from '../../types/matka';

interface StatusBadgeProps {
  status: MarketStatus;
}

const STATUS_CONFIG: Record<MarketStatus, { label: string; color: string }> = {
  open_running: { label: 'Running now', color: APP_COLORS.success },
  close_running: { label: 'Running for close', color: APP_COLORS.accent },
  closed: { label: 'Closed for Today', color: APP_COLORS.danger },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { label, color } = STATUS_CONFIG[status];

  return <Text style={[styles.text, { color }]}>{label}</Text>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
