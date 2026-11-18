import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { GameTypeId } from '../../types/matka';

interface RateCodeBadgeProps {
  code: GameTypeId;
  color: string;
}

export const RateCodeBadge: React.FC<RateCodeBadgeProps> = ({ code, color }) => {
  return (
    <Surface style={[styles.badge, { backgroundColor: color }]} elevation={0}>
      <Text variant="labelLarge" style={styles.label}>
        {code}
      </Text>
    </Surface>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 58,
    height: 46,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: APP_COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
