import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';

interface BalanceChipProps {
  balanceRupees: number;
  onPress?: () => void;
}

export const BalanceChip: React.FC<BalanceChipProps> = ({
  balanceRupees,
  onPress,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel="Wallet balance"
    disabled={!onPress}
    onPress={onPress}
    style={styles.row}>
    <Icon source="wallet-outline" size={26} color={APP_COLORS.textPrimary} />
    <Text style={styles.amount}>{balanceRupees}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  amount: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 18,
  },
});
