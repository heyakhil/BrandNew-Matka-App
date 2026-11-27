import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Modal, Portal, Surface, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { ChartOptionCard } from '../molecules/ChartOptionCard';

interface MarketChartModalProps {
  visible: boolean;
  market: MarketItem | null;
  onDismiss: () => void;
  onSelectChart: (market: MarketItem, mode: 'Jodi' | 'Panna') => void;
}

const PANNA_BADGE_BG = '#FAA038';

const PannaStackIcon: React.FC = () => (
  <View style={styles.pannaStackBox} accessibilityElementsHidden>
    <View style={[styles.pannaSquare, styles.pannaSquareBack]} />
    <View style={[styles.pannaSquare, styles.pannaSquareMid]} />
    <View style={[styles.pannaSquare, styles.pannaSquareFront]} />
  </View>
);

export const MarketChartModal: React.FC<MarketChartModalProps> = ({
  visible,
  market,
  onDismiss,
  onSelectChart,
}) => {
  if (!market) {
    return null;
  }

  const handleSelect = (mode: 'Jodi' | 'Panna'): void => {
    onDismiss();
    onSelectChart(market, mode);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.wrapper}>
        <Surface style={styles.card} elevation={4}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Close chart popup">
            <Icon source="close" size={19} color="#6E6960" />
          </TouchableOpacity>

          <Text style={styles.overline}>CHARTS</Text>
          <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
            {market.name.toUpperCase()}
          </Text>

          <View style={styles.optionsRow}>
            <ChartOptionCard
              title="Jodi"
              subtitle="Digit pair"
              backgroundColor="#1B2C87"
              iconBadgeColor="rgba(255, 255, 255, 0.16)"
              icon={<Icon source="view-grid-outline" size={24} color={APP_COLORS.white} />}
              onPress={() => handleSelect('Jodi')}
              accessibilityLabel={`Open ${market.name} Jodi chart`}
            />

            <ChartOptionCard
              title="Panna"
              subtitle={'3-digit\npanel'}
              backgroundColor="#F98500"
              iconBadgeColor={PANNA_BADGE_BG}
              icon={<PannaStackIcon />}
              onPress={() => handleSelect('Panna')}
              accessibilityLabel={`Open ${market.name} Panna chart`}
            />
          </View>

          <Text style={styles.footerText}>
            {"Tap a chart to view today's numbers"}
          </Text>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 22,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: APP_COLORS.white,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 22,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFECE6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  overline: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.6,
    color: '#A61C3C',
  },
  title: {
    marginTop: 4,
    paddingHorizontal: 38,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#1C1B18',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 22,
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#736E66',
  },
  pannaStackBox: {
    width: 22,
    height: 22,
    position: 'relative',
  },
  pannaSquare: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 3.2,
    borderWidth: 1.8,
    borderColor: APP_COLORS.white,
    backgroundColor: PANNA_BADGE_BG,
  },
  pannaSquareBack: {
    top: 2,
    left: 2,
  },
  pannaSquareMid: {
    top: 6,
    left: 6,
  },
  pannaSquareFront: {
    top: 10,
    left: 10,
  },
});
