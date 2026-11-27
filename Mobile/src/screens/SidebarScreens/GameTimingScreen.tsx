import React, { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { formatDisplayTime, sortMarketsByOpenTime } from '../../utils/matkaHelpers';

interface GameTimingScreenProps {
  markets: MarketItem[];
}

export const GameTimingScreen: React.FC<GameTimingScreenProps> = ({
  markets,
}) => {
  const mainMarkets = useMemo(
    () => sortMarketsByOpenTime(markets.filter(m => m.category === 'main')),
    [markets],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mainMarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.content}>
              <View style={styles.row}>
                <Text variant="labelLarge" style={styles.label}>
                  BAZAR NAME
                </Text>
                <Text variant="labelLarge" style={styles.colon}>
                  :
                </Text>
                <Text variant="titleSmall" style={styles.bazarValue}>
                  {item.name}
                </Text>
              </View>

              <View style={styles.row}>
                <Text variant="labelLarge" style={styles.label}>
                  OPEN TIME
                </Text>
                <Text variant="labelLarge" style={styles.colon}>
                  :
                </Text>
                <Text variant="bodyMedium" style={styles.timeValue}>
                  {formatDisplayTime(item.openTime)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text variant="labelLarge" style={styles.label}>
                  CLOSE TIME
                </Text>
                <Text variant="labelLarge" style={styles.colon}>
                  :
                </Text>
                <Text variant="bodyMedium" style={styles.timeValue}>
                  {formatDisplayTime(item.closeTime)}
                </Text>
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
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    marginBottom: 12,
  },
  content: {
    gap: 8,
    paddingVertical: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    width: 118,
    color: APP_COLORS.textSecondary,
    fontWeight: '700',
  },
  colon: {
    width: 18,
    color: APP_COLORS.textSecondary,
  },
  bazarValue: {
    flex: 1,
    color: '#111827',
    fontSize: 15.5,
    fontWeight: '800',
  },
  timeValue: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
});
