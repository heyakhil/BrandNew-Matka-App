import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Appbar, Surface, Text, TouchableRipple } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import { formatRupees } from '../../utils/matkaHelpers';

interface TopAppBarProps {
  title?: string;
  isBrandHeader?: boolean;
  balanceRupees: number;
  onMenuPress?: () => void;
  onBackPress?: () => void;
  onWalletPress: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  isBrandHeader = false,
  balanceRupees,
  onMenuPress,
  onBackPress,
  onWalletPress,
}) => {
  return (
    <Appbar.Header style={styles.header} statusBarHeight={0}>
      {onBackPress ? (
        <Appbar.BackAction
          onPress={onBackPress}
          color={APP_COLORS.textPrimary}
        />
      ) : (
        <Appbar.Action
          icon="menu"
          onPress={onMenuPress}
          color={APP_COLORS.textPrimary}
          accessibilityLabel="Open navigation menu"
        />
      )}

      {isBrandHeader ? (
        <View style={styles.brandWrapper}>
          <Surface style={styles.brandBadge} elevation={0}>
            <Text variant="titleMedium" style={styles.brandPrimary}>
              Royal
            </Text>
            <Text variant="titleMedium" style={styles.brandAccent}>
              ClubMatka
            </Text>
          </Surface>
        </View>
      ) : (
        <Appbar.Content
          title={title ?? ''}
          titleStyle={styles.title}
        />
      )}

      <TouchableRipple
        onPress={onWalletPress}
        borderless
        style={styles.walletButton}
        accessibilityLabel="Open wallet">
        <View style={styles.walletRow}>
          <View style={styles.balanceTextWrap}>
            <Text variant="labelLarge" style={styles.balanceAmount}>
              {formatRupees(balanceRupees)}
            </Text>
            <Text variant="labelSmall" style={styles.balanceLabel}>
              Wallet
            </Text>
          </View>
          <Surface style={styles.walletIconCircle} elevation={0}>
            <Appbar.Action
              icon="wallet-outline"
              size={20}
              color={APP_COLORS.primaryBackground}
              onPress={onWalletPress}
              style={styles.walletIcon}
            />
          </Surface>
        </View>
      </TouchableRipple>
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: APP_COLORS.secondary,
    borderBottomWidth: 1,
    borderBottomColor: APP_COLORS.border,
    elevation: 0,
    height: 58,
    paddingRight: 8,
  },
  title: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 18,
  },
  brandWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: APP_COLORS.primaryBackground,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  brandPrimary: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  brandAccent: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  walletButton: {
    borderRadius: 24,
    paddingLeft: 8,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceTextWrap: {
    alignItems: 'flex-end',
  },
  balanceAmount: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    lineHeight: 16,
  },
  balanceLabel: {
    color: APP_COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 12,
  },
  walletIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: APP_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIcon: {
    margin: 0,
  },
});
