import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { ContactLinksRow } from '../../components/molecules/ContactLinksRow';
import { MarketCard } from '../../components/molecules/MarketCard';
import { NoticeTicker } from '../../components/molecules/NoticeTicker';
import { PromoHeroBanner } from '../../components/molecules/PromoHeroBanner';
import { QuickActionGrid } from '../../components/organisms/QuickActionGrid';
import type { MarketItem } from '../../types/matka';
import { APP_COLORS } from '../../theme/paperTheme';
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
  const [closedMarket, setClosedMarket] = useState<MarketItem | null>(null);
  const mainMarkets = useMemo(
    () => markets.filter(m => m.category === 'main'),
    [markets],
  );

  return (
    <View style={styles.container}>
      <NoticeTicker message="LIMIT : Minimum Bid ₹10 • Maximum Bid ₹10000 • RoyalClubMatka never asks for your OTP" />
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
      <FlatList
        style={styles.marketList}
        data={mainMarkets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.cards}>
            <MarketCard
              market={item}
              onPlaceBet={market => market.status === 'closed' ? setClosedMarket(market) : onPlaceBet(market)}
              onOpenChart={onOpenChart}
            />
          </View>
        )}
      />
      <Portal>
        <Dialog visible={closedMarket !== null} onDismiss={() => setClosedMarket(null)} style={{ backgroundColor: APP_COLORS.white }}>
          <Dialog.Icon icon="close-circle-outline" color={APP_COLORS.danger} size={40} />
          <Dialog.Title style={{ textAlign: 'center', color: APP_COLORS.danger }}>Bidding is Closed For Today</Dialog.Title>
          <Dialog.Content>
            <Text variant="titleMedium" style={{ textAlign: 'center', marginBottom: 12 }}>{closedMarket?.name}</Text>
            <Text>Open Result Time: {closedMarket?.openTime}</Text>
            <Text>Open Bid Last Time: {closedMarket?.openBidLastTime ?? closedMarket?.openTime}</Text>
            <Text>Close Result Time: {closedMarket?.closeTime}</Text>
            <Text>Close Bid Last Time: {closedMarket?.closeBidLastTime ?? closedMarket?.closeTime}</Text>
          </Dialog.Content>
          <Dialog.Actions><Button mode="contained" onPress={() => setClosedMarket(null)}>OK</Button></Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};
