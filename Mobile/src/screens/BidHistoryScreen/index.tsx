import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { IconButton, Menu, Text } from 'react-native-paper';
import { GradientButton } from '../../components/atoms/GradientButton';
import { APP_COLORS } from '../../theme/paperTheme';
import type { BidRecord } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';

interface BidHistoryScreenProps {
  bids: BidRecord[];
}

const PAGE_SIZE = 10;

export const BidHistoryScreen: React.FC<BidHistoryScreenProps> = ({ bids }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [gameFilter, setGameFilter] = useState('All Types');
  const [page, setPage] = useState(0);
  const gameTypes = useMemo(
    () => [...new Set(bids.map(bid => bid.gameName))],
    [bids],
  );
  const filtered = useMemo(
    () =>
      bids.filter(
        bid => gameFilter === 'All Types' || bid.gameName === gameFilter,
      ),
    [bids, gameFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.title}>BID HISTORY</Text>
        <Menu
          visible={filterOpen}
          onDismiss={() => setFilterOpen(false)}
          anchor={
            <IconButton
              icon="filter-variant"
              accessibilityLabel="Filter game type"
              onPress={() => setFilterOpen(true)}
            />
          }
        >
          {['All Types', ...gameTypes].map(type => (
            <Menu.Item
              key={type}
              title={type}
              onPress={() => {
                setGameFilter(type);
                setPage(0);
                setFilterOpen(false);
              }}
            />
          ))}
        </Menu>
      </View>
      <Text style={styles.filterLabel}>Filter Type: {gameFilter}</Text>
      <FlatList
        data={filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No bid history found</Text>
        }
        renderItem={({ item }) => <BidHistoryCard bid={item} />}
      />
      <View style={styles.pagination}>
        <GradientButton
          label="PREVIOUS"
          disabled={safePage === 0}
          onPress={() => setPage(safePage - 1)}
          style={styles.pageButton}
        />
        <View style={styles.pageCount}>
          <Text>
            ({safePage + 1}/{totalPages})
          </Text>
        </View>
        <GradientButton
          label="NEXT"
          disabled={safePage >= totalPages - 1}
          onPress={() => setPage(safePage + 1)}
          style={styles.pageButton}
        />
      </View>
    </View>
  );
};

const BidHistoryCard: React.FC<{ bid: BidRecord }> = ({ bid }) => (
  <View style={styles.card}>
    <Text style={styles.market}>
      {bid.marketName}
      {bid.side === 'full' ? '' : ` (${bid.side})`}
    </Text>
    <View style={styles.columns}>
      <Column label="Game Type" value={bid.gameName} />
      <Column label="Digits" value={bid.number} />
      <Column label="Points" value={String(bid.stakeRupees)} />
    </View>
    <View style={styles.columns}>
      <Column label="Bid ID" value={bid.id} />
      <Column label="Bid Date" value={bid.dateLabel} />
    </View>
    <Text style={styles.transactionTime}>
      Transaction Time: {bid.timeLabel}
    </Text>
    <Text
      style={[
        styles.outcome,
        bid.status === 'Won'
          ? styles.won
          : bid.status === 'Lost'
          ? styles.lost
          : styles.pending,
      ]}
    >
      {bid.status === 'Won'
        ? `Congratulations! You Won ${formatRupees(bid.potentialWinRupees)}`
        : bid.status === 'Lost'
        ? 'Better luck next time'
        : bid.status === 'Refunded'
        ? 'Stake refunded'
        : 'Result pending'}
    </Text>
  </View>
);

const Column: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.column}>
    <Text style={styles.columnLabel}>{label}</Text>
    <Text style={styles.columnValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: APP_COLORS.primaryBackground },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: { fontSize: 19, color: APP_COLORS.textPrimary },
  filterLabel: {
    textAlign: 'right',
    marginRight: 20,
    marginBottom: 6,
    color: APP_COLORS.textSecondary,
  },
  list: { paddingHorizontal: 10, paddingBottom: 16 },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: APP_COLORS.textSecondary,
  },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 2,
  },
  market: {
    backgroundColor: APP_COLORS.primaryBackground,
    textAlign: 'center',
    padding: 12,
    fontSize: 18,
    color: APP_COLORS.white,
  },
  columns: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: APP_COLORS.border,
  },
  column: { flex: 1, alignItems: 'center', paddingHorizontal: 3 },
  columnLabel: {
    color: APP_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  columnValue: {
    color: APP_COLORS.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  transactionTime: {
    textAlign: 'center',
    padding: 10,
    color: APP_COLORS.textPrimary,
  },
  outcome: {
    textAlign: 'center',
    padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: APP_COLORS.border,
  },
  won: { color: APP_COLORS.success },
  lost: { color: APP_COLORS.danger },
  pending: { color: APP_COLORS.textSecondary },
  pagination: { flexDirection: 'row', gap: 8, padding: 10 },
  pageButton: { flex: 1 },
  pageCount: {
    flex: 1,
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
