import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { ContactLinksRow } from '../../components/molecules/ContactLinksRow';
import { MarketCard } from '../../components/molecules/MarketCard';
import { NoticeTicker } from '../../components/molecules/NoticeTicker';
import { PromoHeroBanner } from '../../components/molecules/PromoHeroBanner';
import { QuickActionGrid } from '../../components/organisms/QuickActionGrid';
import type { MarketItem } from '../../types/matka';
import { styles } from './styles';

interface HomeScreenProps {
  markets: MarketItem[];
  onPlaceBet: (market: MarketItem) => void;
  onOpenChart: (market: MarketItem) => void;
  onOpenRates: () => void;
  onAddFunds: () => void;
  onWithdraw: () => void;
  onInvite: () => void;
  onWhatsAppPress: () => void;
  onTelegramPress: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  markets,
  onPlaceBet,
  onOpenChart,
  onOpenRates,
  onAddFunds,
  onWithdraw,
  onInvite,
  onWhatsAppPress,
  onTelegramPress,
}) => {
  const mainMarkets = useMemo(
    () => markets.filter(m => m.category === 'main'),
    [markets],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={mainMarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <NoticeTicker message="LIMIT : Minimum Bid ₹5 • Maximum Ank Bid ₹5000 • RoyalClubMatka never asks for your OTP" />
            <PromoHeroBanner onRatesPress={onOpenRates} />
            <QuickActionGrid
              onAddFunds={onAddFunds}
              onWithdraw={onWithdraw}
              onInvite={onInvite}
            />
            <ContactLinksRow
              onWhatsAppPress={onWhatsAppPress}
              onTelegramPress={onTelegramPress}
            />
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cards}>
            <MarketCard
              market={item}
              onPlaceBet={onPlaceBet}
              onOpenChart={onOpenChart}
            />
          </View>
        )}
      />
    </View>
  );
};
