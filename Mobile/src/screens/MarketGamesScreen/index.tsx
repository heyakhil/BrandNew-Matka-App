import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { Avatar, Card, Text } from 'react-native-paper';
import { MARKET_GAME_OPTIONS } from '../../data/mockData';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketGameOption, MarketItem } from '../../types/matka';
import { styles } from './styles';

interface MarketGamesScreenProps {
  market: MarketItem;
  onSelectGame: (game: MarketGameOption) => void;
}

export const MarketGamesScreen: React.FC<MarketGamesScreenProps> = ({
  market,
  onSelectGame,
}) => {
  const isCloseOnly = market.status === 'close_running';

  const visibleGames = useMemo(() => {
    if (market.category === 'jackpot') {
      return MARKET_GAME_OPTIONS.filter(g => ['JD', 'JDB', 'RB'].includes(g.id));
    }
    return MARKET_GAME_OPTIONS.filter(g => !['DBJ', 'PG'].includes(g.id));
  }, [market.category]);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.headerTitle}>
        {market.name}
      </Text>

      <FlatList
        data={visibleGames}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const disabled = isCloseOnly && ['HS', 'FS'].includes(item.id);
          return (
            <Card
              style={[styles.card, disabled && styles.cardDisabled]}
              mode="contained"
              onPress={disabled ? undefined : () => onSelectGame(item)}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Icon
                  size={48}
                  icon={item.icon}
                  color={APP_COLORS.textPrimary}
                  style={[styles.iconCircle, { backgroundColor: item.color }]}
                />
                <View
                  style={[styles.accentBar, { backgroundColor: item.color }]}
                />
                <Text
                  variant="labelLarge"
                  style={styles.cardTitle}
                  numberOfLines={2}>
                  {item.title}
                </Text>
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
};
