import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput } from 'react-native-paper';
import { FormInput } from '../../components/molecules/FormInput';
import { APP_COLORS } from '../../theme/paperTheme';

interface ChangePasswordScreenProps {
  onSuccess: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = (): void => {
    if (password.length < 6) {
      setErrorText('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorText('Passwords do not match.');
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setErrorText(null);
    onSuccess();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Surface style={styles.logoBadge} elevation={2}>
        <Text variant="headlineMedium" style={styles.logoPrimary}>
          RC
        </Text>
      </Surface>
      <Text variant="titleMedium" style={styles.brandSub}>
        RoyalClubMatka Security
      </Text>

      <FormInput
        label="New Password"
        value={password}
        onChangeText={val => {
          setPassword(val);
          setErrorText(null);
        }}
        secureTextEntry={hidePassword}
        right={
          <TextInput.Icon
            icon={hidePassword ? 'eye-off-outline' : 'eye-outline'}
            onPress={() => setHidePassword(prev => !prev)}
          />
        }
        containerStyle={styles.input}
      />

      <FormInput
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={val => {
          setConfirmPassword(val);
          setErrorText(null);
        }}
        secureTextEntry={hidePassword}
        containerStyle={styles.input}
      />

      {errorText && (
        <HelperText type="error" visible={Boolean(errorText)}>
          {errorText}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={handleSubmit}
        buttonColor={APP_COLORS.accent}
        textColor={APP_COLORS.onAccent}
        style={styles.submitBtn}
        labelStyle={styles.submitLabel}>
        Change Password
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.primaryBackground,
  },
  content: {
    padding: 20,
    paddingTop: 28,
  },
  logoBadge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: APP_COLORS.secondary,
    borderWidth: 2,
    borderColor: APP_COLORS.accent,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoPrimary: {
    color: APP_COLORS.accent,
    fontWeight: '900',
  },
  brandSub: {
    color: APP_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    fontWeight: '700',
  },
  input: {
    marginBottom: 14,
  },
  submitBtn: {
    borderRadius: 12,
    marginTop: 12,
    paddingVertical: 4,
  },
  submitLabel: {
    fontWeight: '800',
    fontSize: 15,
  },
});
