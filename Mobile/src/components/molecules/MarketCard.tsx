import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Surface, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { StatusBadge } from '../atoms/StatusBadge';

interface MarketCardProps {
  market: MarketItem;
  onPlaceBet: (market: MarketItem) => void;
  onOpenChart: (market: MarketItem) => void;
}

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onPlaceBet,
  onOpenChart,
}) => {
  const isClosed = market.status === 'closed';

  return (
    <Card style={styles.card} mode="contained">
      <Card.Content style={styles.content}>
        <View style={styles.topRow}>
          <Text variant="titleMedium" style={styles.marketName} numberOfLines={1}>
            {market.name}
          </Text>
          <Text variant="titleMedium" style={styles.resultLine}>
            {market.resultLine}
          </Text>
        </View>

        <View style={styles.midRow}>
          <View style={styles.statusWrap}>
            <StatusBadge status={market.status} />
          </View>
          <IconButton
            icon="chart-donut"
            mode="contained"
            size={20}
            containerColor={APP_COLORS.accentMuted}
            iconColor={APP_COLORS.accent}
            onPress={() => onOpenChart(market)}
            accessibilityLabel={`View chart for ${market.name}`}
            style={styles.chartButton}
          />
        </View>

        <View style={styles.bottomRow}>
          <Surface style={styles.timingsSurface} elevation={0}>
            <View style={styles.timingBlock}>
              <Text variant="labelSmall" style={styles.timingLabel}>
                Open
              </Text>
              <Text variant="labelMedium" style={styles.timingValue}>
                {market.openTime}
              </Text>
            </View>
            <View style={styles.timingDivider} />
            <View style={styles.timingBlock}>
              <Text variant="labelSmall" style={styles.timingLabel}>
                Close
              </Text>
              <Text variant="labelMedium" style={styles.timingValue}>
                {market.closeTime}
              </Text>
            </View>
          </Surface>

          <Button
            mode="contained"
            compact
            disabled={isClosed}
            onPress={() => onPlaceBet(market)}
            buttonColor={isClosed ? APP_COLORS.border : APP_COLORS.accent}
            textColor={
              isClosed ? APP_COLORS.textSecondary : APP_COLORS.primaryBackground
            }
            style={styles.placeBetButton}
            labelStyle={styles.placeBetLabel}>
            {isClosed ? 'Closed' : 'Place Bet'}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 12,
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  marketName: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  resultLine: {
    color: APP_COLORS.accent,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  midRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  statusWrap: {
    flex: 1,
  },
  chartButton: {
    margin: 0,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  timingsSurface: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.primaryBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timingBlock: {
    flex: 1,
  },
  timingLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 10,
  },
  timingValue: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  timingDivider: {
    width: 1,
    height: 22,
    backgroundColor: APP_COLORS.border,
    marginHorizontal: 8,
  },
  placeBetButton: {
    borderRadius: 10,
    minWidth: 100,
  },
  placeBetLabel: {
    fontWeight: '800',
    fontSize: 13,
  },
});
