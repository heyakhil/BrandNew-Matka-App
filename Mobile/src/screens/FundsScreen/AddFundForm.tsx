import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GradientButton } from '../../components/atoms/GradientButton';
import { AmountChips } from '../../components/molecules/AmountChips';
import { PillInput } from '../../components/molecules/PillInput';
import { WalletInfoCard } from '../../components/molecules/WalletInfoCard';
import { MIN_DEPOSIT_RUPEES, QUICK_ADD_AMOUNTS } from '../../constants/funds';
import type { UserProfile } from '../../types/matka';
import { styles } from './styles';

interface AddFundFormProps {
  profile: UserProfile;
  balanceRupees: number;
  onSubmit: (amount: number) => void;
}

export const AddFundForm: React.FC<AddFundFormProps> = ({
  profile,
  balanceRupees,
  onSubmit,
}) => {
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleChange = (value: string): void => {
    setAmountText(value.replace(/\D/g, ''));
    setError(null);
  };

  const handleSubmit = (): void => {
    const amount = Number(amountText);
    if (!Number.isInteger(amount) || amount < MIN_DEPOSIT_RUPEES) {
      setError(`Minimum amount is ₹${MIN_DEPOSIT_RUPEES}.`);
      return;
    }
    onSubmit(amount);
    setAmountText('');
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
        <Text style={styles.sectionTitle}>Add Fund</Text>
        <PillInput
          value={amountText}
          onChangeText={handleChange}
          maxLength={7}
          error={error}
        />
        <AmountChips
          amounts={QUICK_ADD_AMOUNTS}
          onSelect={amount => handleChange(String(amount))}
        />
      </ScrollView>
      <View style={styles.footer}>
        <GradientButton label="ADD CASH" onPress={handleSubmit} height={50} />
      </View>
    </View>
  );
};
