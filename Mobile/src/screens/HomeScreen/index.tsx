import React, { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { ContactLinksRow } from '../../components/molecules/ContactLinksRow';
import { MarketCard } from '../../components/molecules/MarketCard';
import { NoticeTicker } from '../../components/molecules/NoticeTicker';
import { PromoHeroBanner } from '../../components/molecules/PromoHeroBanner';
import { InfoModal } from '../../components/organisms/InfoModal';
import { QuickActionGrid } from '../../components/organisms/QuickActionGrid';
import type { MarketItem } from '../../types/matka';
import { formatDisplayTime, sortMarketsByOpenTime } from '../../utils/matkaHelpers';
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
    () => sortMarketsByOpenTime(markets.filter(m => m.category === 'main')),
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
      <InfoModal
        visible={closedMarket !== null}
        onDismiss={() => setClosedMarket(null)}
        title="Sorry!"
        subtitle="Bazar Is closed!"
        message={closedMarket?.name}
        rows={
          closedMarket
            ? [
                {
                  label: 'Open Result Time :',
                  value: formatDisplayTime(closedMarket.openTime),
                },
                {
                  label: 'Open Bid Last Time :',
                  value: formatDisplayTime(
                    closedMarket.openBidLastTime ?? closedMarket.openTime,
                  ),
                },
                {
                  label: 'Close Result Time :',
                  value: formatDisplayTime(closedMarket.closeTime),
                },
                {
                  label: 'Close Bid Last Time :',
                  value: formatDisplayTime(
                    closedMarket.closeBidLastTime ?? closedMarket.closeTime,
                  ),
                },
              ]
            : undefined
        }
      />
    </View>
  );
};
