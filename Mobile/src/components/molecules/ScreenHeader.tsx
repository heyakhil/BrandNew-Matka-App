import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import { BalanceChip } from './BalanceChip';

interface ScreenHeaderProps {
  title: string;
  balanceRupees: number;
  onBackPress: () => void;
  onWalletPress: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  balanceRupees,
  onBackPress,
  onWalletPress,
}) => (
  <View style={styles.container}>
    <IconButton
      icon="chevron-left"
      size={30}
      iconColor={APP_COLORS.textPrimary}
      onPress={onBackPress}
      accessibilityLabel="Go back"
      style={styles.back}
    />
    <Text numberOfLines={1} style={styles.title}>
      {title}
    </Text>
    <BalanceChip balanceRupees={balanceRupees} onPress={onWalletPress} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    paddingRight: 16,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  back: {
    margin: 0,
  },
  title: {
    flex: 1,
    color: '#111827',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
});
