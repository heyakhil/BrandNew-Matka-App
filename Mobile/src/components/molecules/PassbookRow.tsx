import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { WalletTransaction } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';

interface PassbookRowProps {
  transaction: WalletTransaction;
}

export const PASSBOOK_COLUMN_WIDTHS = {
  date: 105,
  particulars: 250,
  previous: 120,
  amount: 135,
  current: 120,
} as const;

export const PassbookRow: React.FC<PassbookRowProps> = ({ transaction }) => {
  const [expanded, setExpanded] = useState(false);
  const { amountRupees, beforeBalance, afterBalance } = transaction;
  const isCredit = transaction.type === 'deposit' || transaction.type === 'win';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded(previous => !previous)}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={[styles.cell, { width: PASSBOOK_COLUMN_WIDTHS.date }]}>
          <Text style={styles.value} numberOfLines={2}>
            {transaction.timestamp}
          </Text>
        </View>
        <View style={[styles.cell, styles.particularsCell, { width: PASSBOOK_COLUMN_WIDTHS.particulars }]}>
          <Text style={styles.particularsText} numberOfLines={expanded ? undefined : 2}>
            {transaction.title}
          </Text>
          <Icon
            source={expanded ? 'chevron-up' : 'chevron-down'}
            size={17}
            color={APP_COLORS.accent}
          />
        </View>
        <View style={[styles.cell, { width: PASSBOOK_COLUMN_WIDTHS.previous }]}>
          <Text style={styles.value}>
            {beforeBalance === undefined ? '—' : formatRupees(beforeBalance)}
          </Text>
        </View>
        <View style={[styles.cell, { width: PASSBOOK_COLUMN_WIDTHS.amount }]}>
          <Text style={[styles.value, isCredit ? styles.credit : styles.debit]}>
            {isCredit ? '+ ' : '- '}
            {formatRupees(amountRupees)}
          </Text>
        </View>
        <View style={[styles.cell, styles.lastCell, { width: PASSBOOK_COLUMN_WIDTHS.current }]}>
          <Text style={styles.value}>
            {afterBalance === undefined ? '—' : formatRupees(afterBalance)}
          </Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detail}>
            Status: {transaction.status} · {transaction.timestamp}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 8,
    marginBottom: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', minHeight: 64 },
  cell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: APP_COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  particularsCell: {
    justifyContent: 'space-between',
    gap: 6,
  },
  particularsText: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'left',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  value: {
    color: APP_COLORS.textPrimary,
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  credit: { color: APP_COLORS.success },
  debit: { color: APP_COLORS.danger },
  details: { paddingHorizontal: 12, paddingBottom: 10 },
  detail: { color: APP_COLORS.textSecondary, fontSize: 12 },
});
