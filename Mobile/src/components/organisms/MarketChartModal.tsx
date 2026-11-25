import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Icon, Modal, Portal, Surface, Text } from 'react-native-paper';
import type { MarketItem } from '../../types/matka';

interface MarketChartModalProps {
  visible: boolean;
  market: MarketItem | null;
  onDismiss: () => void;
  onSelectChart: (market: MarketItem, mode: 'Jodi' | 'Panna') => void;
}

export const MarketChartModal: React.FC<MarketChartModalProps> = ({
  visible,
  market,
  onDismiss,
  onSelectChart,
}) => {
  if (!market) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.wrapper}>
        <Surface style={styles.card} elevation={3}>
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title} numberOfLines={1}>
              {market.name.toUpperCase()} Charts
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onDismiss}
              activeOpacity={0.7}
              accessibilityLabel="Close chart popup">
              <Icon source="close" size={16} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.content}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.chartBtn, styles.jodiBtn]}
              onPress={() => {
                onDismiss();
                onSelectChart(market, 'Jodi');
              }}>
              <Icon source="view-grid" size={22} color="#FFFFFF" />
              <Text style={styles.btnText}>Jodi Chart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.chartBtn, styles.pannaBtn]}
              onPress={() => {
                onDismiss();
                onSelectChart(market, 'Panna');
              }}>
              <Icon source="card-multiple" size={22} color="#FFFFFF" />
              <Text style={styles.btnText}>Panna Chart</Text>
            </TouchableOpacity>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerSpacer: {
    width: 28,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  divider: {
    backgroundColor: '#E5E7EB',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  chartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  jodiBtn: {
    backgroundColor: '#273896',
  },
  pannaBtn: {
    backgroundColor: '#F58220',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
