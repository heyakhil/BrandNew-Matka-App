import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import {
  Avatar,
  Card,
  Chip,
  IconButton,
  Surface,
  Text,
} from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { BidRecord } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';
import { styles } from './styles';

interface BidHistoryScreenProps {
  bids: BidRecord[];
}

const DATE_FILTERS = ['Today', 'Yesterday', 'All Dates'] as const;

export const BidHistoryScreen: React.FC<BidHistoryScreenProps> = ({ bids }) => {
  const [dateIndex, setDateIndex] = useState(0);
  const currentFilter = DATE_FILTERS[dateIndex];

  const filteredBids = useMemo(() => {
    if (currentFilter === 'Yesterday') {
      return [];
    }
    return bids;
  }, [bids, currentFilter]);

  const handleCycleDate = (delta: number): void => {
    setDateIndex(prev => (prev + delta + DATE_FILTERS.length) % DATE_FILTERS.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        <View style={styles.dateRow}>
          <IconButton
            icon="calendar"
            mode="contained"
            size={20}
            containerColor={APP_COLORS.accent}
            iconColor={APP_COLORS.onAccent}
            onPress={() => handleCycleDate(1)}
            accessibilityLabel="Switch date filter"
          />
          <Text variant="labelLarge" style={styles.dateLabel}>
            {currentFilter}
          </Text>
        </View>

        <View style={styles.navButtons}>
          <IconButton
            icon="chevron-left"
            mode="contained"
            size={20}
            containerColor={APP_COLORS.primaryBackground}
            iconColor={APP_COLORS.textPrimary}
            onPress={() => handleCycleDate(-1)}
            accessibilityLabel="Previous date"
          />
          <IconButton
            icon="chevron-right"
            mode="contained"
            size={20}
            containerColor={APP_COLORS.primaryBackground}
            iconColor={APP_COLORS.textPrimary}
            onPress={() => handleCycleDate(1)}
            accessibilityLabel="Next date"
          />
        </View>
      </View>

      {filteredBids.length === 0 ? (
        <Card style={styles.emptyCard} mode="contained">
          <Card.Content style={styles.emptyContent}>
            <Surface style={styles.searchBox} elevation={0}>
              <Avatar.Icon
                size={34}
                icon="magnify"
                color={APP_COLORS.accent}
                style={styles.searchIconBg}
              />
            </Surface>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Bid History Found
            </Text>
            <Text variant="bodySmall" style={styles.emptySubtitle}>
              Try adjusting your search or filters, or place a bet from Home.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={filteredBids}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card style={styles.bidCard} mode="contained">
              <Card.Content>
                <View style={styles.bidRow}>
                  <Text variant="titleSmall" style={styles.bidMarket}>
                    {item.marketName}
                  </Text>
                  <Chip
                    compact
                    style={styles.statusChip}
                    textStyle={styles.statusChipText}>
                    {item.status}
                  </Chip>
                </View>

                <View style={styles.bidRow}>
                  <Text variant="bodySmall" style={styles.bidMeta}>
                    {item.gameName} ({item.side.toUpperCase()})
                  </Text>
                  <Text variant="titleMedium" style={styles.bidNumber}>
                    #{item.number}
                  </Text>
                </View>

                <View style={styles.bidRow}>
                  <Text variant="labelSmall" style={styles.bidMeta}>
                    Stake: {formatRupees(item.stakeRupees)} • {item.timeLabel}
                  </Text>
                  <Text variant="labelMedium" style={{ color: APP_COLORS.success }}>
                    Win: {formatRupees(item.potentialWinRupees)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
};
