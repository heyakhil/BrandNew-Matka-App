import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { GradientButton } from '../../components/atoms/GradientButton';
import { PillInput } from '../../components/molecules/PillInput';
import type { BankDetails } from '../../types/matka';
import { styles } from './styles';

interface PaymentDetailsFormProps {
  kind: 'bank' | 'upi';
  bankDetails: BankDetails;
  onSave: (details: BankDetails) => Promise<void> | void;
}

export const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  kind,
  bankDetails,
  onSave,
}) => {
  const [accountNumber, setAccountNumber] = useState(bankDetails.accountNumber);
  const [accountHolder, setAccountHolder] = useState(bankDetails.accountHolder);
  const [bankName, setBankName] = useState(bankDetails.bankName);
  const [ifscCode, setIfscCode] = useState(bankDetails.ifscCode);
  const [upiId, setUpiId] = useState(bankDetails.upiId);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (saving) return;
    if (kind === 'bank') {
      if (!accountHolder.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        setError('Enter account name, account number and IFSC code.');
        return;
      }
      setSaving(true);
      try {
        await onSave({
          ...bankDetails,
          accountHolder: accountHolder.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to save bank details.');
      } finally {
        setSaving(false);
      }
      return;
    }
    if (!/^[\w.-]{2,}@[A-Za-z]{2,}$/.test(upiId.trim())) {
      setError('Enter a valid UPI ID (e.g. name@bank).');
      return;
    }
    setSaving(true);
    try {
      await onSave({ ...bankDetails, upiId: upiId.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save UPI details.');
    } finally {
      setSaving(false);
    }
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
                value={bankName}
                onChangeText={value => {
                  setBankName(value);
                  setError(null);
                }}
                icon="domain"
                placeholder="Enter bank name"
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
          onPress={() => {
            handleSave().catch(() => {});
          }}
          disabled={saving}
          height={50}
        />
      </View>
    </View>
  );
};
