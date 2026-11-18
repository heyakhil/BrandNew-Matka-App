import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  HelperText,
  Icon,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { APP_COLORS } from '../../theme/paperTheme';
import type { UserProfile } from '../../types/matka';
import { formatRupees } from '../../utils/matkaHelpers';

interface WithdrawFundScreenProps {
  balanceRupees: number;
  profile: UserProfile;
  onSubmitWithdraw: (amount: number) => void;
}

export const WithdrawFundScreen: React.FC<WithdrawFundScreenProps> = ({
  balanceRupees,
  profile,
  onSubmitWithdraw,
}) => {
  const [amountText, setAmountText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleRequest = (): void => {
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount < 500) {
      setErrorText('Minimum withdrawal amount is ₹500.');
      return;
    }
    if (amount > balanceRupees) {
      setErrorText('Insufficient wallet balance.');
      return;
    }
    onSubmitWithdraw(amount);
    setAmountText('');
    setErrorText(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Card style={styles.walletCard} mode="contained">
        <Card.Content>
          <View style={styles.walletTop}>
            <View style={styles.walletTitleRow}>
              <Icon source="wallet" size={24} color={APP_COLORS.accent} />
              <Text variant="titleMedium" style={styles.walletHeading}>
                Wallet Amount
              </Text>
            </View>
            <Text variant="headlineSmall" style={styles.walletAmount}>
              {formatRupees(balanceRupees)}
            </Text>
          </View>

          <Surface style={styles.userBox} elevation={0}>
            <View style={styles.userRow}>
              <Text variant="bodySmall" style={styles.userLabel}>
                User Name:
              </Text>
              <Text variant="bodyMedium" style={styles.userValue}>
                {profile.name}
              </Text>
            </View>
            <View style={styles.userRow}>
              <Text variant="bodySmall" style={styles.userLabel}>
                User Contact No.:
              </Text>
              <Text variant="bodyMedium" style={styles.userValue}>
                {profile.phone}
              </Text>
            </View>
          </Surface>
        </Card.Content>
      </Card>

      <Card style={styles.formCard} mode="contained">
        <Card.Content>
          <Surface style={styles.noticePill} elevation={0}>
            <Icon
              source="information-outline"
              size={18}
              color={APP_COLORS.accent}
            />
            <Text variant="labelLarge" style={styles.noticeText}>
              Minimum withdrawal: ₹500
            </Text>
          </Surface>

          <Text variant="labelLarge" style={styles.inputLabel}>
            Enter Amount
          </Text>
          <TextInput
            mode="outlined"
            placeholder="Enter Amount"
            value={amountText}
            onChangeText={val => {
              setAmountText(val.replace(/\D/g, ''));
              setErrorText(null);
            }}
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            outlineColor={APP_COLORS.border}
            activeOutlineColor={APP_COLORS.accent}
          />

          {errorText && (
            <HelperText type="error" visible={Boolean(errorText)}>
              {errorText}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleRequest}
            buttonColor={APP_COLORS.accent}
            textColor={APP_COLORS.primaryBackground}
            style={styles.submitBtn}
            labelStyle={styles.submitLabel}>
            Withdraw Request
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  walletCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.accent,
    marginBottom: 16,
  },
  walletTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  walletHeading: {
    color: APP_COLORS.textPrimary,
    fontWeight: '800',
  },
  walletAmount: {
    color: APP_COLORS.accent,
    fontWeight: '800',
  },
  userBox: {
    backgroundColor: APP_COLORS.primaryBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: 12,
    gap: 6,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userLabel: {
    color: APP_COLORS.textSecondary,
  },
  userValue: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: APP_COLORS.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
  },
  noticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: APP_COLORS.accentMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  noticeText: {
    color: APP_COLORS.accent,
    fontWeight: '700',
  },
  inputLabel: {
    color: APP_COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_COLORS.primaryBackground,
    marginBottom: 8,
  },
  submitBtn: {
    borderRadius: 12,
    marginTop: 10,
    paddingVertical: 4,
  },
  submitLabel: {
    fontWeight: '800',
    fontSize: 15,
  },
});
