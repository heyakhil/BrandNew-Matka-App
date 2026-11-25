import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { GradientCircle } from '../atoms/GradientCircle';
import { APP_COLORS } from '../../theme/paperTheme';
import type { TabKey } from '../../types/matka';

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
  bottomInset?: number;
}

interface TabItem {
  key: TabKey;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { key: 'allBids', label: 'My Bids', icon: 'gavel' },
  { key: 'history', label: 'Passbook', icon: 'card-text-outline' },
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'wallet', label: 'Funds', icon: 'bank-outline' },
  { key: 'chat', label: 'Support', icon: 'whatsapp' },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  bottomInset = 0,
}) => (
  <View
    style={[
      styles.bar,
      bottomInset > 0 && {
        paddingBottom: bottomInset,
        height: 64 + bottomInset,
      },
    ]}>
    {TABS.map(tab => {
      const focused = tab.key === activeTab;

      return (
        <Pressable
          key={tab.key}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: focused }}
          onPress={() => onTabPress(tab.key)}
          style={styles.tab}>
          {tab.key === 'home' ? (
            <GradientCircle size={56}>
              <Icon source={tab.icon} size={28} color={APP_COLORS.white} />
            </GradientCircle>
          ) : (
            <>
              <Icon
                source={tab.icon}
                size={27}
                color={focused ? APP_COLORS.gradientStart : '#777777'}
              />
              <Text
                style={[styles.label, focused && styles.labelActive]}
                numberOfLines={1}>
                {tab.label}
              </Text>
            </>
          )}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    backgroundColor: APP_COLORS.secondary,
    elevation: 12,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 14,
  },
  labelActive: {
    color: APP_COLORS.gradientStart,
    fontWeight: '700',
  },
});
