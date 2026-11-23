import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  DataTable,
  Divider,
  IconButton,
  Modal,
  Portal,
  Surface,
  Text,
} from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';

interface MarketChartModalProps {
  visible: boolean;
  market: MarketItem | null;
  onDismiss: () => void;
}

export const MarketChartModal: React.FC<MarketChartModalProps> = ({
  visible,
  market,
  onDismiss,
}) => {
  const [mode, setMode] = useState<'Jodi' | 'Panna'>('Jodi');
  if (!market) {
    return null;
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.wrapper}>
        <Surface style={styles.card} elevation={4}>
          <View style={styles.header}>
            <View>
              <Text variant="titleMedium" style={styles.title}>
                {market.name} {mode} Chart
              </Text>
              <Text variant="labelSmall" style={styles.sub}>
                Open {market.openTime} • Close {market.closeTime}
              </Text>
            </View>
            <IconButton
              icon="close"
              iconColor={APP_COLORS.textSecondary}
              onPress={onDismiss}
            />
          </View>
          <Divider style={styles.divider} />

          <DataTable>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title textStyle={styles.colHead}>Date</DataTable.Title>
              <DataTable.Title numeric textStyle={styles.colHead}>
                {mode}
              </DataTable.Title>
            </DataTable.Header>

            {market.recentChart.map(row => (
              <DataTable.Row key={row.date} style={styles.tableRow}>
                <DataTable.Cell textStyle={styles.dateText}>
                  {row.date}
                </DataTable.Cell>
                <DataTable.Cell numeric textStyle={styles.resultText}>
                  {mode === 'Jodi' ? (row.result.split('-')[1] ?? '—') : `${row.result.split('-')[0] ?? '—'} / ${row.result.split('-')[2] ?? '—'}`}
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>

          <View style={styles.footer}>
            <Button
              mode="contained"
              onPress={() => setMode('Jodi')}
              buttonColor={APP_COLORS.accent}
              textColor={APP_COLORS.onAccent}
              labelStyle={styles.btnLabel}>
              Jodi Chart
            </Button>
            <Button mode="outlined" onPress={() => setMode('Panna')} textColor={APP_COLORS.gradientStart}>Panna Chart</Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 10,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  sub: {
    color: APP_COLORS.textSecondary,
  },
  divider: {
    backgroundColor: APP_COLORS.border,
  },
  tableHeader: {
    borderBottomColor: APP_COLORS.border,
  },
  tableRow: {
    borderBottomColor: APP_COLORS.border,
  },
  colHead: {
    color: APP_COLORS.textSecondary,
    fontWeight: '700',
  },
  dateText: {
    color: APP_COLORS.textPrimary,
  },
  resultText: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  footer: {
    padding: 16,
    gap: 8,
  },
  btnLabel: {
    fontWeight: '800',
  },
});
