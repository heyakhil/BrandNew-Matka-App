import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, IconButton, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { isRedJodiPair } from '../../utils/matkaHelpers';

interface GameChartScreenProps {
  markets: MarketItem[];
  selectedChart: SelectedChart | null;
  onSelectChart: (chart: SelectedChart | null) => void;
}

export interface SelectedChart {
  market: MarketItem;
  mode: 'Jodi' | 'Panel';
}

interface ChartWeekRow {
  range: string;
  days: [string, string, string, string, string, string, string];
}

const SAMPLE_JODI_WEEKS: ChartWeekRow[] = [
  { range: '2026-10-12\nTo\n2026-10-18', days: ['XX', 'XX', '32', '81', '97', '15', '61'] },
  { range: '2026-10-19\nTo\n2026-10-25', days: ['76', '04', '94', '27', '59', 'XX', '53'] },
  { range: '2026-10-26\nTo\n2026-11-01', days: ['45', '22', '97', '15', '50', '89', '82'] },
  { range: '2026-11-02\nTo\n2026-11-08', days: ['53', '32', '51', '85', '14', '96', '16'] },
  { range: '2026-11-09\nTo\n2026-11-15', days: ['29', '53', '35', '71', '24', '69', '65'] },
];

const SAMPLE_PANEL_WEEKS: ChartWeekRow[] = [
  {
    range: '2026-10-12\nTo\n2026-10-18',
    days: ['***', '***', '139\n32\n480', '236\n81\n146', '359\n97\n250', '128\n15\n456', '240\n61\n380'],
  },
  {
    range: '2026-10-19\nTo\n2026-10-25',
    days: ['340\n76\n150', '130\n04\n248', '360\n94\n149', '250\n27\n340', '140\n59\n450', '***', '580\n53\n120'],
  },
  {
    range: '2026-10-26\nTo\n2026-11-01',
    days: ['456\n45\n230', '129\n22\n570', '368\n97\n160', '113\n15\n230', '500\n50\n190', '270\n89\n450', '260\n82\n110'],
  },
  {
    range: '2026-11-02\nTo\n2026-11-08',
    days: ['580\n53\n120', '120\n32\n480', '560\n51\n100', '350\n85\n140', '239\n14\n220', '360\n96\n150', '169\n16\n240'],
  },
  {
    range: '2026-11-09\nTo\n2026-11-15',
    days: ['270\n29\n450', '580\n53\n120', '120\n35\n230', '340\n71\n100', '248\n24\n130', '360\n69\n450', '240\n65\n140'],
  },
];

export const GameChartScreen: React.FC<GameChartScreenProps> = ({
  markets,
  selectedChart,
  onSelectChart: setSelectedChart,
}) => {
  const mainMarkets = useMemo(
    () => markets.filter(m => m.category === 'main'),
    [markets],
  );

  if (selectedChart) {
    const rows =
      selectedChart.mode === 'Jodi' ? SAMPLE_JODI_WEEKS : SAMPLE_PANEL_WEEKS;

    return (
      <View style={styles.container}>
        <View style={styles.detailHeader}>
          <IconButton
            icon="arrow-left"
            iconColor={APP_COLORS.textPrimary}
            onPress={() => setSelectedChart(null)}
          />
          <Text variant="titleMedium" style={styles.detailTitle} numberOfLines={1}>
            {selectedChart.market.name} {selectedChart.mode} Chart
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <DataTable style={styles.table}>
            <DataTable.Header style={styles.tableHeader}>
              <DataTable.Title style={styles.dateCol} textStyle={styles.headText}>
                Date
              </DataTable.Title>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <DataTable.Title
                  key={day}
                  style={styles.dayCol}
                  textStyle={styles.headText}>
                  {day}
                </DataTable.Title>
              ))}
            </DataTable.Header>

            {rows.map(row => (
              <DataTable.Row key={row.range} style={styles.tableRow}>
                <DataTable.Cell style={styles.dateCol}>
                  <Text variant="labelSmall" style={styles.rangeText}>
                    {row.range}
                  </Text>
                </DataTable.Cell>
                {row.days.map((val, idx) => {
                  const isRed =
                    val === 'XX' ||
                    val === '***' ||
                    (selectedChart.mode === 'Jodi' && isRedJodiPair(val));
                  return (
                    <DataTable.Cell key={`${row.range}-${idx}`} style={styles.dayCol}>
                      <Text
                        variant="labelSmall"
                        style={[
                          styles.cellText,
                          isRed && styles.redCellText,
                        ]}>
                        {val}
                      </Text>
                    </DataTable.Cell>
                  );
                })}
              </DataTable.Row>
            ))}
          </DataTable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={mainMarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card style={styles.marketRowCard} mode="contained">
            <Card.Content style={styles.marketRow}>
              <Text variant="titleSmall" style={styles.marketName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.btnGroup}>
                <Button
                  mode="contained"
                  compact
                  buttonColor={APP_COLORS.danger}
                  textColor={APP_COLORS.textPrimary}
                  onPress={() => setSelectedChart({ market: item, mode: 'Jodi' })}
                  style={styles.chartBtn}
                  labelStyle={styles.chartBtnLabel}>
                  Jodi
                </Button>
                <Button
                  mode="contained"
                  compact
                  buttonColor={APP_COLORS.accent}
                  textColor={APP_COLORS.onAccent}
                  onPress={() => setSelectedChart({ market: item, mode: 'Panel' })}
                  style={styles.chartBtn}
                  labelStyle={styles.chartBtnLabel}>
                  Panel
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  listContent: {
    padding: 14,
    paddingBottom: 24,
  },
  marketRowCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 10,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 10,
  },
  marketName: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  chartBtn: {
    borderRadius: 8,
    minWidth: 66,
  },
  chartBtnLabel: {
    fontWeight: '800',
    fontSize: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    paddingRight: 12,
  },
  detailTitle: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  table: {
    backgroundColor: APP_COLORS.secondary,
  },
  tableHeader: {
    backgroundColor: APP_COLORS.primaryBackground,
    borderBottomColor: APP_COLORS.border,
  },
  tableRow: {
    borderBottomColor: APP_COLORS.border,
    minHeight: 62,
  },
  dateCol: {
    flex: 1.5,
    justifyContent: 'center',
  },
  dayCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headText: {
    color: APP_COLORS.accent,
    fontWeight: '800',
    fontSize: 11,
  },
  rangeText: {
    color: APP_COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 12,
  },
  cellText: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  redCellText: {
    color: APP_COLORS.danger,
  },
});
