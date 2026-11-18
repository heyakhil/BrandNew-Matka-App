import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { GradientCircle } from '../atoms/GradientCircle';
import { StatusBadge } from '../atoms/StatusBadge';

interface MarketCardProps {
  market: MarketItem;
  onPlaceBet: (market: MarketItem) => void;
  onOpenChart: (market: MarketItem) => void;
}

interface BidTimeProps {
  label: string;
  value: string;
}

const BidTime: React.FC<BidTimeProps> = ({ label, value }) => (
  <View>
    <Text style={styles.timeLabel}>{label} :</Text>
    <Text style={styles.timeValue}>{value}</Text>
  </View>
);

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  onPlaceBet,
  onOpenChart,
}) => {
  const isClosed = market.status === 'closed';

  return (
    <View style={styles.card}>
      <GradientCircle
        size={44}
        onPress={() => onOpenChart(market)}
        accessibilityLabel={`View chart for ${market.name}`}>
        <Icon source="chart-bar" size={26} color={APP_COLORS.white} />
      </GradientCircle>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
          {market.name}
        </Text>
        <Text style={styles.result}>{market.resultLine}</Text>
        <View style={styles.timings}>
          <BidTime label="Open Bids" value={market.openTime} />
          <BidTime label="Close Bids" value={market.closeTime} />
        </View>
      </View>

      <View style={styles.play}>
        <StatusBadge status={market.status} />
        <GradientCircle
          size={44}
          disabled={isClosed}
          onPress={() => onPlaceBet(market)}
          accessibilityLabel={`Play ${market.name}`}>
          <Icon source="play" size={30} color={APP_COLORS.white} />
        </GradientCircle>
        <Text style={styles.playLabel}>Play Game</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    elevation: 3,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  info: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'center',
  },
  name: {
    color: APP_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  result: {
    color: APP_COLORS.gradientStart,
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 2,
  },
  timings: {
    flexDirection: 'row',
    gap: 18,
  },
  timeLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 12,
  },
  timeValue: {
    color: APP_COLORS.textSecondary,
    fontSize: 14,
  },
  play: {
    width: 96,
    alignItems: 'center',
    gap: 4,
  },
  playLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 12,
  },
});
