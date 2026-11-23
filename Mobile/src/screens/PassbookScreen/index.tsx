import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { GradientButton } from '../../components/atoms/GradientButton';
import { PassbookRow } from '../../components/molecules/PassbookRow';
import { APP_COLORS } from '../../theme/paperTheme';
import type { WalletTransaction } from '../../types/matka';

interface PassbookScreenProps {
  transactions: WalletTransaction[];
  emptyText?: string;
}

const PAGE_SIZE = 10;

export const PassbookScreen: React.FC<PassbookScreenProps> = ({
  transactions,
  emptyText = 'No transactions found',
}) => {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));

  useEffect(() => {
    setPage(prev => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const pageItems = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <View style={styles.container}>
      <View style={styles.tableHeader}>
        <Text style={styles.headerText}>Previous Amount</Text>
        <Text style={styles.headerText}>Transaction Amount</Text>
        <Text style={styles.headerText}>Current Amount</Text>
      </View>

      <FlatList
        data={pageItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.empty}>{emptyText}</Text>}
        renderItem={({ item }) => <PassbookRow transaction={item} />}
      />

      <View style={styles.pagination}>
        <GradientButton
          label="PREVIOUS"
          fontSize={13}
          disabled={page === 0}
          onPress={() => setPage(prev => prev - 1)}
          style={styles.pageButton}
        />
        <View style={styles.pageCounter}>
          <Text style={styles.pageText}>
            ({page + 1}/{totalPages})
          </Text>
        </View>
        <GradientButton
          label="NEXT"
          fontSize={13}
          disabled={page >= totalPages - 1}
          onPress={() => setPage(prev => prev + 1)}
          style={styles.pageButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  tableHeader: {
    flexDirection: 'row',
    height: 48,
  },
  headerText: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontSize: 11,
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 2,
  },
  list: {
    paddingHorizontal: 6,
    paddingBottom: 12,
  },
  empty: {
    color: APP_COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 32,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pageButton: {
    flex: 1,
  },
  pageCounter: {
    flex: 1,
    height: 48,
    backgroundColor: APP_COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageText: {
    color: APP_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
