import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RateListItem } from '../../components/molecules/RateListItem';
import { GAME_WIN_RATES } from '../../data/mockData';
import { styles } from './styles';

export const GameRatesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        <Text variant="titleLarge" style={styles.heading}>
          Game Win Rates
        </Text>
        <Text variant="bodySmall" style={styles.subheading}>
          Standard payout rates per ₹10 bet across main markets
        </Text>

        {GAME_WIN_RATES.map(rate => (
          <RateListItem key={rate.id} rate={rate} />
        ))}
      </ScrollView>
    </View>
  );
};
