import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { MenuListItem } from '../../components/molecules/MenuListItem';
import { APP_COLORS } from '../../theme/paperTheme';
import type { MyBidsSubView } from '../../types/matka';

type BidsDestination = Exclude<MyBidsSubView, 'menu'>;

interface MyBidsScreenProps {
  onSelect: (view: BidsDestination) => void;
  onUnavailable: (title: string) => void;
}

interface BidsMenuItem {
  title: string;
  subtitle: string;
  icon: string;
  destination?: BidsDestination;
}

const MENU_ITEMS: BidsMenuItem[] = [
  {
    title: 'Bid History',
    subtitle: 'You can view your market bid history',
    icon: 'calendar-check-outline',
    destination: 'bidHistory',
  },
  {
    title: 'Game Results',
    subtitle: 'You can view your market result history',
    icon: 'history',
    destination: 'gameResults',
  }
];

export const MyBidsScreen: React.FC<MyBidsScreenProps> = ({
  onSelect,
  onUnavailable,
}) => (
  <ScrollView
    style={styles.container}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}>
    {MENU_ITEMS.map(({ destination, ...item }) => (
      <MenuListItem
        key={item.title}
        {...item}
        onPress={() =>
          destination ? onSelect(destination) : onUnavailable(item.title)
        }
      />
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
});
