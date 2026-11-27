import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GradientButton } from '../../components/atoms/GradientButton';
import { RadioOption } from '../../components/atoms/RadioOption';
import { PillInput } from '../../components/molecules/PillInput';
import { SupportCard } from '../../components/molecules/SupportCard';
import { WalletInfoCard } from '../../components/molecules/WalletInfoCard';
import { TermsDialog } from '../../components/organisms/TermsDialog';
import {
  MAX_WITHDRAW_RUPEES,
  MIN_WITHDRAW_RUPEES,
} from '../../constants/funds';
import type { BankDetails, UserProfile } from '../../types/matka';
import { styles } from './styles';

export type WithdrawMethod = 'bank' | 'upi';

interface WithdrawFormProps {
  profile: UserProfile;
  balanceRupees: number;
  bankDetails: BankDetails;
  onSubmit: (amount: number, method: WithdrawMethod) => Promise<void> | void;
  onDecline: () => void;
  onSupportPress: () => void;
}

export const WithdrawForm: React.FC<WithdrawFormProps> = ({
  profile,
  balanceRupees,
  bankDetails,
  onSubmit,
  onDecline,
  onSupportPress,
}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<WithdrawMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (amount: number): string | null => {
    if (!Number.isInteger(amount) || amount < MIN_WITHDRAW_RUPEES) {
      return `Minimum withdrawal amount is ₹${MIN_WITHDRAW_RUPEES}.`;
    }
    if (amount > MAX_WITHDRAW_RUPEES) {
      return `Maximum withdrawal amount is ₹${MAX_WITHDRAW_RUPEES}.`;
    }
    if (amount > balanceRupees) {
      return 'Insufficient wallet balance.';
    }
    if (!method) {
      return 'Select Bank or UPI.';
    }
    const hasDetails =
      method === 'bank'
        ? bankDetails.accountNumber.trim() !== ''
        : bankDetails.upiId.trim() !== '';
    return hasDetails ? null : `Add your ${method === 'bank' ? 'bank' : 'UPI'} details first.`;
  };

  const handleSubmit = async (): Promise<void> => {
    if (submitting) return;
    const validationError = validate(Number(amountText));
    if (validationError || !method) {
      setError(validationError ?? 'Select Bank or UPI.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(Number(amountText), method);
      setAmountText('');
      setMethod(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <WalletInfoCard
          name={profile.name}
          phone={profile.phone}
          balanceRupees={balanceRupees}
        />
        <SupportCard onPress={onSupportPress} />
        <Text style={styles.sectionTitle}>Withdraw Fund</Text>
        <PillInput
          value={amountText}
          onChangeText={value => {
            setAmountText(value.replace(/\D/g, ''));
            setError(null);
          }}
          icon="cash-minus"
          maxLength={7}
          error={error}
        />
        <View style={styles.methods}>
          {(['bank', 'upi'] as const).map(option => (
            <RadioOption
              key={option}
              label={option === 'bank' ? 'Bank' : 'UPI'}
              selected={method === option}
              onPress={() => {
                setMethod(option);
                setError(null);
              }}
            />
          ))}
        </View>
        <GradientButton
          label={submitting ? 'SENDING...' : 'SEND REQUEST'}
          onPress={() => {
            handleSubmit().catch(() => {});
          }}
          disabled={submitting}
          height={50}
        />
      </ScrollView>

      <TermsDialog
        visible={!termsAccepted}
        onAccept={() => setTermsAccepted(true)}
        onDismiss={onDecline}
      />
    </View>
  );
};
