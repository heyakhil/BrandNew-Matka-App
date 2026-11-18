import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { ResultGridCard } from '../../components/molecules/ResultGridCard';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MarketItem } from '../../types/matka';
import { styles } from './styles';

interface GameResultScreenProps {
  markets: MarketItem[];
  onSelectMarket: (market: MarketItem) => void;
}

export const GameResultScreen: React.FC<GameResultScreenProps> = ({
  markets,
  onSelectMarket,
}) => {
  const [query, setQuery] = useState('');

  const mainMarkets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return markets
      .filter(m => m.category === 'main')
      .filter(m => (q ? m.name.toLowerCase().includes(q) : true));
  }, [markets, query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Searchbar
          placeholder="Search market result..."
          value={query}
          onChangeText={setQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          placeholderTextColor={APP_COLORS.textSecondary}
          iconColor={APP_COLORS.accent}
        />
      </View>

      <FlatList
        data={mainMarkets}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ResultGridCard market={item} onPress={onSelectMarket} />
        )}
      />
    </View>
  );
};
