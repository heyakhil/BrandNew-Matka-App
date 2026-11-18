import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GradientButton } from '../../components/atoms/GradientButton';
import { PillInput } from '../../components/molecules/PillInput';
import type { BankDetails } from '../../types/matka';
import { styles } from './styles';

interface PaymentDetailsFormProps {
  kind: 'bank' | 'upi';
  bankDetails: BankDetails;
  onSave: (details: BankDetails) => void;
}

export const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  kind,
  bankDetails,
  onSave,
}) => {
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber);
  const [accountHolder, setAccountHolder] = useState(bankDetails.accountHolder);
  const [ifscCode, setIfscCode] = useState(bankDetails.ifscCode);
  const [upiId, setUpiId] = useState(bankDetails.upiId);
  const [error, setError] = useState<string | null>(null);

  const handleSave = (): void => {
    if (kind === 'bank') {
      if (!accountHolder.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        setError('Enter account name, account number and IFSC code.');
        return;
      }
      onSave({
        ...bankDetails,
        accountHolder: accountHolder.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      });
      return;
    }
    if (!/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(upiId.trim())) {
      setError('Enter a valid UPI ID (e.g. name@bank).');
      return;
    }
    onSave({ ...bankDetails, upiId: upiId.trim() });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.fields}>
          {kind === 'bank' ? (
            <>
              <PillInput
                value={accountNumber}
                onChangeText={value => {
                  setAccountNumber(value.replace(/\D/g, ''));
                  setError(null);
                }}
                icon="bank"
                placeholder="Enter account number"
              />
              <PillInput
                value={accountHolder}
                onChangeText={value => {
                  setAccountHolder(value);
                  setError(null);
                }}
                icon="account-outline"
                placeholder="Enter account name"
                keyboardType="default"
              />
              <PillInput
                value={ifscCode}
                onChangeText={value => {
                  setIfscCode(value);
                  setError(null);
                }}
                icon="key-outline"
                placeholder="Enter bank IFSC code"
                keyboardType="default"
                autoCapitalize="characters"
              />
            </>
          ) : (
            <PillInput
              value={upiId}
              onChangeText={value => {
                setUpiId(value);
                setError(null);
              }}
              icon="qrcode"
              placeholder="Enter UPI ID"
              keyboardType="default"
            />
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <GradientButton
          label={kind === 'bank' ? 'UPDATE BANK' : 'UPDATE UPI'}
          onPress={handleSave}
          height={60}
        />
      </View>
    </View>
  );
};
