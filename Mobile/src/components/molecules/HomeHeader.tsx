import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import logo from '../../assets/logo/logo.png';
import { APP_COLORS } from '../../theme/paperTheme';
import { BalanceChip } from './BalanceChip';

interface HomeHeaderProps {
  balanceRupees: number;
  onMenuPress: () => void;
  onWalletPress: () => void;
  onRefreshPress: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  balanceRupees,
  onMenuPress,
  onWalletPress,
  onRefreshPress,
}) => (
  <View style={styles.container}>
    <IconButton
      icon="menu"
      size={30}
      iconColor={APP_COLORS.textPrimary}
      onPress={onMenuPress}
      accessibilityLabel="Open navigation menu"
      style={styles.icon}
    />
    <Image source={logo} style={styles.logo} accessibilityIgnoresInvertColors />
    <Text numberOfLines={1} style={styles.brand}>
      ROYAL CLUB
    </Text>
    <BalanceChip balanceRupees={balanceRupees} onPress={onWalletPress} />
    <IconButton
      icon="refresh"
      size={30}
      iconColor={APP_COLORS.textPrimary}
      onPress={onRefreshPress}
      accessibilityLabel="Refresh balance"
      style={styles.icon}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 72,
    paddingHorizontal: 8,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  icon: {
    margin: 0,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
  },
  brand: {
    flex: 1,
    color: APP_COLORS.textPrimary,
    fontSize: 20,
    marginLeft: 12,
  },
});
