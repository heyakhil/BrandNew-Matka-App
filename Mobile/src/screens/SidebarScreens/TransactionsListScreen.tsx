import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Avatar, Card, Chip, Surface, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { WalletTransaction } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';

interface TransactionsListScreenProps {
  mode: 'withdraw_only' | 'all';
  transactions: WalletTransaction[];
}

export const TransactionsListScreen: React.FC<TransactionsListScreenProps> = ({
  mode,
  transactions,
}) => {
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdraw' | 'bet'>(
    mode === 'withdraw_only' ? 'withdraw' : 'all',
  );

  const items = useMemo(() => {
    if (mode === 'withdraw_only') {
      return transactions.filter(t => t.type === 'withdraw');
    }
    if (filter === 'all') {
      return transactions;
    }
    return transactions.filter(t => t.type === filter);
  }, [mode, transactions, filter]);

  return (
    <View style={styles.container}>
      {mode === 'all' && (
        <View style={styles.filterRow}>
          {(['all', 'deposit', 'withdraw', 'bet'] as const).map(key => {
            const active = filter === key;
            return (
              <Chip
                key={key}
                compact
                selected={active}
                onPress={() => setFilter(key)}
                style={[styles.chip, active && styles.chipActive]}
                textStyle={[styles.chipText, active && styles.chipTextActive]}>
                {key.toUpperCase()}
              </Chip>
            );
          })}
        </View>
      )}

      {items.length === 0 ? (
        <Card style={styles.emptyCard} mode="contained">
          <Card.Content style={styles.emptyContent}>
            <Surface style={styles.iconWrap} elevation={0}>
              <Avatar.Icon
                size={44}
                icon="history"
                color={APP_COLORS.accent}
                style={styles.transparentBg}
              />
            </Surface>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              {mode === 'withdraw_only'
                ? 'No Withdraw History Found'
                : 'No Transactions Found'}
            </Text>
            <Text variant="bodySmall" style={styles.emptySub}>
              Your recent activity will appear here once processed.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isCredit = item.type === 'deposit' || item.type === 'win';
            return (
              <Card style={styles.txCard} mode="contained">
                <Card.Content style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <Text variant="titleSmall" style={styles.txTitle}>
                      {item.title}
                    </Text>
                    <Text variant="labelSmall" style={styles.txTime}>
                      {item.timestamp} • {item.status}
                    </Text>
                  </View>
                  <Text
                    variant="titleMedium"
                    style={[
                      styles.txAmount,
                      {
                        color: isCredit
                          ? APP_COLORS.success
                          : APP_COLORS.danger,
                      },
                    ]}>
                    {isCredit ? '+' : '-'}
                    {formatRupees(item.amountRupees)}
                  </Text>
                </Card.Content>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  chip: {
    backgroundColor: APP_COLORS.secondary,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  chipActive: {
    backgroundColor: APP_COLORS.accentMuted,
    borderColor: APP_COLORS.accent,
  },
  chipText: {
    color: APP_COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: APP_COLORS.accent,
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  txCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 10,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  txLeft: {
    flex: 1,
  },
  txTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  txTime: {
    color: APP_COLORS.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontWeight: '800',
  },
  emptyCard: {
    margin: 14,
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: APP_COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
  },
});
