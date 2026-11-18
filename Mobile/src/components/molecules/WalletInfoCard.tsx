import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text } from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import { MastercardMark } from '../atoms/MastercardMark';

interface WalletInfoCardProps {
  name: string;
  phone: string;
  balanceRupees: number;
}

export const WalletInfoCard: React.FC<WalletInfoCardProps> = ({
  name,
  phone,
  balanceRupees,
}) => (
  <View style={styles.card}>
    <View style={styles.spacer} />
    <View style={styles.userBand}>
      <Text style={styles.userText}>{name}</Text>
      <Text style={styles.userText}>{phone}</Text>
    </View>
    <View style={styles.balanceRow}>
      <Icon source="wallet-outline" size={64} color={APP_COLORS.primaryBackground} />
      <View style={styles.balanceText}>
        <Text style={styles.amount}>₹{balanceRupees}</Text>
        <Text style={styles.caption}>Current Balance</Text>
      </View>
      <MastercardMark />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: APP_COLORS.dark,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  spacer: {
    height: 8,
  },
  userBand: {
    backgroundColor: APP_COLORS.dark,
    alignItems: 'center',
    paddingVertical: 10,
  },
  userText: {
    color: APP_COLORS.white,
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '700',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  balanceText: {
    marginLeft: -16,
  },
  amount: {
    color: APP_COLORS.primaryBackground,
    fontSize: 24,
    lineHeight: 28,
  },
  caption: {
    color: APP_COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 19,
  },
});
