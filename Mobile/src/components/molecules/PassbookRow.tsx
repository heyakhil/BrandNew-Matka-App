import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { WalletTransaction } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';

interface PassbookRowProps {
  transaction: WalletTransaction;
}

export const PassbookRow: React.FC<PassbookRowProps> = ({ transaction }) => {
  const [expanded, setExpanded] = useState(false);
  const { timestamp, title, amountRupees, beforeBalance, afterBalance, status } =
    transaction;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded(prev => !prev)}
      style={styles.card}>
      <View style={styles.row}>
        <View style={styles.dateCol}>
          <Text style={styles.text}>{timestamp}</Text>
        </View>
        <View style={styles.particularsCol}>
          <Text style={[styles.text, styles.particulars]}>{title}</Text>
          <Icon
            source={expanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={APP_COLORS.accent}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detail}>
            Amount: {formatRupees(amountRupees)} • {status}
          </Text>
          {beforeBalance !== undefined && afterBalance !== undefined && (
            <Text style={styles.detail}>
              Balance: {formatRupees(beforeBalance)} →{' '}
              {formatRupees(afterBalance)}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  row: {
    flexDirection: 'row',
    minHeight: 64,
  },
  dateCol: {
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: APP_COLORS.border,
  },
  particularsCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 4,
  },
  particulars: {
    flex: 1,
    textAlign: 'left',
  },
  text: {
    color: APP_COLORS.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  details: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 2,
  },
  detail: {
    color: APP_COLORS.textSecondary,
    fontSize: 13,
  },
});
