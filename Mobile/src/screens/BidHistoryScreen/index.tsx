import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Menu, Text } from 'react-native-paper';
import { GradientButton } from '../../components/atoms/GradientButton';
import { APP_COLORS } from '../../theme/paperTheme';
import type { BidRecord } from '../../types/matka';

interface BidHistoryScreenProps {
  bids: BidRecord[];
  onBack?: () => void;
}

const PAGE_SIZE = 10;

function formatShortBidId(id: string): string {
  const trimmed = id.trim();
  return trimmed.length > 10 ? trimmed.slice(-10).toUpperCase() : trimmed;
}

export const BidHistoryScreen: React.FC<BidHistoryScreenProps> = ({
  bids,
  onBack,
}) => {
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
        <View style={styles.toolbarLeft}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
              style={styles.backBtn}
            >
              <Icon source="chevron-left" size={28} color={APP_COLORS.textPrimary} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.title}>BID HISTORY</Text>
        </View>
        <Menu
          visible={filterOpen}
          onDismiss={() => setFilterOpen(false)}
          anchor={
            <TouchableOpacity
              onPress={() => setFilterOpen(true)}
              activeOpacity={0.7}
              accessibilityLabel="Filter game type"
              style={styles.filterBtn}
            >
              <Text style={styles.filterLabel}>
                {gameFilter === 'All Types' ? 'Filter Type' : gameFilter}
              </Text>
              <Icon
                source="filter-outline"
                size={22}
                color={APP_COLORS.textPrimary}
              />
            </TouchableOpacity>
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
      <FlatList
        data={filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No bid history found</Text>
        }
        renderItem={({ item }) => <BidHistoryCard bid={item} />}
      />
      <View style={styles.pagination}>
        <GradientButton
          label="PREVIOUS"
          fontSize={13}
          disabled={safePage === 0}
          onPress={() => setPage(safePage - 1)}
          style={styles.pageButton}
        />
        <View style={styles.pageCount}>
          <Text style={styles.pageCountText}>
            ({safePage + 1}/{totalPages})
          </Text>
        </View>
        <GradientButton
          label="NEXT"
          fontSize={13}
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
      <Column label="Game Type" value={bid.gameName} boldValue />
      <Column label="Digits" value={bid.number} boldValue />
      <Column label="Points" value={String(bid.stakeRupees)} boldValue />
    </View>
    <View style={styles.columns}>
      <Column label="Bid Id" value={formatShortBidId(bid.id)} />
      <Column label="Bid Date" value={bid.dateLabel} />
    </View>
    <Text style={styles.transactionTime}>
      Transaction Time : {bid.timeLabel}
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
        ? `Congratulations. You Won (${bid.potentialWinRupees.toFixed(1)}) 👍`
        : bid.status === 'Lost'
        ? 'Better luck next time 👎'
        : bid.status === 'Refunded'
        ? 'Stake refunded'
        : 'Result pending'}
    </Text>
  </View>
);

const Column: React.FC<{ label: string; value: string; boldValue?: boolean }> = ({
  label,
  value,
  boldValue = false,
}) => (
  <View style={styles.column}>
    <Text style={styles.columnLabel}>{label}</Text>
    <Text
      style={[styles.columnValue, boldValue && styles.columnValueBold]}
      numberOfLines={2}
    >
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
    height: 54,
    paddingHorizontal: 10,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: APP_COLORS.textPrimary,
    letterSpacing: 0.4,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  filterLabel: {
    fontSize: 14,
    color: APP_COLORS.textPrimary,
    fontWeight: '400',
  },
  list: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 16 },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: APP_COLORS.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: APP_COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 2,
  },
  market: {
    backgroundColor: APP_COLORS.accent,
    textAlign: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    color: APP_COLORS.white,
  },
  columns: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: APP_COLORS.border,
  },
  column: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  columnLabel: {
    color: APP_COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  columnValue: {
    color: APP_COLORS.textPrimary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  columnValueBold: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionTime: {
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    color: APP_COLORS.textPrimary,
  },
  outcome: {
    textAlign: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    fontSize: 13.5,
    fontWeight: '500',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: APP_COLORS.border,
  },
  won: { color: APP_COLORS.success },
  lost: { color: APP_COLORS.danger },
  pending: { color: APP_COLORS.textSecondary },
  pagination: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  pageButton: { flex: 1 },
  pageCount: {
    flex: 1,
    height: 48,
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageCountText: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
