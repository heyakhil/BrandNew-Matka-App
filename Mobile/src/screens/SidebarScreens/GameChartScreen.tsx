import React, { useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Icon, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { isRedJodiPair, sortMarketsByOpenTime } from '../../utils/matkaHelpers';

interface GameChartScreenProps {
  markets: MarketItem[];
  selectedChart: SelectedChart | null;
  onSelectChart: (chart: SelectedChart | null) => void;
}

export type ChartMode = 'Jodi' | 'Panel' | 'Panna';

export interface SelectedChart {
  market: MarketItem;
  mode: ChartMode;
}

interface ChartWeekRow {
  range: string;
  days: [string, string, string, string, string, string, string];
}

interface ParsedPanelData {
  open: [string, string, string];
  jodi: string;
  close: [string, string, string];
  isPlaceholder: boolean;
  isRed: boolean;
}

function parsePanelValue(val: string): ParsedPanelData {
  const trimmed = val.trim();
  if (
    !trimmed ||
    trimmed === '***' ||
    trimmed === 'XX' ||
    trimmed.toLowerCase() === 'x' ||
    trimmed === '***\nXX\n***'
  ) {
    return {
      open: ['x', 'x', 'x'],
      jodi: 'xx',
      close: ['x', 'x', 'x'],
      isPlaceholder: true,
      isRed: true,
    };
  }

  const parts = trimmed.split(/[\n\- ]+/).map(p => p.trim());
  if (
    parts.length === 3 &&
    parts[0].length === 3 &&
    parts[1].length === 2 &&
    parts[2].length === 3
  ) {
    const openDigits = parts[0].split('') as [string, string, string];
    const jodi = parts[1];
    const closeDigits = parts[2].split('') as [string, string, string];
    const isRed = isRedJodiPair(jodi);
    return {
      open: openDigits,
      jodi,
      close: closeDigits,
      isPlaceholder: false,
      isRed,
    };
  }

  return {
    open: ['x', 'x', 'x'],
    jodi: trimmed.length === 2 ? trimmed : 'xx',
    close: ['x', 'x', 'x'],
    isPlaceholder: true,
    isRed: true,
  };
}

const PanelCell: React.FC<{ value: string }> = ({ value }) => {
  const data = parsePanelValue(value);

  return (
    <View style={styles.panelBox}>
      {/* Row 1: Open Digit 0, Spacer, Close Digit 0 */}
      <View style={styles.panelRow}>
        <Text style={[styles.panelDigit, data.isRed && styles.redText]}>
          {data.open[0]}
        </Text>
        <View style={styles.jodiSpacer} />
        <Text style={[styles.panelDigit, data.isRed && styles.redText]}>
          {data.close[0]}
        </Text>
      </View>

      {/* Row 2: Open Digit 1, Jodi (center), Close Digit 1 */}
      <View style={styles.panelRow}>
        <Text style={[styles.panelDigit, data.isRed && styles.redText]}>
          {data.open[1]}
        </Text>
        <Text style={[styles.jodiCenterText, data.isRed && styles.redText]}>
          {data.jodi}
        </Text>
        <Text style={[styles.panelDigit, data.isRed && styles.redText]}>
          {data.close[1]}
        </Text>
      </View>

      {/* Row 3: Open Digit 2, Spacer, Close Digit 2 */}
      <View style={styles.panelRow}>
        <Text style={[styles.panelDigit, data.isRed && styles.redText]}>
          {data.open[2]}
        </Text>
        <View style={styles.jodiSpacer} />
        <Text style={[styles.panelDigit, data.isRed && styles.redText]}>
          {data.close[2]}
        </Text>
      </View>
    </View>
  );
};

const JodiCell: React.FC<{ value: string }> = ({ value }) => {
  const isPlaceholder = value === 'XX' || value === 'xx' || value === '***';
  const isRed = isPlaceholder || isRedJodiPair(value);

  return (
    <View style={styles.jodiBox}>
      <Text style={[styles.jodiOnlyText, isRed && styles.redText]}>
        {value}
      </Text>
    </View>
  );
};

const SAMPLE_JODI_WEEKS: ChartWeekRow[] = [
  { range: '2026-06-01\nTo\n2026-06-07', days: ['XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX'] },
  { range: '2026-06-08\nTo\n2026-06-14', days: ['XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX'] },
  { range: '2026-06-15\nTo\n2026-06-21', days: ['XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX'] },
  { range: '2026-08-03\nTo\n2026-08-09', days: ['XX', 'XX', '32', '81', '97', '15', '61'] },
  { range: '2026-08-10\nTo\n2026-08-16', days: ['76', '04', '94', '27', '59', 'XX', '53'] },
  { range: '2026-08-17\nTo\n2026-08-23', days: ['45', '22', '97', '15', '50', '89', '82'] },
  { range: '2026-08-24\nTo\n2026-08-30', days: ['53', '32', '51', '85', '14', '96', '16'] },
  { range: '2026-08-31\nTo\n2026-09-06', days: ['29', '53', '35', '71', '24', '69', '65'] },
];

const SAMPLE_PANEL_WEEKS: ChartWeekRow[] = [
  { range: '2026-06-01\nTo\n2026-06-07', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-06-08\nTo\n2026-06-14', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-06-15\nTo\n2026-06-21', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-06-22\nTo\n2026-06-28', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-06-29\nTo\n2026-07-05', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-07-06\nTo\n2026-07-12', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-07-13\nTo\n2026-07-19', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-07-20\nTo\n2026-07-26', days: ['***', '***', '***', '***', '***', '***', '***'] },
  { range: '2026-07-27\nTo\n2026-08-02', days: ['***', '***', '***', '***', '***', '***', '***'] },
  {
    range: '2026-08-03\nTo\n2026-08-09',
    days: [
      '***',
      '***',
      '229\n32\n679',
      '459\n81\n579',
      '568\n97\n273',
      '380\n15\n456',
      '240\n61\n215',
    ],
  },
  {
    range: '2026-08-10\nTo\n2026-08-16',
    days: [
      '124\n76\n358',
      '569\n04\n400',
      '135\n94\n158',
      '345\n27\n377',
      '366\n59\n379',
      '***',
      '348\n53\n689',
    ],
  },
  {
    range: '2026-08-17\nTo\n2026-08-23',
    days: [
      '455\n45\n249',
      '246\n22\n778',
      '270\n97\n250',
      '669\n15\n500',
      '348\n50\n578',
      '189\n89\n667',
      '350\n82\n778',
    ],
  },
  {
    range: '2026-08-24\nTo\n2026-08-30',
    days: [
      '357\n53\n120',
      '580\n32\n255',
      '447\n51\n245',
      '170\n85\n177',
      '335\n14\n130',
      '289\n96\n457',
      '470\n16\n123',
    ],
  },
  {
    range: '2026-08-31\nTo\n2026-09-06',
    days: [
      '720\n29\n340',
      '150\n53\n120',
      '670\n35\n230',
      '179\n71\n100',
      '680\n24\n130',
      '890\n69\n450',
      '270\n65\n140',
    ],
  },
];

export const GameChartScreen: React.FC<GameChartScreenProps> = ({
  markets,
  selectedChart,
  onSelectChart: setSelectedChart,
}) => {
  const insets = useSafeAreaInsets();
  const mainMarkets = useMemo(
    () => sortMarketsByOpenTime(markets.filter(m => m.category === 'main')),
    [markets],
  );

  if (selectedChart) {
    const isJodiMode = selectedChart.mode === 'Jodi';
    const rows = isJodiMode ? SAMPLE_JODI_WEEKS : SAMPLE_PANEL_WEEKS;

    return (
      <View style={styles.detailContainer}>
        {/* Detail Header matching App Header Theme */}
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={() => setSelectedChart(null)}
            activeOpacity={0.7}
            accessibilityLabel="Go back">
            <Icon source="chevron-left" size={26} color={APP_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1}>
            {selectedChart.market.name.toUpperCase()} {isJodiMode ? 'Jodi' : 'Panel'} Chart
          </Text>
        </View>

        {/* Mode Selector Tab Pills */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeTab, isJodiMode && styles.modeTabActive]}
            onPress={() => setSelectedChart({ ...selectedChart, mode: 'Jodi' })}>
            <Text style={[styles.modeTabText, isJodiMode && styles.modeTabTextActive]}>
              Jodi Chart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modeTab, !isJodiMode && styles.modeTabActive]}
            onPress={() => setSelectedChart({ ...selectedChart, mode: 'Panel' })}>
            <Text style={[styles.modeTabText, !isJodiMode && styles.modeTabTextActive]}>
              Panel Chart
            </Text>
          </TouchableOpacity>
        </View>

        {/* Themed Grid Table */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollArea}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View style={styles.tableWrapper}>
            {/* Table Header: Brand Dark Navy with White text */}
            <View style={styles.headerRow}>
              <View style={styles.headerDateCol}>
                <Text style={styles.headerText}>Date</Text>
              </View>
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                <View key={day} style={styles.headerDayCol}>
                  <Text style={styles.headerText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {rows.map(row => (
              <View key={row.range} style={styles.dataRow}>
                <View style={styles.dateCol}>
                  <Text style={styles.rangeText}>{row.range}</Text>
                </View>
                {row.days.map((val, idx) => (
                  <View key={`${row.range}-${idx}`} style={styles.dayCol}>
                    {isJodiMode ? (
                      <JodiCell value={val} />
                    ) : (
                      <PanelCell value={val} />
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
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
                  textColor={APP_COLORS.secondary}
                  onPress={() => setSelectedChart({ market: item, mode: 'Jodi' })}
                  style={styles.chartBtn}
                  labelStyle={styles.chartBtnLabel}>
                  Jodi
                </Button>
                <Button
                  mode="contained"
                  compact
                  buttonColor={APP_COLORS.accent}
                  textColor={APP_COLORS.secondary}
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
  detailContainer: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  scrollArea: {
    flex: 1,
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
    color: '#111827',
    fontSize: 15.5,
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

  /* Detail Header */
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_COLORS.primaryBackground,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.3,
  },

  /* Mode Switcher Tabs */
  modeTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 10,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLORS.secondary,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  modeTabActive: {
    backgroundColor: APP_COLORS.gradientStart,
    borderColor: APP_COLORS.gradientStart,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
  },
  modeTabTextActive: {
    color: APP_COLORS.white,
    fontWeight: '800',
  },

  /* Themed Grid Table Styles */
  tableWrapper: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.secondary,
    marginHorizontal: 4,
    marginBottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: APP_COLORS.gradientStart,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
  },
  headerDateCol: {
    width: 68,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  headerDayCol: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  headerText: {
    color: APP_COLORS.white,
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
  },

  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.secondary,
  },
  dateCol: {
    width: 68,
    borderRightWidth: 1,
    borderRightColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.secondaryElevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  rangeText: {
    color: APP_COLORS.textPrimary,
    fontSize: 8.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  dayCol: {
    flex: 1,
    minHeight: 48,
    borderRightWidth: 1,
    borderRightColor: APP_COLORS.border,
    backgroundColor: APP_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },

  /* Panel Cell 3-part layout (Open Panna vertical, Jodi center, Close Panna vertical) */
  panelBox: {
    width: '100%',
    paddingVertical: 2,
    paddingHorizontal: 1,
    justifyContent: 'space-between',
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 14,
  },
  panelDigit: {
    width: 10,
    fontSize: 10,
    fontWeight: '700',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
  },
  jodiCenterText: {
    flex: 1,
    fontSize: 10.5,
    fontWeight: '800',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
  },
  jodiSpacer: {
    flex: 1,
  },

  /* Jodi-only Box */
  jodiBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  jodiOnlyText: {
    fontSize: 13,
    fontWeight: '800',
    color: APP_COLORS.textPrimary,
    textAlign: 'center',
  },

  redText: {
    color: APP_COLORS.danger,
  },
});
